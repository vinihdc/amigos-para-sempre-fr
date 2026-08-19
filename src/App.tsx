import { useMemo, useState } from "react";
import { Header } from "./components/layout/Header";
import { TabNav, type Tab } from "./components/layout/TabNav";
import type { ConfirmationStatus } from "./components/ui/ConfirmationButtons";
import { HomePage } from "./pages/HomePage";
import { GamePage } from "./pages/GamePage";
import { ProfilePage } from "./pages/ProfilePage";
import { TeamsPage } from "./pages/TeamsPage";
import { AdminPage } from "./pages/AdminPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { usePlayers } from "./hooks/usePlayers";
import { generateBalancedTeams } from "./algorithms/balance";
import { supabase } from "./lib/supabase";
import type { Team } from "./types";

function AppShell() {
  const { status } = useAuth();
  const { players, loading, error } = usePlayers();

  const [tab, setTab] = useState<Tab>("Início");
  const [confirmed, setConfirmed] = useState<ConfirmationStatus | null>(null);
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

  // Sem Supabase conectado, não há como autenticar de verdade — em vez de
  // travar a tela num login que não pode funcionar, seguimos em modo
  // demonstração e deixamos isso explícito (Seção 36).
  const demoMode = !supabase;

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
            Modo demonstração: Supabase não configurado. Dados de jogadores são mockados e o login está desativado.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <TabNav active={tab} onChange={setTab} />
        {tab === "Início" && (
          <HomePage
            confirmed={confirmed}
            onConfirm={setConfirmed}
            activePlayers={active}
            goalkeeperCount={players.filter((p) => p.isGoalkeeper).length}
            averageOverall={averageOverall}
          />
        )}
        {tab === "Jogo" && <GamePage confirmed={confirmed} onConfirm={setConfirmed} />}
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
            players={players}
            count={count}
            maxCount={Math.max(linePlayers.length, count)}
            teamCount={teamCount}
            onCountChange={setCount}
            onGenerate={generate}
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
