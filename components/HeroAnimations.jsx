'use client';

import React, { useEffect, useRef } from 'react';
import { createTimeline, stagger } from 'animejs';

export default function HeroAnimations({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    try {
      // Orchestrated entrance animation timeline using Anime.js v4
      const timeline = createTimeline({
        easing: 'outCubic',
        duration: 800,
      });

      timeline
        .add('.hero-eyebrow', {
          opacity: [0, 1],
          translateY: [15, 0],
          duration: 600,
        })
        .add('.hero-title-line', {
          opacity: [0, 1],
          translateY: [25, 0],
          delay: stagger(150),
          duration: 800,
        }, '-=300')
        .add('.hero-description', {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 700,
        }, '-=400')
        .add('.hero-cta-group', {
          opacity: [0, 1],
          translateY: [15, 0],
          duration: 600,
        }, '-=300')
        .add('.hero-trust-indicators', {
          opacity: [0, 1],
          duration: 500,
        }, '-=200');
    } catch {
      // Graceful fallback: text remains immediately visible
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  );
}
