import {useEffect, useRef, useState} from 'react';
import {CreateTripModal} from './components/CreateTripModal';
import {LoginScreen} from './components/LoginScreen';
import {TripEditor} from './components/TripEditor';
import {TripsHome} from './components/TripsHome';
import {SESSION_KEY} from './itineraryData';
import {deleteTrip, fetchTrip, fetchTrips, generateTrip, saveTrip, verifyPassword} from './lib/api';
import type {Trip, TripSummary} from './types';

export default function App() {
  const [password, setPassword] = useState('');
  const [sessionPassword, setSessionPassword] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [isSavingTrip, setIsSavingTrip] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionPassword) {
      return;
    }

    loadTrips(sessionPassword);
  }, [sessionPassword]);

  const loadTrips = async (activePassword: string) => {
    setIsLoadingTrips(true);
    try {
      const data = await fetchTrips(activePassword);
      setTrips(data.trips);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'No se pudieron cargar los viajes');
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const handleLogin = async () => {
    setIsAuthenticating(true);
    setAuthError('');

    try {
      await verifyPassword(password);
      sessionStorage.setItem(SESSION_KEY, password);
      setSessionPassword(password);
      setPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Contraseña incorrecta');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleOpenTrip = async (tripId: string) => {
    if (!sessionPassword) return;
    setIsLoadingTrip(true);

    try {
      const data = await fetchTrip(sessionPassword, tripId);
      setSelectedTrip(data.trip);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'No se pudo abrir el viaje');
    } finally {
      setIsLoadingTrip(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!sessionPassword) return;
    await deleteTrip(sessionPassword, tripId);
    setTrips((current) => current.filter((trip) => trip.id !== tripId));
    if (selectedTrip?.id === tripId) {
      setSelectedTrip(null);
    }
  };

  const handleGenerateTrip = async (input: Parameters<typeof generateTrip>[1]) => {
    if (!sessionPassword) return;
    setIsGeneratingTrip(true);
    setGenerationStatus('Investigando destino y puntos útiles...');

    try {
      const progressTimeout = window.setTimeout(() => {
        setGenerationStatus('Generando el borrador del itinerario...');
      }, 900);

      const data = await generateTrip(sessionPassword, input);
      window.clearTimeout(progressTimeout);
      setSelectedTrip(data.trip);
      setTrips((current) => [
        {
          id: data.trip.id,
          title: data.trip.title,
          destination: data.trip.destination,
          countryOrRegion: data.trip.countryOrRegion,
          startDate: data.trip.startDate,
          endDate: data.trip.endDate,
          status: data.trip.status,
          createdAt: data.trip.createdAt,
          updatedAt: data.trip.updatedAt,
          dayCount: data.trip.days.length,
        },
        ...current,
      ]);
      setIsCreateModalOpen(false);
      setGenerationStatus('');
    } catch (error) {
      setGenerationStatus('');
      setAuthError(error instanceof Error ? error.message : 'No se pudo generar el viaje');
      throw error;
    } finally {
      setIsGeneratingTrip(false);
    }
  };

  const handleTripChange = (nextTrip: Trip) => {
    setSelectedTrip(nextTrip);
    setTrips((current) =>
      current.map((trip) =>
        trip.id === nextTrip.id
          ? {
              ...trip,
              title: nextTrip.title,
              destination: nextTrip.destination,
              countryOrRegion: nextTrip.countryOrRegion,
              startDate: nextTrip.startDate,
              endDate: nextTrip.endDate,
              updatedAt: nextTrip.updatedAt,
              dayCount: nextTrip.days.length,
            }
          : trip,
      ),
    );

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    setIsSavingTrip(true);
    saveTimeoutRef.current = window.setTimeout(async () => {
      if (!sessionPassword) return;
      try {
        await saveTrip(sessionPassword, nextTrip);
      } finally {
        setIsSavingTrip(false);
      }
    }, 500);
  };

  if (!sessionPassword) {
    return <LoginScreen password={password} error={authError} isSubmitting={isAuthenticating} onPasswordChange={setPassword} onSubmit={handleLogin} />;
  }

  if (selectedTrip) {
    return <TripEditor trip={selectedTrip} password={sessionPassword} isSaving={isSavingTrip} onBack={() => setSelectedTrip(null)} onTripChange={handleTripChange} />;
  }

  return (
    <>
      <TripsHome trips={trips} isLoading={isLoadingTrips || isLoadingTrip} onCreate={() => setIsCreateModalOpen(true)} onOpen={handleOpenTrip} onDelete={handleDeleteTrip} />
      <CreateTripModal isOpen={isCreateModalOpen} isGenerating={isGeneratingTrip} statusMessage={generationStatus} onClose={() => setIsCreateModalOpen(false)} onGenerate={handleGenerateTrip} />
      {authError ? (
        <div className="fixed bottom-4 left-1/2 z-[1400] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {authError}
        </div>
      ) : null}
    </>
  );
}
