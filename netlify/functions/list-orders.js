const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try{
    if(event.httpMethod !== 'POST'){
      return { statusCode:405, body: JSON.stringify({ message:'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const password = body.password || '';
    const expected = process.env.ADMIN_PASSWORD || '';

    if(!expected || password !== expected){
      return { statusCode:401, body: JSON.stringify({ message:'관리자 비밀번호가 올바르지 않아.' }) };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if(supabaseUrl && supabaseKey){
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending:false })
        .limit(100);

      if(error){
        return { statusCode:500, body: JSON.stringify({ message:error.message }) };
      }

      return {
        statusCode:200,
        body: JSON.stringify({ orders: data || [] })
      };
    }

    return {
      statusCode:200,
      body: JSON.stringify({ orders: [] })
    };
  }catch(err){
    return {
      statusCode:500,
      body: JSON.stringify({ message: err.message || 'list-orders failed' })
    };
  }
};
