import type {Stop, Trip, TripDay} from './tripTypes';

export const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const makeStop = (stop: Omit<Stop, 'id'>): Stop => ({
  completed: false,
  requiresBooking: false,
  isLodging: false,
  ...stop,
  id: createId(),
});

const makeDay = (day: Omit<TripDay, 'id' | 'stops'> & {stops: Omit<Stop, 'id'>[]}): TripDay => ({
  ...day,
  id: createId(),
  stops: day.stops.map(makeStop),
});

export const buildSampleMadridTrip = (): Trip => {
  const now = new Date().toISOString();

  return {
    id: createId(),
    title: 'Madrid de fin de semana',
    destination: 'Madrid',
    countryOrRegion: 'España',
    heroImageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80&w=2000',
    startDate: '2026-03-13',
    endDate: '2026-03-15',
    travelersSummary: '2 adultos',
    interests: ['centro histórico', 'gastronomía', 'miradores', 'musicales'],
    intensity: 'balanced',
    status: 'ready',
    createdAt: now,
    updatedAt: now,
    days: [
      makeDay({
        date: '2026-03-13',
        title: 'Llegada y noche en Gran Vía',
        summary: 'Aterrizaje suave con paseo, cena y musical.',
        stops: [
          {
            name: 'Hotel Agumar',
            time: '17:00',
            description: 'Check-in y primera base del viaje.',
            coords: [40.4074, -3.6888],
            type: 'hotel',
            source: 'generated',
          },
          {
            name: 'Parque del Retiro',
            time: '18:30',
            description: 'Paseo de tarde por el Retiro antes de moverse al centro.',
            coords: [40.4153, -3.6839],
            type: 'sight',
            source: 'generated',
          },
          {
            name: 'Cena en Gran Vía',
            time: '20:00',
            description: 'Cena práctica antes del espectáculo.',
            coords: [40.42, -3.703],
            type: 'food',
            source: 'generated',
          },
          {
            name: 'Teatro Lope de Vega',
            time: '21:00',
            description: 'Sesión de musical en plena Gran Vía.',
            coords: [40.4221, -3.7074],
            type: 'event',
            bookingLink: 'https://www.elreyleon.es/',
            source: 'generated',
          },
        ],
      }),
      makeDay({
        date: '2026-03-14',
        title: 'Madrid histórico y atardecer',
        summary: 'Centro clásico, tapeo y cierre con vistas.',
        stops: [
          {
            name: 'Puerta del Sol',
            time: '10:00',
            description: 'Inicio del recorrido por el corazón de la ciudad.',
            coords: [40.4168, -3.7038],
            type: 'sight',
            source: 'generated',
          },
          {
            name: 'Plaza Mayor',
            time: '11:00',
            description: 'Paso por el Madrid de los Austrias.',
            coords: [40.4154, -3.7074],
            type: 'sight',
            source: 'generated',
          },
          {
            name: 'Mercado de San Miguel',
            time: '13:30',
            description: 'Parada para tapas y productos locales.',
            coords: [40.4154, -3.7089],
            type: 'food',
            source: 'generated',
          },
          {
            name: 'Palacio Real',
            time: '16:00',
            description: 'Recorrido exterior y entorno monumental.',
            coords: [40.418, -3.7143],
            type: 'sight',
            source: 'generated',
          },
          {
            name: 'Templo de Debod',
            time: '18:30',
            description: 'Atardecer con una de las vistas más limpias de Madrid.',
            coords: [40.424, -3.7177],
            type: 'sight',
            source: 'generated',
          },
        ],
      }),
      makeDay({
        date: '2026-03-15',
        title: 'Mercado y despedida',
        summary: 'Últimas horas de viaje con plan ligero antes de volver.',
        stops: [
          {
            name: 'El Rastro',
            time: '10:30',
            description: 'Paseo por el mercado más popular de Madrid.',
            coords: [40.4097, -3.7075],
            type: 'sight',
            source: 'generated',
          },
          {
            name: 'Madrid Río',
            time: '13:00',
            description: 'Caminata tranquila para cerrar el viaje.',
            coords: [40.4125, -3.721],
            type: 'sight',
            source: 'generated',
          },
          {
            name: 'Aeropuerto Adolfo Suárez Madrid-Barajas',
            time: '18:30',
            description: 'Traslado al aeropuerto.',
            coords: [40.4719, -3.564],
            type: 'transport',
            source: 'generated',
          },
        ],
      }),
    ],
  };
};
