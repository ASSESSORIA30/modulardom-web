'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HouseCanvas } from '@/components/house3d/HouseCanvas';
import type { HouseConfig, HouseScene } from '@/components/house3d/scene';
import { Lines } from '@/components/ui/Lines';
import { Reveal } from '@/components/ui/Reveal';
import type { Dictionary, Locale } from '@/content/i18n';

/*
  The configurator, as a first sketch of the house: seven decisions on the right, the model on the
  left answering each one (footprint, floors, structure, finish, extras). Drag the model to turn it.

  No prices and no formulas: ModularDom's current site has no calculator to carry over, and none
  is invented here. The choices travel to /configurador in the link, ready for the real one.
*/

const SURFACE = { min: 80, max: 400, step: 10, initial: 180 };

type State = { surface: number; floors: number; bedrooms: number; system: number; style: number; finishes: number; extras: boolean[] };

function Options({ label, options, value, onChange }: { label: string; options: string[]; value: number; onChange: (i: number) => void }) {
  const row = useRef<HTMLDivElement>(null);
  const key = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (value + d + options.length) % options.length;
    onChange(next);
    row.current!.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };
  return (
    <div ref={row} role="radiogroup" aria-label={label} onKeyDown={key} className="flex flex-wrap gap-2">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={i === value}
          tabIndex={i === value ? 0 : -1}
          onClick={() => onChange(i)}
          className={`min-h-11 border px-4 text-[0.9375rem] font-medium transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.97] ${i === value ? 'border-paper bg-paper text-ink' : 'border-paper/30 hover:border-paper'}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Configurator({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const c = dict.configurator;
  const scene = useRef<HouseScene | null>(null);
  const [open, setOpen] = useState(0);
  const [s, setS] = useState<State>({ surface: SURFACE.initial, floors: 1, bedrooms: 1, system: 0, style: 0, finishes: 0, extras: [false, false, false, false, false] });
  const set = (patch: Partial<State>) => setS((v) => ({ ...v, ...patch }));

  const toScene = useCallback(
    (): Partial<HouseConfig> => ({
      floors: s.floors === 0 ? 1 : 2,
      width: 0.8 + ((s.surface - SURFACE.min) / (SURFACE.max - SURFACE.min)) * 0.55,
      system: s.system === 1 ? 'timber' : 'cellular',
      finish: s.finishes === 1 ? 'wood' : 'mineral',
      pool: s.extras[0],
      porch: s.extras[1],
      garage: s.extras[2],
      solar: s.extras[4],
    }),
    [s],
  );
  useEffect(() => {
    scene.current?.setConfig(toScene());
  }, [toScene]);

  // drag to turn the model; it keeps the angle you leave it at
  const turn = useRef({ at: 0, start: 0, base: 0, down: false });
  const onReady = useCallback(
    (sc: HouseScene) => {
      scene.current = sc;
      sc.setConfig(toScene());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const drag = {
    onPointerDown: (e: React.PointerEvent) => {
      turn.current = { ...turn.current, down: true, start: e.clientX, base: turn.current.at };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!turn.current.down) return;
      turn.current.at = turn.current.base - (e.clientX - turn.current.start) * 0.006;
      scene.current?.setTurn(turn.current.at);
    },
    onPointerUp: () => (turn.current.down = false),
    onPointerCancel: () => (turn.current.down = false),
  };

  const extras = c.extras.options.filter((_, i) => s.extras[i]);
  const rows: { label: string; value: string; body: React.ReactNode }[] = [
    {
      label: c.surface.label,
      value: `${s.surface} ${c.surface.unit}`,
      body: (
        <label className="block">
          <span className="sr-only">{c.surface.label}</span>
          <input
            type="range"
            min={SURFACE.min}
            max={SURFACE.max}
            step={SURFACE.step}
            value={s.surface}
            onChange={(e) => set({ surface: +e.target.value })}
            aria-valuetext={`${s.surface} ${c.surface.unit}`}
            className="range w-full"
            style={{ '--fill': `${((s.surface - SURFACE.min) / (SURFACE.max - SURFACE.min)) * 100}%` } as React.CSSProperties}
          />
          <span className="t-note mt-2 block text-paper/70">{c.surface.hint}</span>
        </label>
      ),
    },
    { label: c.floors.label, value: c.floors.options[s.floors], body: <Options {...c.floors} value={s.floors} onChange={(i) => set({ floors: i })} /> },
    { label: c.bedrooms.label, value: c.bedrooms.options[s.bedrooms], body: <Options {...c.bedrooms} value={s.bedrooms} onChange={(i) => set({ bedrooms: i })} /> },
    { label: c.system.label, value: c.system.options[s.system], body: <Options {...c.system} value={s.system} onChange={(i) => set({ system: i })} /> },
    { label: c.style.label, value: c.style.options[s.style], body: <Options {...c.style} value={s.style} onChange={(i) => set({ style: i })} /> },
    { label: c.finishes.label, value: c.finishes.options[s.finishes], body: <Options {...c.finishes} value={s.finishes} onChange={(i) => set({ finishes: i })} /> },
    {
      label: c.extras.label,
      value: extras.length ? extras.join(', ') : c.none,
      body: (
        <div>
          <div className="flex flex-wrap gap-2">
            {c.extras.options.map((o, i) => (
              <button
                key={o}
                type="button"
                aria-pressed={s.extras[i]}
                onClick={() => set({ extras: s.extras.map((v, k) => (k === i ? !v : v)) })}
                className={`min-h-11 border px-4 text-[0.9375rem] font-medium transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.97] ${s.extras[i] ? 'border-paper bg-paper text-ink' : 'border-paper/30 hover:border-paper'}`}
              >
                {o}
              </button>
            ))}
          </div>
          <span className="t-note mt-2 block text-paper/70">{c.extras.hint}</span>
        </div>
      ),
    },
  ];

  const q = new URLSearchParams({
    superficie: String(s.surface),
    plantes: String(s.floors + 1),
    habitacions: String(s.bedrooms + 2),
    sistema: ['cellular', 'fusta', 'obert'][s.system],
    estil: ['contemporani', 'mediterrani', 'obert'][s.style],
    acabats: ['mineral', 'fusta', 'obert'][s.finishes],
    extres: ['piscina', 'porxo', 'garatge', 'domotica', 'solar'].filter((_, i) => s.extras[i]).join('-'),
  });

  return (
    <section className="bg-ink text-paper" data-theme="dark" aria-labelledby="configurador">
      <div className="grid md:min-h-[100svh] md:grid-cols-12">
        {/* the stage */}
        <div className="relative h-[46svh] overflow-hidden bg-ink text-paper md:sticky md:top-0 md:col-span-7 md:h-[100svh]">
          {/* a studio floor of light, as in a car configurator */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_46%_at_50%_62%,rgb(244_240_232/0.13),transparent_72%)]" aria-hidden="true" />
          <div className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing" {...drag}>
            <HouseCanvas mode="config" className="h-full w-full" label={c.name} fallback={dict.systems.fallback} onReady={onReady} />
          </div>
          <p className="tag pointer-events-none absolute bottom-5 left-[var(--edge)] text-paper/70">{dict.ui.concept}</p>
          <p className="t-note pointer-events-none absolute bottom-5 right-5 text-paper/70 max-md:hidden">{dict.ui.drag}</p>
        </div>

        {/* the decisions */}
        <div className="wrap py-14 md:col-span-5 md:py-28 md:pl-[3.5vw]">
          <Reveal as="header">
            <p className="t-note mb-5 text-water-light" data-fade>
              {c.name}
            </p>
            <h2 id="configurador" className="t-title">
              <Lines lines={c.title} />
            </h2>
            <p className="t-lead mt-5 max-w-[34ch] text-paper/75" data-fade style={{ '--i': 2 } as React.CSSProperties}>
              {c.text}
            </p>
          </Reveal>

          <ol className="mt-10">
            {rows.map((r, i) => {
              const on = open === i;
              return (
                <li key={r.label} className="border-t border-paper/20 last:border-b">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={on}
                      aria-controls={`cfg-${i}`}
                      onClick={() => setOpen(on ? -1 : i)}
                      className="grid min-h-[3.5rem] w-full grid-cols-[2rem_1fr_auto] items-baseline gap-x-2 py-3 text-left"
                    >
                      <span className="t-note t-num text-paper/70">{String(i + 1).padStart(2, '0')}</span>
                      <span className="t-serif text-[1.3rem] leading-tight">{r.label}</span>
                      <span className={`max-w-[11rem] truncate text-right text-[0.9375rem] transition-opacity duration-300 ${on ? 'opacity-0' : 'text-paper/75'}`}>{r.value}</span>
                    </button>
                  </h3>
                  <div id={`cfg-${i}`} inert={!on} className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out)] ${on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="pb-5 pl-[2.5rem] pt-1">
                        {r.body}
                        {i < rows.length - 1 && (
                          <button type="button" onClick={() => setOpen(i + 1)} className="link mt-3 text-[0.875rem]">
                            {c.step} {i + 2}: {rows[i + 1].label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="t-note mt-6 max-w-[40ch] text-paper/70">{c.noPrice}</p>
          <Link href={`/${lang}/configurador?${q}`} className="btn btn-paper mt-6">
            {c.send}
          </Link>
        </div>
      </div>
    </section>
  );
}
