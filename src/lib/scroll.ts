import type Lenis from 'lenis';

/** the page's Lenis instance, when smooth scrolling is on */
let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export function scrollToY(y: number) {
  if (instance) instance.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}

export function stopScroll(stop: boolean) {
  if (instance) (stop ? instance.stop() : instance.start());
  document.documentElement.style.overflow = stop ? 'hidden' : '';
}
