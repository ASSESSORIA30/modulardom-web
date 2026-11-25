import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { SmoothScroll } from '@/components/SmoothScroll';
import { LOCALES, dictionaries, isLocale } from '@/content/i18n';
import '../globals.css';

type Params = { params: Promise<{ lang: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { meta } = dictionaries[lang];
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return {
    metadataBase: new URL(host ? `https://${host}` : 'http://localhost:3000'),
    title: meta.title,
    description: meta.description,
    alternates: { languages: { ca: '/ca', es: '/es' } },
    openGraph: { title: meta.title, description: meta.description, images: ['/stills/tour-exterior.webp'], locale: lang },
    // test deployments stay out of search engines until launch
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: '#141a1a', viewportFit: 'cover' };

export default async function Layout({ children, params }: Params & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang}>
      <body>
        <SmoothScroll />
        <Header dict={dictionaries[lang]} lang={lang} />
        {children}
      </body>
    </html>
  );
}
