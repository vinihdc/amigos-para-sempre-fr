-- Migration 0003: permite autocadastro de jogador (telefone + PIN)
--
-- MOTIVO:
-- A criação de conta via Edge Function (create-player-account) exige um
-- administrador já autenticado para chamá-la — o que é um problema de
-- "ovo e galinha" no primeiro uso do sistema (ainda não existe admin).
--
-- Esta policy permite que qualquer pessoa autenticada crie SEU PRÓPRIO
-- registro em `players`, mas trava via RLS os campos administrativos
-- (Seção 12): ela só consegue inserir com is_admin=false, type='AVULSO',
-- is_goalkeeper=false, overall fixo em 5.0. Só um admin pode alterar isso
-- depois (a trigger da migration 0002 já protege o UPDATE; aqui protegemos
-- o INSERT).
--
-- IMPACTO: nenhuma coluna nova, nenhum dado existente é afetado.

drop policy if exists "player self signup" on players;
create policy "player self signup" on players
  for insert to authenticated
  with check (
    auth_user_id = auth.uid()
    and is_admin = false
    and type = 'AVULSO'
    and is_goalkeeper = false
    and active = true
    and overall = 5.0
  );
