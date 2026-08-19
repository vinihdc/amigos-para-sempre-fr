-- Migration 0005: confirmação de presença real + correção de segurança
--
-- PROBLEMA ENCONTRADO no schema original:
-- A policy "own confirmation insert" tinha `with check (true)` — ou seja,
-- QUALQUER jogador autenticado podia inserir uma confirmação em nome de
-- QUALQUER outro jogador. Isso viola diretamente a Seção 12
-- ("Jogadores não podem alterar: confirmação de terceiros").
--
-- Também faltava:
-- - policy de UPDATE em game_confirmations (jogador não conseguia mudar
--   de ideia depois de confirmar);
-- - policies de escrita em `games` (só admin pode criar/fechar jogos,
--   Seção 27).
--
-- IMPACTO: nenhuma coluna nova, nenhum dado existente é apagado.

drop policy if exists "own confirmation insert" on game_confirmations;
create policy "own confirmation insert" on game_confirmations
  for insert to authenticated
  with check (
    is_current_user_admin()
    or player_id = (select id from players where auth_user_id = auth.uid())
  );

drop policy if exists "own confirmation update" on game_confirmations;
create policy "own confirmation update" on game_confirmations
  for update to authenticated
  using (
    is_current_user_admin()
    or player_id = (select id from players where auth_user_id = auth.uid())
  )
  with check (
    is_current_user_admin()
    or player_id = (select id from players where auth_user_id = auth.uid())
  );

drop policy if exists "games admin write" on games;
create policy "games admin write" on games
  for insert to authenticated
  with check (is_current_user_admin());

drop policy if exists "games admin update" on games;
create policy "games admin update" on games
  for update to authenticated
  using (is_current_user_admin())
  with check (is_current_user_admin());
