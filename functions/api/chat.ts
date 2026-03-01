export async function onRequestPost({ request, env }: any) {
    try {
        const body = await request.json();
        const { messages, password } = body;

        // Aceptamos cualquier variable que tengas configurada
        const expectedPassword = env.CHAT_PASSWORD || env.VITE_CHAT_PASSWORD || "madrid2024";
        if (password !== expectedPassword) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        const OPENROUTER_API_KEY = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return new Response(JSON.stringify({ error: "API key not configured" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const MODEL_ID = "qwen/qwen3.5-flash-02-23";
        const systemInstruction = `Eres un asistente experto, conciso y muy amigable sobre el viaje del usuario a Madrid.
      Tus RESPUESTAS DEBEN SER BREVES y directas, sin enrollarte.
      Debes responder siempre en el idioma en el que te hablen (Castellano o Catalán).
      
      Aquí tienes EL ITINERARIO COMPLETO Y EXACTO que va a realizar el usuario, día a día y con horarios: 
      [{"date":"13 Mar","title":"Llegada y Magia en Gran Vía","stops":[{"name":"Hotel Agumar (Check-in)","time":"17:00","description":"Llegada desde Galapagar y acomodación en tu base de operaciones.","coords":[40.4074,-3.6888],"type":"hotel"},{"name":"Paseo por el Retiro","time":"18:30","description":"Un paseo relajante por el pulmón de Madrid, visitando el Palacio de Cristal.","coords":[40.4153,-3.6839],"type":"sight"},{"name":"Cena en Gran Vía","time":"20:00","description":"Cena rápida y energética antes del gran show.","coords":[40.4200,-3.7030],"type":"food"},{"name":"Musical El Rey León","time":"21:00","description":"El espectáculo más icónico de la Gran Vía en el Teatro Lope de Vega.","coords":[40.4221,-3.7074],"type":"event"}]},{"date":"14 Mar","title":"El Madrid de los Austrias","stops":[{"name":"Hotel Agumar (Inicio)","time":"09:00","description":"Comienzo del día desde el hotel.","coords":[40.4074,-3.6888],"type":"hotel"},{"name":"Real Fábrica - Cervantes (Paseo)","time":"10:00","description":"Una de las tiendas más bonitas de Madrid con productos artesanos.","coords":[40.4140,-3.6966],"type":"sight"},{"name":"Puerta del Sol y Plaza Mayor","time":"11:00","description":"El corazón de Madrid. No olvides ver el Oso y el Madroño.","coords":[40.4167,-3.7033],"type":"sight"},{"name":"Mercado de San Miguel (Comida)","time":"14:00","description":"Degustación de tapas en un mercado histórico de hierro.","coords":[40.4155,-3.7090],"type":"food"},{"name":"Palacio Real (Exterior)","time":"16:00","description":"Vistas impresionantes del palacio y la Catedral de la Almudena.","coords":[40.4173,-3.7143],"type":"sight"},{"name":"Chocolatería San Ginés (Merienda)","time":"17:00","description":"El lugar más icónico para disfrutar de un auténtico chocolate con churros.","coords":[40.4168,-3.7069],"type":"food"},{"name":"Templo de Debod","time":"18:00","description":"Un templo egipcio auténtico con las mejores vistas del atardecer.","coords":[40.4240,-3.7177],"type":"sight"},{"name":"Cena en Barrio de las Letras","time":"20:30","description":"Cena en la zona donde vivieron Cervantes y Lope de Vega.","coords":[40.4140,-3.6990],"type":"food"}]},{"date":"15 Mar","title":"Tradición y Despedida","stops":[{"name":"Hotel Agumar (Inicio)","time":"09:00","description":"Comienzo del día desde el hotel.","coords":[40.4074,-3.6888],"type":"hotel"},{"name":"El Rastro","time":"10:30","description":"El mercadillo más famoso de España (solo domingos). Ambiente único.","coords":[40.4097,-3.7075],"type":"sight"},{"name":"Mercado de San Ildefonso (Comida)","time":"14:00","description":"Street food market vertical en Malasaña, ideal para probar de todo.","coords":[40.4242,-3.7008],"type":"food"},{"name":"Paseo por Madrid Río","time":"16:00","description":"Caminata junto al río Manzanares para ver el Puente de Segovia.","coords":[40.4125,-3.7210],"type":"sight"},{"name":"Recogida de Maletas","time":"18:00","description":"Vuelta al Hotel Agumar para recoger el equipaje.","coords":[40.4074,-3.6888],"type":"hotel"},{"name":"Salida al Aeropuerto","time":"18:30","description":"Trayecto hacia Barajas para el vuelo de las 20:00h.","coords":[40.4719,-3.5640],"type":"transport"}]}]
      
      Contexto adicional importante:
      - El usuario se aloja todo el viaje en el Hotel Agumar.
      - Llega el 13 de marzo a las 17h desde Galapagar.
      - Tiene el musical El Rey León el 13 a las 21h.
      - Se va el 15 a las 20h en avión.
      - NO quiere ir a museos bajo ningún concepto.
      
      Limítate a responder dudas sobre este plan o dar consejos puntuales de comida/transporte que encajen perfectamente en estos huecos de tiempo.`;

        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": request.headers.get("origin") || "https://tu-dominio.com",
                "X-Title": "Madrid Explorer API"
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: [
                    { role: "system", content: systemInstruction },
                    ...messages
                ]
            })
        });

        const data = await openRouterResponse.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
