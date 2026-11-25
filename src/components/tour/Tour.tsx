'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lines } from '@/components/ui/Lines';
import { Still } from '@/components/ui/Still';
import { href, type Dictionary, type Locale } from '@/content/i18n';
import { PRICE_CLAIM } from '@/content/site';
import { STATIONS, progressOf, type Station } from '@/content/tour';
import { scrollToY } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { TourEngine, supportsAvif } from './engine';

gsap.registerPlugin(ScrollTrigger);

type Props = { dict: Dictionary; lang: Locale };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** The film when the browser can play it and the visitor wants motion; stills otherwise. */
export function Tour(props: Props) {
  const reduced = useReducedMotion();
  const [avif, setAvif] = useState<boolean | null>(null);
  useEffect(() => {
    supportsAvif().then(setAvif);
  }, []);
  if (reduced || avif === false) return <StillTour {...props} />;
  return <FilmTour {...props} enabled={avif === true} />;
}

function StationCopy({ station, index, dict, lang }: Props & { station: Station; index: number }) {
  const copy = dict.stations[station.id];
  const Heading = index === 0 ? 'h1' : 'h2';
  return (
    <div className="station" data-station data-place={station.place}>
      <div className="station-copy">
        <Heading className="t-display">
          <Lines lines={copy.title} />
        </Heading>
        <p className="t-lead mt-4 max-w-[30ch] text-paper/90 md:mt-5" data-fade>
          {copy.text}
        </p>
        {/* the commercial claim: built, and off until its conditions are validated (src/content/site.ts) */}
        {station.actions && PRICE_CLAIM.enabled && (
          <p className="mt-4 flex items-baseline gap-2 text-paper" data-fade>
            <span className="text-[0.9375rem] text-paper/80">{dict.ui.from}</span>
            <span className="t-serif t-num text-[1.75rem] leading-none">{PRICE_CLAIM.amount}</span>
            <span className="text-[0.9375rem]">{PRICE_CLAIM.unit}</span>
          </p>
        )}
        {station.values && (
          <ul className="mt-6 flex w-fit flex-wrap text-[0.9375rem] text-paper/90" data-fade>
            {dict.values.map((v, i) => (
              <li key={v} className={`py-1 ${i ? 'ml-4 border-l border-paper/35 pl-4' : ''}`}>
                {v}
              </li>
            ))}
          </ul>
        )}
        {station.actions && (
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2 max-md:hidden md:mt-8" data-fade>
            <Link href={href(lang, 'configurator')} className="btn btn-paper">
              {dict.ui.configure}
            </Link>
            <Link href={href(lang, 'projects')} className="link text-[0.9375rem]">
              {dict.ui.projects}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectsIntro({ dict }: { dict: Dictionary }) {
  return (
    <>
      <p className="t-note mb-5 text-oak" data-fade>
        {dict.projects.name}
      </p>
      <h2 id="projectes" className="t-title">
        <Lines lines={dict.projects.title} />
      </h2>
      <p className="t-lead mt-5 max-w-[38ch] text-ink/75" data-fade style={{ '--i': 2 } as React.CSSProperties}>
        {dict.projects.text}
      </p>
    </>
  );
}

function FilmTour({ dict, lang, enabled }: Props & { enabled: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const safe = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const lens = useRef({ tour: 1, outro: 1 });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const el = {
      track: track.current!, stage: stage.current!, plate: plate.current!, canvas: canvas.current!, safe: safe.current!,
      intro: intro.current!, rail: rail.current!, hint: hint.current!,
    };
    let opened = false;

    const ctx = gsap.context(() => {
      const boxes = gsap.utils.toArray<HTMLElement>('[data-station]');
      const lines = (b: HTMLElement) => b.querySelectorAll('[data-line]');
      const fades = (b: HTMLElement) => b.querySelectorAll('[data-fade]');
      const fills = [...el.rail.querySelectorAll<HTMLElement>('.measure > span')];

      const open = () => {
        if (opened) return;
        opened = true;
        el.canvas.style.opacity = '1';
        gsap.to(loader.current, { autoAlpha: 0, duration: 0.8, ease: 'power2.out' });
        if (engine.p < 0.02) {
          // the one orchestrated moment of the page: the house, then the sentence, then the way in
          gsap.fromTo(lines(boxes[0]), { yPercent: 108, rotate: 2.5 }, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.13, ease: 'expo.out', delay: 0.3 });
          gsap.fromTo(fades(boxes[0]), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.09, ease: 'power3.out', delay: 0.9 });
          gsap.fromTo([el.rail, el.hint], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, delay: 1.4, stagger: 0.15 });
        } else gsap.set([el.rail, el.hint], { autoAlpha: 1 });
      };

      const engine = new TourEngine(el.canvas, open);
      // ?tourdebug exposes the engine to the console and to the Playwright checks
      if (location.search.includes('tourdebug')) (window as unknown as { __tour: TourEngine }).__tour = engine;
      const giveUp = window.setTimeout(open, 6000); // never hold the page behind a slow network

      // the camera answers a finger and a wheel differently (see engine)
      const onWheel = () => engine.setInput('wheel');
      const onTouch = () => engine.setInput('touch');
      window.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('touchstart', onTouch, { passive: true });
      if (ScrollTrigger.isTouch === 1) engine.setInput('touch');

      // each station: a paused timeline 1 long, scrubbed by where the camera is between its frames
      const windows = STATIONS.map((s) => [progressOf(s.from), progressOf(s.to)] as const);
      const starts = STATIONS.map((s, i) => [progressOf(s.from), i < STATIONS.length - 1 ? progressOf(STATIONS[i + 1].from) : 1] as const);
      const tls = boxes.map((box, i) => {
        const tl = gsap.timeline({ paused: true });
        if (i > 0) {
          tl.fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04, ease: 'none' }, 0);
          tl.fromTo(lines(box), { yPercent: 108, rotate: 2.5 }, { yPercent: 0, rotate: 0, duration: 0.2, stagger: 0.035, ease: 'power3.out' }, 0);
          tl.fromTo(fades(box), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.14, stagger: 0.03, ease: 'power2.out' }, 0.12);
        }
        if (i < boxes.length - 1) {
          tl.fromTo(lines(box), { yPercent: 0 }, { yPercent: -108, duration: 0.16, stagger: 0.02, ease: 'power2.in', immediateRender: false }, 0.8);
          tl.fromTo(fades(box), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.1, ease: 'none', immediateRender: false }, 0.8);
          tl.to(box, { autoAlpha: 0, duration: 0.02, ease: 'none' }, 0.98);
        }
        tl.set({}, {}, 1);
        return tl;
      });

      let targetT = 0;
      let targetO = 0;
      let o = 0;
      let vertical = false;
      let inset = [0, 0, 0, 0];
      const last = { p: -1, o: -1, cur: 0 };
      let first = true;

      const measure = () => {
        const cs = getComputedStyle(el.stage);
        const num = (k: string) => parseFloat(cs.getPropertyValue(k)) || 0;
        const vh = el.stage.offsetHeight;
        lens.current = { tour: (vh * num('--tour-len')) / 100, outro: (vh * num('--outro-len')) / 100 };
        inset = [num('--plate-t'), num('--plate-r'), num('--plate-b'), num('--plate-l')];
        vertical = getComputedStyle(el.rail).flexDirection === 'column';
        last.p = -1;
        engine.resize();
      };
      const read = (self: ScrollTrigger) => {
        const px = self.scroll() - self.start;
        targetT = clamp01(px / lens.current.tour);
        targetO = clamp01((px - lens.current.tour) / lens.current.outro);
      };
      const st = ScrollTrigger.create({
        trigger: el.track,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: read,
        onRefresh: (self) => {
          measure();
          read(self);
        },
      });

      const frame = (_t: number, deltaMs: number) => {
        const dt = Math.min(deltaMs, 64) / 1000;
        if (first) {
          // arriving mid-page (reload, back button): be there, don't travel there
          first = false;
          engine.snap(targetT);
          o = targetO;
        }
        engine.setTarget(targetT);
        engine.step(dt);
        const gap = targetO - o;
        if (gap !== 0) o = Math.abs(gap) < 0.0002 ? targetO : o + gap * (1 - Math.exp(-dt * 11));
        const p = engine.p;
        if (p === last.p && o === last.o) return;

        if (p !== last.p) {
          let cur = 0;
          for (let i = 0; i < tls.length; i++) {
            tls[i].progress(clamp01((p - windows[i][0]) / (windows[i][1] - windows[i][0])));
            const k = clamp01((p - starts[i][0]) / (starts[i][1] - starts[i][0]));
            fills[i].style.transform = vertical ? `scaleY(${k.toFixed(4)})` : `scaleX(${k.toFixed(4)})`;
            if (p >= starts[i][0]) cur = i;
          }
          if (opened) el.hint.style.opacity = clamp01(1 - p / 0.03).toFixed(2);
          if (cur !== last.cur) setCurrent((last.cur = cur));
        }
        if (o !== last.o) {
          // the film steps back and becomes a plate on the page
          const e = easeInOut(clamp01((o - 0.04) / 0.82));
          el.plate.style.clipPath = e === 0 ? 'none' : `inset(${inset.map((v) => `${(v * e).toFixed(3)}%`).join(' ')})`;
          const chrome = clamp01(1 - o / 0.22);
          el.safe.style.opacity = chrome.toFixed(3);
          el.safe.style.visibility = chrome === 0 ? 'hidden' : 'visible';
          el.intro.toggleAttribute('data-in', o > 0.5);
          el.intro.style.visibility = o > 0.3 ? 'visible' : 'hidden';
          el.track.dataset.theme = o > 0.6 ? 'light' : 'dark';
        }
        last.p = p;
        last.o = o;
      };
      measure();
      gsap.ticker.add(frame);

      const ro = new ResizeObserver(() => measure());
      ro.observe(el.stage);
      return () => {
        window.clearTimeout(giveUp);
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onTouch);
        gsap.ticker.remove(frame);
        ro.disconnect();
        st.kill();
        engine.destroy();
      };
    }, stage);
    return () => ctx.revert();
  }, [enabled]);

  const jump = useCallback((i: number) => {
    const top = track.current!.getBoundingClientRect().top + window.scrollY;
    const s = STATIONS[i];
    const at = i === 0 ? 0 : progressOf(Math.round(s.from + (s.to - s.from) * 0.4));
    scrollToY(top + at * lens.current.tour);
  }, []);

  return (
    <div ref={track} className="tour-track" data-theme="dark">
      <div ref={stage} className="tour-stage">
        <div ref={intro} className="tour-intro invisible text-ink" data-reveal>
          <ProjectsIntro dict={dict} />
        </div>
        <div ref={plate} className="tour-plate">
          {/* a light first picture: the canvas takes over as soon as its first frame is in */}
          <Still name="poster" portrait="poster-p" className="absolute inset-0 h-full w-full object-cover object-[36%_50%]" eager />
          <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden="true" />
        </div>
        <div ref={safe} className="tour-safe">
          {STATIONS.map((s, i) => (
            <StationCopy key={s.id} station={s} index={i} dict={dict} lang={lang} />
          ))}

          <nav aria-label={dict.ui.tour}>
            <ol ref={rail} className="tour-rail invisible">
              {STATIONS.map((s, i) => (
                <li key={s.id}>
                  <button type="button" onClick={() => jump(i)} aria-current={i === current ? 'step' : undefined}>
                    <span className="name">{dict.stations[s.id].name}</span>
                    <span className="measure" aria-hidden="true">
                      <span />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <p ref={hint} className="t-note pointer-events-none invisible absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-paper/85 md:flex">
            <span className="relative block h-8 w-px overflow-hidden bg-paper/30" aria-hidden="true">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[thread_2.2s_cubic-bezier(0.77,0,0.175,1)_infinite] bg-paper" />
            </span>
            {dict.ui.scroll}
          </p>
        </div>

        <div ref={loader} className="tour-loader absolute inset-0 z-20 flex items-end bg-ink">
          <p className="wrap t-serif pb-10 text-xl text-paper/70">ModularDom</p>
        </div>
        <noscript>
          <style>{`.tour-loader,[data-station]:not(:first-child),.tour-stage nav{display:none}.tour-track{height:100lvh}`}</style>
        </noscript>
      </div>
    </div>
  );
}

/** Reduced motion, or a browser without AVIF: the same rooms and words, one still per screen. */
function StillTour({ dict, lang }: Props) {
  return (
    <>
      <div data-theme="dark">
        {STATIONS.map((s, i) => (
          <section key={s.id} className="still">
            <Still name={s.still} portrait={`${s.still}-p`} className="absolute inset-0 -z-10 h-full w-full object-cover" eager={i === 0} />
            <StationCopy station={s} index={i} dict={dict} lang={lang} />
          </section>
        ))}
      </div>
      <div className="bg-paper text-ink" data-theme="light">
        <div className="wrap max-w-[46rem] pb-6 pt-24 md:pt-32" data-reveal data-in>
          <ProjectsIntro dict={dict} />
        </div>
      </div>
    </>
  );
}
