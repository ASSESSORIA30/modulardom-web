'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lines } from '@/components/ui/Lines';
import { Reveal } from '@/components/ui/Reveal';
import { Still } from '@/components/ui/Still';
import { NAV, type Dictionary, type Locale } from '@/content/i18n';
import { CLOSING, COMPANY, LOGO, WHATSAPP } from '@/content/site';
import { submitLead } from '@/lib/crm';

gsap.registerPlugin(ScrollTrigger);

type Props = { dict: Dictionary; lang: Locale };

/*
  The end of the page, in two movements. First the house at night, full screen, settling from
  slightly too close as it arrives, with the one action that matters. Then the conversation:
  a short form (information, or a visit to the show house in Bellvís) beside the direct ways to
  reach ModularDom. The form goes through submitLead(), which sends nothing until the CRM is on.
*/
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
    <>
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
              <Link href={`/${lang}/configurador`} className="btn btn-paper">
                {dict.ui.configure}
              </Link>
              <a href="#contacte" className="link text-[0.9375rem]">
                {dict.ui.info}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="contacte" className="bg-ink text-paper" data-theme="dark" aria-labelledby="contacte-titol">
        <div className="wrap grid gap-y-14 pb-24 pt-10 md:grid-cols-12 md:gap-x-10 md:pb-36 md:pt-16">
          <Reveal className="md:col-span-5">
            <h2 id="contacte-titol" className="t-title">
              <span className="line">
                <span data-line>{dict.closing.form.title}</span>
              </span>
            </h2>
            <dl className="mt-10 text-[1.0625rem]" data-fade>
              <div className="flex items-baseline justify-between gap-6 border-t border-paper/20 py-4">
                <dt className="t-note text-paper/70">{dict.closing.write}</dt>
                <dd>
                  <a href={`mailto:${COMPANY.email}`} className="link">
                    {COMPANY.email}
                  </a>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-6 border-t border-paper/20 py-4">
                <dt className="t-note text-paper/70">{dict.closing.call}</dt>
                <dd>
                  <a href={`tel:${COMPANY.phone}`} className="link t-num">
                    {COMPANY.phoneLabel}
                  </a>
                </dd>
              </div>
              {WHATSAPP.enabled && WHATSAPP.number && (
                <div className="flex items-baseline justify-between gap-6 border-t border-paper/20 py-4">
                  <dt className="t-note text-paper/70">WhatsApp</dt>
                  <dd>
                    <a href={`https://wa.me/${WHATSAPP.number}`} target="_blank" rel="noopener noreferrer" className="link">
                      {dict.ui.whatsapp}
                    </a>
                  </dd>
                </div>
              )}
              <div className="border-y border-paper/20 py-4">
                <dd className="t-serif text-[1.35rem] italic leading-snug text-gold-light">{dict.closing.showHouse}</dd>
              </div>
            </dl>
          </Reveal>
          <ContactForm dict={dict} lang={lang} />
        </div>
      </section>
    </>
  );
}

function ContactForm({ dict, lang }: Props) {
  const f = dict.closing.form;
  const [motive, setMotive] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'ready' | 'error'>('idle');
  const [missing, setMissing] = useState<string[]>([]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? '').trim();
    const bad = ['name', 'email'].filter((k) => !get(k) || (k === 'email' && !/^\S+@\S+\.\S+$/.test(get(k))));
    setMissing(bad);
    if (bad.length) {
      (e.currentTarget.elements.namedItem(bad[0]) as HTMLElement)?.focus();
      return;
    }
    setState('sending');
    const res = await submitLead({ source: motive === 1 ? 'visit' : 'contact', locale: lang, name: get('name'), email: get('email'), phone: get('phone'), message: get('message') });
    setState(res.ok ? 'ready' : 'error');
  };

  return (
    <form onSubmit={submit} noValidate className="grid content-start gap-x-8 gap-y-6 md:col-span-6 md:col-start-7 md:grid-cols-2">
      <fieldset className="md:col-span-2">
        <legend className="mb-2 text-[0.8125rem] text-paper/75">{f.motive.label}</legend>
        <div className="flex flex-wrap gap-2">
          {f.motive.options.map((o, i) => (
            <label key={o} className={`flex min-h-11 cursor-pointer items-center border px-4 text-[0.9375rem] font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${motive === i ? 'border-paper bg-paper text-ink' : 'border-paper/30 hover:border-paper'}`}>
              <input type="radio" name="motive" className="sr-only" checked={motive === i} onChange={() => setMotive(i)} />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
      {(['name', 'email', 'phone'] as const).map((k) => (
        <label key={k} className={`field ${k === 'name' ? 'md:col-span-2' : ''}`}>
          <span>
            {f[k]}
            {k !== 'phone' && <span aria-hidden="true"> *</span>}
          </span>
          <input
            name={k}
            type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
            autoComplete={k === 'name' ? 'name' : k === 'email' ? 'email' : 'tel'}
            required={k !== 'phone'}
            aria-invalid={missing.includes(k) || undefined}
            aria-describedby={missing.includes(k) ? `c-err-${k}` : undefined}
          />
          {missing.includes(k) && (
            <span id={`c-err-${k}`} className="!opacity-100 text-[#f0a08c]">
              {f.required}
            </span>
          )}
        </label>
      ))}
      <label className="field md:col-span-2">
        <span>{f.message}</span>
        <textarea name="message" rows={3} />
      </label>
      <div className="md:col-span-2">
        <button type="submit" disabled={state === 'sending'} className="btn btn-paper disabled:opacity-60">
          {f.submit}
        </button>
        <p role="status" className="t-note mt-4 max-w-[46ch] text-paper/80">
          {state === 'ready' ? f.ready : state === 'error' ? f.error : ''}
        </p>
      </div>
    </form>
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
        <ul className="grid grid-cols-2 gap-x-8 text-[0.9375rem] md:col-span-7 md:col-start-6 md:grid-cols-3">
          {NAV.map((n) => (
            <li key={n.key}>
              <Link href={`/${lang}/${n.slug}`} className="inline-flex min-h-11 items-center text-paper/75 transition-colors duration-200 hover:text-paper">
                {dict.nav[n.key]}
              </Link>
            </li>
          ))}
        </ul>
        <div className="t-note flex flex-wrap gap-x-8 gap-y-1 border-t border-paper/15 pt-6 text-paper/70 md:col-span-12">
          <p>
            © {new Date().getFullYear()} {COMPANY.legalName} · CIF {COMPANY.taxId}
          </p>
          <p>{COMPANY.region}</p>
          <p>{dict.ui.rights}</p>
          <p>{dict.footer.legal}</p>
        </div>
      </div>
    </footer>
  );
}
