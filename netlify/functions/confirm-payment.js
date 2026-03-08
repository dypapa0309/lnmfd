const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try{
    if(event.httpMethod !== 'POST'){
      return { statusCode:405, body: JSON.stringify({ message:'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { orderId, paymentKey, amount } = body;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if(supabaseUrl && supabaseKey){
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status:'paid',
          toss_payment_key: paymentKey || '',
          total_amount: amount ? Number(amount) : undefined,
          paid_at: new Date().toISOString()
        })
        .eq('order_id', orderId);
      if(error){
        return { statusCode:500, body: JSON.stringify({ message:error.message }) };
      }
    }

    return {
      statusCode:200,
      body: JSON.stringify({ status:'confirmed' })
    };
  }catch(err){
    return {
      statusCode:500,
      body: JSON.stringify({ message: err.message || 'confirm-payment failed' })
    };
  }
};
