revoke execute on function public.inserer_rapport(text, text, text, text, text, jsonb, text)
  from public, authenticated;
grant execute on function public.inserer_rapport(text, text, text, text, text, jsonb, text)
  to anon;

notify pgrst, 'reload schema';
