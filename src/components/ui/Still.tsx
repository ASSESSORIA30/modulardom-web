import stills from '@/content/stills.json';

const META = stills as Record<string, { w: number; h: number }>;
export const stillUrl = (name: string) => `/stills/${name}.webp?v=2`;

type Props = { name: string; portrait?: string; alt?: string; className?: string; eager?: boolean; style?: React.CSSProperties };

/** A single frame of the film, cut for the page. Decorative unless given an alt. */
export function Still({ name, portrait, alt = '', className, eager, style }: Props) {
  const m = META[name];
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={stillUrl(name)}
      width={m?.w}
      height={m?.h}
      alt={alt}
      className={className}
      style={style}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      draggable={false}
    />
  );
  if (!portrait) return img;
  return (
    <picture>
      <source media="(max-aspect-ratio: 68/100)" srcSet={stillUrl(portrait)} />
      {img}
    </picture>
  );
}
