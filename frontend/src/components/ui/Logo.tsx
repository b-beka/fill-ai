import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textColor?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true,
  textColor
}) => {
  const iconDimensions = size === 'sm' ? 32 : size === 'lg' ? 48 : 38;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Двойной круг FILL: синий и желтый, в пересечении — линза с буквой F */}
      <svg 
        width={iconDimensions} 
        height={iconDimensions} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-none transition-transform hover:scale-105 active:scale-95 duration-150"
      >
        {/* Синий круг (слева) */}
        <circle 
          cx="16" 
          cy="20" 
          r="13" 
          fill="#2340E0" 
          stroke="#0E1A4B" 
          strokeWidth="2.5" 
        />
        {/* Солнечный желтый круг (справа, с легким наложением) */}
        <circle 
          cx="24" 
          cy="20" 
          r="13" 
          fill="#FFC72C" 
          stroke="#0E1A4B" 
          strokeWidth="2.5" 
          fillOpacity="0.9"
        />
        {/* Центральная линза с буквой F */}
        <text 
          x="20" 
          y="25.5" 
          textAnchor="middle" 
          fontFamily="Unbounded, sans-serif" 
          fontWeight="900" 
          fontSize="15" 
          fill="#0E1A4B"
        >
          F
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-heading font-black tracking-tight ${
            size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'
          } ${textColor ? textColor : 'text-inherit'}`}>
            FILL AI
          </span>
          <span className="font-body text-[9px] tracking-widest uppercase font-bold text-inherit opacity-60 mt-0.5">
            Синхронный конспект
          </span>
        </div>
      )}
    </div>
  );
};
