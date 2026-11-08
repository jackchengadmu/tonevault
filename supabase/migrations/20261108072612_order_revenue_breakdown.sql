-- GC1 rules live in one server-side function; each order snapshots its amounts.
create function public.checkout_pricing_rules()
returns jsonb language sql immutable set search_path = ''
as $$ select jsonb_build_object('commission_rate', 0.08, 'physical_inspection_fee', 8500.00); $$;
revoke all on function public.checkout_pricing_rules() from public, anon, authenticated;
grant execute on function public.checkout_pricing_rules() to service_role;

create table public.order_pricing (
  order_id uuid primary key references public.orders(id) on delete cascade,
  merchandise_amount numeric(12,2) not null check (merchandise_amount >= 0),
  commission_rate numeric(5,4) not null check (commission_rate between 0 and 1),
  inspection_fee numeric(12,2) not null default 0 check (inspection_fee >= 0),
  inspection_status text not null default 'not_requested' check (inspection_status in ('not_requested','pending','completed')),
  commission_amount numeric(12,2) generated always as (round(merchandise_amount * commission_rate,2)) stored,
  seller_proceeds numeric(12,2) generated always as (merchandise_amount - round(merchandise_amount * commission_rate,2)) stored,
  buyer_total numeric(12,2) generated always as (merchandise_amount + inspection_fee) stored
);
alter table public.order_pricing enable row level security;
revoke all on public.order_pricing from public, anon, authenticated;
grant select, insert, update on public.order_pricing to service_role;

create function public.snapshot_order_pricing()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin
  insert into public.order_pricing(order_id, merchandise_amount, commission_rate)
  values(new.id, new.total_amount, (public.checkout_pricing_rules()->>'commission_rate')::numeric);
  return new;
end; $$;
revoke all on function public.snapshot_order_pricing() from public, anon, authenticated;
create trigger orders_snapshot_pricing after insert on public.orders
for each row execute function public.snapshot_order_pricing();
-- Historical orders remain unchanged; no commission is retroactively assigned.

drop function public.place_checkout_order(uuid, uuid, integer, text, text, text, text, text);
create function public.place_checkout_order(
  p_product_id uuid, p_buyer_id uuid, p_quantity integer, p_full_name text,
  p_email text, p_phone text, p_address text, p_payment_method text,
  p_inspection_requested boolean default false
)
returns public.orders language plpgsql security invoker set search_path = ''
as $$
declare saved public.orders%rowtype;
begin
  saved := public.place_catalog_order(p_product_id, p_buyer_id, p_quantity);
  insert into public.order_checkout_details(order_id, full_name, email, phone, address, payment_method)
  values(saved.id, p_full_name, p_email, p_phone, p_address, p_payment_method);
  if p_inspection_requested then
    update public.order_pricing set
      inspection_fee = (public.checkout_pricing_rules()->>'physical_inspection_fee')::numeric,
      inspection_status = 'pending'
    where order_id = saved.id;
    update public.orders set total_amount = (select buyer_total from public.order_pricing where order_id = saved.id)
    where id = saved.id returning * into saved;
  end if;
  return saved;
end; $$;
revoke all on function public.place_checkout_order(uuid, uuid, integer, text, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.place_checkout_order(uuid, uuid, integer, text, text, text, text, text, boolean) to service_role;

-- Pending simulated orders are not earned platform revenue.
create view public.order_revenue with (security_invoker = true) as
select p.order_id,
  case when o.escrow_status in ('approved', 'payout_released') then p.commission_amount else 0 end as commission_revenue,
  case when p.inspection_status = 'completed' then p.inspection_fee else 0 end as inspection_revenue
from public.order_pricing p join public.orders o on o.id = p.order_id;
revoke all on public.order_revenue from public, anon, authenticated;
grant select on public.order_revenue to service_role;
