import {assertAuthorized} from '../lib/auth';
import {saveTrip} from '../lib/db';
import {generateTrip} from '../lib/generation';

export async function onRequestPost({request, env}: any) {
  try {
    assertAuthorized(request, env);
    const body = await request.json();
    const trip = await generateTrip(body, env);
    await saveTrip(env, trip);

    return new Response(JSON.stringify({trip}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      }),
      {
        status: 500,
        headers: {'Content-Type': 'application/json'},
      },
    );
  }
}
