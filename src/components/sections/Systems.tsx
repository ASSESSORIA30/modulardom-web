'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HouseCanvas } from '@/components/house3d/HouseCanvas';
import type { HouseScene } from '@/components/house3d/scene';
import { Lines } from '@/components/ui/Lines';
import { Reveal } from '@/components/ui/Reveal';
import type { Dictionary, LayerId, SystemId } from '@/content/i18n';
import { scrollToY } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/*
  The house taken apart. The section holds the screen while the scroll peels the layers off, from
  the finishes inwards to the foundation; the list names the layer that has just come away.
  Hovering or focusing a name isolates that layer; choosing a system swaps the structure.
*/

// in the order they leave the house, with the scroll position where each one is the subject
const ORDER: { id: LayerId; at: number }[] = [
  { id: 'finishes', at: 0.17 },
  { id: 'roof', at: 0.29 },
  { id: 'insulation', at: 0.43 },
  { id: 'envelope', at: 0.56 },
  { id: 'services', at: 0.68 },
  { id: 'structure', at: 0.8 },
  { id: 'foundation', at: 0.94 },
];
const layerAt = (t: number): LayerId | null => {
  if (t < 0.06) return null;
  let cur = ORDER[0].id;
  for (let i = 1; i < ORDER.length; i++) if (t >= (ORDER[i - 1].at + ORDER[i].at) / 2) cur = ORDER[i].id;
  return cur;
};
const SYSTEMS: SystemId[] = ['cellular', 'timber'];

export function Systems({ dict }: { dict: Dictionary }) {
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const scene = useRef<HouseScene | null>(null);
  const hover = useRef<LayerId | null>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [system, setSystem] = useState<SystemId>('cellular');
  const [active, setActive] = useState<LayerId | null>(null);
  const [started, setStarted] = useState(false);
  const s = dict.systems;

  const onReady = useCallback(
    (sc: HouseScene) => {
      scene.current = sc;
      if (reduced) {
        // no scroll-driven motion: show the house already open
        sc.setProgress(0.62);
        setStarted(true);
        return;
      }
      let cur: LayerId | null = null;
      const st = ScrollTrigger.create({
        trigger: track.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const t = self.progress;
          sc.setProgress(t);
          if (bar.current) bar.current.style.transform = `scaleX(${t.toFixed(4)})`;
          const next = layerAt(t);
          if (next !== cur) {
            cur = next;
            setActive(next);
            setStarted(t > 0.03);
            if (!hover.current) sc.setFocus(next);
          }
        },
      });
      return () => st.kill();
    },
    [reduced],
  );

  useEffect(() => {
    scene.current?.setConfig({ system });
  }, [system]);

  const focus = (id: LayerId | null) => {
    hover.current = id;
    scene.current?.setFocus(id ?? active);
  };
  const jump = (at: number, id: LayerId) => {
    if (reduced) {
      setActive(id);
      scene.current?.setFocus(id);
      return;
    }
    const el = track.current!;
    const top = el.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + at * (el.offsetHeight - window.innerHeight), 1.2);
  };

  return (
    <section className="bg-ink text-paper" data-theme="dark" aria-labelledby="sistemes">
      <div ref={track} className={reduced ? '' : 'h-[440lvh]'}>
        <div className={`${reduced ? 'relative min-h-svh' : 'sticky top-0 h-[100lvh]'} overflow-hidden`}>
          {/* the stage: the house sits right of centre and bleeds off the edge */}
          <div className="absolute inset-x-0 top-[9svh] h-[46svh] md:inset-y-0 md:left-[34%] md:right-[-4%] md:top-0 md:h-auto">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_58%,rgb(244_240_232/0.09),transparent_70%)]" aria-hidden="true" />
            <HouseCanvas mode="layers" className="h-full w-full" label={s.name} fallback={s.fallback} onReady={onReady} />
          </div>

          <div className="wrap relative flex h-[100svh] flex-col justify-end pb-6 pt-[calc(var(--header-h)+0.5rem)] md:justify-center md:pb-0">
            <div className="md:w-[min(40%,30rem)]">
              <Reveal as="header" className="max-md:hidden">
                <p className="t-note mb-4 text-gold-light" data-fade>
                  {s.name}
                </p>
                <h2 id="sistemes" className="t-title">
                  <Lines lines={s.title} />
                </h2>
                <p className="mt-4 max-w-[38ch] text-paper/75" data-fade style={{ '--i': 2 } as React.CSSProperties}>
                  {s.text}
                </p>
              </Reveal>
              <h2 className="t-title md:hidden" aria-hidden="true">
                {s.title.join(' ').replace(/\*/g, '')}
              </h2>

              {/* the two systems: the structure of the model follows the choice */}
              <div className="mt-5 flex border border-paper/25 text-[0.875rem] font-medium md:mt-8" role="radiogroup" aria-label={s.name}>
                {SYSTEMS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={system === id}
                    onClick={() => setSystem(id)}
                    className={`min-h-11 flex-1 px-3 transition-colors duration-300 active:scale-[0.98] ${system === id ? 'bg-paper text-ink' : 'text-paper/80 hover:text-paper'}`}
                  >
                    {s.items[id].name}
                  </button>
                ))}
              </div>

              <ol className="mt-4 md:mt-6" onPointerLeave={() => focus(null)}>
                {ORDER.map(({ id, at }, i) => {
                  const layer = s.layers[id];
                  const on = active === id;
                  const text = id === 'structure' ? layer[system] ?? layer.text : layer.text;
                  return (
                    <li key={id} className={`border-t border-paper/15 last:border-b ${on ? '' : 'max-md:hidden'}`}>
                      <button
                        type="button"
                        aria-current={on ? 'step' : undefined}
                        onClick={() => jump(at, id)}
                        onPointerEnter={(e) => e.pointerType === 'mouse' && focus(id)}
                        onFocus={() => focus(id)}
                        onBlur={() => focus(null)}
                        className="group grid w-full grid-cols-[2.25rem_1fr] items-baseline py-2 text-left md:py-[0.55rem]"
                      >
                        <span className={`t-note t-num transition-colors duration-300 ${on ? 'text-gold-light' : 'text-paper/70'}`}>{String(i + 1).padStart(2, '0')}</span>
                        <span>
                          <span className={`block font-display text-[1.3rem] leading-tight transition-[opacity,transform] duration-500 ease-[var(--ease-out)] md:text-[1.4rem] ${on ? 'translate-x-2 opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                            {layer.name}
                          </span>
                          {/* the row opens with a grid track, not a height: nothing to measure */}
                          <span className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out)] ${on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <span className="overflow-hidden">
                              <span className="block max-w-[36ch] translate-x-2 pb-1 pt-1 text-[0.9375rem] text-paper/75">{text}</span>
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-4 flex items-center gap-4 md:mt-6">
                <span className="relative block h-px flex-1 bg-paper/20" aria-hidden="true">
                  <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-gold-light" />
                </span>
                <p className={`t-note text-paper/70 transition-opacity duration-500 ${started ? 'opacity-0' : 'opacity-100'}`} aria-hidden={started}>
                  {s.hint}
                </p>
              </div>
              <p className="t-note mt-3 max-w-[44ch] text-paper/70">{s.note}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
