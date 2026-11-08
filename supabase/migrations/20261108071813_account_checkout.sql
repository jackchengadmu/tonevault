-- Add checkout details without changing existing orders, buyer IDs or pricing logic.
create table public.order_checkout_details (
  order_id uuid primary key references public.orders(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  email text not null check (length(email) between 3 and 254),
  phone text not null check (length(trim(phone)) between 7 and 30),
  address text not null check (length(trim(address)) between 10 and 500),
  payment_method text not null check (payment_method in ('simulated_card', 'simulated_gcash'))
);
alter table public.order_checkout_details enable row level security;
revoke all on public.order_checkout_details from public, anon, authenticated;
grant select, insert on public.order_checkout_details to service_role;

create function public.place_checkout_order(
  p_product_id uuid, p_buyer_id uuid, p_quantity integer, p_full_name text,
  p_email text, p_phone text, p_address text, p_payment_method text
)
returns public.orders
language plpgsql
security invoker
set search_path = ''
as $$
declare saved public.orders%rowtype;
begin
  -- Reuse the original price calculation, product lock and inventory update.
  saved := public.place_catalog_order(p_product_id, p_buyer_id, p_quantity);
  insert into public.order_checkout_details(order_id, full_name, email, phone, address, payment_method)
  values(saved.id, p_full_name, p_email, p_phone, p_address, p_payment_method);
  return saved;
end;
$$;
revoke all on function public.place_checkout_order(uuid, uuid, integer, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.place_checkout_order(uuid, uuid, integer, text, text, text, text, text) to service_role;
