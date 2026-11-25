'use client';
import { useState } from 'react';
import { LeadForm } from '@/components/ui/LeadForm';
import { Reveal } from '@/components/ui/Reveal';
import type { Dictionary, Locale } from '@/content/i18n';
import { MINERAL_MODELS } from '@/content/mineral';
import { waHref } from '@/content/site';

/*
  ModularDom MINERAL: the bungalow line for campsites and resorts. A different client (a business
  buying many units), so a different register inside the same site: cooler ground, the grotesque
  instead of the serif, a specification sheet instead of a story.

  Nothing about the product is invented: models, plans, layouts, surfaces and finishes are
  empty slots that say so. The one thing a professional can already do is ask for a quote for a
  number of units; the drawing counts them out.
*/

const MAX_DRAWN = 48;

export function Mineral({ dict, lang, as: Heading = 'h2' }: { dict: Dictionary; lang: Locale; as?: 'h1' | 'h2' }) {
  const m = dict.mineral;
  const f = m.form;
  const [kind, setKind] = useState(0);
  const [units, setUnits] = useState(12);
  const clamp = (n: number) => Math.min(500, Math.max(1, Math.round(n) || 1));
  const wa = waHref(dict.whatsapp.mineral);

  return (
    <section className="mineral" data-theme="light" aria-labelledby="mineral">
      <div className="wrap grid gap-y-14 py-24 md:grid-cols-12 md:gap-x-10 md:py-40">
        <Reveal as="header" className="md:col-span-7">
          <p className="m-mark flex flex-wrap items-center gap-x-4 gap-y-1" data-fade>
            <span>ModularDom</span>
            <span className="h-px w-10 bg-current" aria-hidden="true" />
            <span>Mineral</span>
          </p>
          <Heading id="mineral" className="m-title mt-8">
            {m.title.map((l) => (
              <span key={l} className="line">
                <span data-line>{l}</span>
              </span>
            ))}
          </Heading>
          <p className="t-lead mt-6 max-w-[34ch] opacity-80" data-fade style={{ '--i': 2 } as React.CSSProperties}>
            {m.text}
          </p>
        </Reveal>

        {/* the catalogue: its models once ModularDom approves them (src/content/mineral.ts) */}
        {MINERAL_MODELS.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 md:col-span-12 md:grid-cols-3">
            {MINERAL_MODELS.map((x) => (
              <li key={x.id} className="border border-current/25">
                {x.plan && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={x.plan} alt="" loading="lazy" className="aspect-[4/3] w-full border-b border-current/25 object-contain p-6" />
                )}
                <div className="p-5">
                  <h3 className="text-[1.35rem] font-medium tracking-[-0.02em]">{x.name}</h3>
                  <p className="mt-1 text-[0.9375rem] opacity-80">{[x.surface && `${x.surface} m²`, x.layout?.[lang]].filter(Boolean).join(' · ')}</p>
                  {x.finishes && <p className="t-note mt-3 opacity-70">{x.finishes[lang].join(' · ')}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}

        {MINERAL_MODELS.length > 1 && (
          <div className="overflow-x-auto md:col-span-12">
            <table className="w-full min-w-[36rem] border-collapse text-left text-[0.9375rem]">
              <caption className="m-mark mb-4 text-left">{m.compare}</caption>
              <thead>
                <tr>
                  <th scope="col" className="border-b border-current/40 py-3 pr-6 font-medium" />
                  {MINERAL_MODELS.map((x) => (
                    <th key={x.id} scope="col" className="border-b border-current/40 py-3 pr-6 font-medium">
                      {x.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    [m.slots[3].name, (x) => (x.surface ? `${x.surface} m²` : '—')],
                    [m.slots[2].name, (x) => x.layout?.[lang] ?? '—'],
                    [m.slots[4].name, (x) => x.finishes?.[lang].join(', ') ?? '—'],
                  ] as [string, (x: (typeof MINERAL_MODELS)[number]) => string][]
                ).map(([label, get]) => (
                  <tr key={label}>
                    <th scope="row" className="border-b border-current/20 py-3 pr-6 font-normal opacity-75">
                      {label}
                    </th>
                    {MINERAL_MODELS.map((x) => (
                      <td key={x.id} className="border-b border-current/20 py-3 pr-6">
                        {get(x)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* until then: what the catalogue will hold, as a specification sheet with its rows still open */}
        <dl className={`md:col-span-4 md:col-start-9 md:self-end ${MINERAL_MODELS.length ? 'hidden' : ''}`}>
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

          <LeadForm
            kind="mineral"
            dict={dict}
            lang={lang}
            fields={['company', 'phone', 'city', 'message']}
            required={['company']}
            extra={() => ({ establishment: f.kind.options[kind], units })}
            submit={f.submit}
            buttonClass="btn btn-slate"
            chipOn="border-slate bg-slate text-mineral"
            chipOff="border-current/30"
            className="mt-10 md:col-span-6 md:col-start-7 md:mt-0"
          >
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
                <button type="button" onClick={() => setUnits((u) => clamp(u - 1))} aria-label={`${f.units} −1`} className="min-h-11 w-12 text-xl transition-transform duration-150 active:scale-90">
                  −
                </button>
                <input id="m-units" inputMode="numeric" value={units} onChange={(e) => setUnits(clamp(+e.target.value.replace(/\D/g, '')))} className="t-num w-20 border-x border-current/30 bg-transparent text-center text-[1.125rem] font-medium" />
                <button type="button" onClick={() => setUnits((u) => clamp(u + 1))} aria-label={`${f.units} +1`} className="min-h-11 w-12 text-xl transition-transform duration-150 active:scale-90">
                  +
                </button>
              </div>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="link mt-4 text-[0.9375rem]">
                  {dict.ui.whatsapp}
                </a>
              )}
            </div>
          </LeadForm>
        </div>
      </div>
    </section>
  );
}
