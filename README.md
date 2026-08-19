# Amigos Para Sempre FR
## Gestão do Futebol Society

Aplicação mobile-first para gerenciamento semanal do futebol society.

### Stack
- React + TypeScript + Vite
- Tailwind CSS v4
- Lucide React
- Supabase PostgreSQL/Auth/Storage/Realtime
- Algoritmo isolado em `src/algorithms/balance.ts`

### Regras principais
- Mínimo administrativo: 15 jogadores.
- Montagem automática somente a partir de 18 jogadores de linha.
- 18–23: 3 times.
- 24+: 4 times.
- Mínimo absoluto: 6 jogadores de linha por time.
- Não há máximo de jogadores por time.
- Mensalistas têm prioridade sobre avulsos.
- Overall é o principal critério de equilíbrio.
- Posições são secundárias.
- Goleiros são tratados separadamente e não ocupam vaga de linha.

### Arquitetura
```
src/
  algorithms/   → geração de times, isolada da UI
  components/   → layout (Header, TabNav) e UI reutilizável
  hooks/        → useAuth, usePlayers
  lib/          → cliente Supabase
  pages/        → uma tela por arquivo (Home, Game, Teams, Admin, Profile, Login)
  services/     → acesso a dados (auth, players) — abstrai Supabase x mock
  types/        → tipos compartilhados
supabase/
  schema.sql              → schema base
  migrations/0002_*.sql    → vínculo players ↔ auth.users + RLS de campos administrativos
  functions/create-player-account/ → Edge Function para admin criar login de jogador
```

### Status real de cada parte (nada aqui é "fingido" — Seção 36)
| Parte | Status |
|---|---|
| Algoritmo de balanceamento | ✅ Implementado |
| Schema + RLS básica | ✅ Implementado |
| Login telefone+PIN (tela + client) | ✅ Implementado (via e-mail sintético + Supabase Auth) |
| RLS protegendo campos administrativos | ✅ Implementado na migration 0002 |
| Edge Function de criação de conta/PIN | 🟡 Preparada, **não implantada/testada** contra projeto real |
| CRUD real de jogadores | 🔴 Pendente (tela Admin ainda lista mock/dados só de leitura) |
| Confirmação de presença real (game_confirmations) | 🔴 Pendente — hoje é só estado local em memória |
| Mensalidades, histórico, notificações | 🔴 Pendente |

### Instalação
1. `npm install`
2. Copie `.env.example` para `.env`.
3. Informe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Execute, nesta ordem, no SQL Editor do Supabase: `supabase/schema.sql` e depois `supabase/migrations/0002_player_auth_link.sql`.
5. (Opcional, para criar logins de jogadores) `supabase functions deploy create-player-account`.
6. `npm run dev`

Sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` configuradas, o app roda em **modo demonstração**: mostra um aviso na tela, usa jogadores mockados e pula o login (não há backend real para autenticar).

### Build
`npm run build`
