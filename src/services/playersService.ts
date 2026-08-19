import { supabase } from "../lib/supabase";
import type { Player, Position } from "../types";
import { getMockPlayers } from "./players.mock";

interface PlayerRow {
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

function mapRow(row: PlayerRow): Player {
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
    .select("id,name,nickname,overall,type,is_goalkeeper,active,phone,player_positions(position)")
    .eq("active", true)
    .order("name");

  if (error) {
    throw new Error(`Falha ao carregar jogadores: ${error.message}`);
  }

  return (data as unknown as PlayerRow[]).map(mapRow);
}
