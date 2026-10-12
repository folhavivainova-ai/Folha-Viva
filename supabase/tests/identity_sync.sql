-- Provas sem dados persistidos. Execute integralmente: a transação sempre termina em rollback.
begin;
insert into auth.users(id,is_anonymous) values ('00000000-0000-4000-8000-000000000001',true),('00000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select public.sync_mutation('00000000-0000-4000-8000-000000000011','producer_profile','{"id":"00000000-0000-4000-8000-000000000021","device_session_id":"test-device-a","display_name":"Teste transacional","created_at":"2026-10-11T00:00:00Z"}');
select public.sync_mutation('00000000-0000-4000-8000-000000000011','producer_profile','{"id":"00000000-0000-4000-8000-000000000021","device_session_id":"test-device-a","display_name":"Teste transacional","created_at":"2026-10-11T00:00:00Z"}');
select public.sync_mutation('00000000-0000-4000-8000-000000000012','property','{"id":"00000000-0000-4000-8000-000000000022","producer_id":"00000000-0000-4000-8000-000000000021","name":"Teste","activity_profile":"coffee","centroid":{"type":"Point","coordinates":[-56,-15]},"created_at":"2026-10-11T00:00:00Z"}');
select public.sync_mutation('00000000-0000-4000-8000-000000000013','plot','{"id":"00000000-0000-4000-8000-000000000023","property_id":"00000000-0000-4000-8000-000000000022","name":"Teste","geometry":{"type":"Polygon","coordinates":[[[-56,-15],[-56.001,-15],[-56.001,-15.001],[-56,-15]]]},"active":true,"created_at":"2026-10-11T00:00:00Z"}');
select public.sync_mutation('00000000-0000-4000-8000-000000000015','crop_cycle','{"id":"00000000-0000-4000-8000-000000000025","plot_id":"00000000-0000-4000-8000-000000000023","crop_type":"coffee","start_date":"2026-10-11"}');
select public.sync_mutation('00000000-0000-4000-8000-000000000016','field_event','{"id":"00000000-0000-4000-8000-000000000026","plot_id":"00000000-0000-4000-8000-000000000023","client_generated_id":"test-event","type":"inspection","occurred_at":"2026-10-11T00:00:00Z","created_at":"2026-10-11T00:00:00Z","payload":{"notes":"Teste revertido"}}');
do $$ begin
 if (select count(*) from public.producer_profiles) <> 1 or (select count(*) from public.sync_receipts) <> 5 then raise exception 'Duplicação na repetição'; end if;
 if (select public.st_srid(geometry) from public.plots) <> 4326 then raise exception 'SRID incorreto'; end if;
 begin
   perform public.sync_mutation('00000000-0000-4000-8000-000000000011','producer_profile','{"id":"00000000-0000-4000-8000-000000000021","display_name":"Alterado"}');
   raise exception 'Reuso aceito';
 exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$ begin
 if exists(select 1 from public.producer_profiles) or exists(select 1 from public.properties) or exists(select 1 from public.plots) or exists(select 1 from public.crop_cycles) or exists(select 1 from public.field_events) or exists(select 1 from public.sync_receipts) then raise exception 'Vazamento entre identidades'; end if;
 begin
   perform public.sync_mutation('00000000-0000-4000-8000-000000000014','property','{"id":"00000000-0000-4000-8000-000000000024","producer_id":"00000000-0000-4000-8000-000000000021","name":"Intruso","activity_profile":"coffee","created_at":"2026-10-11T00:00:00Z"}');
   raise exception 'Gravação cruzada aceita';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
