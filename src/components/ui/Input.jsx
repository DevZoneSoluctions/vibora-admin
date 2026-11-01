import { forwardRef } from 'react';
import { cn } from '../../lib/cn';

export const Input = forwardRef(function Input(
  { label, id, error, className, containerClassName, ...props },
  ref
) {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full bg-white/5 border border-border text-text rounded-xl px-4 py-2.5 text-sm',
          'placeholder:text-text-muted/50',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50',
          'transition-all duration-200',
          error && 'border-danger focus:border-danger focus:ring-danger/50',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
});
