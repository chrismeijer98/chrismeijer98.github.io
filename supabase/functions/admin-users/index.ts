// ============================================================
// HOUSE OF PILOTS — Edge Function: admin-users
// ============================================================
// Beheert gebruikers met de service-role (server-side). Wordt
// aangeroepen vanuit admin.html. Beveiligd met een gedeeld
// beheer-token (env ADMIN_TOKEN) via de header 'x-admin-token'.
//
// Acties (JSON body { action, ... }):
//   list                                  -> alle gebruikers
//   create   { full_name, role, password} -> maakt/migreert Auth-account
//   set_password { user_id, password }    -> wachtwoord wijzigen
//   delete   { user_id }                  -> verwijdert account
//
// Deploy (eenmalig, vereist Supabase CLI):
//   supabase functions deploy admin-users --no-verify-jwt
//   supabase secrets set ADMIN_TOKEN="<kies-een-sterk-token>"
//   supabase secrets set AUTH_EMAIL_DOMAIN="hop.local"   (optioneel)
// SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn automatisch beschikbaar.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Moet identiek zijn aan loginSlug() in js/api.js
function loginSlug(name: string): string {
  return (name || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const DOMAIN = Deno.env.get("AUTH_EMAIL_DOMAIN") || "hop.local";
function loginEmail(name: string): string {
  return `${loginSlug(name)}@${DOMAIN}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // ---- token-check ----
  const token = req.headers.get("x-admin-token");
  const expected = Deno.env.get("ADMIN_TOKEN");
  if (!expected || token !== expected) return json({ error: "Niet geautoriseerd" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Ongeldige body" }, 400); }
  const action = body?.action;

  try {
    // ---- LIST ----
    if (action === "list") {
      const { data, error } = await admin
        .from("users")
        .select("id, full_name, role, created_at, auth_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ users: data });
    }

    // ---- CREATE (of bestaand profiel migreren naar Auth) ----
    if (action === "create") {
      const full_name = String(body.full_name || "").trim();
      const role = body.role === "coach" ? "coach" : "pilot";
      const password = String(body.password || "");
      if (!full_name || !password) return json({ error: "Naam en wachtwoord verplicht" }, 400);

      const email = loginEmail(full_name);

      // Bestaat er al een profielrij met deze naam? (legacy-migratie)
      const { data: existing } = await admin
        .from("users").select("id, auth_id").ilike("full_name", full_name).maybeSingle();

      // Maak het Auth-account aan
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
      });
      if (cErr) throw cErr;
      const authId = created.user!.id;

      let profile;
      if (existing) {
        const { data, error } = await admin.from("users")
          .update({ auth_id: authId, role, email, updated_at: new Date().toISOString() })
          .eq("id", existing.id).select("id, full_name, role, created_at, auth_id").single();
        if (error) throw error;
        profile = data;
      } else {
        const { data, error } = await admin.from("users")
          .insert({ full_name, role, email, auth_id: authId })
          .select("id, full_name, role, created_at, auth_id").single();
        if (error) throw error;
        profile = data;
      }
      return json({ user: profile });
    }

    // ---- SET PASSWORD (en zo nodig alsnog een Auth-account koppelen) ----
    if (action === "set_password") {
      const user_id = String(body.user_id || "");
      const password = String(body.password || "");
      if (!user_id || !password) return json({ error: "user_id en wachtwoord verplicht" }, 400);

      const { data: u, error: uErr } = await admin
        .from("users").select("id, full_name, role, auth_id").eq("id", user_id).single();
      if (uErr) throw uErr;

      if (u.auth_id) {
        const { error } = await admin.auth.admin.updateUserById(u.auth_id, { password });
        if (error) throw error;
      } else {
        // Nog geen Auth-account → maak er nu één en koppel
        const email = loginEmail(u.full_name);
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
          user_metadata: { full_name: u.full_name, role: u.role },
        });
        if (cErr) throw cErr;
        const { error: lErr } = await admin.from("users")
          .update({ auth_id: created.user!.id, email, updated_at: new Date().toISOString() })
          .eq("id", u.id);
        if (lErr) throw lErr;
      }
      return json({ ok: true });
    }

    // ---- DELETE ----
    if (action === "delete") {
      const user_id = String(body.user_id || "");
      if (!user_id) return json({ error: "user_id verplicht" }, 400);

      const { data: u } = await admin.from("users").select("id, auth_id").eq("id", user_id).maybeSingle();
      if (u?.auth_id) {
        const { error } = await admin.auth.admin.deleteUser(u.auth_id);
        if (error) throw error;
      }
      const { error: dErr } = await admin.from("users").delete().eq("id", user_id);
      if (dErr) throw dErr;
      return json({ ok: true });
    }

    return json({ error: "Onbekende actie" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || "Serverfout" }, 400);
  }
});
