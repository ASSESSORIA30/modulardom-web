'use client';
import { useState } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import type { Dictionary, Locale } from '@/content/i18n';
import { submitLead } from '@/lib/crm';

/*
  ModularDom MINERAL: the bungalow line for campsites and resorts. A different client (a business
  buying many units), so a different register inside the same site: cooler ground, the grotesque
  instead of the serif, a specification sheet instead of a story.

  Nothing about the product is invented: models, plans, layouts, surfaces and finishes are
  empty slots that say so. The one thing a professional can already do is ask for a quote for a
  number of units; the drawing counts them out.
*/

const MAX_DRAWN = 48;

export function Mineral({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const m = dict.mineral;
  const f = m.form;
  const [kind, setKind] = useState(0);
  const [units, setUnits] = useState(12);
  const [state, setState] = useState<'idle' | 'sending' | 'ready' | 'error'>('idle');
  const [missing, setMissing] = useState<string[]>([]);
  const clamp = (n: number) => Math.min(500, Math.max(1, Math.round(n) || 1));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? '').trim();
    const bad = ['name', 'email'].filter((k) => !get(k) || (k === 'email' && !/^\S+@\S+\.\S+$/.test(get(k))));
    setMissing(bad);
    if (bad.length) {
      (e.currentTarget.elements.namedItem(bad[0]) as HTMLElement)?.focus();
      return;
    }
    setState('sending');
    const res = await submitLead({
      source: 'mineral', locale: lang, name: get('name'), company: get('company'), email: get('email'), phone: get('phone'), message: get('message'),
      data: { establishment: f.kind.options[kind], units },
    });
    setState(res.ok ? 'ready' : 'error');
  };

  return (
    <section className="mineral" data-theme="light" aria-labelledby="mineral">
      <div className="wrap grid gap-y-14 py-24 md:grid-cols-12 md:gap-x-10 md:py-40">
        <Reveal as="header" className="md:col-span-7">
          <p className="m-mark flex flex-wrap items-center gap-x-4 gap-y-1" data-fade>
            <span>ModularDom</span>
            <span className="h-px w-10 bg-current" aria-hidden="true" />
            <span>Mineral</span>
          </p>
          <h2 id="mineral" className="m-title mt-8">
            {m.title.map((l) => (
              <span key={l} className="line">
                <span data-line>{l}</span>
              </span>
            ))}
          </h2>
          <p className="t-lead mt-6 max-w-[34ch] opacity-80" data-fade style={{ '--i': 2 } as React.CSSProperties}>
            {m.text}
          </p>
        </Reveal>

        {/* what will be published: a specification sheet with its rows still open */}
        <dl className="md:col-span-4 md:col-start-9 md:self-end">
          {m.slots.map((s) => (
            <div key={s.name} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-t border-current/25 py-3 last:border-b">
              <dt>
                <span className="block font-medium">{s.name}</span>
                <span className="t-note opacity-70">{s.text}</span>
              </dt>
              <dd className="tag opacity-80">{dict.ui.pending}</dd>
            </div>
          ))}
        </dl>

        {/* the quote: how many, for what, who */}
        <div className="border-t border-current/25 pt-10 md:col-span-12 md:grid md:grid-cols-12 md:gap-x-10 md:pt-14">
          <div className="md:col-span-5">
            <p className="m-mark">{m.audience}</p>
            <h3 className="mt-5 text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-medium leading-tight tracking-[-0.02em]">{f.title}</h3>
            <div className="mt-8 grid grid-cols-8 gap-1.5" aria-hidden="true">
              {Array.from({ length: Math.min(units, MAX_DRAWN) }, (_, i) => (
                <span key={i} className="unit" style={{ animationDelay: `${Math.min(i, 12) * 18}ms` }} />
              ))}
            </div>
            {units > MAX_DRAWN && <p className="t-note t-num mt-2 opacity-70">+ {units - MAX_DRAWN}</p>}
          </div>

          <form onSubmit={submit} noValidate className="mt-10 grid gap-x-8 gap-y-6 md:col-span-6 md:col-start-7 md:mt-0 md:grid-cols-2">
            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-[0.8125rem] opacity-75">{f.kind.label}</legend>
              <div className="flex flex-wrap gap-2">
                {f.kind.options.map((o, i) => (
                  <label key={o} className={`flex min-h-11 cursor-pointer items-center border px-4 text-[0.9375rem] font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${kind === i ? 'border-slate bg-slate text-mineral' : 'border-current/30'}`}>
                    <input type="radio" name="kind" className="sr-only" checked={kind === i} onChange={() => setKind(i)} />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="md:col-span-2">
              <label htmlFor="m-units" className="mb-2 block text-[0.8125rem] opacity-75">
                {f.units}
              </label>
              <div className="flex w-fit items-stretch border border-current/30">
                <button type="button" onClick={() => setUnits((u) => clamp(u - 1))} aria-label="−1" className="min-h-11 w-12 text-xl transition-transform duration-150 active:scale-90">
                  −
                </button>
                <input id="m-units" inputMode="numeric" value={units} onChange={(e) => setUnits(clamp(+e.target.value.replace(/\D/g, '')))} className="t-num w-20 border-x border-current/30 bg-transparent text-center text-[1.125rem] font-medium" />
                <button type="button" onClick={() => setUnits((u) => clamp(u + 1))} aria-label="+1" className="min-h-11 w-12 text-xl transition-transform duration-150 active:scale-90">
                  +
                </button>
              </div>
            </div>
            {(['name', 'company', 'email', 'phone'] as const).map((k) => (
              <label key={k} className="field">
                <span>
                  {f[k]}
                  {(k === 'name' || k === 'email') && <span aria-hidden="true"> *</span>}
                </span>
                <input
                  name={k}
                  type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
                  autoComplete={k === 'name' ? 'name' : k === 'company' ? 'organization' : k === 'email' ? 'email' : 'tel'}
                  required={k === 'name' || k === 'email'}
                  aria-invalid={missing.includes(k) || undefined}
                  aria-describedby={missing.includes(k) ? `m-err-${k}` : undefined}
                />
                {missing.includes(k) && (
                  <span id={`m-err-${k}`} className="!opacity-100 text-[#a3351f]">
                    {f.required}
                  </span>
                )}
              </label>
            ))}
            <label className="field md:col-span-2">
              <span>{f.message}</span>
              <textarea name="message" rows={3} />
            </label>
            <div className="md:col-span-2">
              <button type="submit" disabled={state === 'sending'} className="btn btn-ink disabled:opacity-60" style={{ '--btn-bg': 'var(--color-slate)', '--btn-line': 'var(--color-slate)' } as React.CSSProperties}>
                {f.submit}
              </button>
              <p role="status" className="t-note mt-4 max-w-[46ch]">
                {state === 'ready' ? f.ready : state === 'error' ? f.error : ''}
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
