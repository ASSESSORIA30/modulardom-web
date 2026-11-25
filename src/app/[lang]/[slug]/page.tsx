import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/sections/Closing';
import { LOCALES, NAV, dictionaries, type Locale } from '@/content/i18n';

/* Holding page for every section of the menu until its real page is built. */

type Params = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.flatMap((lang) => NAV.map((n) => ({ lang, slug: n.slug })));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  const item = NAV.find((n) => n.slug === slug);
  return item ? { title: `${dictionaries[lang as Locale].nav[item.key]} · ModularDom` } : {};
}

export default async function Page({ params }: Params) {
  const { lang, slug } = await params;
  const dict = dictionaries[lang as Locale];
  const item = NAV.find((n) => n.slug === slug)!;
  return (
    <>
      <main id="contingut" className="relative z-10 bg-paper text-ink" data-theme="light">
        <div className="wrap flex min-h-svh flex-col justify-end pb-20 pt-40">
          <p className="t-note mb-5 text-oak">{dict.nav[item.key]}</p>
          <h1 className="t-title max-w-[18ch]">{dict.ui.soonTitle}</h1>
          <p className="t-lead mt-5 max-w-[40ch] text-ink/75">{dict.ui.soonText}</p>
          <div className="mt-8">
            <Link href={`/${lang}`} className="btn btn-ink">
              {dict.ui.back}
            </Link>
          </div>
        </div>
      </main>
      <Footer dict={dict} lang={lang as Locale} />
    </>
  );
}
