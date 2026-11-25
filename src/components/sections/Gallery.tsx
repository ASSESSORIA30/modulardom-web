'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Still } from '@/components/ui/Still';
import { href, type Dictionary, type Locale } from '@/content/i18n';
import { CONCEPT_SPACES, PROJECTS } from '@/content/projects';

/*
  The gallery. On a desktop the page holds still and the scroll carries the strip sideways, with
  the weight of the tour's camera; each picture opens as it comes in from the right and drifts
  inside its frame as it crosses, so the strip has depth. On touch it is the platform's own
  sideways scroll, with the same drift.

  It shows ModularDom's built work when src/content/projects.ts has any. Until then it shows the
  concept house of the tour, and says so on every sheet.
*/

type Item = { key: string; title: string; ratio: number; still?: string; src?: string; facts: [string, string][]; concept: boolean };

function itemsFor(dict: Dictionary, lang: Locale): Item[] {
  if (PROJECTS.length) {
    const f = dict.projects.fields;
    return PROJECTS.map((p) => ({
      key: p.id,
      title: p.name,
      ratio: 16 / 10,
      src: p.images[0],
      concept: false,
      facts: [
        p.location && [f.location, p.location],
        p.surface && [f.surface, `${p.surface} m²`],
        p.year && [f.year, String(p.year)],
        p.system && [f.system, dict.systems.items[p.system].name],
        ...(p.features?.[lang] ?? []).map((x) => ['', x]),
      ].filter(Boolean) as [string, string][],
    }));
  }
  return CONCEPT_SPACES.map((s) => ({ key: s.id, title: dict.projects.spaces[s.id], ratio: s.ratio, still: s.still, facts: [], concept: true }));
}

export function Gallery({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const track = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [pinned, setPinned] = useState(false);
  const items = itemsFor(dict, lang);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 56rem) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const set = () => setPinned(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  useEffect(() => {
    const el = { track: track.current!, view: view.current!, strip: strip.current! };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frames = [...el.strip.querySelectorAll<HTMLElement>('.gallery-frame')];
    let raf = 0;
    let x = 0;
    let target = 0;
    let travel = 0;
    let last = performance.now();
    let seen = false;

    const layout = () => {
      travel = Math.max(0, el.strip.scrollWidth - window.innerWidth);
      const h = pinned ? `${window.innerHeight + travel}px` : '';
      if (el.track.style.height !== h) {
        el.track.style.height = h;
        // the page just changed length: everything measured below this point has moved
        ScrollTrigger.refresh();
      }
      read();
    };
    const read = () => {
      if (pinned) {
        const r = el.track.getBoundingClientRect();
        target = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight))) * travel;
      } else target = el.view.scrollLeft;
      queue();
    };
    const paint = (now: number) => {
      raf = 0;
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      // the strip follows the scroll with a little mass, like the camera of the tour
      x = pinned ? x + (target - x) * (1 - Math.exp(-dt * 10)) : target;
      if (Math.abs(target - x) < 0.3) x = target;
      if (pinned) el.strip.style.transform = `translate3d(${-x.toFixed(1)}px, 0, 0)`;
      const vw = window.innerWidth;
      let nearest = 0;
      let best = Infinity;
      frames.forEach((f, i) => {
        const r = f.getBoundingClientRect();
        const c = r.left + r.width / 2;
        if (Math.abs(c - vw / 2) < best) {
          best = Math.abs(c - vw / 2);
          nearest = i;
        }
        if (r.right < -300 || r.left > vw + 300 || reduced) return;
        const img = f.firstElementChild as HTMLElement;
        const k = (c - vw / 2) / vw; // −0.5 … 0.5 across the screen
        // arriving from the right: the frame opens, the picture settles from slightly too close
        const enter = pinned ? Math.min(1, Math.max(0, (vw - r.left) / (vw * 0.5))) : 1;
        const e = 1 - Math.pow(1 - enter, 3);
        f.style.clipPath = e >= 1 ? '' : `inset(0 0 0 ${((1 - e) * 22).toFixed(2)}%)`;
        img.style.transform = `translate3d(${(-k * 11).toFixed(2)}%, 0, 0) scale(${(1.14 - e * 0.14).toFixed(4)})`;
      });
      if (bar.current) bar.current.style.transform = `scaleX(${(travel ? x / travel : 0).toFixed(4)})`;
      if (count.current) count.current.textContent = String(nearest + 1).padStart(2, '0');
      if (x !== target) queue();
    };
    const queue = () => {
      if (!raf && seen) {
        last = performance.now();
        raf = requestAnimationFrame(paint);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      if (seen) queue();
    });
    io.observe(el.track);
    const ro = new ResizeObserver(layout);
    ro.observe(el.strip);
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', layout);
    el.view.addEventListener('scroll', read, { passive: true });
    layout();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', layout);
      el.view.removeEventListener('scroll', read);
      el.strip.style.transform = '';
      el.track.style.height = '';
    };
  }, [pinned]);

  return (
    <section className="bg-paper text-ink" data-theme="light" aria-labelledby="projectes">
      <div ref={track}>
        <div className={pinned ? 'sticky top-0 flex h-[100lvh] flex-col justify-center overflow-hidden' : 'py-10'}>
          <div ref={view} className={pinned ? '' : 'gallery-scroller'} tabIndex={pinned ? undefined : 0} role="group" aria-label={dict.projects.name}>
            <ul ref={strip} className="flex w-max items-end gap-4 px-[var(--edge)] will-change-transform md:gap-[4.5vw] md:pr-[18vw]">
              {items.map((it, i) => (
                <li key={it.key} className="shrink-0 snap-start" style={{ marginBottom: pinned ? `${[0, 7, 2, 5, 0, 6][i % 6]}svh` : undefined }}>
                  <figure>
                    <div className="gallery-frame h-[52svh] md:h-[66svh]" style={{ aspectRatio: String(it.ratio) }}>
                      {it.still ? (
                        <Still name={it.still} alt="" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.src} alt="" loading="lazy" decoding="async" draggable={false} />
                      )}
                    </div>
                    <figcaption className="mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1">
                      <span className="t-note t-num text-ink/70">{String(i + 1).padStart(2, '0')}</span>
                      <span className="t-serif text-[1.5rem] leading-tight md:text-[1.75rem]">{it.title}</span>
                      {it.concept && <span className="tag col-start-2 text-oak">{dict.ui.concept}</span>}
                      {it.facts.length > 0 && (
                        <dl className="col-start-2 mt-1 flex flex-wrap gap-x-6 gap-y-1 text-[0.9375rem]">
                          {it.facts.map(([k, v]) => (
                            <div key={k + v} className="flex gap-2">
                              {k && <dt className="text-ink/70">{k}</dt>}
                              <dd>{v}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </figcaption>
                  </figure>
                </li>
              ))}
              <li className="flex h-[52svh] shrink-0 snap-start items-center pl-2 pr-[6vw] md:h-[66svh]">
                <div className="max-w-[18rem]">
                  <p className="t-serif text-[1.75rem] leading-tight">{dict.projects.title.join(' ').replace(/\*/g, '')}</p>
                  <Link href={href(lang, 'projects')} className="btn btn-line-ink mt-6" draggable={false}>
                    {dict.ui.projects}
                  </Link>
                </div>
              </li>
            </ul>
          </div>

          <div className="wrap mt-6 flex items-center gap-6 md:mt-[3svh]">
            <p className="t-note t-num shrink-0 text-ink/70" aria-hidden="true">
              <span ref={count}>01</span> / {String(items.length).padStart(2, '0')}
            </p>
            <span className="relative block h-px flex-1 bg-ink/15" aria-hidden="true">
              <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-ink" />
            </span>
            {PROJECTS.length === 0 && <p className="t-note max-w-[26rem] text-ink/70 max-md:hidden">{dict.projects.conceptNote}</p>}
          </div>
          {PROJECTS.length === 0 && <p className="wrap t-note mt-3 text-ink/70 md:hidden">{dict.projects.conceptNote}</p>}
        </div>
      </div>
    </section>
  );
}
