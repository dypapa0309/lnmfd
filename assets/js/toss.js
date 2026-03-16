(() => {
  const payBtn = document.getElementById('payBtn');
  if (!payBtn) return;

  payBtn.addEventListener('click', async () => {
    if (!window.validateOrderForm || !window.validateOrderForm()) return;

    const payload = window.collectOrderPayload ? window.collectOrderPayload() : null;
    if (!payload) return;

    const formError = document.getElementById('formError');
    if (formError) formError.textContent = '';

    payBtn.disabled = true;
    payBtn.textContent = '주문 생성 중...';

    try {
      const createRes = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const order = await createRes.json();

      if (!createRes.ok || !order.orderId) {
        throw new Error(order.message || '주문 생성 실패');
      }

      payBtn.textContent = '결제창 여는 중...';

      const tossClientKey = window.TOSS_CLIENT_KEY || 'test_ck_6BYq7GWPVvg2jJAxwvN5rNE5vbo1';
      const tossPayments = TossPayments(tossClientKey);

      await tossPayments.requestPayment('CARD', {
        amount: payload.total_amount,
        orderId: order.orderId,
        orderName: payload.reward_name,
        customerName: payload.name,
        successUrl: `${window.location.origin}/success.html`,
        failUrl: `${window.location.origin}/fail.html`
      });

    } catch (err) {
      console.error(err);
      if (formError) {
        formError.textContent = err.message || '결제 요청 중 오류가 발생했어.';
      }
      payBtn.disabled = false;
      payBtn.textContent = '토스페이로 결제하기';
    }
  });
})();