import { useCallback, useEffect, useState } from "react";
import type { ConfirmationCounts, ConfirmationStatus, Game } from "../types";
import { fetchNextGame, fetchMyConfirmation, fetchConfirmationCounts, setConfirmation } from "../services/gamesService";

interface UseNextGameResult {
  game: Game | null;
  myStatus: ConfirmationStatus | null;
  counts: ConfirmationCounts;
  loading: boolean;
  error: string | null;
  confirm: (status: ConfirmationStatus) => Promise<void>;
  reload: () => void;
}

export function useNextGame(playerId: string | null): UseNextGameResult {
  const [game, setGame] = useState<Game | null>(null);
  const [myStatus, setMyStatus] = useState<ConfirmationStatus | null>(null);
  const [counts, setCounts] = useState<ConfirmationCounts>({ vou: 0, naoVou: 0, talvez: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextGame = await fetchNextGame();
      setGame(nextGame);

      if (nextGame) {
        const [status, gameCounts] = await Promise.all([
          playerId ? fetchMyConfirmation(nextGame.id, playerId) : Promise.resolve(null),
          fetchConfirmationCounts(nextGame.id),
        ]);
        setMyStatus(status);
        setCounts(gameCounts);
      } else {
        setMyStatus(null);
        setCounts({ vou: 0, naoVou: 0, talvez: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar o jogo.");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirm(status: ConfirmationStatus) {
    if (!game || !playerId) return;
    setError(null);
    try {
      await setConfirmation(game.id, playerId, status);
      setMyStatus(status);
      const gameCounts = await fetchConfirmationCounts(game.id);
      setCounts(gameCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar presença.");
      throw err;
    }
  }

  return { game, myStatus, counts, loading, error, confirm, reload: load };
}
