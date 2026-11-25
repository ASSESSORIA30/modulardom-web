'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Dictionary, Locale } from '@/content/i18n';
import { FRAMES, SCENES, frameUrl } from '@/content/scenes';
import { scrollToY } from '@/lib/scroll';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { FrameEngine } from './engine';
import { ProgressRail } from './ProgressRail';
import { SceneCopy } from './SceneCopy';
import { clamp01, currentScene, sample, sceneProgress, sceneStart, totalUnits } from './timeline';

gsap.registerPlugin(ScrollTrigger);

type Props = { dict: Dictionary; lang: Locale };

export function Journey(props: Props) {
  return useReducedMotion() ? <StaticTour {...props} /> : <ScrollTour {...props} />;
}

const N = SCENES.length;
const T = totalUnits(N);
/* when, in a scene's own 0 → 1, its copy arrives and leaves: always clear of the dissolves */
const IN = 0.17;
const OUT = 0.66;

function Still({ id, frame, eager }: { id: string; frame: number; eager?: boolean }) {
  return (
    <picture>
      <source media="(max-aspect-ratio: 1/1)" srcSet={frameUrl(id, 'sm', frame)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frameUrl(id, 'lg', frame)}
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        style={{ objectPosition: `${FRAMES[id].focusX * 100}% 50%` }}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  );
}

function ScrollTour({ dict, lang }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = { stage: stage.current!, canvas: canvas.current!, veil: veil.current!, hint: hint.current! };
    let opened = false;

    const ctx = gsap.context(() => {
      const boxes = gsap.utils.toArray<HTMLElement>('[data-scene-box]');
      const words = (b: HTMLElement) => b.querySelectorAll('[data-word]');
      const fades = (b: HTMLElement) => b.querySelectorAll('[data-fade]');

      const open = () => {
        if (opened) return;
        opened = true;
        el.canvas.style.opacity = '1';
        gsap.to(loader.current, { autoAlpha: 0, duration: 0.9, ease: 'power2.out' });
        gsap.fromTo(words(boxes[0]), { yPercent: 118 }, { yPercent: 0, duration: 1.4, stagger: 0.07, ease: 'expo.out', delay: 0.25 });
        gsap.fromTo(fades(boxes[0]), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out', delay: 0.7 });
        gsap.fromTo(el.hint, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 1.6 });
      };

      const engine = new FrameEngine(
        el.canvas,
        SCENES.map((s) => ({ id: s.id, count: FRAMES[s.id].count, focusX: FRAMES[s.id].focusX })),
        open,
      );
      const giveUp = window.setTimeout(open, 5000); // never hold the page behind a slow network

      // one paused timeline per scene, 1 long, scrubbed with the scene's own progress
      const tls = boxes.map((box, i) => {
        const tl = gsap.timeline({ paused: true });
        if (i > 0) {
          tl.fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: 'none' }, IN);
          tl.fromTo(words(box), { yPercent: 118 }, { yPercent: 0, duration: 0.13, stagger: 0.012, ease: 'power3.out' }, IN);
          tl.fromTo(fades(box), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1, stagger: 0.02, ease: 'power2.out' }, IN + 0.07);
        }
        if (i < N - 1) {
          tl.fromTo(words(box), { yPercent: 0 }, { yPercent: -118, duration: 0.12, stagger: 0.008, ease: 'power2.in', immediateRender: false }, OUT);
          tl.fromTo(fades(box), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.07, ease: 'none', immediateRender: false }, OUT);
          tl.to(box, { autoAlpha: 0, duration: 0.03, ease: 'none' }, OUT + 0.15);
        }
        tl.set({}, {}, 1);
        return tl;
      });

      const state = { t: 0 };
      let cur = 0;
      const render = () => {
        const t = state.t;
        engine.setTime(t);
        const s = sample(t, N);
        // each dissolve passes through warm light, like stepping from one room's glow into the next:
        // the picture lifts, the clips trade places under it, the new room settles
        el.veil.style.opacity = s.under !== null ? (Math.sin(Math.PI * s.mix) ** 1.4 * 0.62).toFixed(3) : '0';
        tls.forEach((tl, i) => tl.progress(sceneProgress(i, t)));
        el.stage.style.setProperty('--tour', clamp01(t / sceneStart(N - 1)).toFixed(4));
        if (opened) el.hint.style.opacity = clamp01(1 - t / 0.05).toFixed(2);
        const c = currentScene(s);
        if (c !== cur) setCurrent((cur = c));
      };

      gsap.to(state, {
        t: T,
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
          trigger: track.current,
          start: 'top top',
          end: 'bottom bottom',
          // wheel is already eased by Lenis; touch gets a little more to tame flings
          scrub: ScrollTrigger.isTouch === 1 ? 0.5 : 0.25,
        },
      });
      render();

      const ro = new ResizeObserver(() => engine.resize());
      ro.observe(el.canvas);
      return () => {
        window.clearTimeout(giveUp);
        ro.disconnect();
        engine.destroy();
      };
    }, stage);
    return () => ctx.revert();
  }, []);

  const jump = useCallback((i: number) => {
    const tr = track.current!;
    const top = tr.getBoundingClientRect().top + window.scrollY;
    const span = tr.offsetHeight - window.innerHeight;
    scrollToY(top + (i === 0 ? 0 : ((sceneStart(i) + 0.3) / T) * span));
  }, []);

  return (
    <div ref={track} className="tour-track" data-tour style={{ '--units': T } as React.CSSProperties}>
      <div ref={stage} className="tour-stage">
        <Still id={SCENES[0].id} frame={1} eager />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700" aria-hidden="true" />
        <div ref={veil} className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,#fff3dc,#f1d3a4)] opacity-0" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div className="tour-safe">
          {SCENES.map((scene, i) => (
            <SceneCopy key={scene.id} scene={scene} index={i} total={N} dict={dict} lang={lang} />
          ))}
          <ProgressRail labels={SCENES.map((s) => dict.scenes[s.id].label)} current={current} title={dict.ui.tour} onJump={jump} />
          <p
            ref={hint}
            className="eyebrow pointer-events-none invisible absolute bottom-6 right-[var(--edge)] hidden items-center gap-3 text-ivory/80 md:flex"
          >
            {dict.ui.scroll}
            <span className="relative block h-9 w-px overflow-hidden bg-ivory/25" aria-hidden="true">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[drop_2.4s_cubic-bezier(.6,0,.2,1)_infinite] bg-ivory" />
            </span>
          </p>
        </div>
        <div ref={loader} className="tour-loader absolute inset-0 z-20 flex items-center justify-center bg-anthracite">
          <p className="eyebrow animate-pulse text-ivory/70">ModularDom</p>
        </div>
        <noscript>
          <style>{`.tour-loader,[data-scene-box]:not(:first-child),.tour-stage nav{display:none}.tour-track{height:100lvh}`}</style>
        </noscript>
      </div>
    </div>
  );
}

/** Reduced motion: the same rooms and words, one still per screen, nothing tied to the scroll. */
function StaticTour({ dict, lang }: Props) {
  return (
    <div data-tour>
      {SCENES.map((scene, i) => (
        <section key={scene.id} className="still">
          <Still id={scene.id} frame={scene.still} eager={i === 0} />
          <SceneCopy scene={scene} index={i} total={N} dict={dict} lang={lang} />
        </section>
      ))}
    </div>
  );
}
