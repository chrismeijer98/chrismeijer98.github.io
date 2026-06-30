// ============================================================
// Supabase backend
// ============================================================

(function () {
  // Eén gedeelde client (sessie wordt in localStorage bewaard en
  // automatisch ververst). Belangrijk voor Auth + RLS.
  let _client = null;
  function db() {
    if (_client) return _client;
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.HOP_CONFIG;
    _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _client;
  }

  function guard(error) {
    if (error) throw error;
  }

  // Naam -> synthetisch e-mailadres voor Supabase Auth.
  // Moet identiek zijn aan loginSlug() in supabase/functions/admin-users.
  function loginSlug(name) {
    return String(name || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '');
  }
  function loginEmail(name) {
    const domain = (window.HOP_CONFIG && window.HOP_CONFIG.AUTH_EMAIL_DOMAIN) || 'hop.local';
    return loginSlug(name) + '@' + domain;
  }

  // Admin-acties lopen via de Edge Function (service-role, server-side).
  function adminFnUrl() {
    return window.HOP_CONFIG.SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/admin-users';
  }
  async function callAdmin(action, payload, adminToken) {
    const res = await fetch(adminFnUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + window.HOP_CONFIG.SUPABASE_ANON_KEY,
        'x-admin-token': adminToken || '',
      },
      body: JSON.stringify({ action, ...(payload || {}) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('Serverfout (' + res.status + ')'));
    return data;
  }

  const api = {
    // ---- Auth (Supabase Auth; inloggen op naam via synthetisch e-mail) ----
    async loginUser({ full_name, password }) {
      const email = loginEmail(full_name);
      const { data, error } = await db().auth.signInWithPassword({ email, password });
      if (error || !data || !data.user) throw new Error('Naam of wachtwoord onjuist');
      const { data: profile, error: pErr } = await db()
        .from('users')
        .select('id, full_name, role')
        .eq('auth_id', data.user.id)
        .maybeSingle();
      if (pErr || !profile) {
        await db().auth.signOut();
        throw new Error('Account zonder gekoppeld profiel. Neem contact op met de beheerder.');
      }
      return profile;
    },

    async signOut() {
      try { await db().auth.signOut(); } catch (e) { /* noop */ }
    },

    // True als er een geldige Supabase-sessie is (async).
    async hasSession() {
      const { data } = await db().auth.getSession();
      return !!(data && data.session);
    },

    // ---- User management (admin, via Edge Function met beheer-token) ----
    async listUsers(adminToken) {
      const { users } = await callAdmin('list', {}, adminToken);
      return users || [];
    },

    async createUser({ full_name, role, password }, adminToken) {
      const { user } = await callAdmin('create', { full_name, role, password }, adminToken);
      return user;
    },

    async updatePassword({ user_id, password }, adminToken) {
      await callAdmin('set_password', { user_id, password }, adminToken);
      return { ok: true };
    },

    async deleteUser(id, adminToken) {
      await callAdmin('delete', { user_id: id }, adminToken);
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

    // ---- Lab: piloten ophalen (voor indeling) ----
    async listPilots() {
      const { data, error } = await db()
        .from('users')
        .select('id, full_name, role')
        .eq('role', 'pilot')
        .order('full_name', { ascending: true });
      guard(error);
      return data;
    },

    // ---- Lab: assignments (project-instanties) ----
    async createAssignment({ project_id, label, created_by, member_ids }) {
      const { data, error } = await db()
        .from('lab_assignments')
        .insert({ project_id, label: label || null, created_by: created_by || null })
        .select()
        .single();
      guard(error);
      if (member_ids && member_ids.length) await this.setAssignmentMembers(data.id, member_ids);
      return data;
    },

    async setAssignmentMembers(assignment_id, member_ids) {
      const client = db();
      const { error: delErr } = await client
        .from('lab_assignment_members')
        .delete()
        .eq('assignment_id', assignment_id);
      guard(delErr);
      if (member_ids && member_ids.length) {
        const rows = member_ids.map((user_id) => ({ assignment_id, user_id }));
        const { error: insErr } = await client.from('lab_assignment_members').insert(rows);
        guard(insErr);
      }
    },

    // Voegt aan elke assignment een .members array toe ([{user_id, full_name, role}])
    async _attachMembers(assignments) {
      if (!assignments || !assignments.length) return assignments || [];
      const ids = assignments.map((a) => a.id);
      const { data, error } = await db()
        .from('lab_assignment_members')
        .select('assignment_id, user_id, users(full_name, role)')
        .in('assignment_id', ids);
      guard(error);
      const byAssignment = {};
      (data || []).forEach((m) => {
        (byAssignment[m.assignment_id] = byAssignment[m.assignment_id] || []).push({
          user_id: m.user_id,
          full_name: m.users?.full_name || '',
          role: m.users?.role || 'pilot',
        });
      });
      assignments.forEach((a) => { a.members = byAssignment[a.id] || []; });
      return assignments;
    },

    async listAssignments(project_id) {
      let q = db().from('lab_assignments').select('*').order('created_at', { ascending: false });
      if (project_id) q = q.eq('project_id', project_id);
      const { data, error } = await q;
      guard(error);
      return this._attachMembers(data || []);
    },

    async listAssignmentsForPilot(user_id) {
      const { data, error } = await db()
        .from('lab_assignment_members')
        .select('assignment_id')
        .eq('user_id', user_id);
      guard(error);
      const ids = (data || []).map((r) => r.assignment_id);
      if (!ids.length) return [];
      const { data: rows, error: e2 } = await db()
        .from('lab_assignments')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      guard(e2);
      return this._attachMembers(rows || []);
    },

    async getAssignment(id) {
      const { data, error } = await db()
        .from('lab_assignments')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      guard(error);
      if (!data) return null;
      const [withMembers] = await this._attachMembers([data]);
      return withMembers;
    },

    async deleteAssignment(id) {
      const { error } = await db().from('lab_assignments').delete().eq('id', id);
      guard(error);
    },

    // ---- Lab: documenten (Supabase Storage, bucket 'lab-docs') ----
    async uploadAssignmentDocument(assignment_id, file, user_id) {
      const client = db();
      const safe = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${assignment_id}/${Date.now()}-${safe}`;
      const { error: upErr } = await client.storage
        .from('lab-docs')
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      guard(upErr);
      const { data, error } = await client
        .from('lab_assignments')
        .update({
          document_path: path,
          document_name: file.name,
          document_uploaded_by: user_id || null,
          document_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignment_id)
        .select()
        .single();
      guard(error);
      const [withMembers] = await this._attachMembers([data]);
      return withMembers;
    },

    documentUrl(path, downloadName) {
      if (!path) return null;
      const { data } = db().storage
        .from('lab-docs')
        .getPublicUrl(path, downloadName ? { download: downloadName } : undefined);
      return data?.publicUrl || null;
    },

    // Pilot dient het huidige document in → wacht op controle coach
    async submitAssignment(id) {
      const { data, error } = await db()
        .from('lab_assignments')
        .update({ status: 'submitted', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      guard(error);
      return data;
    },

    // Coach geeft feedback: terugsturen (revision) of afronden (completed)
    async reviewAssignment(id, { feedback, final }) {
      const cur = await this.getAssignment(id);
      if (!cur) throw new Error('Opdracht niet gevonden');
      const round = {
        document_path: cur.document_path || null,
        document_name: cur.document_name || null,
        submitted_at:  cur.document_uploaded_at || null,
        feedback:      feedback || '',
        feedback_at:   new Date().toISOString(),
        is_final:      !!final,
      };
      const rounds = Array.isArray(cur.rounds) ? cur.rounds.slice() : [];
      rounds.push(round);
      const { data, error } = await db()
        .from('lab_assignments')
        .update({
          rounds,
          status: final ? 'completed' : 'revision',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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
