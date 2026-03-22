const {
  confirmTossPayment,
  fetchOrderById,
  fetchTossPayment,
  getSupabaseAdmin,
  mapTossStatus,
  updateOrder
} = require('./_payment-utils');

exports.handler = async (event) => {
  try{
    if(event.httpMethod !== 'POST'){
      return { statusCode:405, body: JSON.stringify({ message:'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { orderId, paymentKey, amount } = body;
    const tossSecretKey = process.env.TOSS_SECRET_KEY || '';
    const supabase = getSupabaseAdmin();

    if(!orderId || !paymentKey || !amount){
      return { statusCode:400, body: JSON.stringify({ message:'orderId, paymentKey, amount가 필요해.' }) };
    }

    if(!tossSecretKey){
      return { statusCode:500, body: JSON.stringify({ message:'TOSS_SECRET_KEY가 설정되지 않았어.' }) };
    }

    if(!supabase){
      return { statusCode:500, body: JSON.stringify({ message:'Supabase 연결 정보가 필요해.' }) };
    }

    const order = await fetchOrderById(supabase, orderId);
    if(!order){
      return { statusCode:404, body: JSON.stringify({ message:'주문을 찾지 못했어.' }) };
    }

    const requestAmount = Number(amount);
    const expectedAmount = Number(order.total_amount || 0);
    if(expectedAmount !== requestAmount){
      await updateOrder(supabase, orderId, {
        payment_status: 'amount_mismatch',
        payment_error_message: `expected:${expectedAmount}, actual:${requestAmount}`,
        updated_at: new Date().toISOString()
      });
      return {
        statusCode: 400,
        body: JSON.stringify({ message: '주문 금액이 일치하지 않아 결제를 승인하지 않았어.' })
      };
    }

    if(order.payment_status === 'paid'){
      const paymentData = await fetchTossPayment(tossSecretKey, paymentKey);
      return {
        statusCode:200,
        body: JSON.stringify({ status:'confirmed', payment: paymentData, alreadyConfirmed:true })
      };
    }

    const paymentData = await confirmTossPayment(tossSecretKey, {
      paymentKey,
      orderId,
      amount: requestAmount
    });

    if(String(paymentData.orderId || '') !== orderId){
      return { statusCode:400, body: JSON.stringify({ message:'토스 응답의 주문번호가 일치하지 않아.' }) };
    }

    if(Number(paymentData.totalAmount || 0) !== expectedAmount){
      await updateOrder(supabase, orderId, {
        payment_status: 'amount_mismatch',
        payment_error_message: `confirmed:${Number(paymentData.totalAmount || 0)}, expected:${expectedAmount}`,
        updated_at: new Date().toISOString()
      });
      return { statusCode:400, body: JSON.stringify({ message:'승인 금액이 주문 금액과 달라.' }) };
    }

    await updateOrder(supabase, orderId, {
      payment_status: mapTossStatus(paymentData.status),
      toss_payment_key: paymentKey,
      toss_order_status: paymentData.status || '',
      payment_method: paymentData.method || '',
      approved_at: paymentData.approvedAt || null,
      paid_at: paymentData.approvedAt || new Date().toISOString(),
      payment_last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return {
      statusCode:200,
      body: JSON.stringify({ status:'confirmed', payment: paymentData })
    };
  }catch(err){
    return {
      statusCode:500,
      body: JSON.stringify({ message: err.message || 'confirm-payment failed' })
    };
  }
};
