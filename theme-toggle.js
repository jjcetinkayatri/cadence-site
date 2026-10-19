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

  // Mark whichever nav link points at the CURRENT page so there's a
  // visible "you are here" state. Every nav link is now a real page
  // (Features/Pricing/FAQ included), so this one path check covers all
  // five — no scroll-spy, no anchors, no per-section special case.
  var path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var linkPath = href.replace(/\/$/, '') || '/';
    if (linkPath !== '/' && linkPath === path) a.classList.add('current');
  });
})();
