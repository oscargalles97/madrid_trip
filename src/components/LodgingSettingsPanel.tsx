import {Loader2, MapPin, Save, Search, Trash2, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import type {Lodging, PlaceSuggestion} from '../types';

export function LodgingSettingsPanel({
  password,
  lodging,
  onClose,
  onSave,
}: {
  password: string;
  lodging?: Lodging;
  onClose: () => void;
  onSave: (lodging?: Lodging) => void;
}) {
  const [query, setQuery] = useState(lodging?.name || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedLodging, setSelectedLodging] = useState<Lodging | undefined>(lodging);
  const [searching, setSearching] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setQuery(lodging?.name || '');
    setSelectedLodging(lodging);
  }, [lodging]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || term === selectedLodging?.name) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSearching(true);
      setError('');
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
      } catch {
        setSuggestions([]);
        setError('No se pudieron cargar sugerencias para el alojamiento.');
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [password, query, selectedLodging?.name]);

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setLoadingPlace(true);
    setError('');

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

      setSelectedLodging({
        name: place.name || suggestion.mainText,
        address: place.description || suggestion.secondaryText || '',
        coords: [Number(place.lat ?? 0), Number(place.lng ?? 0)],
        image: place.image || undefined,
        placeId: place.placeId || suggestion.placeId,
        googleMapsUri: place.googleMapsUri || undefined,
      });
      setQuery(place.name || suggestion.mainText);
      setSuggestions([]);
    } catch {
      setError('No se pudieron cargar los datos del alojamiento.');
    } finally {
      setLoadingPlace(false);
    }
  };

  return (
    <div className="rounded-xl border border-black/10 bg-stone-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Alojamiento</h3>
          <p className="mt-1 text-sm text-black/55">Se aplicará como primera y última parada de todos los días.</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-black/10 bg-white p-2 text-black/60">
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca el hotel o alojamiento"
            className="w-full rounded-lg border border-black/10 bg-white py-3 pl-10 pr-10 outline-none focus:border-black"
          />
          {searching || loadingPlace ? <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-black/45" /> : null}
        </div>

        {suggestions.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
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

        {selectedLodging ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <div className="font-medium">{selectedLodging.name}</div>
            {selectedLodging.address ? <div className="mt-1 text-xs text-emerald-800/80">{selectedLodging.address}</div> : null}
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => onSave(selectedLodging)} className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white">
            <Save size={14} />
            Guardar alojamiento
          </button>
          <button onClick={() => onSave(undefined)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <Trash2 size={14} />
            Quitar alojamiento
          </button>
        </div>
      </div>
    </div>
  );
}
