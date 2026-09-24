import React from 'react';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
  withBackdrop?: boolean;
  backdropColor?: 'sun' | 'sky' | 'blue' | 'none';
}

/* ========================================================================= */
/* ШКОЛЬНЫЕ ПРЕДМЕТЫ И НАУЧНЫЕ ИЛЛЮСТРАЦИИ (КОНТУР 2PX + СМЕЩЕННЫЙ КРУГ)     */
/* ========================================================================= */

// 1. Циркуль
export const IconCompass: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sun' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="14" 
        cy="14" 
        r="11" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <circle cx="16" cy="6" r="2.5" />
    <path d="M16 8.5v3" />
    <path d="M16 11.5L9 28" />
    <path d="M16 11.5L23 28" />
    <path d="M12 21h8" />
    <circle cx="9" cy="28" r="0.75" fill="currentColor" />
  </svg>
);

// 2. Колба химическая
export const IconFlask: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sky' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="18" 
        cy="19" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <path d="M13 4h6" />
    <path d="M14 4v7L7 24a3 3 0 0 0 2.6 4.5h12.8A3 3 0 0 0 25 24l-7-13V4" />
    <path d="M10 20h12" strokeDasharray="2 2" />
    <circle cx="14" cy="24" r="1" fill="currentColor" />
    <circle cx="18" cy="23" r="1.5" fill="currentColor" />
  </svg>
);

// 3. Атом
export const IconAtom: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sun' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="14" 
        cy="18" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <circle cx="16" cy="16" r="3" fill="currentColor" />
    <ellipse cx="16" cy="16" rx="13" ry="5.5" transform="rotate(30 16 16)" />
    <ellipse cx="16" cy="16" rx="13" ry="5.5" transform="rotate(-30 16 16)" />
  </svg>
);

// 4. Микроскоп
export const IconMicroscope: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sky' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="18" 
        cy="15" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <path d="M6 28h20" />
    <path d="M16 28v-4" />
    <path d="M12 24h8" />
    <path d="M11 19h8" />
    <path d="M21 13a6 6 0 0 1-6 6" />
    <path d="M13 6l6 6" />
    <rect x="14" y="5" width="5" height="11" transform="rotate(-45 14 5)" />
  </svg>
);

// 5. ДНК-спираль
export const IconDna: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sun' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="18" 
        cy="14" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <path d="M6 6c8 4 12 16 20 20" />
    <path d="M26 6C18 10 14 22 6 26" />
    <path d="M9 10h14" />
    <path d="M12 16h8" />
    <path d="M9 22h14" />
  </svg>
);

// 6. Угольник / Линейка треугольная
export const IconTriangleRuler: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sun' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="14" 
        cy="18" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <path d="M5 27V5l22 22H5z" />
    <path d="M9 23v-9l9 9H9z" />
    <path d="M5 9h3" />
    <path d="M5 13h2" />
    <path d="M5 17h3" />
    <path d="M5 21h2" />
  </svg>
);

// 7. Транспортир
export const IconProtractor: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sky' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="16" 
        cy="15" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <path d="M5 22h22a11 11 0 0 0-22 0z" />
    <circle cx="16" cy="22" r="1.5" fill="currentColor" />
    <path d="M16 11v3" />
    <path d="M8.5 14l2 2" />
    <path d="M23.5 14l-2 2" />
  </svg>
);

// 8. Книга
export const IconBook: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sun' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="18" 
        cy="14" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <path d="M16 8c-3-2-6-2-11-2v18c5 0 8 1 11 3 3-2 6-3 11-3V6c-5 0-8 0-11 2z" />
    <path d="M16 8v19" />
  </svg>
);

// 9. Карандаш
export const IconPencil: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sun' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="14" 
        cy="18" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <path d="M6 26l4-1 16-16-3-3L7 22l-1 4z" />
    <path d="M20 9l3 3" />
    <path d="M6 26l1.5-1.5" />
  </svg>
);

// 10. Калькулятор
export const IconCalculator: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sky' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="18" 
        cy="18" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <rect x="7" y="4" width="18" height="24" rx="3" />
    <rect x="10" y="7" width="12" height="5" rx="1" />
    <circle cx="11" cy="16" r="1" fill="currentColor" />
    <circle cx="16" cy="16" r="1" fill="currentColor" />
    <circle cx="21" cy="16" r="1" fill="currentColor" />
    <circle cx="11" cy="21" r="1" fill="currentColor" />
    <circle cx="16" cy="21" r="1" fill="currentColor" />
    <circle cx="21" cy="21" r="1" fill="currentColor" />
  </svg>
);

// 11. Синусоида y = sin x
export const IconSineWave: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sun' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="16" 
        cy="16" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <path d="M4 16h24" strokeDasharray="2 2" />
    <path d="M16 4v24" strokeDasharray="2 2" />
    <path d="M4 16c4-12 8-12 12 0s8 12 12 0" />
  </svg>
);

// 12. Бензольное кольцо
export const IconBenzene: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sky' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="16" 
        cy="16" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <polygon points="16,5 26,10.5 26,21.5 16,27 6,21.5 6,10.5" />
    <circle cx="16" cy="16" r="6" strokeDasharray="3 2" />
  </svg>
);

// 13. Треугольник Пифагора
export const IconPythagoras: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  withBackdrop = false,
  backdropColor = 'sun' 
}) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {withBackdrop && (
      <circle 
        cx="16" 
        cy="18" 
        r="10" 
        fill={backdropColor === 'sun' ? '#FFC72C' : backdropColor === 'sky' ? '#BBD4FF' : '#2340E0'} 
        stroke="none" 
      />
    )}
    <polygon points="7,25 25,25 7,7" />
    <rect x="7" y="21" width="4" height="4" />
    <text x="14" y="23" fontSize="6" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">a</text>
    <text x="5" y="17" fontSize="6" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">b</text>
    <text x="17" y="15" fontSize="6" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">c</text>
  </svg>
);

/* ========================================================================= */
/* БАЗОВЫЕ ИНТЕРФЕЙСНЫЕ ИКОНКИ (2PX ЧЕРНИЛЬНЫЙ КОНТУР, ЧЕТКИЕ КОНЦЫ)         */
/* ========================================================================= */

export const IconCheck: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconCross: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconArrowRight: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const IconArrowLeft: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const IconChevronDown: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const IconChevronUp: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const IconPlay: React.FC<{ className?: string; fill?: boolean }> = ({ className = "w-4 h-4", fill = false }) => (
  <svg viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export const IconPause: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

export const IconMic: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

export const IconMicOff: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

export const IconUpload: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const IconUsers: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IconLogOut: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const IconClock: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const IconFileText: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const IconMaximize: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

export const IconSend: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const IconDownload: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const IconRadio: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);

export const IconSparkles: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.886a2 2 0 0 0 1.272 1.272L21 12l-5.816 1.842a2 2 0 0 0-1.272 1.272L12 21l-1.912-5.886a2 2 0 0 0-1.272-1.272L3 12l5.816-1.842a2 2 0 0 0 1.272-1.272L12 3z" />
  </svg>
);

export const IconCopy: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const IconSun: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export const IconMoon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const IconVolume: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

export const IconVolumeMute: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

export const IconRefresh: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
