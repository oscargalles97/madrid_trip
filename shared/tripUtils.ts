import {createId} from './seedTrip';
import type {Lodging, Stop, Trip} from './tripTypes';

function buildLodgingStop(lodging: Lodging, position: 'start' | 'end'): Stop {
  return {
    id: createId(),
    name: position === 'start' ? `${lodging.name} (Salida)` : `${lodging.name} (Vuelta)`,
    time: position === 'start' ? '09:00' : '22:00',
    description:
      position === 'start'
        ? `Inicio del día desde ${lodging.name}.`
        : `Regreso al alojamiento en ${lodging.name}.`,
    coords: lodging.coords,
    type: 'hotel',
    completed: false,
    requiresBooking: false,
    isLodging: true,
    image: lodging.image,
    bookingLink: lodging.googleMapsUri,
    source: 'manual',
  };
}

export function applyLodgingToTrip(trip: Trip): Trip {
  if (!trip.lodging) {
    return {
      ...trip,
      days: trip.days.map((day) => ({
        ...day,
        stops: day.stops.filter((stop) => !stop.isLodging),
      })),
    };
  }

  return {
    ...trip,
    days: trip.days.map((day) => {
      const baseStops = day.stops.filter((stop) => !stop.isLodging);
      return {
        ...day,
        stops: [buildLodgingStop(trip.lodging!, 'start'), ...baseStops, buildLodgingStop(trip.lodging!, 'end')],
      };
    }),
  };
}
