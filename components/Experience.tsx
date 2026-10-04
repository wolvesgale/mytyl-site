'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

const CrystalScene = dynamic(() => import('./CrystalScene'), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Fixed WebGL backdrop + smooth scroll + reveal animations + cursor glow. */
export default function Experience() {
  const [showGL, setShowGL] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hasWebGL()) setShowGL(true);

    gsap.registerPlugin(ScrollTrigger, SplitText);
    const ctx = gsap.context(() => {});
    let lenis: Lenis | null = null;
    let raf: ((t: number) => void) | null = null;

    if (!reduce) {
      lenis = new Lenis({ lerp: 0.09, autoRaf: false });
      lenis.on('scroll', ScrollTrigger.update);
      raf = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // anchor links through Lenis
      document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
          const id = a.getAttribute('href');
          if (!id || id === '#') return;
          const el = document.querySelector(id);
          if (el) {
            e.preventDefault();
            lenis!.scrollTo(el as HTMLElement, { offset: -40 });
          }
        });
      });

      ctx.add(() => {
        // hero title — letters gather like crystal shards
        const title = document.querySelector('[data-hero-title]');
        if (title) {
          const split = new SplitText(title, { type: 'chars' });
          gsap.from(split.chars, {
            opacity: 0,
            y: 60,
            rotateX: -80,
            filter: 'blur(12px)',
            stagger: 0.07,
            duration: 1.4,
            ease: 'expo.out',
            delay: 0.3,
          });
        }
        gsap.from('[data-hero-fade]', { opacity: 0, y: 20, duration: 1.2, stagger: 0.12, delay: 0.9, ease: 'power3.out' });

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 48,
            filter: 'blur(8px)',
            duration: 1.2,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
          });
        });

        gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((wrap) => {
          gsap.from(wrap.children, {
            opacity: 0,
            y: 40,
            duration: 1,
            stagger: 0.12,
            ease: 'expo.out',
            scrollTrigger: { trigger: wrap, start: 'top 80%' },
          });
        });

        // process line draws with scroll
        const line = document.querySelector('[data-process-line]');
        if (line) {
          gsap.fromTo(
            line,
            { scaleX: 0 },
            { scaleX: 1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 80%', end: 'top 30%', scrub: true } },
          );
        }

        // giant marquee word drifts
        gsap.to('[data-marquee]', {
          xPercent: -30,
          ease: 'none',
          scrollTrigger: { trigger: '[data-marquee]', start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    }

    // cursor glow (fine pointers only)
    const dot = document.querySelector<HTMLElement>('[data-cursor]');
    let onMove: ((e: PointerEvent) => void) | null = null;
    if (dot && window.matchMedia('(pointer: fine)').matches && !reduce) {
      const xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
      const yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
      onMove = (e) => {
        dot.style.opacity = '1';
        xTo(e.clientX);
        yTo(e.clientY);
        const t = e.target as HTMLElement;
        dot.classList.toggle('is-hover', !!t.closest('a,button'));
      };
      window.addEventListener('pointermove', onMove);
    }

    setReady(true);
    return () => {
      ctx.revert();
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
      if (onMove) window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <>
      <div className="gl-backdrop" aria-hidden>
        <div className="gl-fallback" />
        {showGL && (
          <div className={`gl-canvas ${ready ? 'is-ready' : ''}`}>
            <CrystalScene />
          </div>
        )}
      </div>
      <div className="cursor" data-cursor aria-hidden />
      <div className="lattice" aria-hidden />
      <div className="grain" aria-hidden />
    </>
  );
}
