import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS class names intelligently,
 * resolving conflicts using tailwind-merge and clsx.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
