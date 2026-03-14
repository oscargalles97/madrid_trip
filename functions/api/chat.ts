import Groq from 'groq-sdk';
import {assertAuthorized} from '../lib/auth';

const MODEL_ID = 'openai/gpt-oss-120b';

export async function onRequestPost({request, env}: any) {
  try {
    assertAuthorized(request, env);
    const body = await request.json();
    const {messages, trip} = body;
    const apiKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({error: 'API key not configured'}), {
        status: 500,
        headers: {'Content-Type': 'application/json'},
      });
    }

    const systemInstruction = `Eres un asistente experto y breve para organizar un viaje.
Responde siempre en el idioma del usuario.
Usa únicamente el viaje activo como fuente principal.
Si faltan datos, dilo claramente y no inventes reservas o horarios exactos.

Viaje activo:
${JSON.stringify(trip)}`;

    const groq = new Groq({apiKey});
    const data = await groq.chat.completions.create({
      model: MODEL_ID,
      temperature: 1,
      top_p: 1,
      max_completion_tokens: 8192,
      reasoning_effort: 'medium',
      messages: [{role: 'system', content: systemInstruction}, ...messages],
    });

    return new Response(JSON.stringify(data), {
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
