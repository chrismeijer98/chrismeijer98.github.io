// ============================================================
// Lokale "backend" — alles in localStorage (geen server nodig)
// ------------------------------------------------------------
// Tabellen (zie db/schema.sql voor het denkmodel):
//   hop.users              — gebruikers
//   hop.feedback_sessions  — sessies per piloot
//   hop.feedback_responses — ingevulde antwoorden (inclusief zelfreflectie)
//   hop.pcp_scores         — PCP competentie-scores
// ============================================================

(function () {
  const TABLES = ['users', 'feedback_sessions', 'feedback_responses', 'pcp_scores'];
  const key = (t) => `hop.${t}`;

  function read(table) {
    try { return JSON.parse(localStorage.getItem(key(table))) || []; }
    catch (e) { return []; }
  }
  function write(table, rows) {
    localStorage.setItem(key(table), JSON.stringify(rows));
  }
  function uid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  const now = () => new Date().toISOString();

  // Helper zodat de API async-achtig blijft (drop-in vervangen van fetch-calls)
  const ok = (v) => Promise.resolve(v);

  const api = {
    // ---- Users ----
    findOrCreateUser({ full_name, email, role }) {
      const users = read('users');
      const existing = users.find((u) => u.full_name === full_name);
      if (existing) {
        // Houd rol up-to-date als die wijzigt
        if (role && existing.role !== role) {
          existing.role = role; existing.updated_at = now();
          write('users', users);
        }
        return ok(existing);
      }
      const u = {
        id: uid(),
        full_name,
        email: email || null,
        role: role || 'pilot',
        created_at: now(),
      };
      users.push(u); write('users', users);
      return ok(u);
    },

    // ---- Feedback sessions ----
    createSession({ code, subject_name, subject_role, owner_id }) {
      const sessions = read('feedback_sessions');
      if (sessions.some((s) => s.code === code)) {
        return Promise.reject(new Error('Sessiecode bestaat al'));
      }
      const s = {
        code,
        subject_name,
        subject_role: subject_role || null,
        owner_id: owner_id || null,
        created_at: now(),
      };
      sessions.push(s); write('feedback_sessions', sessions);
      return ok(s);
    },
    getSession(code) {
      const s = read('feedback_sessions').find((x) => x.code === code);
      return ok(s || null);
    },
    listSessions(owner_id) {
      let rows = read('feedback_sessions');
      if (owner_id) rows = rows.filter((r) => r.owner_id === owner_id);
      rows = [...rows].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      return ok(rows);
    },
    deleteSession(code) {
      write('feedback_sessions', read('feedback_sessions').filter((s) => s.code !== code));
      write('feedback_responses', read('feedback_responses').filter((r) => r.session_code !== code));
      return ok(null);
    },

    // ---- Feedback responses ----
    listResponses(code) {
      const rows = read('feedback_responses')
        .filter((r) => r.session_code === code)
        .sort((a, b) => (a.submitted_at || '').localeCompare(b.submitted_at || ''));
      return ok(rows);
    },
    postResponse(row) {
      const rows = read('feedback_responses');
      const r = {
        id: uid(),
        session_code: row.session_code,
        respondent_name: row.respondent_name,
        respondent_role: row.respondent_role || null,
        is_self: !!row.is_self,
        ratings: row.ratings || {},
        notes: row.notes || {},
        submitted_at: now(),
      };
      // Uniek zelfreflectie-antwoord per sessie
      if (r.is_self) {
        const idx = rows.findIndex((x) => x.session_code === r.session_code && x.is_self);
        if (idx >= 0) rows.splice(idx, 1);
      }
      rows.push(r); write('feedback_responses', rows);
      return ok(r);
    },
    patchResponse(id, patch) {
      const rows = read('feedback_responses');
      const r = rows.find((x) => x.id === id);
      if (!r) return Promise.reject(new Error('Response niet gevonden'));
      Object.assign(r, patch);
      r.submitted_at = now();
      write('feedback_responses', rows);
      return ok(r);
    },

    // ---- PCP scores ----
    listScores(user_id) {
      return ok(read('pcp_scores').filter((s) => s.user_id === user_id));
    },
    upsertScore({ user_id, scored_by, competence_id, value, note }) {
      const rows = read('pcp_scores');
      let r = rows.find((x) =>
        x.user_id === user_id &&
        x.scored_by === scored_by &&
        x.competence_id === competence_id);
      if (r) {
        r.value = value;
        r.note = note || '';
        r.updated_at = now();
      } else {
        r = {
          id: uid(),
          user_id, scored_by, competence_id,
          value,
          note: note || '',
          created_at: now(),
          updated_at: now(),
        };
        rows.push(r);
      }
      write('pcp_scores', rows);
      return ok(r);
    },

    // ---- Maintenance ----
    exportAll() {
      const dump = {};
      TABLES.forEach((t) => dump[t] = read(t));
      return dump;
    },
    importAll(dump) {
      TABLES.forEach((t) => {
        if (dump && Array.isArray(dump[t])) write(t, dump[t]);
      });
    },
    clearAll() {
      TABLES.forEach((t) => localStorage.removeItem(key(t)));
    },
  };

  // ------------------------------------------------------------
  // Lichtgewicht sessiebeheer (wie is er ingelogd)
  // ------------------------------------------------------------
  const LS_SESSION = 'hop_session_v1';
  const session = {
    get() {
      try { return JSON.parse(localStorage.getItem(LS_SESSION)) || null; }
      catch (e) { return null; }
    },
    set(data) { localStorage.setItem(LS_SESSION, JSON.stringify(data)); },
    clear() { localStorage.removeItem(LS_SESSION); },
    require(redirect) {
      const s = this.get();
      if (!s || !s.user_id) {
        window.location.href = redirect || 'index.html';
        return null;
      }
      return s;
    },
  };

  window.HopApi = api;
  window.HopSession = session;
})();
