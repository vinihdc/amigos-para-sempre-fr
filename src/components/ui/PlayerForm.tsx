import { useState } from "react";
import type { Player, PlayerType, Position } from "../../types";
import type { PlayerInput } from "../../services/playersService";

const ALL_POSITIONS: Position[] = [
  "Goleiro", "Zagueiro", "Lateral", "Volante",
  "Meio-campo", "Ponta", "Atacante", "Flexível",
];

interface PlayerFormProps {
  initial?: Player;
  onSubmit: (input: PlayerInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export function PlayerForm({ initial, onSubmit, onCancel, saving }: PlayerFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [type, setType] = useState<PlayerType>(initial?.type ?? "AVULSO");
  const [overall, setOverall] = useState(initial?.overall ?? 6.0);
  const [isGoalkeeper, setIsGoalkeeper] = useState(initial?.isGoalkeeper ?? false);
  const [positions, setPositions] = useState<Position[]>(initial?.positions ?? []);
  const [formError, setFormError] = useState<string | null>(null);

  function togglePosition(p: Position) {
    setPositions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) return setFormError("Nome é obrigatório.");
    if (!phone.trim()) return setFormError("Telefone é obrigatório.");
    if (overall < 1 || overall > 10) return setFormError("Overall deve estar entre 1.0 e 10.0.");

    try {
      await onSubmit({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        phone: phone.trim(),
        type,
        overall,
        isGoalkeeper,
        positions,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar jogador.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <h3 className="text-xl font-black">{initial ? "Editar jogador" : "Novo jogador"}</h3>

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Nome *</label>
        <input
          className="w-full rounded-xl bg-zinc-900 p-3 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Apelido</label>
        <input
          className="w-full rounded-xl bg-zinc-900 p-3 outline-none"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Telefone *</label>
        <input
          className="w-full rounded-xl bg-zinc-900 p-3 outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="(11) 91234-5678"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Tipo</label>
          <select
            className="w-full rounded-xl bg-zinc-900 p-3 outline-none"
            value={type}
            onChange={(e) => setType(e.target.value as PlayerType)}
          >
            <option value="MENSALISTA">Mensalista</option>
            <option value="AVULSO">Avulso</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Overall (1.0–10.0)</label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="10"
            className="w-full rounded-xl bg-zinc-900 p-3 outline-none"
            value={overall}
            onChange={(e) => setOverall(Number(e.target.value))}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={isGoalkeeper} onChange={(e) => setIsGoalkeeper(e.target.checked)} />
        Goleiro
      </label>

      <div>
        <label className="mb-2 block text-sm text-zinc-400">Posições</label>
        <div className="flex flex-wrap gap-2">
          {ALL_POSITIONS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => togglePosition(p)}
              className={`badge ${positions.includes(p) ? "bg-white text-black" : "bg-zinc-800"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {formError && <div className="text-sm text-red-400">{formError}</div>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn btn-primary flex-1 disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-muted">
          Cancelar
        </button>
      </div>
    </form>
  );
}
