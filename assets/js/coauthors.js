/* coauthors.js — auto-link co-author names in .pub-authors from _data/coauthors.yml */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof PSL_COAUTHORS === 'undefined') return;
    var els = document.querySelectorAll('.pub-authors');
    if (!els.length) return;

    PSL_COAUTHORS.forEach(function (author) {
      if (!author.url) return; /* skip entries with no URL yet */
      els.forEach(function (el) { linkName(el, author.name, author.url); });
    });
  });

  /* Walk text nodes inside el and replace the first occurrence of name with a link */
  function linkName(el, name, url) {
    var textNodes = [];
    collect(el, textNodes);
    textNodes.forEach(function (node) {
      if (!node.parentNode) return; /* already removed by an earlier pass */
      var text = node.nodeValue;
      var idx  = text.indexOf(name);
      if (idx === -1) return;

      var link      = document.createElement('a');
      link.href     = url;
      link.textContent = name;
      link.target   = '_blank';
      link.rel      = 'noopener noreferrer';
      link.className = 'coauthor-link';

      var parent = node.parentNode;
      parent.insertBefore(document.createTextNode(text.slice(0, idx)), node);
      parent.insertBefore(link, node);
      parent.insertBefore(document.createTextNode(text.slice(idx + name.length)), node);
      parent.removeChild(node);
    });
  }

  /* Collect all text nodes that are not inside an <a> tag */
  function collect(el, arr) {
    el.childNodes.forEach(function (child) {
      if (child.nodeType === 3) {
        arr.push(child);
      } else if (child.nodeType === 1 && child.tagName !== 'A') {
        collect(child, arr);
      }
    });
  }
})();
