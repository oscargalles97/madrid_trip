import {AnimatePresence, motion} from 'motion/react';
import {ExternalLink, X} from 'lucide-react';
import type {Stop, TravelMode} from '../types';

const mapModeLabel: Record<TravelMode, string> = {
  walking: 'A pie',
  transit: 'Transporte público',
  driving: 'Coche',
};

export function RouteModeDialog({
  stop,
  onClose,
  onSelect,
}: {
  stop: Stop | null;
  onClose: () => void;
  onSelect: (mode: TravelMode) => void;
}) {
  return (
    <AnimatePresence>
      {stop ? (
        <>
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-[1300] bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 16}}
            className="fixed inset-x-4 bottom-4 z-[1310] mx-auto max-w-md rounded-2xl border border-black/10 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-black/50">Cómo llegar</p>
                <h3 className="text-lg font-semibold">{stop.name}</h3>
              </div>
              <button onClick={onClose} className="rounded-lg p-1 text-black/50 hover:bg-black/5">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {(['walking', 'transit', 'driving'] as TravelMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onSelect(mode)}
                  className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3 text-left transition-colors hover:border-black/30 hover:bg-stone-50"
                >
                  <span className="font-medium">{mapModeLabel[mode]}</span>
                  <ExternalLink size={14} className="text-black/45" />
                </button>
              ))}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
