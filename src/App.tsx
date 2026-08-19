import { useMemo, useState } from "react";
import { Header } from "./components/layout/Header";
import { TabNav, type Tab } from "./components/layout/TabNav";
import { HomePage } from "./pages/HomePage";
import { GamePage } from "./pages/GamePage";
import { ProfilePage } from "./pages/ProfilePage";
import { TeamsPage } from "./pages/TeamsPage";
import { AdminPage } from "./pages/AdminPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { usePlayers } from "./hooks/usePlayers";
import { useNextGame } from "./hooks/useNextGame";
import { generateBalancedTeams } from "./algorithms/balance";
import { supabase } from "./lib/supabase";
import type { ConfirmationStatus, Team } from "./types";

function AppShell() {
  const { status, session } = useAuth();
  const { players, loading, error } = usePlayers();

  // Sem Supabase conectado, não há como autenticar de verdade — em vez de
  // travar a tela num login que não pode funcionar, seguimos em modo
  // demonstração e deixamos isso explícito (Seção 36).
  const demoMode = !supabase;

  const realGame = useNextGame(session?.playerId ?? null);
  const [demoConfirmed, setDemoConfirmed] = useState<ConfirmationStatus | null>(null);

  const [tab, setTab] = useState<Tab>("Início");
  const [count, setCount] = useState(26);
  const [generated, setGenerated] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  const linePlayers = useMemo(() => players.filter((p) => !p.isGoalkeeper), [players]);
  const active = useMemo(() => linePlayers.slice(0, count), [linePlayers, count]);
  const teamCount = count >= 24 ? 4 : count >= 18 ? 3 : 0;
  const averageOverall = useMemo(
    () => active.reduce((s, p) => s + p.overall, 0) / Math.max(1, active.length),
    [active]
  );

  function generate() {
    if (!teamCount) return;
    setTeams(generateBalancedTeams(active, teamCount));
    setGenerated(true);
  }

  const confirmed = demoMode ? demoConfirmed : realGame.myStatus;
  async function handleConfirm(newStatus: ConfirmationStatus) {
    if (demoMode) {
      setDemoConfirmed(newStatus);
      return;
    }
    try {
      await realGame.confirm(newStatus);
    } catch {
      // erro já fica exposto via realGame.error, mostrado abaixo
    }
  }

  if (!demoMode && status === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-zinc-400">Carregando...</div>;
  }

  if (!demoMode && status === "unauthenticated") {
    return <LoginPage />;
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-400">Carregando jogadores...</div>;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl p-4 pb-24">
        {demoMode && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
            Modo demonstração: Supabase não configurado. Dados de jogadores são mockados, login e confirmação de
            presença estão desativados.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {!demoMode && realGame.error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {realGame.error}
          </div>
        )}
        <TabNav active={tab} onChange={setTab} />
        {tab === "Início" && (
          <HomePage
            game={demoMode ? null : realGame.game}
            confirmed={confirmed}
            onConfirm={handleConfirm}
            activePlayers={active}
            goalkeeperCount={players.filter((p) => p.isGoalkeeper).length}
            averageOverall={averageOverall}
          />
        )}
        {tab === "Jogo" && (
          <GamePage
            game={demoMode ? null : realGame.game}
            confirmed={confirmed}
            onConfirm={handleConfirm}
            counts={realGame.counts}
          />
        )}
        {tab === "Perfil" && <ProfilePage />}
        {tab === "Times" && (
          <TeamsPage
            teams={teams}
            generated={generated}
            teamCount={teamCount}
            playerCount={count}
            onGenerate={generate}
          />
        )}
        {tab === "Admin" && (
          <AdminPage
            count={count}
            maxCount={Math.max(linePlayers.length, count)}
            teamCount={teamCount}
            onCountChange={setCount}
            onGenerate={generate}
            game={realGame.game}
            onGameCreated={realGame.reload}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
