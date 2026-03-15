import {createId} from '../shared/seedTrip';
import type {Stop, StopDraft, StopType, Trip, TripSummary} from './types';

export const SESSION_KEY = 'trip-planner-password';

export const typeLabel: Record<StopType, string> = {
  hotel: 'Hotel',
  food: 'Comida',
  sight: 'Visita',
  event: 'Evento',
  transport: 'Transporte',
};

export const summarizeTrip = (trip: Trip): TripSummary => ({
  id: trip.id,
  title: trip.title,
  destination: trip.destination,
  countryOrRegion: trip.countryOrRegion,
  heroImageUrl: trip.heroImageUrl,
  startDate: trip.startDate,
  endDate: trip.endDate,
  status: trip.status,
  intensity: trip.intensity,
  lodging: trip.lodging,
  createdAt: trip.createdAt,
  updatedAt: trip.updatedAt,
  dayCount: trip.days.length,
});

export const emptyStopDraft = (): StopDraft => ({
  name: '',
  time: '',
  description: '',
  lat: '',
  lng: '',
  type: 'sight',
  completed: false,
  requiresBooking: false,
  isLodging: false,
  image: '',
  bookingLink: '',
  source: 'manual',
});

export const draftFromStop = (stop: Stop): StopDraft => ({
  id: stop.id,
  name: stop.name,
  time: stop.time,
  description: stop.description,
  lat: String(stop.coords[0]),
  lng: String(stop.coords[1]),
  type: stop.type,
  completed: stop.completed ?? false,
  requiresBooking: stop.requiresBooking ?? false,
  isLodging: stop.isLodging ?? false,
  image: stop.image ?? '',
  bookingLink: stop.bookingLink ?? '',
  source: stop.source ?? 'manual',
});

export const stopFromDraft = (draft: StopDraft): Stop | null => {
  const lat = Number.parseFloat(draft.lat);
  const lng = Number.parseFloat(draft.lng);

  if (!draft.name.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return {
    id: draft.id ?? createId(),
    name: draft.name.trim(),
    time: draft.time.trim(),
    description: draft.description.trim(),
    coords: [lat, lng],
    type: draft.type,
    completed: draft.completed,
    requiresBooking: draft.requiresBooking,
    isLodging: draft.isLodging,
    image: draft.image.trim() || undefined,
    bookingLink: draft.bookingLink.trim() || undefined,
    source: draft.source ?? 'manual',
  };
};
