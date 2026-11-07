alter table public.products
  add column if not exists stock integer not null default 1;

alter table public.products
  drop constraint if exists products_stock_nonnegative;

alter table public.products
  add constraint products_stock_nonnegative check (stock >= 0);

alter table public.orders
  add column if not exists quantity integer not null default 1;

alter table public.orders
  drop constraint if exists orders_quantity_positive;

alter table public.orders
  add constraint orders_quantity_positive check (quantity > 0);

drop function if exists public.place_catalog_order(uuid, uuid);

create or replace function public.place_catalog_order(
  p_product_id uuid,
  p_buyer_id uuid,
  p_quantity integer
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  listing public.products%rowtype;
  new_order public.orders%rowtype;
  unit_price numeric(12, 2);
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select *
  into listing
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'LISTING_NOT_FOUND';
  end if;

  if listing.seller_id = p_buyer_id then
    raise exception 'CANNOT_PURCHASE_OWN_LISTING';
  end if;

  if not exists (select 1 from public.users where id = p_buyer_id) then
    raise exception 'BUYER_NOT_FOUND';
  end if;

  if listing.status <> 'available' or listing.stock <= 0 then
    raise exception 'SLOT_TAKEN';
  end if;

  if p_quantity > listing.stock then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  unit_price := listing.price;

  insert into public.orders (
    product_id,
    buyer_id,
    quantity,
    total_amount,
    escrow_status,
    tracking_number
  )
  values (
    p_product_id,
    p_buyer_id,
    p_quantity,
    unit_price * p_quantity,
    'pending',
    null
  )
  returning * into new_order;

  update public.products
  set
    stock = listing.stock - p_quantity,
    status = case
      when listing.stock - p_quantity <= 0 then 'sold'::public.product_status
      else listing.status
    end
  where id = p_product_id;

  return new_order;
end;
$$;

revoke all on function public.place_catalog_order(uuid, uuid, integer) from public;
grant execute on function public.place_catalog_order(uuid, uuid, integer) to service_role;
