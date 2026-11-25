'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LOCALES, NAV, type Dictionary, type Locale } from '@/content/i18n';
import { stopScroll } from '@/lib/scroll';

type Props = { dict: Dictionary; lang: Locale };

export function Header({ dict, lang }: Props) {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // clear over the tour, ivory once the page leaves it (or where there is no tour)
  useEffect(() => {
    const check = () => {
      const tour = document.querySelector('[data-tour]');
      setSolid(!tour || tour.getBoundingClientRect().bottom < 72);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    stopScroll(open);
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const rest = pathname.replace(/^\/(ca|es)/, '');
  const main = NAV.filter((n) => n.key !== 'clients');
  const tone = open ? 'text-ivory' : solid ? 'text-anthracite' : 'text-ivory';

  const languages = (
    <ul className="flex items-center gap-1 text-[0.8125rem] font-medium" aria-label={dict.ui.language}>
      {LOCALES.map((l, i) => (
        <li key={l} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-40" aria-hidden="true">/</span>}
          <Link
            href={`/${l}${rest}`}
            hrefLang={l}
            lang={l}
            aria-current={l === lang ? 'true' : undefined}
            className={`inline-flex min-h-11 min-w-9 items-center justify-center tracking-[0.08em] transition-opacity hover:opacity-100 ${
              l === lang ? 'opacity-100' : 'opacity-55'
            }`}
          >
            {l === 'ca' ? 'CAT' : 'ES'}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <a
        href="#contingut"
        className="fixed left-4 top-4 z-[70] -translate-y-24 bg-ivory px-4 py-3 text-sm font-medium text-anthracite focus:translate-y-0"
      >
        {dict.ui.skip}
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${tone} ${
          solid && !open ? 'bg-ivory/90 backdrop-blur-md' : ''
        }`}
      >
        <div className="wrap flex h-[4.5rem] items-center justify-between gap-6">
          <Link href={`/${lang}`} className="text-[0.9375rem] font-semibold tracking-[0.22em]" aria-label="ModularDom">
            MODULAR<span className="font-normal">DOM</span>
          </Link>
          <nav className="hidden nav:block" aria-label={dict.ui.menu}>
            <ul className="flex items-center gap-7 text-[0.8125rem] font-medium">
              {main.map((n) => (
                <li key={n.key}>
                  <Link
                    href={`/${lang}/${n.slug}`}
                    className="nav-link whitespace-nowrap"
                    aria-current={rest === `/${n.slug}` ? 'page' : undefined}
                  >
                    {dict.nav[n.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:block">{languages}</div>
            <Link
              href={`/${lang}/area-de-clients`}
              className="hidden min-h-11 items-center whitespace-nowrap border border-current/40 px-4 text-[0.8125rem] font-medium transition-colors hover:border-current md:inline-flex"
            >
              {dict.nav.clients}
            </Link>
            <button
              ref={toggle}
              type="button"
              className="group inline-flex min-h-11 items-center gap-3 text-[0.8125rem] font-medium tracking-[0.08em] nav:hidden"
              aria-expanded={open}
              aria-controls="menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? dict.ui.close : dict.ui.menu}
              <span className="relative block h-3 w-6" aria-hidden="true">
                <span className={`absolute inset-x-0 top-0 h-px bg-current transition-transform duration-500 ease-out-expo ${open ? 'translate-y-[6px] rotate-45' : ''}`} />
                <span className={`absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-500 ease-out-expo ${open ? '-translate-y-[5px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="menu"
        ref={menu}
        role="dialog"
        aria-modal="true"
        aria-label={dict.ui.menu}
        inert={!open}
        className={`fixed inset-0 z-40 overflow-y-auto bg-anthracite text-ivory transition-[opacity,visibility] duration-500 nav:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="wrap flex min-h-full flex-col justify-between gap-10 pb-8 pt-28">
          <ul className="grid gap-x-12 md:grid-cols-2">
            {NAV.map((n, i) => (
              <li key={n.key} className="border-b border-ivory/15">
                <Link
                  href={`/${lang}/${n.slug}`}
                  className={`flex min-h-14 items-baseline gap-4 py-3 font-display text-[clamp(1.6rem,5.2vw,2.6rem)] font-light leading-tight tracking-[-0.02em] transition-[opacity,transform] duration-700 ease-out-expo hover:translate-x-2 ${
                    open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                  style={{ transitionDelay: open ? `${80 + i * 35}ms` : '0ms' }}
                >
                  <span className="eyebrow w-6 text-ivory/50">{String(i + 1).padStart(2, '0')}</span>
                  {dict.nav[n.key]}
                </Link>
              </li>
            ))}
          </ul>
          <div className="sm:hidden">{languages}</div>
        </div>
      </div>
    </>
  );
}
