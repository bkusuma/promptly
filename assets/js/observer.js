/**
 * observer.js — IntersectionObserver for staggered reveal animations.
 * Observes .reveal elements and adds .is-visible when they enter viewport.
 * Respects prefers-reduced-motion (CSS handles the no-motion case).
 * Under 50 lines.
 */
(function () {
  'use strict';

  // If reduced motion, just make everything visible immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -48px 0px', // trigger slightly before bottom edge
    }
  );

  function observe() {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe);
  } else {
    observe();
  }
}());
