import Link from 'next/link';
import { COMMERCIAL, COMMERCIAL_KEYS, type CommercialKey } from '@/content/commercial';
import { dictionaries, href, type Locale } from '@/content/i18n';
import { Systems } from '@/components/sections/Systems';
import { Process } from '@/components/sections/Process';
import { Materials } from '@/components/sections/Materials';

export function CommercialPage({ lang, page }: { lang: Locale; page: CommercialKey }) {
  const copy = COMMERCIAL[lang][page];
  const dict = dictionaries[lang];
  return (
    <main id="contingut" className="relative z-10 bg-paper text-ink" data-theme="light">
      <article className="wrap pb-20 pt-36 md:pt-44">
        <div className="mx-auto max-w-[56rem]">
          <p className="t-note mb-5 text-oak-deep">ModularDom · {dict.nav[page]}</p>
          <h1 className="t-title !text-[clamp(2.6rem,5.5vw,4.8rem)]">{copy.title}</h1>
          <p className="t-lead mt-6 max-w-[54ch] text-ink/80">{copy.intro}</p>
          {copy.sections.map((s) => (
            <section key={s.title} className="mt-10 border-t border-ink/15 pt-6">
              <h2 className="t-serif text-[1.7rem] leading-tight">{s.title}</h2>
              <p className="mt-3 max-w-[72ch] text-base leading-relaxed text-ink/80">{s.text}</p>
            </section>
          ))}
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link href={href(lang, 'configurator')} className="btn btn-ink">{dict.ui.configure}</Link>
            <Link href={href(lang, 'contact', '?motiu=visita')} className="link">{dict.ui.visit}</Link>
          </div>
          <nav aria-label={lang === 'ca' ? 'Més informació' : 'Más información'} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y border-ink/15 py-4 text-sm">
            {COMMERCIAL_KEYS.filter((key) => key !== page).map((key) => (
              <Link key={key} href={href(lang, key)} className="underline underline-offset-4">{dict.nav[key]}</Link>
            ))}
          </nav>
        </div>
      </article>
      {page === 'systems' && <><Systems dict={dict} /><Materials dict={dict} /></>}
      {page === 'process' && <Process dict={dict} />}
      {page === 'finishes' && <Materials dict={dict} />}
    </main>
  );
}
