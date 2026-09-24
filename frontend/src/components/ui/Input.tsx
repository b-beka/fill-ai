import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label 
          htmlFor={inputId} 
          className="font-heading font-semibold text-xs tracking-tight text-ink/80 flex items-center justify-between"
        >
          <span>{label}</span>
          {hint && <span className="font-body font-normal text-xs text-ink/50">{hint}</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-ink/50 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          className={`
            w-full bg-paper-2/60 text-ink font-body text-sm
            border-b-2 border-ink px-3 py-2.5 rounded-t-md
            transition-colors duration-150
            placeholder:text-ink/35
            focus:bg-sun-soft/50 focus:border-b-3 focus:border-ink focus:outline-none
            ${icon ? 'pl-9' : ''}
            ${error ? 'border-b-pen-red bg-pen-red/5' : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      {/* Ошибка: рукописная пометка учителя красной ручкой шрифтом Caveat */}
      {error && (
        <div className="flex items-center gap-1.5 font-hand text-base text-pen-red font-bold animate-fadeIn">
          <span>✎</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';
