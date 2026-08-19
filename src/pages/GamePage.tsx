import { ConfirmationButtons } from "../components/ui/ConfirmationButtons";
import type { ConfirmationCounts, ConfirmationStatus, Game } from "../types";

interface GamePageProps {
  game: Game | null;
  confirmed: ConfirmationStatus | null;
  onConfirm: (status: ConfirmationStatus) => void;
  counts: ConfirmationCounts;
}

export function GamePage({ game, confirmed, onConfirm, counts }: GamePageProps) {
  if (!game) {
    return (
      <section className="card p-6 text-zinc-400">
        Nenhum jogo agendado no momento. O administrador precisa criar o próximo jogo na aba Admin.
      </section>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="text-2xl font-black">⚽ Futebol de Sábado</h2>
      <p className="mt-1 text-zinc-400">
        {formatDate(game.date)} • {game.time.slice(0, 5)} • {game.location}
      </p>
      <ConfirmationButtons value={confirmed} onChange={onConfirm} className="mt-6 grid gap-3 sm:grid-cols-3" />
      <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-xl bg-zinc-900 p-3">
          <div className="text-lg font-black text-emerald-400">{counts.vou}</div>
          <div className="text-zinc-500">Vão</div>
        </div>
        <div className="rounded-xl bg-zinc-900 p-3">
          <div className="text-lg font-black text-red-400">{counts.naoVou}</div>
          <div className="text-zinc-500">Não vão</div>
        </div>
        <div className="rounded-xl bg-zinc-900 p-3">
          <div className="text-lg font-black text-amber-400">{counts.talvez}</div>
          <div className="text-zinc-500">Talvez</div>
        </div>
      </div>
    </section>
  );
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
