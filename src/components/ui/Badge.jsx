import { cn } from '../../lib/cn';

const variants = {
  Active: 'bg-success/15 text-success border border-success/30',
  Blocked: 'bg-danger/15 text-danger border border-danger/30',
  Inactive: 'bg-muted/15 text-muted border border-border',
  Admin: 'bg-primary/15 text-primary border border-primary/30',
  Moderator: 'bg-secondary/15 text-secondary border border-secondary/30',
  User: 'bg-white/5 text-text-muted border border-border',
};

export function Badge({ label, className }) {
  const style = variants[label] ?? 'bg-white/5 text-text-muted border border-border';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide',
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
