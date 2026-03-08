const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try{
    if(event.httpMethod !== 'POST'){
      return { statusCode:405, body: JSON.stringify({ message:'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const orderId = 'LM_' + Date.now();

    const payload = {
      order_id: orderId,
      name: body.name || '',
      phone: body.phone || '',
      zipcode: body.zipcode || '',
      address: body.address || '',
      address_detail: body.address_detail || '',
      memo: body.memo || '',
      reward_type: body.reward_type || '',
      reward_name: body.reward_name || '',
      reward_qty: Number(body.reward_qty || 1),
      unit_price: Number(body.unit_price || 0),
      shipping_fee: Number(body.shipping_fee || 0),
      total_amount: Number(body.total_amount || 0),
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if(supabaseUrl && supabaseKey){
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from('orders').insert(payload);
      if(error){
        return { statusCode:500, body: JSON.stringify({ message:error.message }) };
      }
    }

    return {
      statusCode:200,
      body: JSON.stringify({
        orderId,
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
