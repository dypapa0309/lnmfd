(() => {
  const payBtn = document.getElementById('payBtn');
  if(!payBtn) return;

  payBtn.addEventListener('click', async () => {
    if(!window.validateOrderForm || !window.validateOrderForm()) return;

    const payload = window.collectOrderPayload ? window.collectOrderPayload() : null;
    if(!payload) return;

    payBtn.disabled = true;
    payBtn.textContent = '주문 생성 중...';

    try{
      const createRes = await fetch('/.netlify/functions/create-order', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const order = await createRes.json();

      if(!createRes.ok || !order.orderId){
        throw new Error(order.message || '주문 생성 실패');
      }

      const tossClientKey = window.TOSS_CLIENT_KEY || 'YOUR_TOSS_CLIENT_KEY';
      const tossPayments = TossPayments(tossClientKey);

      tossPayments.requestPayment('카드', {
        amount: payload.total_amount,
        orderId: order.orderId,
        orderName: payload.reward_name,
        customerName: payload.name,
        successUrl: `${window.location.origin}/success.html?orderId=${order.orderId}&amount=${payload.total_amount}`,
        failUrl: `${window.location.origin}/fail.html`
      });

    }catch(err){
      const formError = document.getElementById('formError');
      if(formError) formError.textContent = err.message || '결제 요청 중 오류가 발생했어.';
      payBtn.disabled = false;
      payBtn.textContent = '토스페이로 결제하기';
    }
  });
})();
