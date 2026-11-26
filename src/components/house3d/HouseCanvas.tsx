'use client';
import { useEffect, useRef, useState } from 'react';
import type { HouseScene } from './scene';

type Props = {
  mode: 'layers' | 'config';
  className?: string;
  label: string;
  fallback: string;
  /** called once the scene exists; return a cleanup if needed */
  onReady: (scene: HouseScene) => void | (() => void);
};

/*
  Mounts the 3D house. three.js and the scene are a separate chunk, fetched only when the canvas
  comes within a screen and a half of the viewport, and the scene sleeps whenever it is off screen,
  so it never competes with the tour for the main thread or the GPU.
*/
export function HouseCanvas({ mode, className, label, fallback, onReady }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ready = useRef(onReady);
  ready.current = onReady;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = canvas.current!;
    let scene: HouseScene | null = null;
    let cleanup: void | (() => void);
    let cancelled = false;
    let visible = false;

    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        near.disconnect();
        import('./scene').then(async ({ createHouseScene }) => {
          // build the model when the page is idle, never in the middle of a scroll gesture
          await new Promise<void>((r) => ('requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: 1200 }) : setTimeout(r, 60)));
          if (cancelled) return;
          try {
            scene = await createHouseScene(el, { mode });
            if (cancelled) {
              scene.dispose();
              return;
            }
          } catch {
            setFailed(true);
            return;
          }
          // a handle for visual checks, only with ?house3d=hq or ?house3d=debug
          if (/[?&]house3d=(hq|debug)/.test(location.search)) (window as unknown as { __house?: HouseScene }).__house = scene;
          el.dataset.ready = '';
          cleanup = ready.current(scene);
          scene.setActive(visible);
        });
      },
      { rootMargin: '150% 0px' },
    );
    near.observe(el);

    const onScreen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      scene?.setActive(visible);
    });
    onScreen.observe(el);
    const ro = new ResizeObserver(() => scene?.resize());
    ro.observe(el);

    return () => {
      cancelled = true;
      near.disconnect();
      onScreen.disconnect();
      ro.disconnect();
      if (cleanup) cleanup();
      scene?.dispose();
    };
  }, [mode]);

  if (failed) return <p className={`flex items-center justify-center p-8 text-center text-[0.9375rem] opacity-70 ${className ?? ''}`}>{fallback}</p>;
  return <canvas ref={canvas} role="img" aria-label={label} className={`block opacity-0 transition-opacity duration-700 data-[ready]:opacity-100 ${className ?? ''}`} />;
}
