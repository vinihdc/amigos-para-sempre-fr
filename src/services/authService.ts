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

/**
 * O Supabase Auth exige senha com pelo menos 6 caracteres por padrão — um
 * PIN de 4 dígitos sozinho não passaria. Um prefixo fixo (não é segredo,
 * é igual para todo mundo) resolve isso sem exigir mexer nas configurações
 * do projeto Supabase. A segurança real continua sendo a do PIN de 4
 * dígitos (10 mil combinações) — mesmo nível de proteção de um PIN de
 * banco, mitigado pelo rate-limit padrão do GoTrue contra força bruta.
 */
function derivePassword(pin: string): string {
  return `afs-${pin}`;
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
    password: derivePassword(pin),
  });
  if (error) {
    throw new Error("Telefone ou PIN inválidos.");
  }
}

/**
 * Autocadastro de jogador: cria a conta no Supabase Auth e o registro em
 * `players` com valores administrativos travados (RLS da migration 0003
 * garante isso mesmo que este código seja contornado). Um administrador
 * pode depois ajustar overall/tipo/posições pela tela Admin.
 */
export async function signUpWithPhoneAndPin(
  name: string,
  phone: string,
  pin: string
): Promise<void> {
  if (!supabase) {
    throw new Error(
      "Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
    );
  }
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("O PIN deve ter exatamente 4 dígitos.");
  }

  const email = phoneToSyntheticEmail(phone);
  const password = derivePassword(pin);

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      throw new Error("Já existe uma conta com esse telefone.");
    }
    throw new Error(error.message);
  }

  if (!data.user || !data.session) {
    throw new Error(
      "Conta criada, mas sem sessão ativa. Verifique se 'Confirm email' está desativado em " +
        "Authentication > Providers > Email no painel do Supabase."
    );
  }

  const { error: insertError } = await supabase.from("players").insert({
    auth_user_id: data.user.id,
    name,
    phone,
    type: "AVULSO",
    overall: 5.0,
    is_goalkeeper: false,
    active: true,
    is_admin: false,
  });

  if (insertError) {
    throw new Error(`Conta criada, mas falha ao registrar o perfil: ${insertError.message}`);
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
