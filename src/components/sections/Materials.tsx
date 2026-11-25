'use client';
import { useRef, useState } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { Still } from '@/components/ui/Still';
import { Words } from '@/components/ui/Words';
import type { Dictionary, MaterialId } from '@/content/i18n';

const ORDER: MaterialId[] = ['traverti', 'roure', 'vidre', 'pedra'];

/** Choose a material; its picture wipes in over the last one, like a sample laid on a table. */
export function Materials({ dict }: { dict: Dictionary }) {
  const [active, setActive] = useState(0);
  const prev = useRef(0);
  const pick = (i: number) => {
    if (i === active) return;
    prev.current = active;
    setActive(i);
  };

  return (
    <section className="bg-stone text-ink" data-theme="light" aria-labelledby="materials">
      <div className="wrap grid gap-y-12 py-24 md:grid-cols-12 md:gap-x-10 md:py-40">
        <div className="relative md:col-span-5 md:row-span-2">
          <Reveal className="md:sticky md:top-28">
            <div className="relative aspect-[4/5] overflow-hidden bg-stone-deep" data-unveil>
              {ORDER.map((id, i) => (
                <Still
                  key={id}
                  name={`mat-${id}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  // the chosen one wipes in on top; the one before waits underneath until it is covered
                  style={{
                    zIndex: i === active ? 2 : i === prev.current ? 1 : 0,
                    clipPath: i === active || i === prev.current ? 'inset(0)' : 'inset(100% 0 0 0)',
                    transition: i === active ? 'clip-path 800ms var(--ease-in-out)' : 'clip-path 0s 800ms',
                  }}
                />
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal as="header" className="md:col-span-6 md:col-start-7">
          <p className="t-note mb-5 text-oak" data-fade>
            {dict.materials.name}
          </p>
          <h2 id="materials" className="t-title">
            <Words text={dict.materials.title} />
          </h2>
          <p className="t-lead mt-5 max-w-[42ch] text-ink/75" data-fade style={{ '--i': 1 } as React.CSSProperties}>
            {dict.materials.text}
          </p>
        </Reveal>

        <ul className="md:col-span-6 md:col-start-7 md:self-end">
          {ORDER.map((id, i) => {
            const item = dict.materials.items[id];
            const on = i === active;
            return (
              <li key={id} className="border-t border-ink/20 last:border-b">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(i)}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && pick(i)}
                  onFocus={() => pick(i)}
                  className="group grid min-h-[4.5rem] w-full grid-cols-[1fr_auto] items-center gap-x-6 py-4 text-left md:grid-cols-[minmax(9rem,14rem)_1fr]"
                >
                  <span className={`font-display text-[clamp(1.5rem,1.15rem+1.3vw,2.25rem)] leading-none transition-[opacity,transform] duration-500 ease-out ${on ? 'translate-x-3 opacity-100' : 'opacity-60'}`}>
                    {item.name}
                  </span>
                  <span className={`text-[0.9375rem] text-ink/75 transition-opacity duration-300 max-md:col-span-2 max-md:mt-1 ${on ? 'opacity-100' : 'opacity-0 max-md:hidden'}`}>
                    {item.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
