const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const goalQty = 300;
  const earlybirdLimit = 100;

  try{
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if(supabaseUrl && supabaseKey){
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: paidOrders, error } = await supabase
        .from('orders')
        .select('reward_qty,reward_type,total_amount')
        .eq('payment_status','paid');

      if(error){
        return { statusCode:500, body: JSON.stringify({ message:error.message }) };
      }

      const rows = paidOrders || [];
      const fundedQty = rows.reduce((sum, row) => sum + Number(row.reward_qty || 0), 0);
      const orderCount = rows.length;
      const fundingAmount = rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
      const earlybirdPaid = rows
        .filter(row => row.reward_type === 'earlybird')
        .reduce((sum, row) => sum + Number(row.reward_qty || 0), 0);

      return {
        statusCode:200,
        body: JSON.stringify({
          goalQty,
          fundedQty,
          orderCount,
          fundingAmount,
          earlybirdRemaining: Math.max(0, earlybirdLimit - earlybirdPaid)
        })
      };
    }

    return {
      statusCode:200,
      body: JSON.stringify({
        goalQty,
        fundedQty: 0,
        orderCount: 0,
        fundingAmount: 0,
        earlybirdRemaining: earlybirdLimit
      })
    };
  }catch(err){
    return {
      statusCode:500,
      body: JSON.stringify({ message: err.message || 'get-funding-stats failed' })
    };
  }
};
