import { Footer } from '@/components/sections/Closing';
import { Configurator } from '@/components/sections/Configurator';
import { dictionaries, type Locale } from '@/content/i18n';
import { pageMeta } from '@/lib/seo';

type Params = { params: Promise<{ lang: string }> };
export const generateMetadata = async ({ params }: Params) => pageMeta((await params).lang as Locale, 'configurator');

export default async function Page({ params }: Params) {
  const lang = (await params).lang as Locale;
  const dict = dictionaries[lang];
  return (
    <>
      <main id="contingut" className="relative z-10 bg-ink">
        <Configurator dict={dict} lang={lang} full />
      </main>
      <Footer dict={dict} lang={lang} />
    </>
  );
}
