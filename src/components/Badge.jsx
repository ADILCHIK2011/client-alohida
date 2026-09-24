const TONES = {
  neutral: 'badge badge-soft badge-neutral',
  success: 'badge badge-soft badge-success',
  danger: 'badge badge-soft badge-error',
  warning: 'badge badge-soft badge-warning',
  primary: 'badge badge-soft badge-primary',
};

const PULSING_TONES = new Set(['danger', 'warning']);

export function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`${TONES[tone]} animate-pop gap-1.5`}>
      {PULSING_TONES.has(tone) && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current"
          style={{ animation: 'pulse-dot 1.6s ease-in-out infinite' }}
        />
      )}
      {children}
    </span>
  );
}
