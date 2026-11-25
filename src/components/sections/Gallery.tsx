'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Still } from '@/components/ui/Still';
import type { Dictionary, Locale, SpaceId } from '@/content/i18n';

/*
  The rooms of the concept house, as a strip you pull sideways.
  Mouse: drag with momentum (the release is projected like a scroll, never cut). Touch, trackpad
  and keyboard use the browser's own horizontal scrolling. Pictures shift a little inside their
  frames as they cross the screen, which gives the strip depth.
*/

const SPACES: { id: SpaceId; still: string; shape: string }[] = [
  { id: 'facana', still: 'space-facana', shape: 'aspect-[16/9] h-[44svh] md:h-[64svh]' },
  { id: 'acces', still: 'space-acces', shape: 'aspect-[2/3] h-[38svh] md:h-[52svh] mb-[9svh]' },
  { id: 'llindar', still: 'space-llindar', shape: 'aspect-[6/5] h-[34svh] md:h-[46svh]' },
  { id: 'sala', still: 'space-sala', shape: 'aspect-[16/9] h-[44svh] md:h-[64svh] mb-[5svh]' },
  { id: 'escala', still: 'space-escala', shape: 'aspect-[5/6] h-[40svh] md:h-[56svh]' },
  { id: 'cuina', still: 'space-cuina', shape: 'aspect-[16/9] h-[40svh] md:h-[58svh] mb-[8svh]' },
];

export function Gallery({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const scroller = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current!;
    const cur = cursor.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const imgs = [...el.querySelectorAll<HTMLImageElement>('.gallery-frame > img')];
    let raf = 0;

    const parallax = () => {
      raf = 0;
      if (reduced) return;
      const vw = window.innerWidth;
      for (const img of imgs) {
        const r = img.parentElement!.getBoundingClientRect();
        if (r.right < -200 || r.left > vw + 200) continue;
        const k = (r.left + r.width / 2 - vw / 2) / vw; // −0.5 … 0.5 across the screen
        img.style.transform = `translate3d(${(-k * 9).toFixed(2)}%, 0, 0)`;
      }
    };
    const queue = () => (raf ||= requestAnimationFrame(parallax));
    el.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    parallax();

    // —— mouse drag with momentum ——
    let dragging = false;
    let moved = 0;
    let startX = 0;
    let startLeft = 0;
    let glide = 0;
    const history: { x: number; t: number }[] = [];
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelAnimationFrame(glide);
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      history.length = 0;
      history.push({ x: e.clientX, t: e.timeStamp });
    };
    const move = (e: PointerEvent) => {
      // the label follows the pointer with a little weight
      tx = e.clientX;
      ty = e.clientY;
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 6 && !el.hasAttribute('data-dragging')) {
        el.setAttribute('data-dragging', '');
        el.setPointerCapture(e.pointerId);
      }
      el.scrollLeft = startLeft - dx;
      history.push({ x: e.clientX, t: e.timeStamp });
      if (history.length > 6) history.shift();
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.removeAttribute('data-dragging');
      const a = history[0];
      const b = history[history.length - 1];
      const v = b && a && b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0; // px/s
      if (e.timeStamp - (b?.t ?? 0) > 80 || Math.abs(v) < 60 || reduced) return;
      // where a scroll with this velocity would come to rest (Apple's deceleration, 0.998)
      const rate = 0.998;
      let from = el.scrollLeft;
      const to = from - ((v / 1000) * rate) / (1 - rate);
      let prev = performance.now();
      const step = (now: number) => {
        const dt = Math.min(now - prev, 50);
        prev = now;
        from += (to - from) * (1 - Math.exp(-dt / 325));
        el.scrollLeft = from;
        if (Math.abs(to - from) > 0.5) glide = requestAnimationFrame(step);
      };
      glide = requestAnimationFrame(step);
    };
    // a drag must not open the link it started on
    const click = (e: MouseEvent) => {
      if (moved > 6) e.preventDefault();
    };

    // —— the "drag" label ——
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let follow = 0;
    let inside = false;
    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      cur.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${inside ? 1 : 0.6})`;
      follow = inside || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    const enter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      inside = true;
      x = tx = e.clientX;
      y = ty = e.clientY;
      cur.style.opacity = '1';
      follow ||= requestAnimationFrame(loop);
    };
    const leave = () => {
      inside = false;
      cur.style.opacity = '0';
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(glide);
      cancelAnimationFrame(follow);
      el.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click, true);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <section className="relative bg-paper pb-24 pt-10 text-ink md:pb-36 md:pt-16" data-theme="light" aria-labelledby="projectes">
      <div ref={scroller} className="gallery" tabIndex={0} role="group" aria-label={dict.projects.name}>
        <ul className="flex w-max items-end gap-5 px-[var(--edge)] md:gap-10">
          {SPACES.map((s, i) => (
            <li key={s.id} className={`shrink-0 ${s.shape.split(' ').filter((c) => c.startsWith('mb-')).join(' ')}`}>
              <figure>
                <div className={`gallery-frame ${s.shape.replace(/mb-\[[^\]]+\]/g, '')}`}>
                  <Still name={s.still} alt="" />
                </div>
                <figcaption className="mt-3 flex items-baseline justify-between gap-6 text-[0.9375rem]">
                  <span>{dict.projects.spaces[s.id]}</span>
                  <span className="t-note t-num text-ink/70">
                    {String(i + 1).padStart(2, '0')} / {String(SPACES.length).padStart(2, '0')}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
          <li className="flex h-[44svh] shrink-0 items-center pl-4 pr-[8vw] md:h-[64svh]">
            <Link href={`/${lang}/projectes`} className="btn btn-line-ink" draggable={false}>
              {dict.ui.projects}
            </Link>
          </li>
        </ul>
      </div>
      <div
        ref={cursor}
        aria-hidden="true"
        className="t-note pointer-events-none fixed left-0 top-0 z-30 flex h-20 w-20 items-center justify-center rounded-full bg-ink text-paper opacity-0 transition-opacity duration-300"
      >
        {dict.ui.drag}
      </div>
    </section>
  );
}
