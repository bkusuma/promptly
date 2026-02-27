/**
 * search.js — Fuzzy search against a build-time search.json index.
 * Scoring: exact title match > starts-with > word match > fuzzy char sequence.
 * Under 100 lines.
 */
(function () {
  'use strict';

  const INDEX_URL = document.querySelector('meta[name="search-index"]')?.content
    || '/search.json';
  const input   = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  let index = null;
  let debounceTimer = null;

  // --- Load index (once, lazily on first keystroke) -------------------------
  async function loadIndex() {
    if (index) return index;
    try {
      const res = await fetch(INDEX_URL);
      index = await res.json();
    } catch {
      index = [];
    }
    return index;
  }

  // --- Scoring engine -------------------------------------------------------
  function score(item, q) {
    const lq   = q.toLowerCase();
    const lTitle  = (item.title  || '').toLowerCase();
    const lModel  = (item.model  || '').toLowerCase();
    const lTags   = (item.tags   || []).join(' ').toLowerCase();
    const lPrompt = (item.prompt || '').toLowerCase();
    const haystack = `${lTitle} ${lModel} ${lTags} ${lPrompt}`;

    if (lTitle === lq)                 return 100;
    if (lTitle.startsWith(lq))         return 80;
    if (lTitle.includes(lq))           return 60;
    if (lModel.includes(lq))           return 50;
    if (lTags.includes(lq))            return 45;
    if (lPrompt.includes(lq))          return 35;

    // Fuzzy: all query chars appear in order in haystack
    let idx = 0;
    for (const ch of lq) {
      idx = haystack.indexOf(ch, idx);
      if (idx === -1) return 0;
      idx++;
    }
    return 10;
  }

  function highlight(text, q) {
    if (!q) return text;
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
  }

  // --- Render ---------------------------------------------------------------
  function render(items, q) {
    if (!q.trim()) { results.innerHTML = ''; return; }
    if (!items.length) {
      results.innerHTML = `<p class="search-results__empty">No prompts found for "<strong>${q}</strong>".</p>`;
      return;
    }

    results.innerHTML = items.map(item => `
      <a class="search-result" href="${item.url}">
        ${item.image ? `<img class="search-result__thumb" src="${item.image}" alt="" loading="lazy" decoding="async">` : ''}
        <div class="search-result__body">
          <div class="search-result__title">${highlight(item.title, q)}</div>
          <div class="search-result__meta">${item.date}${item.model ? ` · ${item.model}` : ''}</div>
          ${item.prompt ? `<div class="search-result__excerpt">${item.prompt.slice(0, 100)}…</div>` : ''}
        </div>
      </a>`).join('');
  }

  // --- Query handler --------------------------------------------------------
  async function onQuery(q) {
    if (q.length < 2) { results.innerHTML = ''; return; }
    const data = await loadIndex();
    const scored = data
      .map(item => ({ item, s: score(item, q) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 10)
      .map(x => x.item);
    render(scored, q);
  }

  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => onQuery(e.target.value.trim()), 180);
  });

  // Pre-populate from URL param ?q=
  const urlQ = new URLSearchParams(location.search).get('q');
  if (urlQ) { input.value = urlQ; onQuery(urlQ); }
}());
