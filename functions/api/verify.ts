export async function onRequestPost({ request, env }: any) {
    try {
        const body = await request.json();
        const { password } = body;

        // Aceptamos cualquier variable que tengas configurada
        const expectedPassword = env.CHAT_PASSWORD || env.VITE_CHAT_PASSWORD || "madrid2024";

        if (password !== expectedPassword) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ success: true }), {
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
