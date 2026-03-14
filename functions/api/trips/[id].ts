import {assertAuthorized} from '../../lib/auth';
import {deleteTrip, getTrip, saveTrip} from '../../lib/db';

export async function onRequestGet({request, env, params}: any) {
  try {
    assertAuthorized(request, env);
    const trip = await getTrip(env, params.id);
    if (!trip) {
      return new Response(JSON.stringify({error: 'Trip not found'}), {
        status: 404,
        headers: {'Content-Type': 'application/json'},
      });
    }

    return new Response(JSON.stringify({trip}), {
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

export async function onRequestPut({request, env, params}: any) {
  try {
    assertAuthorized(request, env);
    const body = await request.json();
    const trip = {...body.trip, id: params.id, updatedAt: new Date().toISOString()};
    await saveTrip(env, trip);
    return new Response(JSON.stringify({trip}), {
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

export async function onRequestDelete({request, env, params}: any) {
  try {
    assertAuthorized(request, env);
    await deleteTrip(env, params.id);
    return new Response(JSON.stringify({success: true}), {
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
