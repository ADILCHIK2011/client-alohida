import { useTilt } from '../hooks/useTilt';
import { useCountUp } from '../hooks/useCountUp';

export function StatTile({ label, value, format = (n) => Math.round(n).toLocaleString(), icon: Icon, accent = false }) {
  const tilt = useTilt();
  const hasValue = typeof value === 'number';
  const animated = useCountUp(hasValue ? value : 0);

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className="tilt-card rounded-box border border-base-300 bg-base-100 p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-base-content/60">{label}</div>
        {Icon && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-field text-primary-content"
            style={{ backgroundImage: 'var(--gradient-brand)' }}
          >
            <Icon size={16} strokeWidth={2.25} />
          </div>
        )}
      </div>
      <div className={`mt-1 font-heading text-2xl font-semibold ${accent ? 'text-gradient-brand' : ''}`}>
        {hasValue ? format(animated) : '—'}
      </div>
    </div>
  );
}
