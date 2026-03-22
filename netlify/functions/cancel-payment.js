const crypto = require('crypto');
const {
  cancelTossPayment,
  fetchOrderById,
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
    const password = String(body.password || '');
    const orderId = String(body.orderId || '');
    const cancelReason = String(body.cancelReason || '관리자 요청 취소').trim();
    const expectedPassword = process.env.ADMIN_PASSWORD || '';
    const tossSecretKey = process.env.TOSS_SECRET_KEY || '';
    const supabase = getSupabaseAdmin();

    if(!expectedPassword || password !== expectedPassword){
      return { statusCode:401, body: JSON.stringify({ message:'관리자 비밀번호가 올바르지 않아.' }) };
    }

    if(!orderId){
      return { statusCode:400, body: JSON.stringify({ message:'취소할 주문번호가 필요해.' }) };
    }

    if(!supabase){
      return { statusCode:500, body: JSON.stringify({ message:'Supabase 연결 정보가 필요해.' }) };
    }

    if(!tossSecretKey){
      return { statusCode:500, body: JSON.stringify({ message:'TOSS_SECRET_KEY가 설정되지 않았어.' }) };
    }

    const order = await fetchOrderById(supabase, orderId);
    if(!order){
      return { statusCode:404, body: JSON.stringify({ message:'주문을 찾지 못했어.' }) };
    }

    if(!order.toss_payment_key){
      return { statusCode:400, body: JSON.stringify({ message:'토스 결제 키가 없어서 취소할 수 없어.' }) };
    }

    if(order.payment_status !== 'paid' && order.payment_status !== 'partially_cancelled'){
      return { statusCode:400, body: JSON.stringify({ message:'승인 완료된 주문만 취소할 수 있어.' }) };
    }

    const paymentData = await cancelTossPayment(tossSecretKey, order.toss_payment_key, {
      cancelReason,
      idempotencyKey: `cancel-${orderId}-${crypto.randomBytes(6).toString('hex')}`
    });

    const lastCancel = Array.isArray(paymentData.cancels) ? paymentData.cancels[paymentData.cancels.length - 1] : null;
    const cancelAmount = lastCancel ? Number(lastCancel.cancelAmount || order.total_amount || 0) : Number(order.total_amount || 0);

    const updatedOrder = await updateOrder(supabase, orderId, {
      payment_status: mapTossStatus(paymentData.status),
      toss_order_status: paymentData.status || '',
      refunded_at: new Date().toISOString(),
      cancellation_reason: cancelReason,
      cancel_amount: cancelAmount,
      payment_last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: '결제를 취소했어.',
        order: updatedOrder,
        payment: paymentData
      })
    };
  }catch(err){
    return {
      statusCode:500,
      body: JSON.stringify({ message: err.message || 'cancel-payment failed' })
    };
  }
};
