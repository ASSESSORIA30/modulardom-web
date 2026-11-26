'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LOCALES, MENU, NAV, href, type Dictionary, type Locale } from '@/content/i18n';
import { CLIENT_AREA, LOGO } from '@/content/site';
import { stopScroll } from '@/lib/scroll';

type Props = { dict: Dictionary; lang: Locale };

/** The original logotype once its file is set in src/content/site.ts; the name in type until then. */
function Logo() {
  if (LOGO.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={LOGO.src} width={LOGO.width} height={LOGO.height} alt="ModularDom" className="h-7 w-auto" />;
  }
  return <span className="t-serif text-[1.45rem] leading-none tracking-[-0.01em]">ModularDom</span>;
}

/*
  The bar: the name, then the two things a visitor is most likely to want (the configurator,
  a way to talk), the language and the menu. It is clear; its ink follows the section underneath
  (each section declares data-theme). On a phone the two actions move to a dock at the thumb.
  The menu is a sheet drawn down from the bar: it opens unhurried and closes faster.
*/
export function Header({ dict, lang }: Props) {
  const pathname = usePathname();
  const [light, setLight] = useState(false);
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
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
      // the dock arrives once the visitor has started to move, and steps aside for the closing's own actions
      const end = document.querySelector('[data-dock-off]')?.getBoundingClientRect();
      setDocked(window.scrollY > 40 && !(end && end.top < window.innerHeight * 0.6));
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

  // the same page in the other language has its own address
  const slug = pathname.split('/')[2] ?? '';
  const here = NAV.find((n) => n.slug[lang] === slug);
  const other = (l: Locale) => (here ? href(l, here.key) : `/${l}`);
  const tone = open || !light ? 'text-paper' : 'text-ink';

  const languages = (
    <ul className="flex items-center text-[0.875rem]" aria-label={dict.ui.language}>
      {LOCALES.map((l, i) => (
        <li key={l} className="flex items-center">
          {i > 0 && <span className="mx-0.5 h-3 w-px bg-current opacity-35" aria-hidden="true" />}
          <Link
            href={other(l)}
            hrefLang={l}
            lang={l}
            aria-current={l === lang ? 'true' : undefined}
            className={`inline-flex min-h-11 min-w-10 items-center justify-center transition-opacity duration-200 hover:opacity-100 ${l === lang ? 'opacity-100' : 'opacity-60'}`}
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
          <Link href={`/${lang}`} aria-label="ModularDom" className="inline-flex min-h-11 items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 md:gap-6">
            <Link href={href(lang, 'contact')} className="link hidden text-[0.9375rem] md:inline-flex">
              {dict.ui.contactShort}
            </Link>
            <Link href={href(lang, 'configurator')} className={`btn btn-sm hidden md:inline-flex ${open || !light ? 'btn-line' : 'btn-line-ink'}`}>
              {dict.ui.configureShort}
            </Link>
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
        role="dialog"
        aria-modal="true"
        aria-label={dict.ui.menu}
        inert={!open}
        className="glass fixed inset-0 z-40 overflow-y-auto bg-ink/[0.94] text-paper backdrop-blur-2xl"
        style={{
          clipPath: open ? 'inset(0)' : 'inset(0 0 100% 0)',
          visibility: open ? 'visible' : 'hidden',
          transition: open ? 'clip-path 500ms var(--ease-drawer), visibility 0s' : 'clip-path 320ms var(--ease-in-out), visibility 0s 320ms',
        }}
      >
        <div className="wrap grid min-h-full content-end gap-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-28 md:grid-cols-12 md:gap-x-10 md:pb-16">
          <nav aria-label={dict.ui.menu} className="md:col-span-8">
            <ul className="md:columns-2 md:gap-x-12">
              {MENU.map((n, i) => (
                <li key={n.key} className="break-inside-avoid overflow-hidden border-b border-paper/15">
                  <Link
                    // the clients' area is ModularDom's CRM portal, once it is switched on
                    href={n.key === 'clients' && CLIENT_AREA.enabled ? CLIENT_AREA.url : href(lang, n.key)}
                    aria-current={here?.key === n.key ? 'page' : undefined}
                    className="group flex min-h-[3.9rem] items-center gap-5 t-serif text-[clamp(1.6rem,1.15rem+1.7vw,2.5rem)] leading-tight"
                    style={{
                      // each row rises out of its own rule, later the lower it is; on closing they simply go
                      transform: open ? 'none' : 'translateY(110%)',
                      opacity: open ? 1 : 0,
                      transition: open ? `transform 720ms var(--ease-out) ${140 + i * 42}ms, opacity 400ms ease ${140 + i * 42}ms` : 'transform 0s 320ms, opacity 200ms ease',
                    }}
                  >
                    <span className="t-note t-num w-6 font-sans text-paper/70">{String(i + 1).padStart(2, '0')}</span>
                    <span className="transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-2 group-hover:italic">{dict.nav[n.key]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-6 md:col-span-3 md:col-start-10 md:flex-col md:items-start md:justify-end">
            <div className="flex flex-col items-start gap-1">
              <Link href={href(lang, 'configurator')} className="btn btn-paper">
                {dict.ui.configure}
              </Link>
              <Link href={href(lang, 'contact')} className="link text-[0.9375rem]">
                {dict.ui.contact}
              </Link>
            </div>
            <div className="sm:hidden">{languages}</div>
          </div>
        </div>
      </div>

      {/* phone: the two actions sit at the thumb, on glass, above the home indicator */}
      <div
        className={`glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-[1.4fr_1fr] gap-2 border-t border-paper/10 bg-ink/80 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 text-paper backdrop-blur-xl transition-transform duration-500 ease-[var(--ease-drawer)] md:hidden ${docked && !open ? '' : 'translate-y-full'}`}
        inert={!docked || open}
      >
        <Link href={href(lang, 'configurator')} className="btn btn-sm btn-paper">
          {dict.ui.configure}
        </Link>
        <Link href={href(lang, 'contact')} className="btn btn-sm btn-line">
          {dict.ui.contactShort}
        </Link>
      </div>
    </>
  );
}
