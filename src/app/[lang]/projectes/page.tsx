import Link from 'next/link';
import { Footer } from '@/components/sections/Closing';
import { dictionaries, href, type Locale } from '@/content/i18n';
import { PROJECTS } from '@/content/projects';
import { pageMeta } from '@/lib/seo';

/*
  The catalogue of built work. It prints only what src/content/projects.ts holds; while that is
  empty it says so. The concept house of the tour never appears here.
*/
type Params = { params: Promise<{ lang: string }> };
export const generateMetadata = async ({ params }: Params) => pageMeta((await params).lang as Locale, 'projects');

export default async function Page({ params }: Params) {
  const lang = (await params).lang as Locale;
  const dict = dictionaries[lang];
  const f = dict.projects.fields;
  return (
    <>
      <main id="contingut" className="relative z-10 min-h-svh bg-paper text-ink" data-theme="light">
        <div className="wrap pb-28 pt-40">
          <h1 className="t-title">{dict.projectsPage.title.join(' ')}</h1>
          {PROJECTS.length === 0 ? (
            <div className="mt-10 max-w-[44rem] border-t border-ink/20 pt-8">
              <p className="t-serif text-[clamp(1.5rem,1.2rem+1.2vw,2.2rem)] leading-tight">{dict.projectsPage.emptyTitle}</p>
              <p className="t-lead mt-4 max-w-[42ch] text-ink/75">{dict.projectsPage.emptyText}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2">
                <Link href={`/${lang}`} className="btn btn-ink">
                  {dict.ui.back}
                </Link>
                <Link href={href(lang, 'contact')} className="link text-[0.9375rem]">
                  {dict.ui.info}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-14 grid gap-x-10 gap-y-20 md:grid-cols-2">
              {PROJECTS.map((p, i) => (
                <li key={p.id} className={i % 2 ? 'md:mt-24' : ''}>
                  <article>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0]} alt={p.name} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" className="aspect-[4/3] w-full bg-stone object-cover" />
                    <h2 className="t-serif mt-5 text-[1.9rem] leading-tight">{p.name}</h2>
                    <dl className="mt-3 flex flex-wrap gap-x-7 gap-y-1 text-[0.9375rem]">
                      {(
                        [
                          [f.location, p.location],
                          [f.surface, p.surface ? `${p.surface} m²` : undefined],
                          [f.year, p.year],
                          [f.system, p.system ? dict.systems.items[p.system].name : undefined],
                        ] as const
                      )
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <dt className="text-ink/70">{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                    </dl>
                    {p.description && <p className="mt-4 max-w-[52ch] text-ink/80">{p.description[lang]}</p>}
                    {p.plans && p.plans.length > 0 && (
                      <p className="mt-4 flex flex-wrap gap-x-6 text-[0.9375rem]">
                        {p.plans.map((src, k) => (
                          <a key={src} href={src} className="link" target="_blank" rel="noopener noreferrer">
                            {dict.projectsPage.plans} {p.plans!.length > 1 ? k + 1 : ''}
                          </a>
                        ))}
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer dict={dict} lang={lang} />
    </>
  );
}
