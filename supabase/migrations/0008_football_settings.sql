-- Migration 0008: parâmetros de negócio editáveis pelo Admin
--
-- Objetivo: retirar números de regra do código (hardcode) e persistir
-- configurações no Supabase. O código continua contendo a lógica; esta
-- tabela guarda apenas valores que o administrador pode mudar sem deploy.

create table if not exists football_settings (
  id text primary key default 'default' check (id = 'default'),

  -- Duração total da sessão e de cada partida.
  session_duration_minutes int not null default 120 check (session_duration_minutes between 30 and 360),
  match_duration_minutes int not null default 10 check (match_duration_minutes between 1 and 60),

  -- Formação dos times.
  -- field_players_per_team representa o mínimo de jogadores de linha por time.
  -- A distribuição pode continuar flexível, por exemplo 26 jogadores em 4
  -- times = 7/7/6/6 quando o mínimo configurado é 6.
  field_players_per_team int not null default 6 check (field_players_per_team between 4 and 11),
  goalkeeper_count int not null default 4 check (goalkeeper_count between 0 and 10),
  minimum_players_for_game int not null default 15 check (minimum_players_for_game >= 1),
  minimum_players_for_3_teams int not null default 18 check (minimum_players_for_3_teams >= 1),
  minimum_players_for_4_teams int not null default 24 check (minimum_players_for_4_teams >= 1),

  -- Regra central: mensalistas possuem prioridade sobre avulsos.
  subscriber_priority_enabled boolean not null default true,

  -- Avaliações / Robust Rating.
  minimum_votes_for_highlight int not null default 3 check (minimum_votes_for_highlight >= 1),
  minimum_votes_for_trimming int not null default 7 check (minimum_votes_for_trimming >= 3),
  lower_percentile int not null default 5 check (lower_percentile between 0 and 49),
  upper_percentile int not null default 95 check (upper_percentile between 51 and 100),

  updated_at timestamptz not null default now(),
  updated_by uuid references players(id) on delete set null,

  check (minimum_players_for_3_teams >= minimum_players_for_game),
  check (minimum_players_for_4_teams >= minimum_players_for_3_teams),

  -- Evita uma configuração impossível, como 7 jogadores por time e corte de
  -- apenas 18 jogadores para formar 3 times (seriam necessários pelo menos 21).
  check (minimum_players_for_3_teams >= field_players_per_team * 3),
  check (minimum_players_for_4_teams >= field_players_per_team * 4),

  check (lower_percentile < upper_percentile)
);

insert into football_settings (id)
values ('default')
on conflict (id) do nothing;

alter table football_settings enable row level security;

create policy "football settings readable"
on football_settings
for select
to authenticated
using (true);

create policy "football settings admin update"
on football_settings
for update
to authenticated
using (is_current_user_admin())
with check (is_current_user_admin());
