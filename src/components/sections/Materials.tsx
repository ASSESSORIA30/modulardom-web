'use client';
import { useRef, useState } from 'react';
import { Lines } from '@/components/ui/Lines';
import { Reveal } from '@/components/ui/Reveal';
import { Still } from '@/components/ui/Still';
import type { Dictionary, MaterialGroupId } from '@/content/i18n';

/*
  A materials catalogue, laid out like a page of an interiors book: an index of families, one
  large sample and a second one set lower beside it. Choosing a family lays its samples over the
  previous ones; choosing the small sample trades places with the large one.
  Every picture is a detail cut from the film, and is labelled as a concept sample.
*/

const GROUPS: { id: MaterialGroupId; stills: [string, string] }[] = [
  { id: 'woods', stills: ['mat-roure', 'mat-lamel'] },
  { id: 'stone', stills: ['mat-traverti', 'mat-pedra'] },
  { id: 'floors', stills: ['mat-paviment', 'mat-graons'] },
  { id: 'cladding', stills: ['mat-panells', 'mat-mur'] },
  { id: 'joinery', stills: ['mat-vidre', 'mat-porta'] },
  { id: 'interiors', stills: ['mat-llum', 'mat-textil'] },
];

/** shows `name`; when it changes, the new picture wipes up over the old one */
function Wipe({ name, className }: { name: string; className?: string }) {
  const prev = useRef(name);
  const shown = useRef(name);
  if (shown.current !== name) {
    prev.current = shown.current;
    shown.current = name;
  }
  return (
    <div className={`relative overflow-hidden bg-stone-deep ${className ?? ''}`}>
      <Still name={prev.current} className="absolute inset-0 h-full w-full object-cover" />
      <Still key={name} name={name} className="absolute inset-0 h-full w-full animate-[wipe_850ms_var(--ease-in-out)_both] object-cover" />
    </div>
  );
}

export function Materials({ dict }: { dict: Dictionary }) {
  const [group, setGroup] = useState(0);
  const [lead, setLead] = useState(0);
  const m = dict.materials;
  const g = GROUPS[group];
  const samples = m.groups[g.id].samples;
  const pick = (i: number) => {
    if (i === group) return;
    setGroup(i);
    setLead(0);
  };

  return (
    <section className="overflow-hidden bg-stone text-ink" data-theme="light" aria-labelledby="materials">
      <div className="wrap grid gap-y-10 py-24 md:grid-cols-12 md:gap-x-8 md:pb-40 md:pt-32">
        {/* title and index stay together, level with the top of the large sample, so the whole choice reads in one screen */}
        <div className="flex min-w-0 flex-col gap-y-10 md:col-span-5 md:row-start-1 md:gap-y-[clamp(2rem,5svh,3.5rem)] md:self-start">
        <Reveal as="header">
          <p className="t-note mb-5 text-oak-deep" data-fade>
            {m.name}
          </p>
          <h2 id="materials" className="t-title">
            <Lines lines={m.title} />
          </h2>
          <p className="t-lead mt-5 max-w-[36ch] text-ink/75" data-fade style={{ '--i': 2 } as React.CSSProperties}>
            {m.text}
          </p>
        </Reveal>

        {/* the index of families */}
        <ul className="-mx-[var(--edge)] flex gap-x-6 overflow-x-auto px-[var(--edge)] [scrollbar-width:none] md:mx-0 md:block md:overflow-visible md:px-0 lg:w-[86%]" role="tablist" aria-label={m.name}>
          {GROUPS.map((x, i) => {
            const on = i === group;
            return (
              <li key={x.id} role="presentation" className="shrink-0 md:border-t md:border-ink/20 md:last:border-b">
                <button
                  type="button"
                  role="tab"
                  id={`mat-tab-${x.id}`}
                  aria-selected={on}
                  aria-controls="mat-panel"
                  onClick={() => pick(i)}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && pick(i)}
                  className="group flex min-h-12 w-full items-center justify-between gap-4 text-left md:min-h-[clamp(2.75rem,6svh,3.4rem)]"
                >
                  <span className={`t-serif text-[1.35rem] leading-none transition-[opacity,transform] duration-500 ease-[var(--ease-out)] md:text-[1.7rem] ${on ? 'opacity-100 md:translate-x-3' : 'opacity-70 group-hover:opacity-100'} ${on ? 'italic' : ''}`}>
                    {m.groups[x.id].name}
                  </span>
                  <span className={`t-note t-num text-ink/70 transition-opacity duration-300 max-lg:hidden ${on ? 'opacity-100' : 'opacity-0'}`}>
                    {String(i + 1).padStart(2, '0')} / {String(GROUPS.length).padStart(2, '0')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        </div>

        {/* the page of samples: one large, one set lower beside it */}
        <div id="mat-panel" role="tabpanel" aria-labelledby={`mat-tab-${g.id}`} className="grid grid-cols-12 gap-x-4 md:col-span-7 md:col-start-6 md:row-start-1 md:gap-x-8">
          <Reveal className="col-span-8">
            <div data-unveil>
              <Wipe name={g.stills[lead]} className="aspect-[4/5] md:max-h-[calc(100svh-15.5rem)] md:w-full" />
            </div>
            <div className="mt-4" key={`${group}-${lead}`} style={{ animation: 'swap 420ms var(--ease-out)' }} aria-live="polite">
              <p className="t-serif text-[1.6rem] leading-tight md:text-[2rem]">{samples[lead].name}</p>
              <p className="mt-1 text-[0.9375rem] text-ink/75">{samples[lead].where}</p>
              <p className="tag mt-3 text-oak-deep">{m.sample}</p>
            </div>
          </Reveal>
          <div className="col-span-4 mt-[26%]">
            <button type="button" onClick={() => setLead(1 - lead)} className="group block w-full text-left" aria-label={samples[1 - lead].name}>
              <Wipe name={g.stills[1 - lead]} className="aspect-[3/4] transition-transform duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1 group-active:scale-[0.98]" />
              <span className="mt-3 block text-[0.9375rem]">{samples[1 - lead].name}</span>
            </button>
          </div>
        </div>

        <p className="t-note max-w-[40ch] text-ink/70 md:col-span-4 md:row-start-2">{m.note}</p>

        {/* what ModularDom commits to in writing: its published quality specification */}
        <Reveal className="border-t border-ink/25 pt-10 md:col-span-12 md:mt-10 md:grid md:grid-cols-12 md:gap-x-8 md:pt-14">
          <h3 className="t-serif text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] leading-tight md:col-span-4">
            <span className="line">
              <span data-line>{m.spec.title}</span>
            </span>
          </h3>
          <dl className="mt-6 grid gap-x-8 sm:grid-cols-2 md:col-span-8 md:mt-0">
            {m.spec.items.map((it, i) => (
              <div key={it.name} className="border-t border-ink/20 py-4" data-fade style={{ '--i': i } as React.CSSProperties}>
                <dt className="font-medium">{it.name}</dt>
                <dd className="mt-1 text-[0.9375rem] text-ink/80">{it.text}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
