/* mountains.js — margin mountains, snowflakes, skis for personal page (dark mode only) */
(function () {
  var grown = false;
  var instances = [];

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function rock()  { return '#3a5a6a'; } /* mountain body (dark-mode only element) */
  function rock2() { return '#2a4858'; } /* back peak                               */
  function snow()  { return '#c8dce6'; } /* snow cap                                */
  function flake() { return '#7ab0c8'; } /* snowflake                               */
  function ski()   { return '#c87830'; } /* ski wood                                */

  var ELEMENTS = [
    /* single jagged peak (2 jags per side) */
    function () {
      var r = rock(), s = snow();
      return '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="58" viewBox="0 0 44 58">'
        + '<path d="M0,58 L4,48 L7,52 L12,38 L23,5 L34,38 L39,52 L42,48 L44,58 Z"'
        + ' fill="' + r + '"/>'
        + '<path d="M23,5 L33,23 L29,21 L23,27 L17,21 L13,23 Z"'
        + ' fill="' + s + '"/>'
        + '</svg>';
    },
    /* two peaks with depth — back mountain peeks behind front */
    function () {
      var r = rock(), r2 = rock2(), s = snow();
      return '<svg xmlns="http://www.w3.org/2000/svg" width="58" height="62" viewBox="0 0 58 62">'
        /* back mountain (right, faded) */
        + '<path d="M14,62 L17,52 L20,56 L26,42 L39,13 L51,42 L54,56 L57,52 L58,62 Z"'
        + ' fill="' + r2 + '" opacity="0.55"/>'
        + '<path d="M39,13 L48,30 L45,28 L39,34 L33,28 L30,30 Z"'
        + ' fill="' + s + '" opacity="0.60"/>'
        /* front mountain (left) */
        + '<path d="M0,62 L3,52 L6,56 L11,42 L22,8 L33,42 L38,56 L41,52 L44,62 Z"'
        + ' fill="' + r + '"/>'
        + '<path d="M22,8 L31,24 L28,22 L22,28 L16,22 L13,24 Z"'
        + ' fill="' + s + '"/>'
        + '</svg>';
    },
    /* simple 6-arm snowflake with V-tips */
    function () {
      var c = flake();
      var a1 = 'stroke="' + c + '" stroke-linecap="round" fill="none" stroke-width="1.5"';
      var a2 = 'stroke="' + c + '" stroke-linecap="round" fill="none" stroke-width="1.0"';
      return '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">'
        /* 3 main arms at 60° intervals */
        + '<line x1="11" y1="2"   x2="11"   y2="20"  ' + a1 + '/>'
        + '<line x1="3.7" y1="6.5" x2="18.3" y2="15.5" ' + a1 + '/>'
        + '<line x1="3.7" y1="15.5" x2="18.3" y2="6.5" ' + a1 + '/>'
        /* small V at each of the 6 tips */
        + '<path d="M9,4 L11,2 L13,4'
        +        ' M9,18 L11,20 L13,18'
        +        ' M17.3,5 L18.3,6.5 L19.3,8'
        +        ' M2.7,8 L3.7,6.5 L4.7,5'
        +        ' M17.3,17 L18.3,15.5 L19.3,14'
        +        ' M2.7,14 L3.7,15.5 L4.7,17" '
        + a2 + '/>'
        + '</svg>';
    },
    /* crossed skis — simple parallelogram X with binding dot */
    function () {
      var c = ski(), s = snow();
      return '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56" viewBox="0 0 40 56">'
        /* ski 1: top-left → bottom-right */
        + '<path d="M8,3 Q10,1 12,3 L28,53 Q26,55 24,53 Z" fill="' + c + '"/>'
        /* ski 2: top-right → bottom-left */
        + '<path d="M28,3 Q30,1 32,3 L16,53 Q14,55 12,53 Z" fill="' + c + '"/>'
        /* binding mark at cross-point */
        + '<circle cx="20" cy="28" r="2.2" fill="' + s + '" opacity="0.9"/>'
        + '</svg>';
    }
  ];

  function pick() {
    var r = Math.random();
    if (r < 0.32) return 0; /* single peak     */
    if (r < 0.60) return 1; /* two-peak range  */
    if (r < 0.80) return 2; /* snowflake       */
    return 3;               /* crossed skis    */
  }

  function makeEl(x, y) {
    var idx  = pick();
    var tmpl = ELEMENTS[idx];
    var rot  = (Math.random() - 0.5) * (idx === 2 ? 36 : 7);
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
    if (!isDark()) return; /* mountains are a dark-mode treat */
    var vw  = window.innerWidth;
    var gap = (vw - Math.min(740, vw)) / 2;
    if (gap < 52) return;

    var perSide = Math.max(6, Math.min(14, Math.floor(gap / 42)));
    for (var i = 0; i < perSide * 2; i++) {
      var left = i % 2 === 0;
      var x = left
        ? Math.random() * (gap - 50) + 14
        : vw - gap + Math.random() * (gap - 50) + 14;
      var slot = Math.floor(i / 2);
      var y = 80 + (slot / (perSide - 1)) * (window.innerHeight - 200)
              + (Math.random() - 0.5) * 60;
      var item = makeEl(x, y);
      instances.push(item);
      (function (it, delay) {
        setTimeout(function () {
          it.el.style.transform = 'translate(-50%,-100%) rotate(' + it.rot + 'deg) scale(1)';
          it.el.style.opacity   = '1';
        }, delay);
      })(item, 20 + i * 60);
    }
  }

  function clear() {
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
    var btn = document.getElementById('mountain-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      grown = !grown;
      btn.classList.toggle('is-planted', grown);
      grown ? grow() : clear();
    });
  });
})();
