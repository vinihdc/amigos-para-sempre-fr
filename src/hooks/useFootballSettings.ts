import { useCallback, useEffect, useState } from "react";
import type { FootballSettings } from "../types";
import {
  DEFAULT_FOOTBALL_SETTINGS,
  fetchFootballSettings,
  saveFootballSettings,
} from "../services/settingsService";

export function useFootballSettings() {
  const [settings, setSettings] = useState<FootballSettings>(DEFAULT_FOOTBALL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await fetchFootballSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (next: FootballSettings) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveFootballSettings(next);
      setSettings(saved);
      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar configurações.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, error, reload, save };
}
