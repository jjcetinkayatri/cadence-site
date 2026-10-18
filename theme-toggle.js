// Wires the .theme-toggle control present in every page's <nav> — three
// buttons (system/light/dark) matching the iOS app's own Settings ->
// Appearance picker (Theme.swift's Appearance enum: system/light/dark).
// The actual light/dark CSS tokens already exist in every page's own
// <style> block (:root vs :root[data-theme="dark"]); this only ever sets
// or clears that data-theme attribute and remembers the choice.
//
// The very first paint's correct theme is handled separately by a tiny
// inline, synchronous script in <head> (same localStorage key) — this
// file only wires the buttons and reflects the stored choice once the DOM
// is ready, so a slow-loading deferred script never causes a flash.
(function () {
  var KEY = 'cadence-theme';

  function safeGet() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function safeSet(value) {
    try {
      if (value) localStorage.setItem(KEY, value);
      else localStorage.removeItem(KEY);
    } catch (e) { /* private browsing / storage blocked — theme just won't persist */ }
  }

  function apply(theme) {
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    var current = theme === 'light' || theme === 'dark' ? theme : 'system';
    document.querySelectorAll('.theme-toggle button').forEach(function (btn) {
      var isActive = btn.dataset.themeChoice === current;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.theme-toggle button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var choice = btn.dataset.themeChoice;
      safeSet(choice === 'system' ? null : choice);
      apply(choice === 'system' ? null : choice);
    });
  });

  apply(safeGet());

  // Mark whichever nav link points at the CURRENT page (Release Notes,
  // Support) so there's a visible "you are here" state — the homepage's
  // own Features/Pricing/FAQ links are same-page anchors, not separate
  // routes, so none of them get marked here. Path-based, not a hardcoded
  // per-page class, so it works identically on every page without
  // needing to remember to set it by hand.
  var path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var linkPath = href.split('#')[0].replace(/\/$/, '') || '/';
    if (linkPath !== '/' && linkPath === path) a.classList.add('current');
  });

  // Same "you are here" treatment for the homepage's own Features/Pricing/
  // FAQ links — those aren't separate pages, so the path check above never
  // touches them. Whichever section is scrolled into view gets .current
  // instead, the same way Release Notes/Support get it from the path.
  var sections = ['features', 'pricing', 'faq'].map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    var sectionLinks = {};
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var hash = (a.getAttribute('href') || '').split('#')[1];
      if (hash) sectionLinks[hash] = a;
    });
    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; });
      // Above Features (still in the hero) or past FAQ (in the footer):
      // nothing should read as "current" — clear rather than leave the
      // last section stuck active.
      var activeId = visible.length
        ? visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; })[0].target.id
        : null;
      Object.keys(sectionLinks).forEach(function (id) {
        sectionLinks[id].classList.toggle('current', id === activeId);
      });
    }, { rootMargin: '-100px 0px -60% 0px', threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
  }
})();
