import { useState } from 'react';
import { cn } from '../../lib/cn';

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({ initials, src, size = 'md', className }) {
  const [imgErr, setImgErr] = useState(false);
  const showImage = src && !imgErr && (src.startsWith('http') || src.startsWith('/'));

  return (
    <div
      aria-label={`Avatar for ${initials}`}
      className={cn(
        'rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white flex-shrink-0 select-none overflow-hidden relative shadow-sm',
        sizeMap[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={initials || 'User'}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        initials ?? '?'
      )}
    </div>
  );
}
