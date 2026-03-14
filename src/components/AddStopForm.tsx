import {Loader2, MapPin, Save, Search, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import type {StopDraft} from '../types';
import {typeLabel} from '../itineraryData';
import type {PlaceSuggestion} from '../types';

export function AddStopForm({
  draft,
  error,
  placesEnabled,
  password,
  onChange,
  onSave,
  onCancel,
}: {
  draft: StopDraft;
  error: string;
  placesEnabled: boolean;
  password: string;
  onChange: (field: keyof StopDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState(draft.name);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    setQuery(draft.name);
  }, [draft.name]);

  useEffect(() => {
    if (!placesEnabled) {
      setSuggestions([]);
      return;
    }

    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setSearchError('');
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSearching(true);
      setSearchError('');

      try {
        const response = await fetch('/api/places', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'x-app-password': password},
          body: JSON.stringify({action: 'autocomplete', query: term}),
        });

        if (!response.ok) {
          throw new Error('Autocomplete request failed');
        }

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        setSuggestions([]);
        setSearchError('No se pudieron cargar sugerencias de Google Maps.');
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [password, placesEnabled, query]);

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setLoadingPlace(true);
    setSearchError('');

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-app-password': password},
        body: JSON.stringify({action: 'details', placeId: suggestion.placeId}),
      });

      if (!response.ok) {
        throw new Error('Place details request failed');
      }

      const data = await response.json();
      const place = data.place;

      onChange('name', place.name || suggestion.mainText);
      onChange('description', place.description || suggestion.secondaryText || '');
      onChange('lat', String(place.lat ?? ''));
      onChange('lng', String(place.lng ?? ''));
      onChange('type', place.type || 'sight');
      onChange('bookingLink', place.bookingLink || '');
      if (!draft.time.trim()) {
        onChange('time', '');
      }

      setQuery(place.name || suggestion.mainText);
      setSuggestions([]);
    } catch (error) {
      setSearchError('No se pudieron cargar los datos del lugar seleccionado.');
    } finally {
      setLoadingPlace(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-black/10 bg-stone-50 p-4">
      <div className="grid gap-4">
        <div>
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Buscar sitio</span>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  onChange('name', e.target.value);
                }}
                placeholder={placesEnabled ? 'Escribe un sitio o dirección' : 'Falta configurar la API key de Google Maps'}
                disabled={!placesEnabled || loadingPlace}
                className="w-full rounded-lg border border-black/10 bg-white py-3 pl-10 pr-10 outline-none focus:border-emerald-700 disabled:bg-stone-100"
              />
              {searching || loadingPlace ? <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-black/45" /> : null}
            </div>
          </label>

          {suggestions.length > 0 ? (
            <div className="mt-2 overflow-hidden rounded-xl border border-black/10 bg-white">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.placeId}
                  onClick={() => handleSelectSuggestion(suggestion)}
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

          {searchError ? <p className="mt-2 text-sm text-red-600">{searchError}</p> : null}
          {!placesEnabled ? <p className="mt-2 text-sm text-amber-700">Añade `GOOGLE_MAPS_API_KEY` en tu entorno para habilitar las sugerencias.</p> : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Hora</span>
            <input value={draft.time} onChange={(e) => onChange('time', e.target.value)} placeholder="Opcional" className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Tipo</span>
            <input value={typeLabel[draft.type]} readOnly className="rounded-lg border border-black/10 bg-stone-100 px-3 py-2 text-black/60 outline-none" />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="text-black/60">Descripción</span>
            <textarea value={draft.description} onChange={(e) => onChange('description', e.target.value)} rows={2} className="rounded-lg border border-black/10 bg-white px-3 py-2 outline-none focus:border-emerald-700" />
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
