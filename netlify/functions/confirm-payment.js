const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try{
    if(event.httpMethod !== 'POST'){
      return { statusCode:405, body: JSON.stringify({ message:'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { orderId, paymentKey, amount } = body;
    const tossSecretKey = process.env.TOSS_SECRET_KEY || '';

    if(!orderId || !paymentKey || !amount){
      return { statusCode:400, body: JSON.stringify({ message:'orderId, paymentKey, amount가 필요해.' }) };
    }

    let paymentData = null;
    if(tossSecretKey){
      const auth = Buffer.from(`${tossSecretKey}:`).toString('base64');
      const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method:'POST',
        headers:{
          'Authorization': `Basic ${auth}`,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({ paymentKey, orderId, amount:Number(amount) })
      });
      paymentData = await tossRes.json();
      if(!tossRes.ok){
        return { statusCode:tossRes.status, body: JSON.stringify({ message: paymentData.message || '토스 결제 승인 실패' }) };
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if(supabaseUrl && supabaseKey){
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status:'paid',
          toss_payment_key: paymentKey,
          total_amount: Number(amount),
          paid_at: new Date().toISOString()
        })
        .eq('order_id', orderId);
      if(error){
        return { statusCode:500, body: JSON.stringify({ message:error.message }) };
      }
    }

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