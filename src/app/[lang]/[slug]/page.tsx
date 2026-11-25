import type { Metadata } from 'next';
import Link from 'next/link';
import { Arrow } from '@/components/Arrow';
import { Footer } from '@/components/Closing';
import { LOCALES, NAV, dictionaries, type Locale } from '@/content/i18n';

/* Holding page for every section of the menu until its real page is built. */

type Params = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.flatMap((lang) => NAV.map((n) => ({ lang, slug: n.slug })));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  const item = NAV.find((n) => n.slug === slug);
  return item ? { title: `${dictionaries[lang as Locale].nav[item.key]} — ModularDom` } : {};
}

export default async function Page({ params }: Params) {
  const { lang, slug } = await params;
  const dict = dictionaries[lang as Locale];
  const item = NAV.find((n) => n.slug === slug)!;
  return (
    <>
      <main id="contingut" className="bg-ivory text-anthracite">
        <div className="wrap flex min-h-svh flex-col justify-end pb-20 pt-40">
          <p className="eyebrow mb-6 text-oak">{dict.nav[item.key]}</p>
          <h1 className="display-2 max-w-[18ch]">{dict.ui.soonTitle}</h1>
          <p className="lead mt-6 max-w-[40ch] text-anthracite/80">{dict.ui.soonText}</p>
          <div className="mt-9">
            <Link href={`/${lang}`} className="btn btn-dark">
              {dict.ui.back} <Arrow />
            </Link>
          </div>
        </div>
      </main>
      <Footer dict={dict} lang={lang as Locale} />
    </>
  );
}
