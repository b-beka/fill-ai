import React from 'react';

interface NotebookBackgroundProps {
  className?: string;
  cellSize?: number;
  withMargin?: boolean;
  children?: React.ReactNode;
  theme?: 'paper' | 'board';
}

export const NotebookBackground: React.FC<NotebookBackgroundProps> = ({
  className = '',
  cellSize = 28,
  withMargin = true,
  children,
  theme = 'paper'
}) => {
  const isBoard = theme === 'board';
  const gridColor = isBoard ? '#1D2D73' : '#C7D6F2';
  const marginColor = isBoard ? '#E5383B' : '#E5383B';

  return (
    <div className={`relative w-full overflow-hidden ${isBoard ? 'bg-board text-chalk' : 'bg-paper text-ink'} ${className}`}>
      {/* SVG Pattern: чистая клетка тетради */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern 
            id={`notebook-grid-${theme}`} 
            width={cellSize} 
            height={cellSize} 
            patternUnits="userSpaceOnUse"
          >
            <path 
              d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`} 
              fill="none" 
              stroke={gridColor} 
              strokeWidth="1" 
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#notebook-grid-${theme})`} />
      </svg>

      {/* Красное поле тетради (слева) */}
      {withMargin && (
        <div 
          className="absolute top-0 bottom-0 pointer-events-none hidden md:block"
          style={{ 
            left: '72px', 
            width: '2px', 
            backgroundColor: marginColor,
            opacity: isBoard ? 0.3 : 0.6
          }} 
        />
      )}

      {/* Контент */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
