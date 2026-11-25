import { Contact, Footer } from '@/components/sections/Closing';
import { dictionaries, type Locale } from '@/content/i18n';
import { pageMeta } from '@/lib/seo';

type Params = { params: Promise<{ lang: string }> };
export const generateMetadata = async ({ params }: Params) => pageMeta((await params).lang as Locale, 'contact');

export default async function Page({ params }: Params) {
  const lang = (await params).lang as Locale;
  const dict = dictionaries[lang];
  return (
    <>
      <main id="contingut" className="relative z-10 min-h-svh bg-ink pt-28" data-theme="dark">
        <Contact dict={dict} lang={lang} as="h1" />
      </main>
      <Footer dict={dict} lang={lang} />
    </>
  );
}
