import type { Player } from "../types";

export interface EligibilityResult {
  eligible: Player[];
  waitlist: Player[];
}

/**
 * Seleciona quem ocupa as vagas disponíveis.
 *
 * Quando `subscriberPriorityEnabled` está ativo, mensalistas ficam à frente
 * dos avulsos preservando a ordem original dentro de cada grupo. Quando está
 * desativado, a ordem recebida é respeitada sem reclassificação.
 *
 * Esta função trata somente a elegibilidade inicial por capacidade. O rodízio
 * vivo durante a sessão usa session_participation/matches e será tratado pela
 * lógica específica de rotação.
 */
export function selectEligiblePlayers(
  confirmedPlayers: Player[],
  capacity: number,
  subscriberPriorityEnabled = true
): EligibilityResult {
  const sorted = subscriberPriorityEnabled
    ? [...confirmedPlayers].sort((a, b) => {
        if (a.type === b.type) return 0;
        return a.type === "MENSALISTA" ? -1 : 1;
      })
    : [...confirmedPlayers];

  return {
    eligible: sorted.slice(0, capacity),
    waitlist: sorted.slice(capacity),
  };
}
