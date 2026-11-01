import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return count;
}

export function StatCard({ icon: Icon, label, value, color = 'primary', className }) {
  const animatedValue = useCountUp(value);

  const colorMap = {
    primary: 'from-primary/20 to-primary/5 border-primary/20 text-primary',
    secondary: 'from-secondary/20 to-secondary/5 border-secondary/20 text-secondary',
    success: 'from-success/20 to-success/5 border-success/20 text-success',
    danger: 'from-danger/20 to-danger/5 border-danger/20 text-danger',
    warning: 'from-warning/20 to-warning/5 border-warning/20 text-warning',
  };

  const iconColor = colorMap[color] ?? colorMap.primary;

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-surface border border-border p-6 overflow-hidden',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        'transition-all duration-300 group',
        className
      )}
    >
      {/* Background glow */}
      <div
        className={cn(
          'absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-gradient-to-br',
          colorMap[color]?.split(' ')[0]
        )}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium mb-1">{label}</p>
          <p className="text-4xl font-extrabold text-text tracking-tight">
            {animatedValue}
          </p>
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl bg-gradient-to-br border flex items-center justify-center flex-shrink-0',
            iconColor
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
