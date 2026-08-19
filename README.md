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

### Instalação
1. `npm install`
2. Copie `.env.example` para `.env`.
3. Informe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Execute `supabase/schema.sql` no SQL Editor do Supabase.
5. `npm run dev`

### Build
`npm run build`

> O PIN deve ser armazenado somente como hash no backend. A autenticação por telefone + PIN pode ser conectada ao Supabase Auth/Edge Function em produção sem alterar o algoritmo.
