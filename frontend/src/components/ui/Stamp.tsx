import React from 'react';
import { motion } from 'framer-motion';

export interface StampProps {
  label?: string;
  variant?: 'green' | 'red' | 'blue';
  rotate?: number;
  className?: string;
  animate?: boolean;
}

export const Stamp: React.FC<StampProps> = ({
  label = 'ПРОВЕРЕНО',
  variant = 'green',
  rotate = -6,
  className = '',
  animate = true
}) => {
  const colorStyles = {
    green: 'border-stamp-green text-stamp-green',
    red: 'border-pen-red text-pen-red',
    blue: 'border-blue text-blue',
  }[variant];

  const content = (
    <div
      style={{ transform: `rotate(${rotate}deg)` }}
      className={`
        inline-flex flex-col items-center justify-center select-none
        border-3 border-dashed rounded-full px-4 py-2 font-heading font-black
        text-xs tracking-widest uppercase transition-transform
        ${colorStyles}
        ${className}
      `}
    >
      <div className="border border-current rounded-full px-2.5 py-0.5 flex items-center gap-1.5">
        <span>★</span>
        <span>{label}</span>
        <span>★</span>
      </div>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ scale: 1.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 18 
      }}
      className="inline-block"
    >
      {content}
    </motion.div>
  );
};
