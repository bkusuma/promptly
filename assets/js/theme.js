/**
 * theme.js — 3-theme switcher with radial ink-spread transition
 * Persists preference in localStorage. Reads on load (also in <head> inline
 * snippet) to prevent FOUC. Under 80 lines.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'promptly-theme';
  const THEMES = ['cosmic', 'parchment', 'terminal'];
  const root = document.documentElement;

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function store(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }

  function setActive(theme) {
    document.querySelectorAll('.theme-btn').forEach(btn => {
      const isActive = btn.dataset.theme === theme;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function applyTheme(theme, origin) {
    if (!THEMES.includes(theme)) theme = 'cosmic';

    // Set ripple origin for radial animation
    if (origin) {
      root.style.setProperty('--ripple-x', `${Math.round(origin.x)}px`);
      root.style.setProperty('--ripple-y', `${Math.round(origin.y)}px`);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Trigger clip-path animation
    if (!reduceMotion) root.classList.add('theme-transitioning');

    // Switch theme immediately after first frame so the new bg is "revealed"
    requestAnimationFrame(() => {
      root.setAttribute('data-theme', theme);
      store(theme);
      setActive(theme);

      // Clean up transition class after animation completes
      const onEnd = () => {
        root.classList.remove('theme-transitioning');
        root.removeEventListener('transitionend', onEnd);
      };
      root.addEventListener('transitionend', onEnd, { once: true });

      // Safety fallback if transitionend never fires
      setTimeout(() => root.classList.remove('theme-transitioning'), 700);
    });
  }

  function init() {
    const stored = getStored() || 'cosmic';
    root.setAttribute('data-theme', stored);
    setActive(stored);

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const origin = {
          x: rect.left + rect.width / 2,
          y: rect.top  + rect.height / 2,
        };
        applyTheme(btn.dataset.theme, origin);
      });
    });

    // Mobile nav toggle
    const toggle = document.querySelector('.nav-toggle');
    const nav    = document.querySelector('.primary-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        nav.dataset.open = String(!open);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
