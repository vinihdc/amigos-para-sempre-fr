// TODO (Fase 2 - Jogadores): substituir estes dados fixos pelo perfil real
// do jogador autenticado, buscado via services/playersService a partir do
// AuthSession.playerId. Mantido assim para não introduzir mock adicional
// escondido dentro de uma tela nova sem sinalizar (Seção 36).
export function ProfilePage() {
  return (
    <section className="card p-6">
      <h2 className="text-2xl font-black">Vinicius</h2>
      <p className="mt-2 text-zinc-400">Mensalista</p>
      <div className="mt-5 text-3xl font-black">⭐ 8.2</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Meio-campo", "Lateral", "Ponta"].map((p) => (
          <span className="badge bg-zinc-800" key={p}>
            {p}
          </span>
        ))}
      </div>
    </section>
  );
}
