'use client';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { Words } from '@/components/ui/Words';
import type { Dictionary, Locale } from '@/content/i18n';

/*
  Three first decisions. They write a sentence and travel to the configurator in the link.
  Each control is a radio group; the dark chip that marks the choice is a copy of the row,
  clipped to the chosen option, so text and ground change colour as one piece.
*/

function Choice({ label, options, value, onChange }: { label: string; options: string[]; value: number; onChange: (i: number) => void }) {
  const row = useRef<HTMLDivElement>(null);
  const [clip, setClip] = useState('inset(0 100% 0 0)');
  useLayoutEffect(() => {
    const measure = () => {
      const el = row.current!;
      const b = el.querySelectorAll<HTMLElement>('[role="radio"]')[value];
      if (!b) return;
      const right = el.offsetWidth - b.offsetLeft - b.offsetWidth;
      const bottom = el.offsetHeight - b.offsetTop - b.offsetHeight;
      setClip(`inset(${b.offsetTop}px ${right}px ${bottom}px ${b.offsetLeft}px)`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row.current!);
    return () => ro.disconnect();
  }, [value, options]);

  const key = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (value + d + options.length) % options.length;
    onChange(next);
    row.current!.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  const cells = (ghost: boolean) =>
    options.map((o, i) =>
      ghost ? (
        <span key={o} className="flex min-h-12 items-center justify-center px-5">
          {o}
        </span>
      ) : (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={i === value}
          tabIndex={i === value ? 0 : -1}
          onClick={() => onChange(i)}
          className="flex min-h-12 items-center justify-center px-5 transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          {o}
        </button>
      ),
    );

  return (
    <div className="grid gap-3 border-t border-ink/20 py-5 md:grid-cols-[9rem_1fr] md:items-center">
      <span className="text-[0.9375rem] text-ink/70" id={`cfg-${label}`}>
        {label}
      </span>
      <div className="relative w-fit max-w-full text-[0.9375rem] font-medium">
        <div ref={row} role="radiogroup" aria-labelledby={`cfg-${label}`} onKeyDown={key} className="flex flex-wrap border border-ink/25">
          {cells(false)}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-wrap border border-ink bg-ink text-paper" style={{ clipPath: clip, transition: 'clip-path 260ms var(--ease-out)' }}>
          {cells(true)}
        </div>
      </div>
    </div>
  );
}

export function Configurator({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const c = dict.configurator;
  const [floors, setFloors] = useState(1);
  const [bedrooms, setBedrooms] = useState(1);
  const [system, setSystem] = useState(2);
  const sentence = c.summary
    .replace('{floors}', c.floorsPhrase[floors])
    .replace('{bedrooms}', c.bedroomsPhrase[bedrooms])
    .replace('{system}', c.systemPhrase[system]);
  const href = `/${lang}/configurador?plantes=${floors + 1}&dormitoris=${bedrooms + 2}&sistema=${['cellular', 'fusta', 'obert'][system]}`;

  return (
    <section className="bg-paper text-ink" data-theme="light" aria-labelledby="configurador">
      <div className="wrap grid gap-y-12 py-24 md:grid-cols-12 md:gap-x-10 md:py-40">
        <Reveal as="header" className="md:col-span-4">
          <p className="t-note mb-5 text-oak" data-fade>
            {c.name}
          </p>
          <h2 id="configurador" className="t-title">
            <Words text={c.title} />
          </h2>
          <p className="t-lead mt-5 max-w-[32ch] text-ink/75" data-fade style={{ '--i': 1 } as React.CSSProperties}>
            {c.text}
          </p>
        </Reveal>

        <div className="md:col-span-7 md:col-start-6">
          <Choice label={c.floors.label} options={c.floors.options} value={floors} onChange={setFloors} />
          <Choice label={c.bedrooms.label} options={c.bedrooms.options} value={bedrooms} onChange={setBedrooms} />
          <Choice label={c.system.label} options={c.system.options} value={system} onChange={setSystem} />
          <div className="border-t border-ink/20 pt-9">
            <p key={sentence} aria-live="polite" className="font-display text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] leading-[1.15] [text-wrap:balance]" style={{ animation: 'swap 300ms var(--ease-out)' }}>
              {sentence}
            </p>
            <Link href={href} className="btn btn-ink mt-8">
              {dict.ui.configure}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
