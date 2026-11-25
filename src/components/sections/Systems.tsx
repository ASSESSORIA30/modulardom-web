'use client';
import { useEffect, useRef, useState } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { Words } from '@/components/ui/Words';
import type { Dictionary, SystemId } from '@/content/i18n';

/*
  Two ways to build a wall, drawn the way an architect would draw them: in section.
  The drawings are schematic (no dimensions, no performance figures) and draw themselves when
  their system is chosen.
*/

const ORDER: SystemId[] = ['cellular', 'timber'];

/** a wall of aerated-concrete blocks, laid in bond, rendered on both faces */
function CellularDrawing() {
  const rows = 7;
  const lines: React.ReactNode[] = [];
  for (let r = 0; r <= rows; r++) {
    const y = 40 + r * 40;
    lines.push(<line key={`h${r}`} x1="150" y1={y} x2="330" y2={y} pathLength={1} style={{ '--d': r } as React.CSSProperties} />);
    if (r < rows) {
      const xs = r % 2 ? [210, 270] : [240];
      xs.forEach((x) => lines.push(<line key={`v${r}-${x}`} x1={x} y1={y} x2={x} y2={y + 40} pathLength={1} style={{ '--d': r + 2 } as React.CSSProperties} />));
    }
  }
  return (
    <>
      <rect x="150" y="40" width="180" height="280" pathLength={1} />
      {lines}
      <line className="thin" x1="138" y1="40" x2="138" y2="320" pathLength={1} style={{ '--d': 6 } as React.CSSProperties} />
      <line className="thin" x1="342" y1="40" x2="342" y2="320" pathLength={1} style={{ '--d': 6 } as React.CSSProperties} />
      <path d="M60 320 H420" pathLength={1} style={{ '--d': 8 } as React.CSSProperties} />
      <path className="thin" d="M60 336 H420 M100 320 V356 M380 320 V356" pathLength={1} style={{ '--d': 10 } as React.CSSProperties} />
    </>
  );
}

/** a light timber frame: plates, studs, insulation between them, boards on both faces */
function TimberDrawing() {
  const studs = [150, 210, 270, 330];
  return (
    <>
      <rect x="140" y="40" width="200" height="14" pathLength={1} />
      <rect x="140" y="306" width="200" height="14" pathLength={1} />
      {studs.map((x, i) => (
        <rect key={x} x={x - 7} y="54" width="14" height="252" pathLength={1} style={{ '--d': i + 1 } as React.CSSProperties} />
      ))}
      {studs.slice(0, -1).map((x, i) => (
        <polyline
          key={`i${x}`}
          className="thin"
          points={Array.from({ length: 15 }, (_, k) => `${x + 12 + (k % 2) * 36},${62 + k * 17}`).join(' ')}
          pathLength={1}
          style={{ '--d': i + 5 } as React.CSSProperties}
        />
      ))}
      <line className="thin" x1="128" y1="40" x2="128" y2="320" pathLength={1} style={{ '--d': 8 } as React.CSSProperties} />
      <line className="thin" x1="352" y1="40" x2="352" y2="320" pathLength={1} style={{ '--d': 8 } as React.CSSProperties} />
      <path d="M60 320 H420" pathLength={1} style={{ '--d': 9 } as React.CSSProperties} />
      <path className="thin" d="M60 336 H420 M100 320 V356 M380 320 V356" pathLength={1} style={{ '--d': 11 } as React.CSSProperties} />
    </>
  );
}

export function Systems({ dict }: { dict: Dictionary }) {
  const [active, setActive] = useState<SystemId>('cellular');
  const [seen, setSeen] = useState(false);
  const figure = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.35 });
    io.observe(figure.current!);
    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-ink text-paper" data-theme="dark" aria-labelledby="sistemes">
      <div className="wrap grid gap-y-12 py-24 md:grid-cols-12 md:gap-x-10 md:py-40">
        <Reveal as="header" className="md:col-span-5">
          <p className="t-note mb-5 text-water-light" data-fade>
            {dict.systems.name}
          </p>
          <h2 id="sistemes" className="t-title">
            <Words text={dict.systems.title} />
          </h2>
          <p className="t-lead mt-5 max-w-[40ch] text-paper/75" data-fade style={{ '--i': 1 } as React.CSSProperties}>
            {dict.systems.text}
          </p>
        </Reveal>

        <div ref={figure} className="relative md:col-span-6 md:col-start-7 md:row-span-2">
          <div className="relative aspect-[6/5] border border-paper/15">
            {ORDER.map((id) => (
              <svg
                key={id}
                viewBox="0 0 480 400"
                className="draw absolute inset-0 h-full w-full text-paper"
                data-on={seen && active === id ? '' : undefined}
                style={{ opacity: active === id ? 1 : 0, transition: 'opacity 300ms var(--ease-out)' }}
                aria-hidden="true"
              >
                {id === 'cellular' ? <CellularDrawing /> : <TimberDrawing />}
              </svg>
            ))}
          </div>
        </div>

        <div className="md:col-span-5 md:self-end">
          {ORDER.map((id) => {
            const item = dict.systems.items[id];
            const on = active === id;
            return (
              <div key={id} className="border-t border-paper/20 last:border-b">
                <button
                  type="button"
                  id={`tab-${id}`}
                  aria-expanded={on}
                  aria-controls={`panel-${id}`}
                  onClick={() => setActive(id)}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(id)}
                  onFocus={() => setActive(id)}
                  className={`flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left font-display text-[clamp(1.4rem,1.1rem+1.1vw,2rem)] leading-tight transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-60'}`}
                >
                  {item.name}
                  <span className={`block h-px w-8 origin-right bg-current transition-transform duration-500 ease-out ${on ? 'scale-x-100' : 'scale-x-[0.35]'}`} aria-hidden="true" />
                </button>
                <div
                  id={`panel-${id}`}
                  role="region"
                  aria-labelledby={`tab-${id}`}
                  hidden={!on}
                  className="pb-6"
                  style={on ? { animation: 'swap 420ms var(--ease-out)' } : undefined}
                >
                  <p className="max-w-[42ch] text-paper/80">{item.text}</p>
                  <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[0.9375rem] text-water-light">
                    {item.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
