import { supabase } from "../lib/supabase";
import type { ConfirmationCounts, ConfirmationStatus, Game, Player } from "../types";
import { mapRow, PLAYER_SELECT_COLUMNS, type PlayerRow } from "./playersService";

interface GameRow {
  id: string;
  date: string;
  time: string;
  location: string;
  status: Game["status"];
}

function mapGameRow(row: GameRow): Game {
  return { id: row.id, date: row.date, time: row.time, location: row.location, status: row.status };
}

/**
 * Busca o próximo jogo em aberto (data mais próxima, ainda não cancelado
 * nem finalizado). Sem Supabase configurado, retorna null — quem chama
 * decide como lidar com o modo demonstração.
 */
export async function fetchNextGame(): Promise<Game | null> {
  if (!supabase) return null;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("games")
    .select("id,date,time,location,status")
    .gte("date", today)
    .not("status", "in", "(CANCELADO,FINALIZADO)")
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar próximo jogo: ${error.message}`);
  }
  return data ? mapGameRow(data as GameRow) : null;
}

export async function fetchMyConfirmation(gameId: string, playerId: string): Promise<ConfirmationStatus | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("game_confirmations")
    .select("status")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar confirmação: ${error.message}`);
  }
  return (data?.status as ConfirmationStatus) ?? null;
}

/**
 * Confirma presença (ou muda de ideia). Usa upsert porque a tabela tem
 * unique(game_id, player_id) — a RLS da migration 0005 garante que só dá
 * pra confirmar por si mesmo (ou ser admin).
 */
export async function setConfirmation(gameId: string, playerId: string, status: ConfirmationStatus): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase não configurado — confirmação não pode ser salva em modo demonstração.");
  }

  const { error } = await supabase
    .from("game_confirmations")
    .upsert(
      { game_id: gameId, player_id: playerId, status, updated_at: new Date().toISOString() },
      { onConflict: "game_id,player_id" }
    );

  if (error) {
    throw new Error(`Falha ao confirmar presença: ${error.message}`);
  }
}

export async function fetchConfirmationCounts(gameId: string): Promise<ConfirmationCounts> {
  if (!supabase) return { vou: 0, naoVou: 0, talvez: 0 };

  const { data, error } = await supabase.from("game_confirmations").select("status").eq("game_id", gameId);
  if (error) {
    throw new Error(`Falha ao carregar confirmações: ${error.message}`);
  }

  const counts: ConfirmationCounts = { vou: 0, naoVou: 0, talvez: 0 };
  for (const row of data ?? []) {
    if (row.status === "VOU") counts.vou++;
    else if (row.status === "NÃO VOU") counts.naoVou++;
    else if (row.status === "TALVEZ") counts.talvez++;
  }
  return counts;
}

export interface ConfirmedPlayers {
  linePlayers: Player[];
  goalkeepers: Player[];
}

/**
 * Busca os jogadores que confirmaram presença (status VOU) para um jogo,
 * já separados entre linha e goleiros (Seção 15 — goleiro não ocupa vaga
 * de linha), preservando a ordem de confirmação (Seção 16, critério 3).
 */
export async function fetchConfirmedPlayers(gameId: string): Promise<ConfirmedPlayers> {
  if (!supabase) return { linePlayers: [], goalkeepers: [] };

  const { data, error } = await supabase
    .from("game_confirmations")
    .select(`confirmed_at, players(${PLAYER_SELECT_COLUMNS})`)
    .eq("game_id", gameId)
    .eq("status", "VOU")
    .order("confirmed_at", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar confirmados: ${error.message}`);
  }

  const players = ((data ?? []) as unknown as { players: PlayerRow }[])
    .filter((row) => row.players)
    .map((row) => mapRow(row.players));

  return {
    linePlayers: players.filter((p) => !p.isGoalkeeper),
    goalkeepers: players.filter((p) => p.isGoalkeeper),
  };
}

export interface NewGameInput {
  date: string;
  time: string;
  location: string;
}

/** Cria um jogo. RLS (migration 0005) garante que só admin consegue. */
export async function createGame(input: NewGameInput): Promise<Game> {
  if (!supabase) {
    throw new Error("Supabase não configurado — não é possível criar jogos em modo demonstração.");
  }

  const { data, error } = await supabase
    .from("games")
    .insert({ date: input.date, time: input.time, location: input.location, status: "ABERTO" })
    .select("id,date,time,location,status")
    .single();

  if (error) {
    throw new Error(`Falha ao criar jogo: ${error.message}`);
  }
  return mapGameRow(data as GameRow);
}
