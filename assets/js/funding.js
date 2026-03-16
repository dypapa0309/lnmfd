(() => {
  const goalEl = document.getElementById('goalQty');
  const fundedEl = document.getElementById('fundedQty');
  const orderCountEl = document.getElementById('orderCount');
  const earlybirdEl = document.getElementById('earlybirdRemaining');
  const progressPercentEl = document.getElementById('progressPercent');
  const progressFill = document.getElementById('progressFill');
  const countdownEl = document.getElementById('countdown');

  async function loadFundingStats(){
    try{
      const res = await fetch('/.netlify/functions/get-funding-stats');
      const data = await res.json();
      const goalQty = Number(data.goalQty || 300);
      const fundedQty = Number(data.fundedQty || 0);
      const orderCount = Number(data.orderCount || 0);
      const earlybirdRemaining = Number(data.earlybirdRemaining ?? 100);
      const percent = Math.min(100, Math.round((fundedQty / goalQty) * 100));

      goalEl.textContent = goalQty + '개';
      fundedEl.textContent = fundedQty + '개';
      orderCountEl.textContent = orderCount + '건';
      earlybirdEl.textContent = earlybirdRemaining + '개';
      progressPercentEl.textContent = percent + '%';
      progressFill.style.width = percent + '%';

      if(window.applyFundingStatsToUI) window.applyFundingStatsToUI(data);
    }catch(e){
      console.log(e);
    }
  }

  function updateCountdown(){
    const endDate = new Date(window.FUNDING_END_DATE || '2026-05-01T23:59:59+09:00');
    const now = new Date();
    const diff = endDate - now;

    if(diff <= 0){
      countdownEl.textContent = '종료됨';
      return;
    }
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff / (1000*60*60)) % 24);
    const mins = Math.floor((diff / (1000*60)) % 60);
    countdownEl.textContent = `${days}일 ${hours}시간 ${mins}분`;
  }

  loadFundingStats();
  updateCountdown();
  setInterval(updateCountdown, 1000);
})();