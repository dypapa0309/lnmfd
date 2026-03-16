(() => {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalImg');
  const closeBtn = document.getElementById('imageModalClose');
  const backdrop = document.getElementById('imageModalBackdrop');
  const title = document.getElementById('imageModalTitle');
  const loading = document.getElementById('imageModalLoading');
  const errorBox = document.getElementById('imageModalError');

  if(!modal || !modalImg) return;

  function resetState(){
    modalImg.classList.remove('is-ready');
    if(loading) loading.hidden = false;
    if(errorBox) errorBox.hidden = true;
  }

  function closeModal(){
    modal.hidden = true;
    document.body.style.overflow = '';
    modalImg.src = '';
    modalImg.alt = '';
    modalImg.classList.remove('is-ready');
    if(loading) loading.hidden = true;
    if(errorBox) errorBox.hidden = true;
  }

  function openModal(src, alt){
    if(!src) return;
    const resolvedSrc = new URL(src, window.location.href).href;
    resetState();
    modalImg.src = resolvedSrc;
    modalImg.alt = alt || '확대 이미지';
    if(title) title.textContent = alt || '이미지 보기';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal-image]');
    if(!trigger) return;
    openModal(trigger.getAttribute('data-modal-image'), trigger.getAttribute('data-modal-alt'));
  });

  modalImg.addEventListener('load', () => {
    modalImg.classList.add('is-ready');
    if(loading) loading.hidden = true;
    if(errorBox) errorBox.hidden = true;
  });

  modalImg.addEventListener('error', () => {
    modalImg.classList.remove('is-ready');
    if(loading) loading.hidden = true;
    if(errorBox) errorBox.hidden = false;
    if(title) title.textContent = '이미지를 찾을 수 없어';
  });

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && !modal.hidden) closeModal();
  });
})();