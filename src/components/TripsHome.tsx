import {CalendarRange, MapPinned, Plus, Trash2} from 'lucide-react';
import {motion} from 'motion/react';
import type {TripSummary} from '../types';

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'});
  const end = new Date(endDate).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'});
  return `${start} - ${end}`;
}

export function TripsHome({
  trips,
  isLoading,
  onCreate,
  onOpen,
  onDelete,
}: {
  trips: TripSummary[];
  isLoading: boolean;
  onCreate: () => void;
  onOpen: (tripId: string) => void;
  onDelete: (tripId: string) => void;
}) {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f1a17]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-black/45">Trip Planner</div>
            <h1 className="mt-1 text-3xl font-semibold">Tus viajes</h1>
          </div>
          <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white">
            <Plus size={16} />
            Crear viaje
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {isLoading ? <p className="text-sm text-black/55">Cargando viajes...</p> : null}

        {!isLoading && trips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white p-10 text-center">
            <p className="text-lg font-medium">Todavía no hay viajes guardados</p>
            <p className="mt-2 text-sm text-black/55">Crea el primero y genera un itinerario automáticamente.</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => (
            <motion.article
              key={trip.id}
              whileHover={{y: -4}}
              transition={{duration: 0.18, ease: 'easeOut'}}
              className="group rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-black/20 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
            >
              {trip.heroImageUrl ? (
                <div
                  className="mb-4 h-36 rounded-lg bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.25)), url(${trip.heroImageUrl})`}}
                />
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{trip.title}</h2>
                  <div className="mt-2 inline-flex rounded-md border border-black/10 bg-stone-50 px-2 py-1 text-xs text-black/55">
                    {trip.status === 'ready' ? 'Listo' : 'Borrador'}
                  </div>
                </div>
                <button onClick={() => onDelete(trip.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-black/65">
                <div className="flex items-center gap-2">
                  <MapPinned size={15} />
                  <span>
                    {trip.destination}, {trip.countryOrRegion}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarRange size={15} />
                  <span>
                    {formatDateRange(trip.startDate, trip.endDate)} · {trip.dayCount} días
                  </span>
                </div>
              </div>

              <button
                onClick={() => onOpen(trip.id)}
                className="mt-5 inline-flex rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-black transition-colors duration-200 hover:bg-stone-50"
              >
                Abrir viaje
              </button>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
