import React, { useState } from 'react';

export const BrandLogo: React.FC<{
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}> = ({ variant = 'light', size = 'md' }) => {
  const textSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const markSize =
    size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';

  return (
    <div className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <div
        className={`${markSize} rounded-lg flex items-center justify-center font-display font-extrabold tracking-tight ${
          variant === 'dark'
            ? 'bg-white text-[#28658F] shadow-xs'
            : 'bg-[#4A90C6] text-white border border-[#367EAF]'
        }`}
        aria-hidden="true"
      >
        <span>U</span>
        <span className={variant === 'dark' ? 'text-[#E31B23]' : 'text-white'}>B</span>
      </div>
      <span
        className={`${textSize} font-display font-bold tracking-tight ${
          variant === 'dark' ? 'text-white' : 'text-[#28658F]'
        }`}
      >
        UsDigital-
        <span
          className={
            variant === 'dark'
              ? 'bg-white text-[#E31B23] font-extrabold px-1.5 py-0.5 rounded ml-0.5'
              : 'text-[#E31B23] font-extrabold'
          }
        >
          BMU
        </span>
      </span>
    </div>
  );
};

export const ProfileAvatar: React.FC<{
  src?: string;
  name: string;
  sizeClass?: string;
  className?: string;
}> = ({ src, name, sizeClass = 'w-10 h-10', className = '' }) => {
  const [hasError, setHasError] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden border border-[#E2EAF1] bg-[#4A90C6] text-white flex items-center justify-center shrink-0 ${className}`}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <span className="font-display font-bold text-xs tracking-wide">{initials}</span>
      )}
    </div>
  );
};
