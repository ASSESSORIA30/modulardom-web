'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Reveal } from '@/components/ui/Reveal';
import { stillUrl } from '@/components/ui/Still';
import type { Dictionary, Locale } from '@/content/i18n';

/** The word is cut out of the house's own stone; the stone drifts behind the letters as you pass. */
export function Mineral({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const word = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = word.current!;
    let raf = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const update = () => {
      raf = 0;
      if (!visible) return;
      const r = el.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / window.innerHeight));
      el.style.setProperty('--shift', `${(20 + k * 50).toFixed(1)}%`);
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section className="overflow-hidden bg-ink text-paper" data-theme="dark" aria-labelledby="mineral">
      <Reveal className="wrap py-24 md:py-36">
        <h2 id="mineral" className="sr-only">
          {dict.mineral.title}
        </h2>
        <p className="font-display text-[clamp(1.25rem,1rem+1vw,2rem)] text-paper/80" aria-hidden="true" data-fade>
          ModularDom
        </p>
        <p ref={word} className="mineral-word -ml-[0.04em] mt-2" style={{ backgroundImage: `url(${stillUrl('mineral')})` }} aria-hidden="true">
          MINERAL
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-12 md:gap-x-10" data-fade style={{ '--i': 2 } as React.CSSProperties}>
          <p className="t-lead max-w-[36ch] text-paper/80 md:col-span-5 md:col-start-7">{dict.mineral.text}</p>
          <div className="md:col-span-5 md:col-start-7">
            <Link href={`/${lang}/mineral`} className="btn btn-line">
              {dict.ui.more}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
