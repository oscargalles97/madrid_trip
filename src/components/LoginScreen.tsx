import {Loader2, Lock} from 'lucide-react';

export function LoginScreen({
  password,
  error,
  isSubmitting,
  onPasswordChange,
  onSubmit,
}: {
  password: string;
  error: string;
  isSubmitting: boolean;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] px-6 py-12 text-[#1f1a17]">
      <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
          <Lock size={20} />
        </div>
        <h1 className="mt-5 text-3xl font-semibold">Trip Planner</h1>
        <p className="mt-2 text-sm text-black/60">
          Introduce la contraseña para acceder a tus viajes y generar itinerarios nuevos.
        </p>

        <div className="mt-6 space-y-3">
          <label className="grid gap-1 text-sm">
            <span className="text-black/60">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onSubmit();
                }
              }}
              className="rounded-lg border border-black/10 bg-white px-3 py-3 outline-none focus:border-black"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            onClick={onSubmit}
            disabled={!password.trim() || isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
