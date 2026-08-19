import { useCallback, useEffect, useState } from "react";
import type { Player } from "../types";
import {
  fetchAllPlayersForAdmin,
  createPlayer,
  updatePlayer,
  deactivatePlayer,
  reactivatePlayer,
  type PlayerInput,
} from "../services/playersService";

interface UsePlayerAdminResult {
  players: Player[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  create: (input: PlayerInput) => Promise<void>;
  update: (id: string, input: PlayerInput) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  reactivate: (id: string) => Promise<void>;
}

export function usePlayerAdmin(): UsePlayerAdminResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllPlayersForAdmin();
      setPlayers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar jogadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function runSaving(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    players,
    loading,
    error,
    saving,
    create: (input) => runSaving(() => createPlayer(input)),
    update: (id, input) => runSaving(() => updatePlayer(id, input)),
    deactivate: (id) => runSaving(() => deactivatePlayer(id)),
    reactivate: (id) => runSaving(() => reactivatePlayer(id)),
  };
}
