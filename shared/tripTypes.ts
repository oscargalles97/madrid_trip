export type StopType = 'hotel' | 'food' | 'sight' | 'event' | 'transport';
export type TravelMode = 'walking' | 'transit' | 'driving';
export type StopSource = 'generated' | 'manual' | 'places';
export type TripIntensity = 'relax' | 'balanced' | 'active';

export interface Stop {
  id: string;
  name: string;
  time: string;
  description: string;
  coords: [number, number];
  type: StopType;
  completed?: boolean;
  image?: string;
  bookingLink?: string;
  source?: StopSource;
}

export interface TripDay {
  id: string;
  date: string;
  title: string;
  summary: string;
  stops: Stop[];
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  countryOrRegion: string;
  heroImageUrl?: string;
  startDate: string;
  endDate: string;
  travelersSummary: string;
  interests: string[];
  status: 'draft' | 'ready';
  createdAt: string;
  updatedAt: string;
  days: TripDay[];
}

export interface TripSummary {
  id: string;
  title: string;
  destination: string;
  countryOrRegion: string;
  heroImageUrl?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'ready';
  createdAt: string;
  updatedAt: string;
  dayCount: number;
}

export interface StopDraft {
  id?: string;
  name: string;
  time: string;
  description: string;
  lat: string;
  lng: string;
  type: StopType;
  completed: boolean;
  image: string;
  bookingLink: string;
  source?: StopSource;
}

export interface CreateTripInput {
  destination: string;
  countryOrRegion: string;
  startDate: string;
  endDate: string;
  travelersSummary: string;
  interests: string;
  intensity: TripIntensity;
}

export interface PlaceSuggestion {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
}
