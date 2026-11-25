'use client';
import { useEffect, useRef } from 'react';

type Props = React.HTMLAttributes<HTMLElement> & { as?: 'div' | 'section' | 'header' | 'li'; amount?: number };

/** Marks its element data-in the first time it enters the viewport; the CSS does the rest. */
export function Reveal({ as = 'div', amount = 0.25, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.setAttribute('data-in', '');
          io.disconnect();
        }
      },
      { threshold: amount, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [amount]);
  const Tag = as as 'div';
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} data-reveal {...rest}>
      {children}
    </Tag>
  );
}
