export function WeatherWidget() {
  return (
    <div className="mt-6 flex w-fit gap-4 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white shadow-sm backdrop-blur">
      <div className="flex flex-col items-center justify-center border-r border-white/15 pr-4">
        <span className="text-lg">☀️</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Tiempo</span>
      </div>
      <div className="flex gap-4 text-sm">
        <div className="text-center">
          <div className="text-[10px] uppercase text-white/60">Jue 13</div>
          <div className="font-semibold">18° / 8°</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase text-white/60">Vie 14</div>
          <div className="font-semibold">19° / 9°</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase text-white/60">Sáb 15</div>
          <div className="font-semibold">21° / 10°</div>
        </div>
      </div>
    </div>
  );
}
