import { RefreshCw } from "lucide-react";
import type { Team } from "../types";

interface TeamsPageProps {
  teams: Team[];
  generated: boolean;
  teamCount: number;
  playerCount: number;
  onGenerate: () => void;
}

export function TeamsPage({ teams, generated, teamCount, playerCount, onGenerate }: TeamsPageProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Times definidos</h2>
          <p className="text-zinc-400">{generated ? `${teams.length} times gerados` : "Aguardando montagem"}</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={!teamCount}
          className="btn btn-primary flex items-center gap-2 disabled:opacity-40"
        >
          <RefreshCw size={16} /> Gerar Times
        </button>
      </div>
      {!teamCount && (
        <div className="card p-6 text-amber-300">
          Há {playerCount} jogadores. São necessários pelo menos 18 jogadores para formar 3 times com no mínimo 6
          jogadores.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((t) => (
          <div className="card p-5" key={t.id}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black">{t.name}</h3>
              <span className="badge bg-zinc-800">{t.players.length} jogadores</span>
            </div>
            <div className="mb-4 text-sm text-zinc-400">
              ⭐ Overall médio {(t.players.reduce((s, p) => s + p.overall, 0) / t.players.length).toFixed(2)}
            </div>
            {t.players.map((p) => (
              <div className="flex justify-between border-t border-white/5 py-2" key={p.id}>
                <span>{p.name}</span>
                <span className="text-zinc-400">{p.overall.toFixed(1)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
