import { CalendarDays, Users, ShieldCheck, Trophy, Clock3, CheckCircle2 } from "lucide-react";
import type { Player } from "../types";
import { ConfirmationButtons, type ConfirmationStatus } from "../components/ui/ConfirmationButtons";

interface HomePageProps {
  confirmed: ConfirmationStatus | null;
  onConfirm: (status: ConfirmationStatus) => void;
  activePlayers: Player[];
  goalkeeperCount: number;
  averageOverall: number;
}

export function HomePage({ confirmed, onConfirm, activePlayers, goalkeeperCount, averageOverall }: HomePageProps) {
  const summary: [string, string | number, typeof Users][] = [
    ["Confirmados", activePlayers.length, Users],
    ["Goleiros", goalkeeperCount, ShieldCheck],
    ["Overall médio", averageOverall.toFixed(2), Trophy],
    ["Status", "ABERTO", Clock3],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <CalendarDays />
          <div>
            <h1 className="text-2xl font-black">Futebol de Sábado</h1>
            <p className="text-zinc-400">Próximo jogo • Sábado • 20:00</p>
          </div>
        </div>
        <div className="mb-5 rounded-2xl bg-zinc-900 p-5">
          <div className="text-sm text-zinc-400">Local</div>
          <div className="font-bold">Arena Society</div>
        </div>
        <p className="mb-3 font-bold">Você vai?</p>
        <ConfirmationButtons value={confirmed} onChange={onConfirm} />
        {confirmed && (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 size={16} /> Status: {confirmed}
          </div>
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
