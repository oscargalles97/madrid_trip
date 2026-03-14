export type PlacesEnv = {
  GOOGLE_MAPS_API_KEY?: string;
  VITE_GOOGLE_MAPS_API_KEY?: string;
  GOOGLE_PLACES_API_KEY?: string;
};

const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1';

function getApiKey(env: PlacesEnv) {
  return env.GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY || env.GOOGLE_PLACES_API_KEY;
}

export function inferStopType(primaryType?: string) {
  if (!primaryType) return 'sight';
  if (primaryType.includes('lodging') || primaryType.includes('hotel')) return 'hotel';
  if (primaryType.includes('restaurant') || primaryType.includes('cafe') || primaryType.includes('bar') || primaryType.includes('food')) return 'food';
  if (primaryType.includes('airport') || primaryType.includes('station') || primaryType.includes('transit')) return 'transport';
  if (primaryType.includes('theater') || primaryType.includes('event_venue') || primaryType.includes('concert')) return 'event';
  return 'sight';
}

export async function autocompletePlace(query: string, env: PlacesEnv) {
  const apiKey = getApiKey(env);
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:autocomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text',
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ['es'],
      languageCode: 'es',
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return (
    data.suggestions
      ?.map((item: any) => item.placePrediction)
      .filter(Boolean)
      .map((prediction: any) => ({
        placeId: prediction.placeId,
        text: prediction.text?.text || '',
        mainText: prediction.structuredFormat?.mainText?.text || prediction.text?.text || '',
        secondaryText: prediction.structuredFormat?.secondaryText?.text || '',
      })) || []
  );
}

export async function getPlaceDetails(placeId: string, env: PlacesEnv) {
  const apiKey = getApiKey(env);
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places/${placeId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'displayName,formattedAddress,location,primaryType,googleMapsUri',
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return {
    name: data.displayName?.text || '',
    description: data.formattedAddress || '',
    lat: data.location?.latitude ?? null,
    lng: data.location?.longitude ?? null,
    type: inferStopType(data.primaryType),
    bookingLink: data.googleMapsUri || '',
  };
}

export async function searchPlaces(query: string, destination: string, env: PlacesEnv) {
  const suggestions = await autocompletePlace(`${query} ${destination}`.trim(), env);
  const results = [];

  for (const suggestion of suggestions.slice(0, 3)) {
    try {
      const details = await getPlaceDetails(suggestion.placeId, env);
      results.push({
        placeId: suggestion.placeId,
        name: details.name,
        description: details.description,
        lat: details.lat,
        lng: details.lng,
        type: details.type,
        bookingLink: details.bookingLink,
      });
    } catch {
      // Ignore individual place failures and keep the rest.
    }
  }

  return results;
}

export async function searchDestinationImage(destination: string, countryOrRegion: string, env: PlacesEnv) {
  const apiKey = getApiKey(env);
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.photos,places.displayName,places.id',
    },
    body: JSON.stringify({
      textQuery: `${destination}, ${countryOrRegion}`.trim(),
      languageCode: 'es',
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  const photoName = data.places?.[0]?.photos?.[0]?.name;
  if (!photoName) {
    return '';
  }

  const photoResponse = await fetch(
    `${GOOGLE_PLACES_BASE_URL}/${photoName}/media?maxWidthPx=1600&skipHttpRedirect=true`,
    {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
      },
    },
  );

  if (!photoResponse.ok) {
    throw new Error(await photoResponse.text());
  }

  const photoData = await photoResponse.json();
  return photoData.photoUri || '';
}
