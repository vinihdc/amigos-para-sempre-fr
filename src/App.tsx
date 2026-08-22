import { useEffect, useMemo, useState } from "react";
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
import { useConfirmedPlayers } from "./hooks/useConfirmedPlayers";
import { useFootballSettings } from "./hooks/useFootballSettings";
import { generateBalancedTeams } from "./algorithms/balance";
import { selectEligiblePlayers } from "./algorithms/eligibility";
import { supabase } from "./lib/supabase";
import type { ConfirmationStatus, Team } from "./types";

function AppShell() {
  const { status, session } = useAuth();
  const { players, loading, error } = usePlayers();
  const footballSettings = useFootballSettings();

  // Sem Supabase conectado, não há como autenticar de verdade — em vez de
  // travar a tela num login que não pode funcionar, seguimos em modo
  // demonstração e deixamos isso explícito.
  const demoMode = !supabase;

  const realGame = useNextGame(session?.playerId ?? null);
  const confirmedPool = useConfirmedPlayers(demoMode ? null : (realGame.game?.id ?? null));
  const [demoConfirmed, setDemoConfirmed] = useState<ConfirmationStatus | null>(null);

  const [tab, setTab] = useState<Tab>("Início");
  const [capacity, setCapacity] = useState(26);
  const [generated, setGenerated] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  // Se o administrador aumentar o mínimo para realização do futebol,
  // garantimos que o controle de capacidade não permaneça abaixo da regra.
  useEffect(() => {
    setCapacity((current) => Math.max(current, footballSettings.settings.minimumPlayersForGame));
  }, [footballSettings.settings.minimumPlayersForGame]);

  // Em modo demonstração, tratamos todo o mock como "confirmado" pra manter
  // a experiência de teste igual à de antes. Fora do modo demo, o pool vem
  // das confirmações reais do próximo jogo.
  const linePool = useMemo(
    () => (demoMode ? players.filter((p) => !p.isGoalkeeper) : confirmedPool.linePlayers),
    [demoMode, players, confirmedPool.linePlayers]
  );
  const goalkeeperPool = useMemo(
    () => (demoMode ? players.filter((p) => p.isGoalkeeper) : confirmedPool.goalkeepers),
    [demoMode, players, confirmedPool.goalkeepers]
  );

  // A prioridade mensalista > avulso agora é controlada pelo parâmetro
  // subscriberPriorityEnabled, em vez de ficar permanentemente hardcoded.
  const { eligible, waitlist } = useMemo(
    () => selectEligiblePlayers(linePool, capacity, footballSettings.settings.subscriberPriorityEnabled),
    [linePool, capacity, footballSettings.settings.subscriberPriorityEnabled]
  );

  // Os cortes 18/24 deixaram de ser números mágicos: são lidos da
  // configuração administrável no Supabase.
  const teamCount =
    eligible.length >= footballSettings.settings.minimumPlayersFor4Teams
      ? 4
      : eligible.length >= footballSettings.settings.minimumPlayersFor3Teams
        ? 3
        : 0;

  const goalkeeperShortage = teamCount > 0 && goalkeeperPool.length < teamCount;
  const averageOverall = useMemo(
    () => eligible.reduce((s, p) => s + p.overall, 0) / Math.max(1, eligible.length),
    [eligible]
  );

  function generate() {
    if (!teamCount) return;
    setTeams(generateBalancedTeams(eligible, teamCount, footballSettings.settings.fieldPlayersPerTeam));
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
        {!demoMode && confirmedPool.error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {confirmedPool.error}
          </div>
        )}
        <TabNav active={tab} onChange={setTab} />
        {tab === "Início" && (
          <HomePage
            game={demoMode ? null : realGame.game}
            confirmed={confirmed}
            onConfirm={handleConfirm}
            checkedInAt={demoMode ? null : realGame.checkedInAt}
            onCheckIn={() => realGame.checkIn().catch(() => {})}
            activePlayers={eligible}
            goalkeeperCount={goalkeeperPool.length}
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
            playerCount={eligible.length}
            onGenerate={generate}
          />
        )}
        {tab === "Admin" && (
          <AdminPage
            capacity={capacity}
            maxCapacity={Math.max(linePool.length, capacity, footballSettings.settings.minimumPlayersForGame)}
            teamCount={teamCount}
            onCapacityChange={setCapacity}
            onGenerate={generate}
            game={demoMode ? null : realGame.game}
            onGameCreated={realGame.reload}
            waitlist={waitlist}
            goalkeeperCount={goalkeeperPool.length}
            goalkeeperShortage={goalkeeperShortage}
            settings={footballSettings.settings}
            settingsLoading={footballSettings.loading}
            settingsSaving={footballSettings.saving}
            settingsError={footballSettings.error}
            onSaveSettings={footballSettings.save}
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
