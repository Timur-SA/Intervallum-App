import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathViewProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ latex, displayMode = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode
      });
    } catch {
      return latex;
    }
  }, [latex, displayMode]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  const html = useMemo(() => {
    if (!text) return '';
    return text.replace(/\$([^\$]+)\$/g, (_, math) => {
      try {
        return katex.renderToString(math, { throwOnError: false });
      } catch {
        return math;
      }
    });
  }, [text]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};
