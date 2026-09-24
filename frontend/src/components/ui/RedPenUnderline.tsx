import React from 'react';

export interface RedPenUnderlineProps {
  children: React.ReactNode;
  color?: 'red' | 'sun' | 'blue';
  className?: string;
}

export const RedPenUnderline: React.FC<RedPenUnderlineProps> = ({
  children,
  color = 'red',
  className = ''
}) => {
  const strokeColor = {
    red: '#E5383B',
    sun: '#FFC72C',
    blue: '#2340E0',
  }[color];

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      {/* Волнистая чернильная линия */}
      <svg
        className="absolute left-0 bottom-[-4px] w-full h-[8px] pointer-events-none overflow-visible"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 5 Q 12 1, 25 5 T 50 5 T 75 5 T 100 5"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
