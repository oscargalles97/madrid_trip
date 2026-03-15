export type StopType = 'hotel' | 'food' | 'sight' | 'event' | 'transport';
export type TravelMode = 'walking' | 'transit' | 'driving';
export type StopSource = 'generated' | 'manual' | 'places';
export type TripIntensity = 'relax' | 'balanced' | 'active';
export type MealType = 'lunch' | 'dinner';

export interface Lodging {
  name: string;
  address: string;
  coords: [number, number];
  image?: string;
  placeId?: string;
  googleMapsUri?: string;
}

export interface Stop {
  id: string;
  name: string;
  time: string;
  description: string;
  coords: [number, number];
  type: StopType;
  completed?: boolean;
  requiresBooking?: boolean;
  isLodging?: boolean;
  mealType?: MealType;
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
  intensity: TripIntensity;
  lodging?: Lodging;
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
  intensity: TripIntensity;
  lodging?: Lodging;
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
  requiresBooking: boolean;
  isLodging: boolean;
  image: string;
  bookingLink: string;
  source?: StopSource;
}

export interface CreateTripInput {
  destination: string;
  countryOrRegion: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  travelersSummary: string;
  interests: string;
  intensity: TripIntensity;
  additionalContext?: string;
  lodgingName?: string;
  lodgingAddress?: string;
  lodgingLat?: string;
  lodgingLng?: string;
  lodgingPlaceId?: string;
  lodgingImage?: string;
  lodgingGoogleMapsUri?: string;
  addLodgingLater?: boolean;
}

export interface PlaceSuggestion {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
}
