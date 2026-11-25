'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Reveal } from '@/components/ui/Reveal';
import { Words } from '@/components/ui/Words';
import type { Dictionary } from '@/content/i18n';

gsap.registerPlugin(ScrollTrigger);

/** Four steps in order. A line follows the reading down the list and each step lights as it is reached. */
export function Process({ dict }: { dict: Dictionary }) {
  const list = useRef<HTMLOListElement>(null);
  const line = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      list.current!.querySelectorAll('li').forEach((li) => li.setAttribute('data-on', ''));
      line.current!.style.transform = 'none';
      return;
    }
    const items = [...list.current!.querySelectorAll('li')];
    const st = ScrollTrigger.create({
      trigger: list.current,
      start: 'top 72%',
      end: 'bottom 55%',
      onUpdate: (self) => {
        line.current!.style.transform = `scaleY(${self.progress.toFixed(4)})`;
        items.forEach((li, i) => li.toggleAttribute('data-on', self.progress >= i / items.length - 0.001));
      },
    });
    return () => st.kill();
  }, []);

  return (
    <section className="bg-paper text-ink" data-theme="light" aria-labelledby="proces">
      <div className="wrap grid gap-y-12 border-t border-ink/15 py-24 md:grid-cols-12 md:gap-x-10 md:py-40">
        <Reveal as="header" className="md:col-span-5">
          <div className="md:sticky md:top-32">
            <p className="t-note mb-5 text-oak" data-fade>
              {dict.process.name}
            </p>
            <h2 id="proces" className="t-title max-w-[14ch]">
              <Words text={dict.process.title} />
            </h2>
          </div>
        </Reveal>
        <ol ref={list} className="relative md:col-span-6 md:col-start-7">
          <span className="absolute left-0 top-0 h-full w-px bg-ink/15" aria-hidden="true" />
          <span ref={line} className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-ink" aria-hidden="true" />
          {dict.process.steps.map((s, i) => (
            <li key={s.name} className="group grid grid-cols-[3.5rem_1fr] gap-x-2 py-9 pl-7 opacity-75 transition-opacity duration-500 ease-out data-[on]:opacity-100 md:grid-cols-[5rem_1fr] md:py-12 md:pl-10">
              <span className="t-num font-display text-xl text-ink transition-colors duration-500 group-data-[on]:text-oak md:text-2xl">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="font-display text-[clamp(1.6rem,1.2rem+1.5vw,2.5rem)] leading-none">{s.name}</h3>
                <p className="t-lead mt-3 max-w-[34ch] text-ink/85">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
