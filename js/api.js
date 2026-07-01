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

    // ==========================================================
    // COACHING MODULE
    // ==========================================================
    async listCoaches() {
      const { data, error } = await db()
        .from('users').select('id, full_name, role').eq('role', 'coach')
        .order('full_name', { ascending: true });
      guard(error);
      return data;
    },

    // Voegt coach_name / pilot_name toe aan relatie-rijen
    async _attachRelNames(rels) {
      if (!rels || !rels.length) return rels || [];
      const ids = [...new Set(rels.flatMap((r) => [r.coach_id, r.pilot_id]))];
      const { data, error } = await db().from('users').select('id, full_name, role').in('id', ids);
      guard(error);
      const map = {};
      (data || []).forEach((u) => { map[u.id] = u; });
      rels.forEach((r) => {
        r.coach_name = (map[r.coach_id] || {}).full_name || '';
        r.pilot_name = (map[r.pilot_id] || {}).full_name || '';
      });
      return rels;
    },

    async createRelation({ coach_id, pilot_id, created_by }) {
      const { data, error } = await db()
        .from('coaching_relations')
        .insert({ coach_id, pilot_id, created_by: created_by || null })
        .select().single();
      guard(error);
      return data;
    },

    async deleteRelation(id) {
      const { error } = await db().from('coaching_relations').delete().eq('id', id);
      guard(error);
    },

    async listRelationsForCoach(coach_id) {
      const { data, error } = await db()
        .from('coaching_relations').select('*').eq('coach_id', coach_id)
        .order('created_at', { ascending: true });
      guard(error);
      return this._attachRelNames(data || []);
    },

    async listRelationsForPilot(pilot_id) {
      const { data, error } = await db()
        .from('coaching_relations').select('*').eq('pilot_id', pilot_id)
        .order('created_at', { ascending: true });
      guard(error);
      return this._attachRelNames(data || []);
    },

    async getRelation(id) {
      const { data, error } = await db()
        .from('coaching_relations').select('*').eq('id', id).maybeSingle();
      guard(error);
      if (!data) return null;
      const [r] = await this._attachRelNames([data]);
      return r;
    },

    // ---- Gesprekken ----
    async listSessionsFor(relation_id) {
      const { data, error } = await db()
        .from('coaching_sessions').select('*').eq('relation_id', relation_id)
        .order('scheduled_at', { ascending: false });
      guard(error);
      return data;
    },
    async createCoachSession({ relation_id, title, scheduled_at, created_by }) {
      const { data, error } = await db()
        .from('coaching_sessions')
        .insert({ relation_id, title: title || null, scheduled_at: scheduled_at || null, created_by: created_by || null })
        .select().single();
      guard(error);
      return data;
    },
    async updateCoachSession(id, patch) {
      const { data, error } = await db()
        .from('coaching_sessions').update(patch).eq('id', id).select().single();
      guard(error);
      return data;
    },
    async deleteCoachSession(id) {
      const { error } = await db().from('coaching_sessions').delete().eq('id', id);
      guard(error);
    },

    // ---- Notities ----
    async listNotesFor(relation_id) {
      const { data, error } = await db()
        .from('coaching_notes').select('*').eq('relation_id', relation_id)
        .order('created_at', { ascending: false });
      guard(error);
      return data;
    },
    async createNote({ relation_id, session_id, author_id, body, shared }) {
      const { data, error } = await db()
        .from('coaching_notes')
        .insert({ relation_id, session_id: session_id || null, author_id: author_id || null, body: body || '', shared: !!shared })
        .select().single();
      guard(error);
      return data;
    },
    async updateNote(id, patch) {
      const { data, error } = await db()
        .from('coaching_notes')
        .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      guard(error);
      return data;
    },
    async deleteNote(id) {
      const { error } = await db().from('coaching_notes').delete().eq('id', id);
      guard(error);
    },

    // ---- Actiepunten ----
    async listActionsFor(relation_id) {
      const { data, error } = await db()
        .from('coaching_actions').select('*').eq('relation_id', relation_id)
        .order('created_at', { ascending: false });
      guard(error);
      return data;
    },
    async createAction({ relation_id, session_id, title, due_date, created_by }) {
      const { data, error } = await db()
        .from('coaching_actions')
        .insert({ relation_id, session_id: session_id || null, title, due_date: due_date || null, created_by: created_by || null })
        .select().single();
      guard(error);
      return data;
    },
    async updateAction(id, patch) {
      const { data, error } = await db()
        .from('coaching_actions')
        .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      guard(error);
      return data;
    },
    async deleteAction(id) {
      const { error } = await db().from('coaching_actions').delete().eq('id', id);
      guard(error);
    },

    // ---- Ontwikkeladviezen ----
    async listAdviceFor(relation_id) {
      const { data, error } = await db()
        .from('coaching_advice').select('*').eq('relation_id', relation_id)
        .order('created_at', { ascending: false });
      guard(error);
      return data;
    },
    async createAdvice({ relation_id, coach_id, body }) {
      const { data, error } = await db()
        .from('coaching_advice')
        .insert({ relation_id, coach_id: coach_id || null, body: body || '' })
        .select().single();
      guard(error);
      return data;
    },
    async deleteAdvice(id) {
      const { error } = await db().from('coaching_advice').delete().eq('id', id);
      guard(error);
    },

    // ==========================================================
    // AGENDA & EVENTS
    // ==========================================================
    async listEvents() {
      const { data, error } = await db()
        .from('events').select('*').order('starts_at', { ascending: true });
      guard(error);
      return data || [];
    },
    async getEvent(id) {
      const { data, error } = await db().from('events').select('*').eq('id', id).maybeSingle();
      guard(error);
      return data;
    },
    async createEvent(row) {
      const { data, error } = await db().from('events').insert({
        title: row.title, category: row.category || null, description: row.description || null,
        location: row.location || null, starts_at: row.starts_at || null, ends_at: row.ends_at || null,
        capacity: (row.capacity === '' || row.capacity == null) ? null : Number(row.capacity),
        created_by: row.created_by || null,
      }).select().single();
      guard(error);
      return data;
    },
    async updateEvent(id, patch) {
      const { data, error } = await db().from('events')
        .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      guard(error);
      return data;
    },
    async deleteEvent(id) {
      const { error } = await db().from('events').delete().eq('id', id);
      guard(error);
    },

    // Alle aanmeldingen (voor tellingen + eigen status in de lijst)
    async listAllSignups() {
      const { data, error } = await db().from('event_signups').select('event_id, user_id, status');
      guard(error);
      return data || [];
    },
    // Aanmeldingen van één evenement, met naam (voor detailweergave)
    async listSignups(event_id) {
      const { data, error } = await db()
        .from('event_signups')
        .select('id, user_id, status, created_at, users(full_name)')
        .eq('event_id', event_id)
        .order('created_at', { ascending: true });
      guard(error);
      return (data || []).map((s) => ({
        id: s.id, user_id: s.user_id, status: s.status, created_at: s.created_at,
        full_name: (s.users || {}).full_name || '',
      }));
    },

    // Aanmelden: vol -> automatisch op de wachtlijst
    async signUp(event_id, user_id) {
      const { data: ex } = await db().from('event_signups')
        .select('id, status').eq('event_id', event_id).eq('user_id', user_id).maybeSingle();
      if (ex) return ex;
      const { data: ev, error: evErr } = await db().from('events').select('capacity').eq('id', event_id).single();
      guard(evErr);
      let status = 'registered';
      if (ev.capacity != null) {
        const { count, error: cErr } = await db().from('event_signups')
          .select('id', { count: 'exact', head: true }).eq('event_id', event_id).eq('status', 'registered');
        guard(cErr);
        if ((count || 0) >= ev.capacity) status = 'waitlist';
      }
      const { data, error } = await db().from('event_signups')
        .insert({ event_id, user_id, status }).select().single();
      guard(error);
      return data;
    },

    // Afmelden: bij een vrijgekomen plek schuift de eerste wachtlijster door
    async cancelSignup(event_id, user_id) {
      const { data: mine } = await db().from('event_signups')
        .select('id, status').eq('event_id', event_id).eq('user_id', user_id).maybeSingle();
      if (!mine) return;
      const { error } = await db().from('event_signups').delete().eq('id', mine.id);
      guard(error);
      if (mine.status !== 'registered') return;
      const { data: ev } = await db().from('events').select('capacity').eq('id', event_id).maybeSingle();
      if (!ev || ev.capacity == null) return;
      const { count } = await db().from('event_signups')
        .select('id', { count: 'exact', head: true }).eq('event_id', event_id).eq('status', 'registered');
      if ((count || 0) >= ev.capacity) return;
      const { data: next } = await db().from('event_signups')
        .select('id').eq('event_id', event_id).eq('status', 'waitlist')
        .order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (next) await db().from('event_signups').update({ status: 'registered' }).eq('id', next.id);
    },

    // ==========================================================
    // LAB-GROEPEN
    // ==========================================================
    async listGroups() {
      const { data, error } = await db().from('lab_groups').select('*').order('created_at', { ascending: false });
      guard(error);
      return data || [];
    },
    async getGroup(id) {
      const { data, error } = await db().from('lab_groups').select('*').eq('id', id).maybeSingle();
      guard(error);
      return data;
    },
    async createGroup({ name, description, self_enroll, created_by, member_ids }) {
      const { data, error } = await db().from('lab_groups')
        .insert({ name, description: description || null, self_enroll: !!self_enroll, created_by: created_by || null })
        .select().single();
      guard(error);
      if (member_ids && member_ids.length) await this.setGroupMembers(data.id, member_ids);
      return data;
    },
    async updateGroup(id, patch) {
      const { data, error } = await db().from('lab_groups').update(patch).eq('id', id).select().single();
      guard(error);
      return data;
    },
    async deleteGroup(id) {
      const { error } = await db().from('lab_groups').delete().eq('id', id);
      guard(error);
    },
    async listGroupsForUser(user_id) {
      const { data, error } = await db().from('lab_group_members').select('group_id').eq('user_id', user_id);
      guard(error);
      const ids = (data || []).map((r) => r.group_id);
      if (!ids.length) return [];
      const { data: rows, error: e2 } = await db().from('lab_groups').select('*').in('id', ids).order('created_at', { ascending: false });
      guard(e2);
      return rows || [];
    },

    // ---- Leden ----
    async listGroupMembers(group_id) {
      const { data, error } = await db().from('lab_group_members')
        .select('user_id, users(full_name, role)').eq('group_id', group_id);
      guard(error);
      return (data || []).map((m) => ({ user_id: m.user_id, full_name: (m.users || {}).full_name || '', role: (m.users || {}).role || 'pilot' }));
    },
    async setGroupMembers(group_id, member_ids) {
      const client = db();
      const { error: delErr } = await client.from('lab_group_members').delete().eq('group_id', group_id);
      guard(delErr);
      if (member_ids && member_ids.length) {
        const rows = member_ids.map((user_id) => ({ group_id, user_id }));
        const { error } = await client.from('lab_group_members').insert(rows);
        guard(error);
      }
    },
    async addGroupMember(group_id, user_id) {
      const { error } = await db().from('lab_group_members').upsert({ group_id, user_id }, { onConflict: 'group_id,user_id' });
      guard(error);
    },
    async removeGroupMember(group_id, user_id) {
      const { error } = await db().from('lab_group_members').delete().eq('group_id', group_id).eq('user_id', user_id);
      guard(error);
    },

    // ---- Bestanden (storage 'lab-docs', pad groups/<id>/...) ----
    async listGroupFiles(group_id) {
      const { data, error } = await db().from('lab_group_files')
        .select('id, name, path, size, uploaded_by, created_at, users(full_name)')
        .eq('group_id', group_id).order('created_at', { ascending: false });
      guard(error);
      return (data || []).map((f) => ({ ...f, uploader: (f.users || {}).full_name || '' }));
    },
    async uploadGroupFile(group_id, file, user_id) {
      const client = db();
      const safe = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `groups/${group_id}/${Date.now()}-${safe}`;
      const { error: upErr } = await client.storage.from('lab-docs').upload(path, file, { upsert: false, contentType: file.type || undefined });
      guard(upErr);
      const { data, error } = await client.from('lab_group_files')
        .insert({ group_id, name: file.name, path, size: file.size || null, uploaded_by: user_id || null })
        .select().single();
      guard(error);
      return data;
    },
    async deleteGroupFile(id, path) {
      const client = db();
      if (path) { try { await client.storage.from('lab-docs').remove([path]); } catch (e) { /* noop */ } }
      const { error } = await client.from('lab_group_files').delete().eq('id', id);
      guard(error);
    },

    // ---- Taken ----
    async listGroupTasks(group_id) {
      const { data, error } = await db().from('lab_group_tasks').select('*').eq('group_id', group_id).order('created_at', { ascending: false });
      guard(error);
      return data || [];
    },
    async createTask(row) {
      const { data, error } = await db().from('lab_group_tasks').insert({
        group_id: row.group_id, title: row.title, assignee_id: row.assignee_id || null,
        priority: row.priority || 'normal', due_date: row.due_date || null, created_by: row.created_by || null,
      }).select().single();
      guard(error);
      return data;
    },
    async updateTask(id, patch) {
      const { data, error } = await db().from('lab_group_tasks').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      guard(error);
      return data;
    },
    async deleteTask(id) {
      const { error } = await db().from('lab_group_tasks').delete().eq('id', id);
      guard(error);
    },

    // ---- Forum ----
    async listThreads(group_id) {
      const { data, error } = await db().from('lab_group_threads')
        .select('id, title, created_by, created_at, users(full_name)').eq('group_id', group_id).order('created_at', { ascending: false });
      guard(error);
      return (data || []).map((t) => ({ ...t, author: (t.users || {}).full_name || '' }));
    },
    async createThread({ group_id, title, created_by, body }) {
      const { data, error } = await db().from('lab_group_threads')
        .insert({ group_id, title, created_by: created_by || null }).select().single();
      guard(error);
      if (body) await this.createPost({ thread_id: data.id, group_id, author_id: created_by, body });
      return data;
    },
    async deleteThread(id) {
      const { error } = await db().from('lab_group_threads').delete().eq('id', id);
      guard(error);
    },
    async listPosts(thread_id) {
      const { data, error } = await db().from('lab_group_posts')
        .select('id, author_id, body, created_at, users(full_name)').eq('thread_id', thread_id).order('created_at', { ascending: true });
      guard(error);
      return (data || []).map((p) => ({ ...p, author: (p.users || {}).full_name || '' }));
    },
    async createPost({ thread_id, group_id, author_id, body }) {
      const { data, error } = await db().from('lab_group_posts')
        .insert({ thread_id, group_id, author_id: author_id || null, body: body || '' }).select().single();
      guard(error);
      return data;
    },

    // ---- Notulen ----
    async listMinutes(group_id) {
      const { data, error } = await db().from('lab_group_minutes').select('*').eq('group_id', group_id).order('meeting_date', { ascending: false });
      guard(error);
      return data || [];
    },
    async createMinutes({ group_id, title, body, meeting_date, created_by }) {
      const { data, error } = await db().from('lab_group_minutes')
        .insert({ group_id, title, body: body || '', meeting_date: meeting_date || null, created_by: created_by || null }).select().single();
      guard(error);
      return data;
    },
    async deleteMinutes(id) {
      const { error } = await db().from('lab_group_minutes').delete().eq('id', id);
      guard(error);
    },

    // ---- Chat ----
    async listMessages(group_id) {
      const { data, error } = await db().from('lab_group_messages')
        .select('id, author_id, body, created_at, users(full_name)').eq('group_id', group_id)
        .order('created_at', { ascending: true }).limit(300);
      guard(error);
      return (data || []).map((m) => ({ ...m, author: (m.users || {}).full_name || '' }));
    },
    async sendMessage({ group_id, author_id, body }) {
      const { data, error } = await db().from('lab_group_messages')
        .insert({ group_id, author_id: author_id || null, body }).select('id, author_id, body, created_at').single();
      guard(error);
      return data;
    },
    subscribeMessages(group_id, onInsert) {
      const channel = db().channel('lab-chat-' + group_id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lab_group_messages', filter: 'group_id=eq.' + group_id },
          (payload) => onInsert(payload.new))
        .subscribe();
      return channel;
    },
    unsubscribe(channel) { try { db().removeChannel(channel); } catch (e) { /* noop */ } },

    // ==========================================================
    // OEFENINGEN — unlocks + scores
    // ==========================================================
    async listUnlocks(candidate_id) {
      const { data, error } = await db().from('exercise_unlocks').select('category_id').eq('candidate_id', candidate_id);
      guard(error);
      return (data || []).map((r) => r.category_id);
    },
    async setUnlock(candidate_id, category_id, unlocked, unlocked_by) {
      if (unlocked) {
        const { error } = await db().from('exercise_unlocks')
          .upsert({ candidate_id, category_id, unlocked_by: unlocked_by || null }, { onConflict: 'candidate_id,category_id' });
        guard(error);
      } else {
        const { error } = await db().from('exercise_unlocks').delete().eq('candidate_id', candidate_id).eq('category_id', category_id);
        guard(error);
      }
    },
    async listExerciseScores(candidate_id) {
      const { data, error } = await db().from('exercise_scores').select('*').eq('candidate_id', candidate_id).order('created_at', { ascending: true });
      guard(error);
      return data || [];
    },
    async saveExerciseScore({ candidate_id, category_id, type_id, score, scale_type }) {
      const { data, error } = await db().from('exercise_scores')
        .insert({ candidate_id, category_id, type_id, score, scale_type: scale_type || 'percentage' })
        .select().single();
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
