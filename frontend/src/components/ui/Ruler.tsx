import React from 'react';

export interface RulerProps {
  className?: string;
  length?: number; // количество делений (по умолчанию 20)
  unitLabel?: string;
  theme?: 'paper' | 'board' | 'sun';
}

export const Ruler: React.FC<RulerProps> = ({
  className = '',
  length = 20,
  unitLabel = 'см',
  theme = 'paper'
}) => {
  const isBoard = theme === 'board';
  const isSun = theme === 'sun';
  
  const bgClass = isSun ? 'bg-sun text-ink border-ink' : isBoard ? 'bg-[#142055] text-chalk border-chalk/30' : 'bg-paper-2 text-ink border-ink';
  const tickColor = isSun ? '#0E1A4B' : isBoard ? '#F4F1E6' : '#0E1A4B';

  return (
    <div 
      className={`
        w-full h-8 border-y-2 relative select-none overflow-hidden
        flex items-end font-mono text-[9px] font-bold tabular-nums
        ${bgClass}
        ${className}
      `}
    >
      {/* SVG с делениями миллиметров и сантиметров */}
      <svg 
        className="w-full h-full absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`ruler-mm-${theme}`} width="10" height="32" patternUnits="userSpaceOnUse">
            {/* Маленькие риски каждые 2мм */}
            <line x1="2" y1="32" x2="2" y2="25" stroke={tickColor} strokeWidth="1" opacity="0.4" />
            <line x1="4" y1="32" x2="4" y2="25" stroke={tickColor} strokeWidth="1" opacity="0.4" />
            <line x1="6" y1="32" x2="6" y2="25" stroke={tickColor} strokeWidth="1" opacity="0.4" />
            <line x1="8" y1="32" x2="8" y2="25" stroke={tickColor} strokeWidth="1" opacity="0.4" />
            {/* Полусантиметр (5мм) */}
            <line x1="5" y1="32" x2="5" y2="20" stroke={tickColor} strokeWidth="1.5" opacity="0.7" />
            {/* Сантиметр (10мм) */}
            <line x1="0" y1="32" x2="0" y2="14" stroke={tickColor} strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#ruler-mm-${theme})`} />
      </svg>

      {/* Подписи чисел сантиметров */}
      <div className="w-full flex justify-between px-2 pb-3.5 relative z-10 opacity-70">
        {Array.from({ length }).map((_, idx) => (
          <span key={idx} className="w-8 text-left">
            {idx === 0 ? `0 ${unitLabel}` : idx * 5}
          </span>
        ))}
      </div>
    </div>
  );
};
