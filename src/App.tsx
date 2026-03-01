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
  Camera
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



interface Stop {
  name: string;
  time: string;
  description: string;
  coords: [number, number];
  type: 'hotel' | 'food' | 'sight' | 'event' | 'transport';
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
        type: 'sight'
      },
      {
        name: "Cena en Gran Vía",
        time: "20:00",
        description: "Cena rápida y energética antes del gran show.",
        coords: [40.4200, -3.7030],
        type: 'food'
      },
      {
        name: "Musical El Rey León",
        time: "21:00",
        description: "El espectáculo más icónico de la Gran Vía en el Teatro Lope de Vega.",
        coords: [40.4221, -3.7074],
        type: 'event'
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

// Component to fly to new bounds when day changes
function MapController({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [coords, map]);
  return null;
}

const OPENROUTER_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL_ID = "qwen/qwen3.5-flash-02-23";

export default function App() {
  const [activeDay, setActiveDay] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "¡Hola! Soy tu asistente de viaje. Puedes preguntarme cualquier cosa sobre tu itinerario estático por Madrid. ¿En qué puedo ayudarte?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const systemInstruction = `Eres un asistente experto en el viaje del usuario a Madrid. 
      El itinerario es ESTÁTICO y es el siguiente: ${JSON.stringify(ITINERARY)}.
      El usuario se aloja en el Hotel Agumar.
      Llega el 13 de marzo a las 17h desde Galapagar.
      Tiene el musical El Rey León el 13 a las 21h.
      Se va el 15 a las 20h en avión.
      NO quiere ir a museos.
      Responde preguntas basadas en este itinerario o da consejos adicionales sobre Madrid (transporte, clima, comida) que complementen este plan.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Madrid Explorer"
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            { role: "system", content: systemInstruction },
            ...currentMessages.map(m => ({
              role: m.role,
              content: m.content
            }))
          ]
        })
      });

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

              {groupedStops.map((group, idx) => {
                const label = group.stops.map(s => s.index + 1).join(', ');
                return (
                  <Marker
                    key={idx}
                    position={group.coords}
                    icon={createNumberedIcon(label)}
                  >
                    <Popup>
                      <div className="p-1">
                        {group.stops.map((s, i) => (
                          <div key={i} className={i > 0 ? "mt-2 pt-2 border-t border-gray-200" : ""}>
                            <p className="font-bold text-sm mb-1">{s.index + 1}. {s.stop.name}</p>
                            <p className="text-xs text-gray-600">{s.stop.time}</p>
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

            {/* Map Overlay Info */}
            <div className="absolute bottom-6 left-6 right-6 z-[1000] pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-black/5 shadow-2xl max-w-sm pointer-events-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <MapPin size={16} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/40">Ruta del Día</p>
                </div>
                <p className="text-sm text-black/70 italic">Visualizando {currentDay.stops.length} paradas estratégicas en Madrid.</p>
              </div>
            </div>
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
                  <button
                    onClick={handleNewConversation}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-sm font-semibold gap-1"
                    title="Nueva conversación"
                  >
                    Nuevo
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

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
                <p className="text-[10px] text-center mt-4 text-black/30 uppercase tracking-widest font-bold">Potenciado por Gemini AI</p>
              </div>
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
