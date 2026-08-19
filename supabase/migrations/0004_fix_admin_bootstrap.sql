-- Migration 0004: corrige o trigger de proteção para não travar o bootstrap
--
-- MOTIVO:
-- O trigger `protect_admin_player_fields` (migration 0002) bloqueava
-- qualquer alteração de campos administrativos quando não havia um
-- administrador autenticado — mas isso incluía o próprio SQL Editor do
-- Supabase (auth.uid() é nulo ali, pois não é uma sessão de usuário do
-- app). Resultado: nem o dono do projeto conseguia promover o primeiro
-- admin.
--
-- CORREÇÃO: só bloquear quando existir uma sessão de usuário autenticado
-- (auth.uid() não nulo) que não seja admin. Uma conexão sem sessão de
-- usuário (SQL Editor, service role, migrations) já é, por definição, um
-- contexto confiável — é o mesmo princípio que o Supabase usa para RLS
-- (service role sempre contorna RLS).

create or replace function protect_admin_player_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_current_user_admin() then
    if new.overall is distinct from old.overall
       or new.type is distinct from old.type
       or new.is_goalkeeper is distinct from old.is_goalkeeper
       or new.is_admin is distinct from old.is_admin
       or new.active is distinct from old.active then
      raise exception 'Somente administradores podem alterar esses campos.';
    end if;
  end if;
  return new;
end;
$$;
