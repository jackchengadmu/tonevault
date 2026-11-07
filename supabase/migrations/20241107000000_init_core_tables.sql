-- ToneVault core schema: users, products, orders
-- Apply with the Supabase CLI (`supabase db push`) or in the SQL editor.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('buyer', 'seller', 'admin', 'luthier');

create type public.verification_status as enum (
  'Unverified',
  'Remote Verified',
  'Fully Verified'
);

create type public.product_status as enum ('available', 'sold');

create type public.escrow_status as enum (
  'paid',
  'awaiting_shipment',
  'shipped',
  'delivered',
  'approved',
  'payout_released'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'buyer',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users (id) on delete restrict,
  brand text not null,
  model text not null,
  year integer,
  finish text,
  price numeric(12, 2) not null check (price >= 0),
  verification_status public.verification_status not null default 'Unverified',
  tonevault_score integer check (
    tonevault_score is null
    or (tonevault_score >= 1 and tonevault_score <= 100)
  ),
  condition_notes text,
  status public.product_status not null default 'available',
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  buyer_id uuid not null references public.users (id) on delete restrict,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  escrow_status public.escrow_status not null default 'paid',
  tracking_number text,
  created_at timestamptz not null default now()
);

create index products_seller_id_idx on public.products (seller_id);
create index products_status_idx on public.products (status);
create index products_verification_status_idx on public.products (verification_status);
create index orders_product_id_idx on public.orders (product_id);
create index orders_buyer_id_idx on public.orders (buyer_id);
create index orders_escrow_status_idx on public.orders (escrow_status);

-- ---------------------------------------------------------------------------
-- Auth → public.users sync
-- New accounts are always buyers. Role upgrades are admin-only.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'buyer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_listing_seller(target_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.products
    where id = target_product_id
      and seller_id = auth.uid()
  );
$$;

create or replace function public.protect_product_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  new.verification_status := old.verification_status;
  new.tonevault_score := old.tonevault_score;
  return new;
end;
$$;

create trigger products_protect_verification
  before update on public.products
  for each row
  execute function public.protect_product_verification();

create or replace function public.enforce_order_buyer_not_seller()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.products
    where id = new.product_id
      and seller_id = new.buyer_id
  ) then
    raise exception 'Buyers cannot purchase their own listings';
  end if;

  return new;
end;
$$;

create trigger orders_buyer_not_seller
  before insert or update of product_id, buyer_id on public.orders
  for each row
  execute function public.enforce_order_buyer_not_seller();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- users
create policy "Users can view their own profile"
  on public.users
  for select
  using (auth.uid() = id or public.is_admin());

create policy "Sellers are publicly readable"
  on public.users
  for select
  using (role in ('seller', 'luthier', 'admin'));

create policy "Users can insert their own profile"
  on public.users
  for insert
  with check (auth.uid() = id and role = 'buyer');

create policy "Users can update their own profile"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select u.role from public.users u where u.id = auth.uid()));

create policy "Admins can update any profile"
  on public.users
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- products
create policy "Available listings are publicly readable"
  on public.products
  for select
  using (
    status = 'available'
    or seller_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.orders o
      where o.product_id = products.id
        and o.buyer_id = auth.uid()
    )
  );

create policy "Sellers can create their own listings"
  on public.products
  for insert
  with check (
    seller_id = auth.uid()
    and verification_status = 'Unverified'
    and exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role in ('seller', 'luthier', 'admin')
    )
  );

create policy "Sellers can update their own listings"
  on public.products
  for update
  using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());

create policy "Sellers can delete their own available listings"
  on public.products
  for delete
  using (
    public.is_admin()
    or (seller_id = auth.uid() and status = 'available')
  );

-- orders
create policy "Order participants can view orders"
  on public.orders
  for select
  using (
    buyer_id = auth.uid()
    or public.is_listing_seller(product_id)
    or public.is_admin()
  );

create policy "Buyers can create their own orders"
  on public.orders
  for insert
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1
      from public.products p
      where p.id = product_id
        and p.status = 'available'
        and p.seller_id <> auth.uid()
    )
  );

create policy "Order participants can update escrow fields"
  on public.orders
  for update
  using (
    buyer_id = auth.uid()
    or public.is_listing_seller(product_id)
    or public.is_admin()
  )
  with check (
    buyer_id = auth.uid()
    or public.is_listing_seller(product_id)
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on table public.users to anon, authenticated;
grant insert, update on table public.users to authenticated;

grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

grant select, insert, update on table public.orders to authenticated;

grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.is_listing_seller(uuid) to authenticated;
