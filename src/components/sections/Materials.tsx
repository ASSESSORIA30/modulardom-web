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
      <div className="wrap grid gap-y-10 py-24 md:grid-cols-12 md:gap-x-8 md:py-40">
        <Reveal as="header" className="md:col-span-5">
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
        <ul className="-mx-[var(--edge)] flex gap-x-6 overflow-x-auto px-[var(--edge)] [scrollbar-width:none] md:col-span-4 md:row-start-2 md:mx-0 md:block md:self-end md:overflow-visible md:px-0" role="tablist" aria-label={m.name}>
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
                  className="group flex min-h-12 w-full items-center justify-between gap-4 text-left md:min-h-[3.4rem]"
                >
                  <span className={`t-serif text-[1.35rem] leading-none transition-[opacity,transform] duration-500 ease-[var(--ease-out)] md:text-[1.7rem] ${on ? 'opacity-100 md:translate-x-3' : 'opacity-70 group-hover:opacity-100'} ${on ? 'italic' : ''}`}>
                    {m.groups[x.id].name}
                  </span>
                  <span className={`t-note t-num text-ink/70 transition-opacity duration-300 max-md:hidden ${on ? 'opacity-100' : 'opacity-0'}`}>
                    {String(i + 1).padStart(2, '0')} / {String(GROUPS.length).padStart(2, '0')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* the page of samples: one large, one set lower beside it */}
        <div id="mat-panel" role="tabpanel" aria-labelledby={`mat-tab-${g.id}`} className="grid grid-cols-12 gap-x-4 md:col-span-7 md:col-start-6 md:row-span-2 md:row-start-1 md:gap-x-8">
          <Reveal className="col-span-8">
            <div data-unveil>
              <Wipe name={g.stills[lead]} className="aspect-[4/5]" />
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

        <p className="t-note max-w-[40ch] text-ink/70 md:col-span-4 md:row-start-3">{m.note}</p>
      </div>
    </section>
  );
}
