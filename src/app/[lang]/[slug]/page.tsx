import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/sections/Closing';
import { BUILT, LOCALES, NAV, dictionaries, href, type Locale } from '@/content/i18n';
import { pageMeta } from '@/lib/seo';

/* Holding page for the sections of the menu whose real page is not built yet. */

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
