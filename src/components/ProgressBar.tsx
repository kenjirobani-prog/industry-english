type Props = {
  current: number;
  total: number;
  labels?: string[];
  variant?: 'light' | 'dark';
};

export function ProgressBar({
  current,
  total,
  labels,
  variant = 'light',
}: Props) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));
  const trackBg = variant === 'dark' ? 'bg-white/15' : 'bg-apple-gray-2';
  const fillBg =
    variant === 'dark'
      ? 'bg-[var(--accent-on-dark)]'
      : 'bg-[var(--accent)]';
  const labelColor =
    variant === 'dark' ? 'text-apple-fg-on-dark-2' : 'text-apple-fg-2';
  const labelActive =
    variant === 'dark' ? 'text-white' : 'text-apple-fg';

  return (
    <div className="w-full">
      <div className={`flex items-center justify-between t-caption ${labelColor} mb-2`}>
        <span>
          Step {current} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className={`h-1 w-full rounded-full overflow-hidden ${trackBg}`}>
        <div
          className={`h-full ${fillBg} transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {labels && (
        <div
          className={`grid mt-3 text-[11px] ${labelColor}`}
          style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
        >
          {labels.map((label, i) => (
            <div
              key={label}
              className={`text-center ${i + 1 <= current ? labelActive : ''}`}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
