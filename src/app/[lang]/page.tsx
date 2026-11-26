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
      {/* the page is a sheet that lifts off the footer waiting underneath */}
      <main id="contingut" className="relative z-10 bg-ink shadow-[0_24px_60px_rgb(0_0_0/0.45)]">
        <Tour dict={dict} lang={lang} />
        {/* straight after the film: configure the house and see what it costs */}
        <div id="presupuesto" className="scroll-mt-[var(--header-h)]" aria-hidden="true" />
        <Configurator dict={dict} lang={lang} />
        <div id="proyectos" className="scroll-mt-[var(--header-h)]" aria-hidden="true" />
        <Gallery dict={dict} lang={lang} />
        <div id="tecnologia" className="scroll-mt-[var(--header-h)]" aria-hidden="true" />
        <Systems dict={dict} />
        <Materials dict={dict} />
        <div id="proceso" className="scroll-mt-[var(--header-h)]" aria-hidden="true" />
        <Process dict={dict} />
        <Mineral dict={dict} lang={lang} />
        <div id="contacto" className="scroll-mt-[var(--header-h)]" aria-hidden="true" />
        <Closing dict={dict} lang={lang} />
      </main>
      <Footer dict={dict} lang={lang} />
    </>
  );
}
