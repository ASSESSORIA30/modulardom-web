import Link from 'next/link';
import { Arrow } from '@/components/Arrow';
import type { Dictionary, Locale } from '@/content/i18n';
import type { SceneDef } from '@/content/scenes';

/** "La teva casa. *Les teves decisions.*" → masked words, the starred ones in italic */
export function Words({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  text.split('*').forEach((part, k) => {
    const italic = k % 2 === 1;
    part
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w, j) => {
        const inner = <span data-word>{w}</span>;
        out.push(
          <span className="word" key={`${k}-${j}`}>
            {italic ? <em>{inner}</em> : inner}
          </span>,
          ' ',
        );
      });
  });
  return <>{out}</>;
}

type Props = { scene: SceneDef; index: number; total: number; dict: Dictionary; lang: Locale };

export function SceneCopy({ scene, index, total, dict, lang }: Props) {
  const copy = dict.scenes[scene.id];
  const Heading = index === 0 ? 'h1' : 'h2';
  const num = String(index + 1).padStart(2, '0');
  const href = { configure: `/${lang}/configurador`, projects: `/${lang}/projectes` } as const;
  return (
    <div className="scene-box" data-scene-box data-place={scene.place} id={`escena-${scene.id}`}>
      <div className="scene-copy">
        <p className="eyebrow mb-5 flex w-fit items-center gap-3 md:mb-7" data-fade>
          <span>{num}</span>
          <span className="h-px w-8 bg-current opacity-60" aria-hidden="true" />
          <span>{copy.label}</span>
          <span className="sr-only"> / {String(total).padStart(2, '0')}</span>
        </p>
        <Heading className="display">
          <Words text={copy.title} />
        </Heading>
        <p className="lead mt-6 w-fit max-w-[34ch] text-ivory/90 md:mt-8" data-fade>
          {copy.text}
        </p>
        {scene.list && (
          <ul className="eyebrow mt-7 flex w-fit flex-wrap gap-x-7 gap-y-2 text-ivory/80" data-fade>
            {dict[scene.list].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {scene.actions && (
          <div className="mt-8 flex w-fit flex-wrap items-center gap-x-8 gap-y-3 md:mt-10" data-fade>
            {scene.actions.map((a, k) =>
              k === 0 ? (
                <Link key={a} href={href[a]} className="btn btn-light">
                  {dict.ui[a]} <Arrow />
                </Link>
              ) : (
                <Link key={a} href={href[a]} className="link text-[0.9375rem] font-medium">
                  {dict.ui[a]}
                </Link>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
