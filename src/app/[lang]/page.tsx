import { Closing, Footer } from '@/components/sections/Closing';
import { Configurator } from '@/components/sections/Configurator';
import { Gallery } from '@/components/sections/Gallery';
import { Materials } from '@/components/sections/Materials';
import { Mineral } from '@/components/sections/Mineral';
import { Process } from '@/components/sections/Process';
import { Systems } from '@/components/sections/Systems';
import { Tour } from '@/components/tour/Tour';
import { dictionaries, type Locale } from '@/content/i18n';

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;
  const dict = dictionaries[lang];
  return (
    <>
      <main id="contingut">
        <Tour dict={dict} lang={lang} />
        <Gallery dict={dict} lang={lang} />
        <Systems dict={dict} />
        <Materials dict={dict} />
        <Configurator dict={dict} lang={lang} />
        <Process dict={dict} />
        <Mineral dict={dict} lang={lang} />
        <Closing dict={dict} lang={lang} />
      </main>
      <Footer dict={dict} lang={lang} />
    </>
  );
}
