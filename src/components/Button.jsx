const VARIANTS = {
  primary:
    'btn btn-primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_hsl(var(--primary-h)_var(--primary-s)_45%/0.55)] active:translate-y-0 active:scale-[0.97]',
  secondary:
    'btn btn-outline transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
  danger:
    'btn btn-outline btn-error transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]',
  ghost: 'btn btn-ghost btn-sm transition-transform duration-150 active:scale-95',
};

export function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`${VARIANTS[variant]} ${className}`} {...props} />;
}
