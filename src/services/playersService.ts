import { supabase } from "../lib/supabase";
import type { Player, Position } from "../types";
import { getMockPlayers } from "./players.mock";

export interface PlayerRow {
  id: string;
  name: string;
  nickname: string | null;
  overall: string | number;
  type: Player["type"];
  is_goalkeeper: boolean;
  active: boolean;
  phone: string;
  player_positions: { position: Position }[] | null;
}

export function mapRow(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname ?? undefined,
    overall: Number(row.overall),
    type: row.type,
    isGoalkeeper: row.is_goalkeeper,
    active: row.active,
    phone: row.phone,
    positions: (row.player_positions ?? []).map((p) => p.position),
  };
}

export const PLAYER_SELECT_COLUMNS = "id,name,nickname,overall,type,is_goalkeeper,active,phone,player_positions(position)";
const SELECT_COLUMNS = PLAYER_SELECT_COLUMNS;

/**
 * Busca jogadores ativos.
 *
 * Se o Supabase não estiver configurado (env vars ausentes), retorna
 * dados mockados — deixando isso explícito no console, para nunca
 * confundir dado real com dado de demonstração (Seção 8 e 36).
 */
export async function fetchActivePlayers(): Promise<Player[]> {
  if (!supabase) {
    console.warn(
      "[playersService] Supabase não configurado — usando jogadores MOCK. " +
        "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para dados reais."
    );
    return getMockPlayers();
  }

  const { data, error } = await supabase
    .from("players")
    .select(SELECT_COLUMNS)
    .eq("active", true)
    .order("name");

  if (error) {
    throw new Error(`Falha ao carregar jogadores: ${error.message}`);
  }

  return (data as unknown as PlayerRow[]).map(mapRow);
}

/**
 * Busca todos os jogadores (ativos e inativos) — usado na tela Admin para
 * cadastro/edição/reativação. Sem Supabase configurado, cai no mesmo mock.
 */
export async function fetchAllPlayersForAdmin(): Promise<Player[]> {
  if (!supabase) {
    console.warn("[playersService] Supabase não configurado — usando jogadores MOCK.");
    return getMockPlayers();
  }

  const { data, error } = await supabase.from("players").select(SELECT_COLUMNS).order("name");

  if (error) {
    throw new Error(`Falha ao carregar jogadores: ${error.message}`);
  }

  return (data as unknown as PlayerRow[]).map(mapRow);
}

export interface PlayerInput {
  name: string;
  nickname?: string;
  phone: string;
  type: Player["type"];
  overall: number;
  isGoalkeeper: boolean;
  positions: Position[];
}

/**
 * Cria um jogador. Campos administrativos (overall, type, is_goalkeeper)
 * ficam protegidos no banco pelo trigger da migration 0002 — só um
 * administrador autenticado consegue de fato gravar esses valores.
 */
export async function createPlayer(input: PlayerInput): Promise<Player> {
  if (!supabase) {
    throw new Error("Supabase não configurado — não é possível cadastrar jogadores em modo demonstração.");
  }

  const { data: created, error } = await supabase
    .from("players")
    .insert({
      name: input.name,
      nickname: input.nickname || null,
      phone: input.phone,
      type: input.type,
      overall: input.overall,
      is_goalkeeper: input.isGoalkeeper,
      active: true,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao criar jogador: ${error.message}`);
  }

  await syncPlayerPositions(created.id, input.positions);
  return fetchPlayerById(created.id);
}

export async function updatePlayer(id: string, input: PlayerInput): Promise<Player> {
  if (!supabase) {
    throw new Error("Supabase não configurado — não é possível editar jogadores em modo demonstração.");
  }

  const { error } = await supabase
    .from("players")
    .update({
      name: input.name,
      nickname: input.nickname || null,
      phone: input.phone,
      type: input.type,
      overall: input.overall,
      is_goalkeeper: input.isGoalkeeper,
    })
    .eq("id", id);

  if (error) {
    // Se o jogador logado não for admin, o trigger de proteção (migration 0002)
    // rejeita a alteração de campos administrativos com esta mesma mensagem.
    throw new Error(`Falha ao atualizar jogador: ${error.message}`);
  }

  await syncPlayerPositions(id, input.positions);
  return fetchPlayerById(id);
}

/**
 * Desativa um jogador (soft delete) — nunca apagamos o registro, porque o
 * histórico de partidas antigas referencia o jogador (Seção 23).
 */
export async function deactivatePlayer(id: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase não configurado — não é possível desativar jogadores em modo demonstração.");
  }
  const { error } = await supabase.from("players").update({ active: false }).eq("id", id);
  if (error) {
    throw new Error(`Falha ao desativar jogador: ${error.message}`);
  }
}

export async function reactivatePlayer(id: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase não configurado — não é possível reativar jogadores em modo demonstração.");
  }
  const { error } = await supabase.from("players").update({ active: true }).eq("id", id);
  if (error) {
    throw new Error(`Falha ao reativar jogador: ${error.message}`);
  }
}

async function fetchPlayerById(id: string): Promise<Player> {
  const { data, error } = await supabase!.from("players").select(SELECT_COLUMNS).eq("id", id).single();
  if (error) {
    throw new Error(`Falha ao carregar jogador: ${error.message}`);
  }
  return mapRow(data as unknown as PlayerRow);
}

/**
 * Substitui as posições de um jogador. Simples e direto (Seção 39): apaga
 * e reinsere, em vez de fazer um diff — o volume de posições por jogador é
 * pequeno (no máximo algumas linhas), então o custo é desprezível.
 */
async function syncPlayerPositions(playerId: string, positions: Position[]): Promise<void> {
  const { error: deleteError } = await supabase!.from("player_positions").delete().eq("player_id", playerId);
  if (deleteError) {
    throw new Error(`Falha ao atualizar posições: ${deleteError.message}`);
  }
  if (positions.length === 0) return;

  const { error: insertError } = await supabase!
    .from("player_positions")
    .insert(positions.map((position) => ({ player_id: playerId, position })));
  if (insertError) {
    throw new Error(`Falha ao atualizar posições: ${insertError.message}`);
  }
}
