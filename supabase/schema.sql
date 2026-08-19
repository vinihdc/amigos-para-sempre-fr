create extension if not exists pgcrypto;
create type player_type as enum ('MENSALISTA','AVULSO');
create type confirmation_status as enum ('VOU','NÃO VOU','TALVEZ');
create type game_status as enum ('ABERTO','FECHADO','TIMES_MONTADOS','FINALIZADO','CANCELADO');

create table players(
 id uuid primary key default gen_random_uuid(), name text not null, nickname text, photo_url text,
 phone text unique not null, pin_hash text, type player_type not null default 'AVULSO',
 overall numeric(3,1) not null default 7.0 check(overall between 1 and 10),
 is_goalkeeper boolean not null default false, active boolean not null default true,
 observations text, created_at timestamptz not null default now()
);
create table player_positions(player_id uuid references players(id) on delete cascade, position text not null, primary key(player_id,position));
create table player_overall_history(id uuid primary key default gen_random_uuid(),player_id uuid references players(id) on delete cascade,overall numeric(3,1) not null,notes text,created_at timestamptz not null default now());
create table games(id uuid primary key default gen_random_uuid(),date date not null,time time not null,location text not null,status game_status not null default 'ABERTO',created_at timestamptz not null default now(),closed_at timestamptz);
create table game_confirmations(id uuid primary key default gen_random_uuid(),game_id uuid references games(id) on delete cascade,player_id uuid references players(id) on delete cascade,status confirmation_status not null,confirmed_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(game_id,player_id));
create table monthly_payments(id uuid primary key default gen_random_uuid(),player_id uuid references players(id) on delete cascade,month int not null,year int not null,status text not null default 'Pendente',amount numeric(10,2),paid_at timestamptz,unique(player_id,month,year));
create table teams(id uuid primary key default gen_random_uuid(),game_id uuid references games(id) on delete cascade,name text not null,sort_order int not null,confirmed boolean not null default false);
create table team_players(team_id uuid references teams(id) on delete cascade,player_id uuid references players(id) on delete cascade,position_used text,overall_snapshot numeric(3,1) not null,was_goalkeeper boolean not null default false,primary key(team_id,player_id));
create table game_results(id uuid primary key default gen_random_uuid(),game_id uuid references games(id) on delete cascade,team_id uuid references teams(id) on delete cascade,score int,observations text);
create table notifications(id uuid primary key default gen_random_uuid(),player_id uuid references players(id) on delete cascade,title text not null,message text not null,read_at timestamptz,created_at timestamptz not null default now());
create table settings(key text primary key,value jsonb not null);

alter table players enable row level security;
alter table games enable row level security;
alter table game_confirmations enable row level security;
alter table teams enable row level security;
alter table team_players enable row level security;

create policy "players readable" on players for select to authenticated using (true);
create policy "games readable" on games for select to authenticated using (true);
create policy "own confirmation insert" on game_confirmations for insert to authenticated with check (true);
create policy "confirmation readable" on game_confirmations for select to authenticated using (true);
create policy "published teams readable" on teams for select to authenticated using (confirmed=true);
create policy "published team players readable" on team_players for select to authenticated using (exists(select 1 from teams t where t.id=team_id and t.confirmed=true));

insert into settings(key,value) values
('minimum_players','15'),('minimum_players_per_team','6'),('default_team_count','4'),
('low_player_team_count','3'),('ideal_players_per_team','7'),('monthly_fee','0')
on conflict(key) do nothing;