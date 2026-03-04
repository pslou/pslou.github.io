/* plants.js — decorative margin plants */
(function () {
  var planted = false;
  var instances = [];

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }
  function g() { return isDark() ? '#5a9e90' : '#4a7c58'; } /* stem — muted sage  */
  function p() { return isDark() ? '#d4836e' : '#c8836a'; } /* petal warm         */
  function k() { return isDark() ? '#7aaa98' : '#b8882a'; } /* center — accent    */

  /* Four SVG plant templates */
  var PLANTS = [
    /* sprout */
    function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="54" viewBox="0 0 36 54">'
        + '<path d="M18 50 Q17 36 18 22" stroke="' + g() + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
        + '<path d="M18 36 Q7 26 3 30 Q8 43 18 36Z" fill="' + g() + '"/>'
        + '<path d="M18 28 Q29 18 33 22 Q28 35 18 28Z" fill="' + g() + '" opacity=".82"/>'
        + '<path d="M18 22 Q16 11 18 5 Q20 11 18 22Z" fill="' + g() + '"/>'
        + '</svg>';
    },
    /* grass blades */
    function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="44" viewBox="0 0 28 44">'
        + '<path d="M14 42 Q9 30 7 15 Q11 27 14 42Z" fill="' + g() + '"/>'
        + '<path d="M14 42 Q19 28 21 12 Q17 27 14 42Z" fill="' + g() + '" opacity=".8"/>'
        + '<path d="M14 42 Q12 30 13 17 Q15 29 14 42Z" fill="' + g() + '" opacity=".9"/>'
        + '</svg>';
    },
    /* flower */
    function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="54" viewBox="0 0 34 54">'
        + '<path d="M17 50 Q16 36 17 22" stroke="' + g() + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
        + '<path d="M17 36 Q7 31 9 23 Q17 28 17 36Z" fill="' + g() + '" opacity=".7"/>'
        + '<ellipse cx="17" cy="14" rx="4" ry="7" fill="' + p() + '" opacity=".78"/>'
        + '<ellipse cx="24" cy="18" rx="7" ry="4" fill="' + p() + '" opacity=".78"/>'
        + '<ellipse cx="17" cy="22" rx="4" ry="7" fill="' + p() + '" opacity=".78"/>'
        + '<ellipse cx="10" cy="18" rx="7" ry="4" fill="' + p() + '" opacity=".78"/>'
        + '<circle cx="17" cy="18" r="4.5" fill="' + k() + '"/>'
        + '</svg>';
    },
    /* fern */
    function () {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="52" viewBox="0 0 30 52">'
        + '<path d="M15 48 Q15 32 15 14" stroke="' + g() + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
        + '<path d="M15 40 Q7 36 5 29 Q12 33 15 40Z" fill="' + g() + '" opacity=".8"/>'
        + '<path d="M15 40 Q23 36 25 29 Q18 33 15 40Z" fill="' + g() + '" opacity=".8"/>'
        + '<path d="M15 30 Q7 26 5 19 Q12 23 15 30Z" fill="' + g() + '" opacity=".7"/>'
        + '<path d="M15 30 Q23 26 25 19 Q18 23 15 30Z" fill="' + g() + '" opacity=".7"/>'
        + '<path d="M15 20 Q10 16 9 11 Q13 14 15 20Z" fill="' + g() + '" opacity=".6"/>'
        + '<path d="M15 20 Q20 16 21 11 Q17 14 15 20Z" fill="' + g() + '" opacity=".6"/>'
        + '</svg>';
    }
  ];

  function makePlant(x, y) {
    var tmpl = PLANTS[Math.floor(Math.random() * PLANTS.length)];
    var rot  = (Math.random() - 0.5) * 26;
    var el   = document.createElement('div');
    el.className = 'margin-plant';
    el.innerHTML = tmpl();
    el.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px;'
      + 'transform:translate(-50%,-100%) rotate(' + rot + 'deg) scale(0);'
      + 'transform-origin:50% 100%;pointer-events:none;z-index:50;opacity:0;'
      + 'transition:transform 0.55s cubic-bezier(0.34,1.56,0.64,1),opacity 0.4s ease;';
    document.body.appendChild(el);
    return { el: el, rot: rot };
  }

  function grow() {
    var vw  = window.innerWidth;
    var gap = (vw - Math.min(740, vw)) / 2; /* margin width each side */
    if (gap < 52) return;                    /* no room — skip         */

    var perSide = Math.max(6, Math.min(14, Math.floor(gap / 42)));
    for (var i = 0; i < perSide * 2; i++) {
      var left = i % 2 === 0;
      var x = left
        ? Math.random() * (gap - 50) + 14
        : vw - gap + Math.random() * (gap - 50) + 14;
      /* spread evenly along the full viewport height */
      var slot = Math.floor(i / 2);
      var y = 80 + (slot / (perSide - 1)) * (window.innerHeight - 200)
              + (Math.random() - 0.5) * 60;
      var item = makePlant(x, y);
      instances.push(item);
      (function (it, delay) {
        setTimeout(function () {
          it.el.style.transform = 'translate(-50%,-100%) rotate(' + it.rot + 'deg) scale(1)';
          it.el.style.opacity   = '1';
        }, delay);
      })(item, 20 + i * 60);
    }
  }

  function uproot() {
    instances.forEach(function (item) {
      item.el.style.transition = 'transform 0.35s ease,opacity 0.3s ease';
      item.el.style.transform  = 'translate(-50%,-100%) rotate(' + item.rot + 'deg) scale(0)';
      item.el.style.opacity    = '0';
      setTimeout(function () {
        item.el.parentNode && item.el.parentNode.removeChild(item.el);
      }, 370);
    });
    instances = [];
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('plant-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      planted = !planted;
      btn.classList.toggle('is-planted', planted);
      planted ? grow() : uproot();
    });
  });
})();
