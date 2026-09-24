import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'sun' | 'paper' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  // Базовые размеры
  const sizeClasses = {
    sm: 'text-xs px-3.5 py-2 min-h-[36px] gap-1.5',
    md: 'text-sm px-5 py-3 min-h-[44px] gap-2.5',
    lg: 'text-base px-7 py-4 min-h-[52px] gap-3 font-bold',
  }[size];

  // Варианты стилизации (нео-брутализм с жесткой тенью 4px)
  const variantClasses = {
    primary: 'bg-blue text-white border-2 border-ink shadow-hard hover:bg-[#1C36C2]',
    sun: 'bg-sun text-ink border-2 border-ink shadow-hard hover:bg-[#EBB41D] font-bold',
    paper: 'bg-paper text-ink border-2 border-ink shadow-hard hover:bg-paper-2',
    danger: 'bg-pen-red text-white border-2 border-ink shadow-hard hover:bg-[#CE2D30]',
    outline: 'bg-transparent text-ink border-2 border-ink hover:bg-paper-2',
    ghost: 'bg-transparent text-ink border-none hover:bg-paper-2/60 shadow-none',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-heading font-semibold select-none
        rounded-xl cursor-pointer
        transition-all duration-150 ease-out
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses}
        ${variantClasses}
        ${disabled ? 'opacity-50 cursor-not-allowed shadow-none active:translate-x-0 active:translate-y-0' : 'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'}
        focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
        ${className}
      `}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="flex-none">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="flex-none">{icon}</span>}
    </button>
  );
};
