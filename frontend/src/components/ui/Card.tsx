import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'paper' | 'paper-2' | 'sun' | 'sky' | 'blue' | 'board';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  hoverLift?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'paper',
  shadow = 'md',
  hoverLift = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    paper: 'bg-paper text-ink border-2 border-ink',
    'paper-2': 'bg-paper-2 text-ink border-2 border-ink',
    sun: 'bg-sun text-ink border-2 border-ink',
    sky: 'bg-sky text-ink border-2 border-ink',
    blue: 'bg-blue text-white border-2 border-ink',
    board: 'bg-board text-chalk border-2 border-chalk/40',
  }[variant];

  const shadowStyles = {
    none: 'shadow-none',
    sm: variant === 'board' ? 'shadow-[2px_2px_0_0_#F4F1E6]' : 'shadow-[2px_2px_0_0_#0E1A4B]',
    md: variant === 'board' ? 'shadow-hard-board' : 'shadow-hard',
    lg: variant === 'board' ? 'shadow-hard-board-lg' : 'shadow-hard-lg',
  }[shadow];

  return (
    <div
      className={`
        rounded-card p-6 relative overflow-hidden
        transition-transform duration-200 ease-out
        ${variantStyles}
        ${shadowStyles}
        ${hoverLift ? 'hover:-translate-y-1 hover:shadow-hard-lg' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
