// ============================================================
// Supabase backend
// ============================================================

(function () {
  function db() {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.HOP_CONFIG;
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  function guard(error) {
    if (error) throw error;
  }

  async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const buf  = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const api = {
    // ---- Auth ----
    async loginUser({ full_name, password }) {
      const hash = await hashPassword(password);
      const { data, error } = await db()
        .from('users')
        .select('*')
        .ilike('full_name', full_name)
        .eq('password_hash', hash)
        .maybeSingle();
      guard(error);
      if (!data) throw new Error('Naam of wachtwoord onjuist');
      return data;
    },

    // ---- User management (admin) ----
    async createUser({ full_name, role, password }) {
      const hash = await hashPassword(password);
      const { data, error } = await db()
        .from('users')
        .insert({ full_name, role, password_hash: hash })
        .select()
        .single();
      guard(error);
      return data;
    },

    async updatePassword({ user_id, password }) {
      const hash = await hashPassword(password);
      const { data, error } = await db()
        .from('users')
        .update({ password_hash: hash, updated_at: new Date().toISOString() })
        .eq('id', user_id)
        .select()
        .single();
      guard(error);
      return data;
    },

    async listUsers() {
      const { data, error } = await db()
        .from('users')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false });
      guard(error);
      return data;
    },

    async deleteUser(id) {
      const { error } = await db().from('users').delete().eq('id', id);
      guard(error);
    },

    // ---- Feedback sessions ----
    async createSession({ code, subject_name, subject_role, owner_id }) {
      const { data, error } = await db()
        .from('feedback_sessions')
        .insert({ code, subject_name, subject_role: subject_role || null, owner_id: owner_id || null })
        .select()
        .single();
      guard(error);
      return data;
    },

    async getSession(code) {
      const { data, error } = await db()
        .from('feedback_sessions')
        .select('*')
        .eq('code', code)
        .maybeSingle();
      guard(error);
      return data;
    },

    async listSessions(owner_id) {
      let q = db()
        .from('feedback_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (owner_id) q = q.eq('owner_id', owner_id);
      const { data, error } = await q;
      guard(error);
      return data;
    },

    async deleteSession(code) {
      const { error } = await db().from('feedback_sessions').delete().eq('code', code);
      guard(error);
      return null;
    },

    // ---- Feedback responses ----
    async listResponses(code) {
      const { data, error } = await db()
        .from('feedback_responses')
        .select('*')
        .eq('session_code', code);
      guard(error);
      return data;
    },

    async postResponse(row) {
      const client = db();
      const insert = {
        session_code:    row.session_code,
        respondent_name: row.respondent_name,
        respondent_role: row.respondent_role || null,
        is_self:         !!row.is_self,
        ratings:         row.ratings || {},
        notes:           row.notes || {},
      };
      if (insert.is_self) {
        await client.from('feedback_responses')
          .delete()
          .eq('session_code', insert.session_code)
          .eq('is_self', true);
      }
      const { data, error } = await client
        .from('feedback_responses')
        .insert(insert)
        .select()
        .single();
      guard(error);
      return data;
    },

    async patchResponse(id, patch) {
      const { data, error } = await db()
        .from('feedback_responses')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      guard(error);
      return data;
    },

    // ---- PCP scores ----
    async listScores(user_id) {
      const { data, error } = await db()
        .from('pcp_scores')
        .select('*')
        .eq('user_id', user_id);
      guard(error);
      return data;
    },

    async upsertScore({ user_id, scored_by, competence_id, value, note }) {
      const { data, error } = await db()
        .from('pcp_scores')
        .upsert(
          { user_id, scored_by, competence_id, value, note: note || '', updated_at: new Date().toISOString() },
          { onConflict: 'user_id,scored_by,competence_id' }
        )
        .select()
        .single();
      guard(error);
      return data;
    },
  };

  // ---- Session (localStorage) ----
  const LS_SESSION = 'hop_session_v1';
  const session = {
    get()  { try { return JSON.parse(localStorage.getItem(LS_SESSION)) || null; } catch { return null; } },
    set(d) { localStorage.setItem(LS_SESSION, JSON.stringify(d)); },
    clear(){ localStorage.removeItem(LS_SESSION); },
    require(redirect) {
      const s = this.get();
      if (!s || !s.user_id) { window.location.href = redirect || 'index.html'; return null; }
      return s;
    },
  };

  window.HopApi     = api;
  window.HopSession = session;
})();
