import { Check, X } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';

export function PricingCard({
  title,
  price,
  features,
  highlight = false,
  active = false,
  actionLabel,
  onSelect,
  disabled = false,
}) {
  return (
    <div
      className={`relative flex w-full flex-col gap-4 rounded-box border p-6 transition-all duration-200 ${
        highlight
          ? 'border-primary/40 bg-base-100 shadow-lg'
          : 'border-base-300 bg-base-100'
      } ${active ? 'ring-2 ring-primary/50' : ''}`}
    >
      {highlight && (
        <span className="absolute -top-3 left-6">
          <Badge tone="primary">Eng ko'p tanlanadi</Badge>
        </span>
      )}

      <div>
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-heading text-3xl font-bold text-gradient-brand">
            {price.toLocaleString()}
          </span>
          <span className="text-sm text-base-content/50">so'm/oy</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 text-sm">
        {features.map((f) => (
          <li
            key={f.text}
            className={`flex items-start gap-2 ${f.included ? '' : 'text-base-content/40'}`}
          >
            {f.included ? (
              <Check size={16} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <X size={16} className="mt-0.5 shrink-0 text-base-content/30" />
            )}
            <span className={f.included ? '' : 'line-through'}>{f.text}</span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant={active ? 'secondary' : 'primary'}
        className="mt-auto w-full"
        onClick={onSelect}
        disabled={disabled || active}
      >
        {active ? 'Joriy reja' : actionLabel}
      </Button>
    </div>
  );
}
