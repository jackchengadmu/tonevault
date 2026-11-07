create or replace function public.place_catalog_order(
  p_product_id uuid,
  p_buyer_id uuid
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  listing public.products%rowtype;
  new_order public.orders%rowtype;
begin
  select *
  into listing
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'LISTING_NOT_FOUND';
  end if;

  if listing.status <> 'available' then
    raise exception 'LISTING_NOT_AVAILABLE';
  end if;

  if listing.seller_id = p_buyer_id then
    raise exception 'CANNOT_PURCHASE_OWN_LISTING';
  end if;

  if not exists (select 1 from public.users where id = p_buyer_id) then
    raise exception 'BUYER_NOT_FOUND';
  end if;

  insert into public.orders (
    product_id,
    buyer_id,
    total_amount,
    escrow_status,
    tracking_number
  )
  values (
    p_product_id,
    p_buyer_id,
    listing.price,
    'pending',
    null
  )
  returning * into new_order;

  update public.products
  set status = 'sold'
  where id = p_product_id;

  return new_order;
end;
$$;

revoke all on function public.place_catalog_order(uuid, uuid) from public;
grant execute on function public.place_catalog_order(uuid, uuid) to service_role;
