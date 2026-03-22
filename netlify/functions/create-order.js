const {
  buildOrderPayload,
  generateOrderId,
  getSupabaseAdmin
} = require('./_payment-utils');

exports.handler = async (event) => {
  try{
    if(event.httpMethod !== 'POST'){
      return { statusCode:405, body: JSON.stringify({ message:'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const basePayload = buildOrderPayload(body);
    if(!basePayload){
      return {
        statusCode: 400,
        body: JSON.stringify({ message: '유효한 리워드 정보가 아니야.' })
      };
    }

    const payload = {
      order_id: generateOrderId(),
      ...basePayload,
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };

    const supabase = getSupabaseAdmin();
    if(supabase){
      const { error } = await supabase.from('orders').insert(payload);
      if(error){
        return { statusCode:500, body: JSON.stringify({ message:error.message }) };
      }
    }

    return {
      statusCode:200,
      body: JSON.stringify({
        orderId: payload.order_id,
        totalAmount: payload.total_amount
      })
    };
  }catch(err){
    return {
      statusCode:500,
      body: JSON.stringify({ message: err.message || 'create-order failed' })
    };
  }
};
