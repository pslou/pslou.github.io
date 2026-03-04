/* modal.js — portfolio image lightbox */
(function () {
  var overlay  = document.getElementById('img-modal');
  var modalImg = document.getElementById('modal-img');
  var caption  = document.getElementById('modal-caption');
  var closeBtn = document.getElementById('modal-close');

  if (!overlay) return;

  function openModal(src, alt) {
    modalImg.src = src;
    modalImg.alt = alt;
    caption.textContent = alt;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    modalImg.src = '';
  }

  /* Click on any portfolio image */
  document.querySelectorAll('.portfolio-img').forEach(function (img) {
    img.addEventListener('click', function () {
      openModal(this.src, this.alt);
    });
  });

  /* Close button */
  closeBtn.addEventListener('click', closeModal);

  /* Click outside the image closes modal */
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  /* Escape key closes modal */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });
})();
