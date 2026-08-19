import { useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(phone, pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <div className="text-2xl font-black">⚽ Amigos Para Sempre FR</div>
          <div className="text-xs text-zinc-400">Gestão do Futebol Society</div>
        </div>
        <label className="mb-1 block text-sm text-zinc-400">Telefone</label>
        <input
          className="mb-4 w-full rounded-xl bg-zinc-900 p-3 outline-none"
          placeholder="(11) 91234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          required
        />
        <label className="mb-1 block text-sm text-zinc-400">PIN (4 dígitos)</label>
        <input
          className="mb-4 w-full rounded-xl bg-zinc-900 p-3 outline-none"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          inputMode="numeric"
          maxLength={4}
          type="password"
          required
        />
        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogIn size={16} /> {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
