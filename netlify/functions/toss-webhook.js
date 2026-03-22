const {
  fetchOrderById,
  fetchTossPayment,
  getSupabaseAdmin,
  mapTossStatus,
  updateOrder
} = require('./_payment-utils');

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try{
    const supabase = getSupabaseAdmin();
    const tossSecretKey = process.env.TOSS_SECRET_KEY || '';
    const payload = JSON.parse(event.body || '{}');
    const eventType = String(payload.eventType || '');
    const data = payload.data || {};
    const orderId = String(data.orderId || '');

    if(!supabase || !orderId){
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const order = await fetchOrderById(supabase, orderId);
    if(!order){
      return { statusCode: 200, body: JSON.stringify({ received: true, ignored: 'order_not_found' }) };
    }

    if(eventType === 'PAYMENT_STATUS_CHANGED'){
      let paymentData = data;
      if(tossSecretKey && data.paymentKey){
        paymentData = await fetchTossPayment(tossSecretKey, data.paymentKey);
      }

      const patch = {
        payment_status: mapTossStatus(paymentData.status),
        toss_order_status: paymentData.status || '',
        toss_payment_key: paymentData.paymentKey || order.toss_payment_key || '',
        payment_method: paymentData.method || order.payment_method || '',
        payment_last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if(mapTossStatus(paymentData.status) === 'paid'){
        patch.paid_at = paymentData.approvedAt || order.paid_at || new Date().toISOString();
        patch.approved_at = paymentData.approvedAt || order.approved_at || null;
      }
      if(mapTossStatus(paymentData.status) === 'failed'){
        patch.payment_error_message = paymentData.failure?.message || paymentData.lastTransactionKey || '결제 실패';
      }
      if(mapTossStatus(paymentData.status) === 'expired'){
        patch.payment_error_message = '결제 승인 유효시간이 만료되었어.';
      }

      await updateOrder(supabase, orderId, patch);
    }

    if(eventType === 'CANCEL_STATUS_CHANGED'){
      await updateOrder(supabase, orderId, {
        payment_status: 'cancelled',
        refunded_at: new Date().toISOString(),
        cancellation_reason: data.cancelReason || order.cancellation_reason || '',
        cancel_amount: Number(data.cancelAmount || order.cancel_amount || order.total_amount || 0),
        payment_last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }catch(err){
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || 'toss-webhook failed' })
    };
  }
};
