'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LeadForm } from '@/components/ui/LeadForm';
import { Lines } from '@/components/ui/Lines';
import { Reveal } from '@/components/ui/Reveal';
import { Still } from '@/components/ui/Still';
import { MENU, href, type Dictionary, type Locale } from '@/content/i18n';
import { CLIENT_AREA, CLOSING, COMPANY, LOGO, waHref } from '@/content/site';

gsap.registerPlugin(ScrollTrigger);

type Props = { dict: Dictionary; lang: Locale };

/* The house at night, full screen, settling from slightly too close as it arrives, with the one action that matters. */
export function Closing({ dict, lang }: Props) {
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
    <section ref={section} className="relative isolate flex min-h-[108svh] items-end overflow-hidden bg-ink text-paper" data-theme="dark" data-dock-off aria-labelledby="tancament">
      <div ref={picture} className="absolute inset-0 -z-10 will-change-transform">
        <Still name={CLOSING.still} className={`h-full w-full object-cover ${CLOSING.standIn ? 'brightness-[0.5] contrast-[1.12] saturate-[0.8] hue-rotate-[-8deg]' : ''}`} />
      </div>
      {/* the picture sinks into the ground of the next block, so the two read as one */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--color-ink),rgb(13_21_32/0.72)_22%,rgb(13_21_32/0.2)_55%,rgb(13_21_32/0.4))]" aria-hidden="true" />
      <Reveal className="wrap grid w-full gap-y-9 pb-16 pt-40 md:grid-cols-12 md:gap-x-10 md:pb-24">
        <h2 id="tancament" className="t-display !text-[clamp(3rem,1.4rem+6.4vw,8.5rem)] !leading-[0.96] md:col-span-8">
          <Lines lines={dict.closing.title} />
        </h2>
        <div className="md:col-span-4 md:col-start-9 md:self-end" data-fade>
          <p className="t-lead max-w-[34ch] text-paper/85">{dict.closing.text}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2">
            <Link href={href(lang, 'configurator')} className="btn btn-paper">
              {dict.ui.configure}
            </Link>
            <a href="#contacte" className="link text-[0.9375rem]">
              {dict.ui.info}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/*
  The conversation: a short form (information, or a visit to the show house in Bellvís) beside the
  direct ways to reach ModularDom. Used at the end of the home page and as the contact page.
*/
export function Contact({ dict, lang, as: Heading = 'h2' }: Props & { as?: 'h1' | 'h2' }) {
  const c = dict.closing;
  const [motive, setMotive] = useState(0);
  useEffect(() => {
    // "reserve a visit" links arrive with the visit already chosen
    if (new URLSearchParams(location.search).get('motiu') === 'visita') setMotive(1);
  }, []);
  const wa = waHref(motive === 1 ? dict.whatsapp.visit : dict.whatsapp.general);

  return (
    <section id="contacte" className="bg-ink text-paper" data-theme="dark" aria-labelledby="contacte-titol">
      <div className="wrap grid gap-y-14 pb-24 pt-10 md:grid-cols-12 md:gap-x-10 md:pb-36 md:pt-16">
        <Reveal className="md:col-span-5">
          <Heading id="contacte-titol" className="t-title">
            <span className="line">
              <span data-line>{c.form.title}</span>
            </span>
          </Heading>
          <dl className="mt-10 text-[1.0625rem]" data-fade>
            <div className="flex items-baseline justify-between gap-6 border-t border-paper/20 py-4">
              <dt className="t-note text-paper/70">{c.write}</dt>
              <dd>
                <a href={`mailto:${COMPANY.email}`} className="link">
                  {COMPANY.email}
                </a>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-t border-paper/20 py-4">
              <dt className="t-note text-paper/70">{c.call}</dt>
              <dd>
                <a href={`tel:${COMPANY.phone}`} className="link t-num">
                  {COMPANY.phoneLabel}
                </a>
              </dd>
            </div>
            {wa && (
              <div className="flex items-baseline justify-between gap-6 border-t border-paper/20 py-4">
                <dt className="t-note text-paper/70">WhatsApp</dt>
                <dd>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="link">
                    {dict.ui.whatsapp}
                  </a>
                </dd>
              </div>
            )}
            <div className="border-y border-paper/20 py-4">
              <dd className="t-serif text-[1.35rem] italic leading-snug text-gold-light">{c.showHouse}</dd>
            </div>
          </dl>
        </Reveal>
        <LeadForm
          key={motive}
          kind={motive === 1 ? 'visit' : 'info'}
          dict={dict}
          lang={lang}
          fields={['phone', 'city', 'message']}
          required={motive === 1 ? ['phone'] : []}
          submit={c.form.submit}
          buttonClass="btn btn-paper"
          chipOn="border-paper bg-paper text-ink"
          chipOff="border-paper/30 hover:border-paper"
          className="md:col-span-6 md:col-start-7"
        >
          <fieldset className="md:col-span-2">
            <legend className="mb-2 text-[0.8125rem] text-paper/75">{c.form.motive.label}</legend>
            <div className="flex flex-wrap gap-2">
              {c.form.motive.options.map((o, i) => (
                <label key={o} className={`flex min-h-11 cursor-pointer items-center border px-4 text-[0.9375rem] font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${motive === i ? 'border-paper bg-paper text-ink' : 'border-paper/30 hover:border-paper'}`}>
                  <input type="radio" name="motive" className="sr-only" checked={motive === i} onChange={() => setMotive(i)} />
                  {o}
                </label>
              ))}
            </div>
          </fieldset>
        </LeadForm>
      </div>
    </section>
  );
}

/** The footer waits underneath: the last block lifts off it like a sheet (see the page layout). */
export function Footer({ dict, lang }: Props) {
  return (
    <footer className="sticky bottom-[var(--dock-h)] z-0 bg-[#0a1019] text-paper" data-theme="dark">
      <div className="wrap grid gap-y-10 py-14 md:grid-cols-12 md:gap-x-10 md:py-16">
        <div className="md:col-span-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO.badge} width={112} height={112} alt="ModularDom" className="h-28 w-28" loading="lazy" />
        </div>
        <nav aria-label="ModularDom" className="md:col-span-7 md:col-start-6">
          <ul className="grid grid-cols-2 gap-x-8 text-[0.9375rem] md:grid-cols-3">
            {MENU.map((n) => (
              <li key={n.key}>
                <Link href={n.key === 'clients' && CLIENT_AREA.enabled ? CLIENT_AREA.url : href(lang, n.key)} className="inline-flex min-h-11 items-center text-paper/75 transition-colors duration-200 hover:text-paper">
                  {dict.nav[n.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="t-note flex flex-wrap items-center gap-x-8 gap-y-1 border-t border-paper/15 pt-6 text-paper/70 md:col-span-12">
          <p>
            © {new Date().getFullYear()} {COMPANY.legalName} · CIF {COMPANY.taxId}
          </p>
          <p>{COMPANY.region}</p>
          <p>{dict.ui.rights}</p>
          <Link href={href(lang, 'privacy')} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-paper">
            {dict.footer.legal}
          </Link>
        </div>
      </div>
    </footer>
  );
}
