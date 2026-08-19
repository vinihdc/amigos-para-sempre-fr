import type { Player } from "../types";

export interface EligibilityResult {
  eligible: Player[];
  waitlist: Player[];
}

/**
 * Aplica a regra "MENSALISTAS > AVULSOS" (Seção 16): dado um conjunto de
 * jogadores de linha CONFIRMADOS (já sem goleiros — Seção 15) e uma
 * capacidade máxima de vagas, retorna quem entra e quem fica na lista de
 * espera.
 *
 * `confirmedPlayers` deve vir ordenado por ordem de confirmação (mais
 * antigo primeiro) — essa ordem é preservada dentro de cada grupo
 * (mensalista/avulso), pois `Array.prototype.sort` é estável.
 */
export function selectEligiblePlayers(confirmedPlayers: Player[], capacity: number): EligibilityResult {
  const sorted = [...confirmedPlayers].sort((a, b) => {
    if (a.type === b.type) return 0;
    return a.type === "MENSALISTA" ? -1 : 1;
  });

  return {
    eligible: sorted.slice(0, capacity),
    waitlist: sorted.slice(capacity),
  };
}
