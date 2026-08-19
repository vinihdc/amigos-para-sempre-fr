import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

type Mode = "login" | "signup";

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await signIn(phone, pin);
      } else {
        await signUp(name, phone, pin);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir.");
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

        <div className="mb-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`btn ${mode === "login" ? "btn-primary" : "btn-muted"}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`btn ${mode === "signup" ? "btn-primary" : "btn-muted"}`}
          >
            Criar conta
          </button>
        </div>

        {mode === "signup" && (
          <>
            <label className="mb-1 block text-sm text-zinc-400">Nome</label>
            <input
              className="mb-4 w-full rounded-xl bg-zinc-900 p-3 outline-none"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </>
        )}

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
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          maxLength={4}
          type="password"
          required
        />

        {mode === "signup" && (
          <p className="mb-4 text-xs text-zinc-500">
            Sua conta começa como Avulso. Um administrador pode ajustar seu tipo, overall e posições depois.
          </p>
        )}

        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
        >
          {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>
    </div>
  );
}
