(() => {
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.16 });
  revealEls.forEach(el => io.observe(el));

  const cards = Array.from(document.querySelectorAll('.reward-card'));
  const rewardName = document.getElementById('selectedRewardName');
  const rewardTotal = document.getElementById('selectedRewardTotal');
  const payRewardName = document.getElementById('payRewardName');
  const payTotalAmount = document.getElementById('payTotalAmount');
  const stickyRewardNameBottom = document.getElementById('stickyRewardNameBottom');
  const stickyRewardNameTop = document.getElementById('stickyRewardNameTop');
  const jumpToOrderBtn = document.getElementById('jumpToOrderBtn');
  const stickyOrderBtn = document.getElementById('stickyOrderBtn');
  const formError = document.getElementById('formError');
  const earlybirdInline = document.getElementById('earlybirdStockInline');
  const earlybirdBadge = document.getElementById('earlybirdBadge');
  const orderStatusBox = document.getElementById('orderStatusBox');
  const addressSearchBtn = document.getElementById('addressSearchBtn');

  window.selectedReward = {
    type: 'earlybird',
    name: '[얼리버드] 독서링 1EA',
    qty: 1,
    unitPrice: 17900,
    shippingFee: 3000,
    totalPrice: 20900
  };

  function formatWon(value){
    return Number(value).toLocaleString('ko-KR') + '원';
  }

  function updateRewardUI(data){
    rewardName.textContent = data.name;
    rewardTotal.textContent = formatWon(data.totalPrice);
    payRewardName.textContent = data.name;
    payTotalAmount.textContent = formatWon(data.totalPrice);
    stickyRewardNameBottom.textContent = data.name;
    stickyRewardNameTop.textContent = data.name;
    if(orderStatusBox){
      orderStatusBox.hidden = false;
      orderStatusBox.textContent = `${data.name} 리워드로 주문을 진행 중이야.`;
    }
  }

  function selectCard(card){
    if(card.classList.contains('is-disabled')) return;
    cards.forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');

    const data = {
      type: card.dataset.type || '',
      name: card.dataset.name || '',
      qty: Number(card.dataset.qty || 1),
      unitPrice: Number(card.dataset.price || 0),
      shippingFee: Number(card.dataset.shipping || 0),
    };
    data.totalPrice = data.unitPrice + data.shippingFee;
    window.selectedReward = data;
    updateRewardUI(data);
  }

  cards.forEach(card => {
    card.addEventListener('click', () => selectCard(card));
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        selectCard(card);
      }
    });
  });

  jumpToOrderBtn?.addEventListener('click', () => {
    document.getElementById('order')?.scrollIntoView({behavior:'smooth'});
  });

  stickyOrderBtn?.addEventListener('click', () => {
    document.getElementById('order')?.scrollIntoView({behavior:'smooth'});
  });

  addressSearchBtn?.addEventListener('click', () => {
    const box = document.getElementById('formError');
    box.textContent = '주소 검색 API를 붙일 준비가 된 버튼이야. 지금은 직접 입력 방식으로 사용해줘.';
  });

  window.validateOrderForm = function(){
    formError.textContent = '';
    const name = document.getElementById('name')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const agree = document.getElementById('agree')?.checked;

    if(!window.selectedReward){
      formError.textContent = '리워드를 선택해줘.';
      return false;
    }
    if(!name){
      formError.textContent = '이름을 입력해줘.';
      return false;
    }
    if(!/^01[0-9]{8,9}$/.test(phone)){
      formError.textContent = '전화번호를 숫자만 입력해줘. 예: 01012345678';
      return false;
    }
    if(!address){
      formError.textContent = '주소를 입력해줘.';
      return false;
    }
    if(!agree){
      formError.textContent = '개인정보 수집 및 결제 동의가 필요해.';
      return false;
    }
    return true;
  };

  window.collectOrderPayload = function(){
    return {
      name: document.getElementById('name')?.value.trim(),
      phone: document.getElementById('phone')?.value.trim(),
      zipcode: document.getElementById('zipcode')?.value.trim(),
      address: document.getElementById('address')?.value.trim(),
      address_detail: document.getElementById('addressDetail')?.value.trim(),
      memo: document.getElementById('memo')?.value.trim(),
      reward_type: window.selectedReward.type,
      reward_name: window.selectedReward.name,
      reward_qty: window.selectedReward.qty,
      unit_price: window.selectedReward.unitPrice,
      shipping_fee: window.selectedReward.shippingFee,
      total_amount: window.selectedReward.totalPrice
    };
  };

  window.applyFundingStatsToUI = function(data){
    const earlybirdRemaining = Number(data.earlybirdRemaining ?? 100);
    if(earlybirdInline) earlybirdInline.textContent = `${earlybirdRemaining}개`;

    const earlybirdCard = document.querySelector('.reward-card[data-type="earlybird"]');
    if(earlybirdCard){
      if(earlybirdRemaining <= 0){
        earlybirdCard.classList.add('is-disabled');
        if(earlybirdBadge){
          earlybirdBadge.textContent = 'SOLD OUT';
          earlybirdBadge.classList.add('reward-badge--soldout');
        }
        const stockText = earlybirdCard.querySelector('.reward-stock strong');
        if(stockText) stockText.textContent = '품절';
        if(earlybirdCard.classList.contains('is-selected')){
          const fallback = document.querySelector('.reward-card[data-type="single"]') || cards[1];
          if(fallback) selectCard(fallback);
        }
      } else {
        earlybirdCard.classList.remove('is-disabled');
        if(earlybirdBadge){
          earlybirdBadge.textContent = 'EARLY BIRD';
          earlybirdBadge.classList.remove('reward-badge--soldout');
        }
      }
    }
  };

  const selected = document.querySelector('.reward-card.is-selected') || cards[0];
  if(selected) selectCard(selected);
})();
