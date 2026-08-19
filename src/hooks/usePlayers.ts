import { useEffect, useState } from "react";
import type { Player } from "../types";
import { fetchActivePlayers } from "../services/playersService";

interface UsePlayersResult {
  players: Player[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function usePlayers(): UsePlayersResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchActivePlayers()
      .then((data) => {
        if (!cancelled) setPlayers(data);
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
  }, [reloadKey]);

  return { players, loading, error, reload: () => setReloadKey((k) => k + 1) };
}
