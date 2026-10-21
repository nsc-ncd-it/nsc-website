'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';

type Props = {
  text: string;
  className?: string;
};

function renderMath(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
    });
  } catch {
    return '';
  }
}

// Write equations between dollar signs.
//   Inline:  $x^2 + 5x + 6 = 0$
//   Big/centered:  $$\frac{a}{b}$$
export default function MathText({ text, className }: Props) {
  const parts = (text || '').split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) => {
        if (part.length > 4 && part.startsWith('$$') && part.endsWith('$$')) {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{
                __html: renderMath(part.slice(2, -2), true),
              }}
            />
          );
        }

        if (part.length > 2 && part.startsWith('$') && part.endsWith('$')) {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{
                __html: renderMath(part.slice(1, -1), false),
              }}
            />
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
