import {AnimatePresence, motion} from 'motion/react';
import {Loader2, MapPin, Minus, Plus, Search, WandSparkles, X} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import type {CreateTripInput, PlaceSuggestion, TripIntensity} from '../types';

const initialForm: CreateTripInput = {
  destination: '',
  countryOrRegion: '',
  startDate: '',
  endDate: '',
  travelerCount: 2,
  travelersSummary: '2 viajeros',
  interests: '',
  intensity: 'balanced',
  additionalContext: '',
  addLodgingLater: true,
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

function formatTravelerSummary(count: number) {
  return `${count} ${count === 1 ? 'viajero' : 'viajeros'}`;
}

export function CreateTripModal({
  isOpen,
  isGenerating,
  statusMessage,
  password,
  onClose,
  onGenerate,
}: {
  isOpen: boolean;
  isGenerating: boolean;
  statusMessage: string;
  password: string;
  onClose: () => void;
  onGenerate: (input: CreateTripInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateTripInput>(initialForm);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [error, setError] = useState('');
  const [lodgingQuery, setLodgingQuery] = useState('');
  const [lodgingSuggestions, setLodgingSuggestions] = useState<PlaceSuggestion[]>([]);
  const [lodgingSearchError, setLodgingSearchError] = useState('');
  const [isSearchingLodging, setIsSearchingLodging] = useState(false);
  const [isLoadingLodging, setIsLoadingLodging] = useState(false);

  const updateField = <K extends keyof CreateTripInput>(field: K, value: CreateTripInput[K]) => {
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
    setForm((prev) => ({
      ...prev,
      travelersSummary: formatTravelerSummary(prev.travelerCount),
    }));
  }, [form.travelerCount]);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setSelectedInterests([]);
      setCustomInterest('');
      setError('');
      setLodgingQuery('');
      setLodgingSuggestions([]);
      setLodgingSearchError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const term = lodgingQuery.trim();
    if (term.length < 2 || form.addLodgingLater === false && term === form.lodgingName) {
      setLodgingSuggestions([]);
      setLodgingSearchError('');
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsSearchingLodging(true);
      setLodgingSearchError('');

      try {
        const response = await fetch('/api/places', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'x-app-password': password},
          body: JSON.stringify({action: 'autocomplete', query: term}),
        });

        if (!response.ok) {
          throw new Error('Lodging autocomplete request failed');
        }

        const data = await response.json();
        setLodgingSuggestions(data.suggestions || []);
      } catch {
        setLodgingSuggestions([]);
        setLodgingSearchError('No se pudieron cargar sugerencias para el alojamiento.');
      } finally {
        setIsSearchingLodging(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [form.addLodgingLater, form.lodgingName, isOpen, lodgingQuery, password]);

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

  const handleSelectLodging = async (suggestion: PlaceSuggestion) => {
    setIsLoadingLodging(true);
    setLodgingSearchError('');

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-app-password': password},
        body: JSON.stringify({action: 'details', placeId: suggestion.placeId}),
      });

      if (!response.ok) {
        throw new Error('Lodging details request failed');
      }

      const data = await response.json();
      const place = data.place;

      setForm((prev) => ({
        ...prev,
        lodgingName: place.name || suggestion.mainText,
        lodgingAddress: place.description || suggestion.secondaryText || '',
        lodgingLat: String(place.lat ?? ''),
        lodgingLng: String(place.lng ?? ''),
        lodgingPlaceId: place.placeId || suggestion.placeId,
        lodgingImage: place.image || '',
        lodgingGoogleMapsUri: place.googleMapsUri || '',
        addLodgingLater: false,
      }));
      setLodgingQuery(place.name || suggestion.mainText);
      setLodgingSuggestions([]);
    } catch {
      setLodgingSearchError('No se pudieron cargar los datos del alojamiento.');
    } finally {
      setIsLoadingLodging(false);
    }
  };

  const handleStartDateChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      startDate: value,
      endDate: prev.endDate && prev.endDate < value ? '' : prev.endDate,
    }));
  };

  const handleSubmit = async () => {
    if (!form.destination.trim() || !form.countryOrRegion.trim() || !form.startDate || !form.endDate) {
      setError('Destino, país/región y fechas son obligatorios.');
      return;
    }

    setError('');
    try {
      await onGenerate({
        ...form,
        travelersSummary: formatTravelerSummary(form.travelerCount),
        interests: selectedInterests.join(', '),
        addLodgingLater: form.addLodgingLater ?? !form.lodgingName,
      });
      setForm(initialForm);
      setSelectedInterests([]);
      setCustomInterest('');
      setLodgingQuery('');
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
            className="fixed inset-x-4 inset-y-4 z-[1310] mx-auto flex max-w-4xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl sm:inset-x-6 sm:inset-y-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5">
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

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
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
                  type="date"
                  min={form.startDate || undefined}
                  value={form.endDate}
                  onChange={(event) => updateField('endDate', event.target.value)}
                  className="rounded-lg border border-black/10 px-3 py-3 outline-none focus:border-black"
                />
                {startDateLabel ? <span className="text-xs text-emerald-700">Inicio seleccionado: {startDateLabel}</span> : null}
                </label>
                <div className="grid gap-3 text-sm">
                  <span className="text-black/60">Viajeros</span>
                  <div className="flex min-h-13 items-center justify-between rounded-lg border border-black/10 bg-stone-50 px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-black">{formatTravelerSummary(form.travelerCount)}</div>
                      <div className="text-xs text-black/50">Ajusta el total sin abrir otro panel.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateField('travelerCount', Math.max(1, form.travelerCount - 1))}
                        className="rounded-lg border border-black/10 bg-white p-2 text-black/70"
                      >
                        <Minus size={16} />
                      </button>
                      <div className="w-8 text-center text-sm font-semibold text-black">{form.travelerCount}</div>
                      <button
                        type="button"
                        onClick={() => updateField('travelerCount', Math.min(20, form.travelerCount + 1))}
                        className="rounded-lg border border-black/10 bg-white p-2 text-black/70"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
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
                <div className="grid gap-3 text-sm md:col-span-2">
                  <span className="text-black/60">Dónde dormirás</span>
                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
                    <input
                      value={lodgingQuery}
                      onChange={(event) => {
                        setLodgingQuery(event.target.value);
                        setForm((prev) => ({...prev, addLodgingLater: false}));
                      }}
                      placeholder="Opcional: busca el hotel o alojamiento"
                      className="w-full rounded-lg border border-black/10 px-10 py-3 outline-none focus:border-black"
                    />
                    {isSearchingLodging || isLoadingLodging ? <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-black/45" /> : null}
                  </div>
                  {lodgingSuggestions.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
                      {lodgingSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          onClick={() => handleSelectLodging(suggestion)}
                          className="flex w-full items-start gap-3 border-b border-black/5 px-4 py-3 text-left last:border-b-0 hover:bg-stone-50"
                        >
                          <MapPin size={15} className="mt-0.5 shrink-0 text-emerald-700" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-black">{suggestion.mainText}</span>
                            {suggestion.secondaryText ? <span className="block text-xs text-black/55">{suggestion.secondaryText}</span> : null}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {form.lodgingName && !form.addLodgingLater ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      <div className="font-medium">{form.lodgingName}</div>
                      {form.lodgingAddress ? <div className="mt-1 text-xs text-emerald-800/80">{form.lodgingAddress}</div> : null}
                    </div>
                  ) : (
                    <p className="text-xs text-black/45">Opcional. Si lo dejas vacío, podrás añadirlo luego desde la configuración del viaje.</p>
                  )}
                  {lodgingSearchError ? <p className="text-sm text-red-600">{lodgingSearchError}</p> : null}
                </div>
                <label className="grid gap-1 text-sm md:col-span-2">
                  <span className="text-black/60">Información adicional</span>
                  <textarea
                    value={form.additionalContext || ''}
                    onChange={(event) => updateField('additionalContext', event.target.value)}
                    rows={3}
                    placeholder="Opcional: restricciones, preferencias, celebración especial, viaje con niños, presupuesto, etc."
                    className="rounded-lg border border-black/10 px-3 py-3 outline-none focus:border-black"
                  />
                </label>
                <div className="grid gap-3 text-sm md:col-span-2">
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
            </div>

            <div className="border-t border-black/10 px-6 py-4">
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {isGenerating ? (
                <div className={`${error ? 'mt-3' : ''} rounded-lg border border-black/10 bg-stone-50 px-4 py-3 text-sm text-black/65`}>
                  {statusMessage}
                </div>
              ) : null}

              <div className="mt-4 flex justify-end">
              <button onClick={handleSubmit} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50">
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <WandSparkles size={16} />}
                Generar itinerario
              </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
