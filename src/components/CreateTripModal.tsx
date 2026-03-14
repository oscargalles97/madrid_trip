import {AnimatePresence, motion} from 'motion/react';
import {Loader2, Plus, WandSparkles, X} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import type {CreateTripInput, TripIntensity} from '../types';

const initialForm: CreateTripInput = {
  destination: '',
  countryOrRegion: '',
  startDate: '',
  endDate: '',
  travelersSummary: '',
  interests: '',
  intensity: 'balanced',
};

const suggestedInterests = [
  'gastronomía',
  'historia',
  'arte',
  'naturaleza',
  'playa',
  'compras',
  'vida nocturna',
  'planes en familia',
  'relax',
  'aventura',
];

const intensityOptions: {value: TripIntensity; label: string; description: string}[] = [
  {value: 'relax', label: 'Relax', description: 'Pocas actividades y ritmo suave.'},
  {value: 'balanced', label: 'Equilibrado', description: 'Buen ritmo sin cargar demasiado el día.'},
  {value: 'active', label: 'Activo', description: 'Más planes y días más intensos.'},
];

function formatLongDate(value: string) {
  if (!value) return '';
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function CreateTripModal({
  isOpen,
  isGenerating,
  statusMessage,
  onClose,
  onGenerate,
}: {
  isOpen: boolean;
  isGenerating: boolean;
  statusMessage: string;
  onClose: () => void;
  onGenerate: (input: CreateTripInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateTripInput>(initialForm);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [error, setError] = useState('');
  const endDateInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof CreateTripInput, value: string) => {
    setForm((prev) => ({...prev, [field]: value}));
  };

  const startDateLabel = useMemo(() => formatLongDate(form.startDate), [form.startDate]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      interests: selectedInterests.join(', '),
    }));
  }, [selectedInterests]);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setSelectedInterests([]);
      setCustomInterest('');
      setError('');
    }
  }, [isOpen]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  };

  const addCustomInterest = () => {
    const normalized = customInterest.trim();
    if (!normalized) return;
    if (!selectedInterests.includes(normalized)) {
      setSelectedInterests((current) => [...current, normalized]);
    }
    setCustomInterest('');
  };

  const handleStartDateChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      startDate: value,
      endDate: !prev.endDate || prev.endDate < value ? value : prev.endDate,
    }));

    window.setTimeout(() => {
      const input = endDateInputRef.current;
      if (!input) return;
      input.focus();
      input.showPicker?.();
    }, 60);
  };

  const handleSubmit = async () => {
    if (!form.destination.trim() || !form.countryOrRegion.trim() || !form.startDate || !form.endDate) {
      setError('Destino, país/región y fechas son obligatorios.');
      return;
    }

    setError('');
    try {
      await onGenerate({...form, interests: selectedInterests.join(', ')});
      setForm(initialForm);
      setSelectedInterests([]);
      setCustomInterest('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo generar el viaje');
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            onClick={isGenerating ? undefined : onClose}
            className="fixed inset-0 z-[1300] bg-black/45"
          />
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 20}}
            className="fixed inset-x-6 top-10 z-[1310] mx-auto max-w-2xl rounded-xl border border-black/10 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Crear viaje</h2>
                <p className="mt-1 text-sm text-black/55">
                  Define el destino y deja que la app investigue y te proponga un borrador editable.
                </p>
              </div>
              <button onClick={onClose} disabled={isGenerating} className="rounded-lg border border-black/10 bg-white p-2 text-black/55">
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-black/60">Destino</span>
                <input value={form.destination} onChange={(event) => updateField('destination', event.target.value)} className="rounded-lg border border-black/10 px-3 py-3 outline-none focus:border-black" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-black/60">País o región</span>
                <input value={form.countryOrRegion} onChange={(event) => updateField('countryOrRegion', event.target.value)} className="rounded-lg border border-black/10 px-3 py-3 outline-none focus:border-black" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-black/60">Fecha de inicio</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => handleStartDateChange(event.target.value)}
                  className="rounded-lg border border-black/10 px-3 py-3 outline-none focus:border-black"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-black/60">Fecha de fin</span>
                <input
                  ref={endDateInputRef}
                  type="date"
                  min={form.startDate || undefined}
                  value={form.endDate}
                  onChange={(event) => updateField('endDate', event.target.value)}
                  className="rounded-lg border border-black/10 px-3 py-3 outline-none focus:border-black"
                />
                {startDateLabel ? <span className="text-xs text-emerald-700">Inicio seleccionado: {startDateLabel}</span> : null}
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-black/60">Viajeros</span>
                <input value={form.travelersSummary} onChange={(event) => updateField('travelersSummary', event.target.value)} placeholder="2 adultos, viaje tranquilo" className="rounded-lg border border-black/10 px-3 py-3 outline-none focus:border-black" />
              </label>
              <div className="grid gap-3 text-sm">
                <span className="text-black/60">Intensidad</span>
                <div className="grid gap-2">
                  {intensityOptions.map((option) => {
                    const isSelected = form.intensity === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('intensity', option.value)}
                        className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                          isSelected ? 'border-black bg-black text-white' : 'border-black/10 bg-stone-50 text-black/70'
                        }`}
                      >
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className={`mt-1 text-xs ${isSelected ? 'text-white/75' : 'text-black/50'}`}>{option.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                <span className="text-black/60">Intereses principales</span>
                <div className="flex flex-wrap gap-2">
                  {suggestedInterests.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <label
                        key={interest}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                          isSelected ? 'border-black bg-black text-white' : 'border-black/10 bg-stone-50 text-black/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleInterest(interest)}
                          className="h-4 w-4 accent-black"
                        />
                        <span>{interest}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customInterest}
                    onChange={(event) => setCustomInterest(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addCustomInterest();
                      }
                    }}
                    placeholder="Añadir interés personalizado"
                    className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-3 outline-none focus:border-black"
                  />
                  <button type="button" onClick={addCustomInterest} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black">
                    <Plus size={16} /> Añadir
                  </button>
                </div>
                {selectedInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/70"
                      >
                        {interest} ×
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-black/45">Selecciona intereses típicos o añade los tuyos.</p>
                )}
              </div>
            </div>

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
            {isGenerating ? (
              <div className="mt-4 rounded-lg border border-black/10 bg-stone-50 px-4 py-3 text-sm text-black/65">
                {statusMessage}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button onClick={handleSubmit} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50">
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                Generar itinerario
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
