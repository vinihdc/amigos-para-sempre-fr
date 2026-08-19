import { Settings } from "lucide-react";
import type { Player } from "../types";

interface AdminPageProps {
  players: Player[];
  count: number;
  maxCount: number;
  teamCount: number;
  onCountChange: (count: number) => void;
  onGenerate: () => void;
}

export function AdminPage({ players, count, maxCount, teamCount, onCountChange, onGenerate }: AdminPageProps) {
  return (
    <section className="space-y-4">
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings />
          <h2 className="text-2xl font-black">Montar Times</h2>
        </div>
        <label className="text-sm text-zinc-400">Jogadores de linha confirmados</label>
        <input
          type="range"
          min="15"
          max={maxCount}
          value={count}
          onChange={(e) => onCountChange(+e.target.value)}
          className="mt-3 w-full"
        />
        <div className="mt-2 font-bold">
          {count} jogadores • {teamCount || "sem montagem automática"} times
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Regras: mínimo 15 para realizar o futebol; mínimo 18 para montar 3 times; 24+ para 4 times; mínimo 6
          jogadores de linha por time.
        </p>
        <button onClick={onGenerate} disabled={!teamCount} className="btn btn-primary mt-5">
          GERAR TIMES
        </button>
      </div>
      <div className="card p-6">
        <h3 className="mb-3 font-black">Jogadores</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {players.map((p) => (
            <div className="flex items-center justify-between rounded-xl bg-zinc-900 p-3" key={p.id}>
              <span>{p.name}</span>
              <span className="text-sm text-zinc-400">⭐ {p.overall}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
