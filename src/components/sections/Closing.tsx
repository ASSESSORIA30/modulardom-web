'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lines } from '@/components/ui/Lines';
import { Reveal } from '@/components/ui/Reveal';
import { Still } from '@/components/ui/Still';
import { NAV, type Dictionary, type Locale } from '@/content/i18n';
import { CLOSING, WHATSAPP } from '@/content/site';

gsap.registerPlugin(ScrollTrigger);

/*
  The house at night, full screen: the page ends where it began. The picture settles from slightly
  too close as it arrives. Three ways on: configure, ask, visit; and WhatsApp once there is a
  verified number (src/content/site.ts).
*/
export function Closing({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const section = useRef<HTMLElement>(null);
  const picture = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(
      picture.current,
      { scale: 1.18, yPercent: -7 },
      { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom bottom', scrub: 0.4 } },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section ref={section} className="relative isolate flex min-h-[112svh] items-end overflow-hidden bg-ink text-paper" data-theme="dark" data-dock-off aria-labelledby="tancament">
      <div ref={picture} className="absolute inset-0 -z-10 will-change-transform">
        <Still name={CLOSING.still} className={`h-full w-full object-cover ${CLOSING.standIn ? 'brightness-[0.5] contrast-[1.12] saturate-[0.8] hue-rotate-[-8deg]' : ''}`} />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(10_14_14/0.86),rgb(10_14_14/0.22)_50%,rgb(10_14_14/0.38))]" aria-hidden="true" />
      <Reveal className="wrap grid w-full gap-y-9 pb-14 pt-40 md:grid-cols-12 md:gap-x-10 md:pb-24">
        <h2 id="tancament" className="t-display !text-[clamp(3rem,1.4rem+6.4vw,8.5rem)] !leading-[0.96] md:col-span-8">
          <Lines lines={dict.closing.title} />
        </h2>
        <div className="md:col-span-4 md:col-start-9 md:self-end" data-fade>
          <p className="t-lead max-w-[34ch] text-paper/85">{dict.closing.text}</p>
          <div className="mt-7 flex flex-col items-start gap-3">
            <Link href={`/${lang}/configurador`} className="btn btn-paper">
              {dict.ui.configure}
            </Link>
            <div className="flex flex-wrap gap-x-7">
              <Link href={`/${lang}/contacte`} className="link text-[0.9375rem]">
                {dict.ui.info}
              </Link>
              <Link href={`/${lang}/contacte?motiu=visita`} className="link text-[0.9375rem]">
                {dict.ui.visit}
              </Link>
              {WHATSAPP.enabled && WHATSAPP.number && (
                <a href={`https://wa.me/${WHATSAPP.number}`} target="_blank" rel="noopener noreferrer" className="link text-[0.9375rem]">
                  {dict.ui.whatsapp}
                </a>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <footer className="bg-ink text-paper" data-theme="dark">
      <div className="wrap grid gap-y-12 border-t border-paper/15 py-14 md:grid-cols-12 md:gap-x-10 md:py-20">
        <p className="t-serif text-3xl md:col-span-4">ModularDom</p>
        <ul className="grid grid-cols-2 gap-x-8 text-[0.9375rem] md:col-span-7 md:col-start-6 md:grid-cols-3">
          {NAV.map((n) => (
            <li key={n.key}>
              <Link href={`/${lang}/${n.slug}`} className="inline-flex min-h-11 items-center text-paper/75 transition-colors duration-200 hover:text-paper">
                {dict.nav[n.key]}
              </Link>
            </li>
          ))}
        </ul>
        <p className="t-note text-paper/70 md:col-span-12">
          © {new Date().getFullYear()} ModularDom. {dict.ui.rights}
        </p>
      </div>
    </footer>
  );
}
