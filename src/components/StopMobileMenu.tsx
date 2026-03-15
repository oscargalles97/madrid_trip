import {CheckCircle2, ChevronDown, ChevronUp, MoreVertical, Pencil, Trash2} from 'lucide-react';
import {useState} from 'react';
import type {TripDay} from '../types';

export function StopMobileMenu({
  stopName,
  isCompleted,
  currentDayIndex,
  days,
  onToggleCompleted,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveToDay,
}: {
  stopName: string;
  isCompleted: boolean;
  currentDayIndex: number;
  days: TripDay[];
  onToggleCompleted: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToDay: (targetDayIndex: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <button onClick={() => setIsOpen((current) => !current)} className="rounded-lg border border-black/10 bg-white p-2 text-black/65">
        <MoreVertical size={16} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-20 w-64 rounded-xl border border-black/10 bg-white p-2 shadow-lg">
          <div className="border-b border-black/10 px-2 py-2 text-xs text-black/45">{stopName}</div>
          <div className="grid gap-1 p-2">
            <button onClick={() => { onToggleCompleted(); setIsOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-black/75 hover:bg-stone-50">
              <CheckCircle2 size={14} />
              {isCompleted ? 'Marcar como pendiente' : 'Marcar como hecha'}
            </button>
            <button onClick={() => { onEdit(); setIsOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-black/75 hover:bg-stone-50">
              <Pencil size={14} />
              Editar
            </button>
            <button onClick={() => { onMoveUp(); setIsOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-black/75 hover:bg-stone-50">
              <ChevronUp size={14} />
              Subir
            </button>
            <button onClick={() => { onMoveDown(); setIsOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-black/75 hover:bg-stone-50">
              <ChevronDown size={14} />
              Bajar
            </button>
            <div className="px-3 pt-2 text-xs text-black/45">Mover a otro día</div>
            {days.map((day, index) =>
              index !== currentDayIndex ? (
                <button
                  key={day.id}
                  onClick={() => { onMoveToDay(index); setIsOpen(false); }}
                  className="rounded-lg px-3 py-2 text-left text-sm text-black/75 hover:bg-stone-50"
                >
                  {new Date(day.date).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})}
                </button>
              ) : null,
            )}
            <button onClick={() => { onDelete(); setIsOpen(false); }} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50">
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
