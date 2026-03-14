import {assertAuthorized} from '../lib/auth';
import {autocompletePlace, getPlaceDetails} from '../lib/places';

export async function onRequestPost({request, env}: any) {
  try {
    assertAuthorized(request, env);
    const body = await request.json();

    if (body.action === 'autocomplete') {
      const query = String(body.query || '').trim();
      if (query.length < 2) {
        return new Response(JSON.stringify({suggestions: []}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        });
      }

      const suggestions = await autocompletePlace(query, env);
      return new Response(JSON.stringify({suggestions}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      });
    }

    if (body.action === 'details') {
      const place = await getPlaceDetails(String(body.placeId || '').trim(), env);
      return new Response(JSON.stringify({place}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      });
    }

    return new Response(JSON.stringify({error: 'Invalid action'}), {
      status: 400,
      headers: {'Content-Type': 'application/json'},
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return new Response(JSON.stringify({error: String(error instanceof Error ? error.message : error)}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }
}
