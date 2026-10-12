alter table public.properties add constraint centroid_bounds check (centroid is null or (public.st_x(centroid) between -180 and 180 and public.st_y(centroid) between -90 and 90));
alter table public.plots add constraint polygon_bounds check (public.st_xmin(geometry::public.box3d) >= -180 and public.st_xmax(geometry::public.box3d) <= 180 and public.st_ymin(geometry::public.box3d) >= -90 and public.st_ymax(geometry::public.box3d) <= 90);
alter table public.field_events add constraint event_point_valid check (geometry is null or (public.st_isvalid(geometry) and not public.st_isempty(geometry) and public.st_x(geometry) between -180 and 180 and public.st_y(geometry) between -90 and 90));
alter table public.plots add constraint plot_name_nonempty check (length(trim(name)) between 1 and 120);
