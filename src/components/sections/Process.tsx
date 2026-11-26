'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lines } from '@/components/ui/Lines';
import { Reveal } from '@/components/ui/Reveal';
import type { Dictionary } from '@/content/i18n';

gsap.registerPlugin(ScrollTrigger);

/*
  Six steps told as one drawing. The elevation of a house stays on screen while the steps pass
  beside it, and each step draws its part: the plot, the sketch, the measures, the project, the
  structure, and at the end the windows lit. Scroll back and it un-draws.
*/

const N = 6;

function Elevation() {
  const courses = Array.from({ length: 6 }, (_, i) => 254 + i * 14);
  const studs = Array.from({ length: 13 }, (_, i) => 196 + i * 16);
  const ticks = Array.from({ length: 17 }, (_, i) => 180 + i * 20);
  return (
    <svg viewBox="0 0 640 420" className="draw h-auto w-full text-ink" aria-hidden="true">
      {/* 1 · the plot */}
      <g data-part>
        <path d="M24 340 H616" pathLength={1} />
        <path className="thin" d="M24 352 H616" pathLength={1} />
        <circle cx="96" cy="286" r="7" pathLength={1} />
        <path d="M96 293 V340" pathLength={1} />
      </g>
      {/* 2 · the sketch */}
      <g data-part>
        <rect className="thin" x="180" y="240" width="320" height="100" pathLength={1} />
        <rect className="thin" x="180" y="150" width="220" height="90" pathLength={1} />
        <path className="thin" d="M180 120 H400 M180 112 V128 M400 112 V128" pathLength={1} />
        <path className="thin" d="M532 240 V340 M524 240 H540 M524 340 H540" pathLength={1} />
      </g>
      {/* 3 · the measures */}
      <g data-part>
        {ticks.map((x) => (
          <line key={x} className="thin" x1={x} y1="364" x2={x} y2={x % 100 === 80 ? 378 : 372} pathLength={1} />
        ))}
        <path d="M180 388 H500 M180 380 V396 M500 380 V396" pathLength={1} />
      </g>
      {/* 4 · the project */}
      <g data-part>
        <path d="M180 340 V240 H500 V340" pathLength={1} />
        <path d="M180 240 V150 H400 V240" pathLength={1} />
        <path d="M166 150 H414 V141 H166 Z" pathLength={1} />
        <path d="M400 240 H514 V231 H400" pathLength={1} />
        <rect className="thin" x="548" y="368" width="68" height="34" pathLength={1} />
        <path className="thin" d="M548 380 H616 M548 391 H616 M586 380 V402" pathLength={1} />
      </g>
      {/* 5 · the structure */}
      <g data-part>
        {courses.map((y, i) => (
          <path key={y} className="thin" d={`M180 ${y} H500${Array.from({ length: 7 }, (_, k) => ` M${200 + k * 44 + (i % 2) * 22} ${y} v14`).join('')}`} pathLength={1} />
        ))}
        {studs.map((x) => (
          <line key={x} className="thin" x1={x} y1="150" x2={x} y2="240" pathLength={1} />
        ))}
      </g>
      {/* 6 · the house, lived in */}
      <g data-part>
        <rect data-glow x="200" y="258" width="170" height="74" pathLength={1} />
        <rect data-glow x="200" y="166" width="150" height="62" pathLength={1} />
        <path d="M285 258 V332 M275 166 V228" pathLength={1} />
        <rect x="412" y="262" width="42" height="78" pathLength={1} />
        <path d="M446 300 v8" pathLength={1} />
        <path d="M96 340 V300 M96 312 q-18 -6 -22 -22 M96 306 q16 -8 20 -22" pathLength={1} />
        <circle cx="96" cy="268" r="26" pathLength={1} />
      </g>
    </svg>
  );
}

export function Process({ dict }: { dict: Dictionary }) {
  const list = useRef<HTMLOListElement>(null);
  const drawing = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const parts = [...drawing.current!.querySelectorAll<SVGGElement>('[data-part]')];
    const set = (p: number) => {
      parts.forEach((g, i) => g.style.setProperty('--k', Math.min(1, Math.max(0, p * N - i)).toFixed(4)));
      setStep(Math.min(N - 1, Math.floor(p * N)));
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      set(1);
      return;
    }
    const st = ScrollTrigger.create({ trigger: list.current, start: 'top 62%', end: 'bottom 58%', onUpdate: (self) => set(self.progress) });
    return () => st.kill();
  }, []);

  return (
    <section className="bg-paper text-ink" data-theme="light" aria-labelledby="proces">
      <div className="wrap grid gap-y-8 border-t border-ink/15 pb-24 pt-24 md:grid-cols-12 md:gap-x-10 md:pb-40 md:pt-40">
        <div className="md:col-span-7">
          <div className="top-0 z-10 bg-paper max-md:sticky max-md:-mx-[var(--edge)] max-md:px-[var(--edge)] max-md:pb-3 max-md:pt-[calc(var(--header-h)+0.25rem)] md:sticky md:top-[17svh]">
            <Reveal as="header" className="max-md:hidden">
              <p className="t-note mb-5 text-oak" data-fade>
                {dict.process.name}
              </p>
              <h2 id="proces" className="t-title">
                <Lines lines={dict.process.title} />
              </h2>
              <p className="t-lead mt-5 max-w-[36ch] text-ink/75" data-fade style={{ '--i': 2 } as React.CSSProperties}>
                {dict.process.text}
              </p>
            </Reveal>
            <div ref={drawing} className="process-drawing md:mt-10 md:max-w-[44rem]">
              <Elevation />
            </div>
          </div>
        </div>

        <div className="md:col-span-4 md:col-start-9">
          <h2 className="t-title mb-8 md:hidden">{dict.process.title.join(' ').replace(/\*/g, '')}</h2>
          <ol ref={list}>
            {dict.process.steps.map((s, i) => (
              <li key={s.name} data-on={i <= step ? '' : undefined} aria-current={i === step ? 'step' : undefined} className="group flex min-h-[34svh] flex-col justify-center border-t border-ink/15 py-8 opacity-80 transition-opacity duration-500 ease-out last:border-b data-[on]:opacity-100 md:min-h-[44svh]">
                <span className="t-serif t-num text-[2.6rem] leading-none text-ink/80 transition-colors duration-500 group-data-[on]:text-oak md:text-[3.4rem]">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="t-serif mt-4 text-[1.7rem] leading-tight md:text-[2.1rem]">{s.name}</h3>
                <p className="t-lead mt-2 max-w-[30ch] text-ink">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
