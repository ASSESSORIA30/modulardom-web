import { Footer } from '@/components/sections/Closing';
import { Mineral } from '@/components/sections/Mineral';
import { dictionaries, type Locale } from '@/content/i18n';
import { pageMeta } from '@/lib/seo';

type Params = { params: Promise<{ lang: string }> };
export const generateMetadata = async ({ params }: Params) => pageMeta((await params).lang as Locale, 'mineral');

export default async function Page({ params }: Params) {
  const lang = (await params).lang as Locale;
  const dict = dictionaries[lang];
  return (
    <>
      <main id="contingut" className="relative z-10 bg-ink pt-[var(--header-h)]">
        <Mineral dict={dict} lang={lang} as="h1" />
      </main>
      <Footer dict={dict} lang={lang} />
    </>
  );
}
