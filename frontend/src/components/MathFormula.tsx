import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({ 
  formula, 
  displayMode = true,
  className = '' 
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: displayMode,
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return `<code class="text-amber-400">${formula}</code>`;
    }
  }, [formula, displayMode]);

  return (
    <div 
      className={`katex-render-container ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
