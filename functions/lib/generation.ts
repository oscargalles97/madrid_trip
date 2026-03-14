import Groq from 'groq-sdk';
import {createId} from '../../shared/seedTrip';
import type {CreateTripInput, Trip, TripDay, Stop} from '../../shared/tripTypes';
import {searchDestinationImage, searchPlaces} from './places';

const MODEL_ID = 'openai/gpt-oss-120b';

const intensityLabel: Record<CreateTripInput['intensity'], string> = {
  relax: 'relax',
  balanced: 'equilibrado',
  active: 'activo',
};

const tripSchemaDescription = `{
  "title": "string",
  "destination": "string",
  "countryOrRegion": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "travelersSummary": "string",
  "interests": ["string"],
  "status": "draft or ready",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "title": "string",
      "summary": "string",
      "stops": [
        {
          "name": "string",
          "time": "HH:mm or empty string",
          "description": "string",
          "coords": [number, number],
          "type": "hotel | food | sight | event",
          "completed": false,
          "image": "optional string",
          "bookingLink": "optional string",
          "source": "generated | places"
        }
      ]
    }
  ]
}`;

function getGroqApiKey(env: any) {
  return env.GROQ_API_KEY || env.VITE_GROQ_API_KEY;
}

async function callOpenRouter(env: any, body: Record<string, unknown>) {
  const apiKey = getGroqApiKey(env);
  if (!apiKey) {
    throw new Error('LLM API key not configured');
  }

  const groq = new Groq({
    apiKey,
  });

  return groq.chat.completions.create({
    model: MODEL_ID,
    temperature: 1,
    top_p: 1,
    max_completion_tokens: 8192,
    reasoning_effort: 'medium',
    ...(body as any),
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

function normalizeGeneratedTrip(input: CreateTripInput, raw: any): Trip {
  const now = new Date().toISOString();
  const days: TripDay[] = (raw.days || []).map((day: any) => ({
    id: createId(),
    date: day.date,
    title: day.title,
    summary: day.summary || '',
    stops: (day.stops || [])
      .filter((stop: any) => stop?.type !== 'transport')
      .map(
        (stop: any): Stop => ({
          id: createId(),
          name: stop.name,
          time: stop.time || '',
          description: stop.description || '',
          coords: [Number(stop.coords?.[0]), Number(stop.coords?.[1])],
          type: stop.type,
          completed: Boolean(stop.completed),
          image: stop.image || undefined,
          bookingLink: stop.bookingLink || undefined,
          source: stop.source || 'generated',
        }),
      ),
  }));

  return {
    id: createId(),
    title: raw.title || `${input.destination} ${input.startDate}`,
    destination: raw.destination || input.destination,
    countryOrRegion: raw.countryOrRegion || input.countryOrRegion,
    startDate: raw.startDate || input.startDate,
    endDate: raw.endDate || input.endDate,
    travelersSummary: raw.travelersSummary || input.travelersSummary,
    interests: Array.isArray(raw.interests) ? raw.interests : input.interests.split(',').map((item) => item.trim()).filter(Boolean),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    days,
  };
}

function validateTrip(trip: Trip) {
  if (!trip.destination || !trip.startDate || !trip.endDate || trip.days.length === 0) {
    throw new Error('Generated trip is incomplete');
  }

  for (const day of trip.days) {
    if (!day.date || !day.title || day.stops.length === 0) {
      throw new Error('Generated trip has invalid days');
    }

    for (const stop of day.stops) {
      if (!stop.name || Number.isNaN(stop.coords[0]) || Number.isNaN(stop.coords[1])) {
        throw new Error('Generated trip has invalid stops');
      }
    }
  }
}

async function hydrateTripWithPlaces(trip: Trip, destination: string, env: any) {
  for (const day of trip.days) {
    const hydratedStops: Stop[] = [];

    for (const stop of day.stops) {
      if (stop.type === 'transport') {
        continue;
      }

      const hasValidCoords = !Number.isNaN(stop.coords[0]) && !Number.isNaN(stop.coords[1]);
      if (hasValidCoords) {
        hydratedStops.push(stop);
        continue;
      }

      try {
        const candidates = await searchPlaces(stop.name, destination, env);
        const firstCandidate = candidates[0];
        if (firstCandidate && firstCandidate.lat != null && firstCandidate.lng != null) {
          hydratedStops.push({
            ...stop,
            coords: [Number(firstCandidate.lat), Number(firstCandidate.lng)],
            type: (firstCandidate.type as Stop['type']) || stop.type,
            completed: stop.completed ?? false,
            bookingLink: stop.bookingLink || firstCandidate.bookingLink || undefined,
            source: 'places',
          });
        }
      } catch {
        // Ignore and allow validation to decide later.
      }
    }

    day.stops = hydratedStops;
  }
}

function sanitizeAssistantMessage(message: any) {
  return {
    role: 'assistant',
    content: typeof message.content === 'string' ? message.content : '',
    tool_calls: message.tool_calls || undefined,
  };
}

export async function generateTrip(input: CreateTripInput, env: any): Promise<Trip> {
  const systemPrompt = `Eres un planificador experto de viajes. Debes crear un itinerario diario realista y editable.
Usa herramientas cuando necesites validar sitios concretos o contexto local.
No incluyas traslados, aeropuertos, estaciones ni transportes como paradas del itinerario.
Devuelve solo actividades y lugares visitables.
Devuelve solo JSON válido con esta forma: ${tripSchemaDescription}`;

  const messages: any[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: `Crea un viaje para ${input.destination}, ${input.countryOrRegion}.
Fechas: ${input.startDate} a ${input.endDate}.
Viajeros: ${input.travelersSummary}.
Intereses: ${input.interests}.
Intensidad deseada: ${intensityLabel[input.intensity]}. Ajusta la cantidad de actividades por día en función de esa intensidad.`,
    },
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'search_web',
        description: 'Busca contexto de viaje en internet para una ciudad o plan concreto.',
        parameters: {
          type: 'object',
          properties: {
            query: {type: 'string'},
            destination: {type: 'string'},
          },
          required: ['query', 'destination'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_places',
        description: 'Busca lugares concretos y coordenadas usando Places.',
        parameters: {
          type: 'object',
          properties: {
            query: {type: 'string'},
            destination: {type: 'string'},
          },
          required: ['query', 'destination'],
        },
      },
    },
  ];

  for (let step = 0; step < 4; step += 1) {
    const completion = await callOpenRouter(env, {
      model: MODEL_ID,
      messages,
      tools,
      tool_choice: 'auto',
    });

    const assistantMessage = completion.choices?.[0]?.message;
    if (!assistantMessage) {
      throw new Error('Model returned no message');
    }

    if (!assistantMessage.tool_calls?.length) {
      messages.push(sanitizeAssistantMessage(assistantMessage));
      break;
    }

    messages.push(sanitizeAssistantMessage(assistantMessage));

    for (const toolCall of assistantMessage.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments || '{}');
      let result: unknown = {error: 'Unsupported tool'};

      try {
        if (toolCall.function.name === 'search_web') {
          result = await searchWeb(args.query, args.destination);
        } else if (toolCall.function.name === 'search_places') {
          result = await searchPlaces(args.query, args.destination, env);
        }
      } catch (error) {
        result = {
          error: error instanceof Error ? error.message : 'Tool execution failed',
          tool: toolCall.function.name,
        };
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: JSON.stringify(result),
      });
    }
  }

  messages.push({
    role: 'user',
    content: `Devuelve ahora el itinerario final como JSON válido y sin texto adicional. Usa este esquema exacto: ${tripSchemaDescription}`,
  });

  const finalCompletion = await callOpenRouter(env, {
    model: MODEL_ID,
    messages,
    response_format: {
      type: 'json_object',
    },
  });

  const content = finalCompletion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Model returned empty JSON payload');
  }

  const trip = normalizeGeneratedTrip(input, JSON.parse(content));
  await hydrateTripWithPlaces(trip, input.destination, env);
  try {
    trip.heroImageUrl = await searchDestinationImage(input.destination, input.countryOrRegion, env);
  } catch {
    trip.heroImageUrl = '';
  }
  validateTrip(trip);
  return trip;
}
