alter table if exists public.orders
  add column if not exists toss_payment_key text,
  add column if not exists toss_order_status text,
  add column if not exists payment_method text,
  add column if not exists approved_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists cancel_amount integer,
  add column if not exists payment_last_synced_at timestamptz,
  add column if not exists payment_error_message text,
  add column if not exists updated_at timestamptz;

create index if not exists orders_order_id_idx on public.orders(order_id);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
