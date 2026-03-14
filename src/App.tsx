import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Hotel,
  Plane,
  Music,
  Info,
  ExternalLink,
  Loader2,
  Send,
  MessageSquare,
  X,
  ChevronRight,
  Clock,
  Utensils,
  ShoppingBag,
  Camera,
  Ticket,
  Map,
  CloudSun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue using CDN
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const createNumberedIcon = (number: string | number) => {
  const label = String(number);
  const isMultiple = label.length > 2;
  return L.divIcon({
    html: `<div class="marker-number" style="display: flex; align-items: center; justify-content: center; background-color: #10b981; color: white; font-weight: bold; border-radius: 9999px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); width: 100%; height: 100%; font-size: ${isMultiple ? '11px' : '14px'}; padding: ${isMultiple ? '0 4px' : '0'};">${label}</div>`,
    className: 'custom-div-icon',
    iconSize: isMultiple ? [40, 30] : [30, 30],
    iconAnchor: isMultiple ? [20, 15] : [15, 15],
  });
};

const createSpotIcon = () => {
  return L.divIcon({
    html: `<div style="display: flex; align-items: center; justify-content: center; background-color: #f43f5e; color: white; border-radius: 9999px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); width: 100%; height: 100%; font-size: 12px;">📍</div>`,
    className: 'tourist-spot-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



interface Stop {
  name: string;
  time: string;
  description: string;
  coords: [number, number];
  type: 'hotel' | 'food' | 'sight' | 'event' | 'transport';
  image?: string;
  bookingLink?: string;
}

interface DayPlan {
  date: string;
  title: string;
  stops: Stop[];
}

const ITINERARY: DayPlan[] = [
  {
    date: "13 Mar",
    title: "Llegada y Magia en Gran Vía",
    stops: [
      {
        name: "Hotel Agumar (Check-in)",
        time: "17:00",
        description: "Llegada desde Galapagar y acomodación en tu base de operaciones.",
        coords: [40.4074, -3.6888],
        type: 'hotel'
      },
      {
        name: "Paseo por el Retiro",
        time: "18:30",
        description: "Un paseo relajante por el pulmón de Madrid, visitando el Palacio de Cristal.",
        coords: [40.4153, -3.6839],
        type: 'sight',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Palacio_de_Cristal.jpg/330px-Palacio_de_Cristal.jpg"
      },
      {
        name: "Cena en Gran Vía",
        time: "20:00",
        description: "Cena rápida y energética antes del gran show.",
        coords: [40.4200, -3.7030],
        type: 'food',
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/MADRID_100206_UDCI_019.jpg/330px-MADRID_100206_UDCI_019.jpg"
      },
      {
        name: "Musical El Rey León",
        time: "21:00",
        description: "El espectáculo más icónico de la Gran Vía en el Teatro Lope de Vega.",
        coords: [40.4221, -3.7074],
        type: 'event',
        bookingLink: "https://www.elreyleon.es/"
      }
    ]
  },
  {
    date: "14 Mar",
    title: "El Madrid de los Austrias",
    stops: [
      {
        name: "Hotel Agumar (Inicio)",
        time: "09:00",
        description: "Comienzo del día desde el hotel.",
        coords: [40.4074, -3.6888],
        type: 'hotel'
      },
      {
        name: "Real Fábrica - Cervantes (Paseo)",
        time: "10:00",
        description: "Una de las tiendas más bonitas de Madrid con productos artesanos.",
        coords: [40.4140, -3.6966],
        type: 'sight'
      },
      {
        name: "Puerta del Sol y Plaza Mayor",
        time: "11:00",
        description: "El corazón de Madrid. No olvides ver el Oso y el Madroño.",
        coords: [40.4167, -3.7033],
        type: 'sight'
      },
      {
        name: "Mercado de San Miguel (Comida)",
        time: "14:00",
        description: "Degustación de tapas en un mercado histórico de hierro.",
        coords: [40.4155, -3.7090],
        type: 'food'
      },
      {
        name: "Palacio Real (Exterior)",
        time: "16:00",
        description: "Vistas impresionantes del palacio y la Catedral de la Almudena.",
        coords: [40.4173, -3.7143],
        type: 'sight'
      },
      {
        name: "Chocolatería San Ginés (Merienda)",
        time: "17:00",
        description: "El lugar más icónico para disfrutar de un auténtico chocolate con churros.",
        coords: [40.4168, -3.7069],
        type: 'food'
      },
      {
        name: "Templo de Debod",
        time: "18:00",
        description: "Un templo egipcio auténtico con las mejores vistas del atardecer.",
        coords: [40.4240, -3.7177],
        type: 'sight'
      },
      {
        name: "Cena en Barrio de las Letras",
        time: "20:30",
        description: "Cena en la zona donde vivieron Cervantes y Lope de Vega.",
        coords: [40.4140, -3.6990],
        type: 'food'
      }
    ]
  },
  {
    date: "15 Mar",
    title: "Tradición y Despedida",
    stops: [
      {
        name: "Hotel Agumar (Inicio)",
        time: "09:00",
        description: "Comienzo del día desde el hotel.",
        coords: [40.4074, -3.6888],
        type: 'hotel'
      },
      {
        name: "El Rastro",
        time: "10:30",
        description: "El mercadillo más famoso de España (solo domingos). Ambiente único.",
        coords: [40.4097, -3.7075],
        type: 'sight'
      },
      {
        name: "Mercado de San Ildefonso (Comida)",
        time: "14:00",
        description: "Street food market vertical en Malasaña, ideal para probar de todo.",
        coords: [40.4242, -3.7008],
        type: 'food'
      },
      {
        name: "Paseo por Madrid Río",
        time: "16:00",
        description: "Caminata junto al río Manzanares para ver el Puente de Segovia.",
        coords: [40.4125, -3.7210],
        type: 'sight'
      },
      {
        name: "Recogida de Maletas",
        time: "18:00",
        description: "Vuelta al Hotel Agumar para recoger el equipaje.",
        coords: [40.4074, -3.6888],
        type: 'hotel'
      },
      {
        name: "Salida al Aeropuerto",
        time: "18:30",
        description: "Trayecto hacia Barajas para el vuelo de las 20:00h.",
        coords: [40.4719, -3.5640],
        type: 'transport'
      }
    ]
  }
];

const TOURIST_SPOTS = [
  { name: "Museo del Prado", coords: [40.4138, -3.6921] as [number, number], description: "Una de las pinacotecas más importantes del mundo.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Museo_del_Prado_2016_%2825185969599%29.jpg/330px-Museo_del_Prado_2016_%2825185969599%29.jpg", bookingLink: "https://www.museodelprado.es/en/tickets/" },
  { name: "Museo Reina Sofía", coords: [40.4080, -3.6943] as [number, number], description: "Arte del siglo XX y contemporáneo, hogar del Guernica.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Museo_Nacional_Centro_de_Arte_Reina_Sof%C3%ADa_logo.svg/langes-330px-Museo_Nacional_Centro_de_Arte_Reina_Sof%C3%ADa_logo.svg.png", bookingLink: "https://entradas.museoreinasofia.es/" },
  { name: "Parque del Retiro", coords: [40.4153, -3.6845] as [number, number], description: "El pulmón verde de Madrid, con su lago y el Palacio de Cristal.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Palacio_de_Cristal.jpg/330px-Palacio_de_Cristal.jpg" },
  { name: "Palacio Real de Madrid", coords: [40.4180, -3.7143] as [number, number], description: "Residencia oficial de la Familia Real española.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Palacio_Real_de_Madrid_Julio_2016_%28cropped%29.jpg/330px-Palacio_Real_de_Madrid_Julio_2016_%28cropped%29.jpg", bookingLink: "https://tickets.patrimonionacional.es/es" },
  { name: "Puerta de Alcalá", coords: [40.4200, -3.6888] as [number, number], description: "Una de las antiguas puertas monumentales de acceso a Madrid.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Puerta_de_Alcal%C3%A1_%28Madrid%29_05.jpg/330px-Puerta_de_Alcal%C3%A1_%28Madrid%29_05.jpg" },
  { name: "Gran Vía", coords: [40.4200, -3.7022] as [number, number], description: "La calle más famosa y animada de Madrid.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/MADRID_100206_UDCI_019.jpg/330px-MADRID_100206_UDCI_019.jpg" },
  { name: "Cibeles", coords: [40.4193, -3.6931] as [number, number], description: "Fuente monumental, símbolo de la ciudad y lugar de celebración.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Fuente_de_Cibeles_-_Dec_2024.jpg/330px-Fuente_de_Cibeles_-_Dec_2024.jpg" },
  { name: "Plaza Mayor", coords: [40.4154, -3.7074] as [number, number], description: "Gran plaza porticada en el corazón del Madrid de los Austrias.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Plaza_Mayor_de_Madrid_06.jpg/330px-Plaza_Mayor_de_Madrid_06.jpg" },
  { name: "Puerta del Sol", coords: [40.4168, -3.7038] as [number, number], description: "Kilómetro Cero de España y centro neurálgico la capital.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/MADRID_100206_UDCI_023.jpg/330px-MADRID_100206_UDCI_023.jpg" },
  { name: "Mercado de San Miguel", coords: [40.4154, -3.7089] as [number, number], description: "Mercado histórico convertido en templo gastronómico.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Mercado_de_San_Miguel_2025.jpg/330px-Mercado_de_San_Miguel_2025.jpg" },
  { name: "Catedral de la Almudena", coords: [40.4156, -3.7146] as [number, number], description: "La iglesia principal de la diócesis de Madrid.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Almudena_2022_-_overview.jpg/330px-Almudena_2022_-_overview.jpg" },
  { name: "Plaza de España", coords: [40.4234, -3.7122] as [number, number], description: "Gran plaza presidida por el monumento a Cervantes.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Plaza_de_Espa%C3%B1a_de_Madrid_-_02.jpg/330px-Plaza_de_Espa%C3%B1a_de_Madrid_-_02.jpg" },
  { name: "Templo de Debod", coords: [40.4240, -3.7177] as [number, number], description: "Templo egipcio original salvado de Asuán, ideal al atardecer.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Templo_de_Debod_in_Madrid.jpg/330px-Templo_de_Debod_in_Madrid.jpg" },
  { name: "Azotea del Círculo de Bellas Artes", coords: [40.4186, -3.6963] as [number, number], description: "Una de las mejores vistas panorámicas de Madrid.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/C%C3%ADrculo_de_Bellas_Artes_%28Madrid%29_06.jpg/330px-C%C3%ADrculo_de_Bellas_Artes_%28Madrid%29_06.jpg" },
  { name: "El Rastro (Latina)", coords: [40.4097, -3.7075] as [number, number], description: "El mercadillo más castizo y famoso, abierto los domingos.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Rastro_de_Madrid_%28Espa%C3%B1a%29_1.jpg/330px-Rastro_de_Madrid_%28Espa%C3%B1a%29_1.jpg" },
  { name: "Matadero Madrid", coords: [40.3923, -3.6976] as [number, number], description: "Antiguo matadero reconvertido en un inmenso centro cultural.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Casa_Terneras-Matadero-Legazpi.JPG/330px-Casa_Terneras-Matadero-Legazpi.JPG" }
];

// Component to fly to new bounds when day changes
function MapController({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

      // Fix for grey tiles when container resizes due to varying list heights
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });

      const container = map.getContainer();
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [coords, map]);
  return null;
}

const WeatherWidget = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/20 flex gap-4 mt-6 text-black/90 w-fit"
  >
    <div className="flex flex-col items-center justify-center pr-4 border-r border-black/10">
      <CloudSun size={24} className="text-amber-500 mb-1" />
      <span className="text-[10px] font-bold uppercase tracking-wider">Pronóstico</span>
    </div>
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase text-black/50 font-bold mb-1">Jue 13</span>
        <CloudSun size={18} className="text-amber-500 mb-1" />
        <span className="text-sm font-semibold">18°<span className="text-black/40 text-xs font-normal">/8°</span></span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase text-black/50 font-bold mb-1">Vie 14</span>
        <CloudSun size={18} className="text-amber-500 mb-1" />
        <span className="text-sm font-semibold">19°<span className="text-black/40 text-xs font-normal">/9°</span></span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase text-black/50 font-bold mb-1">Sáb 15</span>
        <CloudSun size={18} className="text-amber-500 mb-1" />
        <span className="text-sm font-semibold">21°<span className="text-black/40 text-xs font-normal">/10°</span></span>
      </div>
    </div>
  </motion.div>
);

export default function App() {
  const [activeDay, setActiveDay] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "¡Hola! Soy tu asistente de viaje. Puedes preguntarme cualquier cosa sobre tu itinerario estático por Madrid. ¿En qué puedo ayudarte?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleVerifyPassword = async () => {
    if (!passwordInput.trim()) return;
    setIsVerifying(true);
    setAuthError("");

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput })
      });

      if (response.status === 401) {
        setAuthError("Contraseña incorrecta");
      } else if (response.ok) {
        setIsAuthorized(true);
      } else {
        setAuthError("Error en el servidor");
      }
    } catch (error) {
      setAuthError("Error de conexión");
    } finally {
      setIsVerifying(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    const currentMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(currentMessages);
    setChatInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: passwordInput,
          messages: currentMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (response.status === 401) {
        setIsAuthorized(false);
        setPasswordInput("");
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: "⚠️ Contraseña incorrecta. Se ha cerrado la sesión." }]);
        setIsTyping(false);
        return;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu pregunta.";
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Hubo un error al conectar con el asistente." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const currentDay = ITINERARY[activeDay];
  const polylineCoords = currentDay.stops.map(s => s.coords);

  const groupedStops = React.useMemo(() => {
    const groups: Record<string, { coords: [number, number]; stops: { stop: Stop; index: number }[] }> = {};
    currentDay.stops.forEach((stop, idx) => {
      const key = `${stop.coords[0]},${stop.coords[1]}`;
      if (!groups[key]) {
        groups[key] = { coords: stop.coords, stops: [] };
      }
      groups[key].stops.push({ stop, index: idx });
    });
    return Object.values(groups);
  }, [currentDay]);

  const handleNewConversation = () => {
    setMessages([
      { role: 'assistant', content: "¡Hola! Soy tu asistente de viaje. Puedes preguntarme cualquier cosa sobre tu itinerario estático por Madrid. ¿En qué puedo ayudarte?" }
    ]);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* Hero Section (Restored) */}
      <header className="relative h-[45vh] overflow-hidden flex items-end pb-12 px-6 md:px-12 shrink-0">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80&w=2000"
            alt="Madrid Gran Via"
            className="w-full h-full object-cover brightness-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCFB] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl w-full flex justify-between items-end">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-4"
            >
              <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                Primer Viaje
              </span>
              <span className="text-white/80 text-xs font-medium tracking-wide uppercase">
                Madrid • 3 Días
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-serif font-light tracking-tight text-white mb-2"
            >
              Madrid <span className="italic">Explorer</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/90 text-lg max-w-xl font-light leading-relaxed"
            >
              Tu guía personalizada para descubrir la magia de la capital española, desde el Retiro hasta la Gran Vía.
            </motion.p>
            <WeatherWidget />
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setIsChatOpen(true)}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-emerald-50 transition-all shadow-xl mb-2"
          >
            <MessageSquare size={18} className="text-emerald-600" />
            Preguntar a IA
          </motion.button>
        </div>

        {/* Mobile Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="md:hidden absolute top-6 right-6 z-20 p-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full shadow-lg"
        >
          <MessageSquare size={20} />
        </button>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left: Itinerary List */}
        <div className="lg:col-span-5 border-r border-black/5 overflow-y-auto bg-white/50 backdrop-blur-sm p-6 lg:p-8">
          <div className="flex gap-2 mb-8">
            {ITINERARY.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDay(idx)}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-sm font-medium transition-all duration-300 border",
                  activeDay === idx
                    ? "bg-black text-white border-black shadow-xl shadow-black/10 scale-[1.02]"
                    : "bg-white text-black/60 border-black/5 hover:border-black/20"
                )}
              >
                {day.date}
              </button>
            ))}
          </div>

          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-serif italic mb-2">{currentDay.title}</h2>
              <p className="text-black/40 text-sm">Itinerario detallado para el día {currentDay.date}</p>
            </div>

            <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-black/5">
              {currentDay.stops.map((stop, idx) => (
                <div key={idx} className="relative pl-12 group">
                  <div className={cn(
                    "absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-[#FDFCFB] flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                    stop.type === 'hotel' ? "bg-blue-500 text-white" :
                      stop.type === 'food' ? "bg-orange-500 text-white" :
                        stop.type === 'event' ? "bg-purple-500 text-white" :
                          stop.type === 'transport' ? "bg-slate-500 text-white" :
                            "bg-emerald-500 text-white"
                  )}>
                    {stop.type === 'hotel' && <Hotel size={16} />}
                    {stop.type === 'food' && <Utensils size={16} />}
                    {stop.type === 'event' && <Music size={16} />}
                    {stop.type === 'transport' && <Plane size={16} />}
                    {stop.type === 'sight' && <Camera size={16} />}
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif text-lg leading-tight">{stop.name}</h3>
                      <span className="text-xs font-mono bg-black/5 px-2 py-1 rounded-lg text-black/60">{stop.time}</span>
                    </div>
                    <p className="text-sm text-black/60 leading-relaxed">{stop.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {idx > 0 && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${currentDay.stops[idx - 1].coords[0]},${currentDay.stops[idx - 1].coords[1]}&destination=${stop.coords[0]},${stop.coords[1]}&travelmode=transit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-black/10 text-black/70 text-xs font-medium rounded-xl transition-colors"
                        >
                          <Navigation size={12} />
                          Ver ruta desde anterior
                        </a>
                      )}
                      {stop.bookingLink && (
                        <a
                          href={stop.bookingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium rounded-xl transition-colors shadow-sm shadow-rose-500/20"
                        >
                          <Ticket size={12} />
                          Comprar Entradas
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Interactive Map */}
        <div className="lg:col-span-7 relative h-[50vh] lg:h-auto lg:p-8 lg:pl-4">
          <div className="w-full h-full relative rounded-t-3xl lg:rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-black/10 bg-white">
            <MapContainer
              center={currentDay.stops[0].coords}
              zoom={13}
              className="w-full h-full z-0"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController coords={polylineCoords} />

              {/* Tourist Spots (Background) */}
              {TOURIST_SPOTS.map((spot, idx) => (
                <Marker
                  key={`spot-${idx}`}
                  position={spot.coords}
                  icon={createSpotIcon()}
                  zIndexOffset={-10}
                >
                  <Popup>
                    <div className="w-48 flex flex-col gap-2">
                      <img src={spot.image} alt={spot.name} className="w-full h-24 object-cover object-center rounded-md" />
                      <div>
                        <p className="font-bold text-sm text-rose-600 leading-tight mb-1">{spot.name}</p>
                        <p className="text-xs text-gray-600 leading-snug mb-2">{spot.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Punto Turístico</p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${spot.coords[0]},${spot.coords[1]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black/5 text-black p-1 rounded-md hover:bg-black/10 transition-colors"
                            title="Ver en Google Maps"
                          >
                            <MapPin size={12} />
                          </a>
                        </div>
                        {spot.bookingLink && (
                          <a
                            href={spot.bookingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center justify-center w-full gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] uppercase tracking-wider font-bold rounded-xl transition-colors shadow-sm"
                          >
                            <Ticket size={12} />
                            Comprar Entradas
                          </a>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Itinerary Route (Foreground) */}
              {groupedStops.map((group, idx) => {
                const label = group.stops.map(s => s.index + 1).join(', ');
                return (
                  <Marker
                    key={idx}
                    position={group.coords}
                    icon={createNumberedIcon(label)}
                  >
                    <Popup>
                      <div className="w-48 max-h-64 overflow-y-auto pr-1">
                        {group.stops.map((s, i) => (
                          <div key={i} className={cn("flex flex-col gap-2", i > 0 ? "mt-3 pt-3 border-t border-gray-200" : "")}>
                            {s.stop.image && (
                              <img src={s.stop.image} alt={s.stop.name} className="w-full h-24 object-cover object-center rounded-md" />
                            )}
                            <div>
                              <p className="font-bold text-sm leading-tight mb-1">{s.index + 1}. {s.stop.name}</p>
                              <p className="text-xs text-emerald-600 font-bold mb-1">{s.stop.time}</p>
                              <p className="text-xs text-gray-600 leading-snug">{s.stop.description}</p>
                              {s.stop.bookingLink && (
                                <a
                                  href={s.stop.bookingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center justify-center w-full gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] uppercase tracking-wider font-bold rounded-xl transition-colors shadow-sm"
                                >
                                  <Ticket size={12} />
                                  Entradas
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              <Polyline
                positions={polylineCoords}
                pathOptions={{ color: '#10b981', weight: 4, opacity: 0.6, dashArray: '10, 10' }}
              />
            </MapContainer>
          </div>
        </div>
      </main>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-black/5 flex justify-between items-center bg-emerald-600 text-white">
                <div className="flex items-center gap-3">
                  <MessageSquare size={20} />
                  <h2 className="font-serif text-xl">Asistente de Viaje</h2>
                </div>
                <div className="flex justify-end gap-2">
                  {isAuthorized && (
                    <button
                      onClick={handleNewConversation}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-sm font-semibold gap-1"
                      title="Nueva conversación"
                    >
                      Nuevo
                    </button>
                  )}
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {!isAuthorized ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FDFCFB]">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Info size={32} />
                  </div>
                  <h3 className="font-serif text-2xl mb-2">Acceso Privado</h3>
                  <p className="text-black/60 text-sm mb-8 leading-relaxed">
                    El uso de la Inteligencia Artificial conlleva costes de API. Por favor, introduce la contraseña para habilitar el asistente automático.
                  </p>
                  <div className="w-full relative">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && passwordInput.trim() && !isVerifying) {
                          handleVerifyPassword();
                        }
                      }}
                      placeholder="Contraseña de acceso..."
                      className={cn(
                        "w-full pl-4 pr-12 py-3 bg-white border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all shadow-sm",
                        authError ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" : "border-black/10 focus:ring-emerald-500/50 focus:border-emerald-500"
                      )}
                    />
                    <button
                      onClick={handleVerifyPassword}
                      disabled={!passwordInput || isVerifying}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all font-semibold flex items-center justify-center min-w-[70px]"
                    >
                      {isVerifying ? <Loader2 size={16} className="animate-spin" /> : "Entrar"}
                    </button>
                  </div>
                  {authError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-2 text-left w-full pl-2 font-medium flex items-center gap-1"
                    >
                      ⚠️ {authError}
                    </motion.p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FDFCFB]">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn(
                        "flex flex-col max-w-[85%]",
                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                      )}>
                        <div className={cn(
                          "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                          msg.role === 'user'
                            ? "bg-black text-white rounded-tr-none [&_p]:mb-0"
                            : "bg-white border border-black/5 text-black/80 rounded-tl-none [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_ul:last-child]:mb-0 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-3 [&_ol:last-child]:mb-0 [&_li]:mb-1"
                        )}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-2 p-4 bg-white border border-black/5 rounded-2xl rounded-tl-none w-fit shadow-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-6 border-t border-black/5 bg-white">
                    <div className="relative">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Pregunta sobre tu viaje..."
                        className="w-full pl-4 pr-12 py-3 bg-black/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                    <p className="text-[10px] text-center mt-4 text-black/30 uppercase tracking-widest font-bold">Potenciado por Gemini AI (OpenRouter)</p>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="bg-white border-t border-black/5 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-black/40">
        <p>© 2026 Madrid Explorer • Planificación Estática Personalizada</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><MapPin size={12} /> Galapagar → Madrid</span>
          <span className="flex items-center gap-1"><Music size={12} /> Rey León: 13 Mar 21h</span>
          <span className="flex items-center gap-1"><Plane size={12} /> Vuelo: 15 Mar 20h</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
        .marker-number {
          background-color: #10b981;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          transition: transform 0.2s ease-in-out;
        }
        .marker-number:hover {
          transform: scale(1.1);
          background-color: #059669;
        }
        .custom-div-icon {
          background: transparent;
          border: none;
        }
      `}} />
    </div>
  );
}
