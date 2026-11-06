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
      return null;
    }
  }, [expr, displayMode]);

  if (html === null) return <span className={className}>{expr}</span>;

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => (
  <span className={className}>
    {text.split(/\$([^$]+)\$/g).map((part, index) =>
      index % 2 ? <MathView key={index} latex={part} /> : part,
    )}
  </span>
);
