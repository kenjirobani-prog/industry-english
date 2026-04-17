type Props = {
  current: number;
  total: number;
  labels?: string[];
};

export function ProgressBar({ current, total, labels }: Props) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-amber-200/70 mb-2">
        <span className="font-display tracking-widest uppercase">
          Step {current} / {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-gold transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {labels && (
        <div className="grid grid-cols-4 gap-2 mt-3 text-[10px] sm:text-xs text-amber-200/60">
          {labels.map((label, i) => (
            <div
              key={label}
              className={`text-center font-display tracking-wider uppercase ${
                i + 1 <= current ? 'text-gold' : ''
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
