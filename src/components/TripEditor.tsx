import {type ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ExternalLink,
  GripVertical,
  Hotel,
  Info,
  Loader2,
  MessageSquare,
  Music,
  Navigation,
  Pencil,
  Plane,
  Plus,
  Save,
  Send,
  Ticket,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
import {AddStopForm} from './AddStopForm';
import {MapPanel} from './MapPanel';
import {RouteModeDialog} from './RouteModeDialog';
import {StopForm} from './StopForm';
import {HeroImageModal} from './HeroImageModal';
import {draftFromStop, emptyStopDraft, stopFromDraft, typeLabel} from '../itineraryData';
import {sendTripChat} from '../lib/api';
import type {Stop, StopDraft, StopType, TravelMode, Trip} from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const iconByType: Record<StopType, ReactNode> = {
  hotel: <Hotel size={16} />,
  food: <Utensils size={16} />,
  sight: <Camera size={16} />,
  event: <Music size={16} />,
  transport: <Plane size={16} />,
};

const typeColor: Record<StopType, string> = {
  hotel: 'bg-sky-600 text-white',
  food: 'bg-orange-500 text-white',
  sight: 'bg-emerald-600 text-white',
  event: 'bg-fuchsia-600 text-white',
  transport: 'bg-slate-600 text-white',
};

const initialMessages = [
  {
    role: 'assistant' as const,
    content: 'Puedo ayudarte con este viaje concreto: horarios, orden del día, ideas y ajustes.',
  },
];

type ChatMessage = {role: 'user' | 'assistant'; content: string};

export function TripEditor({
  trip,
  password,
  isSaving,
  onBack,
  onTripChange,
}: {
  trip: Trip;
  password: string;
  isSaving: boolean;
  onBack: () => void;
  onTripChange: (trip: Trip) => void;
}) {
  const [localTrip, setLocalTrip] = useState(trip);
  const [activeDay, setActiveDay] = useState(0);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [draftStop, setDraftStop] = useState<StopDraft>(emptyStopDraft);
  const [formError, setFormError] = useState('');
  const [pendingRouteStop, setPendingRouteStop] = useState<Stop | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState('Pulsa "Mi ubicación" para situarte en el mapa.');
  const [shouldFollowLocation, setShouldFollowLocation] = useState(false);
  const [draggedStopId, setDraggedStopId] = useState<string | null>(null);
  const [draggedFromDayIndex, setDraggedFromDayIndex] = useState<number | null>(null);
  const [dropTargetStopId, setDropTargetStopId] = useState<string | null>(null);
  const [dropTargetDayIndex, setDropTargetDayIndex] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState('');
  const [isHeroImageModalOpen, setIsHeroImageModalOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTrip(trip);
    setActiveDay(0);
    setMessages(initialMessages);
  }, [trip.id]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        setLocationStatus('Ubicación actual disponible.');
      },
      () => {
        setLocationStatus('No se ha podido leer tu ubicación. Puedes seguir usando el mapa.');
      },
      {enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000},
    );
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages, isTyping]);

  useEffect(() => {
    if (!shouldFollowLocation) return;
    const timeout = window.setTimeout(() => setShouldFollowLocation(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [shouldFollowLocation]);

  const currentDay = localTrip.days[activeDay];

  const groupedStops = useMemo(() => {
    const groups: Record<string, {coords: [number, number]; stops: {stop: Stop; index: number}[]}> = {};
    currentDay?.stops.forEach((stop, index) => {
      const key = `${stop.coords[0]},${stop.coords[1]}`;
      if (!groups[key]) {
        groups[key] = {coords: stop.coords, stops: []};
      }
      groups[key].stops.push({stop, index});
    });
    return Object.values(groups);
  }, [currentDay]);

  const updateTrip = (updater: (current: Trip) => Trip) => {
    setLocalTrip((current) => {
      const next = updater(current);
      const updated = {...next, updatedAt: new Date().toISOString()};
      onTripChange(updated);
      return updated;
    });
  };

  const cancelEditing = () => {
    setEditingStopId(null);
    setDraftStop(emptyStopDraft());
    setFormError('');
  };

  const updateDraftField = (field: keyof StopDraft, value: string) => {
    setDraftStop((prev) => ({...prev, [field]: value}));
  };

  const startAddStop = () => {
    setEditingStopId('new');
    setDraftStop(emptyStopDraft());
    setFormError('');
  };

  const startEditStop = (stop: Stop) => {
    setEditingStopId(stop.id);
    setDraftStop(draftFromStop(stop));
    setFormError('');
  };

  const saveStop = () => {
    const parsed = stopFromDraft(draftStop);
    if (!parsed) {
      setFormError('Selecciona un lugar válido con coordenadas o rellena los datos manualmente.');
      return;
    }

    updateTrip((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) => {
        if (dayIndex !== activeDay) return day;
        return editingStopId === 'new'
          ? {...day, stops: [...day.stops, parsed]}
          : {...day, stops: day.stops.map((stop) => (stop.id === parsed.id ? parsed : stop))};
      }),
    }));

    cancelEditing();
  };

  const deleteStop = (stopId: string) => {
    updateTrip((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) =>
        dayIndex === activeDay ? {...day, stops: day.stops.filter((stop) => stop.id !== stopId)} : day,
      ),
    }));
    if (editingStopId === stopId) cancelEditing();
  };

  const moveStopToIndex = (stopId: string, targetStopId: string) => {
    if (stopId === targetStopId) return;

    updateTrip((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) => {
        if (dayIndex !== activeDay) return day;
        const sourceIndex = day.stops.findIndex((stop) => stop.id === stopId);
        const targetIndex = day.stops.findIndex((stop) => stop.id === targetStopId);
        if (sourceIndex < 0 || targetIndex < 0) return day;
        const nextStops = [...day.stops];
        const [item] = nextStops.splice(sourceIndex, 1);
        nextStops.splice(targetIndex, 0, item);
        return {...day, stops: nextStops};
      }),
    }));
  };

  const moveStopToDay = (stopId: string, fromDayIndex: number, targetDayIndex: number) => {
    if (fromDayIndex === targetDayIndex) return;

    updateTrip((current) => {
      const sourceDay = current.days[fromDayIndex];
      const targetDay = current.days[targetDayIndex];
      if (!sourceDay || !targetDay) return current;

      const stopToMove = sourceDay.stops.find((stop) => stop.id === stopId);
      if (!stopToMove) return current;

      return {
        ...current,
        days: current.days.map((day, index) => {
          if (index === fromDayIndex) {
            return {...day, stops: day.stops.filter((stop) => stop.id !== stopId)};
          }
          if (index === targetDayIndex) {
            return {...day, stops: [...day.stops, stopToMove]};
          }
          return day;
        }),
      };
    });

    if (activeDay === fromDayIndex) {
      setActiveDay(targetDayIndex);
    }
  };

  const openStopInGoogleMaps = (stop: Stop) => {
    const placeQuery = `${stop.name} ${localTrip.destination} ${localTrip.countryOrRegion}`.trim();
    const url =
      stop.bookingLink && stop.bookingLink.includes('google.')
        ? stop.bookingLink
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleStopCompleted = (stopId: string) => {
    updateTrip((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) =>
        dayIndex === activeDay
          ? {
              ...day,
              stops: day.stops.map((stop) =>
                stop.id === stopId ? {...stop, completed: !(stop.completed ?? false)} : stop,
              ),
            }
          : day,
      ),
    }));
  };

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Este navegador no soporta geolocalización.');
      return;
    }

    setLocationStatus('Buscando tu ubicación actual...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        setShouldFollowLocation(true);
        setLocationStatus('Ubicación encontrada y mapa centrado.');
      },
      () => {
        setLocationStatus('Permiso denegado o ubicación no disponible.');
      },
      {enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000},
    );
  };

  const handleTravelMode = (mode: TravelMode) => {
    if (!pendingRouteStop) return;
    const destination = `${pendingRouteStop.coords[0]},${pendingRouteStop.coords[1]}`;
    const origin = currentLocation ? `&origin=${currentLocation[0]},${currentLocation[1]}` : '';
    const url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination}&travelmode=${mode}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setPendingRouteStop(null);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const nextMessages = [...messages, {role: 'user' as const, content: chatInput}];
    setMessages(nextMessages);
    setChatInput('');
    setIsTyping(true);
    setChatError('');

    try {
      const data = await sendTripChat(password, localTrip, nextMessages);
      const content = data.choices?.[0]?.message?.content || 'No he podido responder ahora mismo.';
      setMessages((prev) => [...prev, {role: 'assistant', content}]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Error de conexión');
    } finally {
      setIsTyping(false);
    }
  };

  if (!currentDay) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f1a17]">
      <header className="relative overflow-hidden border-b border-black/10 bg-white">
        {localTrip.heroImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url(${localTrip.heroImageUrl})`}}
          />
        ) : null}
        <div className={cn('mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-10', localTrip.heroImageUrl ? 'relative min-h-[240px] items-end text-white' : '')}>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm', localTrip.heroImageUrl ? 'border border-white/20 bg-white/10 text-white backdrop-blur' : 'border border-black/10 bg-white text-black/70')}>
              <ArrowLeft size={15} />
              Todos los viajes
            </button>
            <div>
              <div className={cn('text-sm', localTrip.heroImageUrl ? 'text-white/70' : 'text-black/45')}>
                {localTrip.destination}, {localTrip.countryOrRegion}
              </div>
              <h1 className="text-3xl font-semibold">{localTrip.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsHeroImageModalOpen(true)} className={cn('inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium', localTrip.heroImageUrl ? 'border border-white/20 bg-white/10 text-white backdrop-blur' : 'border border-black/10 bg-white text-black/70')}>
              <Camera size={16} />
              Editar portada
            </button>
            <div className={cn('text-sm', localTrip.heroImageUrl ? 'text-white/75' : 'text-black/50')}>{isSaving ? 'Guardando cambios…' : 'Guardado'}</div>
            <button onClick={() => setIsChatOpen(true)} className={cn('hidden rounded-lg px-4 py-3 text-sm font-medium md:inline-flex md:items-center md:gap-2', localTrip.heroImageUrl ? 'border border-white/20 bg-white/10 text-white backdrop-blur' : 'border border-black/10 bg-white text-black/70')}>
              <MessageSquare size={16} />
              Asistente
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-10">
        <section className="min-w-0 rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-black/45">Días del viaje</p>
                <h2 className="text-xl font-semibold">{currentDay.title}</h2>
                <p className="mt-1 text-sm text-black/55">{currentDay.summary}</p>
              </div>
              <button onClick={startAddStop} className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white">
                <Plus size={15} />
                Añadir parada
              </button>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {localTrip.days.map((day, index) => (
                <button
                  key={day.id}
                  onDragOver={(event) => {
                    if (!draggedStopId || draggedFromDayIndex == null || index === draggedFromDayIndex) return;
                    event.preventDefault();
                    setDropTargetDayIndex(index);
                  }}
                  onDragLeave={() => {
                    if (dropTargetDayIndex === index) {
                      setDropTargetDayIndex(null);
                    }
                  }}
                  onDrop={(event) => {
                    if (!draggedStopId || draggedFromDayIndex == null || index === draggedFromDayIndex) return;
                    event.preventDefault();
                    moveStopToDay(draggedStopId, draggedFromDayIndex, index);
                    setDraggedStopId(null);
                    setDraggedFromDayIndex(null);
                    setDropTargetStopId(null);
                    setDropTargetDayIndex(null);
                  }}
                  onClick={() => {
                    setActiveDay(index);
                    cancelEditing();
                  }}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    index === activeDay ? 'border-black bg-black text-white' : 'border-black/10 bg-stone-50 text-black/70',
                    draggedStopId && dropTargetDayIndex === index ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : '',
                  )}
                >
                  {new Date(day.date).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})}
                </button>
              ))}
            </div>
            {draggedStopId ? <p className="mt-3 text-xs text-emerald-700">Suelta la parada sobre otro día para moverla allí.</p> : null}
          </div>

          <div className="px-5 py-5">
            {editingStopId === 'new' ? (
              <AddStopForm
                draft={draftStop}
                error={formError}
                placesEnabled
                password={password}
                onChange={updateDraftField}
                onSave={saveStop}
                onCancel={cancelEditing}
              />
            ) : null}

            <div className="mt-5 space-y-4">
              {currentDay.stops.map((stop, index) => {
                const isEditing = editingStopId === stop.id;
                const isDropTarget = dropTargetStopId === stop.id && draggedStopId !== stop.id;
                const isCompleted = stop.completed ?? false;

                return (
                  <article
                    key={stop.id}
                    draggable={!isEditing}
                    onDragStart={() => {
                      setDraggedStopId(stop.id);
                      setDraggedFromDayIndex(activeDay);
                      setDropTargetStopId(stop.id);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggedStopId && draggedStopId !== stop.id) {
                        setDropTargetStopId(stop.id);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggedStopId) {
                        moveStopToIndex(draggedStopId, stop.id);
                      }
                      setDraggedStopId(null);
                      setDraggedFromDayIndex(null);
                      setDropTargetStopId(null);
                      setDropTargetDayIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedStopId(null);
                      setDraggedFromDayIndex(null);
                      setDropTargetStopId(null);
                      setDropTargetDayIndex(null);
                    }}
                    className={cn(
                      'rounded-xl border bg-stone-50 p-4 transition-colors',
                      isDropTarget ? 'border-emerald-600 bg-emerald-50/60' : 'border-black/10',
                      draggedStopId === stop.id ? 'opacity-60' : '',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex min-w-[44px] flex-col items-center gap-2">
                        <div className="cursor-grab rounded-lg border border-black/10 bg-white p-2 text-black/40 active:cursor-grabbing">
                          <GripVertical size={14} />
                        </div>
                        <button
                          onClick={() => toggleStopCompleted(stop.id)}
                          className={cn('flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition-colors', isCompleted ? 'bg-emerald-700 text-white' : 'bg-black text-white')}
                          title={isCompleted ? 'Marcar como pendiente' : 'Marcar como hecha'}
                        >
                          {isCompleted ? <Check size={18} /> : index + 1}
                        </button>
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs', typeColor[stop.type])}>{iconByType[stop.type]}</div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={cn('truncate text-lg font-semibold', isCompleted ? 'text-black/45 line-through' : '')}>{stop.name}</h3>
                              <span className="rounded-md bg-black/5 px-2 py-1 text-xs text-black/55">{stop.time || 'Sin hora'}</span>
                              <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-black/55">{typeLabel[stop.type]}</span>
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                                  <CheckCircle2 size={12} />
                                  Hecha
                                </span>
                              ) : null}
                            </div>
                            <p className={cn('mt-2 text-sm leading-6 text-black/65', isCompleted ? 'text-black/45' : '')}>{stop.description || 'Sin descripción.'}</p>
                            <p className="mt-2 text-xs text-black/40">
                              {stop.coords[0]}, {stop.coords[1]}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => startEditStop(stop)} className="rounded-lg border border-black/10 bg-white p-2 text-black/65">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => deleteStop(stop.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => toggleStopCompleted(stop.id)}
                            className={cn(
                              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                              isCompleted ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-black/10 bg-white text-black/70',
                            )}
                          >
                            <CheckCircle2 size={14} />
                            {isCompleted ? 'Marcada como hecha' : 'Marcar como hecha'}
                          </button>
                          <button onClick={() => setPendingRouteStop(stop)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white">
                            <Navigation size={14} />
                            Cómo llegar
                          </button>
                          <button onClick={() => openStopInGoogleMaps(stop)} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/70">
                            <ExternalLink size={14} />
                            Ver en Maps
                          </button>
                          {stop.bookingLink ? (
                            <a href={stop.bookingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/70">
                              <Ticket size={14} />
                              Enlace
                            </a>
                          ) : null}
                        </div>

                        {isEditing ? (
                          <StopForm draft={draftStop} error={formError} onChange={updateDraftField} onSave={saveStop} onCancel={cancelEditing} />
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="min-h-[480px]">
          <div className="h-full min-h-[480px] rounded-xl">
            {!isMapFullscreen ? (
              <MapPanel
                day={currentDay}
                groupedStops={groupedStops}
                currentLocation={currentLocation}
                shouldFollowLocation={shouldFollowLocation}
                locationStatus={locationStatus}
                isFullscreen={false}
                onLocate={requestCurrentLocation}
                onToggleFullscreen={() => setIsMapFullscreen(true)}
              />
            ) : null}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isMapFullscreen ? (
          <>
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-[70] bg-black/70" />
            <motion.div initial={{opacity: 0, scale: 0.98}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.98}} className="fixed inset-4 z-[75] overflow-hidden rounded-xl bg-white">
              <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                <div>
                  <p className="text-sm text-black/45">{new Date(currentDay.date).toLocaleDateString('es-ES')}</p>
                  <h3 className="text-lg font-semibold">{currentDay.title}</h3>
                </div>
                <button onClick={() => setIsMapFullscreen(false)} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium">
                  Cerrar
                </button>
              </div>
              <div className="h-[calc(100%-69px)]">
                <MapPanel
                  day={currentDay}
                  groupedStops={groupedStops}
                  currentLocation={currentLocation}
                  shouldFollowLocation={shouldFollowLocation}
                  locationStatus={locationStatus}
                  isFullscreen
                  onLocate={requestCurrentLocation}
                  onToggleFullscreen={() => setIsMapFullscreen(false)}
                />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen ? (
          <>
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={() => setIsChatOpen(false)} className="fixed inset-0 z-[1200] bg-black/20 backdrop-blur-sm" />
            <motion.div
              initial={{x: '100%'}}
              animate={{x: 0}}
              exit={{x: '100%'}}
              transition={{type: 'spring', damping: 24, stiffness: 220}}
              className="fixed right-0 top-0 z-[1210] flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-black/10 bg-[#221d19] px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} />
                  <h2 className="text-lg font-semibold">Asistente</h2>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="rounded-lg bg-white/10 p-2">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-stone-50 p-5">
                <div className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/65">
                  <div className="font-medium text-black">{localTrip.title}</div>
                  <div className="mt-1">
                    {localTrip.destination}, {localTrip.countryOrRegion}
                  </div>
                </div>

                {messages.map((message, index) => (
                  <div key={index} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm', message.role === 'user' ? 'bg-black text-white' : 'border border-black/10 bg-white text-black/80 [&_ol]:ml-4 [&_ul]:ml-4')}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isTyping ? <div className="w-fit rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/60">Escribiendo...</div> : null}
                {chatError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{chatError}</div>
                ) : null}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-black/10 bg-white p-5">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Pregunta sobre este viaje"
                    className="w-full rounded-xl border border-black/10 bg-stone-50 px-4 py-3 pr-12 outline-none focus:border-emerald-700"
                  />
                  <button onClick={handleSendMessage} disabled={!chatInput.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-700 p-2 text-white disabled:opacity-35">
                    {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <button onClick={() => setIsChatOpen(true)} className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-medium text-white shadow-lg md:hidden">
        <MessageSquare size={16} />
        Asistente
      </button>

      <RouteModeDialog stop={pendingRouteStop} onClose={() => setPendingRouteStop(null)} onSelect={handleTravelMode} />
      <HeroImageModal
        isOpen={isHeroImageModalOpen}
        initialValue={localTrip.heroImageUrl || ''}
        onClose={() => setIsHeroImageModalOpen(false)}
        onSave={(value) => {
          updateTrip((current) => ({...current, heroImageUrl: value || undefined}));
          setIsHeroImageModalOpen(false);
        }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-div-icon {
              background: transparent;
              border: none;
            }
            .marker-number {
              display: flex;
              align-items: center;
              justify-content: center;
              min-width: 30px;
              height: 30px;
              padding: 0 8px;
              border-radius: 999px;
              background: #059669;
              color: white;
              border: 2px solid white;
              font-size: 13px;
              font-weight: 700;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
            }
            .marker-number-wide {
              min-width: 40px;
            }
            .user-location-dot {
              width: 18px;
              height: 18px;
              border-radius: 999px;
              background: #2563eb;
              border: 3px solid white;
              box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
            }
            .user-location-icon {
              background: transparent;
              border: none;
            }
          `,
        }}
      />
    </div>
  );
}
