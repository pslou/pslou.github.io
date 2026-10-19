/* modal.js — photo previews and an accessible image viewer */
(function () {
  'use strict';

  var overlay = document.getElementById('img-modal');
  var modalImg = document.getElementById('modal-img');
  var caption = document.getElementById('modal-caption');
  var closeBtn = document.getElementById('modal-close');

  /* Keep image links working normally if this browser cannot open a dialog. */
  if (!overlay || !modalImg || !caption || !closeBtn || !overlay.showModal) return;

  var opener;
  var scrollPosition;
  var savedBodyStyles;
  var scrollLockProperties = ['overflow', 'position', 'top', 'left', 'right', 'width'];

  function lockScroll() {
    scrollPosition = { x: window.scrollX, y: window.scrollY };
    savedBodyStyles = {};
    scrollLockProperties.forEach(function (property) {
      savedBodyStyles[property] = {
        value: document.body.style.getPropertyValue(property),
        priority: document.body.style.getPropertyPriority(property)
      };
    });
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollPosition.y + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }

  function restoreScroll() {
    if (!savedBodyStyles) return;
    scrollLockProperties.forEach(function (property) {
      var saved = savedBodyStyles[property];
      if (saved.value) document.body.style.setProperty(property, saved.value, saved.priority);
      else document.body.style.removeProperty(property);
    });
    savedBodyStyles = null;

    /* The site's smooth scrolling must not animate a return from the viewer. */
    var rootStyle = document.documentElement.style;
    var behavior = rootStyle.getPropertyValue('scroll-behavior');
    var priority = rootStyle.getPropertyPriority('scroll-behavior');
    rootStyle.setProperty('scroll-behavior', 'auto', 'important');
    window.scrollTo(scrollPosition.x, scrollPosition.y);
    if (behavior) rootStyle.setProperty('scroll-behavior', behavior, priority);
    else rootStyle.removeProperty('scroll-behavior');
  }

  function photoDetails(element) {
    var img = element.tagName === 'IMG' ? element : element.querySelector('img');
    var alt = element.getAttribute('data-photo-alt') || (img && img.alt) || element.textContent.trim();
    return {
      src: element.tagName === 'A' ? element.href : (img.currentSrc || img.src),
      alt: alt,
      caption: element.getAttribute('data-photo-caption') || alt
    };
  }

  function openModal(element) {
    if (overlay.open) return;
    hidePreview();
    var photo = photoDetails(element);
    opener = element;
    modalImg.src = photo.src;
    modalImg.alt = photo.alt;
    caption.textContent = photo.caption;
    lockScroll();
    overlay.showModal();
    closeBtn.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-photo-viewer]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      /* Retain open-in-new-tab, download, and other standard link gestures. */
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openModal(link);
    });
  });

  document.querySelectorAll('.portfolio-img').forEach(function (img) {
    /* Linked artwork already has native link semantics and its own handler. */
    if (img.closest('a')) return;
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'View image: ' + img.alt);
    img.setAttribute('aria-haspopup', 'dialog');
    img.setAttribute('aria-controls', overlay.id);
    img.addEventListener('click', function () { openModal(img); });
    img.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) openModal(img);
      }
    });
  });

  closeBtn.addEventListener('click', function () { overlay.close(); });
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.close();
  });
  /* Native dialog handles Escape, focus containment, and the inert background. */
  overlay.addEventListener('close', function () {
    restoreScroll();
    modalImg.removeAttribute('src');
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });

  /* Hover is an optional preview; a single tap/click always opens the viewer. */
  var hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  var preview = document.createElement('div');
  preview.className = 'photo-preview';
  preview.hidden = true;
  preview.setAttribute('aria-hidden', 'true');
  var previewImg = document.createElement('img');
  previewImg.className = 'photo-preview__img';
  previewImg.alt = '';
  var previewCaption = document.createElement('p');
  previewCaption.className = 'photo-preview__caption';
  preview.appendChild(previewImg);
  preview.appendChild(previewCaption);
  document.body.appendChild(preview);

  var previewLink = null;
  var hideTimer;

  function hidePreview() {
    window.clearTimeout(hideTimer);
    preview.hidden = true;
    previewLink = null;
  }

  function scheduleHide() {
    window.clearTimeout(hideTimer);
    /* Let the pointer cross the small gap between the text and the preview. */
    hideTimer = window.setTimeout(hidePreview, 180);
  }

  function positionPreview() {
    if (!previewLink || preview.hidden) return;
    var anchor = previewLink.getBoundingClientRect();
    var box = preview.getBoundingClientRect();
    var margin = 12;
    var viewportWidth = document.documentElement.clientWidth;
    var viewportHeight = window.innerHeight;
    var left = Math.max(margin, Math.min(anchor.left, viewportWidth - box.width - margin));
    var top = anchor.bottom + margin;
    if (top + box.height > viewportHeight - margin) top = anchor.top - box.height - margin;
    top = Math.max(margin, Math.min(top, viewportHeight - box.height - margin));
    preview.style.left = left + 'px';
    preview.style.top = top + 'px';
  }

  document.querySelectorAll('[data-photo-preview]').forEach(function (link) {
    link.addEventListener('pointerenter', function (event) {
      if (!hoverMedia.matches || event.pointerType === 'touch' || overlay.open) return;
      window.clearTimeout(hideTimer);
      var photo = photoDetails(link);
      previewLink = link;
      previewImg.src = photo.src;
      previewCaption.textContent = photo.caption;
      preview.hidden = false;
      positionPreview();
    });
    link.addEventListener('pointerleave', scheduleHide);
  });
  preview.addEventListener('pointerenter', function () { window.clearTimeout(hideTimer); });
  preview.addEventListener('pointerleave', scheduleHide);
  previewImg.addEventListener('load', positionPreview);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') hidePreview();
  });
  window.addEventListener('scroll', hidePreview, { passive: true });
  window.addEventListener('resize', hidePreview);
  hoverMedia.addEventListener('change', hidePreview);
})();
