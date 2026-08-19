import { ConfirmationButtons, type ConfirmationStatus } from "../components/ui/ConfirmationButtons";

interface GamePageProps {
  confirmed: ConfirmationStatus | null;
  onConfirm: (status: ConfirmationStatus) => void;
}

export function GamePage({ confirmed, onConfirm }: GamePageProps) {
  return (
    <section className="card p-6">
      <h2 className="text-2xl font-black">⚽ Futebol de Sábado</h2>
      <p className="mt-1 text-zinc-400">Sábado • 20:00 • Arena Society</p>
      <ConfirmationButtons
        value={confirmed}
        onChange={onConfirm}
        className="mt-6 grid gap-3 sm:grid-cols-3"
      />
    </section>
  );
}
