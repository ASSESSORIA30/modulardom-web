import Link from 'next/link';
import { Arrow } from './Arrow';
import { NAV, type Dictionary, type Locale } from '@/content/i18n';

export function Closing({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const [a, b, c] = dict.closing.title.split('*');
  return (
    <section className="bg-ivory text-anthracite">
      <div className="wrap grid min-h-[92svh] content-center gap-12 py-28 md:grid-cols-12 md:gap-8">
        <h2 className="display-2 md:col-span-8">
          {a}
          <em>{b}</em>
          {c}
        </h2>
        <div className="md:col-span-4 md:col-start-9 md:self-end">
          <p className="lead max-w-[36ch] text-anthracite/80">{dict.closing.text}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link href={`/${lang}/configurador`} className="btn btn-dark">
              {dict.ui.configure} <Arrow />
            </Link>
            <Link href={`/${lang}/contacte`} className="link text-[0.9375rem] font-medium">
              {dict.ui.contact}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <footer className="bg-anthracite text-ivory">
      <div className="wrap py-16 md:py-20">
        <ul className="grid grid-cols-2 gap-x-8 text-[0.9375rem] md:grid-cols-3 nav:grid-cols-5">
          {NAV.map((n) => (
            <li key={n.key}>
              <Link href={`/${lang}/${n.slug}`} className="nav-link text-ivory/85 hover:text-ivory">
                {dict.nav[n.key]}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-16 select-none font-display text-[clamp(3.2rem,15.5vw,17rem)] font-light leading-[0.8] tracking-[-0.05em] text-travertine" aria-hidden="true">
          ModularDom
        </p>
        <p className="mt-10 text-[0.8125rem] text-ivory/60">
          © {new Date().getFullYear()} ModularDom. {dict.ui.rights}
        </p>
      </div>
    </footer>
  );
}
