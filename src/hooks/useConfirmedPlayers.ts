import { useEffect, useState } from "react";
import type { Player } from "../types";
import { fetchConfirmedPlayers } from "../services/gamesService";

interface UseConfirmedPlayersResult {
  linePlayers: Player[];
  goalkeepers: Player[];
  loading: boolean;
  error: string | null;
}

export function useConfirmedPlayers(gameId: string | null): UseConfirmedPlayersResult {
  const [linePlayers, setLinePlayers] = useState<Player[]>([]);
  const [goalkeepers, setGoalkeepers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setLinePlayers([]);
      setGoalkeepers([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchConfirmedPlayers(gameId)
      .then((result) => {
        if (cancelled) return;
        setLinePlayers(result.linePlayers);
        setGoalkeepers(result.goalkeepers);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return { linePlayers, goalkeepers, loading, error };
}
