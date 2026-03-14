import {LocateFixed, Maximize2, Minimize2} from 'lucide-react';
import {Circle, MapContainer, Marker, Popup, Polyline, TileLayer, useMap} from 'react-leaflet';
import L from 'leaflet';
import {useEffect} from 'react';
import type {Stop, TripDay} from '../types';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const createNumberedIcon = (number: string | number) => {
  const label = String(number);
  const compact = label.length > 2;
  return L.divIcon({
    html: `<div class="marker-number ${compact ? 'marker-number-wide' : ''}">${label}</div>`,
    className: 'custom-div-icon',
    iconSize: compact ? [40, 30] : [30, 30],
    iconAnchor: compact ? [20, 15] : [15, 15],
  });
};

const createUserLocationIcon = () =>
  L.divIcon({
    html: '<div class="user-location-dot"></div>',
    className: 'user-location-icon',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

function MapController({
  coords,
  activeLocation,
  shouldFollowLocation,
}: {
  coords: [number, number][];
  activeLocation?: [number, number];
  shouldFollowLocation: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const points = activeLocation ? [...coords, activeLocation] : coords;
    if (points.length === 0) {
      return;
    }

    map.fitBounds(L.latLngBounds(points), {padding: [40, 40], maxZoom: 15});
  }, [activeLocation, coords, map]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    const container = map.getContainer();
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [map]);

  useEffect(() => {
    if (activeLocation && shouldFollowLocation) {
      map.flyTo(activeLocation, Math.max(map.getZoom(), 14), {duration: 0.6});
    }
  }, [activeLocation, map, shouldFollowLocation]);

  return null;
}

export function MapPanel({
  day,
  groupedStops,
  currentLocation,
  shouldFollowLocation,
  locationStatus,
  isFullscreen,
  onLocate,
  onToggleFullscreen,
}: {
  day: TripDay;
  groupedStops: {coords: [number, number]; stops: {stop: Stop; index: number}[]}[];
  currentLocation: [number, number] | null;
  shouldFollowLocation: boolean;
  locationStatus: string;
  isFullscreen: boolean;
  onLocate: () => void;
  onToggleFullscreen: () => void;
}) {
  const polylineCoords = day.stops.map((stop) => stop.coords);
  const center = day.stops[0]?.coords ?? [40.4168, -3.7038];

  return (
    <div className={`relative h-full w-full overflow-hidden bg-white ${isFullscreen ? '' : 'rounded-2xl border border-black/10 shadow-sm'}`}>
      <div className="absolute left-4 top-4 z-[500] flex gap-2">
        <button onClick={onLocate} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-sm">
          <LocateFixed size={15} />
          Mi ubicación
        </button>
        <button onClick={onToggleFullscreen} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow-sm">
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          {isFullscreen ? 'Salir' : 'Pantalla completa'}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-[500] rounded-lg bg-white/95 px-3 py-2 text-xs text-black shadow-sm">
        {locationStatus}
      </div>

      <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController coords={polylineCoords} activeLocation={currentLocation ?? undefined} shouldFollowLocation={shouldFollowLocation} />

        {groupedStops.map((group) => {
          const label = group.stops.map((entry) => entry.index + 1).join(', ');
          return (
            <Marker key={`${group.coords[0]}-${group.coords[1]}`} position={group.coords} icon={createNumberedIcon(label)}>
              <Popup>
                <div className="max-h-64 w-56 overflow-y-auto pr-1">
                  {group.stops.map(({stop, index}, itemIndex) => (
                    <div key={stop.id} className={`${itemIndex > 0 ? 'mt-3 border-t border-black/10 pt-3' : ''} space-y-2`}>
                      {stop.image ? <img src={stop.image} alt={stop.name} className="h-24 w-full rounded-md object-cover" /> : null}
                      <div>
                        <p className="text-sm font-semibold">
                          {index + 1}. {stop.name}
                        </p>
                        <p className="text-xs font-medium text-emerald-700">{stop.time || 'Sin hora'}</p>
                        <p className="text-xs text-black/65">{stop.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {currentLocation ? (
          <>
            <Circle center={currentLocation} radius={70} pathOptions={{color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.2, weight: 1}} />
            <Marker position={currentLocation} icon={createUserLocationIcon()}>
              <Popup>Tu ubicación actual</Popup>
            </Marker>
          </>
        ) : null}

        {polylineCoords.length > 1 ? (
          <Polyline positions={polylineCoords} pathOptions={{color: '#059669', weight: 4, opacity: 0.7, dashArray: '8 8'}} />
        ) : null}
      </MapContainer>
    </div>
  );
}
