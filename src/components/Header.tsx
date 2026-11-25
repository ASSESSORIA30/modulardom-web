'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LOCALES, NAV, type Dictionary, type Locale } from '@/content/i18n';
import { stopScroll } from '@/lib/scroll';

type Props = { dict: Dictionary; lang: Locale };

/*
  Three things only: the name, the language, the menu. The bar is clear; its ink follows the
  section underneath (each section declares data-theme). The menu opens as a sheet drawn down
  from the bar and closes back into it.
*/
export function Header({ dict, lang }: Props) {
  const pathname = usePathname();
  const [light, setLight] = useState(false);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      let theme = 'light';
      for (const el of document.querySelectorAll<HTMLElement>('[data-theme]')) {
        const r = el.getBoundingClientRect();
        if (r.top <= 36 && r.bottom > 36) theme = el.dataset.theme ?? 'light';
      }
      setLight(theme === 'light');
    };
    const queue = () => (raf ||= requestAnimationFrame(check));
    check();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    const mo = new MutationObserver(queue);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
    };
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    stopScroll(open);
    if (!open) return;
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
  const tone = open || !light ? 'text-paper' : 'text-ink';

  const languages = (
    <ul className="flex items-center text-[0.875rem]" aria-label={dict.ui.language}>
      {LOCALES.map((l, i) => (
        <li key={l} className="flex items-center">
          {i > 0 && <span className="mx-0.5 h-3 w-px bg-current opacity-35" aria-hidden="true" />}
          <Link
            href={`/${l}${rest}`}
            hrefLang={l}
            lang={l}
            aria-current={l === lang ? 'true' : undefined}
            className={`inline-flex min-h-11 min-w-10 items-center justify-center transition-opacity duration-200 hover:opacity-100 ${l === lang ? 'opacity-100' : 'opacity-50'}`}
          >
            {l === 'ca' ? 'Cat' : 'Es'}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <a href="#contingut" className="fixed left-4 top-4 z-[70] -translate-y-24 bg-paper px-4 py-3 text-sm font-medium text-ink focus:translate-y-0">
        {dict.ui.skip}
      </a>
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${tone}`}>
        <div className="wrap flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href={`/${lang}`} className="font-display text-[1.375rem] leading-none tracking-[0.01em]">
            ModularDom
          </Link>
          <div className="flex items-center gap-3 md:gap-7">
            <div className="hidden sm:block">{languages}</div>
            <button
              ref={toggle}
              type="button"
              className="group -mr-2 inline-flex min-h-11 items-center gap-3 px-2 text-[0.9375rem] font-medium"
              aria-expanded={open}
              aria-controls="menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block overflow-hidden">
                <span className={`block transition-transform duration-500 ease-[var(--ease-out)] ${open ? '-translate-y-full' : ''}`}>{dict.ui.menu}</span>
                <span className={`absolute inset-0 transition-transform duration-500 ease-[var(--ease-out)] ${open ? '' : 'translate-y-full'}`} aria-hidden={!open}>
                  {dict.ui.close}
                </span>
              </span>
              <span className="relative block h-2.5 w-7" aria-hidden="true">
                <span className={`absolute inset-x-0 top-0 h-px bg-current transition-transform duration-500 ease-[var(--ease-out)] ${open ? 'translate-y-[5px] rotate-[20deg]' : 'group-hover:translate-x-1'}`} />
                <span className={`absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-500 ease-[var(--ease-out)] ${open ? '-translate-y-[4px] -rotate-[20deg]' : 'group-hover:-translate-x-1'}`} />
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
        className="glass fixed inset-0 z-40 overflow-y-auto bg-ink/[0.93] text-paper backdrop-blur-xl"
        style={{
          clipPath: open ? 'inset(0)' : 'inset(0 0 100% 0)',
          visibility: open ? 'visible' : 'hidden',
          // opens unhurried, closes faster: the system answering, not performing
          transition: open
            ? 'clip-path 500ms var(--ease-in-out), visibility 0s'
            : 'clip-path 350ms var(--ease-in-out), visibility 0s 350ms',
        }}
      >
        <div className="wrap grid min-h-full content-end gap-10 pb-10 pt-28 md:grid-cols-12 md:gap-x-10 md:pb-16">
          <nav aria-label={dict.ui.menu} className="md:col-span-8">
            <ul className="md:columns-2 md:gap-x-10">
              {NAV.map((n, i) => (
                <li key={n.key} className="break-inside-avoid overflow-hidden border-b border-paper/15">
                  <Link
                    href={`/${lang}/${n.slug}`}
                    aria-current={rest === `/${n.slug}` ? 'page' : undefined}
                    className="group flex min-h-[3.75rem] items-center justify-between gap-6 font-display text-[clamp(1.5rem,1.1rem+1.5vw,2.25rem)] leading-tight"
                    style={{
                      transform: open ? 'none' : 'translateY(105%)',
                      transition: `transform ${open ? 700 : 0}ms var(--ease-out) ${open ? 120 + i * 40 : 350}ms`,
                    }}
                  >
                    <span className="transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-3">{dict.nav[n.key]}</span>
                    <span className="block h-px w-8 origin-right scale-x-0 bg-current transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-x-100" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-end justify-between gap-6 md:col-span-3 md:col-start-10 md:flex-col md:items-start md:justify-end">
            <Link href={`/${lang}/configurador`} className="btn btn-paper">
              {dict.ui.configure}
            </Link>
            <div className="sm:hidden">{languages}</div>
          </div>
        </div>
      </div>
    </>
  );
}
