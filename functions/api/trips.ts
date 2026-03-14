import {assertAuthorized} from '../lib/auth';
import {listTrips, saveTrip} from '../lib/db';

export async function onRequestGet({request, env}: any) {
  try {
    assertAuthorized(request, env);
    const trips = await listTrips(env);
    return new Response(JSON.stringify({trips}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return new Response(JSON.stringify({error: 'Internal Server Error'}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }
}

export async function onRequestPost({request, env}: any) {
  try {
    assertAuthorized(request, env);
    const body = await request.json();
    await saveTrip(env, body.trip);
    return new Response(JSON.stringify({trip: body.trip}), {
      status: 201,
      headers: {'Content-Type': 'application/json'},
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return new Response(JSON.stringify({error: 'Internal Server Error'}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }
}
