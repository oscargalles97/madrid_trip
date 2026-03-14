export function getExpectedPassword(env: any) {
  return env.CHAT_PASSWORD || env.VITE_CHAT_PASSWORD || 'madrid2024';
}

export function getRequestPassword(request: Request) {
  return request.headers.get('x-app-password') || '';
}

export function assertAuthorized(request: Request, env: any) {
  const password = getRequestPassword(request);
  const expectedPassword = getExpectedPassword(env);

  if (!password || password !== expectedPassword) {
    throw new Response(JSON.stringify({error: 'Unauthorized'}), {
      status: 401,
      headers: {'Content-Type': 'application/json'},
    });
  }

  return password;
}
