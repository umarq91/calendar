-- Server-only RPC: return an SMTP config row + its decrypted Vault password.
-- Owner-only. Caller must be authenticated AND own the row.
-- This is the *only* path that ever returns plaintext SMTP creds back to the
-- application server. Never expose to the client.

create or replace function public.get_smtp_with_password(p_config_id uuid)
returns table (
  id uuid,
  label text,
  from_name text,
  from_email text,
  host text,
  port int,
  secure boolean,
  username text,
  password text,
  reply_to text,
  is_default boolean
)
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    c.id,
    c.label,
    c.from_name,
    c.from_email,
    c.host,
    c.port,
    c.secure,
    c.username,
    s.decrypted_secret::text as password,
    c.reply_to,
    c.is_default
  from public.smtp_configs c
  join vault.decrypted_secrets s on s.id = c.password_secret_id
  where c.id = p_config_id
    and c.user_id = auth.uid();
end;
$$;

revoke all on function public.get_smtp_with_password(uuid) from public, anon;
grant execute on function public.get_smtp_with_password(uuid) to authenticated;
