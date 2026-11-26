import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/sections/Closing';
import { BUILT, LEGAL_KEYS, LOCALES, NAV, dictionaries, href, isLegalKey, type Locale } from '@/content/i18n';
import { LEGAL_CONTENT } from '@/content/legal';
import { PRIVACY_POLICY } from '@/content/site';
import { pageMeta } from '@/lib/seo';

/* Localised legal pages and holding pages for the remaining commercial sections. */

type Params = { params: Promise<{ lang: string; slug: string }> };
const find = (lang: Locale, slug: string) => NAV.find((n) => n.slug[lang] === slug && !BUILT.includes(n.key));

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.flatMap((lang) => NAV.filter((n) => !BUILT.includes(n.key)).map((n) => ({ lang, slug: n.slug[lang] })));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  const item = find(lang as Locale, slug);
  return item ? pageMeta(lang as Locale, item.key) : {};
}

export default async function Page({ params }: Params) {
  const { lang, slug } = await params;
  const dict = dictionaries[lang as Locale];
  const item = find(lang as Locale, slug);
  if (!item) notFound();
  if (isLegalKey(item.key)) {
    const locale = lang as Locale;
    const legal = LEGAL_CONTENT[locale][item.key];
    return (
      <>
        <main id="contingut" className="relative z-10 bg-paper text-ink" data-theme="light" data-dock-off>
          <article className="wrap pb-24 pt-36 md:pt-44">
            <div className="mx-auto max-w-[52rem]">
              <p className="t-note mb-5 text-oak-deep">ModularDom · {locale === 'ca' ? 'Informació legal' : 'Información legal'}</p>
              <h1 className="t-title !text-[clamp(2.6rem,5.5vw,4.8rem)]">{legal.title}</h1>
              <p className="mt-4 text-sm text-ink/70">{locale === 'ca' ? 'Versió de 26/11/2026' : 'Versión de 26/11/2026'}</p>
              {!PRIVACY_POLICY.published && <p className="mt-4 border-l-2 border-oak-deep pl-4 text-sm text-ink/75">{locale === 'ca' ? 'Text en revisió per a la nova web. La captació de dades a producció encara està desactivada.' : 'Texto en revisión para la nueva web. La captación de datos en producción sigue desactivada.'}</p>}
              <nav aria-label={locale === 'ca' ? 'Informació legal' : 'Información legal'} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y border-ink/15 py-4 text-sm">
                {LEGAL_KEYS.map((key) => <Link key={key} href={href(locale, key)} aria-current={key === item.key ? 'page' : undefined} className="underline underline-offset-4">{dict.nav[key]}</Link>)}
              </nav>
              {legal.sections.map((section) => (
                <section key={section.title} className="mt-10">
                  <h2 className="mb-3 text-xl font-medium">{section.title}</h2>
                  {section.paragraphs.map((paragraph, index) => <p key={index} className="mt-3 text-base leading-relaxed text-ink/80">{paragraph}</p>)}
                  {section.links && <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">{section.links.map((link) => <a key={link.href} href={link.href} className="underline underline-offset-4" rel="noopener noreferrer">{link.label}</a>)}</p>}
                </section>
              ))}
            </div>
          </article>
        </main>
        <Footer dict={dict} lang={locale} />
      </>
    );
  }
  return (
    <>
      <main id="contingut" className="relative z-10 bg-paper text-ink" data-theme="light">
        <div className="wrap flex min-h-svh flex-col justify-end pb-20 pt-40">
          <p className="t-note mb-5 text-oak-deep">{dict.nav[item.key]}</p>
          <h1 className="t-title max-w-[18ch]">{dict.ui.soonTitle}</h1>
          <p className="t-lead mt-5 max-w-[40ch] text-ink/75">{dict.ui.soonText}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2">
            <Link href={`/${lang}`} className="btn btn-ink">
              {dict.ui.back}
            </Link>
            <Link href={href(lang as Locale, 'contact')} className="link text-[0.9375rem]">
              {dict.ui.contact}
            </Link>
          </div>
        </div>
      </main>
      <Footer dict={dict} lang={lang as Locale} />
    </>
  );
}
