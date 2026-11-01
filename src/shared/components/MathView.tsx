import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathViewProps {
  latex?: string;
  math?: string;
  displayMode?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({
  latex,
  math,
  displayMode = false,
  className = '',
}) => {
  const expr = latex || math || '';

  const html = useMemo(() => {
    try {
      return katex.renderToString(expr, {
        throwOnError: false,
        displayMode,
      });
    } catch {
      return expr;
    }
  }, [expr, displayMode]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  const html = useMemo(() => {
    if (!text) return '';
    return text.replace(/\$([^\$]+)\$/g, (_, m) => {
      try {
        return katex.renderToString(m, { throwOnError: false });
      } catch {
        return m;
      }
    });
  }, [text]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};
