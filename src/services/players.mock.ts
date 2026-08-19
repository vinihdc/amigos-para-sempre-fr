import type { Player, Position } from "../types";

/**
 * MOCK — usar apenas enquanto a integração real com o Supabase
 * (tabela `players`) não estiver conectada nesta tela.
 *
 * Regra do projeto (Seção 8): quando o CRUD real de jogadores for
 * ligado ao Supabase, este arquivo deixa de ser usado nas telas
 * correspondentes.
 */

const POSITIONS: Position[] = [
  "Goleiro", "Zagueiro", "Lateral", "Volante",
  "Meio-campo", "Ponta", "Atacante", "Flexível",
];

const NAMES = [
  "João", "Carlos", "Pedro", "Lucas", "Rafael", "André", "Bruno", "Marcos",
  "Thiago", "Caue", "Eduardo", "Felipe", "Gustavo", "Henrique", "Vitor",
  "Renan", "Rodrigo", "Samuel", "Diego", "Matheus", "Gabriel", "Leonardo",
  "Daniel", "Vinicius", "Arthur", "Ramon", "Murilo", "Alex", "Fernando",
  "Wesley", "Ruan", "Igor",
];

export function getMockPlayers(): Player[] {
  return NAMES.map((name, i) => ({
    id: String(i + 1),
    name,
    overall: Number((5.5 + (i % 9) * 0.45).toFixed(1)),
    type: i < 28 ? "MENSALISTA" : "AVULSO",
    positions: [POSITIONS[i % POSITIONS.length]],
    isGoalkeeper: i % 7 === 0,
    active: true,
  }));
}
