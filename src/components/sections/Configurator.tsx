'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HouseCanvas } from '@/components/house3d/HouseCanvas';
import type { HouseConfig, HouseScene } from '@/components/house3d/scene';
import { Lines } from '@/components/ui/Lines';
import { Reveal } from '@/components/ui/Reveal';
import { LeadForm } from '@/components/ui/LeadForm';
import { href, type Dictionary, type Locale } from '@/content/i18n';
import { waHref } from '@/content/site';
import type { EngineInput } from '@/lib/configurator/engine';

/*
  The configurator: the model on the left, the decisions on the right, each one changing the model.

  Its questions are the ones ModularDom's own configurator asks today (surface, bedrooms,
  bathrooms, suite, kitchen, garage, climate, extras), so the answers map one to one onto the
  company's budget engine (src/lib/configurator/engine.ts). Three more (system, façade, roof) and
  the massing only change the model and are settled in the project.

  Prices: the browser never holds a tariff or a formula. It sends the choices to /api/quote and
  shows what comes back; while prices are switched off on the server, that is nothing, and the
  page says the budget is prepared by ModularDom's team.

  `full` (the /configurador page) adds the request form and the PDF dossier, and starts from the
  choices carried in the link.
*/

const SURFACE = { min: 100, max: 400, step: 10, initial: 180 };
const CLIMATE = ['aerotermia', 'aireConductos'];
const EXTRAS = ['piscina', 'porche', 'placasSolares']; // + safareig, which the engine counts with the interior

type State = {
  surface: number; floors: number; volume: number;
  bedrooms: number; bathrooms: number; suite: number; kitchen: number;
  vehicles: number; climate: boolean[]; extras: boolean[];
  system: number; facade: number; roof: number;
};
/** what the server lets a visitor see of a budget (src/server/quote.ts) */
type PublicQuote = { tariff: string; validDays: number; lines: { key: string; label: { ca: string; es: string }; detail?: { ca: string; es: string }; amountCents: number }[]; subtotalCents: number; vatWorksCents: number; vatArchitectCents: number; totalCents: number };

const INITIAL: State = { surface: SURFACE.initial, floors: 1, volume: 0, bedrooms: 3, bathrooms: 2, suite: 1, kitchen: 1, vehicles: 0, climate: [true, false], extras: [false, false, false, false], system: 0, facade: 0, roof: 0 };

const chip = (on: boolean) =>
  `min-h-11 border px-4 text-[0.9375rem] font-medium transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.97] ${on ? 'border-paper bg-paper text-ink' : 'border-paper/30 hover:border-paper'}`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[8.5rem_1fr] sm:items-center">
      <span className="text-[0.9375rem] text-paper/75">{label}</span>
      {children}
    </div>
  );
}

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
        <button key={o} type="button" role="radio" aria-checked={i === value} tabIndex={i === value ? 0 : -1} onClick={() => onChange(i)} className={chip(i === value)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Toggles({ label, options, value, onChange }: { label: string; options: string[]; value: boolean[]; onChange: (v: boolean[]) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o, i) => (
        <button key={o} type="button" aria-pressed={value[i]} onClick={() => onChange(value.map((v, k) => (k === i ? !v : v)))} className={chip(value[i])}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Stepper({ label, value, min, max, zero, onChange }: { label: string; value: number; min: number; max: number; zero?: string; onChange: (n: number) => void }) {
  return (
    <div role="group" aria-label={label} className="flex w-fit items-stretch border border-paper/30">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`${label} −1`} className="min-h-11 w-12 text-xl transition-[transform,opacity] duration-150 active:scale-90 disabled:opacity-30">
        −
      </button>
      <output className="t-num flex min-w-16 items-center justify-center border-x border-paper/30 px-3 text-[1.0625rem] font-medium" aria-live="polite">
        {value === 0 && zero ? zero : value}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`${label} +1`} className="min-h-11 w-12 text-xl transition-[transform,opacity] duration-150 active:scale-90 disabled:opacity-30">
        +
      </button>
    </div>
  );
}

const clampInt = (v: string | null, min: number, max: number, fallback: number) => {
  const n = v === null ? NaN : parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export function Configurator({ dict, lang, full = false }: { dict: Dictionary; lang: Locale; full?: boolean }) {
  const c = dict.configurator;
  const scene = useRef<HouseScene | null>(null);
  const [open, setOpen] = useState(0);
  const [s, setS] = useState<State>(INITIAL);
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [dossier, setDossier] = useState<'idle' | 'busy' | 'error'>('idle');
  const request = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<State>) => setS((v) => ({ ...v, ...patch }));

  // arriving from the home page: start from the choices carried in the link
  useEffect(() => {
    if (!full) return;
    const q = new URLSearchParams(location.search);
    if (![...q.keys()].length) return;
    const list = (k: string) => (q.get(k) ?? '').split('-');
    setS((v) => ({
      ...v,
      surface: Math.round(clampInt(q.get('metres'), SURFACE.min, SURFACE.max, v.surface) / SURFACE.step) * SURFACE.step,
      bedrooms: clampInt(q.get('habitacions'), 1, 6, v.bedrooms),
      bathrooms: clampInt(q.get('banys'), 1, 4, v.bathrooms),
      suite: Math.max(0, ['sin', 'bano', 'bano_vestidor'].indexOf(q.get('suite') ?? '')) || (q.get('suite') === 'sin' ? 0 : v.suite),
      kitchen: q.get('cuina') === 'basica' ? 0 : q.get('cuina') === 'isla' ? 1 : v.kitchen,
      vehicles: clampInt(q.get('vehicles'), 0, 4, v.vehicles),
      climate: q.has('installacions') ? CLIMATE.map((k) => list('installacions').includes(k)) : v.climate,
      extras: q.has('extres') ? [q.get('safareig') === '1', ...EXTRAS.map((k) => list('extres').includes(k))] : v.extras,
      floors: q.get('plantes') === '1' ? 0 : q.get('plantes') === '2' ? 1 : v.floors,
      system: q.get('sistema') === 'timber' ? 1 : q.get('sistema') === 'cellular' ? 0 : v.system,
    }));
  }, [full]);

  // the same answers, three ways: for the model, for the budget engine, for the link
  const model = useMemo(
    (): Partial<HouseConfig> => ({
      floors: s.floors === 0 ? 1 : 2,
      width: 0.8 + ((s.surface - SURFACE.min) / (SURFACE.max - SURFACE.min)) * 0.55,
      system: s.system === 1 ? 'timber' : 'cellular',
      finish: s.facade === 1 ? 'wood' : 'mineral',
      volume: s.volume === 1 ? 'L' : 'compact',
      roof: s.roof === 1 ? 'green' : 'flat',
      pool: s.extras[1],
      porch: s.extras[2],
      solar: s.extras[3],
      garage: s.vehicles > 0,
    }),
    [s],
  );
  const input = useMemo(
    (): EngineInput => ({
      metres: s.surface,
      habitacions: s.bedrooms,
      banys: s.bathrooms,
      suite: (['sin', 'bano', 'bano_vestidor'] as const)[s.suite],
      cuina: s.kitchen === 1 ? 'isla' : 'basica',
      vehicles: s.vehicles,
      safareig: s.extras[0],
      installacions: CLIMATE.filter((_, i) => s.climate[i]),
      extres: EXTRAS.filter((_, i) => s.extras[i + 1]),
    }),
    [s],
  );
  const visual = useMemo(
    () => ({ floors: s.floors + 1, system: model.system, facade: model.finish, roof: model.roof, volume: model.volume }),
    [s.floors, model],
  );

  // the budget is computed on the server; ask again a moment after the last change
  useEffect(() => {
    const ctl = new AbortController();
    const t = window.setTimeout(() => {
      fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { enabled?: boolean; quote?: PublicQuote } | null) => setQuote(d?.enabled && d.quote ? d.quote : null))
        .catch(() => {});
    }, 350);
    return () => {
      window.clearTimeout(t);
      ctl.abort();
    };
  }, [input]);

  const download = async () => {
    setDossier('busy');
    try {
      const res = await fetch('/api/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // if the visitor has already typed who they are, the dossier is made out to them
        body: JSON.stringify({
          lang, config: input, visual, image: scene.current?.snapshot() ?? null,
          name: request.current?.querySelector<HTMLInputElement>('input[name=name]')?.value || null,
          city: request.current?.querySelector<HTMLInputElement>('input[name=city]')?.value || null,
        }),
      });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `ModularDom-${res.headers.get('X-Reference') ?? 'dossier'}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setDossier('idle');
    } catch {
      setDossier('error');
    }
  };

  useEffect(() => {
    scene.current?.setConfig(model);
  }, [model]);

  // drag to turn the model; it keeps the angle you leave it at
  const turn = useRef({ at: 0, start: 0, base: 0, down: false });
  const latest = useRef(model);
  latest.current = model;
  const onReady = useCallback((sc: HouseScene) => {
    scene.current = sc;
    sc.setConfig(latest.current);
  }, []);
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

  const picked = (opts: string[], on: boolean[]) => opts.filter((_, i) => on[i]);
  const groups: { label: string; value: string; body: React.ReactNode }[] = [
    {
      label: c.groups.house,
      value: `${s.surface} ${c.surface.unit} · ${c.floors.options[s.floors]}`,
      body: (
        <>
          <Field label={c.surface.label}>
            <label className="block">
              <span className="flex items-baseline justify-between">
                <span className="t-serif t-num text-[1.6rem] leading-none">
                  {s.surface} <span className="font-sans text-[0.9375rem]">{c.surface.unit}</span>
                </span>
                <span className="t-note text-paper/70">{c.surface.hint}</span>
              </span>
              <input
                type="range"
                min={SURFACE.min}
                max={SURFACE.max}
                step={SURFACE.step}
                value={s.surface}
                onChange={(e) => set({ surface: +e.target.value })}
                aria-label={c.surface.label}
                aria-valuetext={`${s.surface} ${c.surface.unit}`}
                className="range w-full"
                style={{ '--fill': `${((s.surface - SURFACE.min) / (SURFACE.max - SURFACE.min)) * 100}%` } as React.CSSProperties}
              />
            </label>
          </Field>
          <Field label={c.floors.label}>
            <Options {...c.floors} value={s.floors} onChange={(i) => set({ floors: i })} />
          </Field>
          <Field label={c.volume.label}>
            <Options {...c.volume} value={s.volume} onChange={(i) => set({ volume: i })} />
          </Field>
        </>
      ),
    },
    {
      label: c.groups.interior,
      value: `${s.bedrooms} ${c.bedrooms.toLowerCase()} · ${s.bathrooms} ${c.bathrooms.toLowerCase()}`,
      body: (
        <>
          <Field label={c.bedrooms}>
            <Stepper label={c.bedrooms} value={s.bedrooms} min={1} max={6} onChange={(n) => set({ bedrooms: n })} />
          </Field>
          <Field label={c.bathrooms}>
            <Stepper label={c.bathrooms} value={s.bathrooms} min={1} max={4} onChange={(n) => set({ bathrooms: n })} />
          </Field>
          <Field label={c.suite.label}>
            <Options {...c.suite} value={s.suite} onChange={(i) => set({ suite: i })} />
          </Field>
          <Field label={c.kitchen.label}>
            <Options {...c.kitchen} value={s.kitchen} onChange={(i) => set({ kitchen: i })} />
          </Field>
        </>
      ),
    },
    {
      label: c.groups.equipment,
      value: [...picked(c.climate.options, s.climate), ...picked(c.extras.options, s.extras)].join(', ') || '—',
      body: (
        <>
          <Field label={c.garage.label}>
            <Stepper label={c.garage.label} value={s.vehicles} min={0} max={4} zero={c.garage.none} onChange={(n) => set({ vehicles: n })} />
          </Field>
          <Field label={c.climate.label}>
            <Toggles {...c.climate} value={s.climate} onChange={(v) => set({ climate: v })} />
          </Field>
          <Field label={c.extras.label}>
            <Toggles {...c.extras} value={s.extras} onChange={(v) => set({ extras: v })} />
          </Field>
        </>
      ),
    },
    {
      label: c.groups.look,
      value: `${c.system.options[s.system]} · ${c.facade.options[s.facade]}`,
      body: (
        <>
          <Field label={c.system.label}>
            <Options {...c.system} value={s.system} onChange={(i) => set({ system: i })} />
          </Field>
          <Field label={c.facade.label}>
            <Options {...c.facade} value={s.facade} onChange={(i) => set({ facade: i })} />
          </Field>
          <Field label={c.roof.label}>
            <Options {...c.roof} value={s.roof} onChange={(i) => set({ roof: i })} />
          </Field>
          <p className="t-note pb-1 pt-2 text-paper/70">{c.visualNote}</p>
        </>
      ),
    },
  ];

  const q = new URLSearchParams({
    metres: String(input.metres),
    habitacions: String(input.habitacions),
    banys: String(input.banys),
    suite: input.suite,
    cuina: input.cuina,
    vehicles: String(input.vehicles),
    safareig: input.safareig ? '1' : '0',
    installacions: input.installacions.join('-'),
    extres: input.extres.join('-'),
    plantes: String(s.floors + 1),
    sistema: model.system!,
  });
  const money = (cents: number) => new Intl.NumberFormat(lang === 'ca' ? 'ca-ES' : 'es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);

  return (
    <section className="bg-ink text-paper" data-theme="dark" aria-labelledby="configurador">
      <div className="grid md:min-h-[100svh] md:grid-cols-12">
        {/* the stage: a studio floor of light, the model on its base */}
        <div className="relative h-[48svh] overflow-hidden md:sticky md:top-0 md:col-span-7 md:h-[100svh]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(62%_50%_at_50%_60%,rgb(226_198_117/0.1),rgb(242_238_229/0.05)_45%,transparent_74%)]" aria-hidden="true" />
          <div className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing" {...drag}>
            <HouseCanvas mode="config" className="h-full w-full" label={c.name} fallback={dict.systems.fallback} onReady={onReady} />
          </div>
          <p className="tag pointer-events-none absolute bottom-5 left-[var(--edge)] text-paper/70">{dict.ui.concept}</p>
          <p className="t-note pointer-events-none absolute bottom-5 right-5 text-paper/70 max-md:hidden">{dict.ui.drag}</p>
        </div>

        {/* the decisions */}
        <div className="wrap py-14 md:col-span-5 md:py-28 md:pl-[3.5vw]">
          <Reveal as="header">
            <p className="t-note mb-5 text-gold-light" data-fade>
              {c.name}
            </p>
            {full ? (
              <h1 id="configurador" className="t-title">
                <Lines lines={c.title} />
              </h1>
            ) : (
            <h2 id="configurador" className="t-title">
              <Lines lines={c.title} />
            </h2>
            )}
            <p className="t-lead mt-5 max-w-[34ch] text-paper/75" data-fade style={{ '--i': 2 } as React.CSSProperties}>
              {c.text}
            </p>
          </Reveal>

          <ol className="mt-10">
            {groups.map((g, i) => {
              const on = open === i;
              return (
                <li key={g.label} className="border-t border-paper/20 last:border-b">
                  <h3>
                    <button type="button" aria-expanded={on} aria-controls={`cfg-${i}`} onClick={() => setOpen(on ? -1 : i)} className="group grid min-h-[3.75rem] w-full grid-cols-[2rem_1fr_auto] items-baseline gap-x-2 py-3 text-left">
                      <span className={`t-note t-num transition-colors duration-300 ${on ? 'text-gold-light' : 'text-paper/70'}`}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={`t-serif text-[1.45rem] leading-tight transition-transform duration-500 ease-[var(--ease-out)] ${on ? 'translate-x-1 italic' : ''}`}>{g.label}</span>
                      <span className={`max-w-[12rem] truncate text-right text-[0.875rem] text-paper/75 transition-opacity duration-300 ${on ? 'opacity-0' : ''}`}>{g.value}</span>
                    </button>
                  </h3>
                  <div id={`cfg-${i}`} inert={!on} className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out)] ${on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="pb-5 sm:pl-[2.5rem]">{g.body}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {quote ? (
            <div className="mt-8" aria-live="polite">
              <h3 className="t-serif text-[1.45rem]">{c.quote.title}</h3>
              <dl className="mt-3 text-[0.9375rem]">
                {quote.lines.map((l) => (
                  <div key={l.key} className="flex justify-between gap-6 border-t border-paper/15 py-2">
                    <dt className="text-paper/80">{l.label[lang]}</dt>
                    <dd className="t-num">{money(l.amountCents)}</dd>
                  </div>
                ))}
                {(
                  [
                    [c.quote.subtotal, quote.subtotalCents],
                    [c.quote.vatWorks, quote.vatWorksCents],
                    [c.quote.vatArch, quote.vatArchitectCents],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-t border-paper/15 py-2 text-paper/80">
                    <dt>{k}</dt>
                    <dd className="t-num">{money(v)}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-6 border-y border-paper/40 py-3">
                  <dt className="font-medium">{c.quote.total}</dt>
                  <dd className="t-serif t-num text-[1.9rem] leading-none">{money(quote.totalCents)}</dd>
                </div>
              </dl>
              <p className="t-note mt-3 max-w-[44ch] text-paper/70">{c.quote.note}</p>
            </div>
          ) : (
            <p className="t-note mt-6 max-w-[40ch] text-paper/70">{c.noPrice}</p>
          )}
          {!full && (
            <Link href={href(lang, 'configurator', `?${q}`)} className="btn btn-paper mt-6">
              {c.send}
            </Link>
          )}

          {full && (
            <div ref={request} className="mt-12 border-t border-paper/20 pt-10">
              <h3 className="t-serif text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] leading-tight">{dict.request.title}</h3>
              <p className="mt-3 max-w-[40ch] text-paper/75">{dict.request.text}</p>
              <LeadForm
                kind="quote"
                dict={dict}
                lang={lang}
                fields={['phone', 'city', 'plot', 'message']}
                required={['phone']}
                extra={() => ({ config: input, visual })}
                submit={dict.request.submit}
                buttonClass="btn btn-paper"
                chipOn="border-paper bg-paper text-ink"
                chipOff="border-paper/30 hover:border-paper"
                className="mt-8"
              />
              <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-paper/20 pt-6">
                <button type="button" onClick={download} disabled={dossier === 'busy'} className="btn btn-line disabled:opacity-60">
                  {dossier === 'busy' ? dict.request.preparing : dict.request.dossier}
                </button>
                {waHref(dict.whatsapp.configurator) && (
                  <a href={waHref(dict.whatsapp.configurator)!} target="_blank" rel="noopener noreferrer" className="link text-[0.9375rem]">
                    {dict.ui.whatsapp}
                  </a>
                )}
                <p role="status" className="t-note w-full text-paper/80">
                  {dossier === 'error' ? dict.request.dossierError : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
