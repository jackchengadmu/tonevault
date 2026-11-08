-- Disposable database only; fixtures and state changes are rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','seller@example.test','{}'),
 ('a2222222-2222-4222-8222-222222222222','buyer@example.test','{}');
insert into public.products(id,seller_id,brand,model,price,stock) values
 ('b1111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111','Test','Inspection',485000,1),
 ('b2222222-2222-4222-8222-222222222222','a1111111-1111-4111-8111-111111111111','Test','Rounding',1.07,1);
set local role service_role;
do $$
declare saved public.orders%rowtype; pricing public.order_pricing%rowtype;
begin
 saved := public.place_checkout_order('b1111111-1111-4111-8111-111111111111','a2222222-2222-4222-8222-222222222222',1,'Test Buyer','test@example.com','09123456789','123 Test Street','simulated_card',true);
 select * into pricing from public.order_pricing where order_id=saved.id;
 assert saved.total_amount=493500;
 assert pricing.merchandise_amount=485000 and pricing.inspection_fee=8500 and pricing.inspection_status='pending';
 assert pricing.commission_amount=38800 and pricing.seller_proceeds=446200;
 assert pricing.buyer_total=saved.total_amount;
 assert exists(select 1 from public.order_revenue where order_id=saved.id and commission_revenue=0 and inspection_revenue=0);
 update public.orders set escrow_status='approved' where id=saved.id;
 assert exists(select 1 from public.order_revenue where order_id=saved.id and commission_revenue=38800 and inspection_revenue=0);
 update public.order_pricing set inspection_status='completed' where order_id=saved.id;
 assert exists(select 1 from public.order_revenue where order_id=saved.id and inspection_revenue=8500);
 saved := public.place_catalog_order('b2222222-2222-4222-8222-222222222222','a2222222-2222-4222-8222-222222222222',1);
 select * into pricing from public.order_pricing where order_id=saved.id;
 assert saved.total_amount=1.07 and pricing.inspection_fee=0 and pricing.inspection_status='not_requested';
 assert pricing.commission_amount=0.09 and pricing.seller_proceeds=0.98;
end; $$;
reset role;
do $$ begin
 assert not has_table_privilege('anon','public.order_pricing','select');
 assert not has_table_privilege('authenticated','public.order_pricing','update');
 assert not has_table_privilege('anon','public.order_revenue','select');
end; $$;
rollback;
