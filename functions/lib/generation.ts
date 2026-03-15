import {HumanMessage, SystemMessage} from '@langchain/core/messages';
import {tool} from '@langchain/core/tools';
import {ChatGroq} from '@langchain/groq';
import {END, MessagesAnnotation, START, StateGraph} from '@langchain/langgraph';
import {ToolNode, toolsCondition} from '@langchain/langgraph/prebuilt';
import {z} from 'zod';
import {createId} from '../../shared/seedTrip';
import {applyLodgingToTrip} from '../../shared/tripUtils';
import type {CreateTripInput, Lodging, Stop, Trip, TripDay} from '../../shared/tripTypes';
import {searchDestinationImage, searchPlaces} from './places';

const MODEL_ID = 'openai/gpt-oss-120b';
const MIN_CORE_ACTIVITIES = 6;

const intensityPlan = {
  relax: {coreActivities: 6},
  balanced: {coreActivities: 7},
  active: {coreActivities: 8},
} as const;

const orchestratorSchema = z.object({
  title: z.string(),
  countryOrRegion: z.string(),
  citySummary: z.string(),
  dayStrategies: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      summary: z.string(),
      theme: z.string(),
      focusAreas: z.array(z.string()),
    }),
  ),
});

const plannedDaySchema = z.object({
  title: z.string(),
  summary: z.string(),
  stops: z.array(
    z.object({
      name: z.string(),
      time: z.string(),
      description: z.string(),
      type: z.enum(['food', 'sight', 'event']),
      mealType: z.enum(['lunch', 'dinner']).optional(),
      requiresBooking: z.boolean().default(false),
      bookingLink: z.string().optional(),
    }),
  ),
});

type OrchestratorOutput = z.infer<typeof orchestratorSchema>;
type PlannedDay = z.infer<typeof plannedDaySchema>;

class TripGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TripGenerationError';
  }
}

const createTripInputSchema = z.object({
  destination: z.string().trim().min(1, 'El destino es obligatorio.'),
  countryOrRegion: z.string().trim().min(1, 'El país o región es obligatorio.'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de inicio no es válida.'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de fin no es válida.'),
  travelerCount: z.number().int().min(1).max(20),
  travelersSummary: z.string().trim().min(1),
  interests: z.string(),
  intensity: z.enum(['relax', 'balanced', 'active']),
  additionalContext: z.string().optional(),
  lodgingName: z.string().optional(),
  lodgingAddress: z.string().optional(),
  lodgingLat: z.string().optional(),
  lodgingLng: z.string().optional(),
  lodgingPlaceId: z.string().optional(),
  lodgingImage: z.string().optional(),
  lodgingGoogleMapsUri: z.string().optional(),
  addLodgingLater: z.boolean().optional(),
});

function getGroqApiKey(env: any) {
  return env.GROQ_API_KEY || env.VITE_GROQ_API_KEY;
}

function buildModel(env: any) {
  const apiKey = getGroqApiKey(env);
  if (!apiKey) {
    throw new Error('LLM API key not configured');
  }

  return new ChatGroq({
    apiKey,
    model: MODEL_ID,
    temperature: 0.4,
    maxTokens: 4096,
    reasoningEffort: 'medium',
  });
}

async function searchWeb(query: string, destination: string) {
  const encodedQuery = encodeURIComponent(`${query} ${destination}`.trim());
  const wikiResponse = await fetch(
    `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&format=json&origin=*`,
  );
  const wikiData = wikiResponse.ok ? await wikiResponse.json() : {query: {search: []}};

  return (
    wikiData.query?.search?.slice(0, 5).map((item: any) => ({
      title: item.title,
      snippet: String(item.snippet || '').replace(/<[^>]+>/g, ''),
    })) || []
  );
}

function buildTools(env: any) {
  return [
    tool(
      async ({query, destination}) => JSON.stringify(await searchWeb(query, destination)),
      {
        name: 'search_web',
        description: 'Busca contexto del destino y actividades habituales.',
        schema: z.object({
          query: z.string(),
          destination: z.string(),
        }),
      },
    ),
    tool(
      async ({query, destination}) => JSON.stringify(await searchPlaces(query, destination, env)),
      {
        name: 'search_places',
        description: 'Busca lugares concretos, coordenadas, imagen y Google Maps.',
        schema: z.object({
          query: z.string(),
          destination: z.string(),
        }),
      },
    ),
  ];
}

function normalizeMessageContent(content: unknown) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item) {
          return String((item as {text?: unknown}).text ?? '');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function buildStructuredContext(messages: any[]) {
  return messages
    .map((message) => {
      const type =
        typeof message?._getType === 'function'
          ? message._getType()
          : message?.constructor?.name || 'message';
      const content = normalizeMessageContent(message?.content);

      if (!content.trim()) return '';
      if (type === 'tool') return `TOOL_RESULT:\n${content}`;
      if (type === 'ai') return `MODEL_NOTES:\n${content}`;
      if (type === 'human') return `USER_INPUT:\n${content}`;
      return `CONTEXT:\n${content}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

async function invokeStructuredAgent<T extends z.ZodTypeAny>({
  env,
  systemPrompt,
  userPrompt,
  schema,
}: {
  env: any;
  systemPrompt: string;
  userPrompt: string;
  schema: T;
}): Promise<z.infer<T>> {
  const model = buildModel(env);
  const tools = buildTools(env);
  const toolEnabledModel = model.bindTools(tools);
  const toolNode = new ToolNode(tools);

  const graph = new StateGraph(MessagesAnnotation)
    .addNode('agent', async (state: typeof MessagesAnnotation.State) => {
      const response = await toolEnabledModel.invoke(state.messages);
      return {messages: [response]};
    })
    .addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', toolsCondition, ['tools', END])
    .addEdge('tools', 'agent')
    .compile();

  const graphResult = await graph.invoke({
    messages: [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)],
  });

  const structuredModel = model.withStructuredOutput(schema, {
    name: 'structured_output',
  });

  const structuredContext = buildStructuredContext(graphResult.messages as any[]);

  try {
    return (await structuredModel.invoke([
      new SystemMessage(`${systemPrompt}\nResponde solo con JSON válido. No llames herramientas en esta fase final.`),
      new HumanMessage(`Usa este contexto ya investigado para producir la respuesta final estructurada:\n\n${structuredContext}`),
    ])) as z.infer<T>;
  } catch {
    try {
      return (await structuredModel.invoke([
        new SystemMessage('Devuelve solo JSON válido siguiendo el esquema solicitado. No uses herramientas.'),
        new HumanMessage(`Solicitud original:\n${userPrompt}\n\nContexto investigado:\n${structuredContext}`),
      ])) as z.infer<T>;
    } catch {
      throw new TripGenerationError('No se pudo estructurar una propuesta válida para este viaje. Prueba con menos intereses o vuelve a intentarlo.');
    }
  }
}

function buildDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function isValidDateValue(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime());
}

function normalizeStopName(name: string) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function repeatsPreviousDay(stops: PlannedDay['stops'], previousDayNames: string[]) {
  const previous = new Set(previousDayNames);
  return stops
    .filter((stop) => stop.type !== 'food')
    .some((stop) => previous.has(normalizeStopName(stop.name)));
}

function validateAndNormalizePlannedStops(stops: PlannedDay['stops'], intensity: CreateTripInput['intensity']) {
  const coreTarget = intensityPlan[intensity].coreActivities;
  const filteredStops = stops
    .filter((stop) => stop && stop.name)
    .map((stop) => ({
      ...stop,
      requiresBooking: Boolean(stop.requiresBooking),
      bookingLink: stop.bookingLink?.trim() || undefined,
    }));

  const lunch = filteredStops.find((stop) => stop.type === 'food' && stop.mealType === 'lunch');
  const dinner = filteredStops.find((stop) => stop.type === 'food' && stop.mealType === 'dinner');
  const activities = filteredStops.filter((stop) => stop.type !== 'food');

  if (!lunch || !dinner) {
    throw new Error('Generated day is missing lunch or dinner');
  }

  if (activities.length < MIN_CORE_ACTIVITIES || activities.length < coreTarget) {
    throw new Error('Generated day has too few activities');
  }

  const selectedActivityNames = new Set(
    activities.slice(0, coreTarget).map((activity) => `${activity.time}-${activity.name}`),
  );

  return filteredStops.filter((stop) => {
    if (stop.type === 'food' && (stop.mealType === 'lunch' || stop.mealType === 'dinner')) {
      return true;
    }

    return selectedActivityNames.has(`${stop.time}-${stop.name}`);
  });
}

function buildLodgingFromInput(input: CreateTripInput): Lodging | undefined {
  if (input.addLodgingLater || !input.lodgingName || !input.lodgingLat || !input.lodgingLng) {
    return undefined;
  }

  const lat = Number(input.lodgingLat);
  const lng = Number(input.lodgingLng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return undefined;
  }

  return {
    name: input.lodgingName,
    address: input.lodgingAddress || '',
    coords: [lat, lng],
    image: input.lodgingImage || undefined,
    placeId: input.lodgingPlaceId || undefined,
    googleMapsUri: input.lodgingGoogleMapsUri || undefined,
  };
}

async function orchestratorAgent(input: CreateTripInput, env: any): Promise<OrchestratorOutput> {
  const dates = buildDates(input.startDate, input.endDate);
  return invokeStructuredAgent({
    env,
    schema: orchestratorSchema,
    systemPrompt: `Eres el agente orquestador de un planificador de viajes.
Tu trabajo es definir la estructura global del viaje y una estrategia distinta para cada día.
No propongas hoteles ni transportes. No propongas actividades concretas repetidas entre días consecutivos.`,
    userPrompt: `Destino: ${input.destination}, ${input.countryOrRegion}.
Fechas: ${input.startDate} a ${input.endDate}.
Número de viajeros: ${input.travelerCount}.
Viajeros: ${input.travelersSummary}.
Intereses: ${input.interests}.
Intensidad: ${input.intensity}.
Contexto adicional: ${input.additionalContext?.trim() || 'ninguno'}.
Necesito exactamente ${dates.length} estrategias, una por cada fecha: ${dates.join(', ')}.`,
  });
}

async function plannerAgent({
  input,
  strategy,
  previousDayNames,
  env,
}: {
  input: CreateTripInput;
  strategy: OrchestratorOutput['dayStrategies'][number];
  previousDayNames: string[];
  env: any;
}) {
  const coreTarget = intensityPlan[input.intensity].coreActivities;
  return invokeStructuredAgent({
    env,
    schema: plannedDaySchema,
    systemPrompt: `Eres el agente activity-planner.
Debes construir un día completo solo con actividades visitables.
Reglas:
- No propongas hoteles ni transportes.
- Debe haber exactamente ${coreTarget} actividades principales no gastronómicas.
- Debe haber exactamente una comida y una cena, ambas de tipo food.
- No repitas actividades del día anterior.
- Si una actividad suele requerir entrada, marca requiresBooking=true y añade bookingLink solo si conoces una URL razonable.`,
    userPrompt: `Destino: ${input.destination}, ${input.countryOrRegion}.
Fecha: ${strategy.date}.
Tema del día: ${strategy.theme}.
Resumen del día: ${strategy.summary}.
Zonas sugeridas: ${strategy.focusAreas.join(', ')}.
Actividades del día anterior que debes evitar: ${previousDayNames.join(', ') || 'ninguna'}.
Número de viajeros: ${input.travelerCount}.
Intereses del viaje: ${input.interests}.
Contexto adicional: ${input.additionalContext?.trim() || 'ninguno'}.`,
  });
}

async function enricherAgent({
  input,
  plannedDay,
  fallbackCoords,
  env,
}: {
  input: CreateTripInput;
  plannedDay: PlannedDay;
  fallbackCoords: [number, number];
  env: any;
}) {
  const stops: Stop[] = [];

  for (const plannedStop of plannedDay.stops) {
    const candidates = await searchPlaces(plannedStop.name, input.destination, env).catch(() => []);
    const place = candidates[0];

    stops.push({
      id: createId(),
      name: plannedStop.name,
      time: plannedStop.time || '',
      description: plannedStop.description || place?.description || '',
      coords:
        place?.lat != null && place?.lng != null
          ? [Number(place.lat), Number(place.lng)]
          : fallbackCoords,
      type: plannedStop.type,
      completed: false,
      requiresBooking: Boolean(plannedStop.requiresBooking),
      isLodging: false,
      mealType: plannedStop.mealType,
      image: place?.image || undefined,
      bookingLink: plannedStop.requiresBooking ? plannedStop.bookingLink?.trim() || undefined : undefined,
      source: place ? 'places' : 'generated',
    });
  }

  return stops;
}

function validateTrip(trip: Trip) {
  if (!trip.destination || !trip.startDate || !trip.endDate || trip.days.length === 0) {
    throw new Error('Generated trip is incomplete');
  }

  for (const day of trip.days) {
    const nonLodgingStops = day.stops.filter((stop) => !stop.isLodging);
    const lunch = nonLodgingStops.find((stop) => stop.type === 'food' && stop.mealType === 'lunch');
    const dinner = nonLodgingStops.find((stop) => stop.type === 'food' && stop.mealType === 'dinner');
    const coreActivities = nonLodgingStops.filter((stop) => stop.type !== 'food');

    if (!day.date || !day.title || nonLodgingStops.length < 8) {
      throw new Error('Generated trip has invalid days');
    }

    if (!lunch || !dinner) {
      throw new Error('Generated trip is missing lunch or dinner');
    }

    if (coreActivities.length < MIN_CORE_ACTIVITIES) {
      throw new Error('Generated trip has too few activities');
    }

    for (const stop of nonLodgingStops) {
      if (!stop.name || Number.isNaN(stop.coords[0]) || Number.isNaN(stop.coords[1])) {
        throw new Error('Generated trip has invalid stops');
      }
      if (stop.type === 'hotel' || stop.type === 'transport') {
        throw new Error('Generated trip contains forbidden stops');
      }
    }
  }
}

function buildTrip(input: CreateTripInput, orchestrated: OrchestratorOutput, days: TripDay[]): Trip {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: orchestrated.title || `${input.destination} ${input.startDate}`,
    destination: input.destination,
    countryOrRegion: input.countryOrRegion,
    startDate: input.startDate,
    endDate: input.endDate,
    travelersSummary: input.travelersSummary,
    interests: input.interests.split(',').map((item) => item.trim()).filter(Boolean),
    intensity: input.intensity,
    lodging: buildLodgingFromInput(input),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    days,
  };
}

export async function generateTrip(input: CreateTripInput, env: any): Promise<Trip> {
  const parsedInput = createTripInputSchema.safeParse(input);
  if (!parsedInput.success) {
    const message = parsedInput.error.issues[0]?.message || 'Los datos del viaje no son válidos.';
    throw new TripGenerationError(message);
  }

  const normalizedInput = parsedInput.data;

  if (!isValidDateValue(normalizedInput.startDate) || !isValidDateValue(normalizedInput.endDate)) {
    throw new TripGenerationError('Las fechas del viaje no son válidas.');
  }

  if (normalizedInput.endDate < normalizedInput.startDate) {
    throw new TripGenerationError('La fecha de fin no puede ser anterior a la fecha de inicio.');
  }

  let lastError: unknown = null;

  for (let generationAttempt = 0; generationAttempt < 2; generationAttempt += 1) {
    try {
      const fallbackPlace = (await searchPlaces(
        `${normalizedInput.destination} ${normalizedInput.countryOrRegion}`.trim(),
        normalizedInput.countryOrRegion,
        env,
      ).catch(() => []))[0];

      const fallbackCoords: [number, number] =
        fallbackPlace?.lat != null && fallbackPlace?.lng != null
          ? [Number(fallbackPlace.lat), Number(fallbackPlace.lng)]
          : [40.4168, -3.7038];

      const orchestration = await orchestratorAgent(normalizedInput, env);
      const days: TripDay[] = [];
      let previousDayNames: string[] = [];

      for (const strategy of orchestration.dayStrategies) {
        let plannedDay: PlannedDay | null = null;

        for (let attempt = 0; attempt < 2; attempt += 1) {
          const candidate = await plannerAgent({
            input: normalizedInput,
            strategy,
            previousDayNames,
            env,
          });

          try {
            if (repeatsPreviousDay(candidate.stops, previousDayNames)) {
              throw new Error('Generated day repeats activities from the previous day');
            }
            plannedDay = {
              ...candidate,
              stops: validateAndNormalizePlannedStops(candidate.stops, input.intensity),
            };
            break;
          } catch {
            plannedDay = null;
          }
        }

        if (!plannedDay) {
          throw new TripGenerationError(`No se pudo generar un día válido para ${strategy.date}.`);
        }

        const enrichedStops = await enricherAgent({
          input: normalizedInput,
          plannedDay,
          fallbackCoords,
          env,
        });

        days.push({
          id: createId(),
          date: strategy.date,
          title: plannedDay.title || strategy.title,
          summary: plannedDay.summary || strategy.summary,
          stops: enrichedStops,
        });

        previousDayNames = enrichedStops
          .filter((stop) => !stop.mealType)
          .map((stop) => normalizeStopName(stop.name));
      }

      let trip = buildTrip(normalizedInput, orchestration, days);
      trip = applyLodgingToTrip(trip);

      try {
        trip.heroImageUrl = await searchDestinationImage(normalizedInput.destination, normalizedInput.countryOrRegion, env);
      } catch {
        trip.heroImageUrl = '';
      }

      validateTrip(trip);
      return trip;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new TripGenerationError('No se pudo generar el itinerario. Vuelve a intentarlo.');
}
