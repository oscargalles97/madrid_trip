import type {CreateTripInput, Trip, TripSummary} from '../types';

async function readJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request<T>(path: string, password: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-app-password': password,
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error('No se pudo conectar con la API local.');
  }

  const data = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error((data as {error?: string} | null)?.error || 'Request failed');
  }

  return data as T;
}

export async function verifyPassword(password: string) {
  let response: Response;

  try {
    response = await fetch('/api/verify', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({password}),
    });
  } catch {
    throw new Error('La API local no está disponible.');
  }

  const data = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error((data as {error?: string} | null)?.error || 'Contraseña incorrecta');
  }

  return data;
}

export async function fetchTrips(password: string) {
  return request<{trips: TripSummary[]}>('/api/trips', password);
}

export async function fetchTrip(password: string, tripId: string) {
  return request<{trip: Trip}>(`/api/trips/${tripId}`, password);
}

export async function saveTrip(password: string, trip: Trip) {
  return request<{trip: Trip}>(`/api/trips/${trip.id}`, password, {
    method: 'PUT',
    body: JSON.stringify({trip}),
  });
}

export async function deleteTrip(password: string, tripId: string) {
  return request<{success: boolean}>(`/api/trips/${tripId}`, password, {
    method: 'DELETE',
  });
}

export async function generateTrip(password: string, input: CreateTripInput) {
  return request<{trip: Trip}>('/api/generate-trip', password, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function sendTripChat(password: string, trip: Trip, messages: {role: 'user' | 'assistant'; content: string}[]) {
  return request<any>('/api/chat', password, {
    method: 'POST',
    body: JSON.stringify({trip, messages}),
  });
}
