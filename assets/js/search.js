/**
 * search.js — Fuzzy search against build-time search.json.
 * Scoring: exact title > starts-with > substring > fuzzy char sequence.
 * Security: all user/JSON data sanitised before DOM insertion. ≤100 lines.
 */
(function () {
  'use strict';

  const INDEX_URL = document.querySelector('meta[name="search-index"]')?.content || '/search.json';
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  let index = null, timer = null;

  // Sanitisation: serialise any value to HTML-entity-safe text for innerHTML
  const _t = document.createElement('div');
  const esc = str => { _t.textContent = String(str ?? ''); return _t.innerHTML; };
  const safeUrl = raw => { try { const u = new URL(raw, location.origin); return /^https?:$/.test(u.protocol) ? u.href : '/'; } catch { return '/'; } };

  async function loadIndex() {
    if (index) return index;
    try { index = await (await fetch(INDEX_URL)).json(); } catch { index = []; }
    return index;
  }

  function score(item, q) {
    const lq = q.toLowerCase();
    const t  = (item.title  || '').toLowerCase();
    const m  = (item.model  || '').toLowerCase();
    const tg = (item.tags   || []).join(' ').toLowerCase();
    const pr = (item.prompt || '').toLowerCase();
    if (t === lq)         return 100;
    if (t.startsWith(lq)) return 80;
    if (t.includes(lq))   return 60;
    if (m.includes(lq))   return 50;
    if (tg.includes(lq))  return 45;
    if (pr.includes(lq))  return 35;
    let idx = 0;
    for (const ch of lq) { idx = `${t} ${m} ${tg} ${pr}`.indexOf(ch, idx); if (idx < 0) return 0; idx++; }
    return 10;
  }

  function render(items, q) {
    results.replaceChildren();
    if (!q.trim()) return;
    if (!items.length) {
      const p = document.createElement('p');
      p.className = 'search-results__empty';
      p.textContent = `No prompts found for "${q}".`;
      return results.appendChild(p);
    }
    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const a = document.createElement('a');
      a.className = 'search-result';
      a.href = safeUrl(item.url);
      // highlight: both title and query are esc()-sanitised before regex; only <mark> is injected
      const hi = esc(item.title).replace(
        new RegExp(`(${esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>'
      );
      a.innerHTML = `
        ${item.image ? `<img class="search-result__thumb" src="${esc(item.image)}" alt="" loading="lazy" decoding="async">` : ''}
        <div class="search-result__body">
          <div class="search-result__title">${hi}</div>
          <div class="search-result__meta">${esc(item.date)}${item.model ? ` · ${esc(item.model)}` : ''}</div>
          ${item.prompt ? `<div class="search-result__excerpt">${esc(item.prompt.slice(0, 100))}…</div>` : ''}
        </div>`;
      frag.appendChild(a);
    });
    results.appendChild(frag);
  }

  async function onQuery(q) {
    if (q.length < 2) { results.replaceChildren(); return; }
    const data = await loadIndex();
    const scored = [];
    for (const item of data) { const s = score(item, q); if (s > 0) scored.push({ item, s }); }
    scored.sort((a, b) => b.s - a.s);
    render(scored.slice(0, 10).map(x => x.item), q);
  }

  input.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => onQuery(e.target.value.trim()), 180);
  });

  const urlQ = new URLSearchParams(location.search).get('q');
  if (urlQ) { input.value = urlQ; onQuery(urlQ); }
}());
