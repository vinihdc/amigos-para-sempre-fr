-- Migration 0002: vincula jogadores a auth.users e protege campos administrativos
--
-- MOTIVO:
-- A Seção 11 exige login por telefone + PIN. O Supabase Auth nativo trabalha
-- com email/senha; usamos e-mail sintético (telefone@amigosparasempre.internal)
-- e o próprio PIN como senha, deixando o GoTrue (Supabase Auth) fazer o hashing
-- com segurança — evitando reinventar hashing de PIN no frontend/backend
-- (Seção 39: preferir soluções simples e nativas).
--
-- Isso exige:
-- 1) uma coluna em `players` apontando para `auth.users`;
-- 2) uma flag `is_admin` para diferenciar administrador de jogador (Seção 27);
-- 3) políticas de RLS que impeçam um jogador de alterar seus próprios campos
--    administrativos (overall, tipo, posições, etc — Seção 12).
--
-- IMPACTO EM DADOS EXISTENTES: nenhuma coluna é removida; `auth_user_id` fica
-- nulo até cada jogador ter uma conta criada (Fase de implementação de auth).

alter table players
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null,
  add column if not exists is_admin boolean not null default false;

-- Função auxiliar: o usuário autenticado é administrador?
create or replace function is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from players where auth_user_id = auth.uid()),
    false
  );
$$;

-- Jogador pode ver/editar apenas seu próprio registro (campos não administrativos
-- são liberados aqui; a checagem por coluna acontece no trigger abaixo).
-- Administradores podem editar qualquer jogador.
drop policy if exists "player self update" on players;
create policy "player self update" on players
  for update to authenticated
  using (auth_user_id = auth.uid() or is_current_user_admin())
  with check (auth_user_id = auth.uid() or is_current_user_admin());

-- Trigger: bloqueia jogador comum de alterar campos administrativos
-- (overall, type, is_goalkeeper, is_admin, active) — Seção 12.
create or replace function protect_admin_player_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_current_user_admin() then
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

drop trigger if exists trg_protect_admin_player_fields on players;
create trigger trg_protect_admin_player_fields
  before update on players
  for each row execute function protect_admin_player_fields();

-- Posições e mensalidades também são administrativas: somente admin altera.
alter table player_positions enable row level security;
alter table monthly_payments enable row level security;
alter table player_overall_history enable row level security;

drop policy if exists "positions readable" on player_positions;
create policy "positions readable" on player_positions
  for select to authenticated using (true);

drop policy if exists "positions admin write" on player_positions;
create policy "positions admin write" on player_positions
  for all to authenticated
  using (is_current_user_admin())
  with check (is_current_user_admin());

drop policy if exists "payments own or admin readable" on monthly_payments;
create policy "payments own or admin readable" on monthly_payments
  for select to authenticated
  using (
    is_current_user_admin()
    or player_id = (select id from players where auth_user_id = auth.uid())
  );

drop policy if exists "payments admin write" on monthly_payments;
create policy "payments admin write" on monthly_payments
  for insert to authenticated with check (is_current_user_admin());

drop policy if exists "payments admin update" on monthly_payments;
create policy "payments admin update" on monthly_payments
  for update to authenticated
  using (is_current_user_admin())
  with check (is_current_user_admin());

drop policy if exists "overall history readable" on player_overall_history;
create policy "overall history readable" on player_overall_history
  for select to authenticated using (true);

drop policy if exists "overall history admin write" on player_overall_history;
create policy "overall history admin write" on player_overall_history
  for insert to authenticated with check (is_current_user_admin());
