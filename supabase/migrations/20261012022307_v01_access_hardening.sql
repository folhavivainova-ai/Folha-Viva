-- Grants herdados de PUBLIC também alcançam anon/authenticated.
revoke all on public.spatial_ref_sys from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text,text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text,text,text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text,text,text,boolean) from public, anon, authenticated;
