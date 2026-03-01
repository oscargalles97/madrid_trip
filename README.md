# Madrid Explorer 🇪🇸

Una aplicación web progresiva (SPA) interactiva diseñada como guía personal de viaje estática para una escapada de 3 días a Madrid.

![Madrid Explorer Demo](/favicon.svg)

## Características

- 🗺️ **Itinerario Estático de 3 Días:** Ruta detallada (13, 14 y 15 de marzo) que incluye puntos clave como el Templo de Debod, el Palacio Real, El Rey León y mercados tradicionales.
- 📍 **Mapa Interactivo (Leaflet):** Seguimiento visual de la ruta trazada cada día, con marcadores numerados que se agrupan automáticamente si pasas varias veces por el mismo sitio.
- 💬 **Asistente de Inteligencia Artificial:** Un chatbot integrado potenciado por OpenRouter y el modelo `qwen3.5-flash` que responde dudas de forma inteligente usando el itinerario como contexto (tiempos de traslado, opciones de comida, consejos de transporte).
- ✨ **Diseño Moderno:** Interfaz creada con React, Tailwind CSS y animaciones fluidas de Framer Motion.

## Instalación y Uso Local

1.  **Clona el repositorio**
    ```bash
    git clone https://github.com/oscargalles97/madrid_trip.git
    cd madrid_trip
    ```

2.  **Instala las dependencias**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno**
    Crea un archivo `.env.local` en la raíz del proyecto basado en `.env.example`:
    ```env
    GEMINI_API_KEY="sk-or-v1-tu-clave-de-openrouter-aqui"
    ```
    *Nota: A pesar del nombre de la variable, la app está configurada para usar OpenRouter.*

4.  **Inicia el servidor de desarrollo**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

## Despliegue en Cloudflare Pages

Esta aplicación es totalmente estática y compatible con un despliegue sin servidor.

1.  Conecta este repositorio de GitHub a tu cuenta de Cloudflare Pages.
2.  Configura el entorno de construcción:
    -   **Framework:** Vite (o None)
    -   **Comando de build:** `npm run build`
    -   **Directorio de salida:** `dist`
3.  Añade una variable de entorno en Cloudflare Pages:
    -   Variable: `GEMINI_API_KEY`
    -   Valor: Tu clave real de la API.
4.  Despliega.

## Tecnologías Utilizadas

-   [React](https://react.dev) + [Vite](https://vitejs.dev/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [Leaflet](https://leafletjs.com/) & React-Leaflet
-   [Framer Motion](https://www.framer.com/motion/)
-   [OpenRouter API](https://openrouter.ai/) (Qwen Model)
