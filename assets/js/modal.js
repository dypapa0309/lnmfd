(() => {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalImg');
  const closeBtn = document.getElementById('imageModalClose');
  const backdrop = document.getElementById('imageModalBackdrop');
  const title = document.getElementById('imageModalTitle');

  if(!modal || !modalImg) return;

  function closeModal(){
    modal.hidden = true;
    document.body.style.overflow = '';
    modalImg.src = '';
    modalImg.alt = '';
  }

  function openModal(src, alt){
    if(!src) return;
    modalImg.src = src;
    modalImg.alt = alt || '확대 이미지';
    title.textContent = alt || '이미지 보기';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal-image]');
    if(!trigger) return;
    openModal(trigger.getAttribute('data-modal-image'), trigger.getAttribute('data-modal-alt'));
  });

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && !modal.hidden) closeModal();
  });
  modalImg.addEventListener('error', () => {
    title.textContent = '이미지를 찾을 수 없어';
  });
})();