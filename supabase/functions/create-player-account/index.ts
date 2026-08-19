// Edge Function: create-player-account
//
// STATUS: preparada, ainda não implantada/testada contra um projeto Supabase
// real (Seção 36 — não fingir que está funcionando até ser implantada e
// validada com `supabase functions deploy`).
//
// MOTIVO DE EXISTIR:
// Criar o login (telefone+PIN) de um jogador exige criar um usuário em
// auth.users com a service role key — que NUNCA pode estar no frontend
// (Seção 10). Por isso isso roda como Edge Function, não no cliente.
//
// Só administradores podem chamar esta função (verificado abaixo antes de
// qualquer escrita).
//
// Body esperado: { playerId: string, phone: string, pin: string }

import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Cliente com o token do chamador, só para checar se é admin.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerUser } = await callerClient.auth.getUser();
    if (!callerUser.user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerPlayer } = await admin
      .from("players")
      .select("is_admin")
      .eq("auth_user_id", callerUser.user.id)
      .maybeSingle();

    if (!callerPlayer?.is_admin) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem criar contas." }), { status: 403 });
    }

    const { playerId, phone, pin } = await req.json();
    if (!playerId || !phone || !pin) {
      return new Response(JSON.stringify({ error: "playerId, phone e pin são obrigatórios." }), { status: 400 });
    }
    if (!/^\d{4}$/.test(pin)) {
      return new Response(JSON.stringify({ error: "PIN deve ter exatamente 4 dígitos." }), { status: 400 });
    }

    const digits = phone.replace(/\D/g, "");
    const syntheticEmail = `${digits}@players.amigosparasempre.internal`;

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: pin,
      email_confirm: true,
    });
    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
    }

    const { error: linkError } = await admin
      .from("players")
      .update({ auth_user_id: newUser.user.id, phone })
      .eq("id", playerId);

    if (linkError) {
      // Reverte o usuário criado para não deixar conta órfã.
      await admin.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: linkError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
