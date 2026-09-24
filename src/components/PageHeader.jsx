export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex animate-fade-up flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-base-content">{title}</h1>
        <div className="mt-2 h-[3px] w-10 rounded-full" style={{ backgroundImage: 'var(--gradient-brand)' }} />
        {subtitle && <p className="mt-2 text-sm text-base-content/60">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
