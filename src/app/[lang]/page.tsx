import { Closing, Footer } from '@/components/Closing';
import { Journey } from '@/components/journey/Journey';
import { dictionaries, type Locale } from '@/content/i18n';

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;
  const dict = dictionaries[lang];
  return (
    <>
      <main id="contingut">
        <Journey dict={dict} lang={lang} />
        <Closing dict={dict} lang={lang} />
      </main>
      <Footer dict={dict} lang={lang} />
    </>
  );
}
