import {AnimatePresence, motion} from 'motion/react';
import {Image, Save, X} from 'lucide-react';
import {useEffect, useState} from 'react';

export function HeroImageModal({
  isOpen,
  initialValue,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={onClose} className="fixed inset-0 z-[1300] bg-black/45" />
          <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 20}} className="fixed inset-x-6 top-20 z-[1310] mx-auto max-w-xl rounded-xl border border-black/10 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Imagen de portada</h2>
                <p className="mt-1 text-sm text-black/55">Puedes pegar una URL distinta si quieres cambiar la portada del viaje.</p>
              </div>
              <button onClick={onClose} className="rounded-lg border border-black/10 bg-white p-2 text-black/55">
                <X size={16} />
              </button>
            </div>

            <label className="mt-5 grid gap-1 text-sm">
              <span className="text-black/60">URL de imagen</span>
              <input value={value} onChange={(event) => setValue(event.target.value)} className="rounded-lg border border-black/10 px-3 py-3 outline-none focus:border-black" />
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-black/70">
                Cancelar
              </button>
              <button onClick={() => onSave(value.trim())} className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white">
                <Save size={16} />
                Guardar
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
