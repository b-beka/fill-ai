import React from 'react';

export interface MarginaliaProps {
  children: React.ReactNode;
  arrowDirection?: 'right-down' | 'right-up' | 'left-down' | 'left-up' | 'down' | 'up';
  color?: 'red' | 'blue' | 'ink';
  className?: string;
  rotate?: number;
}

export const Marginalia: React.FC<MarginaliaProps> = ({
  children,
  arrowDirection = 'right-down',
  color = 'red',
  className = '',
  rotate = -3
}) => {
  const colorClass = {
    red: 'text-pen-red',
    blue: 'text-blue',
    ink: 'text-ink',
  }[color];

  return (
    <div 
      style={{ transform: `rotate(${rotate}deg)` }}
      className={`inline-flex items-center gap-2 font-hand font-bold text-xl sm:text-2xl select-none ${colorClass} ${className}`}
    >
      <span>{children}</span>
      {/* Рукописная стрелочка */}
      <svg 
        width="28" 
        height="24" 
        viewBox="0 0 28 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="flex-none transition-transform"
      >
        {arrowDirection === 'right-down' && (
          <>
            <path d="M2 4 C10 4, 18 8, 22 18" />
            <polyline points="14 18 22 18 22 10" />
          </>
        )}
        {arrowDirection === 'down' && (
          <>
            <path d="M14 2 C14 10, 14 14, 14 20" />
            <polyline points="8 15 14 21 20 15" />
          </>
        )}
        {arrowDirection === 'left-down' && (
          <>
            <path d="M26 4 C18 4, 10 8, 6 18" />
            <polyline points="14 18 6 18 6 10" />
          </>
        )}
      </svg>
    </div>
  );
};
