import { cn } from '../../lib/cn';

const variants = {
  primary:
    'bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0',
  secondary:
    'bg-surface border border-border text-text hover:bg-white/5 hover:border-primary/50',
  ghost: 'text-muted hover:text-text hover:bg-white/5',
  danger:
    'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20',
  success:
    'bg-success/10 border border-success/30 text-success hover:bg-success/20',
  warning:
    'bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  icon: Icon,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
