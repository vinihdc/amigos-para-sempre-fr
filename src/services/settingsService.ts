import { supabase } from "../lib/supabase";
import type { FootballSettings } from "../types";

/**
 * Valores usados no modo demonstração e como fallback visual enquanto o
 * Supabase ainda está carregando. Devem permanecer alinhados com a migration
 * 0008_football_settings.sql.
 */
export const DEFAULT_FOOTBALL_SETTINGS: FootballSettings = {
  sessionDurationMinutes: 120,
  matchDurationMinutes: 10,
  fieldPlayersPerTeam: 6,
  goalkeeperCount: 4,
  minimumPlayersForGame: 15,
  minimumPlayersFor3Teams: 18,
  minimumPlayersFor4Teams: 24,
  subscriberPriorityEnabled: true,
  minimumVotesForHighlight: 3,
  minimumVotesForTrimming: 7,
  lowerPercentile: 5,
  upperPercentile: 95,
};

interface FootballSettingsRow {
  session_duration_minutes: number;
  match_duration_minutes: number;
  field_players_per_team: number;
  goalkeeper_count: number;
  minimum_players_for_game: number;
  minimum_players_for_3_teams: number;
  minimum_players_for_4_teams: number;
  subscriber_priority_enabled: boolean;
  minimum_votes_for_highlight: number;
  minimum_votes_for_trimming: number;
  lower_percentile: number;
  upper_percentile: number;
}

function mapRow(row: FootballSettingsRow): FootballSettings {
  return {
    sessionDurationMinutes: row.session_duration_minutes,
    matchDurationMinutes: row.match_duration_minutes,
    fieldPlayersPerTeam: row.field_players_per_team,
    goalkeeperCount: row.goalkeeper_count,
    minimumPlayersForGame: row.minimum_players_for_game,
    minimumPlayersFor3Teams: row.minimum_players_for_3_teams,
    minimumPlayersFor4Teams: row.minimum_players_for_4_teams,
    subscriberPriorityEnabled: row.subscriber_priority_enabled,
    minimumVotesForHighlight: row.minimum_votes_for_highlight,
    minimumVotesForTrimming: row.minimum_votes_for_trimming,
    lowerPercentile: row.lower_percentile,
    upperPercentile: row.upper_percentile,
  };
}

function toRow(settings: FootballSettings): FootballSettingsRow {
  return {
    session_duration_minutes: settings.sessionDurationMinutes,
    match_duration_minutes: settings.matchDurationMinutes,
    field_players_per_team: settings.fieldPlayersPerTeam,
    goalkeeper_count: settings.goalkeeperCount,
    minimum_players_for_game: settings.minimumPlayersForGame,
    minimum_players_for_3_teams: settings.minimumPlayersFor3Teams,
    minimum_players_for_4_teams: settings.minimumPlayersFor4Teams,
    subscriber_priority_enabled: settings.subscriberPriorityEnabled,
    minimum_votes_for_highlight: settings.minimumVotesForHighlight,
    minimum_votes_for_trimming: settings.minimumVotesForTrimming,
    lower_percentile: settings.lowerPercentile,
    upper_percentile: settings.upperPercentile,
  };
}

/**
 * Busca a configuração global do futebol.
 * Em modo demonstração usamos defaults para a aplicação continuar testável.
 */
export async function fetchFootballSettings(): Promise<FootballSettings> {
  if (!supabase) return DEFAULT_FOOTBALL_SETTINGS;

  const { data, error } = await supabase
    .from("football_settings")
    .select("session_duration_minutes,match_duration_minutes,field_players_per_team,goalkeeper_count,minimum_players_for_game,minimum_players_for_3_teams,minimum_players_for_4_teams,subscriber_priority_enabled,minimum_votes_for_highlight,minimum_votes_for_trimming,lower_percentile,upper_percentile")
    .eq("id", "default")
    .single();

  if (error) {
    throw new Error(`Falha ao carregar configurações do futebol: ${error.message}`);
  }

  return mapRow(data as FootballSettingsRow);
}

/**
 * Persiste os parâmetros alterados pelo administrador.
 * A RLS da migration 0008 é a proteção definitiva contra escrita por jogador
 * comum; a interface Admin é apenas a camada de UX.
 */
export async function saveFootballSettings(settings: FootballSettings): Promise<FootballSettings> {
  if (!supabase) {
    throw new Error("Supabase não configurado — as configurações não podem ser salvas em modo demonstração.");
  }

  const { data, error } = await supabase
    .from("football_settings")
    .update({ ...toRow(settings), updated_at: new Date().toISOString() })
    .eq("id", "default")
    .select("session_duration_minutes,match_duration_minutes,field_players_per_team,goalkeeper_count,minimum_players_for_game,minimum_players_for_3_teams,minimum_players_for_4_teams,subscriber_priority_enabled,minimum_votes_for_highlight,minimum_votes_for_trimming,lower_percentile,upper_percentile")
    .single();

  if (error) {
    throw new Error(`Falha ao salvar configurações do futebol: ${error.message}`);
  }

  return mapRow(data as FootballSettingsRow);
}
