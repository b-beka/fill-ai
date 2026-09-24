import React from 'react';

export interface CircleBadgeProps {
  children?: React.ReactNode;
  value?: string | number;
  label?: string;
  variant?: 'blue' | 'sun' | 'sky' | 'paper' | 'red';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CircleBadge: React.FC<CircleBadgeProps> = ({
  children,
  value,
  label,
  variant = 'sun',
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-28 h-28 text-3xl',
  }[size];

  const variantStyles = {
    sun: 'bg-sun text-ink border-2 border-ink shadow-hard',
    blue: 'bg-blue text-white border-2 border-ink shadow-hard',
    sky: 'bg-sky text-ink border-2 border-ink shadow-hard',
    paper: 'bg-paper text-ink border-2 border-ink shadow-hard',
    red: 'bg-pen-red text-white border-2 border-ink shadow-hard',
  }[variant];

  return (
    <div className="inline-flex flex-col items-center justify-center select-none text-center">
      <div 
        className={`
          rounded-full flex flex-col items-center justify-center font-heading font-black
          transition-transform hover:scale-105 duration-150
          ${sizeStyles}
          ${variantStyles}
          ${className}
        `}
      >
        {value !== undefined ? <span>{value}</span> : children}
      </div>
      {label && (
        <span className="font-heading font-semibold text-[10px] uppercase text-ink/70 mt-1.5 max-w-[80px] leading-tight">
          {label}
        </span>
      )}
    </div>
  );
};
