import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function Header() {
  const { status, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <div>
          <div className="text-lg font-black">⚽ Amigos Para Sempre FR</div>
          <div className="text-xs text-zinc-400">Gestão do Futebol Society</div>
        </div>
        {status === "authenticated" ? (
          <button onClick={signOut} className="btn btn-muted flex items-center gap-2">
            <LogOut size={16} /> Sair
          </button>
        ) : (
          <button className="btn btn-muted flex items-center gap-2">
            <LogIn size={16} /> Entrar
          </button>
        )}
      </div>
    </header>
  );
}
