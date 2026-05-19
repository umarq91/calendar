-- Atomic: store password in Vault + insert smtp_configs row.
-- Plaintext password is only ever passed to this function and never persisted in a column.
create or replace function public.create_smtp_config(
  p_label       text,
  p_from_name   text,
  p_from_email  text,
  p_host        text,
  p_port        int,
  p_secure      boolean,
  p_username    text,
  p_password    text,
  p_reply_to    text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
  v_config_id uuid;
  v_secret_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_secret_name := 'smtp_pw_' || auth.uid()::text || '_' || gen_random_uuid()::text;

  v_secret_id := vault.create_secret(
    p_password,
    v_secret_name,
    'SMTP password for user ' || auth.uid()::text
  );

  insert into public.smtp_configs (
    user_id, label, from_name, from_email, host, port, secure,
    username, password_secret_id, reply_to, verified_at, is_default
  )
  values (
    auth.uid(), p_label, p_from_name, p_from_email, p_host, p_port, p_secure,
    p_username, v_secret_id, p_reply_to, now(),
    not exists (select 1 from public.smtp_configs where user_id = auth.uid())
  )
  returning id into v_config_id;

  return v_config_id;
end;
$$;

revoke all on function public.create_smtp_config(text, text, text, text, int, boolean, text, text, text) from public, anon;
grant execute on function public.create_smtp_config(text, text, text, text, int, boolean, text, text, text) to authenticated;

-- Helper: delete an SMTP config AND its Vault secret in one shot
create or replace function public.delete_smtp_config(p_config_id uuid)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select password_secret_id into v_secret_id
  from public.smtp_configs
  where id = p_config_id and user_id = auth.uid();

  if v_secret_id is null then
    raise exception 'Config not found or not owned by user';
  end if;

  delete from public.smtp_configs where id = p_config_id and user_id = auth.uid();
  delete from vault.secrets where id = v_secret_id;
end;
$$;

revoke all on function public.delete_smtp_config(uuid) from public, anon;
grant execute on function public.delete_smtp_config(uuid) to authenticated;
