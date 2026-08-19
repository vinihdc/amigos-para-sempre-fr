import { useState } from "react";
import { Settings, Plus, Pencil, UserX, UserCheck, CalendarPlus, AlertTriangle, Clock } from "lucide-react";
import type { Game, Player } from "../types";
import { usePlayerAdmin } from "../hooks/usePlayerAdmin";
import { PlayerForm } from "../components/ui/PlayerForm";
import type { PlayerInput } from "../services/playersService";
import { createGame } from "../services/gamesService";

interface AdminPageProps {
  capacity: number;
  maxCapacity: number;
  teamCount: number;
  onCapacityChange: (capacity: number) => void;
  onGenerate: () => void;
  game: Game | null;
  onGameCreated: () => void;
  waitlist: Player[];
  goalkeeperCount: number;
  goalkeeperShortage: boolean;
}

export function AdminPage({
  capacity,
  maxCapacity,
  teamCount,
  onCapacityChange,
  onGenerate,
  game,
  onGameCreated,
  waitlist,
  goalkeeperCount,
  goalkeeperShortage,
}: AdminPageProps) {
  const { players, loading, error, saving, create, update, deactivate, reactivate } = usePlayerAdmin();
  const [editing, setEditing] = useState<Player | "new" | null>(null);
  const [gameForm, setGameForm] = useState({ date: "", time: "20:00", location: "Arena Society" });
  const [gameSaving, setGameSaving] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);

  async function handleSubmit(input: PlayerInput) {
    if (editing === "new") {
      await create(input);
    } else if (editing) {
      await update(editing.id, input);
    }
    setEditing(null);
  }

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    if (!gameForm.date) {
      setGameError("Escolha uma data.");
      return;
    }
    setGameSaving(true);
    setGameError(null);
    try {
      await createGame(gameForm);
      onGameCreated();
    } catch (err) {
      setGameError(err instanceof Error ? err.message : "Erro ao criar jogo.");
    } finally {
      setGameSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      {!game && (
        <form onSubmit={handleCreateGame} className="card space-y-3 p-6">
          <div className="flex items-center gap-2">
            <CalendarPlus />
            <h2 className="text-xl font-black">Agendar próximo jogo</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="date"
              className="rounded-xl bg-zinc-900 p-3 outline-none"
              value={gameForm.date}
              onChange={(e) => setGameForm((f) => ({ ...f, date: e.target.value }))}
            />
            <input
              type="time"
              className="rounded-xl bg-zinc-900 p-3 outline-none"
              value={gameForm.time}
              onChange={(e) => setGameForm((f) => ({ ...f, time: e.target.value }))}
            />
            <input
              className="rounded-xl bg-zinc-900 p-3 outline-none"
              value={gameForm.location}
              onChange={(e) => setGameForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Local"
            />
          </div>
          {gameError && <div className="text-sm text-red-400">{gameError}</div>}
          <button type="submit" disabled={gameSaving} className="btn btn-primary disabled:opacity-50">
            {gameSaving ? "Criando..." : "Criar jogo"}
          </button>
        </form>
      )}

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings />
          <h2 className="text-2xl font-black">Montar Times</h2>
        </div>
        <label className="text-sm text-zinc-400">
          Capacidade de vagas (mensalistas entram primeiro — Seção 16)
        </label>
        <input
          type="range"
          min="15"
          max={maxCapacity}
          value={capacity}
          onChange={(e) => onCapacityChange(+e.target.value)}
          className="mt-3 w-full"
        />
        <div className="mt-2 font-bold">
          {capacity} vagas • {teamCount || "sem montagem automática"} times
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Regras: mínimo 15 para realizar o futebol; mínimo 18 para montar 3 times; 24+ para 4 times; mínimo 6
          jogadores de linha por time.
        </p>

        {goalkeeperShortage && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              Só há {goalkeeperCount} goleiro(s) confirmado(s) para {teamCount} times. O sistema não decide isso
              sozinho — defina manualmente como distribuir (Seção 15).
            </span>
          </div>
        )}

        <button onClick={onGenerate} disabled={!teamCount} className="btn btn-primary mt-5">
          GERAR TIMES
        </button>
      </div>

      {waitlist.length > 0 && (
        <div className="card p-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            <h3 className="font-black">Lista de espera ({waitlist.length})</h3>
          </div>
          <p className="mb-3 text-sm text-zinc-500">
            Avulsos que confirmaram mas ficaram fora da capacidade atual, em ordem de confirmação.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {waitlist.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-zinc-900 p-3">
                <span>
                  {i + 1}. {p.name}
                </span>
                <span className="text-xs text-zinc-500">Avulso</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <PlayerForm
          initial={editing === "new" ? undefined : editing}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      <div className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-black">Jogadores</h3>
          <button onClick={() => setEditing("new")} className="btn btn-primary flex items-center gap-2">
            <Plus size={16} /> Novo jogador
          </button>
        </div>

        {loading && <div className="text-sm text-zinc-400">Carregando jogadores...</div>}
        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="grid gap-2 md:grid-cols-2">
          {players.map((p) => (
            <div
              className={`flex items-center justify-between rounded-xl p-3 ${p.active ? "bg-zinc-900" : "bg-zinc-900/40 opacity-60"}`}
              key={p.id}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span>{p.name}</span>
                  {!p.active && <span className="badge bg-zinc-800 text-xs">Inativo</span>}
                </div>
                <div className="text-xs text-zinc-500">
                  {p.type === "MENSALISTA" ? "Mensalista" : "Avulso"} • ⭐ {p.overall.toFixed(1)}
                  {p.isGoalkeeper && " • Goleiro"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(p)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                {p.active ? (
                  <button
                    onClick={() => deactivate(p.id)}
                    className="rounded-lg p-2 text-red-400 hover:bg-zinc-800"
                    title="Desativar"
                  >
                    <UserX size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => reactivate(p.id)}
                    className="rounded-lg p-2 text-emerald-400 hover:bg-zinc-800"
                    title="Reativar"
                  >
                    <UserCheck size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
