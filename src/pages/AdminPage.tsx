import { useEffect, useState } from "react";
import {
  Settings,
  Plus,
  Pencil,
  UserX,
  UserCheck,
  CalendarPlus,
  AlertTriangle,
  Clock,
  Save,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import type { FootballSettings, Game, Player } from "../types";
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
  settings: FootballSettings;
  settingsLoading: boolean;
  settingsSaving: boolean;
  settingsError: string | null;
  onSaveSettings: (settings: FootballSettings) => Promise<FootballSettings>;
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
  settings,
  settingsLoading,
  settingsSaving,
  settingsError,
  onSaveSettings,
}: AdminPageProps) {
  const { players, loading, error, saving, create, update, deactivate, reactivate } = usePlayerAdmin();
  const [editing, setEditing] = useState<Player | "new" | null>(null);
  const [gameForm, setGameForm] = useState({ date: "", time: "20:00", location: "Arena Society" });
  const [gameSaving, setGameSaving] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<FootballSettings>(settings);
  const [settingsLocalError, setSettingsLocalError] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Quando as configurações chegam do Supabase (carregamento assíncrono),
  // sincronizamos o formulário sem manter os defaults antigos na tela.
  useEffect(() => {
    setSettingsDraft(settings);
  }, [settings]);

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

  function updateSetting<K extends keyof FootballSettings>(key: K, value: FootballSettings[K]) {
    setSettingsSaved(false);
    setSettingsLocalError(null);
    setSettingsDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSettingsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSettingsLocalError(null);
    setSettingsSaved(false);

    // Validações também existem no banco, mas antecipá-las aqui melhora a UX
    // e evita uma ida desnecessária ao Supabase.
    if (settingsDraft.minimumPlayersFor3Teams < settingsDraft.minimumPlayersForGame) {
      setSettingsLocalError("O mínimo para 3 times não pode ser menor que o mínimo para realizar o futebol.");
      return;
    }
    if (settingsDraft.minimumPlayersFor4Teams < settingsDraft.minimumPlayersFor3Teams) {
      setSettingsLocalError("O mínimo para 4 times não pode ser menor que o mínimo para 3 times.");
      return;
    }
    if (settingsDraft.lowerPercentile >= settingsDraft.upperPercentile) {
      setSettingsLocalError("O percentil inferior precisa ser menor que o percentil superior.");
      return;
    }

    try {
      const saved = await onSaveSettings(settingsDraft);
      setSettingsDraft(saved);
      setSettingsSaved(true);

      // Se o novo mínimo ultrapassar a capacidade selecionada, ajustamos o
      // controle imediatamente para manter a tela coerente com a regra salva.
      if (capacity < saved.minimumPlayersForGame) {
        onCapacityChange(saved.minimumPlayersForGame);
      }
    } catch {
      // O erro detalhado já vem do hook e é exibido abaixo.
    }
  }

  const numberInputClass = "rounded-xl bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-emerald-500";

  return (
    <section className="space-y-4">
      <form onSubmit={handleSettingsSubmit} className="card space-y-5 p-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="text-emerald-400" />
          <div>
            <h2 className="text-2xl font-black">Configurações do Futebol</h2>
            <p className="text-sm text-zinc-500">Parâmetros de negócio salvos no Supabase, sem precisar alterar código.</p>
          </div>
        </div>

        {settingsLoading ? (
          <div className="text-sm text-zinc-400">Carregando configurações...</div>
        ) : (
          <>
            <div>
              <h3 className="mb-3 font-black text-zinc-200">Sessão e partidas</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1 text-sm text-zinc-400">
                  Duração do futebol (min)
                  <input
                    type="number"
                    min={30}
                    max={360}
                    className={numberInputClass}
                    value={settingsDraft.sessionDurationMinutes}
                    onChange={(e) => updateSetting("sessionDurationMinutes", +e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                  Duração da partida (min)
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className={numberInputClass}
                    value={settingsDraft.matchDurationMinutes}
                    onChange={(e) => updateSetting("matchDurationMinutes", +e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                  Mínimo de linha por time
                  <input
                    type="number"
                    min={4}
                    max={11}
                    className={numberInputClass}
                    value={settingsDraft.fieldPlayersPerTeam}
                    onChange={(e) => updateSetting("fieldPlayersPerTeam", +e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                  Goleiros esperados
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className={numberInputClass}
                    value={settingsDraft.goalkeeperCount}
                    onChange={(e) => updateSetting("goalkeeperCount", +e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-black text-zinc-200">Formação dos times</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1 text-sm text-zinc-400">
                  Mínimo para realizar
                  <input
                    type="number"
                    min={1}
                    className={numberInputClass}
                    value={settingsDraft.minimumPlayersForGame}
                    onChange={(e) => updateSetting("minimumPlayersForGame", +e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                  Mínimo para 3 times
                  <input
                    type="number"
                    min={1}
                    className={numberInputClass}
                    value={settingsDraft.minimumPlayersFor3Teams}
                    onChange={(e) => updateSetting("minimumPlayersFor3Teams", +e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                  Mínimo para 4 times
                  <input
                    type="number"
                    min={1}
                    className={numberInputClass}
                    value={settingsDraft.minimumPlayersFor4Teams}
                    onChange={(e) => updateSetting("minimumPlayersFor4Teams", +e.target.value)}
                  />
                </label>
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-zinc-900 p-4">
                <div>
                  <div className="font-bold">Prioridade de mensalistas</div>
                  <div className="text-sm text-zinc-500">Mensalistas ocupam as vagas antes dos avulsos.</div>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-emerald-500"
                  checked={settingsDraft.subscriberPriorityEnabled}
                  onChange={(e) => updateSetting("subscriberPriorityEnabled", e.target.checked)}
                />
              </label>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Star size={18} className="text-amber-400" />
                <h3 className="font-black text-zinc-200">Avaliações e Robust Rating</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1 text-sm text-zinc-400">
                  Mínimo votos para destaque
                  <input
                    type="number"
                    min={1}
                    className={numberInputClass}
                    value={settingsDraft.minimumVotesForHighlight}
                    onChange={(e) => updateSetting("minimumVotesForHighlight", +e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                  Iniciar corte de extremos
                  <input
                    type="number"
                    min={3}
                    className={numberInputClass}
                    value={settingsDraft.minimumVotesForTrimming}
                    onChange={(e) => updateSetting("minimumVotesForTrimming", +e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                  Percentil inferior
                  <input
                    type="number"
                    min={0}
                    max={49}
                    className={numberInputClass}
                    value={settingsDraft.lowerPercentile}
                    onChange={(e) => updateSetting("lowerPercentile", +e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                  Percentil superior
                  <input
                    type="number"
                    min={51}
                    max={100}
                    className={numberInputClass}
                    value={settingsDraft.upperPercentile}
                    onChange={(e) => updateSetting("upperPercentile", +e.target.value)}
                  />
                </label>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Os votos originais permanecem salvos. P5/P95 e corte de extremos afetam apenas o cálculo do rating.
              </p>
            </div>
          </>
        )}

        {(settingsLocalError || settingsError) && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {settingsLocalError || settingsError}
          </div>
        )}
        {settingsSaved && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            Configurações salvas. As próximas decisões do sistema já usarão os novos parâmetros.
          </div>
        )}

        <button type="submit" disabled={settingsLoading || settingsSaving} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save size={16} /> {settingsSaving ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>

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
          Capacidade de vagas {settings.subscriberPriorityEnabled ? "(mensalistas entram primeiro)" : "(ordem de confirmação)"}
        </label>
        <input
          type="range"
          min={settings.minimumPlayersForGame}
          max={maxCapacity}
          value={capacity}
          onChange={(e) => onCapacityChange(+e.target.value)}
          className="mt-3 w-full"
        />
        <div className="mt-2 font-bold">
          {capacity} vagas • {teamCount || "sem montagem automática"} times
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Regras atuais: mínimo {settings.minimumPlayersForGame} para realizar; {settings.minimumPlayersFor3Teams} para 3 times; {settings.minimumPlayersFor4Teams}+ para 4 times; mínimo {settings.fieldPlayersPerTeam} jogadores de linha por time.
        </p>

        {goalkeeperShortage && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              Só há {goalkeeperCount} goleiro(s) confirmado(s) para {teamCount} times. O sistema não decide isso
              sozinho — defina manualmente como distribuir.
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
            Jogadores confirmados que ficaram fora da capacidade atual, respeitando a regra de prioridade configurada.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {waitlist.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-zinc-900 p-3">
                <span>{i + 1}. {p.name}</span>
                <span className="text-xs text-zinc-500">{p.type === "MENSALISTA" ? "Mensalista" : "Avulso"}</span>
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
