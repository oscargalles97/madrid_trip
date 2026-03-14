import {Save, X} from 'lucide-react';
import type {StopDraft} from '../types';
import {typeLabel} from '../itineraryData';

export function StopForm({
  draft,
  error,
  onChange,
  onSave,
  onCancel,
}: {
  draft: StopDraft;
  error: string;
  onChange: (field: keyof StopDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-black/10 bg-stone-50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Nombre</span>
          <input value={draft.name} onChange={(e) => onChange('name', e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Hora</span>
          <input value={draft.time} onChange={(e) => onChange('time', e.target.value)} placeholder="18:30" className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Latitud</span>
          <input value={draft.lat} onChange={(e) => onChange('lat', e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-black/60">Longitud</span>
          <input value={draft.lng} onChange={(e) => onChange('lng', e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700" />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-black/60">Tipo</span>
          <select value={draft.type} onChange={(e) => onChange('type', e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700">
            {Object.entries(typeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-black/60">Descripción</span>
          <textarea value={draft.description} onChange={(e) => onChange('description', e.target.value)} rows={3} className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700" />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-black/60">Imagen (URL)</span>
          <input value={draft.image} onChange={(e) => onChange('image', e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700" />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-black/60">Link externo</span>
          <input value={draft.bookingLink} onChange={(e) => onChange('bookingLink', e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700" />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={onSave} className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white">
          <Save size={14} />
          Guardar parada
        </button>
        <button onClick={onCancel} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/70">
          <X size={14} />
          Cancelar
        </button>
      </div>
    </div>
  );
}
