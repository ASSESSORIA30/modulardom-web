import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { SmoothScroll } from '@/components/SmoothScroll';
import { LOCALES, dictionaries, isLocale } from '@/content/i18n';
import { organizationJsonLd } from '@/lib/seo';
import { env } from '@/server/env';
import '../globals.css';

type Params = { params: Promise<{ lang: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { meta } = dictionaries[lang];
  return {
    metadataBase: new URL(env.siteUrl),
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/${lang}`, languages: { ca: '/ca', es: '/es', 'x-default': '/ca' } },
    openGraph: { title: meta.title, description: meta.description, url: `/${lang}`, images: ['/stills/tour-exterior.webp'], locale: lang === 'ca' ? 'ca_ES' : 'es_ES', siteName: 'ModularDom', type: 'website' },
    // previews stay out of search engines; production opts in with SITE_INDEXABLE=true
    robots: env.indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: '#0d1520', viewportFit: 'cover' };

export default async function Layout({ children, params }: Params & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(env.siteUrl, lang)) }} />
        <SmoothScroll />
        <Header dict={dictionaries[lang]} lang={lang} />
        {children}
      </body>
    </html>
  );
}
