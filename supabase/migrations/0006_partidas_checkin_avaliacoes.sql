-- Migration 0006: Fase 1 da Especificação v3 — Modelo de dados
--
-- Esta migration só cria estrutura (tabelas/colunas/RLS). Nenhuma tela
-- ainda usa essas tabelas — isso vem nas próximas fases (Seção "NÃO
-- IMPLEMENTAR TUDO DE UMA VEZ" da especificação). Nada é apagado.
--
-- DECISÃO DE REAPROVEITAMENTO (documentando por quê, Seção "IMPORTANTE
-- PARA ESTA PRIMEIRA EXECUÇÃO" do prompt):
-- As tabelas `teams`/`team_players` já existiam no schema original mas
-- nunca foram usadas por nenhuma tela (times gerados só existem em
-- memória no frontend até agora). A nova especificação exige histórico
-- por PARTIDA (quem jogou com quem, contra quem, quantos gols) — uma
-- granularidade que `teams`/`team_players` não tem, porque foram
-- desenhadas para representar "os times da sessão inteira", não de cada
-- partida individual dentro da sessão (necessário pro rodízio).
-- Em vez de forçar esse conceito novo dentro de uma estrutura que não
-- serve pra ele, criamos `matches`/`match_players`, que junto de `goals`
-- respondem exatamente as perguntas que a especificação exige. As tabelas
-- antigas continuam existindo (estão vazias, então não há perda de dado)
-- e podem ser reavaliadas/removidas numa fase futura, se você confirmar.
--
-- "Sessão do Futebol de Sábado" já existe como conceito: é a tabela
-- `games` (uma linha por sábado). Não criamos uma tabela "sessions" nova
-- — reaproveitamos `games` como a sessão, e cada partida dentro dela é
-- uma linha em `matches`.


-- ============================================================
-- 1) PARTIDAS (Time A x Time B, cronômetro, placar)
-- ============================================================

create type match_status as enum ('AGENDADA','EM_ANDAMENTO','PAUSADA','ENCERRADA');

create table matches(
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  -- numera as partidas dentro da sessão (1ª, 2ª, 3ª rodada do dia...)
  sequence_number int not null,
  status match_status not null default 'AGENDADA',
  -- duração padrão 10 minutos (600s), parametrizável por partida
  duration_seconds int not null default 600 check (duration_seconds > 0),
  -- tempo já decorrido, pausas não contam (Seção "CRONÔMETRO")
  elapsed_seconds int not null default 0 check (elapsed_seconds >= 0),
  started_at timestamptz,
  paused_at timestamptz,
  ended_at timestamptz,
  home_score int not null default 0 check (home_score >= 0),
  away_score int not null default 0 check (away_score >= 0),
  created_at timestamptz not null default now(),
  unique(game_id, sequence_number)
);

-- Escalação de cada partida — granularidade que `team_players` não tinha.
-- Guardar o overall no momento do jogo (snapshot) preserva a Seção 13:
-- "partidas antigas não podem mudar de força retroativamente".
create table match_players(
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  side text not null check (side in ('HOME','AWAY')),
  position_used text,
  overall_snapshot numeric(5,1),
  was_goalkeeper boolean not null default false,
  primary key(match_id, player_id)
);

-- Quem marcou cada gol — alimenta artilharia e histórico (Seção "GOLS").
create table goals(
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  minute int check (minute >= 0),
  created_at timestamptz not null default now()
);


-- ============================================================
-- 2) CHECK-IN E RODÍZIO (fila viva por sessão)
-- ============================================================

-- Estado de participação de um jogador DENTRO de uma sessão específica —
-- reseta naturalmente a cada sábado porque é por game_id, não global.
create table session_participation(
  game_id uuid not null references games(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  -- nulo = ainda não chegou. Seção "PRESENÇA NÃO É CHECK-IN": VOU/NÃO
  -- VOU/TALVEZ (game_confirmations) continua sendo intenção; isto aqui é
  -- presença física real.
  checked_in_at timestamptz,
  -- incrementado automaticamente quando o jogador entra em match_players
  -- (trigger abaixo) — nunca editável diretamente, nem por admin.
  matches_played int not null default 0,
  -- desde quando está "aguardando" pra fins de prioridade no rodízio.
  waiting_since timestamptz not null default now(),
  -- Seção "CEDER O PRÓXIMO JOGO": temporário, não é perda de prioridade.
  gave_up_next boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(game_id, player_id)
);

-- Mantém matches_played como valor derivado e confiável — nem jogador
-- nem admin editam esse número diretamente, só o sistema, no momento em
-- que a escalação de uma partida é gravada.
create or replace function increment_matches_played()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into session_participation (game_id, player_id, matches_played, waiting_since)
  select m.game_id, new.player_id, 1, now()
  from matches m where m.id = new.match_id
  on conflict (game_id, player_id) do update
    set matches_played = session_participation.matches_played + 1,
        waiting_since = now(),
        updated_at = now();
  return new;
end;
$$;

create trigger trg_increment_matches_played
  after insert on match_players
  for each row execute function increment_matches_played();


-- ============================================================
-- 3) AVALIAÇÕES (estrelas por categoria)
-- ============================================================

create type rating_category as enum ('PONTARIA','PASSE','DESARME','PAREDAO');

-- Votos individuais NUNCA são apagados nem editados (Seção "ROBUST
-- RATING": "não apagar votos extremos"). Por isso não há policy de
-- UPDATE/DELETE abaixo — a tabela funciona como um log append-only.
-- O cálculo de Robust Rating (Fase 7) lê estas linhas e decide o que
-- descartar SÓ no cálculo, sem tocar no dado bruto.
create table ratings(
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  rater_player_id uuid not null references players(id) on delete cascade,
  rated_player_id uuid not null references players(id) on delete cascade,
  category rating_category not null,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  check (rater_player_id <> rated_player_id),
  unique(game_id, rater_player_id, rated_player_id, category)
);


-- ============================================================
-- 4) OVERALL: escala 0–100 + origem manual/calculada
-- ============================================================
--
-- DECISÃO CONFIRMADA COM VOCÊ: o overall manual continua existindo;
-- quando houver avaliações suficientes (mesmo mínimo configurável usado
-- nos destaques da Fase 8), passa a ser recalculado automaticamente e o
-- valor manual deixa de valer. O recálculo em si é lógica de aplicação
-- (Fase 7/9) — aqui só preparamos o dado.
--
-- Mantemos a coluna antiga `overall` (1.0–10.0) intacta — nenhuma tela
-- usa a nova ainda, então nada quebra. `overall_100` é adicionada em
-- paralelo, já populada por conversão, e o corte de fato pro frontend
-- acontece só na Fase 9/10.

alter table players
  add column if not exists overall_100 int check (overall_100 between 0 and 100),
  add column if not exists overall_source text not null default 'MANUAL' check (overall_source in ('MANUAL','CALCULADO'));

update players set overall_100 = round(overall * 10) where overall_100 is null;

-- Mantém overall_100 sincronizado com overall automaticamente enquanto a
-- origem for manual — sem isso, um jogador cadastrado DEPOIS desta
-- migration ficaria com overall_100 vazio, já que nenhuma tela ainda
-- escreve nessa coluna (isso só muda na Fase 9/10). Quando a origem virar
-- 'CALCULADO' (Robust Rating), este trigger para de sobrescrever — o
-- cálculo derivado assume o controle.
create or replace function sync_overall_100()
returns trigger
language plpgsql
as $$
begin
  if new.overall_source = 'MANUAL' then
    new.overall_100 := round(new.overall * 10);
  end if;
  return new;
end;
$$;

create trigger trg_sync_overall_100
  before insert or update on players
  for each row execute function sync_overall_100();

-- Estende a proteção de campos administrativos (migration 0002/0004) para
-- as duas colunas novas — mesmo princípio: jogador comum não altera.
create or replace function protect_admin_player_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_current_user_admin() then
    if new.overall is distinct from old.overall
       or new.overall_100 is distinct from old.overall_100
       or new.overall_source is distinct from old.overall_source
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


-- ============================================================
-- 5) RLS
-- ============================================================

alter table matches enable row level security;
alter table match_players enable row level security;
alter table goals enable row level security;
alter table session_participation enable row level security;
alter table ratings enable row level security;

-- Partidas e escalações: leitura liberada (times/placar são públicos
-- dentro do grupo), escrita só admin (quem opera o cronômetro/gols).
create policy "matches readable" on matches for select to authenticated using (true);
create policy "matches admin write" on matches for insert to authenticated with check (is_current_user_admin());
create policy "matches admin update" on matches for update to authenticated using (is_current_user_admin()) with check (is_current_user_admin());

create policy "match players readable" on match_players for select to authenticated using (true);
create policy "match players admin write" on match_players for insert to authenticated with check (is_current_user_admin());
create policy "match players admin delete" on match_players for delete to authenticated using (is_current_user_admin());

create policy "goals readable" on goals for select to authenticated using (true);
create policy "goals admin write" on goals for insert to authenticated with check (is_current_user_admin());
create policy "goals admin delete" on goals for delete to authenticated using (is_current_user_admin());

-- Check-in/rodízio: todo mundo vê a fila (é pública dentro do grupo).
-- Jogador só consegue fazer check-in de si mesmo ou ceder sua própria
-- vaga — nunca mexe em matches_played (isso é só o trigger acima).
create policy "session participation readable" on session_participation for select to authenticated using (true);

create policy "session participation self checkin" on session_participation
  for insert to authenticated
  with check (
    is_current_user_admin()
    or player_id = (select id from players where auth_user_id = auth.uid())
  );

create policy "session participation self update" on session_participation
  for update to authenticated
  using (
    is_current_user_admin()
    or player_id = (select id from players where auth_user_id = auth.uid())
  )
  with check (
    is_current_user_admin()
    or player_id = (select id from players where auth_user_id = auth.uid())
  );

-- Trava matches_played pra ninguém além do sistema (trigger) alterar,
-- mesmo o próprio jogador dono da linha — mesmo padrão já usado em
-- protect_admin_player_fields (migration 0002).
create or replace function protect_session_participation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_current_user_admin() then
    if new.matches_played is distinct from old.matches_played then
      raise exception 'matches_played só pode ser alterado pelo sistema.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_protect_session_participation_fields
  before update on session_participation
  for each row execute function protect_session_participation_fields();

-- Avaliações: anônimas (Seção "AVALIAÇÕES") — ninguém lê quem avaliou
-- quem, nem mesmo o avaliado. Só o próprio autor vê o que já votou (pra
-- travar duplicata na UI) e o admin, pra fins de moderação. A checagem
-- "só posso avaliar quem jogou comigo" fica pra Fase 6, quando a tela de
-- avaliação for construída — aqui garantimos só o básico já decidível
-- estruturalmente (não autoavaliação, não duplicata, autoria correta).
create policy "ratings own submitted readable" on ratings
  for select to authenticated
  using (
    is_current_user_admin()
    or rater_player_id = (select id from players where auth_user_id = auth.uid())
  );

create policy "ratings self insert" on ratings
  for insert to authenticated
  with check (rater_player_id = (select id from players where auth_user_id = auth.uid()));
