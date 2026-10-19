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

  // Other half of the <head> script: a hash in the URL on arrival here
  // (clicking /#faq etc. from another page) was stripped before the
  // browser could act on it, so this page loaded at rest instead of
  // jumping straight to the target. Scroll to it ourselves, the same
  // smooth way clicking that link from this page already does, then put
  // the hash back so the URL still reflects where you are.
  if (window.__pendingAnchor) {
    var pendingTarget = document.querySelector(window.__pendingAnchor);
    if (pendingTarget) {
      pendingTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    history.replaceState(null, '', window.__pendingAnchor);
    delete window.__pendingAnchor;
  }

  // TEMPORARY diagnostic badge — not a feature, just a way to get exact
  // numbers instead of guessing from a screen recording. Shows nav's live
  // position/width so a real difference between pages shows up as a
  // number change, not something to eyeball. Remove once the nav-moves
  // report is confirmed fixed.
  (function () {
    var badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:99999;' +
      'background:rgba(0,0,0,0.82);color:#5FBF8F;font:11px/1.5 ui-monospace,monospace;' +
      'padding:6px 9px;border-radius:8px;pointer-events:none;white-space:pre;';
    document.body.appendChild(badge);
    function report() {
      var nav = document.querySelector('nav');
      var navLinks = document.querySelector('.nav-links');
      var features = document.querySelector('.nav-links a[href$="features"]') || document.querySelector('.nav-links a');
      if (!nav) return;
      var r = nav.getBoundingClientRect();
      var lr = navLinks ? navLinks.getBoundingClientRect() : null;
      var fr = features ? features.getBoundingClientRect() : null;
      var current = document.querySelector('.nav-links a.current');
      badge.textContent =
        'nav left=' + Math.round(r.left) + ' width=' + Math.round(r.width) + ' top=' + Math.round(r.top) + '\n' +
        (lr ? ('links left=' + Math.round(lr.left) + ' width=' + Math.round(lr.width) + '\n') : '') +
        (fr ? ('1st-link left=' + Math.round(fr.left) + '\n') : '') +
        'current=' + (current ? current.textContent.trim() : 'none') + '\n' +
        'win=' + window.innerWidth + 'x' + window.innerHeight +
        ' docH=' + document.documentElement.scrollHeight +
        ' scrollY=' + Math.round(window.scrollY);
    }
    report();
    window.addEventListener('resize', report);
    window.addEventListener('scroll', report, { passive: true });
    setInterval(report, 500);
  })();
})();
