const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const REWARD_CATALOG = {
  earlybird: {
    type: 'earlybird',
    name: '[얼리버드] 독서링 1EA',
    qty: 1,
    unitPrice: 17900,
    shippingFee: 3000
  },
  single: {
    type: 'single',
    name: '일반 독서링 1EA',
    qty: 1,
    unitPrice: 22000,
    shippingFee: 3000
  },
  double: {
    type: 'double',
    name: '독서링 2EA 세트',
    qty: 2,
    unitPrice: 42000,
    shippingFee: 3000
  }
};

function getSupabaseAdmin(){
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

function getRewardConfig(body = {}){
  const rewardType = String(body.reward_type || '').trim();
  const rewardName = String(body.reward_name || '').trim();

  if(rewardType && REWARD_CATALOG[rewardType]){
    return REWARD_CATALOG[rewardType];
  }

  return Object.values(REWARD_CATALOG).find((reward) => reward.name === rewardName) || null;
}

function buildOrderPayload(body = {}){
  const reward = getRewardConfig(body);
  if(!reward) return null;

  return {
    name: String(body.name || '').trim(),
    phone: String(body.phone || '').trim(),
    zipcode: String(body.zipcode || '').trim(),
    address: String(body.address || '').trim(),
    address_detail: String(body.address_detail || '').trim(),
    memo: String(body.memo || '').trim(),
    reward_type: reward.type,
    reward_name: reward.name,
    reward_qty: reward.qty,
    unit_price: reward.unitPrice,
    shipping_fee: reward.shippingFee,
    total_amount: reward.unitPrice + reward.shippingFee
  };
}

function generateOrderId(){
  return `LM_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function mapTossStatus(status){
  const normalized = String(status || '').toUpperCase();
  switch(normalized){
    case 'DONE':
      return 'paid';
    case 'CANCELED':
      return 'cancelled';
    case 'PARTIAL_CANCELED':
      return 'partially_cancelled';
    case 'ABORTED':
      return 'failed';
    case 'EXPIRED':
      return 'expired';
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'READY':
      return 'ready';
    case 'WAITING_FOR_DEPOSIT':
      return 'waiting_for_deposit';
    default:
      return normalized ? normalized.toLowerCase() : 'pending';
  }
}

async function fetchOrderById(supabase, orderId){
  if(!supabase) return null;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if(error) throw error;
  return data || null;
}

async function updateOrder(supabase, orderId, patch){
  if(!supabase) return null;
  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('order_id', orderId)
    .select('*')
    .maybeSingle();

  if(error) throw error;
  return data || null;
}

async function fetchTossPayment(secretKey, paymentKey){
  if(!secretKey || !paymentKey) return null;
  const auth = Buffer.from(`${secretKey}:`).toString('base64');
  const res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`
    }
  });
  const data = await res.json();
  if(!res.ok){
    const error = new Error(data.message || '토스 결제 조회 실패');
    error.statusCode = res.status;
    throw error;
  }
  return data;
}

async function confirmTossPayment(secretKey, { paymentKey, orderId, amount }){
  const auth = Buffer.from(`${secretKey}:`).toString('base64');
  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount: Number(amount)
    })
  });
  const data = await res.json();
  if(!res.ok){
    const error = new Error(data.message || '토스 결제 승인 실패');
    error.statusCode = res.status;
    error.payload = data;
    throw error;
  }
  return data;
}

async function cancelTossPayment(secretKey, paymentKey, { cancelReason, cancelAmount, idempotencyKey }){
  const auth = Buffer.from(`${secretKey}:`).toString('base64');
  const headers = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json'
  };
  if(idempotencyKey){
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const body = {
    cancelReason: String(cancelReason || '관리자 요청 취소').slice(0, 200)
  };
  if(cancelAmount){
    body.cancelAmount = Number(cancelAmount);
  }

  const res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if(!res.ok){
    const error = new Error(data.message || '토스 결제 취소 실패');
    error.statusCode = res.status;
    error.payload = data;
    throw error;
  }
  return data;
}

module.exports = {
  REWARD_CATALOG,
  buildOrderPayload,
  cancelTossPayment,
  confirmTossPayment,
  fetchOrderById,
  fetchTossPayment,
  generateOrderId,
  getRewardConfig,
  getSupabaseAdmin,
  mapTossStatus,
  updateOrder
};
