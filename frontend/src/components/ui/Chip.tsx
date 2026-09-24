import React from 'react';

export interface ChipProps {
  children: React.ReactNode;
  variant?: 'sun' | 'sky' | 'blue' | 'paper' | 'red' | 'green';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'sun',
  size = 'md',
  icon,
  className = '',
  onClick
}) => {
  const variantStyles = {
    sun: 'bg-sun text-ink border-2 border-ink',
    sky: 'bg-sky text-ink border-2 border-ink',
    blue: 'bg-blue text-white border-2 border-ink',
    paper: 'bg-paper text-ink border-2 border-ink',
    red: 'bg-pen-red text-white border-2 border-ink',
    green: 'bg-stamp-green text-white border-2 border-ink',
  }[variant];

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5 gap-1 font-bold',
    md: 'text-xs px-3.5 py-1 gap-1.5 font-bold',
  }[size];

  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center rounded-pill font-heading uppercase tracking-wider select-none
        ${sizeStyles}
        ${variantStyles}
        ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''}
        ${className}
      `}
    >
      {icon && <span className="flex-none">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
