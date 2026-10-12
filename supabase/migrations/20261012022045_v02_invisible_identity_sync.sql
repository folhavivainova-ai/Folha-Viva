-- V01-E03 / V02-E01 / contratos V14 e V19. Nunca autorizar pelo device_session_id.
alter table public.producer_profiles add column owner_subject uuid references auth.users(id);
create unique index producer_profiles_owner_subject on public.producer_profiles(owner_subject);
alter table public.producer_profiles add constraint producer_name_nonempty check (length(trim(display_name)) between 1 and 120);
alter table public.properties add constraint property_name_nonempty check (length(trim(name)) between 1 and 120);
alter table public.plots add constraint plot_valid_geometry check (public.st_isvalid(geometry) and not public.st_isempty(geometry) and area_ha > 0);
alter table public.properties add constraint property_valid_geometry check ((centroid is null or (public.st_isvalid(centroid) and not public.st_isempty(centroid))) and (boundary is null or (public.st_isvalid(boundary) and not public.st_isempty(boundary))));
alter function public.set_updated_at() set search_path = '';
alter view public.foundation_health set (security_invoker = true);
revoke all on public.foundation_health from anon, authenticated;
revoke all on public.spatial_ref_sys from anon, authenticated;

create policy producer_select on public.producer_profiles for select to authenticated using (owner_subject = (select auth.uid()));
create policy producer_insert on public.producer_profiles for insert to authenticated with check (owner_subject = (select auth.uid()));
create policy producer_update on public.producer_profiles for update to authenticated using (owner_subject = (select auth.uid())) with check (owner_subject = (select auth.uid()));
create policy property_owner on public.properties for all to authenticated
 using (producer_id in (select id from public.producer_profiles where owner_subject = (select auth.uid())))
 with check (producer_id in (select id from public.producer_profiles where owner_subject = (select auth.uid())));
create policy plot_owner on public.plots for all to authenticated
 using (property_id in (select id from public.properties)) with check (property_id in (select id from public.properties));
create policy cycle_owner on public.crop_cycles for all to authenticated
 using (plot_id in (select id from public.plots)) with check (plot_id in (select id from public.plots));
create policy event_read on public.field_events for select to authenticated using (plot_id in (select id from public.plots));
create policy event_insert on public.field_events for insert to authenticated with check (plot_id in (select id from public.plots));
revoke all on public.producer_profiles, public.properties, public.plots, public.crop_cycles, public.field_events from anon, authenticated;
grant select, insert, update on public.producer_profiles, public.properties, public.plots, public.crop_cycles to authenticated;
grant select, insert on public.field_events to authenticated;

create table public.sync_receipts (
 mutation_id uuid primary key,
 owner_subject uuid not null references auth.users(id),
 entity_id uuid not null,
 entity text not null,
 request jsonb not null,
 committed_at timestamptz not null default now()
);
create index sync_receipts_owner on public.sync_receipts(owner_subject);
alter table public.sync_receipts enable row level security;
create policy receipt_read on public.sync_receipts for select to authenticated using (owner_subject = (select auth.uid()));
create policy receipt_insert on public.sync_receipts for insert to authenticated with check (owner_subject = (select auth.uid()));
revoke all on public.sync_receipts from anon, authenticated;
grant select, insert on public.sync_receipts to authenticated;

-- SECURITY INVOKER: todas as operações abaixo respeitam as mesmas políticas RLS.
create function public.sync_mutation(mutation_id uuid, entity text, payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 subject uuid := auth.uid();
 entity_id uuid := (payload->>'id')::uuid;
 receipt public.sync_receipts;
 point_geom public.geometry;
 polygon_geom public.geometry;
begin
 if subject is null then raise exception 'Sessão necessária' using errcode='42501'; end if;
 if entity_id is null then raise exception 'Identificador necessário' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(subject::text || mutation_id::text, 0));
 select * into receipt from public.sync_receipts r where r.mutation_id = sync_mutation.mutation_id;
 if found then
   if receipt.entity <> entity or receipt.request <> payload then raise exception 'Chave de idempotência reutilizada' using errcode='22023'; end if;
   return jsonb_build_object('mutation_id',receipt.mutation_id,'entity_id',receipt.entity_id,'committed_at',receipt.committed_at);
 end if;
 if payload->'centroid' is not null and payload->'centroid' <> 'null'::jsonb then
   point_geom := public.st_setsrid(public.st_geomfromgeojson((payload->'centroid')::text),4326);
 end if;
 case entity
 when 'producer_profile' then
   insert into public.producer_profiles(id,owner_subject,device_session_id,display_name,created_at)
   values(entity_id,subject,payload->>'device_session_id',payload->>'display_name',(payload->>'created_at')::timestamptz)
   on conflict(id) do update set display_name=excluded.display_name;
 when 'property' then
   insert into public.properties(id,producer_id,name,activity_profile,centroid,created_at)
   values(entity_id,(payload->>'producer_id')::uuid,payload->>'name',payload->>'activity_profile',point_geom,(payload->>'created_at')::timestamptz)
   on conflict(id) do update set name=excluded.name,activity_profile=excluded.activity_profile,centroid=excluded.centroid;
 when 'plot' then
   polygon_geom := public.st_setsrid(public.st_geomfromgeojson((payload->'geometry')::text),4326);
   if public.st_geometrytype(polygon_geom) <> 'ST_Polygon' or not public.st_isvalid(polygon_geom) then raise exception 'Contorno inválido' using errcode='22023'; end if;
   insert into public.plots(id,property_id,name,geometry,area_ha,active,created_at)
   values(entity_id,(payload->>'property_id')::uuid,payload->>'name',polygon_geom,public.st_area(polygon_geom::public.geography)/10000,(payload->>'active')::boolean,(payload->>'created_at')::timestamptz)
   on conflict(id) do update set name=excluded.name,geometry=excluded.geometry,area_ha=excluded.area_ha,active=excluded.active;
 when 'crop_cycle' then
   insert into public.crop_cycles(id,plot_id,crop_type,subtype,cultivar,start_date,end_date,metadata)
   values(entity_id,(payload->>'plot_id')::uuid,payload->>'crop_type',payload->>'subtype',payload->>'cultivar',(payload->>'start_date')::date,(payload->>'end_date')::date,coalesce(payload->'metadata','{}'))
   on conflict(id) do update set crop_type=excluded.crop_type,subtype=excluded.subtype,cultivar=excluded.cultivar,end_date=excluded.end_date,metadata=excluded.metadata;
 when 'field_event' then
   insert into public.field_events(id,plot_id,client_generated_id,type,occurred_at,geometry,payload,created_at)
   values(entity_id,(payload->>'plot_id')::uuid,payload->>'client_generated_id',payload->>'type',(payload->>'occurred_at')::timestamptz,
     case when payload->'geometry' is not null and payload->'geometry' <> 'null'::jsonb then public.st_setsrid(public.st_geomfromgeojson((payload->'geometry')::text),4326) end,
     coalesce(payload->'payload','{}'),(payload->>'created_at')::timestamptz);
 else raise exception 'Entidade não suportada' using errcode='22023';
 end case;
 insert into public.sync_receipts(mutation_id,owner_subject,entity_id,entity,request)
 values(mutation_id,subject,entity_id,entity,payload) returning * into receipt;
 return jsonb_build_object('mutation_id',receipt.mutation_id,'entity_id',receipt.entity_id,'committed_at',receipt.committed_at);
end $$;
revoke all on function public.sync_mutation(uuid,text,jsonb) from public, anon;
grant execute on function public.sync_mutation(uuid,text,jsonb) to authenticated;
