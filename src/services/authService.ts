import { supabase } from "../lib/supabase";
import type { AuthSession } from "../types";

/**
 * Supabase Auth trabalha nativamente com email/senha. Para reproduzir a
 * experiência de "telefone + PIN" (Seção 11) sem reinventar hashing,
 * mapeamos o telefone para um e-mail sintético e usamos o PIN como senha —
 * o GoTrue (Supabase Auth) cuida do hashing seguro.
 */
function phoneToSyntheticEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@players.amigosparasempre.internal`;
}

export async function signInWithPhoneAndPin(
  phone: string,
  pin: string
): Promise<void> {
  if (!supabase) {
    throw new Error(
      "Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
    );
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: phoneToSyntheticEmail(phone),
    password: pin,
  });
  if (error) {
    throw new Error("Telefone ou PIN inválidos.");
  }
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Carrega o perfil de jogador (id, is_admin) vinculado à sessão atual.
 * Retorna null se não houver sessão ou o jogador ainda não tiver conta vinculada.
 */
export async function loadCurrentSession(): Promise<AuthSession | null> {
  if (!supabase) return null;

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const { data: player, error } = await supabase
    .from("players")
    .select("id,is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !player) return null;

  return { userId: user.id, playerId: player.id, isAdmin: player.is_admin };
}
