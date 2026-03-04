/* theme.js — light / dark mode toggle + back-to-top */
(function () {
  var KEY = 'psl-theme';

  function savedTheme() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function prefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  /* Apply immediately to avoid flash of wrong theme */
  applyTheme(savedTheme() || (prefersDark() ? 'dark' : 'light'));

  document.addEventListener('DOMContentLoaded', function () {
    /* Theme toggle — handle header + footer buttons */
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    });

    /* Back to top */
    var topBtn = document.getElementById('back-to-top');
    if (topBtn) {
      window.addEventListener('scroll', function () {
        topBtn.classList.toggle('is-visible', window.scrollY > 320);
      }, { passive: true });
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
