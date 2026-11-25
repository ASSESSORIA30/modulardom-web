import { sceneStart } from './timeline';

type Props = {
  labels: string[];
  current: number;
  title: string;
  onJump: (i: number) => void;
};

/** Vertical index of the tour. Its fill follows --tour (0 → 1), set by the journey each frame. */
export function ProgressRail({ labels, current, title, onJump }: Props) {
  const last = sceneStart(labels.length - 1);
  return (
    <nav
      aria-label={title}
      className="pointer-events-none absolute -right-3 top-1/2 z-10 h-[30svh] w-11 -translate-y-1/2 md:pointer-events-auto md:right-[var(--edge)] md:h-[44svh]"
    >
      <span className="absolute right-[21px] top-0 h-full w-px bg-ivory/25" aria-hidden="true" />
      <span
        className="absolute right-[21px] top-0 h-full w-px origin-top bg-ivory"
        style={{ transform: 'scaleY(var(--tour, 0))' }}
        aria-hidden="true"
      />
      <ol className="relative h-full">
        {labels.map((label, i) => {
          const on = i === current;
          return (
            <li key={label} className="absolute right-0 -translate-y-1/2" style={{ top: `${(sceneStart(i) / last) * 100}%` }}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={on ? 'step' : undefined}
                className="group flex h-11 items-center justify-end gap-3 whitespace-nowrap pl-4"
              >
                <span
                  className={`eyebrow hidden transition-opacity duration-500 md:inline ${
                    on ? 'opacity-100' : 'opacity-0 group-hover:opacity-80 group-focus-visible:opacity-80'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                  <span className={`ml-2 ${on ? 'sr-only' : ''}`}>{label}</span>
                </span>
                <span className="sr-only md:hidden">{label}</span>
                <span className="flex w-11 items-center justify-center" aria-hidden="true">
                  <span
                    className={`block rounded-full bg-ivory transition-transform duration-500 ease-out-expo ${
                      on ? 'h-[9px] w-[9px] scale-[0.8] md:scale-100' : 'h-[9px] w-[9px] scale-[0.4] group-hover:scale-75'
                    }`}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
