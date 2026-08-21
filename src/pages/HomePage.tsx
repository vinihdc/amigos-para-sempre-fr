import { CalendarDays, Users, ShieldCheck, Trophy, Clock3, CheckCircle2, MapPin } from "lucide-react";
import type { ConfirmationStatus, Game, Player } from "../types";
import { ConfirmationButtons } from "../components/ui/ConfirmationButtons";

interface HomePageProps {
  game: Game | null;
  confirmed: ConfirmationStatus | null;
  onConfirm: (status: ConfirmationStatus) => void;
  checkedInAt: string | null;
  onCheckIn: () => void;
  activePlayers: Player[];
  goalkeeperCount: number;
  averageOverall: number;
}

export function HomePage({
  game,
  confirmed,
  onConfirm,
  checkedInAt,
  onCheckIn,
  activePlayers,
  goalkeeperCount,
  averageOverall,
}: HomePageProps) {
  const summary: [string, string | number, typeof Users][] = [
    ["Confirmados", activePlayers.length, Users],
    ["Goleiros", goalkeeperCount, ShieldCheck],
    ["Overall médio", averageOverall.toFixed(2), Trophy],
    ["Status", game?.status ?? "—", Clock3],
  ];

  // Check-in só faz sentido pra quem confirmou VOU/TALVEZ (o banco também
  // valida isso — migration 0007) e só abre 1h antes do horário marcado.
  // Essa janela é regra de UX, não de segurança, por isso fica só aqui.
  const canCheckIn = game && (confirmed === "VOU" || confirmed === "TALVEZ");
  const checkInWindowOpen = game ? isCheckInWindowOpen(game) : false;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <CalendarDays />
          <div>
            <h1 className="text-2xl font-black">Futebol de Sábado</h1>
            <p className="text-zinc-400">
              {game ? `Próximo jogo • ${formatDate(game.date)} • ${game.time.slice(0, 5)}` : "Nenhum jogo agendado"}
            </p>
          </div>
        </div>
        <div className="mb-5 rounded-2xl bg-zinc-900 p-5">
          <div className="text-sm text-zinc-400">Local</div>
          <div className="font-bold">{game?.location ?? "A definir"}</div>
        </div>
        {game ? (
          <>
            <p className="mb-3 font-bold">Você vai?</p>
            <ConfirmationButtons value={confirmed} onChange={onConfirm} />
            {confirmed && (
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 size={16} /> Status: {confirmed}
              </div>
            )}

            {canCheckIn && (
              <div className="mt-5 border-t border-white/10 pt-5">
                {checkedInAt ? (
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                    <MapPin size={16} /> Você chegou às {formatTime(checkedInAt)}
                  </div>
                ) : checkInWindowOpen ? (
                  <button onClick={onCheckIn} className="btn btn-primary w-full">
                    CHEGUEI
                  </button>
                ) : (
                  <p className="text-sm text-zinc-500">
                    Check-in libera 1h antes do jogo ({subtractHours(game!.time, 1)}).
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-500">O administrador ainda não agendou o próximo jogo.</p>
        )}
      </section>
      <section className="card p-6">
        <h2 className="mb-4 text-xl font-black">Resumo</h2>
        <div className="grid grid-cols-2 gap-3">
          {summary.map(([label, value, Icon]) => (
            <div className="rounded-2xl bg-zinc-900 p-4" key={label}>
              <Icon size={18} className="mb-2 text-zinc-400" />
              <div className="text-xs text-zinc-500">{label}</div>
              <div className="text-xl font-black">{value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function subtractHours(time: string, hours: number): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const total = (h * 60 + m - hours * 60 + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function isCheckInWindowOpen(game: Game): boolean {
  const gameDateTime = new Date(`${game.date}T${game.time}`);
  const windowStart = new Date(gameDateTime.getTime() - 60 * 60 * 1000);
  return new Date() >= windowStart;
}
