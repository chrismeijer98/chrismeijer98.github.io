// ============================================================
// HOUSE OF PILOTS — PORTAL (Dashboard, PCP, Feedback Hub)
// ============================================================
(function () {
  const { h, qs, qsa, escapeHtml, initials, genSessionCode, formatDate, formatDateLong, toast, copyText, ICONS } = window.HopUtil;

  // --------------------------------------------------------
  // Bootstrap: require session, wire header/sidebar/role UI
  // --------------------------------------------------------
  const session = HopSession.require('index.html');
  if (!session) return;

  qs('#nav-user').textContent = `${session.full_name} · ${session.role === 'coach' ? 'Coach' : 'Piloot'}`;
  qs('#btn-logout').addEventListener('click', () => {
    HopSession.clear();
    window.location.href = 'index.html';
  });

  function updateRoleUI() {
    const isCoach = session.role === 'coach';
    qs('#role-badge').innerHTML = `${isCoach ? ICONS.coach : ICONS.user}${isCoach ? 'Coach' : 'Piloot'}`;
    const card = qs('#role-card');
    card.style.background = isCoach ? 'rgba(229,107,62,.1)' : 'rgba(30,74,122,.1)';
    card.style.borderColor = isCoach ? 'rgba(229,107,62,.3)' : 'rgba(30,74,122,.2)';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="color:${isCoach ? 'var(--coral-dark)' : 'var(--navy)'}">
          ${isCoach ? ICONS.coach : ICONS.user}
        </div>
        <div style="font-size:13px;font-weight:600;color:${isCoach ? 'var(--coral-dark)' : 'var(--navy)'}">${isCoach ? 'Coach' : 'Piloot'}</div>
      </div>
      <div style="font-size:11px;color:var(--muted);line-height:1.5">
        ${isCoach ? 'Je scoort en ziet mee, voegt notities toe.' : 'Jouw zelfbeoordeling. Coach kan meekijken.'}
      </div>`;
  }
  updateRoleUI();

  // --------------------------------------------------------
  // Tab routing — 3 secties: Lab / Ontwikkeling / Oefenmateriaal
  // hash: #dashboard | #lab | #oefenmateriaal
  //       #ontwikkeling/pcp[/<catId>]
  //       #ontwikkeling/feedback[/new | /manage/<code>]
  // --------------------------------------------------------
  const TABS = ['dashboard', 'agenda', 'lab', 'ontwikkeling', 'oefenmateriaal', 'praktisch'];
  function currentTab() {
    const h = (location.hash || '#dashboard').replace(/^#/, '').split('/')[0];
    return TABS.includes(h) ? h : 'dashboard';
  }
  function hashParts() {
    return (location.hash || '').replace(/^#/, '').split('/');
  }
  function go(tab, extra = '') {
    location.hash = '#' + tab + (extra ? '/' + extra : '');
  }
  window.addEventListener('hashchange', renderActiveTab);
  qsa('.side-link').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));

  function renderActiveTab() {
    if (window._oefGameCleanup) { try { window._oefGameCleanup(); } catch (e) { /* noop */ } window._oefGameCleanup = null; }
    const tab = currentTab();
    qsa('.side-link').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'agenda') renderAgenda();
    else if (tab === 'lab') renderLab();
    else if (tab === 'ontwikkeling') renderOntwikkeling();
    else if (tab === 'oefenmateriaal') renderOefenmateriaal();
    else if (tab === 'praktisch') renderPraktisch();
    else renderDashboard();
  }
  renderActiveTab();

  // ==========================================================
  // DASHBOARD — overzicht van de 3 onderdelen
  // ==========================================================
  async function renderDashboard() {
    const main = qs('#main');
    const first = (session.full_name || '').split(' ')[0] || '';
    main.innerHTML = `<div class="fade-up">
      <div class="eyebrow">Welkom terug${first ? ', ' + escapeHtml(first) : ''}</div>
      <h1 class="page-title">Jouw dashboard.</h1>
      <p class="page-lead">Alles wat je nodig hebt in het House of Pilots programma.</p>

      <div class="sect-grid">
        <button class="sect-card clickable" id="sect-agenda">
          <div class="sect-ico" style="background:rgba(21,128,61,.12);color:#15803D">${ICONS.calendar}</div>
          <div class="sect-t">Agenda & events</div>
          <div class="sect-d">Alle beurzen, uitjes, trainingsdagen en deadlines. Meld je aan en zet ze in je agenda.</div>
          <div class="sect-foot" id="agenda-status" style="color:#15803D">Openen ${ICONS.arrowRight}</div>
        </button>

        <button class="sect-card clickable" id="sect-lab">
          <div class="sect-ico" style="background:rgba(229,107,62,.14);color:var(--coral-dark)">${ICONS.sparkles}</div>
          <div class="sect-t">Lab</div>
          <div class="sect-d">Werk samen met andere piloten aan praktijkopdrachten, toegewezen door je coach.</div>
          <div class="sect-foot" style="color:var(--coral-dark)">Openen ${ICONS.arrowRight}</div>
        </button>

        <button class="sect-card clickable" id="sect-ontw">
          <div class="sect-ico" style="background:rgba(30,74,122,.14);color:var(--navy)">${ICONS.trend}</div>
          <div class="sect-t">Ontwikkeling</div>
          <div class="sect-d">Jouw competentieprofiel (PCP) en 360° feedback. Breng in kaart waar je staat en waar je groeit.</div>
          <div class="sect-foot" id="ontw-status" style="color:var(--navy)">Openen ${ICONS.arrowRight}</div>
        </button>

        <button class="sect-card clickable" id="sect-oef">
          <div class="sect-ico" style="background:rgba(30,74,122,.12);color:var(--navy)">${ICONS.target}</div>
          <div class="sect-t">Oefeningen</div>
          <div class="sect-d">Oefen voor de pilotenselecties (COMPASS, DLR, PILAPT) op je eigen tempo.</div>
          <div class="sect-foot" style="color:var(--navy)">Openen ${ICONS.arrowRight}</div>
        </button>

        <button class="sect-card clickable" id="sect-prak">
          <div class="sect-ico" style="background:rgba(229,107,62,.12);color:var(--coral-dark)">${ICONS.message}</div>
          <div class="sect-t">Praktische zaken</div>
          <div class="sect-d">Stel vragen aan elkaar, deel dingen over klantpartners, en geef verlof door.</div>
          <div class="sect-foot" id="prak-status" style="color:var(--coral-dark)">Openen ${ICONS.arrowRight}</div>
        </button>
      </div>
    </div>`;

    qs('#sect-agenda').onclick = () => go('agenda');
    qs('#sect-lab').onclick = () => go('lab');
    qs('#sect-ontw').onclick = () => go('ontwikkeling');
    qs('#sect-oef').onclick = () => go('oefenmateriaal');
    qs('#sect-prak').onclick = () => go('praktisch');

    // Verrijk de Agenda-kaart met aantal aankomende events
    try {
      const events = await HopApi.listEvents();
      const cut = Date.now() - 12 * 3600 * 1000;
      const up = events.filter((e) => !e.starts_at || new Date(e.starts_at).getTime() >= cut).length;
      const st = qs('#agenda-status');
      if (st) st.innerHTML = `${up} aankomend event${up === 1 ? '' : 's'} ${ICONS.arrowRight}`;
    } catch (e) { /* tabel bestaat mogelijk nog niet */ }

    // Verrijk de Ontwikkeling-kaart met live voortgang
    try {
      const total = COMPETENCE_CATEGORIES.reduce(
        (s, c) => s + c.competences.reduce((ss, cc) => ss + cc.subcompetences.length + 1, 0), 0);
      const scores = await HopApi.listScores(session.user_id);
      const scored = scores.filter((s) => s.scored_by === session.role).length;
      const sessions = await HopApi.listSessions(session.user_id);
      const pct = total ? Math.round((scored / total) * 100) : 0;
      const st = qs('#ontw-status');
      if (st) st.innerHTML = `PCP ${pct}% · ${sessions.length} feedbacksessie(s) ${ICONS.arrowRight}`;
    } catch (e) { console.warn(e); }

    // Verrijk de Praktische zaken-kaart: coach ziet openstaande verlofaanvragen, piloot het aantal forumtopics
    try {
      const st = qs('#prak-status');
      if (session.role === 'coach') {
        const reqs = await HopApi.listLeaveRequests();
        const pending = reqs.filter((r) => r.status === 'pending').length;
        if (st) st.innerHTML = `${pending} verlofaanvraag${pending === 1 ? '' : 'en'} te beoordelen ${ICONS.arrowRight}`;
      } else {
        const threads = await HopApi.listPracticalThreads();
        if (st) st.innerHTML = `${threads.length} forumtopic${threads.length === 1 ? '' : 's'} ${ICONS.arrowRight}`;
      }
    } catch (e) { /* tabel bestaat mogelijk nog niet */ }
  }

  // ==========================================================
  // LAB / OEFENMATERIAAL — placeholders (later uitwerken)
  // ==========================================================
  function comingSoon(title, lead, icon) {
    qs('#main').innerHTML = `<div class="fade-up">
      <div class="eyebrow">${escapeHtml(title)}</div>
      <h1 class="page-title">${escapeHtml(title)}.</h1>
      <p class="page-lead">${escapeHtml(lead)}</p>
      <div class="card" style="border-style:dashed;text-align:center;padding:60px 24px;color:var(--muted)">
        <div style="display:flex;justify-content:center;margin-bottom:14px;color:var(--navy)">${icon}</div>
        <div class="font-display" style="font-size:20px;color:var(--navy-deep);margin-bottom:6px">Binnenkort beschikbaar</div>
        <div style="font-size:13px">Dit onderdeel wordt later uitgewerkt.</div>
      </div>
    </div>`;
  }
  // Oefeningen-module (zie OEFENINGEN onderaan). hash:
  //   #oefenmateriaal | /c/<catId> | /c/<catId>/voortgang | /c/<catId>/x/<typeId>
  function renderOefenmateriaal() {
    const parts = hashParts();
    if (parts[1] === 'c' && parts[2] && parts[3] === 'x' && parts[4]) {
      if ((INTERACTIVE_EXERCISES[parts[2]] || {})[parts[4]]) return renderInteractivePlayer(parts[2], parts[4]);
      return renderExercisePlayer(parts[2], parts[4]);
    }
    if (parts[1] === 'c' && parts[2] && parts[3] === 'voortgang') return renderOefenProgress(parts[2]);
    if (parts[1] === 'c' && parts[2]) return renderCategoryDetail(parts[2]);
    return renderOefeningenIndex();
  }

  // ==========================================================
  // LAB — projectopdrachten (piloot werkt samen, coach deelt in & beoordeelt)
  // hash: #lab
  //       #lab/p/<assignmentId>   piloot: opdracht openen
  //       #lab/new/<projectId>    coach: nieuwe indeling
  //       #lab/a/<assignmentId>   coach: beheren & beoordelen
  // ==========================================================
  const LAB_LOCK     = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  const LAB_UPLOAD   = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  const LAB_DOWNLOAD = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  const LAB_STATUS = {
    open:      { label: 'Open',                          color: 'var(--navy)',       bg: 'rgba(30,74,122,.12)' },
    submitted: { label: 'Ingediend — wacht op controle', color: 'var(--coral-dark)', bg: 'rgba(229,107,62,.14)' },
    revision:  { label: 'Feedback ontvangen',            color: '#B45309',           bg: 'rgba(217,119,6,.16)' },
    completed: { label: 'Afgerond',                      color: '#15803D',           bg: 'rgba(21,128,61,.14)' },
  };
  function labProject(id) { return (window.LAB_PROJECTS || []).find((p) => p.id === id) || null; }
  function labStatusPill(status) {
    const s = LAB_STATUS[status] || LAB_STATUS.open;
    return `<span class="pill" style="background:${s.bg};color:${s.color}">${s.label}</span>`;
  }
  function labMemberNames(a) {
    return (a.members || []).map((m) => escapeHtml(m.full_name)).join(', ') || '—';
  }
  function labRounds(a, el) {
    const rounds = Array.isArray(a.rounds) ? a.rounds : [];
    if (!rounds.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="card card-lg">
      <div class="lab-section-label">Feedback van de coach</div>
      ${rounds.map((r, i) => `
        <div class="lab-round">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="font-size:12px;font-weight:700;color:var(--coral-dark)">Ronde ${i + 1}</span>
            ${r.is_final ? '<span class="pill" style="background:rgba(21,128,61,.14);color:#15803D">Eindfeedback</span>' : ''}
            <span style="font-size:12px;color:var(--muted)">${r.feedback_at ? formatDate(r.feedback_at) : ''}</span>
          </div>
          <div style="white-space:pre-line;font-size:14px;line-height:1.6">${escapeHtml(r.feedback || '(geen tekst)')}</div>
        </div>`).join('')}
    </div>`;
  }

  // Lab = groepsomgevingen (zie LAB-GROEPEN onderaan).
  function renderLab() {
    const parts = hashParts(); // ['lab', seg1, seg2, ...]
    const isCoach = session.role === 'coach';
    if (isCoach && parts[1] === 'new') return renderGroupForm(null);
    if (isCoach && parts[1] === 'edit' && parts[2]) return renderGroupForm(parts[2]);
    if (parts[1] === 'g' && parts[2]) return renderGroupHome(parts[2], parts[3] || 'overzicht', parts[4]);
    return renderGroupList();
  }

  // ---------- PILOOT: projectoverzicht ----------
  async function renderLabPilotIndex() {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up">
      <div class="eyebrow">Lab</div>
      <h1 class="page-title">Projecten.</h1>
      <p class="page-lead">Werk samen met andere piloten aan praktijkopdrachten. Een project opent zodra de coach je heeft ingedeeld.</p>
      <div id="lab-body"><div class="spinner" style="margin:80px auto"></div></div>
    </div>`;

    let mine = [];
    try { mine = await HopApi.listAssignmentsForPilot(session.user_id); } catch (e) { console.warn(e); }

    const projects = (window.LAB_PROJECTS || []).filter((p) => p.available);
    const cards = projects.map((p) => {
      const forP = mine.filter((a) => a.project_id === p.id);
      if (!forP.length) {
        return `<div class="lab-card locked">
          <div class="lab-lock">${LAB_LOCK}</div>
          <div class="sect-t">${escapeHtml(p.title)}</div>
          <div class="sect-d">${escapeHtml(p.summary)}</div>
          <div class="lab-foot" style="color:var(--muted)">Nog niet ingedeeld door de coach</div>
        </div>`;
      }
      return forP.map((a) => `
        <button class="lab-card clickable" data-open="${a.id}">
          <div class="lab-ico" style="background:rgba(229,107,62,.14);color:var(--coral-dark)">${ICONS.sparkles}</div>
          <div class="sect-t">${escapeHtml(a.label || p.title)}</div>
          <div class="sect-d">Team: ${labMemberNames(a)}</div>
          <div class="lab-foot">${labStatusPill(a.status)}</div>
        </button>`).join('');
    }).join('');

    qs('#lab-body').innerHTML = `<div class="sect-grid">${cards}</div>`;
    qsa('#lab-body [data-open]').forEach((b) =>
      b.addEventListener('click', () => go('lab', 'p/' + b.dataset.open)));
  }

  // ---------- PILOOT: opdracht openen / inleveren ----------
  async function renderLabPilotDetail(id) {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    let a;
    try { a = await HopApi.getAssignment(id); } catch (e) { console.warn(e); }
    const isMember = a && (a.members || []).some((m) => m.user_id === session.user_id);
    if (!a || !isMember) {
      main.innerHTML = `<div class="fade-up">
        <a href="#lab" class="back-link">${ICONS.chevLeft} Terug naar Lab</a>
        <div class="card" style="color:var(--danger)">Je hebt geen toegang tot deze opdracht of hij bestaat niet.</div>
      </div>`;
      return;
    }
    const p = labProject(a.project_id);
    let docUrl = a.document_path ? HopApi.documentUrl(a.document_path, a.document_name) : null;

    main.innerHTML = `<div class="fade-up">
      <a href="#lab" class="back-link">${ICONS.chevLeft} Terug naar Lab</a>
      <div class="eyebrow">Lab · ${escapeHtml(p ? p.title : 'Project')}</div>
      <h1 class="page-title">${escapeHtml(a.label || (p ? p.title : 'Opdracht'))}.</h1>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px">
        ${labStatusPill(a.status)}
        <span style="font-size:13px;color:var(--muted)">Team: ${labMemberNames(a)}</span>
      </div>

      <div class="card card-lg" style="margin-bottom:20px">
        <div class="lab-section-label">De opdracht</div>
        <div style="white-space:pre-line;font-size:14px;line-height:1.65;color:var(--ink)">${escapeHtml(p ? p.opdracht : '')}</div>
      </div>

      <div class="card card-lg" style="margin-bottom:20px">
        <div class="lab-section-label">Document</div>
        <div id="lab-doc"></div>
      </div>

      <div id="lab-rounds"></div>
    </div>`;

    renderPilotDoc();
    labRounds(a, qs('#lab-rounds'));

    function docBlock() {
      return docUrl ? `
        <div class="lab-doc-row">
          ${ICONS.fileText}
          <div style="flex:1;min-width:0">
            <a href="${docUrl}" target="_blank" rel="noopener" style="font-weight:600;color:var(--navy-deep)">${escapeHtml(a.document_name || 'Document')}</a>
            <div style="font-size:12px;color:var(--muted)">Geüpload ${a.document_uploaded_at ? formatDate(a.document_uploaded_at) : ''}</div>
          </div>
          <a class="btn btn-ghost btn-sm" href="${docUrl}" target="_blank" rel="noopener">${LAB_DOWNLOAD} Download</a>
        </div>`
        : `<div style="font-size:13px;color:var(--muted);margin-bottom:6px">Nog geen document geüpload.</div>`;
    }

    function renderPilotDoc() {
      const wrap = qs('#lab-doc');
      if (a.status === 'submitted') {
        wrap.innerHTML = docBlock() + `<div class="lab-note">${ICONS.check} Ingediend. In afwachting van controle door de coach.</div>`;
        return;
      }
      if (a.status === 'completed') {
        wrap.innerHTML = docBlock() + `<div class="lab-note" style="color:#15803D">${ICONS.check} Deze opdracht is afgerond.</div>`;
        return;
      }
      // open / revision → upload + dien in
      wrap.innerHTML = docBlock() + `
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px">
          <input type="file" id="lab-file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none">
          <button class="btn btn-ghost btn-sm" id="lab-pick">${LAB_UPLOAD} ${a.document_path ? 'Vervang document' : 'Document uploaden'}</button>
          <span id="lab-file-name" style="font-size:12px;color:var(--muted)"></span>
        </div>
        <div style="margin-top:16px;border-top:1px dashed var(--sand);padding-top:16px">
          <button class="btn btn-coral" id="lab-submit" ${a.document_path ? '' : 'disabled'}>${ICONS.send} Dien in</button>
          <div style="font-size:12px;color:var(--muted);margin-top:8px">Eén teamlid uploadt namens iedereen. Indienen kan zodra er een document staat.</div>
        </div>`;

      const fileInput = qs('#lab-file');
      qs('#lab-pick').onclick = () => fileInput.click();
      fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;
        qs('#lab-file-name').textContent = 'Uploaden…';
        try {
          a = await HopApi.uploadAssignmentDocument(a.id, file, session.user_id);
          docUrl = HopApi.documentUrl(a.document_path, a.document_name);
          toast('Document geüpload', 'success');
          renderPilotDoc();
        } catch (e) {
          console.error(e);
          toast('Upload mislukt: ' + e.message, 'error', 3500);
          const fn = qs('#lab-file-name'); if (fn) fn.textContent = '';
        }
      };
      qs('#lab-submit').onclick = async () => {
        if (!confirm('Document indienen ter controle door de coach?')) return;
        try {
          await HopApi.submitAssignment(a.id);
          toast('Ingediend', 'success');
          renderLabPilotDetail(a.id);
        } catch (e) { toast('Kon niet indienen', 'error'); }
      };
    }
  }

  // ---------- COACH: projecten + indelingen ----------
  async function renderLabCoachIndex() {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up">
      <div class="eyebrow">Lab · Coach</div>
      <h1 class="page-title">Projecten indelen.</h1>
      <p class="page-lead">Deel piloten in op projecten en beoordeel hun ingeleverde opdrachten.</p>
      <div id="lab-body"><div class="spinner" style="margin:80px auto"></div></div>
    </div>`;

    let all = [];
    try { all = await HopApi.listAssignments(); } catch (e) { console.warn(e); }

    const projects = (window.LAB_PROJECTS || []).filter((p) => p.available);
    qs('#lab-body').innerHTML = projects.map((p) => {
      const list = all.filter((a) => a.project_id === p.id);
      const rows = list.length ? list.map((a) => `
        <div class="lab-assign-row">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(a.label || p.title)}</div>
            <div style="font-size:12px;color:var(--muted)">Team: ${labMemberNames(a)}</div>
          </div>
          ${labStatusPill(a.status)}
          <button class="btn btn-primary btn-sm" data-manage="${a.id}">Beheren</button>
        </div>`).join('')
        : `<div style="font-size:13px;color:var(--muted);padding:8px 0">Nog geen indelingen voor dit project.</div>`;
      return `<div class="card card-lg" style="margin-bottom:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap">
          <div>
            <div class="font-display" style="font-size:20px;font-weight:600;color:var(--navy-deep)">${escapeHtml(p.title)}</div>
            <div style="font-size:13px;color:var(--muted)">${escapeHtml(p.summary)}</div>
          </div>
          <button class="btn btn-coral btn-sm" data-new="${p.id}">${ICONS.plus} Nieuwe indeling</button>
        </div>
        ${rows}
      </div>`;
    }).join('');

    qsa('#lab-body [data-new]').forEach((b) => b.addEventListener('click', () => go('lab', 'new/' + b.dataset.new)));
    qsa('#lab-body [data-manage]').forEach((b) => b.addEventListener('click', () => go('lab', 'a/' + b.dataset.manage)));
  }

  // ---------- COACH: nieuwe indeling ----------
  async function renderLabNew(projectId) {
    const main = qs('#main');
    const p = labProject(projectId);
    if (!p) { main.innerHTML = `<div class="card" style="color:var(--danger)">Onbekend project. <a href="#lab">Terug</a></div>`; return; }
    main.innerHTML = `<div class="fade-up" style="max-width:640px">
      <a href="#lab" class="back-link">${ICONS.chevLeft} Terug naar Lab</a>
      <div class="eyebrow">Nieuwe indeling</div>
      <h1 class="page-title" style="font-size:36px">${escapeHtml(p.title)}.</h1>
      <p class="page-lead">Selecteer de piloten die samen aan dit project werken.</p>
      <div class="card card-lg">
        <div class="field">
          <label class="field-label">Naam van deze indeling (optioneel)</label>
          <input id="lab-label" class="input" placeholder="bv. ${escapeHtml(p.title)} — groep 1">
        </div>
        <div class="field" style="margin-bottom:0">
          <label class="field-label">Piloten</label>
          <div id="lab-pilots"><div class="spinner" style="margin:20px auto"></div></div>
        </div>
        <button class="btn btn-coral" id="lab-create" style="margin-top:18px">Indeling aanmaken ${ICONS.arrowRight}</button>
      </div>
    </div>`;

    let pilots = [];
    try { pilots = await HopApi.listPilots(); } catch (e) { console.warn(e); }
    qs('#lab-pilots').innerHTML = pilots.length
      ? pilots.map((u) => `<label class="lab-check"><input type="checkbox" value="${u.id}"><span>${escapeHtml(u.full_name)}</span></label>`).join('')
      : `<div style="font-size:13px;color:var(--muted)">Nog geen piloten beschikbaar. Maak ze eerst aan in het beheerportaal.</div>`;

    qs('#lab-create').onclick = async () => {
      const ids = qsa('#lab-pilots input:checked').map((c) => c.value);
      if (!ids.length) { toast('Selecteer minstens één piloot', 'error'); return; }
      const btn = qs('#lab-create'); btn.disabled = true; btn.textContent = 'Aanmaken…';
      try {
        const a = await HopApi.createAssignment({
          project_id: projectId, label: qs('#lab-label').value.trim(),
          created_by: session.user_id, member_ids: ids,
        });
        toast('Indeling aangemaakt', 'success');
        go('lab', 'a/' + a.id);
      } catch (e) {
        console.error(e);
        toast('Kon niet aanmaken: ' + e.message, 'error', 3500);
        btn.disabled = false; btn.innerHTML = `Indeling aanmaken ${ICONS.arrowRight}`;
      }
    };
  }

  // ---------- COACH: indeling beheren & beoordelen ----------
  async function renderLabCoachDetail(id) {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    let a;
    try { a = await HopApi.getAssignment(id); } catch (e) { console.warn(e); }
    if (!a) { main.innerHTML = `<div class="card" style="color:var(--danger)">Opdracht niet gevonden. <a href="#lab">Terug</a></div>`; return; }
    const p = labProject(a.project_id);
    const docUrl = a.document_path ? HopApi.documentUrl(a.document_path, a.document_name) : null;

    main.innerHTML = `<div class="fade-up">
      <a href="#lab" class="back-link">${ICONS.chevLeft} Terug naar Lab</a>
      <div class="eyebrow">Lab · ${escapeHtml(p ? p.title : 'Project')}</div>
      <h1 class="page-title" style="font-size:38px">${escapeHtml(a.label || (p ? p.title : 'Opdracht'))}.</h1>
      <div style="margin-bottom:20px">${labStatusPill(a.status)}</div>

      <div class="card card-lg" style="margin-bottom:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap">
          <div class="lab-section-label" style="margin:0">Team</div>
          <button class="btn btn-ghost btn-sm" id="lab-edit-team">Team bewerken</button>
        </div>
        <div id="lab-team"></div>
      </div>

      <div class="card card-lg" style="margin-bottom:20px">
        <div class="lab-section-label">Ingeleverd document</div>
        <div id="lab-doc"></div>
      </div>

      <div id="lab-rounds" style="margin-bottom:20px"></div>

      <div class="card card-lg" style="margin-bottom:20px" id="lab-review-card">
        <div class="lab-section-label">Feedback geven</div>
        <textarea id="lab-fb" class="input" rows="4" placeholder="Schrijf je feedback voor de piloten…"></textarea>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px">
          <button class="btn btn-primary" id="lab-return">${ICONS.send} Stuur terug naar piloten</button>
          <button class="btn btn-coral" id="lab-finish">${ICONS.check} Opdracht afronden</button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:10px">Bij terugsturen kunnen piloten een nieuw document uploaden. Bij afronden is de opdracht klaar (feedback optioneel).</div>
      </div>

      <button class="btn btn-ghost btn-sm" id="lab-del" style="color:var(--danger)">${ICONS.trash} Indeling verwijderen</button>
    </div>`;

    renderTeam();
    renderCoachDoc();
    labRounds(a, qs('#lab-rounds'));
    qs('#lab-review-card').style.display = a.status === 'submitted' ? 'block' : 'none';

    function renderTeam() {
      qs('#lab-team').innerHTML = (a.members || []).length
        ? `<div style="font-size:14px;color:var(--ink)">${labMemberNames(a)}</div>`
        : `<div style="font-size:13px;color:var(--muted)">Nog geen piloten ingedeeld.</div>`;
    }

    qs('#lab-edit-team').onclick = async () => {
      const teamEl = qs('#lab-team');
      teamEl.innerHTML = `<div class="spinner" style="margin:16px auto"></div>`;
      let pilots = [];
      try { pilots = await HopApi.listPilots(); } catch (e) {}
      const current = new Set((a.members || []).map((m) => m.user_id));
      teamEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
          ${pilots.length ? pilots.map((u) => `<label class="lab-check"><input type="checkbox" value="${u.id}" ${current.has(u.id) ? 'checked' : ''}><span>${escapeHtml(u.full_name)}</span></label>`).join('') : '<span style="font-size:13px;color:var(--muted)">Geen piloten beschikbaar.</span>'}
        </div>
        <button class="btn btn-primary btn-sm" id="lab-team-save">Team opslaan</button>
        <button class="btn btn-ghost btn-sm" id="lab-team-cancel">Annuleer</button>`;
      qs('#lab-team-cancel').onclick = renderTeam;
      qs('#lab-team-save').onclick = async () => {
        const ids = qsa('#lab-team input:checked').map((c) => c.value);
        try {
          await HopApi.setAssignmentMembers(a.id, ids);
          a = await HopApi.getAssignment(a.id);
          toast('Team bijgewerkt', 'success');
          renderTeam();
        } catch (e) { toast('Kon team niet opslaan', 'error'); }
      };
    };

    function renderCoachDoc() {
      const wrap = qs('#lab-doc');
      if (!docUrl) { wrap.innerHTML = `<div style="font-size:13px;color:var(--muted)">Nog geen document ingeleverd.</div>`; return; }
      wrap.innerHTML = `
        <div class="lab-doc-row">
          ${ICONS.fileText}
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(a.document_name || 'Document')}</div>
            <div style="font-size:12px;color:var(--muted)">Ingeleverd ${a.document_uploaded_at ? formatDate(a.document_uploaded_at) : ''}</div>
          </div>
          <a class="btn btn-primary btn-sm" href="${docUrl}" target="_blank" rel="noopener">${LAB_DOWNLOAD} Downloaden</a>
        </div>`;
    }

    async function review(final) {
      const feedback = qs('#lab-fb').value.trim();
      if (!final && !feedback) { toast('Schrijf feedback om terug te sturen', 'error'); return; }
      if (!confirm(final ? 'Opdracht afronden?' : 'Opdracht terugsturen naar piloten?')) return;
      try {
        await HopApi.reviewAssignment(a.id, { feedback, final });
        toast(final ? 'Opdracht afgerond' : 'Teruggestuurd naar piloten', 'success');
        renderLabCoachDetail(a.id);
      } catch (e) { console.error(e); toast('Kon niet opslaan: ' + e.message, 'error', 3500); }
    }
    qs('#lab-return').onclick = () => review(false);
    qs('#lab-finish').onclick = () => review(true);

    qs('#lab-del').onclick = async () => {
      if (!confirm('Deze indeling en alle voortgang verwijderen?')) return;
      try { await HopApi.deleteAssignment(a.id); toast('Indeling verwijderd', 'success'); go('lab'); }
      catch (e) { toast('Kon niet verwijderen', 'error'); }
    };
  }

  // ==========================================================
  // ONTWIKKELING — shell met sub-tabs (PCP + 360° feedback)
  // ==========================================================
  function renderOntwikkeling() {
    const parts = hashParts(); // ['ontwikkeling', sub, ...]
    const sub = ['feedback', 'coaching', 'assessment'].includes(parts[1]) ? parts[1] : 'pcp';

    // Volledig-schermsubviews
    if (sub === 'feedback' && parts[2] === 'new') return renderNewSession();
    if (sub === 'feedback' && parts[2] === 'manage' && parts[3]) return renderManageSession(parts[3]);
    if (sub === 'coaching' && parts[2] === 'r' && parts[3]) return renderCoachingRelation(parts[3]);
    if (sub === 'assessment' && parts[2] === 'vullen' && parts[3]) return renderAssessmentFill(parts[3]);
    if (sub === 'assessment' && parts[2] === 'rapport' && parts[3]) return renderAssessmentReportPage(parts[3]);

    qs('#main').innerHTML = `<div class="fade-up">
      <div class="eyebrow">Ontwikkeling</div>
      <div class="tabs" id="ontw-tabs" style="margin-top:10px">
        <button class="tab ${sub === 'pcp' ? 'active' : ''}" data-sub="pcp">PCP — Competenties</button>
        <button class="tab ${sub === 'feedback' ? 'active' : ''}" data-sub="feedback">360° Feedback</button>
        <button class="tab ${sub === 'coaching' ? 'active' : ''}" data-sub="coaching">Coaching</button>
        <button class="tab ${sub === 'assessment' ? 'active' : ''}" data-sub="assessment">Ontwikkelassessment</button>
      </div>
      <div id="ontw-body"></div>
    </div>`;
    qsa('#ontw-tabs .tab').forEach((b) =>
      b.addEventListener('click', () => go('ontwikkeling', b.dataset.sub)));

    if (sub === 'feedback') renderFeedbackHub();
    else if (sub === 'coaching') renderCoachingIndex();
    else if (sub === 'assessment') renderAssessmentIndex();
    else renderPCP(parts[2]);
  }

  // ==========================================================
  // PCP MODULE
  // ==========================================================
  async function renderPCP(catId) {
    const target = qs('#ontw-body');
    target.innerHTML = `<div class="fade-up">
      <h1 class="page-title" style="font-size:30px;margin-top:6px">Competentieprofiel.</h1>
      <p class="page-lead">Scoor per competentie waar je nu staat. Alles wordt automatisch opgeslagen.</p>
      <div class="tabs" id="pcp-tabs"></div>
      <div id="pcp-body"><div class="spinner" style="margin:80px auto"></div></div>
    </div>`;

    // Load both my + other role's scores
    const myScores = {}, otherScores = {};
    let list = [];
    try { list = await HopApi.listScores(session.user_id); } catch (e) { console.warn(e); }
    list.forEach((r) => {
      const bag = r.scored_by === session.role ? myScores : otherScores;
      bag[r.competence_id] = r;
    });

    const activeId = catId || COMPETENCE_CATEGORIES[0].id;

    // Render category tabs
    qs('#pcp-tabs').innerHTML = COMPETENCE_CATEGORIES.map((cat) => `
      <button class="tab ${cat.id === activeId ? 'active' : ''}" data-cat="${cat.id}" style="${cat.id === activeId ? `border-bottom-color:${cat.accent}` : ''}">
        <span class="font-display" style="font-style:italic;color:${cat.accent};font-size:15px">${cat.number}</span>
        ${cat.title}
      </button>`).join('');
    qsa('#pcp-tabs .tab').forEach((b) => {
      b.addEventListener('click', () => go('ontwikkeling', 'pcp/' + b.dataset.cat));
    });

    const cat = COMPETENCE_CATEGORIES.find((c) => c.id === activeId) || COMPETENCE_CATEGORIES[0];
    const body = qs('#pcp-body');
    body.innerHTML = '';
    cat.competences.forEach((comp, idx) =>
      body.appendChild(renderCompBlock(comp, cat.accent, idx, myScores, otherScores))
    );
  }

  function renderCompBlock(comp, accent, idx, myScores, otherScores) {
    const mainScore = myScores[comp.id];
    const subScored = comp.subcompetences.filter((s) => myScores[s.id]?.value).length;
    const totalSub = comp.subcompetences.length;
    const otherRoleLabel = session.role === 'pilot' ? 'coach' : 'piloot';
    const expanded = idx === 0;

    const mainBadge = mainScore?.value
      ? `<span class="pill pill-success" style="background:${MAIN_SCALE.find(s => s.value === mainScore.value).color}15;color:${MAIN_SCALE.find(s => s.value === mainScore.value).color}">
           ${ICONS.check} ${MAIN_SCALE.find(s => s.value === mainScore.value).label}</span>`
      : '';

    const el = h('div', { class: `comp-block ${expanded ? 'expanded' : ''}`, style: { borderLeftColor: accent } });
    el.innerHTML = `
      <button class="comp-head" type="button">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
            <span class="comp-id" style="color:${accent}">${comp.id}</span>
            <h2 class="comp-title">${escapeHtml(comp.title)}${comp.subtitle ? `<span class="comp-subtitle">(${escapeHtml(comp.subtitle)})</span>` : ''}</h2>
          </div>
          <div class="comp-meta">
            <span>${subScored + (mainScore?.value ? 1 : 0)} / ${totalSub + 1} ingevuld</span>
            ${mainBadge}
          </div>
        </div>
        <span class="chev" style="color:var(--muted)">${ICONS.chevRight}</span>
      </button>
      <div class="comp-body" ${expanded ? '' : 'style="display:none"'}></div>`;

    const head = el.querySelector('.comp-head');
    const compBody = el.querySelector('.comp-body');
    head.addEventListener('click', () => {
      const isExp = el.classList.toggle('expanded');
      compBody.style.display = isExp ? '' : 'none';
      if (isExp && !compBody.dataset.filled) {
        fillCompBody(compBody, comp, accent, myScores, otherScores, otherRoleLabel);
        compBody.dataset.filled = '1';
      }
    });

    if (expanded) {
      fillCompBody(compBody, comp, accent, myScores, otherScores, otherRoleLabel);
      compBody.dataset.filled = '1';
    }
    return el;
  }

  function fillCompBody(root, comp, accent, myScores, otherScores, otherRoleLabel) {
    root.innerHTML = `
      <div class="def-box" style="border-left-color:${accent}">
        <div class="def-box-label" style="color:${accent}">Definitie</div>
        ${escapeHtml(comp.description)}
      </div>
      <div id="main-row"></div>
      <div style="margin-top:24px">
        <div style="font-size:11px;letter-spacing:.25em;color:var(--muted);text-transform:uppercase;font-weight:600;margin-bottom:14px;padding-bottom:10px;border-bottom:1px dashed var(--sand)">
          Blijkt uit — subcompetenties
        </div>
        <div id="sub-rows"></div>
      </div>`;

    root.querySelector('#main-row').appendChild(
      buildScoreRow(comp.id, MAIN_SCALE, myScores[comp.id], otherScores[comp.id], otherRoleLabel, accent, true));
    const subs = root.querySelector('#sub-rows');
    comp.subcompetences.forEach((sub) => {
      const wrap = h('div', { class: 'sub-block' });
      wrap.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px;flex-wrap:wrap">
          <span class="comp-id" style="font-size:12px;color:${accent}">${sub.id}</span>
          <h4 class="sub-title">${escapeHtml(sub.title)}</h4>
        </div>
        <p class="sub-desc">${escapeHtml(sub.description)}</p>`;
      wrap.appendChild(buildScoreRow(sub.id, SUB_SCALE, myScores[sub.id], otherScores[sub.id], otherRoleLabel, accent, false));
      subs.appendChild(wrap);
    });
  }

  function buildScoreRow(id, scale, score, otherScore, otherRoleLabel, accent, isMain) {
    const wrap = h('div');
    const scaleEl = h('div', { class: 'scale', style: { marginBottom: '12px' } });
    scale.forEach((opt) => {
      const isActive = score?.value === opt.value;
      const btn = h('button', {
        type: 'button',
        class: `scale-opt ${isMain ? 'main' : ''} ${isActive ? 'active' : ''}`,
        style: isActive ? { background: opt.color, borderColor: opt.color, color: 'white' } : {},
      });
      btn.innerHTML = `<span class="n">${opt.value}</span><span>${opt.label}</span>`;
      btn.addEventListener('click', () => save(opt.value, noteEl.value));
      scaleEl.appendChild(btn);
    });
    wrap.appendChild(scaleEl);

    if (otherScore?.value) {
      const o = h('div', { class: 'other-score' });
      o.innerHTML = `${ICONS.user}<span><strong style="text-transform:capitalize">${escapeHtml(otherRoleLabel)}</strong> scoorde: <strong>${otherScore.value}</strong> — ${scale.find(s => s.value === otherScore.value)?.label || ''}</span>`;
      wrap.appendChild(o);
    }

    const toggle = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' });
    toggle.innerHTML = `${ICONS.pen} <span>${score?.note ? 'Bewerk toelichting' : 'Toelichting toevoegen (optioneel)'}</span>`;
    const noteWrap = h('div', { style: { display: score?.note ? 'block' : 'none', marginTop: '8px' } });
    const noteEl = h('textarea', {
      class: 'input', rows: 2, placeholder: 'Concrete voorbeelden, situaties, of leerdoelen…',
    });
    noteEl.value = score?.note || '';
    noteEl.addEventListener('blur', () => { if (score?.value) save(score.value, noteEl.value); });
    toggle.addEventListener('click', () => {
      noteWrap.style.display = noteWrap.style.display === 'none' ? 'block' : 'none';
    });
    noteWrap.appendChild(noteEl);
    wrap.appendChild(toggle);
    wrap.appendChild(noteWrap);

    async function save(val, note) {
      toast('Opslaan…', 'info', 900);
      try {
        const saved = await HopApi.upsertScore({
          user_id: session.user_id, scored_by: session.role,
          competence_id: id, value: val, note: note || '',
        });
        score = Array.isArray(saved) ? saved[0] : saved;
        toast('Opgeslagen', 'success');
        // Update UI: mark active, hide/show note toggle label
        qsa('.scale-opt', scaleEl).forEach((b, i) => {
          const opt = scale[i];
          const isActive = opt.value === val;
          b.classList.toggle('active', isActive);
          b.style.background = isActive ? opt.color : '';
          b.style.borderColor = isActive ? opt.color : '';
          b.style.color = isActive ? 'white' : '';
        });
      } catch (e) { toast('Kon niet opslaan', 'error', 2500); console.error(e); }
    }

    return wrap;
  }

  // ==========================================================
  // FEEDBACK MODULE — hub, new, manage (binnen Ontwikkeling)
  // ==========================================================
  async function renderFeedbackHub() {
    const main = qs('#ontw-body');
    main.innerHTML = `<div class="fade-up">
      <h1 class="page-title" style="font-size:30px;margin-top:6px">Feedback van je omgeving.</h1>
      <p class="page-lead">Vraag minstens 4 mensen uit jouw omgeving (collega's, leidinggevende, vrienden) om je te beoordelen op 11 pilotencompetenties. Zelf vul je ook in. Daarna zie je het rapport naast elkaar.</p>

      <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:20px;margin-bottom:32px">
        <button class="panel" id="fb-new" style="text-align:left;cursor:pointer;color:white">
          <div style="position:relative">
            ${ICONS.plus}
            <div class="font-display" style="font-size:22px;font-weight:600;margin:16px 0 6px">Nieuwe feedbackronde starten</div>
            <div style="font-size:13px;color:rgba(255,255,255,.75);line-height:1.55">Maak een sessie aan met unieke code. Deel die met minimaal 4 feedbackgevers. Jij vult ook zelf in.</div>
          </div>
        </button>

        <div class="card">
          <div style="color:var(--navy);margin-bottom:16px">${ICONS.link}</div>
          <div class="font-display" style="font-size:20px;font-weight:600;color:var(--navy-deep);margin-bottom:6px">Ik heb een code ontvangen</div>
          <div style="font-size:12px;color:var(--muted);line-height:1.55;margin-bottom:14px">Voor feedbackgevers: voer de code in die je ontving.</div>
          <input id="join-code" class="input input-code" placeholder="BV. ST-4F7K" style="margin-bottom:10px">
          <div id="join-err" style="font-size:12px;color:var(--danger);margin-bottom:10px;display:none"></div>
          <button class="btn btn-primary btn-sm" id="btn-join">Verder ${ICONS.arrowRight}</button>
        </div>
      </div>

      <div style="font-size:11px;letter-spacing:.25em;color:var(--muted);text-transform:uppercase;font-weight:600;margin-bottom:12px">Jouw sessies</div>
      <div id="sess-list"><div class="spinner" style="margin:40px auto"></div></div>
    </div>`;

    qs('#fb-new').onclick = () => go('ontwikkeling', 'feedback/new');
    const tryJoin = async () => {
      const code = qs('#join-code').value.trim().toUpperCase();
      if (!code) return;
      try {
        const s = await HopApi.getSession(code);
        if (!s) throw new Error('not found');
        window.location.href = `feedback.html?code=${encodeURIComponent(code)}`;
      } catch (e) {
        const err = qs('#join-err');
        err.textContent = 'Geen sessie gevonden met die code';
        err.style.display = 'block';
      }
    };
    qs('#btn-join').onclick = tryJoin;
    qs('#join-code').addEventListener('keydown', (e) => e.key === 'Enter' && tryJoin());

    // Load sessions + counts
    try {
      const sessions = await HopApi.listSessions(session.user_id);
      if (!sessions.length) {
        qs('#sess-list').innerHTML = `<div class="card" style="border-style:dashed;text-align:center;color:var(--muted)">Nog geen feedbacksessies aangemaakt.</div>`;
        return;
      }
      const list = qs('#sess-list');
      list.innerHTML = '';
      for (const s of sessions) {
        let count = 0;
        try { count = (await HopApi.listResponses(s.code)).length; } catch (e) {}
        const card = h('div', { class: 'card', style: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' } });
        card.innerHTML = `
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
              <span style="font-family:monospace;font-size:14px;font-weight:700;color:var(--coral-dark);letter-spacing:.1em">${escapeHtml(s.code)}</span>
              <span style="color:var(--muted)">·</span>
              <span style="font-size:14px;font-weight:600;color:var(--navy-deep)">${escapeHtml(s.subject_name)}</span>
            </div>
            <div style="font-size:12px;color:var(--muted)">
              ${count} ${count === 1 ? 'respons' : 'responsen'} · aangemaakt ${formatDate(s.created_at)}
            </div>
          </div>
          <button class="btn btn-primary btn-sm" data-act="open">Openen</button>
          <button class="btn btn-ghost btn-sm" data-act="del" title="Verwijder">${ICONS.trash}</button>`;
        card.querySelector('[data-act=open]').onclick = () => go('ontwikkeling', 'feedback/manage/' + s.code);
        card.querySelector('[data-act=del]').onclick = async () => {
          if (!confirm('Sessie en alle antwoorden verwijderen?')) return;
          try { await HopApi.deleteSession(s.code); renderFeedbackHub(); toast('Sessie verwijderd', 'success'); }
          catch (e) { toast('Kon niet verwijderen', 'error'); }
        };
        list.appendChild(card);
      }
    } catch (e) {
      qs('#sess-list').innerHTML = `<div class="card" style="color:var(--danger)">Kon sessies niet laden: ${escapeHtml(e.message)}</div>`;
    }
  }

  // ----------------------------------------------------------
  // NEW SESSION
  // ----------------------------------------------------------
  function renderNewSession() {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up" style="max-width:640px">
      <a href="#ontwikkeling/feedback" class="back-link">${ICONS.chevLeft} Terug</a>
      <h1 class="page-title" style="font-size:38px">Nieuwe feedbackronde.</h1>
      <p class="page-lead">Over wie gaat deze feedback? Daarna maken we de code waarmee anderen kunnen invullen.</p>

      <div class="card card-lg">
        <div class="field">
          <label class="field-label">Naam</label>
          <input id="n-name" class="input" placeholder="bv. Naam" value="${escapeHtml(session.full_name.replace(/\s/g, ''))}">
        </div>
        <div class="field">
          <label class="field-label">Rol / ambitie</label>
          <input id="n-role" class="input" value="Aspirant piloot">
        </div>
        <button class="btn btn-coral" id="n-create" style="margin-top:10px">
          Sessie aanmaken ${ICONS.arrowRight}
        </button>
      </div>
    </div>`;

    qs('#n-create').onclick = async () => {
      const name = qs('#n-name').value.trim();
      const role = qs('#n-role').value.trim();
      if (!name) { toast('Vul een naam in', 'error'); return; }
      const btn = qs('#n-create');
      btn.disabled = true; btn.textContent = 'Aanmaken…';
      try {
        const code = genSessionCode(name);
        await HopApi.createSession({ code, subject_name: name, subject_role: role, owner_id: session.user_id });
        toast('Sessie aangemaakt', 'success');
        go('ontwikkeling', 'feedback/manage/' + code);
      } catch (e) {
        console.error(e);
        toast('Kon sessie niet aanmaken: ' + e.message, 'error', 3000);
        btn.disabled = false; btn.innerHTML = `Sessie aanmaken ${ICONS.arrowRight}`;
      }
    };
  }

  // ----------------------------------------------------------
  // MANAGE SESSION
  // ----------------------------------------------------------
  async function renderManageSession(code) {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    let s;
    try { s = await HopApi.getSession(code); } catch (e) { /* noop */ }
    if (!s) {
      main.innerHTML = `<div class="card" style="color:var(--danger)">Sessie "${escapeHtml(code)}" niet gevonden. <a href="#ontwikkeling/feedback">Terug</a></div>`;
      return;
    }

    const shareUrl = `${location.origin}${location.pathname.replace(/portal\.html$/, '')}feedback.html?code=${encodeURIComponent(code)}`;

    main.innerHTML = `<div class="fade-up">
      <a href="#ontwikkeling/feedback" class="back-link">${ICONS.chevLeft} Terug naar sessies</a>
      <div class="eyebrow">Sessie ${escapeHtml(code)}</div>
      <h1 class="page-title" style="font-size:42px">${escapeHtml(s.subject_name)}.</h1>
      <p class="page-lead">${escapeHtml(s.subject_role || '')} · aangemaakt op ${formatDateLong(s.created_at)}</p>

      <div class="panel" style="margin-bottom:24px">
        <div style="position:relative">
          <div style="font-size:10px;letter-spacing:.3em;color:var(--coral);text-transform:uppercase;margin-bottom:10px;font-weight:600">Deel deze code met feedbackgevers</div>
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;flex-wrap:wrap">
            <div class="code-hero" id="code-big">${escapeHtml(code)}</div>
            <button class="btn btn-sm" id="btn-copy-code" style="background:rgba(255,255,255,.1);color:white;border-color:rgba(255,255,255,.2)">
              ${ICONS.copy} Kopieer code
            </button>
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,.7);margin-bottom:8px">Of deel de directe link:</div>
          <div class="link-box" id="link-box">${escapeHtml(shareUrl)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card card-lg">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div style="font-size:11px;letter-spacing:.2em;color:var(--muted);text-transform:uppercase;font-weight:600" id="resp-count-label">Ingevulde feedback (0)</div>
            <button class="btn btn-ghost btn-sm" id="btn-refresh" title="Vernieuwen">${ICONS.refresh}</button>
          </div>
          <div id="resp-list"><div class="spinner" style="margin:20px auto"></div></div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px">
          <button class="btn btn-coral" id="btn-self">${ICONS.pen} <span id="self-label">Vul zelfreflectie in</span></button>
          <button class="btn btn-primary" id="btn-report">${ICONS.fileText} Rapport bekijken</button>
          <div class="card" style="padding:16px;font-size:12px;color:var(--muted);line-height:1.6">
            ${ICONS.alert}
            <div style="font-weight:600;color:var(--navy-deep);margin-bottom:4px;font-size:13px;margin-top:6px">Tip</div>
            Wacht met het rapport tot minimaal 4 feedbackgevers hebben ingevuld. Dit geeft een betrouwbaarder beeld.
          </div>
        </div>
      </div>
    </div>`;

    qs('#btn-copy-code').onclick = async () => {
      await copyText(code); toast('Code gekopieerd', 'success');
    };
    qs('#link-box').onclick = async () => {
      await copyText(shareUrl); toast('Link gekopieerd', 'success');
    };
    qs('#btn-self').onclick = () => {
      window.location.href = `feedback.html?code=${encodeURIComponent(code)}&self=1`;
    };
    qs('#btn-report').onclick = () => {
      window.location.href = `report.html?code=${encodeURIComponent(code)}`;
    };
    qs('#btn-refresh').onclick = loadResponses;

    async function loadResponses() {
      const list = qs('#resp-list');
      list.innerHTML = `<div class="spinner" style="margin:20px auto"></div>`;
      let rows = [];
      try { rows = await HopApi.listResponses(code); } catch (e) {}
      qs('#resp-count-label').textContent = `Ingevulde feedback (${rows.length})`;
      if (!rows.length) {
        list.innerHTML = `<div style="color:var(--muted);font-size:13px;padding:14px 0">Nog niemand heeft ingevuld.</div>`;
        return;
      }
      const self = rows.find((r) => r.is_self);
      qs('#self-label').textContent = self ? 'Zelfreflectie bewerken' : 'Vul zelfreflectie in';

      list.innerHTML = '';
      if (self) list.appendChild(buildRespRow(self, true));
      rows.filter((r) => !r.is_self).forEach((r) => list.appendChild(buildRespRow(r, false)));
    }

    function buildRespRow(r, isSelf) {
      const row = h('div', { class: 'resp-row' + (isSelf ? ' self' : '') });
      row.innerHTML = `
        <div class="resp-avatar">${initials(r.respondent_name)}</div>
        <div style="flex:1">
          <div class="resp-name">${escapeHtml(r.respondent_name)}
            ${isSelf ? `<span class="pill pill-coral" style="margin-left:8px">ZELFREFLECTIE</span>` : ''}
          </div>
          <div class="resp-meta">${isSelf ? 'Zelfreflectie' : escapeHtml(r.respondent_role || 'Feedbackgever')} · ${formatDate(r.submitted_at)}</div>
        </div>
        <span style="color:${isSelf ? 'var(--coral-dark)' : 'var(--success)'}">${ICONS.check}</span>`;
      return row;
    }
    loadResponses();
  }

  // ==========================================================
  // COACHING MODULE — sub-tab binnen Ontwikkeling
  // hash: #ontwikkeling/coaching                (index, rol-bewust)
  //       #ontwikkeling/coaching/r/<relationId> (traject openen)
  // ==========================================================
  const CO_STATUS = {
    planned:   { label: 'Gepland',     color: 'var(--navy)', bg: 'rgba(30,74,122,.12)' },
    done:      { label: 'Afgerond',    color: '#15803D',     bg: 'rgba(21,128,61,.14)' },
    cancelled: { label: 'Geannuleerd', color: 'var(--muted)', bg: 'rgba(0,0,0,.06)' },
  };
  function coSessionPill(st) {
    const s = CO_STATUS[st] || CO_STATUS.planned;
    return `<span class="pill" style="background:${s.bg};color:${s.color}">${s.label}</span>`;
  }
  function formatDateTime(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }

  function renderCoachingIndex() {
    if (session.role === 'coach') return renderCoachingCoachIndex();
    return renderCoachingPilotIndex();
  }

  // ---------- COACH: deelnemers koppelen & overzicht ----------
  async function renderCoachingCoachIndex() {
    const main = qs('#ontw-body');
    main.innerHTML = `<div class="fade-up">
      <p class="page-lead" style="margin-top:4px">Koppel deelnemers aan een coach en volg hun ontwikkeling.</p>

      <div class="card card-lg" style="margin-bottom:22px">
        <div class="lab-section-label">Deelnemer koppelen</div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
          <div class="field" style="margin:0;flex:1;min-width:180px">
            <label class="field-label">Deelnemer</label>
            <select id="c-pilot" class="input"></select>
          </div>
          <div class="field" style="margin:0;flex:1;min-width:180px">
            <label class="field-label">Coach</label>
            <select id="c-coach" class="input"></select>
          </div>
          <button class="btn btn-coral" id="c-add">${ICONS.plus} Koppelen</button>
        </div>
      </div>

      <div class="lab-section-label">Mijn deelnemers</div>
      <div id="c-list"><div class="spinner" style="margin:40px auto"></div></div>
    </div>`;

    let pilots = [], coaches = [];
    try { [pilots, coaches] = await Promise.all([HopApi.listPilots(), HopApi.listCoaches()]); } catch (e) { console.warn(e); }
    qs('#c-pilot').innerHTML = pilots.length
      ? pilots.map((u) => `<option value="${u.id}">${escapeHtml(u.full_name)}</option>`).join('')
      : `<option value="">Geen deelnemers</option>`;
    qs('#c-coach').innerHTML = coaches.map((u) =>
      `<option value="${u.id}" ${u.id === session.user_id ? 'selected' : ''}>${escapeHtml(u.full_name)}</option>`).join('');

    qs('#c-add').onclick = async () => {
      const pilot_id = qs('#c-pilot').value, coach_id = qs('#c-coach').value;
      if (!pilot_id || !coach_id) { toast('Kies een deelnemer', 'error'); return; }
      try {
        await HopApi.createRelation({ coach_id, pilot_id, created_by: session.user_id });
        toast('Gekoppeld', 'success');
        loadList();
      } catch (e) {
        toast(/duplicate|unique/i.test(e.message) ? 'Deze koppeling bestaat al' : 'Kon niet koppelen', 'error');
      }
    };

    loadList();
    async function loadList() {
      let rels = [];
      try { rels = await HopApi.listRelationsForCoach(session.user_id); } catch (e) { console.warn(e); }
      const el = qs('#c-list');
      if (!rels.length) {
        el.innerHTML = `<div class="card" style="border-style:dashed;text-align:center;color:var(--muted)">Nog geen deelnemers gekoppeld.</div>`;
        return;
      }
      el.innerHTML = rels.map((r) => `
        <div class="lab-assign-row">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(r.pilot_name || 'Deelnemer')}</div>
          </div>
          <button class="btn btn-primary btn-sm" data-open="${r.id}">Openen</button>
          <button class="btn btn-ghost btn-sm" data-unlink="${r.id}" style="color:var(--danger)">${ICONS.trash}</button>
        </div>`).join('');
      qsa('#c-list [data-open]').forEach((b) => b.onclick = () => go('ontwikkeling', 'coaching/r/' + b.dataset.open));
      qsa('#c-list [data-unlink]').forEach((b) => b.onclick = async () => {
        if (!confirm('Koppeling en alle gesprekken/notities verwijderen?')) return;
        try { await HopApi.deleteRelation(b.dataset.unlink); toast('Koppeling verwijderd', 'success'); loadList(); }
        catch (e) { toast('Kon niet verwijderen', 'error'); }
      });
    }
  }

  // ---------- DEELNEMER: eigen traject(en) ----------
  async function renderCoachingPilotIndex() {
    const main = qs('#ontw-body');
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:60px auto"></div></div>`;
    let rels = [];
    try { rels = await HopApi.listRelationsForPilot(session.user_id); } catch (e) { console.warn(e); }

    if (!rels.length) {
      main.innerHTML = `<div class="fade-up">
        <div class="card" style="border-style:dashed;text-align:center;color:var(--muted);padding:50px 24px">
          Je bent nog niet aan een coach gekoppeld. Je coach koppelt je zodra je start.
        </div>
      </div>`;
      return;
    }

    main.innerHTML = `<div class="fade-up">
      <p class="page-lead" style="margin-top:4px">Open je coachingtraject.</p>
      <div id="c-list">${rels.map((r) => `
        <div class="lab-assign-row">
          <div style="flex:1">Coach: <strong>${escapeHtml(r.coach_name || 'Coach')}</strong></div>
          <button class="btn btn-primary btn-sm" data-open="${r.id}">Openen</button>
        </div>`).join('')}</div>
    </div>`;
    qsa('#c-list [data-open]').forEach((b) => b.onclick = () => go('ontwikkeling', 'coaching/r/' + b.dataset.open));
  }

  // ---------- Gedeelde werkomgeving (rol-bewust) ----------
  async function renderCoachingRelation(id) {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    let rel;
    try { rel = await HopApi.getRelation(id); } catch (e) { console.warn(e); }
    const isCoach = session.role === 'coach' && rel && rel.coach_id === session.user_id;
    const isPilot = rel && rel.pilot_id === session.user_id;
    if (!rel || (!isCoach && !isPilot)) {
      main.innerHTML = `<div class="fade-up">
        <a href="#ontwikkeling/coaching" class="back-link">${ICONS.chevLeft} Terug</a>
        <div class="card" style="color:var(--danger)">Geen toegang tot dit coachingtraject.</div>
      </div>`;
      return;
    }
    const otherName = isCoach ? rel.pilot_name : rel.coach_name;

    let sessions = [], notes = [], actions = [], advice = [];
    try {
      [sessions, notes, actions, advice] = await Promise.all([
        HopApi.listSessionsFor(id), HopApi.listNotesFor(id), HopApi.listActionsFor(id), HopApi.listAdviceFor(id),
      ]);
    } catch (e) { console.warn(e); }

    const reload = () => renderCoachingRelation(id);

    main.innerHTML = `<div class="fade-up">
      <a href="#ontwikkeling/coaching" class="back-link">${ICONS.chevLeft} Terug naar Coaching</a>
      <div class="eyebrow">Coaching${isCoach ? ' · deelnemer' : ' · jouw coach'}</div>
      <h1 class="page-title">${escapeHtml(otherName || 'Coaching')}.</h1>
      <p class="page-lead">${isCoach ? 'Volg de voortgang, plan gesprekken en geef feedback.' : 'Plan gesprekken, bewaar notities en volg je actiepunten.'}</p>

      <div class="card card-lg" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
          <div class="lab-section-label" style="margin:0">Coachgesprekken</div>
          <button class="btn btn-ghost btn-sm" id="c-plan">${ICONS.plus} Gesprek plannen</button>
        </div>
        <div id="c-plan-form" style="display:none;margin-bottom:14px"></div>
        <div id="c-sessions"></div>
      </div>

      <div class="card card-lg" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
          <div class="lab-section-label" style="margin:0">Actiepunten</div>
          <button class="btn btn-ghost btn-sm" id="c-act-add">${ICONS.plus} Actiepunt</button>
        </div>
        <div id="c-act-form" style="display:none;margin-bottom:14px"></div>
        <div id="c-actions"></div>
      </div>

      <div class="card card-lg" style="margin-bottom:20px">
        <div class="lab-section-label">Notities${isCoach ? ' (gedeeld door deelnemer)' : ''}</div>
        <div id="c-notes"></div>
      </div>

      <div class="card card-lg" style="margin-bottom:20px">
        <div class="lab-section-label">Ontwikkeladviezen</div>
        <div id="c-advice"></div>
      </div>
    </div>`;

    renderSessions(); renderActions(); renderNotes(); renderAdvice();

    // ---- Gesprekken ----
    qs('#c-plan').onclick = () => {
      const box = qs('#c-plan-form');
      if (box.style.display === 'block') { box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
        <div class="field" style="margin:0;flex:2;min-width:160px"><label class="field-label">Titel</label><input id="c-s-title" class="input" placeholder="bv. Voortgangsgesprek"></div>
        <div class="field" style="margin:0;flex:1;min-width:170px"><label class="field-label">Datum & tijd</label><input id="c-s-when" type="datetime-local" class="input"></div>
        <button class="btn btn-coral btn-sm" id="c-s-save">Plannen</button>
      </div>`;
      qs('#c-s-save').onclick = async () => {
        const title = qs('#c-s-title').value.trim();
        const whenv = qs('#c-s-when').value;
        try {
          await HopApi.createCoachSession({ relation_id: id, title, scheduled_at: whenv ? new Date(whenv).toISOString() : null, created_by: session.user_id });
          toast('Gesprek gepland', 'success'); reload();
        } catch (e) { toast('Kon niet plannen', 'error'); }
      };
    };

    function renderSessions() {
      const el = qs('#c-sessions');
      if (!sessions.length) { el.innerHTML = `<div style="font-size:13px;color:var(--muted)">Nog geen gesprekken gepland.</div>`; return; }
      el.innerHTML = sessions.map((s) => {
        const fb = s.coach_feedback
          ? `<div class="c-fb">${ICONS.message}<div><div style="font-weight:600;font-size:12px;color:var(--navy-deep)">Feedback van coach</div><div style="white-space:pre-line;font-size:14px">${escapeHtml(s.coach_feedback)}</div></div></div>` : '';
        const coachControls = isCoach ? `
          <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">
            <button class="btn btn-ghost btn-sm" data-fb="${s.id}">${ICONS.pen} Feedback</button>
            ${s.status !== 'done' ? `<button class="btn btn-ghost btn-sm" data-done="${s.id}">${ICONS.check} Markeer afgerond</button>` : ''}
            <button class="btn btn-ghost btn-sm" data-del-s="${s.id}" style="color:var(--danger)">${ICONS.trash}</button>
          </div>` : '';
        return `<div class="c-session">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
            <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(s.title || 'Coachgesprek')}</div>
            ${coSessionPill(s.status)}
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;display:flex;align-items:center;gap:6px">${ICONS.calendar} ${formatDateTime(s.scheduled_at) || 'Geen datum'}</div>
          ${fb}
          <div id="c-fb-form-${s.id}"></div>
          ${coachControls}
        </div>`;
      }).join('');

      qsa('#c-sessions [data-done]').forEach((b) => b.onclick = async () => {
        try { await HopApi.updateCoachSession(b.dataset.done, { status: 'done' }); toast('Afgerond', 'success'); reload(); } catch (e) { toast('Mislukt', 'error'); }
      });
      qsa('#c-sessions [data-del-s]').forEach((b) => b.onclick = async () => {
        if (!confirm('Gesprek verwijderen?')) return;
        try { await HopApi.deleteCoachSession(b.dataset.delS); reload(); } catch (e) { toast('Mislukt', 'error'); }
      });
      qsa('#c-sessions [data-fb]').forEach((b) => b.onclick = () => {
        const sid = b.dataset.fb;
        const s = sessions.find((x) => x.id === sid);
        const box = qs('#c-fb-form-' + sid);
        box.innerHTML = `<div style="margin-top:10px">
          <textarea class="input" rows="3" id="c-fb-input-${sid}" placeholder="Feedback voor de deelnemer…">${escapeHtml(s.coach_feedback || '')}</textarea>
          <button class="btn btn-primary btn-sm" style="margin-top:8px" id="c-fb-save-${sid}">Opslaan</button>
        </div>`;
        qs('#c-fb-save-' + sid).onclick = async () => {
          try {
            await HopApi.updateCoachSession(sid, { coach_feedback: qs('#c-fb-input-' + sid).value.trim(), coach_feedback_at: new Date().toISOString() });
            toast('Feedback opgeslagen', 'success'); reload();
          } catch (e) { toast('Mislukt', 'error'); }
        };
      });
    }

    // ---- Actiepunten ----
    qs('#c-act-add').onclick = () => {
      const box = qs('#c-act-form');
      if (box.style.display === 'block') { box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
        <div class="field" style="margin:0;flex:2;min-width:160px"><label class="field-label">Actiepunt</label><input id="c-a-title" class="input" placeholder="bv. Reflectieverslag schrijven"></div>
        <div class="field" style="margin:0;flex:1;min-width:150px"><label class="field-label">Deadline (optioneel)</label><input id="c-a-due" type="date" class="input"></div>
        <button class="btn btn-coral btn-sm" id="c-a-save">Toevoegen</button>
      </div>`;
      qs('#c-a-save').onclick = async () => {
        const title = qs('#c-a-title').value.trim();
        if (!title) { toast('Vul een actiepunt in', 'error'); return; }
        try {
          await HopApi.createAction({ relation_id: id, title, due_date: qs('#c-a-due').value || null, created_by: session.user_id });
          toast('Actiepunt toegevoegd', 'success'); reload();
        } catch (e) { toast('Mislukt', 'error'); }
      };
    };

    function renderActions() {
      const el = qs('#c-actions');
      if (!actions.length) { el.innerHTML = `<div style="font-size:13px;color:var(--muted)">Nog geen actiepunten.</div>`; return; }
      el.innerHTML = actions.map((a) => {
        const done = a.status === 'done';
        return `<div class="c-action">
          <button class="c-check ${done ? 'on' : ''}" data-toggle="${a.id}" title="Status wisselen">${done ? ICONS.check : ''}</button>
          <div style="flex:1">
            <div style="font-weight:500;${done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${escapeHtml(a.title)}</div>
            ${a.due_date ? `<div style="font-size:12px;color:var(--muted)">Deadline: ${formatDate(a.due_date)}</div>` : ''}
          </div>
          <button class="btn btn-ghost btn-sm" data-del-a="${a.id}" style="color:var(--danger)">${ICONS.trash}</button>
        </div>`;
      }).join('');
      qsa('#c-actions [data-toggle]').forEach((b) => b.onclick = async () => {
        const a = actions.find((x) => x.id === b.dataset.toggle);
        try { await HopApi.updateAction(a.id, { status: a.status === 'done' ? 'open' : 'done' }); reload(); } catch (e) { toast('Mislukt', 'error'); }
      });
      qsa('#c-actions [data-del-a]').forEach((b) => b.onclick = async () => {
        if (!confirm('Actiepunt verwijderen?')) return;
        try { await HopApi.deleteAction(b.dataset.delA); reload(); } catch (e) { toast('Mislukt', 'error'); }
      });
    }

    // ---- Notities ----
    function renderNotes() {
      const el = qs('#c-notes');
      const visible = isCoach ? notes.filter((n) => n.shared) : notes;
      let html = '';
      if (isPilot) {
        html += `<div style="margin-bottom:16px">
          <textarea id="c-note-input" class="input" rows="3" placeholder="Jouw notitie…"></textarea>
          <label class="lab-check" style="margin-top:8px;display:inline-flex"><input type="checkbox" id="c-note-share"><span>Delen met mijn coach</span></label>
          <div><button class="btn btn-coral btn-sm" id="c-note-save" style="margin-top:8px">Notitie opslaan</button></div>
        </div>`;
      }
      html += visible.length ? visible.map((n) => `<div class="c-note">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <div style="font-size:12px;color:var(--muted)">${formatDate(n.created_at)}${n.shared ? ' · <span style="color:var(--coral-dark);font-weight:600">gedeeld</span>' : ''}</div>
          ${isPilot ? `<div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" data-share="${n.id}">${n.shared ? 'Niet meer delen' : 'Delen'}</button>
            <button class="btn btn-ghost btn-sm" data-del-n="${n.id}" style="color:var(--danger)">${ICONS.trash}</button>
          </div>` : ''}
        </div>
        <div style="white-space:pre-line;font-size:14px;margin-top:4px">${escapeHtml(n.body)}</div>
      </div>`).join('') : `<div style="font-size:13px;color:var(--muted)">${isCoach ? 'Nog geen gedeelde notities.' : 'Nog geen notities.'}</div>`;
      el.innerHTML = html;

      if (isPilot) {
        qs('#c-note-save').onclick = async () => {
          const body = qs('#c-note-input').value.trim();
          if (!body) { toast('Notitie is leeg', 'error'); return; }
          try {
            await HopApi.createNote({ relation_id: id, author_id: session.user_id, body, shared: qs('#c-note-share').checked });
            toast('Notitie opgeslagen', 'success'); reload();
          } catch (e) { toast('Mislukt', 'error'); }
        };
        qsa('#c-notes [data-share]').forEach((b) => b.onclick = async () => {
          const n = notes.find((x) => x.id === b.dataset.share);
          try { await HopApi.updateNote(n.id, { shared: !n.shared }); reload(); } catch (e) { toast('Mislukt', 'error'); }
        });
        qsa('#c-notes [data-del-n]').forEach((b) => b.onclick = async () => {
          if (!confirm('Notitie verwijderen?')) return;
          try { await HopApi.deleteNote(b.dataset.delN); reload(); } catch (e) { toast('Mislukt', 'error'); }
        });
      }
    }

    // ---- Ontwikkeladviezen ----
    function renderAdvice() {
      const el = qs('#c-advice');
      let html = '';
      if (isCoach) {
        html += `<div style="margin-bottom:16px">
          <textarea id="c-adv-input" class="input" rows="3" placeholder="Ontwikkeladvies of aanbeveling…"></textarea>
          <div><button class="btn btn-coral btn-sm" id="c-adv-save" style="margin-top:8px">Advies delen</button></div>
        </div>`;
      }
      html += advice.length ? advice.map((a) => `<div class="c-note">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <div style="font-size:12px;color:var(--muted)">${formatDate(a.created_at)}</div>
          ${isCoach ? `<button class="btn btn-ghost btn-sm" data-del-adv="${a.id}" style="color:var(--danger)">${ICONS.trash}</button>` : ''}
        </div>
        <div style="white-space:pre-line;font-size:14px;margin-top:4px">${escapeHtml(a.body)}</div>
      </div>`).join('') : `<div style="font-size:13px;color:var(--muted)">Nog geen ontwikkeladviezen.</div>`;
      el.innerHTML = html;

      if (isCoach) {
        qs('#c-adv-save').onclick = async () => {
          const body = qs('#c-adv-input').value.trim();
          if (!body) { toast('Advies is leeg', 'error'); return; }
          try {
            await HopApi.createAdvice({ relation_id: id, coach_id: session.user_id, body });
            toast('Advies gedeeld', 'success'); reload();
          } catch (e) { toast('Mislukt', 'error'); }
        };
        qsa('#c-advice [data-del-adv]').forEach((b) => b.onclick = async () => {
          if (!confirm('Advies verwijderen?')) return;
          try { await HopApi.deleteAdvice(b.dataset.delAdv); reload(); } catch (e) { toast('Mislukt', 'error'); }
        });
      }
    }
  }

  // ==========================================================
  // ONTWIKKELASSESSMENT — 250-vragen persoonlijkheidsinstrument
  // Los onderdeel binnen Ontwikkeling. Meetmomenten 6 en 12 maanden
  // na de programma-startdatum (die de coach per piloot instelt).
  // hash: #ontwikkeling/assessment
  //       #ontwikkeling/assessment/vullen/<wave>   (piloot vult in)
  //       #ontwikkeling/assessment/rapport/<wave>  (piloot: eigen rapport)
  // ==========================================================
  function assessmentWave(id) { return (window.ASSESSMENT_WAVES || []).find((w) => w.id === id) || null; }

  function assessmentUnlockDate(startDate, months) {
    if (!startDate) return null;
    const d = new Date(startDate + 'T00:00:00');
    d.setMonth(d.getMonth() + months);
    return d;
  }

  // 'locked' | 'open' | 'done'
  function assessmentWaveState(startDate, wave, response) {
    if (response) return 'done';
    const unlock = assessmentUnlockDate(startDate, wave.months);
    if (!unlock) return 'locked';
    return Date.now() >= unlock.getTime() ? 'open' : 'locked';
  }

  function assessmentDraftKey(user_id, wave) { return `hop_assess_draft_${user_id}_${wave}`; }

  function assessmentWaveCard(wave, state, unlockDate) {
    if (state === 'locked') {
      return `<div class="lab-card locked">
        <div class="lab-lock">${LAB_LOCK}</div>
        <div class="sect-t">${escapeHtml(wave.label)}</div>
        <div class="sect-d">${unlockDate ? `Wordt ontgrendeld op ${formatDate(unlockDate.toISOString())}` : 'Nog geen startdatum bekend — vraag je coach deze in te stellen.'}</div>
      </div>`;
    }
    if (state === 'done') {
      return `<button class="lab-card clickable" data-report="${wave.id}">
        <div class="lab-ico" style="background:rgba(21,128,61,.14);color:#15803D">${ICONS.check}</div>
        <div class="sect-t">${escapeHtml(wave.label)}</div>
        <div class="sect-d">Ingevuld. Bekijk je rapport.</div>
        <div class="lab-foot" style="color:#15803D">Bekijk rapport ${ICONS.arrowRight}</div>
      </button>`;
    }
    return `<button class="lab-card clickable" data-fill="${wave.id}">
      <div class="lab-ico" style="background:rgba(229,107,62,.14);color:var(--coral-dark)">${ICONS.sparkles}</div>
      <div class="sect-t">${escapeHtml(wave.label)}</div>
      <div class="sect-d">Ontgrendeld — vul de vragenlijst in (250 stellingen).</div>
      <div class="lab-foot" style="color:var(--coral-dark)">Start vragenlijst ${ICONS.arrowRight}</div>
    </button>`;
  }

  function assessmentLevelColor(level) {
    return level === 'hoog' ? '#15803D' : level === 'gemiddeld' ? '#D97706' : '#B91C1C';
  }

  // Gedeeld tussen piloot-rapportpagina en coach-inline-weergave.
  function renderAssessmentReportBody(container, scores, report) {
    const competencies = Object.values((report || {}).competencies || {});
    const balances = Object.values((report || {}).balances || {});

    const compRows = competencies.map((c) => {
      const pct = Math.max(0, Math.min(100, ((c.score - 1) / 8) * 100)); // schaal 1-9
      const color = assessmentLevelColor(c.level);
      return `<div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;gap:10px">
          <span style="font-weight:600;color:var(--navy-deep)">${escapeHtml(c.label)}</span>
          <span class="pill" style="background:${color}15;color:${color}">${escapeHtml(c.level)} · ${c.score}</span>
        </div>
        <div style="height:8px;background:var(--sand);border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
    }).join('') || `<div style="font-size:13px;color:var(--muted)">Geen competentiescores beschikbaar.</div>`;

    const balanceRows = balances.map((b) => `
      <div class="lab-assign-row">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(b.label)}</div>
          <div style="font-size:12px;color:var(--muted)">Verschil: ${b.difference}</div>
        </div>
        <span class="pill pill-coral">${escapeHtml(b.outcome)}</span>
      </div>`).join('') || `<div style="font-size:13px;color:var(--muted)">Geen balansen beschikbaar.</div>`;

    const scaleRows = Object.entries(scores || {}).map(([key, val]) => {
      const label = (window.ASSESSMENT_SCALES[key] || {}).label || key;
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--sand);font-size:13px">
        <span style="color:#374151">${escapeHtml(label)}</span><span style="font-weight:600;color:var(--navy-deep)">${val}</span>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="lab-section-label">Competenties</div>
      ${compRows}
      <div class="lab-section-label" style="margin-top:24px">Balansen / spanningsvelden</div>
      ${balanceRows}
      <div class="lab-section-label" style="margin-top:24px">Alle schaalscores (1-9)</div>
      ${scaleRows}`;
  }

  // ---------- Index: piloot ziet eigen 2 meetmomenten; coach kiest kandidaat ----------
  async function renderAssessmentIndex() {
    const target = qs('#ontw-body');
    if (session.role === 'coach') return renderAssessmentCoach(target);

    target.innerHTML = `<div class="fade-up">
      <h1 class="page-title" style="font-size:30px;margin-top:6px">Ontwikkelassessment.</h1>
      <p class="page-lead">Een persoonlijkheidsinstrument dat je invult op 6 en 12 maanden in het programma, zodat jij en je coach je ontwikkeling kunnen volgen.</p>
      <div id="assess-body"><div class="spinner" style="margin:60px auto"></div></div>
    </div>`;

    let user = null, responses = [];
    try {
      [user, responses] = await Promise.all([
        HopApi.getUserById(session.user_id),
        HopApi.listAssessmentResponses(session.user_id),
      ]);
    } catch (e) { console.warn(e); }
    const startDate = (user || {}).program_start_date || null;
    const byWave = {}; (responses || []).forEach((r) => { byWave[r.wave] = r; });

    qs('#assess-body').innerHTML = `<div class="sect-grid">${(window.ASSESSMENT_WAVES || []).map((w) => {
      const state = assessmentWaveState(startDate, w, byWave[w.id]);
      const unlock = assessmentUnlockDate(startDate, w.months);
      return assessmentWaveCard(w, state, unlock);
    }).join('')}</div>`;
    qsa('#assess-body [data-fill]').forEach((b) => b.onclick = () => go('ontwikkeling', 'assessment/vullen/' + b.dataset.fill));
    qsa('#assess-body [data-report]').forEach((b) => b.onclick = () => go('ontwikkeling', 'assessment/rapport/' + b.dataset.report));
  }

  // ---------- COACH: startdatum instellen per piloot + rapporten inzien ----------
  async function renderAssessmentCoach(target) {
    target.innerHTML = `<div class="fade-up">
      <h1 class="page-title" style="font-size:30px;margin-top:6px">Ontwikkelassessment.</h1>
      <p class="page-lead">Stel de programma-startdatum per piloot in en bekijk de rapporten zodra ze zijn ingevuld.</p>
      <div class="field" style="max-width:320px"><label class="field-label">Piloot</label><select id="assess-cand" class="input"></select></div>
      <div id="assess-coach-body"></div>
    </div>`;

    let pilots = [];
    try { pilots = await HopApi.listPilotsForAssessment(); } catch (e) { console.warn(e); }
    const sel = qs('#assess-cand');
    sel.innerHTML = `<option value="">— kies piloot —</option>` + pilots.map((u) => `<option value="${u.id}">${escapeHtml(u.full_name)}</option>`).join('');
    sel.onchange = () => loadCand(pilots.find((p) => p.id === sel.value) || null);

    async function loadCand(pilot) {
      const body = qs('#assess-coach-body');
      if (!pilot) { body.innerHTML = ''; return; }
      body.innerHTML = `<div class="spinner" style="margin:40px auto"></div>`;
      let responses = [];
      try { responses = await HopApi.listAssessmentResponses(pilot.id); } catch (e) { console.warn(e); }
      const byWave = {}; responses.forEach((r) => { byWave[r.wave] = r; });

      body.innerHTML = `
        <div class="card card-lg" style="margin:20px 0">
          <div class="lab-section-label">Programma-startdatum</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <input type="date" id="assess-start" class="input" style="max-width:200px" value="${pilot.program_start_date || ''}">
            <button class="btn btn-primary btn-sm" id="assess-start-save">Opslaan</button>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:8px">Bepaalt wanneer de 6- en 12-maanden vragenlijst voor deze piloot ontgrendelt.</div>
        </div>
        <div id="assess-waves"></div>`;

      qs('#assess-start-save').onclick = async () => {
        const val = qs('#assess-start').value;
        try {
          await HopApi.setProgramStartDate(pilot.id, val || null);
          pilot.program_start_date = val || null;
          toast('Startdatum opgeslagen', 'success');
          renderWaves();
        } catch (e) { console.error(e); toast('Kon niet opslaan', 'error'); }
      };

      renderWaves();

      function renderWaves() {
        const wrap = qs('#assess-waves');
        wrap.innerHTML = (window.ASSESSMENT_WAVES || []).map((w) => {
          const r = byWave[w.id];
          const state = assessmentWaveState(pilot.program_start_date, w, r);
          const unlock = assessmentUnlockDate(pilot.program_start_date, w.months);
          const statusLabel = state === 'done'
            ? `Ingevuld${r.submitted_at ? ' · ' + formatDate(r.submitted_at) : ''}`
            : state === 'open' ? 'Ontgrendeld — nog niet ingevuld'
            : (unlock ? `Vergrendeld tot ${formatDate(unlock.toISOString())}` : 'Vergrendeld — geen startdatum ingesteld');
          return `<div class="lab-assign-row">
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(w.label)}</div>
                <div style="font-size:12px;color:var(--muted)">${statusLabel}</div>
              </div>
              ${state === 'done' ? `<button class="btn btn-primary btn-sm" data-view="${w.id}">Bekijk rapport</button>` : ''}
            </div>
            <div id="assess-report-${w.id}"></div>`;
        }).join('');
        qsa('#assess-waves [data-view]').forEach((b) => b.onclick = () => {
          const box = qs('#assess-report-' + b.dataset.view);
          if (box.dataset.open) { box.innerHTML = ''; box.dataset.open = ''; return; }
          box.dataset.open = '1';
          box.innerHTML = `<div class="card card-lg" style="margin:12px 0 20px"></div>`;
          const r = byWave[b.dataset.view];
          renderAssessmentReportBody(box.firstElementChild, r.scores, r.report);
        });
      }
    }
  }

  // ---------- PILOOT: vragenlijst invullen (gepagineerd, 10 per pagina) ----------
  async function renderAssessmentFill(waveId) {
    const main = qs('#main');
    const wave = assessmentWave(waveId);
    if (!wave || session.role !== 'pilot') {
      main.innerHTML = `<div class="fade-up"><a href="#ontwikkeling/assessment" class="back-link">${ICONS.chevLeft} Terug</a><div class="card" style="color:var(--danger)">Onbekend meetmoment.</div></div>`;
      return;
    }
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;

    let user = null, existing = null;
    try {
      [user, existing] = await Promise.all([
        HopApi.getUserById(session.user_id),
        HopApi.getAssessmentResponse(session.user_id, waveId),
      ]);
    } catch (e) { console.warn(e); }

    const state = assessmentWaveState((user || {}).program_start_date, wave, existing);
    if (state !== 'open') {
      main.innerHTML = `<div class="fade-up"><a href="#ontwikkeling/assessment" class="back-link">${ICONS.chevLeft} Terug</a>
        <div class="card" style="color:var(--danger)">Deze vragenlijst is ${state === 'done' ? 'al ingevuld' : 'nog vergrendeld'}.</div></div>`;
      return;
    }

    const draftKey = assessmentDraftKey(session.user_id, waveId);
    let answers = {};
    try { answers = JSON.parse(localStorage.getItem(draftKey)) || {}; } catch (e) { answers = {}; }

    const PER_PAGE = 10;
    const questions = window.ASSESSMENT_QUESTIONS;
    const totalPages = Math.ceil(questions.length / PER_PAGE);
    let page = 0;

    renderPage();

    function renderPage() {
      const chunk = questions.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
      const isLast = page === totalPages - 1;
      const progress = (page / totalPages) * 100;

      main.innerHTML = `<div class="fade-up">
        <div class="eyebrow">Ontwikkelassessment · ${escapeHtml(wave.label)}</div>
        <div class="progress"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div style="font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;font-weight:600;margin-bottom:6px">
          Vragen ${page * PER_PAGE + 1}–${page * PER_PAGE + chunk.length} van ${questions.length}
        </div>
        <h2 class="font-display" style="font-size:24px;font-weight:600;color:var(--navy-deep);margin-bottom:20px;letter-spacing:-.02em">${escapeHtml(window.ASSESSMENT_INSTRUCTIONS)}</h2>

        <div id="assess-stmts"></div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn" id="assess-back" ${page === 0 ? 'disabled' : ''}>${ICONS.chevLeft} Terug</button>
          <div style="margin-left:auto"></div>
          <button class="btn btn-${isLast ? 'coral' : 'primary'}" id="assess-next">
            ${isLast ? `${ICONS.send} Vragenlijst verzenden` : `Volgende ${ICONS.chevRight}`}
          </button>
        </div>
      </div>`;

      const stmtsBox = qs('#assess-stmts');
      chunk.forEach((q) => {
        const row = h('div', { class: 'card', style: { marginBottom: '10px' } });
        row.innerHTML = `<div style="font-size:14px;color:#1F2937;line-height:1.55;margin-bottom:12px">${escapeHtml(q.text)}</div><div class="scale"></div>`;
        const scaleEl = row.querySelector('.scale');
        window.ASSESSMENT_SCALE_LABELS.forEach((lbl, i) => {
          const v = i + 1;
          const btn = h('button', { type: 'button', class: `scale-opt ${answers[q.number] === v ? 'active' : ''}`, style: { flex: '1' } });
          btn.innerHTML = `<span class="n">${v}</span><span>${lbl}</span>`;
          btn.addEventListener('click', () => {
            answers[q.number] = v;
            try { localStorage.setItem(draftKey, JSON.stringify(answers)); } catch (e) { /* noop */ }
            qsa('.scale-opt', scaleEl).forEach((b, bi) => b.classList.toggle('active', bi === i));
            checkNext();
          });
          scaleEl.appendChild(btn);
        });
        stmtsBox.appendChild(row);
      });

      qs('#assess-back').onclick = () => { if (page > 0) { page--; renderPage(); window.scrollTo(0, 0); } };
      qs('#assess-next').onclick = async () => {
        if (!canContinue()) { toast('Beantwoord eerst alle stellingen', 'error'); return; }
        if (!isLast) { page++; renderPage(); window.scrollTo(0, 0); return; }
        await submit();
      };

      function canContinue() { return chunk.every((q) => !!answers[q.number]); }
      function checkNext() { qs('#assess-next').disabled = !canContinue(); }
      checkNext();
    }

    async function submit() {
      const btn = qs('#assess-next');
      btn.disabled = true; btn.innerHTML = 'Verzenden…';
      // Op vraagnummer indexeren (niet op weergavevolgorde) -- de vragen
      // staan door elkaar gehusseld getoond, maar scoring.js verwacht
      // ordered[itemnummer - 1] voor elke schaal.
      const ordered = [];
      questions.forEach((q) => { ordered[q.number - 1] = answers[q.number]; });
      if (!window.HopAssessment.validateAnswers(ordered)) {
        toast('Niet alle vragen zijn beantwoord', 'error');
        btn.disabled = false; btn.innerHTML = `${ICONS.send} Vragenlijst verzenden`;
        return;
      }
      try {
        const scores = window.HopAssessment.calculateScores(ordered);
        const report = window.HopAssessment.generateReport(scores);
        await HopApi.submitAssessmentResponse({ user_id: session.user_id, wave: waveId, answers: ordered, scores, report });
        try { localStorage.removeItem(draftKey); } catch (e) { /* noop */ }
        toast('Vragenlijst verzonden', 'success');
        go('ontwikkeling', 'assessment/rapport/' + waveId);
      } catch (e) {
        console.error(e);
        toast('Kon niet opslaan: ' + e.message, 'error', 3500);
        btn.disabled = false; btn.innerHTML = `${ICONS.send} Vragenlijst verzenden`;
      }
    }
  }

  // ---------- PILOOT: eigen rapport (volledig scherm) ----------
  async function renderAssessmentReportPage(waveId) {
    const main = qs('#main');
    const wave = assessmentWave(waveId);
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    let r = null;
    try { r = await HopApi.getAssessmentResponse(session.user_id, waveId); } catch (e) { console.warn(e); }
    if (!wave || !r) {
      main.innerHTML = `<div class="fade-up"><a href="#ontwikkeling/assessment" class="back-link">${ICONS.chevLeft} Terug</a><div class="card" style="color:var(--danger)">Nog geen rapport beschikbaar.</div></div>`;
      return;
    }
    main.innerHTML = `<div class="fade-up">
      <a href="#ontwikkeling/assessment" class="back-link">${ICONS.chevLeft} Terug naar Ontwikkeling</a>
      <div class="eyebrow">Ontwikkelassessment</div>
      <h1 class="page-title" style="font-size:36px">${escapeHtml(wave.label)}.</h1>
      <p class="page-lead">Ingevuld op ${formatDate(r.submitted_at)}.</p>
      <div class="card card-lg" id="assess-report-page"></div>
    </div>`;
    renderAssessmentReportBody(qs('#assess-report-page'), r.scores, r.report);
  }

  // ==========================================================
  // AGENDA & EVENTS
  // hash: #agenda | #agenda/e/<id> | #agenda/new | #agenda/edit/<id>
  // ==========================================================
  const AG_PIN = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  function eventCat(id) { return (window.EVENT_CATEGORIES || []).find((c) => c.id === id) || null; }
  function catPill(id) {
    const c = eventCat(id);
    if (!c) return '';
    return `<span class="pill" style="background:${c.color}1a;color:${c.color}">${escapeHtml(c.label)}</span>`;
  }
  function eventDateBlock(iso) {
    if (!iso) return `<div class="ev-d-day">–</div><div class="ev-d-mon">n.t.b.</div>`;
    const d = new Date(iso);
    return `<div class="ev-d-day">${d.getDate()}</div><div class="ev-d-mon">${escapeHtml(d.toLocaleString('nl-NL', { month: 'short' }))}</div>`;
  }
  function icsStamp(iso) {
    const d = new Date(iso), p = (n) => String(n).padStart(2, '0');
    return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + 'T' + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + 'Z';
  }
  function icsEscape(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function downloadIcs(ev) {
    const start = ev.starts_at ? new Date(ev.starts_at) : new Date();
    const end = ev.ends_at ? new Date(ev.ends_at) : new Date(start.getTime() + 3600 * 1000);
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//House of Pilots//Portal//NL', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:' + ev.id + '@houseofpilots', 'DTSTAMP:' + icsStamp(new Date().toISOString()),
      'DTSTART:' + icsStamp(start.toISOString()), 'DTEND:' + icsStamp(end.toISOString()),
      'SUMMARY:' + icsEscape(ev.title), 'DESCRIPTION:' + icsEscape(ev.description), 'LOCATION:' + icsEscape(ev.location),
      'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape('Herinnering: ' + ev.title), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (ev.title || 'evenement').replace(/[^\w]+/g, '_') + '.ics';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function renderAgenda() {
    const parts = hashParts(); // ['agenda', seg1, seg2]
    const isCoach = session.role === 'coach';
    if (isCoach && parts[1] === 'new') return renderEventForm(null);
    if (isCoach && parts[1] === 'edit' && parts[2]) return renderEventForm(parts[2]);
    if (parts[1] === 'e' && parts[2]) return renderEventDetail(parts[2]);
    return renderAgendaList();
  }

  async function renderAgendaList() {
    const main = qs('#main');
    const isCoach = session.role === 'coach';
    main.innerHTML = `<div class="fade-up">
      <div class="eyebrow">Agenda</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap">
        <div>
          <h1 class="page-title">Agenda & events.</h1>
          <p class="page-lead">Alle House of Pilots evenementen op één plek.</p>
        </div>
        ${isCoach ? `<button class="btn btn-coral" id="ev-new">${ICONS.plus} Nieuw evenement</button>` : ''}
      </div>
      <div id="agenda-body"><div class="spinner" style="margin:60px auto"></div></div>
    </div>`;
    if (isCoach) qs('#ev-new').onclick = () => go('agenda', 'new');

    let events = [], signups = [];
    try { [events, signups] = await Promise.all([HopApi.listEvents(), HopApi.listAllSignups()]); } catch (e) { console.warn(e); }

    const counts = {};
    signups.forEach((s) => {
      const c = counts[s.event_id] = counts[s.event_id] || { reg: 0, wait: 0 };
      if (s.status === 'registered') c.reg++; else c.wait++;
    });
    const mine = {};
    signups.filter((s) => s.user_id === session.user_id).forEach((s) => { mine[s.event_id] = s.status; });

    const body = qs('#agenda-body');
    if (!events.length) {
      body.innerHTML = `<div class="card" style="border-style:dashed;text-align:center;color:var(--muted);padding:50px">Nog geen evenementen gepland.</div>`;
      return;
    }
    const cut = Date.now() - 12 * 3600 * 1000;
    const upcoming = events.filter((e) => !e.starts_at || new Date(e.starts_at).getTime() >= cut);
    const past = events.filter((e) => e.starts_at && new Date(e.starts_at).getTime() < cut).reverse();

    const card = (e) => {
      const c = counts[e.id] || { reg: 0, wait: 0 };
      const full = e.capacity != null && c.reg >= e.capacity;
      const cap = e.capacity != null ? `${c.reg}/${e.capacity}` : `${c.reg}`;
      const ms = mine[e.id];
      const badge = ms === 'registered' ? `<span class="pill" style="background:rgba(21,128,61,.14);color:#15803D">Aangemeld</span>`
        : ms === 'waitlist' ? `<span class="pill" style="background:rgba(217,119,6,.16);color:#B45309">Wachtlijst</span>` : '';
      return `<button class="ev-card" data-open="${e.id}">
        <div class="ev-date">${eventDateBlock(e.starts_at)}</div>
        <div style="flex:1;min-width:0;text-align:left">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px">${catPill(e.category)}${badge}</div>
          <div class="ev-title">${escapeHtml(e.title)}</div>
          <div class="ev-meta">${e.starts_at ? formatDateTime(e.starts_at) : 'Datum n.t.b.'}${e.location ? ' · ' + escapeHtml(e.location) : ''}</div>
        </div>
        <div class="ev-cap ${full ? 'full' : ''}">${cap}${full ? ' · vol' : ''}</div>
      </button>`;
    };

    body.innerHTML = `
      ${upcoming.length ? `<div class="lab-section-label">Aankomend</div><div class="ev-list">${upcoming.map(card).join('')}</div>` : ''}
      ${past.length ? `<div class="lab-section-label" style="margin-top:26px">Geweest</div><div class="ev-list" style="opacity:.65">${past.map(card).join('')}</div>` : ''}`;
    qsa('#agenda-body [data-open]').forEach((b) => b.onclick = () => go('agenda', 'e/' + b.dataset.open));
  }

  async function renderEventDetail(id) {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    const isCoach = session.role === 'coach';
    let e, signups = [];
    try { e = await HopApi.getEvent(id); if (e) signups = await HopApi.listSignups(id); } catch (err) { console.warn(err); }
    if (!e) {
      main.innerHTML = `<div class="fade-up"><a href="#agenda" class="back-link">${ICONS.chevLeft} Terug</a><div class="card" style="color:var(--danger)">Evenement niet gevonden.</div></div>`;
      return;
    }
    const reg = signups.filter((s) => s.status === 'registered');
    const wait = signups.filter((s) => s.status === 'waitlist');
    const mine = signups.find((s) => s.user_id === session.user_id);
    const full = e.capacity != null && reg.length >= e.capacity;

    main.innerHTML = `<div class="fade-up">
      <a href="#agenda" class="back-link">${ICONS.chevLeft} Terug naar agenda</a>
      <div style="margin-bottom:6px">${catPill(e.category)}</div>
      <h1 class="page-title">${escapeHtml(e.title)}.</h1>
      <div class="ev-detail-meta">
        <div style="display:flex;align-items:center;gap:6px">${ICONS.calendar} ${e.starts_at ? formatDateTime(e.starts_at) : 'Datum n.t.b.'}${e.ends_at ? ' – ' + formatDateTime(e.ends_at) : ''}</div>
        ${e.location ? `<div style="display:flex;align-items:center;gap:6px">${AG_PIN} ${escapeHtml(e.location)}</div>` : ''}
        <div style="display:flex;align-items:center;gap:6px">${ICONS.users} ${reg.length}${e.capacity != null ? '/' + e.capacity : ''} aangemeld${wait.length ? ` · ${wait.length} op wachtlijst` : ''}</div>
      </div>

      ${e.description ? `<div class="card card-lg" style="margin:20px 0"><div style="white-space:pre-line;font-size:14px;line-height:1.65">${escapeHtml(e.description)}</div></div>` : '<div style="height:12px"></div>'}

      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px">
        <span id="ev-signup"></span>
        <button class="btn btn-ghost" id="ev-ics">${ICONS.calendar} Toevoegen aan agenda</button>
        ${isCoach ? `<button class="btn btn-ghost btn-sm" id="ev-edit">${ICONS.pen} Bewerken</button>
          <button class="btn btn-ghost btn-sm" id="ev-del" style="color:var(--danger)">${ICONS.trash} Verwijderen</button>` : ''}
      </div>

      <div class="card card-lg">
        <div class="lab-section-label">Deelnemers (${reg.length}${e.capacity != null ? '/' + e.capacity : ''})</div>
        <div>${reg.length ? reg.map((s) => `<span class="ev-chip">${escapeHtml(s.full_name || 'Deelnemer')}</span>`).join('') : '<span style="font-size:13px;color:var(--muted)">Nog geen aanmeldingen.</span>'}</div>
        ${wait.length ? `<div class="lab-section-label" style="margin-top:18px">Wachtlijst (${wait.length})</div>
          <div>${wait.map((s, i) => `<span class="ev-chip wait">${i + 1}. ${escapeHtml(s.full_name || 'Deelnemer')}</span>`).join('')}</div>` : ''}
      </div>
    </div>`;

    renderSignupBtn();
    qs('#ev-ics').onclick = () => downloadIcs(e);
    if (isCoach) {
      qs('#ev-edit').onclick = () => go('agenda', 'edit/' + id);
      qs('#ev-del').onclick = async () => {
        if (!confirm('Evenement verwijderen?')) return;
        try { await HopApi.deleteEvent(id); toast('Verwijderd', 'success'); go('agenda'); } catch (err) { toast('Mislukt', 'error'); }
      };
    }

    function renderSignupBtn() {
      const el = qs('#ev-signup');
      if (mine) {
        el.innerHTML = `<button class="btn btn-ghost" id="ev-off">${mine.status === 'registered' ? 'Afmelden' : 'Van wachtlijst af'}</button>`;
        qs('#ev-off').onclick = async () => {
          try { await HopApi.cancelSignup(id, session.user_id); toast('Afgemeld', 'success'); renderEventDetail(id); } catch (err) { toast('Mislukt', 'error'); }
        };
      } else {
        el.innerHTML = `<button class="btn btn-coral" id="ev-on">${full ? 'Op wachtlijst' : 'Aanmelden'} ${ICONS.arrowRight}</button>`;
        qs('#ev-on').onclick = async () => {
          try { const r = await HopApi.signUp(id, session.user_id); toast(r.status === 'waitlist' ? 'Op de wachtlijst geplaatst' : 'Aangemeld', 'success'); renderEventDetail(id); } catch (err) { toast('Mislukt', 'error'); }
        };
      }
    }
  }

  async function renderEventForm(id) {
    const main = qs('#main');
    let e = null;
    if (id) { try { e = await HopApi.getEvent(id); } catch (err) { console.warn(err); } }
    const cats = window.EVENT_CATEGORIES || [];
    const v = (f) => (e && e[f] != null ? e[f] : '');
    const dtLocal = (iso) => {
      if (!iso) return '';
      const d = new Date(iso), p = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
    };
    main.innerHTML = `<div class="fade-up" style="max-width:680px">
      <a href="#agenda" class="back-link">${ICONS.chevLeft} Terug naar agenda</a>
      <h1 class="page-title" style="font-size:34px">${id ? 'Evenement bewerken' : 'Nieuw evenement'}.</h1>
      <div class="card card-lg">
        <div class="field"><label class="field-label">Titel</label><input id="f-title" class="input" value="${escapeHtml(v('title'))}"></div>
        <div class="field"><label class="field-label">Categorie</label>
          <select id="f-cat" class="input">${cats.map((c) => `<option value="${c.id}" ${e && e.category === c.id ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join('')}</select>
        </div>
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          <div class="field" style="flex:1;min-width:180px"><label class="field-label">Start</label><input id="f-start" type="datetime-local" class="input" value="${dtLocal(e && e.starts_at)}"></div>
          <div class="field" style="flex:1;min-width:180px"><label class="field-label">Einde (optioneel)</label><input id="f-end" type="datetime-local" class="input" value="${dtLocal(e && e.ends_at)}"></div>
        </div>
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          <div class="field" style="flex:2;min-width:180px"><label class="field-label">Locatie</label><input id="f-loc" class="input" value="${escapeHtml(v('location'))}"></div>
          <div class="field" style="flex:1;min-width:130px"><label class="field-label">Max. plaatsen</label><input id="f-cap" type="number" min="1" class="input" placeholder="onbeperkt" value="${e && e.capacity != null ? e.capacity : ''}"></div>
        </div>
        <div class="field"><label class="field-label">Omschrijving</label><textarea id="f-desc" class="input" rows="4">${escapeHtml(v('description'))}</textarea></div>
        <button class="btn btn-coral" id="f-save" style="margin-top:8px">${id ? 'Opslaan' : 'Evenement aanmaken'} ${ICONS.arrowRight}</button>
      </div>
    </div>`;

    qs('#f-save').onclick = async () => {
      const title = qs('#f-title').value.trim();
      if (!title) { toast('Titel is verplicht', 'error'); return; }
      const startv = qs('#f-start').value, endv = qs('#f-end').value, capv = qs('#f-cap').value;
      const row = {
        title, category: qs('#f-cat').value, location: qs('#f-loc').value.trim(),
        description: qs('#f-desc').value.trim(),
        starts_at: startv ? new Date(startv).toISOString() : null,
        ends_at: endv ? new Date(endv).toISOString() : null,
        capacity: capv === '' ? null : Number(capv),
      };
      const btn = qs('#f-save'); btn.disabled = true; btn.textContent = 'Opslaan…';
      try {
        if (id) { await HopApi.updateEvent(id, row); toast('Opgeslagen', 'success'); go('agenda', 'e/' + id); }
        else { row.created_by = session.user_id; const ev = await HopApi.createEvent(row); toast('Aangemaakt', 'success'); go('agenda', 'e/' + ev.id); }
      } catch (err) {
        console.error(err); toast('Kon niet opslaan: ' + err.message, 'error', 3000);
        btn.disabled = false; btn.textContent = id ? 'Opslaan' : 'Evenement aanmaken';
      }
    };
  }

  // ==========================================================
  // PRAKTISCHE ZAKEN — forum + verlofaanvragen
  // hash: #praktisch | #praktisch/verlof | #praktisch/forum/<threadId>
  // ==========================================================
  const LEAVE_STATUS = {
    pending:  { label: 'In afwachting', color: '#B45309',     bg: 'rgba(217,119,6,.16)' },
    approved: { label: 'Goedgekeurd',   color: '#15803D',     bg: 'rgba(21,128,61,.14)' },
    rejected: { label: 'Afgewezen',     color: 'var(--danger)', bg: 'rgba(185,28,28,.08)' },
  };
  function leaveStatusPill(status) {
    const s = LEAVE_STATUS[status] || LEAVE_STATUS.pending;
    return `<span class="pill" style="background:${s.bg};color:${s.color}">${s.label}</span>`;
  }
  function leaveDays(startStr, endStr) {
    const start = new Date(startStr), end = new Date(endStr);
    return Math.round((end - start) / 86400000) + 1;
  }

  function renderPraktisch() {
    const parts = hashParts(); // ['praktisch', sub, ...]
    if (parts[1] === 'forum' && parts[2]) return renderPracticalThread(parts[2]);
    const sub = parts[1] === 'verlof' ? 'verlof' : 'forum';

    qs('#main').innerHTML = `<div class="fade-up">
      <div class="eyebrow">Praktische zaken</div>
      <h1 class="page-title">Praktische zaken.</h1>
      <p class="page-lead">Stel vragen aan elkaar, deel dingen over klantpartners, en geef verlof door.</p>
      <div class="tabs" id="prak-tabs" style="margin-top:10px">
        <button class="tab ${sub === 'forum' ? 'active' : ''}" data-sub="forum">Forum</button>
        <button class="tab ${sub === 'verlof' ? 'active' : ''}" data-sub="verlof">Verlofaanvragen</button>
      </div>
      <div id="prak-body"><div class="spinner" style="margin:60px auto"></div></div>
    </div>`;
    qsa('#prak-tabs .tab').forEach((b) => b.addEventListener('click', () => go('praktisch', b.dataset.sub)));

    if (sub === 'verlof') renderVerlof();
    else renderPracticalForum();
  }

  // ---------- FORUM ----------
  async function renderPracticalForum() {
    const body = qs('#prak-body');
    body.innerHTML = `<div class="card card-lg">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <div class="lab-section-label" style="margin:0">Forum</div>
        <button class="btn btn-coral btn-sm" id="pf-new">${ICONS.plus} Nieuw onderwerp</button>
      </div>
      <div id="pf-form" style="display:none;margin-bottom:14px"></div>
      <div id="pf-list"><div class="spinner" style="margin:30px auto"></div></div>
    </div>`;

    qs('#pf-new').onclick = () => {
      const box = qs('#pf-form');
      if (box.style.display === 'block') { box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = `
        <div class="field" style="margin-bottom:8px"><label class="field-label">Onderwerp</label><input id="pf-title" class="input" placeholder="bv. Vraag over klantpartner X"></div>
        <div class="field" style="margin-bottom:8px"><label class="field-label">Bericht</label><textarea id="pf-body" class="input" rows="3" placeholder="Licht je vraag toe…"></textarea></div>
        <button class="btn btn-coral btn-sm" id="pf-save">Plaatsen</button>`;
      qs('#pf-save').onclick = async () => {
        const title = qs('#pf-title').value.trim();
        if (!title) { toast('Onderwerp is verplicht', 'error'); return; }
        try {
          const t = await HopApi.createPracticalThread({ title, created_by: session.user_id, body: qs('#pf-body').value.trim() });
          toast('Geplaatst', 'success');
          go('praktisch', 'forum/' + t.id);
        } catch (e) { console.error(e); toast('Kon niet plaatsen: ' + e.message, 'error', 3000); }
      };
    };

    let threads = [];
    try { threads = await HopApi.listPracticalThreads(); } catch (e) { console.warn(e); }
    const list = qs('#pf-list');
    if (!threads.length) { list.innerHTML = `<div style="font-size:13px;color:var(--muted)">Nog geen onderwerpen. Stel de eerste vraag!</div>`; return; }
    list.innerHTML = threads.map((t) => `<div class="lab-assign-row">
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(t.title)}</div>
        <div style="font-size:12px;color:var(--muted)">${escapeHtml(t.author || 'Onbekend')} · ${formatDate(t.created_at)}</div>
      </div>
      <button class="btn btn-primary btn-sm" data-open="${t.id}">Openen</button>
      ${(t.created_by === session.user_id || session.role === 'coach') ? `<button class="btn btn-ghost btn-sm" data-del="${t.id}" style="color:var(--danger)">${ICONS.trash}</button>` : ''}
    </div>`).join('');
    qsa('#pf-list [data-open]').forEach((b) => b.onclick = () => go('praktisch', 'forum/' + b.dataset.open));
    qsa('#pf-list [data-del]').forEach((b) => b.onclick = async () => {
      if (!confirm('Onderwerp en alle reacties verwijderen?')) return;
      try { await HopApi.deletePracticalThread(b.dataset.del); toast('Verwijderd', 'success'); renderPracticalForum(); }
      catch (e) { toast('Kon niet verwijderen', 'error'); }
    });
  }

  async function renderPracticalThread(threadId) {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    let thread, posts = [];
    try { [thread, posts] = await Promise.all([HopApi.getPracticalThread(threadId), HopApi.listPracticalPosts(threadId)]); } catch (e) { console.warn(e); }
    if (!thread) {
      main.innerHTML = `<div class="fade-up"><a href="#praktisch" class="back-link">${ICONS.chevLeft} Terug naar forum</a><div class="card" style="color:var(--danger)">Onderwerp niet gevonden.</div></div>`;
      return;
    }
    main.innerHTML = `<div class="fade-up" style="max-width:720px">
      <a href="#praktisch" class="back-link">${ICONS.chevLeft} Terug naar forum</a>
      <div class="eyebrow">Praktische zaken · Forum</div>
      <h1 class="page-title" style="font-size:32px">${escapeHtml(thread.title)}.</h1>
      <div class="card card-lg">
        <div id="pt-posts">${posts.length ? posts.map((p) => `<div class="c-note"><div style="font-size:12px;color:var(--muted)">${escapeHtml(p.author || 'Onbekend')} · ${formatDateTime(p.created_at)}</div><div style="white-space:pre-line;font-size:14px;margin-top:4px">${escapeHtml(p.body)}</div></div>`).join('') : '<div style="font-size:13px;color:var(--muted)">Nog geen berichten.</div>'}</div>
        <div style="margin-top:16px;border-top:1px dashed var(--sand);padding-top:14px">
          <textarea id="pt-body" class="input" rows="3" placeholder="Reageer…"></textarea>
          <button class="btn btn-coral btn-sm" id="pt-send" style="margin-top:8px">Reageren</button>
        </div>
      </div>
    </div>`;
    qs('#pt-send').onclick = async () => {
      const b = qs('#pt-body').value.trim();
      if (!b) return;
      try { await HopApi.createPracticalPost({ thread_id: threadId, author_id: session.user_id, body: b }); renderPracticalThread(threadId); }
      catch (e) { toast('Kon niet plaatsen', 'error'); }
    };
  }

  // ---------- VERLOFAANVRAGEN ----------
  function renderVerlof() {
    if (session.role === 'coach') return renderVerlofCoach();
    return renderVerlofPilot();
  }

  async function renderVerlofPilot() {
    const body = qs('#prak-body');
    body.innerHTML = `<div class="card card-lg" style="margin-bottom:20px">
      <div class="lab-section-label">Verlof aanvragen</div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
        <div class="field" style="margin:0;flex:1;min-width:150px"><label class="field-label">Van</label><input id="v-start" type="date" class="input"></div>
        <div class="field" style="margin:0;flex:1;min-width:150px"><label class="field-label">Tot en met</label><input id="v-end" type="date" class="input"></div>
        <div class="field" style="margin:0;flex:2;min-width:200px"><label class="field-label">Reden (optioneel)</label><input id="v-reason" class="input" placeholder="bv. vakantie, familiebezoek…"></div>
        <button class="btn btn-coral" id="v-save">Aanvragen ${ICONS.arrowRight}</button>
      </div>
    </div>
    <div class="lab-section-label">Mijn aanvragen</div>
    <div id="v-list"><div class="spinner" style="margin:30px auto"></div></div>`;

    qs('#v-save').onclick = async () => {
      const start = qs('#v-start').value, end = qs('#v-end').value;
      if (!start || !end) { toast('Vul begin- en einddatum in', 'error'); return; }
      if (end < start) { toast('Einddatum moet op of na de begindatum liggen', 'error'); return; }
      const btn = qs('#v-save'); btn.disabled = true; btn.textContent = 'Aanvragen…';
      try {
        await HopApi.createLeaveRequest({ user_id: session.user_id, start_date: start, end_date: end, days: leaveDays(start, end), reason: qs('#v-reason').value.trim() });
        toast('Verlof aangevraagd', 'success');
        renderVerlofPilot();
      } catch (e) {
        console.error(e); toast('Kon niet aanvragen: ' + e.message, 'error', 3000);
        btn.disabled = false; btn.innerHTML = `Aanvragen ${ICONS.arrowRight}`;
      }
    };

    let rows = [];
    try { rows = await HopApi.listLeaveRequests(session.user_id); } catch (e) { console.warn(e); }
    const list = qs('#v-list');
    if (!rows.length) { list.innerHTML = `<div class="card" style="border-style:dashed;text-align:center;color:var(--muted)">Nog geen verlofaanvragen.</div>`; return; }
    list.innerHTML = rows.map((r) => {
      const d = r.days || leaveDays(r.start_date, r.end_date);
      return `<div class="lab-assign-row">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:var(--navy-deep)">${formatDate(r.start_date)} – ${formatDate(r.end_date)} <span style="font-weight:400;color:var(--muted)">(${d} dag${d === 1 ? '' : 'en'})</span></div>
          ${r.reason ? `<div style="font-size:12px;color:var(--muted)">${escapeHtml(r.reason)}</div>` : ''}
          ${r.review_note ? `<div style="font-size:12px;color:var(--muted);margin-top:4px">${escapeHtml(r.review_note)}</div>` : ''}
        </div>
        ${leaveStatusPill(r.status)}
        ${r.status === 'pending' ? `<button class="btn btn-ghost btn-sm" data-del="${r.id}" style="color:var(--danger)">${ICONS.trash}</button>` : ''}
      </div>`;
    }).join('');
    qsa('#v-list [data-del]').forEach((b) => b.onclick = async () => {
      if (!confirm('Aanvraag intrekken?')) return;
      try { await HopApi.deleteLeaveRequest(b.dataset.del); toast('Ingetrokken', 'success'); renderVerlofPilot(); }
      catch (e) { toast('Kon niet intrekken', 'error'); }
    });
  }

  async function renderVerlofCoach() {
    const body = qs('#prak-body');
    body.innerHTML = `<div id="v-list"><div class="spinner" style="margin:30px auto"></div></div>`;
    let rows = [];
    try { rows = await HopApi.listLeaveRequests(); } catch (e) { console.warn(e); }
    const pending = rows.filter((r) => r.status === 'pending');
    const reviewed = rows.filter((r) => r.status !== 'pending');

    const row = (r, showActions) => {
      const d = r.days || leaveDays(r.start_date, r.end_date);
      return `<div class="lab-assign-row">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(r.full_name || 'Piloot')}</div>
          <div style="font-size:12px;color:var(--muted)">${formatDate(r.start_date)} – ${formatDate(r.end_date)} (${d} dag${d === 1 ? '' : 'en'})${r.reason ? ' · ' + escapeHtml(r.reason) : ''}</div>
        </div>
        ${leaveStatusPill(r.status)}
        ${showActions ? `<button class="btn btn-primary btn-sm" data-approve="${r.id}">${ICONS.check} Goedkeuren</button><button class="btn btn-ghost btn-sm" data-reject="${r.id}" style="color:var(--danger)">Afwijzen</button>` : ''}
      </div>`;
    };

    qs('#v-list').innerHTML = `
      <div class="lab-section-label">In afwachting (${pending.length})</div>
      ${pending.length ? pending.map((r) => row(r, true)).join('') : '<div class="card" style="border-style:dashed;text-align:center;color:var(--muted);margin-bottom:20px">Niets om te beoordelen.</div>'}
      ${reviewed.length ? `<div class="lab-section-label" style="margin-top:24px">Eerder beoordeeld</div>${reviewed.map((r) => row(r, false)).join('')}` : ''}
    `;
    qsa('#v-list [data-approve]').forEach((b) => b.onclick = async () => {
      try { await HopApi.reviewLeaveRequest(b.dataset.approve, { status: 'approved', reviewed_by: session.user_id }); toast('Goedgekeurd', 'success'); renderVerlofCoach(); }
      catch (e) { toast('Kon niet goedkeuren', 'error'); }
    });
    qsa('#v-list [data-reject]').forEach((b) => b.onclick = async () => {
      if (!confirm('Verlofaanvraag afwijzen?')) return;
      try { await HopApi.reviewLeaveRequest(b.dataset.reject, { status: 'rejected', reviewed_by: session.user_id }); toast('Afgewezen', 'success'); renderVerlofCoach(); }
      catch (e) { toast('Kon niet afwijzen', 'error'); }
    });
  }

  // ==========================================================
  // LAB-GROEPEN — groepsomgevingen met tabs
  // hash: #lab | #lab/new | #lab/edit/<id>
  //       #lab/g/<id>[/<tab>[/<extra>]]
  // ==========================================================
  let _chatChannel = null;
  function clearChat() { if (_chatChannel) { HopApi.unsubscribe(_chatChannel); _chatChannel = null; } }
  function fmtSize(bytes) { if (!bytes) return ''; const kb = bytes / 1024; return kb < 1024 ? Math.round(kb) + ' KB' : (kb / 1024).toFixed(1) + ' MB'; }

  async function renderGroupList() {
    clearChat();
    const main = qs('#main');
    const isCoach = session.role === 'coach';
    main.innerHTML = `<div class="fade-up">
      <div class="eyebrow">Lab</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap">
        <div><h1 class="page-title">Groepen.</h1><p class="page-lead">Werk samen in een afgeschermde groepsomgeving.</p></div>
        ${isCoach ? `<button class="btn btn-coral" id="g-new">${ICONS.plus} Nieuwe groep</button>` : ''}
      </div>
      <div id="g-body"><div class="spinner" style="margin:60px auto"></div></div>
    </div>`;
    if (isCoach) qs('#g-new').onclick = () => go('lab', 'new');

    let groups = [];
    try { groups = await HopApi.listGroups(); } catch (e) { console.warn(e); }
    const membersByGroup = {};
    await Promise.all(groups.map(async (g) => { try { membersByGroup[g.id] = await HopApi.listGroupMembers(g.id); } catch (e) { membersByGroup[g.id] = []; } }));

    const isMember = (g) => (membersByGroup[g.id] || []).some((m) => m.user_id === session.user_id);
    const visible = isCoach ? groups : groups.filter((g) => isMember(g) || g.self_enroll);
    const body = qs('#g-body');
    if (!visible.length) {
      body.innerHTML = `<div class="card" style="border-style:dashed;text-align:center;color:var(--muted);padding:50px">${isCoach ? 'Nog geen groepen. Maak er een aan.' : 'Je zit nog in geen enkele groep. Je coach voegt je toe.'}</div>`;
      return;
    }
    body.innerHTML = `<div class="g-grid">${visible.map((g) => {
      const members = membersByGroup[g.id] || [];
      const mem = isMember(g);
      const canJoin = !mem && g.self_enroll;
      return `<div class="g-card">
        <div class="g-ico">${ICONS.users}</div>
        <div class="g-name">${escapeHtml(g.name)}</div>
        <div class="g-desc">${escapeHtml(g.description || '')}</div>
        <div class="g-foot">
          <span style="font-size:12px;color:var(--muted)">${members.length} lid/leden</span>
          ${(mem || isCoach) ? `<button class="btn btn-primary btn-sm" data-open="${g.id}">Openen</button>`
            : canJoin ? `<button class="btn btn-coral btn-sm" data-join="${g.id}">Inschrijven</button>` : ''}
        </div>
      </div>`;
    }).join('')}</div>`;
    qsa('#g-body [data-open]').forEach((b) => b.onclick = () => go('lab', 'g/' + b.dataset.open));
    qsa('#g-body [data-join]').forEach((b) => b.onclick = async () => {
      try { await HopApi.addGroupMember(b.dataset.join, session.user_id); toast('Ingeschreven', 'success'); go('lab', 'g/' + b.dataset.join); }
      catch (e) { toast('Kon niet inschrijven', 'error'); }
    });
  }

  async function renderGroupForm(id) {
    clearChat();
    const main = qs('#main');
    let g = null;
    if (id) { try { g = await HopApi.getGroup(id); } catch (e) { /* noop */ } }
    let pilots = []; const current = new Set();
    try { pilots = await HopApi.listPilots(); } catch (e) { /* noop */ }
    if (id) { try { (await HopApi.listGroupMembers(id)).forEach((m) => current.add(m.user_id)); } catch (e) { /* noop */ } }

    main.innerHTML = `<div class="fade-up" style="max-width:640px">
      <a href="#lab" class="back-link">${ICONS.chevLeft} Terug naar groepen</a>
      <h1 class="page-title" style="font-size:34px">${id ? 'Groep bewerken' : 'Nieuwe groep'}.</h1>
      <div class="card card-lg">
        <div class="field"><label class="field-label">Groepsnaam</label><input id="g-name" class="input" value="${escapeHtml(g ? g.name : '')}"></div>
        <div class="field"><label class="field-label">Omschrijving</label><textarea id="g-desc" class="input" rows="3">${escapeHtml(g ? (g.description || '') : '')}</textarea></div>
        <label class="lab-check" style="margin-bottom:14px"><input type="checkbox" id="g-self" ${g && g.self_enroll ? 'checked' : ''}><span>Deelnemers mogen zichzelf inschrijven</span></label>
        <div class="field" style="margin-bottom:0"><label class="field-label">Leden</label>
          <div id="g-members">${pilots.length ? pilots.map((u) => `<label class="lab-check"><input type="checkbox" value="${u.id}" ${current.has(u.id) ? 'checked' : ''}><span>${escapeHtml(u.full_name)}</span></label>`).join('') : '<span style="font-size:13px;color:var(--muted)">Geen deelnemers beschikbaar.</span>'}</div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn btn-coral" id="g-save">${id ? 'Opslaan' : 'Groep aanmaken'} ${ICONS.arrowRight}</button>
          ${id ? `<button class="btn btn-ghost" id="g-del" style="color:var(--danger)">${ICONS.trash} Groep verwijderen</button>` : ''}
        </div>
      </div>
    </div>`;

    qs('#g-save').onclick = async () => {
      const name = qs('#g-name').value.trim();
      if (!name) { toast('Naam is verplicht', 'error'); return; }
      const ids = qsa('#g-members input:checked').map((c) => c.value);
      const payload = { name, description: qs('#g-desc').value.trim(), self_enroll: qs('#g-self').checked };
      const btn = qs('#g-save'); btn.disabled = true; btn.textContent = 'Opslaan…';
      try {
        if (id) { await HopApi.updateGroup(id, payload); await HopApi.setGroupMembers(id, ids); toast('Opgeslagen', 'success'); go('lab', 'g/' + id); }
        else { const grp = await HopApi.createGroup({ ...payload, created_by: session.user_id, member_ids: ids }); toast('Groep aangemaakt', 'success'); go('lab', 'g/' + grp.id); }
      } catch (e) { console.error(e); toast('Kon niet opslaan: ' + e.message, 'error', 3000); btn.disabled = false; btn.textContent = id ? 'Opslaan' : 'Groep aanmaken'; }
    };
    if (id) qs('#g-del').onclick = async () => {
      if (!confirm('Groep en alle inhoud verwijderen?')) return;
      try { await HopApi.deleteGroup(id); toast('Groep verwijderd', 'success'); go('lab'); } catch (e) { toast('Mislukt', 'error'); }
    };
  }

  async function renderGroupHome(id, tab, extra) {
    clearChat();
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    const isCoach = session.role === 'coach';
    let g, members = [];
    try { g = await HopApi.getGroup(id); if (g) members = await HopApi.listGroupMembers(id); } catch (e) { console.warn(e); }
    const isMember = members.some((m) => m.user_id === session.user_id);
    if (!g || (!isCoach && !isMember)) {
      main.innerHTML = `<div class="fade-up"><a href="#lab" class="back-link">${ICONS.chevLeft} Terug</a><div class="card" style="color:var(--danger)">Geen toegang tot deze groep.</div></div>`;
      return;
    }
    const nameMap = {}; members.forEach((m) => { nameMap[m.user_id] = m.full_name; });
    const GT = [['overzicht', 'Overzicht'], ['bestanden', 'Bestanden'], ['taken', 'Taken'], ['chat', 'Chat'], ['forum', 'Forum'], ['notulen', 'Notulen'], ['leden', 'Leden']];
    main.innerHTML = `<div class="fade-up">
      <a href="#lab" class="back-link">${ICONS.chevLeft} Terug naar groepen</a>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div><div class="eyebrow">Lab-groep</div><h1 class="page-title">${escapeHtml(g.name)}.</h1></div>
        ${isCoach ? `<button class="btn btn-ghost btn-sm" id="g-edit">${ICONS.pen} Groep bewerken</button>` : ''}
      </div>
      <div class="tabs" id="g-tabs">${GT.map(([k, l]) => `<button class="tab ${k === tab ? 'active' : ''}" data-t="${k}">${l}</button>`).join('')}</div>
      <div id="g-tab-body"><div class="spinner" style="margin:50px auto"></div></div>
    </div>`;
    if (isCoach) qs('#g-edit').onclick = () => go('lab', 'edit/' + id);
    qsa('#g-tabs .tab').forEach((b) => b.onclick = () => go('lab', 'g/' + id + '/' + b.dataset.t));

    const ctx = { id, g, members, nameMap, isCoach, isMember };
    if (tab === 'bestanden') groupFiles(ctx);
    else if (tab === 'taken') groupTasks(ctx);
    else if (tab === 'chat') groupChat(ctx);
    else if (tab === 'forum') groupForum(ctx, extra);
    else if (tab === 'notulen') groupMinutes(ctx);
    else if (tab === 'leden') groupLeden(ctx);
    else groupOverzicht(ctx);
  }

  async function groupOverzicht(ctx) {
    const el = qs('#g-tab-body');
    el.innerHTML = `${ctx.g.description ? `<div class="card card-lg" style="margin-bottom:18px"><div style="white-space:pre-line;font-size:14px;line-height:1.6">${escapeHtml(ctx.g.description)}</div></div>` : ''}
      <div id="g-stats"><div class="spinner" style="margin:30px auto"></div></div>`;
    let files = [], tasks = [], threads = [], minutes = [];
    try { [files, tasks, threads, minutes] = await Promise.all([HopApi.listGroupFiles(ctx.id), HopApi.listGroupTasks(ctx.id), HopApi.listThreads(ctx.id), HopApi.listMinutes(ctx.id)]); } catch (e) { /* noop */ }
    const openTasks = tasks.filter((t) => t.status !== 'done').length;
    const stat = (label, val, tab) => `<button class="g-stat" data-goto="${tab}"><div class="g-stat-v">${val}</div><div class="g-stat-l">${label}</div></button>`;
    qs('#g-stats').innerHTML = `<div class="g-stat-grid">
      ${stat('Leden', ctx.members.length, 'leden')}
      ${stat('Bestanden', files.length, 'bestanden')}
      ${stat('Open taken', openTasks, 'taken')}
      ${stat('Forumtopics', threads.length, 'forum')}
      ${stat('Notulen', minutes.length, 'notulen')}
    </div>`;
    qsa('#g-stats [data-goto]').forEach((b) => b.onclick = () => go('lab', 'g/' + ctx.id + '/' + b.dataset.goto));
  }

  function groupLeden(ctx) {
    const el = qs('#g-tab-body');
    el.innerHTML = `<div class="card card-lg">
      <div class="lab-section-label">Leden (${ctx.members.length})</div>
      <div>${ctx.members.length ? ctx.members.map((m) => `<span class="ev-chip">${escapeHtml(m.full_name)}${m.role === 'coach' ? ' · coach' : ''}</span>`).join('') : '<span style="font-size:13px;color:var(--muted)">Nog geen leden.</span>'}</div>
      ${ctx.isCoach ? `<button class="btn btn-ghost btn-sm" id="g-manage" style="margin-top:14px">${ICONS.pen} Leden beheren</button>` : ''}
    </div>`;
    if (ctx.isCoach) qs('#g-manage').onclick = () => go('lab', 'edit/' + ctx.id);
  }

  async function groupFiles(ctx) {
    const el = qs('#g-tab-body');
    el.innerHTML = `<div class="card card-lg">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <div class="lab-section-label" style="margin:0">Bestanden</div>
        <div><input type="file" id="g-file" style="display:none"><button class="btn btn-coral btn-sm" id="g-file-pick">${LAB_UPLOAD} Bestand uploaden</button></div>
      </div>
      <div id="g-file-list"><div class="spinner" style="margin:30px auto"></div></div>
    </div>`;
    const fileInput = qs('#g-file');
    qs('#g-file-pick').onclick = () => fileInput.click();
    fileInput.onchange = async () => {
      const f = fileInput.files[0]; if (!f) return;
      qs('#g-file-pick').textContent = 'Uploaden…';
      try { await HopApi.uploadGroupFile(ctx.id, f, session.user_id); toast('Geüpload', 'success'); } catch (e) { toast('Upload mislukt: ' + e.message, 'error', 3000); }
      groupFiles(ctx);
    };
    let files = []; try { files = await HopApi.listGroupFiles(ctx.id); } catch (e) { /* noop */ }
    const list = qs('#g-file-list');
    if (!files.length) { list.innerHTML = `<div style="font-size:13px;color:var(--muted)">Nog geen bestanden gedeeld.</div>`; return; }
    list.innerHTML = files.map((f) => {
      const url = HopApi.documentUrl(f.path, f.name);
      return `<div class="lab-doc-row" style="margin-bottom:8px">
        ${ICONS.fileText}
        <div style="flex:1;min-width:0">
          <a href="${url}" target="_blank" rel="noopener" style="font-weight:600;color:var(--navy-deep)">${escapeHtml(f.name)}</a>
          <div style="font-size:12px;color:var(--muted)">${f.uploader ? escapeHtml(f.uploader) + ' · ' : ''}${formatDate(f.created_at)}${f.size ? ' · ' + fmtSize(f.size) : ''}</div>
        </div>
        <a class="btn btn-ghost btn-sm" href="${url}" target="_blank" rel="noopener">${LAB_DOWNLOAD}</a>
        <button class="btn btn-ghost btn-sm" data-del-f="${f.id}" data-path="${escapeHtml(f.path)}" style="color:var(--danger)">${ICONS.trash}</button>
      </div>`;
    }).join('');
    qsa('#g-file-list [data-del-f]').forEach((b) => b.onclick = async () => {
      if (!confirm('Bestand verwijderen?')) return;
      try { await HopApi.deleteGroupFile(b.dataset.delF, b.dataset.path); groupFiles(ctx); } catch (e) { toast('Mislukt', 'error'); }
    });
  }

  async function groupTasks(ctx) {
    const el = qs('#g-tab-body');
    el.innerHTML = `<div class="card card-lg">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <div class="lab-section-label" style="margin:0">Taken & deadlines</div>
        <button class="btn btn-ghost btn-sm" id="g-task-add">${ICONS.plus} Taak</button>
      </div>
      <div id="g-task-form" style="display:none;margin-bottom:14px"></div>
      <div id="g-task-list"><div class="spinner" style="margin:30px auto"></div></div>
    </div>`;
    qs('#g-task-add').onclick = () => {
      const box = qs('#g-task-form');
      if (box.style.display === 'block') { box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
        <div class="field" style="margin:0;flex:2;min-width:160px"><label class="field-label">Taak</label><input id="t-title" class="input" placeholder="Wat moet er gebeuren?"></div>
        <div class="field" style="margin:0;flex:1;min-width:140px"><label class="field-label">Toewijzen</label><select id="t-assignee" class="input"><option value="">— niemand —</option>${ctx.members.map((m) => `<option value="${m.user_id}">${escapeHtml(m.full_name)}</option>`).join('')}</select></div>
        <div class="field" style="margin:0;min-width:110px"><label class="field-label">Prioriteit</label><select id="t-prio" class="input"><option value="low">Laag</option><option value="normal" selected>Normaal</option><option value="high">Hoog</option></select></div>
        <div class="field" style="margin:0;min-width:140px"><label class="field-label">Deadline</label><input id="t-due" type="date" class="input"></div>
        <button class="btn btn-coral btn-sm" id="t-save">Toevoegen</button>
      </div>`;
      qs('#t-save').onclick = async () => {
        const title = qs('#t-title').value.trim(); if (!title) { toast('Vul een taak in', 'error'); return; }
        try { await HopApi.createTask({ group_id: ctx.id, title, assignee_id: qs('#t-assignee').value || null, priority: qs('#t-prio').value, due_date: qs('#t-due').value || null, created_by: session.user_id }); toast('Taak toegevoegd', 'success'); groupTasks(ctx); } catch (e) { toast('Mislukt', 'error'); }
      };
    };
    let tasks = []; try { tasks = await HopApi.listGroupTasks(ctx.id); } catch (e) { /* noop */ }
    const order = { open: 0, in_progress: 1, done: 2 };
    tasks.sort((a, b) => (order[a.status] - order[b.status]) || ((a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1));
    const list = qs('#g-task-list');
    if (!tasks.length) { list.innerHTML = `<div style="font-size:13px;color:var(--muted)">Nog geen taken.</div>`; return; }
    const PRIO = { low: { l: 'Laag', c: 'var(--muted)' }, normal: { l: 'Normaal', c: 'var(--navy)' }, high: { l: 'Hoog', c: 'var(--danger)' } };
    const today = new Date(new Date().toDateString());
    list.innerHTML = tasks.map((t) => {
      const p = PRIO[t.priority] || PRIO.normal;
      const overdue = t.due_date && t.status !== 'done' && new Date(t.due_date) < today;
      return `<div class="g-task">
        <select class="g-task-status input" data-st="${t.id}">
          <option value="open" ${t.status === 'open' ? 'selected' : ''}>Open</option>
          <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>Bezig</option>
          <option value="done" ${t.status === 'done' ? 'selected' : ''}>Afgerond</option>
        </select>
        <div style="flex:1;min-width:0">
          <div style="font-weight:500;${t.status === 'done' ? 'text-decoration:line-through;color:var(--muted)' : ''}">${escapeHtml(t.title)}</div>
          <div style="font-size:12px;color:var(--muted);display:flex;gap:10px;flex-wrap:wrap">
            <span style="color:${p.c};font-weight:600">${p.l}</span>
            ${t.assignee_id ? `<span>${escapeHtml(ctx.nameMap[t.assignee_id] || '—')}</span>` : ''}
            ${t.due_date ? `<span style="${overdue ? 'color:var(--danger);font-weight:600' : ''}">Deadline ${formatDate(t.due_date)}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" data-del-t="${t.id}" style="color:var(--danger)">${ICONS.trash}</button>
      </div>`;
    }).join('');
    qsa('#g-task-list [data-st]').forEach((s) => s.onchange = async () => { try { await HopApi.updateTask(s.dataset.st, { status: s.value }); groupTasks(ctx); } catch (e) { toast('Mislukt', 'error'); } });
    qsa('#g-task-list [data-del-t]').forEach((b) => b.onclick = async () => { if (!confirm('Taak verwijderen?')) return; try { await HopApi.deleteTask(b.dataset.delT); groupTasks(ctx); } catch (e) { toast('Mislukt', 'error'); } });
  }

  function chatBubble(m, ctx) {
    const mine = m.author_id === session.user_id;
    const name = m.author || ctx.nameMap[m.author_id] || 'Onbekend';
    return `<div class="chat-row ${mine ? 'mine' : ''}">
      <div class="chat-bubble">
        ${mine ? '' : `<div class="chat-name">${escapeHtml(name)}</div>`}
        <div>${escapeHtml(m.body)}</div>
        <div class="chat-time">${formatDateTime(m.created_at)}</div>
      </div>
    </div>`;
  }
  async function groupChat(ctx) {
    const el = qs('#g-tab-body');
    el.innerHTML = `<div class="card card-lg" style="display:flex;flex-direction:column;height:60vh;min-height:340px;padding:0;overflow:hidden">
      <div id="chat-scroll" style="flex:1;overflow-y:auto;padding:18px"></div>
      <div style="display:flex;gap:8px;padding:12px;border-top:1px solid var(--sand)">
        <input id="chat-input" class="input" placeholder="Bericht…" style="flex:1" autocomplete="off">
        <button class="btn btn-coral" id="chat-send">${ICONS.send}</button>
      </div>
    </div>`;
    const scroll = qs('#chat-scroll');
    let msgs = []; try { msgs = await HopApi.listMessages(ctx.id); } catch (e) { /* noop */ }
    const render = () => { scroll.innerHTML = msgs.length ? msgs.map((m) => chatBubble(m, ctx)).join('') : `<div style="font-size:13px;color:var(--muted);text-align:center;margin-top:20px">Nog geen berichten. Zeg hallo 👋</div>`; scroll.scrollTop = scroll.scrollHeight; };
    render();
    const send = async () => {
      const inp = qs('#chat-input'); const v = inp.value.trim(); if (!v) return; inp.value = '';
      try { const row = await HopApi.sendMessage({ group_id: ctx.id, author_id: session.user_id, body: v }); if (!msgs.some((m) => m.id === row.id)) { msgs.push({ ...row, author: ctx.nameMap[row.author_id] || '' }); render(); } }
      catch (e) { toast('Kon niet versturen', 'error'); }
    };
    qs('#chat-send').onclick = send;
    qs('#chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    clearChat();
    _chatChannel = HopApi.subscribeMessages(ctx.id, (row) => {
      if (msgs.some((m) => m.id === row.id)) return;
      msgs.push({ ...row, author: ctx.nameMap[row.author_id] || '' });
      render();
    });
  }

  async function groupForum(ctx, threadId) {
    if (threadId) return groupThread(ctx, threadId);
    const el = qs('#g-tab-body');
    el.innerHTML = `<div class="card card-lg">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <div class="lab-section-label" style="margin:0">Forum</div>
        <button class="btn btn-ghost btn-sm" id="f-new">${ICONS.plus} Nieuw topic</button>
      </div>
      <div id="f-form" style="display:none;margin-bottom:14px"></div>
      <div id="f-list"><div class="spinner" style="margin:30px auto"></div></div>
    </div>`;
    qs('#f-new').onclick = () => {
      const box = qs('#f-form');
      if (box.style.display === 'block') { box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = `<div class="field" style="margin-bottom:8px"><label class="field-label">Onderwerp</label><input id="f-title" class="input"></div>
        <div class="field" style="margin-bottom:8px"><label class="field-label">Bericht</label><textarea id="f-body" class="input" rows="3"></textarea></div>
        <button class="btn btn-coral btn-sm" id="f-save">Plaatsen</button>`;
      qs('#f-save').onclick = async () => {
        const title = qs('#f-title').value.trim(); if (!title) { toast('Onderwerp verplicht', 'error'); return; }
        try { const t = await HopApi.createThread({ group_id: ctx.id, title, created_by: session.user_id, body: qs('#f-body').value.trim() }); toast('Geplaatst', 'success'); go('lab', 'g/' + ctx.id + '/forum/' + t.id); } catch (e) { toast('Mislukt', 'error'); }
      };
    };
    let threads = []; try { threads = await HopApi.listThreads(ctx.id); } catch (e) { /* noop */ }
    const list = qs('#f-list');
    if (!threads.length) { list.innerHTML = `<div style="font-size:13px;color:var(--muted)">Nog geen topics.</div>`; return; }
    list.innerHTML = threads.map((t) => `<div class="lab-assign-row">
      <div style="flex:1;min-width:0"><div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(t.title)}</div><div style="font-size:12px;color:var(--muted)">${escapeHtml(t.author || '')} · ${formatDate(t.created_at)}</div></div>
      <button class="btn btn-primary btn-sm" data-open="${t.id}">Openen</button>
      ${ctx.isCoach ? `<button class="btn btn-ghost btn-sm" data-del-th="${t.id}" style="color:var(--danger)">${ICONS.trash}</button>` : ''}
    </div>`).join('');
    qsa('#f-list [data-open]').forEach((b) => b.onclick = () => go('lab', 'g/' + ctx.id + '/forum/' + b.dataset.open));
    qsa('#f-list [data-del-th]').forEach((b) => b.onclick = async () => { if (!confirm('Topic verwijderen?')) return; try { await HopApi.deleteThread(b.dataset.delTh); groupForum(ctx); } catch (e) { toast('Mislukt', 'error'); } });
  }
  async function groupThread(ctx, threadId) {
    const el = qs('#g-tab-body');
    el.innerHTML = `<div class="card card-lg"><div class="spinner" style="margin:40px auto"></div></div>`;
    let posts = []; try { posts = await HopApi.listPosts(threadId); } catch (e) { /* noop */ }
    el.innerHTML = `<a href="#lab/g/${ctx.id}/forum" class="back-link" style="margin-bottom:14px">${ICONS.chevLeft} Terug naar forum</a>
      <div class="card card-lg">
        <div id="thread-posts">${posts.length ? posts.map((p) => `<div class="c-note"><div style="font-size:12px;color:var(--muted)">${escapeHtml(p.author || '')} · ${formatDateTime(p.created_at)}</div><div style="white-space:pre-line;font-size:14px;margin-top:4px">${escapeHtml(p.body)}</div></div>`).join('') : '<div style="font-size:13px;color:var(--muted)">Nog geen berichten.</div>'}</div>
        <div style="margin-top:16px;border-top:1px dashed var(--sand);padding-top:14px">
          <textarea id="p-body" class="input" rows="3" placeholder="Reageer…"></textarea>
          <button class="btn btn-coral btn-sm" id="p-send" style="margin-top:8px">Reageren</button>
        </div>
      </div>`;
    qs('#p-send').onclick = async () => {
      const b = qs('#p-body').value.trim(); if (!b) return;
      try { await HopApi.createPost({ thread_id: threadId, group_id: ctx.id, author_id: session.user_id, body: b }); groupThread(ctx, threadId); } catch (e) { toast('Mislukt', 'error'); }
    };
  }

  async function groupMinutes(ctx) {
    const el = qs('#g-tab-body');
    el.innerHTML = `<div class="card card-lg">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <div class="lab-section-label" style="margin:0">Notulen</div>
        <button class="btn btn-ghost btn-sm" id="m-new">${ICONS.plus} Notulen toevoegen</button>
      </div>
      <div id="m-form" style="display:none;margin-bottom:14px"></div>
      <div id="m-list"><div class="spinner" style="margin:30px auto"></div></div>
    </div>`;
    qs('#m-new').onclick = () => {
      const box = qs('#m-form');
      if (box.style.display === 'block') { box.style.display = 'none'; return; }
      box.style.display = 'block';
      box.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap">
          <div class="field" style="flex:2;min-width:160px;margin-bottom:8px"><label class="field-label">Titel</label><input id="m-title" class="input" placeholder="bv. Teamoverleg"></div>
          <div class="field" style="flex:1;min-width:150px;margin-bottom:8px"><label class="field-label">Datum</label><input id="m-date" type="date" class="input"></div>
        </div>
        <div class="field" style="margin-bottom:8px"><label class="field-label">Notulen</label><textarea id="m-body" class="input" rows="5" placeholder="Besluiten, actiepunten…"></textarea></div>
        <button class="btn btn-coral btn-sm" id="m-save">Opslaan</button>`;
      qs('#m-save').onclick = async () => {
        const title = qs('#m-title').value.trim(); if (!title) { toast('Titel verplicht', 'error'); return; }
        try { await HopApi.createMinutes({ group_id: ctx.id, title, body: qs('#m-body').value.trim(), meeting_date: qs('#m-date').value || null, created_by: session.user_id }); toast('Opgeslagen', 'success'); groupMinutes(ctx); } catch (e) { toast('Mislukt', 'error'); }
      };
    };
    let mins = []; try { mins = await HopApi.listMinutes(ctx.id); } catch (e) { /* noop */ }
    const list = qs('#m-list');
    if (!mins.length) { list.innerHTML = `<div style="font-size:13px;color:var(--muted)">Nog geen notulen.</div>`; return; }
    list.innerHTML = mins.map((m) => `<div class="c-note">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
        <div><span style="font-weight:600;color:var(--navy-deep)">${escapeHtml(m.title)}</span> <span style="font-size:12px;color:var(--muted)">${m.meeting_date ? '· ' + formatDate(m.meeting_date) : ''}</span></div>
        ${ctx.isCoach ? `<button class="btn btn-ghost btn-sm" data-del-m="${m.id}" style="color:var(--danger)">${ICONS.trash}</button>` : ''}
      </div>
      ${m.body ? `<div style="white-space:pre-line;font-size:14px;margin-top:6px">${escapeHtml(m.body)}</div>` : ''}
    </div>`).join('');
    qsa('#m-list [data-del-m]').forEach((b) => b.onclick = async () => { if (!confirm('Notulen verwijderen?')) return; try { await HopApi.deleteMinutes(b.dataset.delM); groupMinutes(ctx); } catch (e) { toast('Mislukt', 'error'); } });
  }

  // ==========================================================
  // OEFENINGEN — individueel oefenplatform (fase 1+2)
  // ==========================================================
  function oefenCat(id) { return (window.OEFEN_CATEGORIES || []).find((c) => c.id === id) || null; }
  function oefenData(id) { return (window.OEFEN_DATA || {})[id] || null; }

  // Normaliseer een categorie naar speelbare 'groepen' (type/subarea)
  function oefenGroups(data) {
    if (!data) return [];
    if (data.types) return data.types.map((t) => ({ groupId: t.typeId, name: t.name, questions: t.questions || [], levels: t.levels || [] }));
    if (data.subareas) return data.subareas.map((s) => ({ groupId: s.subareaId || s.typeId || s.id, name: s.name, questions: s.questions || [], levels: s.levels || [] }));
    if (data.questions) return [{ groupId: 'algemeen', name: data.name, questions: data.questions, levels: [] }];
    if (data.exercises) return data.exercises.map((e) => ({ groupId: e.exerciseId, name: e.name, questions: [], levels: e.levels || [] }));
    return [];
  }

  // Voortgang per categorie uit score-rijen (laatste score per type)
  function oefenProgress(catId, scores) {
    const data = oefenData(catId);
    const playableIds = INTERACTIVE_EXERCISES[catId] ? Object.keys(INTERACTIVE_EXERCISES[catId]) : null;
    const groups = oefenGroups(data).filter((g) => playableIds ? playableIds.includes(g.groupId) : g.questions.length);
    const rows = scores.filter((s) => s.category_id === catId);
    const latestByType = {};
    rows.forEach((r) => { latestByType[r.type_id] = r; }); // scores komen chronologisch → laatste wint
    const doneTypes = groups.filter((g) => latestByType[g.groupId]);
    // Gemiddelde alleen over percentage-scores; ms-scores (reactietijd) horen niet in dezelfde optelling
    const pctRows = doneTypes.map((g) => latestByType[g.groupId]).filter((r) => (r.scale_type || 'percentage') === 'percentage');
    const avg = pctRows.length ? Math.round(pctRows.reduce((s, r) => s + Number(r.score), 0) / pctRows.length) : null;
    const pct = groups.length ? Math.round((doneTypes.length / groups.length) * 100) : 0;
    return { avg, completion: pct, done: doneTypes.length, total: groups.length };
  }

  function oefenFormatScore(value, scaleType) {
    return scaleType === 'milliseconds' ? `${Math.round(value)} ms` : `${Math.round(value)}%`;
  }

  const OEFEN_LOCK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  async function renderOefeningenIndex() {
    const main = qs('#main');
    if (session.role === 'coach') return renderOefeningenCoach();
    main.innerHTML = `<div class="fade-up">
      <div class="eyebrow">Oefeningen</div>
      <h1 class="page-title">Oefeningen.</h1>
      <p class="page-lead">Oefen op eigen tempo voor de pilotenselecties. Je coach geeft categorieën vrij zodra je er klaar voor bent.</p>
      <div id="oef-body"><div class="spinner" style="margin:60px auto"></div></div>
    </div>`;
    let unlocks = [], scores = [];
    try { [unlocks, scores] = await Promise.all([HopApi.listUnlocks(session.user_id), HopApi.listExerciseScores(session.user_id)]); } catch (e) { console.warn(e); }
    qs('#oef-body').innerHTML = `<div class="sect-grid">${(window.OEFEN_CATEGORIES || []).map((c) => oefenCard(c, unlocks.includes(c.id), scores)).join('')}</div>`;
    qsa('#oef-body [data-open]').forEach((b) => b.onclick = () => go('oefenmateriaal', 'c/' + b.dataset.open));
  }

  function oefenCard(c, unlocked, scores) {
    if (!unlocked) {
      return `<div class="lab-card locked">
        <div class="lab-lock">${OEFEN_LOCK}</div>
        <div class="sect-t">${c.number}. ${escapeHtml(c.name)}</div>
        <div class="sect-d">Wordt vrijgegeven door je coach.</div>
      </div>`;
    }
    const pr = oefenProgress(c.id, scores);
    const foot = pr.total ? `${pr.done}/${pr.total} onderdelen${pr.avg != null ? ` · gem. ${pr.avg}%` : ''}` : 'Interactief — komt later';
    return `<button class="lab-card clickable" data-open="${c.id}">
      <div class="lab-ico" style="background:${c.color}1a;color:${c.color}">${ICONS.target}</div>
      <div class="sect-t">${c.number}. ${escapeHtml(c.name)}</div>
      <div class="sect-d">${escapeHtml((oefenData(c.id) || {}).description || '')}</div>
      <div class="lab-foot" style="color:${c.color}">${foot} ${ICONS.arrowRight}</div>
    </button>`;
  }

  // ---------- COACH: vrijgeven per kandidaat ----------
  async function renderOefeningenCoach() {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up">
      <div class="eyebrow">Oefeningen · Coach</div>
      <h1 class="page-title">Oefeningen vrijgeven.</h1>
      <p class="page-lead">Kies een kandidaat en geef categorieën vrij zodra hij er klaar voor is.</p>
      <div class="field" style="max-width:320px"><label class="field-label">Kandidaat</label><select id="oef-cand" class="input"></select></div>
      <div id="oef-coach-body"></div>
    </div>`;
    let pilots = [];
    try { pilots = await HopApi.listPilots(); } catch (e) { console.warn(e); }
    const sel = qs('#oef-cand');
    sel.innerHTML = `<option value="">— kies kandidaat —</option>` + pilots.map((u) => `<option value="${u.id}">${escapeHtml(u.full_name)}</option>`).join('');
    sel.onchange = () => loadCand(sel.value);
    async function loadCand(cid) {
      const body = qs('#oef-coach-body');
      if (!cid) { body.innerHTML = ''; return; }
      body.innerHTML = `<div class="spinner" style="margin:40px auto"></div>`;
      let unlocks = [], scores = [];
      try { [unlocks, scores] = await Promise.all([HopApi.listUnlocks(cid), HopApi.listExerciseScores(cid)]); } catch (e) { console.warn(e); }
      body.innerHTML = `<div class="card card-lg" style="margin-top:8px">${(window.OEFEN_CATEGORIES || []).map((c) => {
        const on = unlocks.includes(c.id);
        const pr = oefenProgress(c.id, scores);
        return `<div class="lab-assign-row">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--navy-deep)">${c.number}. ${escapeHtml(c.name)}</div>
            <div style="font-size:12px;color:var(--muted)">${pr.total ? `${pr.done}/${pr.total} gedaan${pr.avg != null ? ` · gem. ${pr.avg}%` : ''}` : 'interactief (later)'}</div>
          </div>
          <label class="oef-switch"><input type="checkbox" data-unlock="${c.id}" ${on ? 'checked' : ''}><span>${on ? 'Vrijgegeven' : 'Vergrendeld'}</span></label>
        </div>`;
      }).join('')}</div>`;
      qsa('#oef-coach-body [data-unlock]').forEach((cb) => cb.onchange = async () => {
        try {
          await HopApi.setUnlock(cid, cb.dataset.unlock, cb.checked, session.user_id);
          cb.parentElement.querySelector('span').textContent = cb.checked ? 'Vrijgegeven' : 'Vergrendeld';
          toast(cb.checked ? 'Vrijgegeven' : 'Vergrendeld', 'success');
        } catch (e) { console.error(e); toast('Mislukt: ' + e.message, 'error', 3500); cb.checked = !cb.checked; }
      });
    }
  }

  // ---------- KANDIDAAT: categorie-detail ----------
  async function renderCategoryDetail(catId) {
    const main = qs('#main');
    const c = oefenCat(catId);
    const data = oefenData(catId);
    if (!c || !data) { main.innerHTML = `<div class="fade-up"><a href="#oefenmateriaal" class="back-link">${ICONS.chevLeft} Terug</a><div class="card" style="color:var(--danger)">Onbekende categorie.</div></div>`; return; }
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    let unlocks = [], scores = [];
    try { [unlocks, scores] = await Promise.all([HopApi.listUnlocks(session.user_id), HopApi.listExerciseScores(session.user_id)]); } catch (e) { console.warn(e); }
    if (!unlocks.includes(catId)) {
      main.innerHTML = `<div class="fade-up"><a href="#oefenmateriaal" class="back-link">${ICONS.chevLeft} Terug naar oefeningen</a>
        <div class="card" style="border-style:dashed;text-align:center;color:var(--muted);padding:50px">${OEFEN_LOCK}<div style="margin-top:10px">Deze categorie is nog vergrendeld. Wordt vrijgegeven door je coach.</div></div></div>`;
      return;
    }
    const groups = oefenGroups(data);
    const interactiveIds = INTERACTIVE_EXERCISES[catId] || {};
    const latestByType = {}; scores.filter((s) => s.category_id === catId).forEach((r) => { latestByType[r.type_id] = r; });
    const bestByType = {};
    scores.filter((s) => s.category_id === catId).forEach((r) => {
      const cur = bestByType[r.type_id];
      const val = Number(r.score);
      const scaleType = r.scale_type || 'percentage';
      if (!cur) { bestByType[r.type_id] = { value: val, scaleType }; return; }
      const better = scaleType === 'milliseconds' ? val < cur.value : val > cur.value;
      if (better) bestByType[r.type_id] = { value: val, scaleType };
    });

    const hasScores = scores.some((s) => s.category_id === catId);
    main.innerHTML = `<div class="fade-up">
      <a href="#oefenmateriaal" class="back-link">${ICONS.chevLeft} Terug naar oefeningen</a>
      <div class="eyebrow">Categorie ${c.number}</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap">
        <h1 class="page-title">${escapeHtml(c.name)}.</h1>
        ${hasScores ? `<button class="btn btn-ghost btn-sm" id="oef-progress-link">${ICONS.trend} Voortgang bekijken</button>` : ''}
      </div>
      <p class="page-lead">${escapeHtml(data.description || '')}</p>
      <div>${groups.map((g) => {
        const playable = !!interactiveIds[g.groupId] || g.questions.length > 0;
        const isInteractive = !!interactiveIds[g.groupId];
        const hasGenerator = !!(QUESTION_GENERATORS[catId] || {})[g.groupId];
        const best = bestByType[g.groupId];
        const bestLabel = best != null ? ` · beste ${oefenFormatScore(best.value, best.scaleType)}` : '';
        const countLabel = hasGenerator ? `${OEFEN_MIN_QUESTIONS}+ vragen (ververst elke beurt)` : `${g.questions.length} vragen`;
        const meta = isInteractive
          ? `Interactieve oefening${bestLabel}`
          : (playable ? `${countLabel}${g.levels.length ? ` · ${g.levels.length} niveaus` : ''}${bestLabel}` : 'Interactieve oefening — komt in een latere fase');
        return `<div class="lab-assign-row">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(g.name)}</div>
            <div style="font-size:12px;color:var(--muted)">${meta}</div>
          </div>
          ${playable ? `<button class="btn btn-coral btn-sm" data-start="${g.groupId}">${best != null ? 'Opnieuw' : 'Start'} ${ICONS.arrowRight}</button>` : `<span class="pill" style="background:var(--sand);color:var(--muted)">Binnenkort</span>`}
        </div>`;
      }).join('')}</div>
    </div>`;
    qsa('[data-start]').forEach((b) => b.onclick = () => go('oefenmateriaal', 'c/' + catId + '/x/' + b.dataset.start));
    if (hasScores) qs('#oef-progress-link').onclick = () => go('oefenmateriaal', 'c/' + catId + '/voortgang');
  }

  // ---------- KANDIDAAT: voortgang (grafiek per oefening) ----------
  async function renderOefenProgress(catId) {
    const main = qs('#main');
    const c = oefenCat(catId);
    const data = oefenData(catId);
    if (!c || !data) { main.innerHTML = `<div class="fade-up"><a href="#oefenmateriaal" class="back-link">${ICONS.chevLeft} Terug</a><div class="card" style="color:var(--danger)">Onbekende categorie.</div></div>`; return; }
    main.innerHTML = `<div class="fade-up"><div class="spinner" style="margin:80px auto"></div></div>`;
    let scores = [];
    try { scores = await HopApi.listExerciseScores(session.user_id); } catch (e) { console.warn(e); }

    const rows = scores.filter((s) => s.category_id === catId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const byType = {};
    rows.forEach((r) => { (byType[r.type_id] = byType[r.type_id] || []).push(r); });
    const groups = oefenGroups(data).filter((g) => byType[g.groupId] && byType[g.groupId].length);

    const backHref = '#oefenmateriaal/c/' + catId;
    main.innerHTML = `<div class="fade-up">
      <a href="${backHref}" class="back-link">${ICONS.chevLeft} Terug naar ${escapeHtml(c.name)}</a>
      <div class="eyebrow">Categorie ${c.number} · Voortgang</div>
      <h1 class="page-title">Voortgang.</h1>
      <p class="page-lead">Jouw scores per oefening over tijd. Bij reactietijd (ms) is lager beter.</p>
      <div id="prog-body"></div>
    </div>`;

    const body = qs('#prog-body');
    if (!groups.length) {
      body.innerHTML = `<div class="card" style="border-style:dashed;text-align:center;color:var(--muted);padding:50px">Nog geen scores in deze categorie.</div>`;
      return;
    }

    body.innerHTML = groups.map((g) => {
      const list = byType[g.groupId];
      const scaleType = list[list.length - 1].scale_type || 'percentage';
      const first = list[0], latest = list[list.length - 1];
      const bestVal = scaleType === 'milliseconds' ? Math.min(...list.map((r) => Number(r.score))) : Math.max(...list.map((r) => Number(r.score)));
      const improved = scaleType === 'milliseconds' ? Number(latest.score) < Number(first.score) : Number(latest.score) > Number(first.score);
      return `<div class="card card-lg" style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:12px">
          <div style="font-weight:600;color:var(--navy-deep)">${escapeHtml(g.name)}</div>
          <div style="font-size:12px;color:var(--muted)">${list.length} poging${list.length === 1 ? '' : 'en'}</div>
        </div>
        <div class="oef-chart-wrap"><canvas id="chart-${g.groupId}" width="640" height="180"></canvas></div>
        <div class="oef-chart-stats">
          <div><span class="oef-chart-stat-label">Eerste</span><span class="oef-chart-stat-val">${oefenFormatScore(first.score, scaleType)}</span></div>
          <div><span class="oef-chart-stat-label">Laatste</span><span class="oef-chart-stat-val" style="color:${improved ? '#15803D' : 'var(--ink)'}">${oefenFormatScore(latest.score, scaleType)}</span></div>
          <div><span class="oef-chart-stat-label">Beste</span><span class="oef-chart-stat-val">${oefenFormatScore(bestVal, scaleType)}</span></div>
        </div>
      </div>`;
    }).join('');

    groups.forEach((g) => drawProgressChart(qs('#chart-' + g.groupId), byType[g.groupId], c.color));
  }

  function drawProgressChart(canvas, rows, color) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, padL = 42, padR = 16, padT = 16, padB = 14;
    ctx.clearRect(0, 0, W, H);
    const scaleType = rows[rows.length - 1].scale_type || 'percentage';
    const values = rows.map((r) => Number(r.score));
    let min = Math.min(...values), max = Math.max(...values);
    if (min === max) { min -= Math.max(1, Math.abs(min) * 0.1); max += Math.max(1, Math.abs(max) * 0.1); }
    const pad = (max - min) * 0.15;
    min -= pad; max += pad;
    if (scaleType === 'percentage') { min = Math.max(0, min); max = Math.min(100, Math.max(max, min + 10)); }
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const x = (i) => padL + (rows.length > 1 ? (i / (rows.length - 1)) * plotW : plotW / 2);
    const y = (v) => padT + (1 - (v - min) / (max - min)) * plotH;

    ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.lineWidth = 1;
    ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = '#6B7280'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    [max, (max + min) / 2, min].forEach((v, idx) => {
      const gy = padT + (idx / 2) * plotH;
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
      ctx.fillText(scaleType === 'milliseconds' ? Math.round(v) + 'ms' : Math.round(v) + '%', padL - 8, gy);
    });

    if (rows.length > 1) {
      ctx.beginPath();
      rows.forEach((r, i) => { const px = x(i), py = y(Number(r.score)); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.lineTo(x(rows.length - 1), padT + plotH); ctx.lineTo(x(0), padT + plotH); ctx.closePath();
      ctx.fillStyle = color + '18'; ctx.fill();
    }

    ctx.beginPath();
    rows.forEach((r, i) => { const px = x(i), py = y(Number(r.score)); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();

    rows.forEach((r, i) => {
      const px = x(i), py = y(Number(r.score));
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fillStyle = 'white'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.stroke();
    });
  }

  // ---------- KANDIDAAT: vraag-speler ----------
  function oefenOptionLetter(opt) { const m = String(opt).match(/^\s*([A-Za-z])\s*[\).:\-]/); return m ? m[1].toUpperCase() : null; }
  function oefenStripLetter(s) { return String(s || '').replace(/^\s*[A-Za-z]\s*[\).:\-]\s*/, '').trim(); }
  function oefenMCcorrect(selected, answer) {
    const a = String(answer || '').trim();
    if (/^[A-Za-z]$/.test(a)) return oefenOptionLetter(selected) === a.toUpperCase();
    return oefenStripLetter(selected).toLowerCase() === oefenStripLetter(a).toLowerCase() || String(selected).trim().toLowerCase() === a.toLowerCase();
  }
  function oefenNormSeq(s) { return String(s || '').toLowerCase().replace(/[^0-9a-z]/g, ''); }
  function sjtColor(p) { return p >= 4 ? '#15803D' : p === 3 ? '#65A30D' : p === 2 ? '#D97706' : '#B91C1C'; }

  // ---- Verversingslogica: elke start/herstart krijgt nieuwe of geschudde vragen ----
  function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function oefenShuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const OEFEN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Voor types zonder generator: schud vraagvolgorde + optievolgorde/letters (correctheid blijft intact).
  function oefenShuffleForReplay(questions) {
    return oefenShuffle(questions).map((q) => {
      if (Array.isArray(q.options) && q.options.length && q.questionType === 'sjt') {
        const order = oefenShuffle(q.options.map((_, i) => i));
        const options = order.map((origIdx, pos) => ({ ...q.options[origIdx], label: `${OEFEN_LETTERS[pos]}) ${oefenStripLetter(q.options[origIdx].label)}` }));
        return { ...q, options };
      }
      if (Array.isArray(q.options) && q.options.length) {
        const trimmed = String(q.answer || '').trim();
        const correctIdx = q.options.findIndex((o) => oefenMCcorrect(o, q.answer));
        const order = oefenShuffle(q.options.map((_, i) => i));
        const options = order.map((origIdx, pos) => `${OEFEN_LETTERS[pos]}) ${oefenStripLetter(q.options[origIdx])}`);
        let answer = q.answer;
        if (correctIdx !== -1 && (/^[A-Za-z]\)/.test(trimmed) || /^[A-Za-z]$/.test(trimmed))) {
          const newPos = order.indexOf(correctIdx);
          answer = /^[A-Za-z]$/.test(trimmed) ? OEFEN_LETTERS[newPos] : `${OEFEN_LETTERS[newPos]}) ${oefenStripLetter(q.options[correctIdx])}`;
        }
        return { ...q, options, answer };
      }
      return q;
    });
  }

  async function renderExercisePlayer(catId, typeId) {
    const main = qs('#main');
    const c = oefenCat(catId);
    const data = oefenData(catId);
    const group = oefenGroups(data).find((g) => g.groupId === typeId);
    if (!c || !group || !group.questions.length) { main.innerHTML = `<div class="fade-up"><a href="#oefenmateriaal/c/${catId}" class="back-link">${ICONS.chevLeft} Terug</a><div class="card" style="color:var(--danger)">Oefening niet gevonden.</div></div>`; return; }
    const generator = (QUESTION_GENERATORS[catId] || {})[typeId];
    const questions = generator ? generator() : oefenShuffleForReplay(group.questions);
    const results = new Array(questions.length).fill(null); // true/false per vraag
    const sjtPoints = new Array(questions.length).fill(null); // 1-4 per SJT-vraag
    const isSJT = (c.kind === 'sjt') || (questions[0] && questions[0].questionType === 'sjt');
    let i = 0;

    const backHref = '#oefenmateriaal/c/' + catId;
    main.innerHTML = `<div class="fade-up" style="max-width:720px">
      <a href="${backHref}" class="back-link">${ICONS.chevLeft} Stoppen</a>
      <div class="eyebrow">${escapeHtml(c.name)} · ${escapeHtml(group.name)}</div>
      <div id="oef-progress" class="oef-progress"></div>
      <div id="oef-q"></div>
    </div>`;

    function renderProgress() {
      qs('#oef-progress').innerHTML = `<div class="oef-bar"><div style="width:${Math.round((i / questions.length) * 100)}%"></div></div><div style="font-size:12px;color:var(--muted);margin-top:6px">Vraag ${Math.min(i + 1, questions.length)} van ${questions.length}</div>`;
    }

    function finish() {
      let score, detail;
      if (isSJT) {
        const pts = sjtPoints.filter((p) => p != null);
        const avg = pts.length ? pts.reduce((a, b) => a + b, 0) / pts.length : 1;
        score = Math.round(((avg - 1) / 3) * 100);
        detail = `gemiddeld ${avg.toFixed(1)} / 4 punten — een gedragsprofiel, geen goed of fout`;
      } else {
        const correct = results.filter((r) => r === true).length;
        score = Math.round((correct / questions.length) * 100);
        detail = `${correct} van ${questions.length} goed`;
      }
      HopApi.saveExerciseScore({ candidate_id: session.user_id, category_id: catId, type_id: typeId, score, scale_type: 'percentage' }).catch((e) => console.warn(e));
      qs('#oef-progress').innerHTML = '';
      qs('#oef-q').innerHTML = `<div class="card card-lg" style="text-align:center">
        <div class="font-display" style="font-size:44px;font-weight:700;color:var(--navy-deep)">${score}%</div>
        <div style="color:var(--muted);margin:6px 0 20px">${detail}</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-coral" id="oef-again">Opnieuw</button>
          <a class="btn btn-ghost" href="${backHref}">Terug naar categorie</a>
        </div>
      </div>`;
      qs('#oef-again').onclick = () => renderExercisePlayer(catId, typeId);
    }

    function next() { i++; if (i >= questions.length) finish(); else renderQ(); }

    function renderQ() {
      renderProgress();
      const q = questions[i];
      const type = q.questionType || (q.options ? 'multiple_choice' : 'open');
      const el = qs('#oef-q');
      const head = `${q.context ? `<div class="oef-context">${escapeHtml(q.context)}</div>` : ''}<div class="oef-question">${escapeHtml(q.question || '')}</div>`;

      if (type === 'sjt' && Array.isArray(q.options) && q.options.length) {
        el.innerHTML = `<div class="card card-lg">${head}<div id="oef-opts" class="oef-opts">${q.options.map((o, idx) => `<button class="oef-opt" data-idx="${idx}">${escapeHtml(o.label)}</button>`).join('')}</div><div id="oef-fb"></div></div>`;
        qsa('#oef-opts .oef-opt').forEach((b) => b.onclick = () => {
          const opt = q.options[+b.dataset.idx];
          sjtPoints[i] = opt.points;
          qsa('#oef-opts .oef-opt').forEach((x) => { x.disabled = true; const xo = q.options[+x.dataset.idx]; x.style.borderColor = sjtColor(xo.points); x.style.color = sjtColor(xo.points); });
          b.style.background = sjtColor(opt.points) + '14'; b.style.fontWeight = '600';
          const guide = ((oefenData(catId) || {}).scoringGuide || []).find((gg) => gg.points === opt.points);
          const fb = qs('#oef-fb');
          fb.innerHTML = `<div class="oef-verdict" style="color:${sjtColor(opt.points)}">${opt.points}/4 punten${guide ? ' — ' + escapeHtml(guide.meaning) : ''}</div>
            ${q.explanation ? `<div class="oef-expl">${escapeHtml(q.explanation)}</div>` : ''}
            <button class="btn btn-coral btn-sm" id="oef-next" style="margin-top:12px">${i + 1 >= questions.length ? 'Afronden' : 'Volgende'} ${ICONS.arrowRight}</button>`;
          qs('#oef-next').onclick = next;
        });
      } else if ((type === 'multiple_choice' || type === 'matrix_grid') && Array.isArray(q.options) && q.options.length) {
        el.innerHTML = `<div class="card card-lg">${head}<div id="oef-opts" class="oef-opts">${q.options.map((o, idx) => `<button class="oef-opt" data-idx="${idx}">${escapeHtml(o)}</button>`).join('')}</div><div id="oef-fb"></div></div>`;
        qsa('#oef-opts .oef-opt').forEach((b) => b.onclick = () => {
          const opt = q.options[+b.dataset.idx];
          const ok = oefenMCcorrect(opt, q.answer);
          results[i] = ok;
          qsa('#oef-opts .oef-opt').forEach((x) => { x.disabled = true; const xo = q.options[+x.dataset.idx]; if (oefenMCcorrect(xo, q.answer)) x.classList.add('good'); });
          if (!ok) b.classList.add('bad');
          showFeedback(ok, q);
        });
      } else if (type === 'sequence') {
        el.innerHTML = `<div class="card card-lg">${head}<input id="oef-inp" class="input" placeholder="Typ je antwoord…" autocomplete="off"><div style="margin-top:10px"><button class="btn btn-coral btn-sm" id="oef-check">Controleer</button></div><div id="oef-fb"></div></div>`;
        const check = () => { const ok = oefenNormSeq(qs('#oef-inp').value) === oefenNormSeq(q.answer); results[i] = ok; qs('#oef-inp').disabled = true; qs('#oef-check').disabled = true; showFeedback(ok, q); };
        qs('#oef-check').onclick = check;
        qs('#oef-inp').addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      } else {
        // open / matrix zonder opties → zelfbeoordeling
        el.innerHTML = `<div class="card card-lg">${head}<textarea id="oef-inp" class="input" rows="3" placeholder="Schrijf je antwoord…"></textarea><div style="margin-top:10px"><button class="btn btn-ghost btn-sm" id="oef-reveal">Toon modelantwoord</button></div><div id="oef-fb"></div></div>`;
        qs('#oef-reveal').onclick = () => {
          qs('#oef-fb').innerHTML = `<div class="oef-answer"><strong>Modelantwoord:</strong> ${escapeHtml(q.answer || '')}</div>${q.explanation ? `<div class="oef-expl">${escapeHtml(q.explanation)}</div>` : ''}
            <div style="margin-top:12px;font-size:13px;color:var(--muted)">Had je dit goed?</div>
            <div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-coral btn-sm" id="oef-self-y">Ja, goed</button><button class="btn btn-ghost btn-sm" id="oef-self-n">Niet helemaal</button></div>`;
          qs('#oef-self-y').onclick = () => { results[i] = true; next(); };
          qs('#oef-self-n').onclick = () => { results[i] = false; next(); };
        };
      }
    }

    function showFeedback(ok, q) {
      const fb = qs('#oef-fb');
      fb.innerHTML = `<div class="oef-verdict ${ok ? 'good' : 'bad'}">${ok ? ICONS.check + ' Goed!' : 'Niet correct'}</div>
        ${!ok ? `<div class="oef-answer"><strong>Antwoord:</strong> ${escapeHtml(q.answer || '')}</div>` : ''}
        ${q.explanation ? `<div class="oef-expl">${escapeHtml(q.explanation)}</div>` : ''}
        <button class="btn btn-coral btn-sm" id="oef-next" style="margin-top:12px">${i + 1 >= questions.length ? 'Afronden' : 'Volgende'} ${ICONS.arrowRight}</button>`;
      qs('#oef-next').onclick = next;
    }

    renderQ();
  }

  // ==========================================================
  // OEFENINGEN — interactieve spellen (categorie 2: Coördinatie)
  // Elk spel krijgt (el, cfg, finish) waarbij finish(score, scaleType, detailHtml)
  // de score opslaat en het eindscherm toont. cfg = ruwe exercise-config uit de JSON.
  // ==========================================================
  function oefenExerciseConfig(catId, typeId) {
    const data = oefenData(catId);
    return ((data && data.exercises) || []).find((e) => e.exerciseId === typeId) || null;
  }

  async function renderInteractivePlayer(catId, typeId) {
    const main = qs('#main');
    const c = oefenCat(catId);
    const data = oefenData(catId);
    const group = oefenGroups(data).find((g) => g.groupId === typeId);
    const runner = (INTERACTIVE_EXERCISES[catId] || {})[typeId];
    if (!c || !group || !runner) {
      main.innerHTML = `<div class="fade-up"><a href="#oefenmateriaal/c/${catId}" class="back-link">${ICONS.chevLeft} Terug</a><div class="card" style="color:var(--danger)">Oefening niet gevonden.</div></div>`;
      return;
    }
    let unlocks = [];
    try { unlocks = await HopApi.listUnlocks(session.user_id); } catch (e) { console.warn(e); }
    if (!unlocks.includes(catId)) {
      main.innerHTML = `<div class="fade-up"><a href="#oefenmateriaal" class="back-link">${ICONS.chevLeft} Terug naar oefeningen</a>
        <div class="card" style="border-style:dashed;text-align:center;color:var(--muted);padding:50px">${OEFEN_LOCK}<div style="margin-top:10px">Deze categorie is nog vergrendeld. Wordt vrijgegeven door je coach.</div></div></div>`;
      return;
    }
    const cfg = oefenExerciseConfig(catId, typeId) || {};
    const backHref = '#oefenmateriaal/c/' + catId;
    main.innerHTML = `<div class="fade-up" style="max-width:720px">
      <a href="${backHref}" class="back-link">${ICONS.chevLeft} Stoppen</a>
      <div class="eyebrow">${escapeHtml(c.name)} · ${escapeHtml(group.name)}</div>
      <div id="oef-game"></div>
    </div>`;

    function finish(score, scaleType, detailHtml) {
      window._oefGameCleanup = null;
      HopApi.saveExerciseScore({ candidate_id: session.user_id, category_id: catId, type_id: typeId, score, scale_type: scaleType }).catch((e) => console.warn(e));
      qs('#oef-game').innerHTML = `<div class="card card-lg" style="text-align:center">
        <div class="font-display" style="font-size:44px;font-weight:700;color:var(--navy-deep)">${oefenFormatScore(score, scaleType)}</div>
        <div style="color:var(--muted);margin:6px 0 20px">${detailHtml}</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-coral" id="oef-again">Opnieuw</button>
          <a class="btn btn-ghost" href="${backHref}">Terug naar categorie</a>
        </div>
      </div>`;
      qs('#oef-again').onclick = () => renderInteractivePlayer(catId, typeId);
    }

    runner(qs('#oef-game'), cfg, finish);
  }

  // ---------- Spel 1: Enkelvoudige tracking (muis volgt bewegende stip) ----------
  function playTrackingSingle(el, cfg, finish) {
    const duration = (cfg.durationSeconds || 60) * 1000;
    const threshold = 20;
    el.innerHTML = `
      <div class="oef-game-head">
        <div>Volg de oranje stip zo nauwkeurig mogelijk met je cursor.</div>
        <div id="oef-timer" class="oef-timer">${Math.round(duration / 1000)}s</div>
      </div>
      <div class="oef-canvas-wrap"><canvas id="oef-canvas" width="640" height="320"></canvas></div>
      <div id="oef-live" class="oef-live">Nauwkeurigheid: —</div>`;
    const canvas = qs('#oef-canvas', el);
    const ctx = canvas.getContext('2d');
    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    }
    canvas.addEventListener('mousemove', onMove);
    let hits = 0, total = 0, raf;
    const start = performance.now();
    function pointPos(t) {
      const w = canvas.width, h = canvas.height, pad = 40;
      const x = pad + (w - 2 * pad) * (0.5 + 0.5 * Math.sin(t / 1700) * Math.cos(t / 2500));
      const y = pad + (h - 2 * pad) * (0.5 + 0.5 * Math.sin(t / 2100 + 1.3));
      return { x, y };
    }
    function loop(now) {
      const elapsed = now - start;
      if (elapsed >= duration) return endGame();
      const p = pointPos(elapsed);
      const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
      total++; if (dist <= threshold) hits++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath(); ctx.arc(p.x, p.y, threshold, 0, Math.PI * 2); ctx.fillStyle = 'rgba(229,107,62,.15)'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fillStyle = '#E56B3E'; ctx.fill();
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2); ctx.fillStyle = dist <= threshold ? '#15803D' : '#1E4A7A'; ctx.fill();
      qs('#oef-timer', el).textContent = Math.max(0, Math.ceil((duration - elapsed) / 1000)) + 's';
      qs('#oef-live', el).textContent = 'Nauwkeurigheid: ' + Math.round((hits / total) * 100) + '%';
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    function cleanup() { cancelAnimationFrame(raf); canvas.removeEventListener('mousemove', onMove); }
    window._oefGameCleanup = cleanup;
    function endGame() {
      cleanup();
      const score = total ? Math.round((hits / total) * 100) : 0;
      finish(score, 'percentage', `${score}% van de tijd binnen ${threshold}px van de stip (doel: boven 80%)`);
    }
  }

  // ---------- Spel 2: Dubbele tracking (A voor stip 1, L voor stip 2) ----------
  function playTrackingDouble(el, cfg, finish) {
    const duration = 45000;
    el.innerHTML = `
      <div class="oef-game-head">
        <div>Houd beide stippen in de groene zone. <strong>A</strong> voor stip 1 (links), <strong>L</strong> voor stip 2 (rechts).</div>
        <div id="oef-timer" class="oef-timer">45s</div>
      </div>
      <div class="oef-canvas-wrap"><canvas id="oef-canvas" width="640" height="320"></canvas></div>
      <div id="oef-live" class="oef-live">Stip 1: — · Stip 2: —</div>`;
    const canvas = qs('#oef-canvas', el);
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const lanes = [
      { x: W * 0.28, y: H / 2, v: 0, key: 'a', hits: 0, total: 0 },
      { x: W * 0.72, y: H / 2, v: 0, key: 'l', hits: 0, total: 0 },
    ];
    const pressed = { a: false, l: false };
    function onKeyDown(e) { const k = e.key.toLowerCase(); if (k === 'a' || k === 'l') pressed[k] = true; }
    function onKeyUp(e) { const k = e.key.toLowerCase(); if (k === 'a' || k === 'l') pressed[k] = false; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    const start = performance.now();
    let raf;
    function zoneCenter(idx, t) { return H / 2 + Math.sin(t / 2600 + (idx === 0 ? 0 : 1.7)) * (H * 0.3); }
    function loop(now) {
      const elapsed = now - start;
      if (elapsed >= duration) return endGame();
      ctx.clearRect(0, 0, W, H);
      lanes.forEach((ln, idx) => {
        const thrust = pressed[ln.key] ? -0.55 : 0.35;
        ln.v = (ln.v + thrust) * 0.92;
        ln.y = Math.max(20, Math.min(H - 20, ln.y + ln.v));
        const zc = zoneCenter(idx, elapsed);
        const inZone = Math.abs(ln.y - zc) <= 26;
        ln.total++; if (inZone) ln.hits++;
        ctx.fillStyle = 'rgba(0,0,0,.04)'; ctx.fillRect(ln.x - 30, 10, 60, H - 20);
        ctx.fillStyle = 'rgba(21,128,61,.18)'; ctx.fillRect(ln.x - 30, zc - 26, 60, 52);
        ctx.beginPath(); ctx.arc(ln.x, ln.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = inZone ? '#15803D' : '#C8501E'; ctx.fill();
      });
      qs('#oef-timer', el).textContent = Math.max(0, Math.ceil((duration - elapsed) / 1000)) + 's';
      const p1 = lanes[0].total ? Math.round((lanes[0].hits / lanes[0].total) * 100) : 0;
      const p2 = lanes[1].total ? Math.round((lanes[1].hits / lanes[1].total) * 100) : 0;
      qs('#oef-live', el).textContent = `Stip 1: ${p1}% · Stip 2: ${p2}%`;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    function cleanup() { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); }
    window._oefGameCleanup = cleanup;
    function endGame() {
      cleanup();
      const p1 = lanes[0].total ? Math.round((lanes[0].hits / lanes[0].total) * 100) : 0;
      const p2 = lanes[1].total ? Math.round((lanes[1].hits / lanes[1].total) * 100) : 0;
      const combined = Math.round((p1 + p2) / 2);
      finish(combined, 'percentage', `Stip 1: ${p1}% · Stip 2: ${p2}% · gecombineerd ${combined}%`);
    }
  }

  // ---------- Spel 3: Reactiesnelheid enkelvoudig ----------
  function playReactionSimple(el, cfg, finish) {
    const rounds = cfg.rounds || 20;
    let round = 0; const times = [];
    let armed = false, waitingSince = null, timeoutId;
    function onKey(e) {
      if (e.code !== 'Space') return;
      e.preventDefault();
      const stim = qs('#oef-stim', el);
      if (!armed) {
        clearTimeout(timeoutId);
        stim.className = 'oef-stim bad'; stim.textContent = 'Te vroeg! Wacht op groen.';
        setTimeout(advance, 900);
        return;
      }
      const rt = performance.now() - waitingSince;
      times.push(rt);
      armed = false;
      stim.className = 'oef-stim good'; stim.textContent = Math.round(rt) + ' ms';
      setTimeout(advance, 700);
    }
    function advance() { round++; if (round >= rounds) endGame(); else render(); }
    function render() {
      el.innerHTML = `
        <div class="oef-game-head"><div>Druk zo snel mogelijk op <strong>SPATIE</strong> zodra het scherm groen wordt.</div><div class="oef-timer">${round}/${rounds}</div></div>
        <div id="oef-stim" class="oef-stim wait">Wacht…</div>
        <div class="oef-live">${times.length ? 'Gemiddelde: ' + Math.round(times.reduce((a, b) => a + b, 0) / times.length) + ' ms' : ''}</div>`;
      armed = false;
      const delay = 1200 + Math.random() * 2200;
      timeoutId = setTimeout(() => {
        armed = true;
        waitingSince = performance.now();
        const stim = qs('#oef-stim', el);
        stim.className = 'oef-stim go'; stim.textContent = 'NU!';
      }, delay);
    }
    window.addEventListener('keydown', onKey);
    function cleanup() { clearTimeout(timeoutId); window.removeEventListener('keydown', onKey); }
    window._oefGameCleanup = cleanup;
    function endGame() {
      cleanup();
      const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      finish(avg, 'milliseconds', `Gemiddelde reactietijd over ${times.length} ronde${times.length === 1 ? '' : 's'} (doel: onder 250 ms)`);
    }
    render();
  }

  // ---------- Spel 4: Keuze-reactietaak ----------
  function playChoiceReaction(el, cfg, finish) {
    const rounds = cfg.rounds || 30;
    const colors = [
      { name: 'groen', bg: '#15803D', code: 'Space', label: 'SPATIE' },
      { name: 'rood', bg: '#B91C1C', code: 'KeyR', label: 'R' },
      { name: 'blauw', bg: '#1E4A7A', code: 'KeyB', label: 'B' },
    ];
    let round = 0, errors = 0; const times = [];
    let current = null, armedAt = null, timeoutId;
    function onKey(e) {
      if (!['Space', 'KeyR', 'KeyB'].includes(e.code)) return;
      e.preventDefault();
      if (!current) return;
      const correct = e.code === current.code;
      const rt = performance.now() - armedAt;
      if (correct) times.push(rt); else errors++;
      qs('#oef-stim', el).textContent = correct ? Math.round(rt) + ' ms' : 'Fout!';
      current = null;
      round++;
      setTimeout(() => { if (round >= rounds) endGame(); else render(); }, 700);
    }
    function render() {
      el.innerHTML = `
        <div class="oef-game-head"><div>Groen = SPATIE, Rood = R, Blauw = B. Reageer op de juiste toets.</div><div class="oef-timer">${round}/${rounds}</div></div>
        <div id="oef-stim" class="oef-stim wait">Wacht…</div>
        <div class="oef-live">${times.length ? `Gemiddelde: ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} ms · ${errors} fout${errors === 1 ? '' : 'en'}` : ''}</div>`;
      current = null;
      const delay = 1000 + Math.random() * 2000;
      timeoutId = setTimeout(() => {
        current = colors[Math.floor(Math.random() * colors.length)];
        armedAt = performance.now();
        const stim = qs('#oef-stim', el);
        stim.className = 'oef-stim go'; stim.style.background = current.bg; stim.textContent = current.label;
      }, delay);
    }
    window.addEventListener('keydown', onKey);
    function cleanup() { clearTimeout(timeoutId); window.removeEventListener('keydown', onKey); }
    window._oefGameCleanup = cleanup;
    function endGame() {
      cleanup();
      const avgRt = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 600;
      const score = Math.round(avgRt + errors * 200);
      finish(score, 'milliseconds', `${times.length} correcte reactie${times.length === 1 ? '' : 's'}, gemiddeld ${Math.round(avgRt)} ms · ${errors} fout${errors === 1 ? '' : 'en'} (+200ms boete per fout)`);
    }
    render();
  }

  // ---------- Spel 5: Go / No-go ----------
  function playGoNoGo(el, cfg, finish) {
    const totalStim = cfg.stimuli || 40;
    const goCount = cfg.goStimuli || 10;
    const letters = (function build() {
      const pool = new Array(goCount).fill('G');
      const distractors = 'ABCDEFHIJKLMNOPQRSTUVWXYZ'.split('');
      while (pool.length < totalStim) pool.push(distractors[Math.floor(Math.random() * distractors.length)]);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      return pool;
    })();
    let idx = 0, hits = 0, misses = 0, falseAlarms = 0, correctRejections = 0;
    let responded = false, currentIsGo = false, showTimeout, hideTimeout;
    function onKey(e) {
      if (e.code !== 'Space' || responded) return;
      e.preventDefault();
      responded = true;
      if (currentIsGo) hits++; else falseAlarms++;
      const live = qs('#oef-live', el); if (live) live.textContent = 'Score: ' + (hits - falseAlarms);
    }
    function nextStim() {
      if (idx >= totalStim) return endGame();
      const stim = qs('#oef-stim', el);
      stim.className = 'oef-stim wait'; stim.textContent = '+';
      showTimeout = setTimeout(() => {
        const letter = letters[idx];
        currentIsGo = letter === 'G';
        responded = false;
        stim.className = 'oef-stim go'; stim.textContent = letter;
        hideTimeout = setTimeout(() => {
          if (currentIsGo && !responded) misses++;
          if (!currentIsGo && !responded) correctRejections++;
          idx++;
          const t = qs('.oef-timer', el); if (t) t.textContent = `${idx}/${totalStim}`;
          nextStim();
        }, 900);
      }, 350);
    }
    el.innerHTML = `
      <div class="oef-game-head"><div>Reageer alleen op de letter <strong>G</strong> met SPATIE. Bij alle andere letters: niets doen.</div><div class="oef-timer">${idx}/${totalStim}</div></div>
      <div id="oef-stim" class="oef-stim wait">+</div>
      <div id="oef-live" class="oef-live">Score: 0</div>`;
    window.addEventListener('keydown', onKey);
    function cleanup() { clearTimeout(showTimeout); clearTimeout(hideTimeout); window.removeEventListener('keydown', onKey); }
    window._oefGameCleanup = cleanup;
    function endGame() {
      cleanup();
      const raw = hits - falseAlarms;
      const score = Math.max(0, Math.round((raw / goCount) * 100));
      finish(score, 'percentage', `${hits}/${goCount} correcte go's, ${falseAlarms} false alarm${falseAlarms === 1 ? '' : 's'}, ${misses} gemist`);
    }
    nextStim();
  }

  // ---------- Spel 6: Dual task (tracking + rekenen) ----------
  function playDualTask(el, cfg, finish) {
    const duration = 60000;
    const sumInterval = (cfg.sumIntervalSeconds || 8) * 1000;
    const threshold = 22;
    el.innerHTML = `
      <div class="oef-game-head"><div>Houd de cursor op de stip. Beantwoord tussendoor de som die verschijnt.</div><div id="oef-timer" class="oef-timer">60s</div></div>
      <div id="oef-sum" class="oef-sum" style="display:none"></div>
      <div class="oef-canvas-wrap"><canvas id="oef-canvas" width="640" height="320"></canvas></div>
      <div id="oef-live" class="oef-live">Nauwkeurigheid: —</div>`;
    const canvas = qs('#oef-canvas', el);
    const ctx = canvas.getContext('2d');
    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    }
    canvas.addEventListener('mousemove', onMove);
    let hits = 0, total = 0, sumCorrect = 0, sumTotal = 0, currentSum = null;
    const start = performance.now();
    let raf, sumTimer;
    function pointPos(t) {
      const w = canvas.width, h = canvas.height, pad = 40;
      const x = pad + (w - 2 * pad) * (0.5 + 0.5 * Math.sin(t / 1500) * Math.cos(t / 2300));
      const y = pad + (h - 2 * pad) * (0.5 + 0.5 * Math.sin(t / 1900 + 0.8));
      return { x, y };
    }
    function newSum() {
      const a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9);
      const correct = a + b;
      const wrong = correct + (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3));
      const opts = Math.random() < 0.5 ? [correct, wrong] : [wrong, correct];
      currentSum = { opts, correct };
      const box = qs('#oef-sum', el);
      box.style.display = 'flex';
      box.innerHTML = `<div class="oef-sum-q">${a} + ${b} = ?</div>
        <button class="btn btn-ghost btn-sm" data-ans="${opts[0]}">A) ${opts[0]}</button>
        <button class="btn btn-ghost btn-sm" data-ans="${opts[1]}">B) ${opts[1]}</button>`;
      qsa('[data-ans]', box).forEach((b2) => b2.onclick = () => {
        sumTotal++;
        if (Number(b2.dataset.ans) === currentSum.correct) sumCorrect++;
        currentSum = null;
        box.style.display = 'none';
      });
    }
    sumTimer = setInterval(() => { if (performance.now() - start < duration - 1500) newSum(); }, sumInterval);
    const firstSumTimeout = setTimeout(newSum, 1800);
    function loop(now) {
      const elapsed = now - start;
      if (elapsed >= duration) return endGame();
      const p = pointPos(elapsed);
      const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
      total++; if (dist <= threshold) hits++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath(); ctx.arc(p.x, p.y, threshold, 0, Math.PI * 2); ctx.fillStyle = 'rgba(229,107,62,.15)'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fillStyle = '#E56B3E'; ctx.fill();
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2); ctx.fillStyle = dist <= threshold ? '#15803D' : '#1E4A7A'; ctx.fill();
      qs('#oef-timer', el).textContent = Math.max(0, Math.ceil((duration - elapsed) / 1000)) + 's';
      qs('#oef-live', el).textContent = `Tracking: ${Math.round((hits / total) * 100)}% · Sommen: ${sumCorrect}/${sumTotal}`;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    function cleanup() { cancelAnimationFrame(raf); clearInterval(sumTimer); clearTimeout(firstSumTimeout); canvas.removeEventListener('mousemove', onMove); }
    window._oefGameCleanup = cleanup;
    function endGame() {
      cleanup();
      const trackPct = total ? Math.round((hits / total) * 100) : 0;
      const sumPct = sumTotal ? Math.round((sumCorrect / sumTotal) * 100) : 0;
      const combined = Math.round((trackPct + sumPct) / 2);
      finish(combined, 'percentage', `Tracking ${trackPct}% · Sommen correct ${sumPct}% (${sumCorrect}/${sumTotal}) · gecombineerd ${combined}%`);
    }
  }

  // ---------- Categorie 6: Engels & Communicatie — scenario-oefeningen ----------
  // Zet de ruwe exercise-config om naar een reeks stappen {context, question, answer, hint}.
  // Dekt alle vormen die in data/6-engels-communicatie.json voorkomen.
  function engelsSteps(cfg) {
    if (Array.isArray(cfg.questions)) {
      return cfg.questions.map((q) => ({ context: cfg.context || null, question: q.question, answer: q.answer }));
    }
    if (cfg.questionType === 'readback') {
      return [{ context: cfg.context, question: 'Lees de klaring correct terug.', answer: cfg.answer, hint: cfg.scoringPoints }];
    }
    if (cfg.questionType === 'error_detection') {
      return [{ context: cfg.context, question: cfg.task || 'Markeer de fout en geef de correcte readback.', answer: cfg.error }];
    }
    if (cfg.situation) {
      const sit = typeof cfg.situation === 'string' ? cfg.situation
        : Object.entries(cfg.situation).map(([k, v]) => `${k}: ${v}`).join(' · ');
      const context = (cfg.structure ? `Structuur: ${cfg.structure}\n\n` : '') + sit;
      return [{ context, question: 'Formuleer je bericht.', answer: cfg.answer }];
    }
    return [];
  }

  function playScenarioSteps(el, cfg, finish) {
    const gen = ENGELS_STEP_GENERATORS[cfg.exerciseId];
    let steps;
    if (gen) {
      steps = [];
      while (steps.length < OEFEN_MIN_QUESTIONS) steps = steps.concat(gen());
    } else {
      steps = engelsSteps(cfg);
    }
    if (!steps.length) { finish(0, 'percentage', 'Geen oefenstappen beschikbaar voor deze oefening.'); return; }
    let i = 0; const results = [];
    function renderStep() {
      const s = steps[i];
      el.innerHTML = `
        <div class="oef-progress"><div class="oef-bar"><div style="width:${Math.round((i / steps.length) * 100)}%"></div></div><div style="font-size:12px;color:var(--muted);margin-top:6px">Stap ${i + 1} van ${steps.length}</div></div>
        <div class="card card-lg">
          ${s.context ? `<div class="oef-context">${escapeHtml(s.context)}</div>` : ''}
          <div class="oef-question">${escapeHtml(s.question)}</div>
          <textarea id="oef-inp" class="input" rows="3" placeholder="Schrijf je antwoord…"></textarea>
          <div style="margin-top:10px"><button class="btn btn-ghost btn-sm" id="oef-reveal">Toon modelantwoord</button></div>
          <div id="oef-fb"></div>
        </div>`;
      qs('#oef-reveal', el).onclick = () => {
        qs('#oef-fb', el).innerHTML = `<div class="oef-answer"><strong>Modelantwoord:</strong> ${escapeHtml(s.answer || '')}</div>
          ${s.hint ? `<div class="oef-expl">${escapeHtml(s.hint)}</div>` : ''}
          <div style="margin-top:12px;font-size:13px;color:var(--muted)">Had je dit goed?</div>
          <div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-coral btn-sm" id="oef-self-y">Ja, goed</button><button class="btn btn-ghost btn-sm" id="oef-self-n">Niet helemaal</button></div>`;
        qs('#oef-self-y', el).onclick = () => { results.push(true); next(); };
        qs('#oef-self-n', el).onclick = () => { results.push(false); next(); };
      };
    }
    function next() { i++; if (i >= steps.length) endGame(); else renderStep(); }
    function endGame() {
      const correct = results.filter(Boolean).length;
      const score = Math.round((correct / steps.length) * 100);
      finish(score, 'percentage', `${correct} van ${steps.length} zelf als goed beoordeeld`);
    }
    renderStep();
  }

  // ==========================================================
  // OEFENINGEN — vraaggeneratoren (laag 3: verversingslogica)
  // Elke functie levert bij elke aanroep een verse set vragen op,
  // op basis van de refreshLogic-instructies in data/*.json.
  // ==========================================================
  function capitalize(s) { const t = String(s || ''); return t.charAt(0).toUpperCase() + t.slice(1); }
  const DIGIT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  function spellDigits(n) { return String(n).split('').map((d) => DIGIT_WORDS[+d] || d).join(' '); }

  // Elke oefening moet minstens dit aantal vragen bieden per beurt. Cyclet door
  // de templates heen (elke aanroep = verse random parameters) tot dat gehaald is.
  const OEFEN_MIN_QUESTIONS = 20;
  function genFromTemplates(templates, minCount) {
    minCount = minCount || OEFEN_MIN_QUESTIONS;
    const qs = [];
    let round = 0;
    while (qs.length < minCount) {
      templates.forEach((fn) => qs.push(fn(round)));
      round++;
    }
    return oefenShuffle(qs);
  }
  // Voor onderdelen met een paar vaste feiten (eenmalig) + parametrische vragen (herhaald tot het minimum).
  function genFixedPlusRepeating(fixed, repeating, minCount) {
    minCount = minCount || OEFEN_MIN_QUESTIONS;
    const qs = fixed.map((fn) => fn());
    while (qs.length < minCount) repeating.forEach((fn) => qs.push(fn()));
    return oefenShuffle(qs);
  }

  // ---- Cognitieve Vaardigheid ----
  const MX_SHAPES = ['cirkel', 'vierkant', 'driehoek', 'ruit', 'ster', 'pijl'];
  function genMatrixVragen() {
    const templates = [
      () => { // M1 — vorm + grootte per rij, kleurgradiënt per kolom (zoals V1)
        const shapes = oefenShuffle(MX_SHAPES).slice(0, 2);
        return {
          id: 'M1', level: 1, questionType: 'matrix_grid', options: null,
          question: `Rij 1: ${shapes[0]} klein zwart / ${shapes[0]} klein grijs / ${shapes[0]} klein wit. Rij 2: ${shapes[0]} groot zwart / ${shapes[0]} groot grijs / ${shapes[0]} groot wit. Rij 3: ${shapes[1]} groot zwart / ${shapes[1]} groot grijs / ? Wat is het ontbrekende figuur?`,
          answer: `${capitalize(shapes[1])} groot wit`,
          explanation: 'Patroon: vorm verandert per rij, grootte verandert per rij, kleur loopt van zwart naar grijs naar wit.',
        };
      },
      () => { // M2 — aantal neemt toe per kolom (zoals V2)
        const shapes = oefenShuffle(MX_SHAPES).slice(0, 3);
        return {
          id: 'M2', level: 1, questionType: 'matrix_grid', options: null,
          question: `Rij 1: één ${shapes[0]} / twee ${shapes[0]}s / drie ${shapes[0]}s. Rij 2: één ${shapes[1]} / twee ${shapes[1]}s / drie ${shapes[1]}s. Rij 3: één ${shapes[2]} / twee ${shapes[2]}s / ? Wat is het ontbrekende figuur?`,
          answer: `Drie ${shapes[2]}s`,
          explanation: 'Het aantal neemt per kolom toe met 1.',
        };
      },
      () => { // M3 — grootte neemt af + kleur wordt lichter (zoals V3)
        const shapes = oefenShuffle(MX_SHAPES).slice(0, 3);
        return {
          id: 'M3', level: 2, questionType: 'matrix_grid', options: null,
          question: `Rij 1: groot zwart ${shapes[0]} / middelgroot grijs ${shapes[0]} / klein wit ${shapes[0]}. Rij 2: groot zwart ${shapes[1]} / middelgroot grijs ${shapes[1]} / klein wit ${shapes[1]}. Rij 3: groot zwart ${shapes[2]} / middelgroot grijs ${shapes[2]} / ? Wat ontbreekt?`,
          answer: `Kleine witte ${shapes[2]}`,
          explanation: 'Twee eigenschappen veranderen tegelijk: grootte neemt af, kleur wordt lichter.',
        };
      },
      () => { // M4 — elke richting komt precies één keer per rij voor (zoals V4)
        const dirs = oefenShuffle(['omhoog', 'rechts', 'omlaag', 'links']).slice(0, 3);
        const row1 = oefenShuffle(dirs), row2 = oefenShuffle(dirs), row3 = oefenShuffle(dirs);
        return {
          id: 'M4', level: 2, questionType: 'matrix_grid', options: null,
          question: `Rij 1: pijl ${row1.join(' / pijl ')}. Rij 2: pijl ${row2.join(' / pijl ')}. Rij 3: pijl ${row3[0]} / pijl ${row3[1]} / ? Wat is de ontbrekende pijlrichting?`,
          answer: `Pijl ${row3[2]}`,
          explanation: 'Elke richting komt precies één keer per rij voor.',
        };
      },
      () => { // M5 — behoud van totaal (zoals V5)
        const total = randInt(2, 4);
        const outsideSeq = [2, 1, 0];
        const insideSeq = outsideSeq.map((o) => total - o);
        return {
          id: 'M5', level: 3, questionType: 'matrix_grid', options: null,
          question: `Rij 1: ${outsideSeq[0]} zwarte stippen buiten cirkel, ${insideSeq[0]} wit(te) stip(pen) binnen. Rij 2: ${outsideSeq[1]} zwart(e) stip(pen) buiten, ${insideSeq[1]} witte stip(pen) binnen. Rij 3: ${outsideSeq[2]} stippen buiten, ? witte stippen binnen. Hoeveel witte stippen binnen in rij 3?`,
          answer: `${insideSeq[2]} witte stippen binnen`,
          explanation: `Totaal is altijd ${total}. Stippen buiten nemen af, stippen binnen nemen toe.`,
        };
      },
      () => { // M6 — rotatie + kleurcyclus (zoals V6)
        const dirs8 = ['omhoog', 'rechtsomhoog', 'rechts', 'rechtsomlaag', 'omlaag', 'linksomlaag', 'links', 'linksomhoog'];
        const startIdx = randInt(0, 7);
        const colors = oefenShuffle(['zwart', 'grijs', 'wit']);
        const seqDirs = [0, 1, 2, 3].map((i) => dirs8[(startIdx + i) % 8]);
        const seqColors = [0, 1, 2, 3].map((i) => colors[i % 3]);
        return {
          id: 'M6', level: 3, questionType: 'matrix_grid', options: null,
          question: `Figuren roteren per stap 45 graden. Tegelijk wisselt de kleur per stap. Figuur 1: pijl ${seqDirs[0]} ${seqColors[0]}. Figuur 2: pijl ${seqDirs[1]} ${seqColors[1]}. Figuur 3: pijl ${seqDirs[2]} ${seqColors[2]}. Figuur 4: ?`,
          answer: `Pijl ${seqDirs[3]} ${seqColors[3]}`,
          explanation: 'Rotatie van 45 graden per stap. Kleur herhaalt na drie stappen.',
        };
      },
    ];
    return genFromTemplates(templates);
  }

  function genNumeriekVragen() {
    const templates = [
      () => { // geometrische reeks (zoals V13)
        const start = randInt(1, 5), ratio = pick([2, 3]);
        const seq = [start]; for (let i = 0; i < 4; i++) seq.push(seq[seq.length - 1] * ratio);
        return { id: 'G1', level: 1, questionType: 'open', options: null, question: `Wat is het volgende getal in de reeks: ${seq.slice(0, 4).join(' — ')} — ?`, answer: String(seq[4]), explanation: `Elke stap wordt vermenigvuldigd met ${ratio}.` };
      },
      () => { // afnemend verschil (zoals V14)
        const start = randInt(80, 120); const d0 = randInt(6, 10);
        const seq = [start]; let d = d0;
        for (let i = 0; i < 5; i++) { seq.push(seq[seq.length - 1] - d); d -= 1; }
        return { id: 'G2', level: 1, questionType: 'open', options: null, question: `Wat is het volgende getal in de reeks: ${seq.slice(0, 5).join(' — ')} — ?`, answer: String(seq[5]), explanation: 'Het verschil neemt elke stap met 1 af.' };
      },
      () => { // x*mult dan -sub, herhaald (zoals V15)
        const start = randInt(2, 5); const mult = pick([2, 3]); const sub = pick([1, 2, 3]);
        const seq = [start];
        for (let i = 0; i < 3; i++) { seq.push(seq[seq.length - 1] * mult); seq.push(seq[seq.length - 1] - sub); }
        return { id: 'G3', level: 1, questionType: 'open', options: null, question: `Wat is het volgende getal in de reeks: ${seq.slice(0, 6).join(' — ')} — ?`, answer: String(seq[6]), explanation: `Patroon: x${mult}, dan -${sub}, herhaald.` };
      },
      () => { // snelheid = afstand/tijd (zoals V16)
        const time = pick([1, 1.5, 2, 2.5, 3]); const speed = randInt(2, 5) * 50;
        const dist = Math.round(time * speed);
        return { id: 'G4', level: 2, questionType: 'open', options: null, question: `Een vliegtuig vliegt ${dist} nautical miles in ${String(time).replace('.', ',')} uur. Wat is de gemiddelde snelheid?`, answer: `${speed} knots`, explanation: `${dist} / ${String(time).replace('.', ',')} = ${speed}.` };
      },
      () => { // brandstofpercentage (zoals V17)
        const perHour = randInt(3, 9) * 20; const tank = perHour * randInt(4, 6);
        const hours = randInt(2, 4);
        const used = perHour * hours; const pct = Math.round((used / tank) * 100);
        return { id: 'G5', level: 2, questionType: 'open', options: null, question: `Een vliegtuig verbruikt ${perHour} liter per uur. De tank heeft ${tank} liter. Hoeveel procent is na ${hours} uur verbruikt?`, answer: `${pct}%`, explanation: `${hours} uur x ${perHour} = ${used} liter verbruikt. ${used} / ${tank} = ${pct}%.` };
      },
      () => { // brandstof-verhouding (zoals V18)
        const perHourBase = randInt(150, 220); const baseHours = pick([3, 4, 5]);
        const total = perHourBase * baseHours; const newHours = baseHours + randInt(1, 3);
        const rate = total / baseHours; const answer = Math.round(rate * newHours);
        return { id: 'G6', level: 2, questionType: 'open', options: null, question: `Brandstof voor ${baseHours} uur vlucht is ${total} kg. Hoeveel is nodig voor ${newHours} uur?`, answer: `${answer} kg`, explanation: `${total} / ${baseHours} = ${rate} kg/uur. ${rate} x ${newHours} = ${answer} kg.` };
      },
      () => { // tijdzone-aankomst (zoals V19)
        const depH = randInt(6, 20), depM = pick([0, 15, 30, 45]);
        const durH = randInt(1, 4), durM = pick([0, 15, 30, 45]);
        const tz = randInt(-5, 8);
        const totalMin = depH * 60 + depM + durH * 60 + durM;
        const utcH = Math.floor(totalMin / 60) % 24, utcM = totalMin % 60;
        let localMin = totalMin + tz * 60;
        localMin = ((localMin % (24 * 60)) + 24 * 60) % (24 * 60);
        const localH = Math.floor(localMin / 60), localM = localMin % 60;
        const pad = (n) => String(n).padStart(2, '0');
        return {
          id: 'G7', level: 3, questionType: 'open', options: null,
          question: `Vlucht duurt ${durH} uur en ${durM} minuten. Vertrek om ${pad(depH)}:${pad(depM)} UTC. Aankomst is in tijdzone UTC${tz >= 0 ? '+' : ''}${tz}. Hoe laat land je lokaal?`,
          answer: `${pad(localH)}:${pad(localM)} lokale tijd`,
          explanation: `${pad(depH)}:${pad(depM)} + ${durH}:${pad(durM)} = ${pad(utcH)}:${pad(utcM)} UTC. ${pad(utcH)}:${pad(utcM)} ${tz >= 0 ? '+' : '-'} ${Math.abs(tz)}:00 = ${pad(localH)}:${pad(localM)} lokaal.`,
        };
      },
      () => { // brandstofduur minus reserve (zoals V20)
        const totalFuel = randInt(10, 18) * 100; const burn = randInt(15, 26) * 10;
        const reserveMin = pick([30, 45, 60]);
        const reserveFuel = (reserveMin / 60) * burn;
        const usable = totalFuel - reserveFuel;
        const hours = usable / burn;
        const h = Math.floor(hours); const m = Math.round((hours - h) * 60);
        return {
          id: 'G8', level: 3, questionType: 'open', options: null,
          question: `Je hebt ${totalFuel} kg brandstof. Verbruik is ${burn} kg/uur. Je hebt een reserve van ${reserveMin} minuten nodig. Hoe lang kun je vliegen exclusief reserve?`,
          answer: `Ongeveer ${h} uur en ${m} minuten`,
          explanation: `Reserve: ${(reserveMin / 60).toFixed(2)} x ${burn} = ${reserveFuel.toFixed(1)} kg. Bruikbaar: ${totalFuel} - ${reserveFuel.toFixed(1)} = ${usable.toFixed(1)} kg. ${usable.toFixed(1)} / ${burn} = ${hours.toFixed(2)} uur ≈ ${h}u ${m}min.`,
        };
      },
    ];
    return genFromTemplates(templates);
  }

  function genWerkgeheugenVragen() {
    const templates = [
      () => {
        const seq = Array.from({ length: randInt(5, 6) }, () => randInt(0, 9));
        return { id: 'W1', level: 1, questionType: 'sequence', options: null, question: `Onthoud de volgende reeks en geef hem terug: ${seq.join(' — ')}`, answer: seq.join(' '), explanation: null };
      },
      () => {
        const seq = Array.from({ length: randInt(5, 6) }, () => randInt(0, 9));
        return { id: 'W2', level: 2, questionType: 'sequence', options: null, question: `Onthoud de volgende reeks en geef hem achterstevoren terug: ${seq.join(' — ')}`, answer: seq.slice().reverse().join(' '), explanation: null };
      },
      () => {
        const letters = oefenShuffle('ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')).slice(0, 3);
        const numbers = Array.from({ length: 3 }, () => randInt(1, 9));
        const items = oefenShuffle([...letters, ...numbers]);
        const sortedLetters = letters.slice().sort();
        const sortedNumbers = numbers.slice().sort((a, b) => a - b);
        return { id: 'W3', level: 2, questionType: 'sequence', options: null, question: `Onthoud: ${items.join(' — ')}. Geef eerst de letters alfabetisch, dan de cijfers oplopend.`, answer: `${sortedLetters.join(' ')} — ${sortedNumbers.join(' ')}`, explanation: 'Twee sorteerregels tegelijk toepassen.' };
      },
      () => {
        const colors = ['rood', 'blauw', 'groen', 'geel'];
        const target = pick(colors);
        const seq = Array.from({ length: 8 }, () => ({ color: pick(colors), num: randInt(1, 9) }));
        const count = seq.filter((s) => s.color === target).length;
        const sum = seq.reduce((a, s) => a + s.num, 0);
        return { id: 'W4', level: 3, questionType: 'sequence', options: null, question: `Je hoort: ${seq.map((s) => `${s.color} — ${s.num}`).join(' — ')}. Hoeveel keer komt ${target} voor? Wat is de som van alle cijfers?`, answer: `${capitalize(target)} ${count}x. Som: ${sum}`, explanation: 'Twee vragen tegelijk op basis van één aangeboden reeks.' };
      },
    ];
    return genFromTemplates(templates);
  }

  // ---- COMPASS-voorbereiding ----
  function roBeschrijving(bank, pitch) {
    const laag = bank === 'links' ? 'Linkervleugel laag' : 'Rechtervleugel laag';
    const balk = pitch === 'omhoog' ? 'balk omhoog' : 'balk omlaag';
    return `${laag}, ${balk}`;
  }
  function genRuimtelijkeOrientatieVragen() {
    const angles = [15, 30, 45, 60];
    const templates = [
      () => { // R1 — mc, zoals V25
        const bank = pick(['links', 'rechts']); const angle = pick(angles); const pitch = pick(['omhoog', 'omlaag']);
        const oppositeBank = bank === 'links' ? 'rechts' : 'links';
        const oppositePitch = pitch === 'omhoog' ? 'omlaag' : 'omhoog';
        const correctText = roBeschrijving(bank, pitch);
        const variants = oefenShuffle([roBeschrijving(bank, pitch), roBeschrijving(oppositeBank, pitch), roBeschrijving(bank, oppositePitch), roBeschrijving(oppositeBank, oppositePitch)]);
        const options = variants.map((v, i) => `${OEFEN_LETTERS[i]}) ${v}`);
        return {
          id: 'R1', level: 1, questionType: 'multiple_choice',
          question: `Het vliegtuig helt ${angle} graden naar ${bank}. De neus wijst ${pitch}. Wat laat de kunstmatige horizon zien?`,
          options, answer: options[variants.indexOf(correctText)],
          explanation: `Hellen naar ${bank} = ${bank}ervleugel daalt, ${oppositeBank}ervleugel omhoog.`,
        };
      },
      () => { // R2 — mc, zoals V26 (recht en vlak, constant)
        const opts = ['Blauwe helft boven, bruine helft onder, vleugelbalk in het midden', 'Alles blauw', 'Alles bruin', 'Balk schuin'];
        const order = oefenShuffle([0, 1, 2, 3]);
        const options = order.map((idx, pos) => `${OEFEN_LETTERS[pos]}) ${opts[idx]}`);
        return { id: 'R2', level: 1, questionType: 'multiple_choice', question: 'Vliegtuig vliegt recht en vlak. Piloot kijkt naar de kunstmatige horizon. Wat ziet hij?', options, answer: options[order.indexOf(0)], explanation: 'Recht en vlak = standaardweergave van de horizon.' };
      },
      () => { // R3 — mc, zoals V28
        const bank = pick(['links', 'rechts']);
        const oppositeBank = bank === 'links' ? 'rechts' : 'links';
        const depiction = bank === 'links' ? 'rechts omhoog, links omlaag' : 'links omhoog, rechts omlaag';
        const labels = oefenShuffle([capitalize(bank), capitalize(oppositeBank), 'Geen helling', 'Neus omhoog']);
        const options = labels.map((l, i) => `${OEFEN_LETTERS[i]}) ${l}`);
        return {
          id: 'R3', level: 2, questionType: 'multiple_choice',
          question: `Piloot ziet de horizon schuin — ${depiction}. De neus wijst recht vooruit. In welke richting helt het vliegtuig?`,
          options, answer: options[labels.indexOf(capitalize(bank))],
          explanation: `${capitalize(bank)} banken laat de horizon ${oppositeBank} omhoog gaan vanuit pilootsperspectief.`,
        };
      },
      () => { // R4 — open, zoals V27
        const bank = pick(['links', 'rechts']); const angle = pick(angles); const pitch = pick(['omhoog', 'omlaag']);
        const wingDesc = bank === 'rechts' ? 'Linkervleugellijn omhoog, rechtervleugellijn omlaag' : 'Rechtervleugellijn omhoog, linkervleugellijn omlaag';
        const noseDesc = pitch === 'omlaag' ? 'Vliegtuigsymbool zakt onder de horizonlijn (neus omlaag)' : 'Vliegtuigsymbool stijgt boven de horizonlijn (neus omhoog)';
        return {
          id: 'R4', level: 2, questionType: 'open', options: null,
          question: `Het vliegtuig maakt een bocht naar ${bank} met ${angle} graden bank. De neus ${pitch === 'omlaag' ? 'daalt' : 'stijgt'}. Beschrijf de kunstmatige horizon.`,
          answer: `${wingDesc} (bank ${bank}). ${noseDesc}.`,
          explanation: 'Twee bewegingen tegelijk: bank + neus.',
        };
      },
      () => { // R5 — open, zoals V29
        const dir = pick(['links', 'rechts']); const other = dir === 'links' ? 'rechts' : 'links';
        return {
          id: 'R5', level: 3, questionType: 'open', options: null,
          question: `Na een 180-graden-bocht naar ${dir} bij constante hoogte — welke kant is nu ${other} van de passagier die voorin zit?`,
          answer: `Wat oorspronkelijk ${dir} was is nu ${other} vanuit passagiersperspectief.`,
          explanation: 'Ruimtelijke rotatie bijhouden na een volledige halve cirkel.',
        };
      },
      () => { // R6 — open, zoals V30
        const bank = pick(['links', 'rechts']); const angle = pick([45, 60, 75]);
        return {
          id: 'R6', level: 3, questionType: 'open', options: null,
          question: `Vliegtuig is in een spiraalduik: bank ${angle} graden ${bank}, neus sterk omlaag. Welke drie instrumenten geven dit tegelijk aan?`,
          answer: 'Kunstmatige horizon (bank + neus omlaag) + hoogtemeter (daalt snel) + VSI (sterk negatief)',
          explanation: 'Drie instrumenten tegelijk lezen en combineren.',
        };
      },
    ];
    return genFromTemplates(templates);
  }

  function genInstrumentlezenVragen() {
    const templates = [
      () => {
        const thousands = randInt(1, 9), hundreds = randInt(1, 9);
        return { id: 'I1', level: 1, questionType: 'open', options: null, question: `De hoogtemeter toont: grote wijzer op ${hundreds}, kleine wijzer tussen ${thousands} en ${thousands + 1}. Op welke hoogte vliegt het vliegtuig?`, answer: `${thousands * 1000 + hundreds * 100} voet`, explanation: `Kleine wijzer = duizendtallen, grote wijzer = honderdtallen. Kleine tussen ${thousands}-${thousands + 1} + grote op ${hundreds} = ${thousands * 1000 + hundreds * 100}.` };
      },
      () => {
        const lo = randInt(5, 8) * 10; const hi = lo + randInt(6, 9) * 10; const speed = randInt(lo, hi);
        const nearTop = (hi - speed) <= 15;
        return { id: 'I2', level: 1, questionType: 'open', options: null, question: `De snelheidsmeter toont ${speed} knots. De groene boog loopt van ${lo} tot ${hi} knots. Is de huidige snelheid binnen het normale werkbereik?`, answer: `Ja${nearTop ? ', maar dicht bij de bovenkant' : ''}`, explanation: `${speed} knots valt binnen de groene boog (${lo}-${hi}).` };
      },
      () => {
        const vsi = pick([300, 400, 500, 600, 700, 800]) * pick([1, -1]);
        const startAlt = randInt(15, 45) * 100; const minutes = randInt(2, 6);
        const newAlt = startAlt + vsi * minutes;
        return { id: 'I3', level: 2, questionType: 'open', options: null, question: `VSI toont ${vsi > 0 ? '+' : ''}${vsi} ft/min. Hoogte is nu ${startAlt} voet. Na ${minutes} minuten ongewijzigd — wat is de hoogte?`, answer: `${newAlt} voet`, explanation: `${startAlt} ${vsi >= 0 ? '+' : '-'} (${Math.abs(vsi)} x ${minutes}) = ${newAlt} voet.` };
      },
      () => {
        const deg = randInt(1, 6); const dir = pick(['boven', 'onder']);
        return { id: 'I4', level: 2, questionType: 'open', options: null, question: `De kunstmatige horizon toont het vliegtuigsymbool ${deg} graden ${dir} de horizonlijn. Wat doet het vliegtuig?`, answer: dir === 'boven' ? `Licht stijgen (nose up ${deg} graden)` : `Licht dalen (nose down ${deg} graden)`, explanation: `Symbool ${dir} lijn = neus ${dir} horizon = ${dir === 'boven' ? 'stijgen' : 'dalen'}.` };
      },
      () => {
        const alt = randInt(20, 60) * 100; const vsi = pick([-400, -300, -200, -100, 100, 200]); const speed = randInt(90, 140); const bank = pick(['links', 'rechts']);
        return { id: 'I5', level: 3, questionType: 'open', options: null, question: `Vier instrumenten tegelijk: Hoogtemeter: ${alt} voet. VSI: ${vsi} ft/min. Snelheidsmeter: ${speed} knots. Kunstmatige horizon: licht ${bank} gebankt. Beschrijf de vluchttoestand.`, answer: `Vliegtuig ${vsi < 0 ? 'daalt' : 'stijgt'} langzaam, licht gebankt naar ${bank}, snelheid ${speed < 100 ? 'laag' : speed > 130 ? 'hoog' : 'normaal'}. Mogelijk in naderingsbeurt.`, explanation: 'Alle vier instrumenten combineren tot één situatiebeschrijving.' };
      },
      () => {
        const vsi = pick([100, 150, 200]); const seconds = pick([20, 30, 45]); const alt = randInt(20, 50) * 100;
        return { id: 'I6', level: 3, questionType: 'open', options: null, question: `VSI toont +${vsi} ft/min maar na ${seconds} seconden is de hoogte nog steeds ${alt} voet. Klopt de VSI dan?`, answer: 'Nee — als de VSI stijging aangeeft maar de hoogte niet verandert, is de VSI waarschijnlijk defect.', explanation: 'Afwijkingsdetectie: instrumenten met elkaar vergelijken.' };
      },
    ];
    return genFromTemplates(templates);
  }

  // ---- Situational Judgement & CRM ----
  function genSjtVragen() {
    const roles = ['co-piloot', 'eerste officier'];
    const relabel = (opts) => oefenShuffle(opts).map((o, i) => ({ ...o, label: `${OEFEN_LETTERS[i]}) ${o.label}` }));
    const templates = [
      () => {
        const role = pick(roles); const issue = pick(['te hoog en te snel', 'te laag en te langzaam']);
        const suggestion = issue.includes('hoog') ? 'een doorstart' : 'volgas en stabiliseren';
        return {
          id: 'S1', level: 2, questionType: 'sjt',
          question: `Je bent ${role}. De gezagvoerder nadert de landingsbaan maar is duidelijk ${issue}. Hij lijkt het niet in de gaten te hebben. Wat doe je?`,
          options: relabel([
            { label: 'Niets zeggen — hij is de gezagvoerder', points: 1 },
            { label: 'Wachten tot hij het zelf opmerkt', points: 2 },
            { label: `Rustig maar duidelijk zeggen: 'Captain, ik zie dat we ${issue} zijn, overweeg je ${suggestion}?'`, points: 4 },
            { label: 'Direct zelf ingrijpen en het vliegtuig overnemen', points: 2 },
          ]),
          explanation: 'Assertief maar respectvol. De gezagvoerder behoudt het overzicht en de beslissing.',
        };
      },
      () => {
        const cause = pick(['een lange nachtvlucht', 'een dubbele dienst']);
        return {
          id: 'S2', level: 2, questionType: 'sjt',
          question: `Na ${cause} voelt je captain zich duidelijk niet lekker. Hij wil toch doorvliegen. Wat doe je?`,
          options: relabel([
            { label: 'Akkoord gaan — hij weet zelf wat hij kan', points: 1 },
            { label: 'Het melden bij de purser maar niet bij de captain', points: 2 },
            { label: 'Direct operaties bellen zonder de captain te informeren', points: 2 },
            { label: 'Met de captain in gesprek gaan over hoe hij zich voelt, samen beslissen, eventueel operaties informeren', points: 4 },
          ]),
          explanation: 'Samenwerken en transparantie. Niemand passeren, maar veiligheid wel serieus nemen.',
        };
      },
      () => {
        const errorType = pick(['brandstofberekening', 'gewichtsberekening']);
        return {
          id: 'S3', level: 2, questionType: 'sjt',
          question: `Tijdens de briefing merk je dat de captain een fout maakt in de ${errorType}. Wat doe je?`,
          options: relabel([
            { label: 'Niets zeggen — misschien begrijp jij het niet goed', points: 1 },
            { label: 'Na de briefing stiekem de berekening zelf aanpassen', points: 2 },
            { label: 'Hem direct onderbreken en zeggen dat hij het fout heeft', points: 2 },
            { label: `Na de briefing rustig zeggen: 'Captain, ik kom tot een andere ${errorType} — kunnen we dat samen nakijken?'`, points: 4 },
          ]),
          explanation: 'Geen confrontatie, geen omzeiling — transparant en constructief.',
        };
      },
      () => {
        const role = pick(roles);
        return {
          id: 'S4', level: 2, questionType: 'sjt',
          question: `Je bent net begonnen als ${role}. De captain wijkt af van de standaardprocedure. Hij heeft meer ervaring. Wat doe je?`,
          options: relabel([
            { label: 'Niets — hij weet meer dan jij', points: 1 },
            { label: 'De afwijking melden aan de vluchttoren', points: 1 },
            { label: 'De afwijking opschrijven voor later en er niets van zeggen', points: 2 },
            { label: "Rustig vragen: 'Captain, ik zie dat we afwijken van de standaard — heb je een specifieke reden zodat ik het begrijp?'", points: 4 },
          ]),
          explanation: 'Juniorstatus is nooit een reden om te zwijgen over veiligheidszaken.',
        };
      },
      () => {
        const report = pick(['rookgeur', 'een brandende geur']);
        return {
          id: 'S5', level: 2, questionType: 'sjt',
          question: `Een passagier meldt ${report} via de purser. De captain zegt dat het onzin is. Wat doe je?`,
          options: relabel([
            { label: 'De captain vertrouwen en niets doen', points: 1 },
            { label: 'Zelf even de cabine ingaan', points: 3 },
            { label: 'Aandringen bij de captain, bij weigering het rookprotocol volgen', points: 4 },
            { label: 'Direct een noodlandingsprocedure inzetten', points: 2 },
          ]),
          explanation: 'Rook aan boord is een serieuze melding — protocol volgt, niet de mening van de captain.',
        };
      },
      () => ({
        id: 'S6', level: 2, questionType: 'sjt',
        question: 'De controller geeft een ingewikkelde clearance snel en onduidelijk. Wat doe je?',
        options: relabel([
          { label: 'Je schrijft op wat je dacht te horen en leest het terug', points: 2 },
          { label: 'Je vraagt de controller om de clearance te herhalen', points: 4 },
          { label: 'Je zegt niets en neemt aan dat je het goed begrepen hebt', points: 1 },
          { label: 'Je vraagt de captain of hij het ook gehoord heeft', points: 3 },
        ]),
        explanation: 'Readback van een onzekere clearance is verplicht en professioneel. Nooit raden.',
      }),
      () => { // P1 — prioriteiten stellen (zoals V43); volgorde/logica blijft gelijk, alleen bewoording varieert
        const medisch = pick(['Passagier is ziek', 'Passagier voelt zich zeer onwel']);
        const atc = pick(['ATC vraagt koerswijziging te bevestigen', 'ATC vraagt een hoogtewijziging te bevestigen']);
        const systeem = pick(['Systeemwaarschuwing licht op', 'Een waarschuwingslampje in de cockpit licht op']);
        const admin = pick(['Captain vraagt je iets te berekenen', 'Captain vraagt je een tijdsberekening te maken']);
        return {
          id: 'P1', level: 3, questionType: 'priority_ranking', options: null,
          question: `Vier dingen tegelijk: 1. ${medisch} (via purser) 2. ${atc} 3. ${systeem} 4. ${admin}. In welke volgorde pak je dit aan?`,
          answer: '3 (veiligheid) → 2 (ATC bevestigen) → 1 (purser informeren) → 4 (berekening)',
          explanation: 'Prioriteit: vliegtuigveiligheid eerst, communicatie tweede, medisch derde, administratief laatste.',
        };
      },
    ];
    return genFromTemplates(templates);
  }

  // ---- Luchtvaartkennis: meteorologie + navigatie ----
  function genMetar() {
    const airport = pick(['EHAM', 'EGLL', 'KJFK', 'LFPG', 'EDDF', 'LEMD']);
    const day = randInt(1, 28), hour = randInt(0, 23), min = pick([0, 20, 50]);
    const windDir = randInt(0, 35) * 10, windKt = randInt(3, 30);
    const vis = pick(['9999', '8000', '6000']);
    const cloudCode = pick(['FEW', 'SCT', 'BKN', 'OVC']), cloudAlt = randInt(2, 9) * 10;
    const temp = randInt(-5, 28); const dew = temp - randInt(1, 8);
    const qnh = randInt(985, 1035);
    const pad2 = (n) => String(n).padStart(2, '0'), pad3 = (n) => String(n).padStart(3, '0');
    const tempStr = temp < 0 ? 'M' + pad2(Math.abs(temp)) : pad2(temp);
    const dewStr = dew < 0 ? 'M' + pad2(Math.abs(dew)) : pad2(dew);
    const raw = `${airport} ${pad2(day)}${pad2(hour)}${pad2(min)}Z ${pad3(windDir)}${pad2(windKt)}KT ${vis} ${cloudCode}${pad3(cloudAlt)} ${tempStr}/${dewStr} Q${qnh}`;
    return { raw, windDir, windKt, temp, dew, qnh };
  }

  function genMeteorologieVragen() {
    const fixed = [
      () => {
        const opts = ['Een laaghangende mist', 'Een onweerswolk die zich verticaal uitstrekt tot soms 18 km hoogte', 'Een cirruswolk', 'Een bewolkingslaag op middelhoogte'];
        const order = oefenShuffle([0, 1, 2, 3]);
        const options = order.map((idx, pos) => `${OEFEN_LETTERS[pos]}) ${opts[idx]}`);
        return { id: 'ME1', level: 1, questionType: 'multiple_choice', question: 'Wat is een cumulonimbus (CB)?', options, answer: options[order.indexOf(1)], explanation: 'CB-wolken zijn extreem gevaarlijk vanwege turbulentie, ijsafzetting, bliksem en hagel.' };
      },
      () => {
        const opts = ['Overcast — meer dan 7/8 bewolking', 'Occasional visibility', 'Onbekende cloudbase', 'Only vertical clouds'];
        const order = oefenShuffle([0, 1, 2, 3]);
        const options = order.map((idx, pos) => `${OEFEN_LETTERS[pos]}) ${opts[idx]}`);
        return { id: 'ME2', level: 1, questionType: 'multiple_choice', question: 'Wat betekent OVC in een METAR?', options, answer: options[order.indexOf(0)], explanation: 'FEW = 1-2/8, SCT = 3-4/8, BKN = 5-7/8, OVC = 8/8.' };
      },
      () => ({ id: 'ME3', level: 2, questionType: 'open', options: null, question: 'Wat is windshear en waarom is het gevaarlijk voor vliegtuigen?', answer: 'Windshear is een plotselinge verandering van windsnelheid en/of richting over een korte afstand. Gevaarlijk omdat het de lift plotseling kan doen afnemen, met name in de nadering of kort na de start.', explanation: null }),
      () => ({ id: 'ME4', level: 3, questionType: 'open', options: null, question: 'Wat is een microburst en in welke vliegfase is het het gevaarlijkst?', answer: 'Een microburst is een sterke neerwaartse luchtstroom die bij de grond uitwaaiert. Gevaarlijkst bij start en landing: eerst een schijnbare headwind (meer lift), gevolgd door een plotselinge downwind die lift wegneemt.', explanation: null }),
    ];
    const repeating = [
      () => { const m = genMetar(); return { id: 'ME5', level: 2, questionType: 'open', options: null, question: `METAR: ${m.raw}. Wat is de windrichting en sterkte?`, answer: `Wind uit ${m.windDir} graden met ${m.windKt} knots`, explanation: `Windgroep in de METAR = ${m.windDir} graden, ${m.windKt} knots.` }; },
      () => { const m = genMetar(); return { id: 'ME6', level: 2, questionType: 'open', options: null, question: `METAR: ${m.raw}. Wat is de dauwpunttemperatuur?`, answer: `${m.dew} graden Celsius`, explanation: `Temperatuur/dauwpunt in de METAR: ${m.temp}/${m.dew}.` }; },
      () => { const m = genMetar(); return { id: 'ME7', level: 2, questionType: 'open', options: null, question: `METAR: ${m.raw}. Wat is de QNH?`, answer: `${m.qnh} hPa`, explanation: `Q-groep in de METAR (Q${m.qnh}) = luchtdruk op zeeniveau in hPa.` }; },
    ];
    return genFixedPlusRepeating(fixed, repeating);
  }

  function genNavigatieVragen() {
    const fixed = [
      () => {
        const opts = ['Hoogte', 'Magnetische richting ten opzichte van het VOR-station', 'Afstand tot de baan', 'Windrichting'];
        const order = oefenShuffle([0, 1, 2, 3]);
        const options = order.map((idx, pos) => `${OEFEN_LETTERS[pos]}) ${opts[idx]}`);
        return { id: 'NA1', level: 1, questionType: 'multiple_choice', question: 'Wat meet een VOR?', options, answer: options[order.indexOf(1)], explanation: 'VOR = VHF Omnidirectional Range — geeft een radiale (richting) van het station.' };
      },
      () => {
        const opts = ['De richting van de neus', 'De werkelijke weg die het vliegtuig over de grond aflegt', 'De magnetische koers', 'De windcorrectiehoek'];
        const order = oefenShuffle([0, 1, 2, 3]);
        const options = order.map((idx, pos) => `${OEFEN_LETTERS[pos]}) ${opts[idx]}`);
        return { id: 'NA2', level: 1, questionType: 'multiple_choice', question: 'Wat is de Track?', options, answer: options[order.indexOf(1)], explanation: 'Track = ground track. Heading + wind = track.' };
      },
    ];
    const repeating = [
      () => {
        const heading = pick([0, 45, 90, 135, 180, 225, 270, 315]);
        const windSide = pick(['noorden', 'zuiden', 'oosten', 'westen']);
        const driftMap = { noorden: 'zuiden', zuiden: 'noorden', oosten: 'westen', westen: 'oosten' };
        const kt = randInt(10, 30);
        return { id: 'NA3', level: 2, questionType: 'open', options: null, question: `Vliegtuig vliegt op heading ${String(heading).padStart(3, '0')}. Crosswind uit het ${windSide} met ${kt} knots. Naar welke kant drift het vliegtuig?`, answer: `Naar het ${driftMap[windSide]}`, explanation: `Wind van het ${windSide} duwt het vliegtuig richting ${driftMap[windSide]}.` };
      },
      () => {
        const speed = randInt(8, 20) * 10; const time = pick([1, 1.5, 2, 2.5, 3]);
        const dist = Math.round(speed * time);
        return { id: 'NA4', level: 2, questionType: 'open', options: null, question: `Afstand: ${dist} nm. Snelheid: ${speed} knots. Hoelang duurt de vlucht?`, answer: `${String(time).replace('.', ',')} uur`, explanation: `${dist} / ${speed} = ${time} uur.` };
      },
      () => {
        const course = pick([0, 45, 90, 135, 180, 225, 270, 315]);
        const dist = randInt(100, 220); const tas = randInt(120, 180);
        const windDir = (course + 315) % 360; const windKt = randInt(15, 35);
        const crossComp = Math.round(windKt * Math.sin(Math.PI / 4)); const headComp = Math.round(windKt * Math.cos(Math.PI / 4));
        const wcaDeg = Math.round((crossComp / tas) * (180 / Math.PI));
        const gs = tas - headComp;
        return {
          id: 'NA5', level: 3, questionType: 'open', options: null,
          question: `Koers ${String(course).padStart(3, '0')} graden, afstand ${dist} nm, TAS ${tas} knots. Wind ${String(windDir).padStart(3, '0')}/${windKt} knots. Bereken de wind correction angle (benadering) en de groundspeed.`,
          answer: `WCA ≈ ${Math.abs(wcaDeg)} graden naar ${wcaDeg >= 0 ? 'rechts' : 'links'}. Tegenwindcomponent ≈ ${headComp} knots. Groundspeed ≈ ${gs} knots.`,
          explanation: `Kruiswindcomponent: ${windKt} x sin(45°) ≈ ${crossComp} knots. Tegenwind: ${windKt} x cos(45°) ≈ ${headComp} knots.`,
        };
      },
    ];
    return genFixedPlusRepeating(fixed, repeating);
  }

  // ---- Verbaal redeneren: vaste, geverifieerde bank (20) — analogieën + syllogismen.
  // Logica-opgaven lenen zich slecht voor runtime-generatie (risico op onlogische
  // varianten), dus deze set is met de hand geverifieerd en wordt elke beurt
  // geschud (volgorde + optie-letters) via oefenShuffleForReplay.
  const VERBAAL_BANK = [
    { id: 'VB1', level: 1, questionType: 'multiple_choice', question: 'Piloot staat tot cockpit als chirurg staat tot...?', options: ['A) Ziekenhuis', 'B) Operatiekamer', 'C) Patiënt', 'D) Scalpel'], answer: 'B) Operatiekamer', explanation: 'De werkplek van de professional.' },
    { id: 'VB2', level: 1, questionType: 'multiple_choice', question: 'Vleugel staat tot lift als roer staat tot...?', options: ['A) Hoogte', 'B) Richting', 'C) Snelheid', 'D) Gewicht'], answer: 'B) Richting', explanation: 'Roer stuurt de richting zoals de vleugel lift genereert.' },
    { id: 'VB3', level: 1, questionType: 'multiple_choice', question: 'METAR staat tot huidig weer als TAF staat tot...?', options: ['A) Windrichting', 'B) Weersverleden', 'C) Weersvoorspelling', 'D) Temperatuur'], answer: 'C) Weersvoorspelling', explanation: 'METAR = actueel, TAF = forecast.' },
    { id: 'VB4', level: 1, questionType: 'multiple_choice', question: 'Hoogtemeter staat tot hoogte als snelheidsmeter staat tot...?', options: ['A) Temperatuur', 'B) Snelheid', 'C) Richting', 'D) Brandstof'], answer: 'B) Snelheid', explanation: 'Instrument staat tot de grootheid die het meet.' },
    { id: 'VB5', level: 1, questionType: 'multiple_choice', question: 'Motor staat tot stuwkracht als vleugel staat tot...?', options: ['A) Gewicht', 'B) Weerstand', 'C) Lift', 'D) Geluid'], answer: 'C) Lift', explanation: 'Onderdeel staat tot de kracht die het levert.' },
    { id: 'VB6', level: 1, questionType: 'multiple_choice', question: 'Km/u staat tot snelheid op de weg als knots staat tot...?', options: ['A) Snelheid in de lucht', 'B) Hoogte', 'C) Temperatuur', 'D) Afstand'], answer: 'A) Snelheid in de lucht', explanation: 'Eenheid staat tot de context waarin die gebruikt wordt.' },
    { id: 'VB7', level: 1, questionType: 'multiple_choice', question: 'Thermometer staat tot temperatuur als kompas staat tot...?', options: ['A) Snelheid', 'B) Richting', 'C) Hoogte', 'D) Tijd'], answer: 'B) Richting', explanation: 'Instrument staat tot de grootheid die het meet.' },
    { id: 'VB8', level: 1, questionType: 'multiple_choice', question: 'Arts staat tot patiënt als instructeur staat tot...?', options: ['A) Collega', 'B) Leerling', 'C) Manager', 'D) Toezichthouder'], answer: 'B) Leerling', explanation: 'Professional staat tot degene die hij begeleidt.' },
    { id: 'VB9', level: 1, questionType: 'multiple_choice', question: 'Sleutel staat tot slot als wachtwoord staat tot...?', options: ['A) Computer', 'B) Account', 'C) Toetsenbord', 'D) Scherm'], answer: 'B) Account', explanation: 'Geeft toegang tot.' },
    { id: 'VB10', level: 1, questionType: 'multiple_choice', question: 'Boek staat tot hoofdstuk als vlucht staat tot...?', options: ['A) Etappe', 'B) Cockpit', 'C) Bagage', 'D) Ticket'], answer: 'A) Etappe', explanation: 'Geheel staat tot een onderdeel ervan.' },
    { id: 'VB11', level: 2, questionType: 'multiple_choice', question: "Alle Boeing 737's hebben twee motoren. Dit vliegtuig is een Boeing 737. Heeft dit vliegtuig zeker twee motoren?", options: ['A) Ja, zeker', 'B) Nee', 'C) Niet met zekerheid te zeggen', 'D) Alleen bij nieuwe modellen'], answer: 'A) Ja, zeker', explanation: 'Geldige redenering (modus ponens): als alle A een eigenschap B hebben en dit is een A, dan heeft dit zeker B.' },
    { id: 'VB12', level: 2, questionType: 'multiple_choice', question: 'Alle helikopters hebben rotorbladen. Dit toestel heeft rotorbladen. Is dit toestel zeker een helikopter?', options: ['A) Ja', 'B) Nee', 'C) Niet met zekerheid te zeggen', 'D) Alleen als het een gyrocopter is'], answer: 'C) Niet met zekerheid te zeggen', explanation: 'Klassieke drogreden: dat alle helikopters rotorbladen hebben, betekent niet dat alléén helikopters die hebben.' },
    { id: 'VB13', level: 2, questionType: 'multiple_choice', question: 'Als het zicht onder de minima is, mag een vliegtuig niet landen. Dit vliegtuig is net geland. Was het zicht onder de minima?', options: ['A) Ja', 'B) Nee', 'C) Mogelijk', 'D) Alleen bij nacht'], answer: 'B) Nee', explanation: 'Geldige redenering (modus tollens): het vliegtuig landde, dus was de voorwaarde voor niet-landen niet van toepassing.' },
    { id: 'VB14', level: 2, questionType: 'multiple_choice', question: 'Alle IFR-vluchten vereisen een vliegplan. Deze vlucht heeft geen vliegplan. Wat volgt hieruit?', options: ['A) Het is een VFR-vlucht', 'B) Het is een illegale vlucht', 'C) De vlucht gaat niet door', 'D) Geen conclusie mogelijk'], answer: 'A) Het is een VFR-vlucht', explanation: 'Als IFR altijd een vliegplan vereist, dan geldt: geen vliegplan = geen IFR = VFR.' },
    { id: 'VB15', level: 2, questionType: 'multiple_choice', question: 'Alle vluchten boven FL195 vereisen RVSM-goedkeuring. Dit vliegtuig heeft geen RVSM-goedkeuring. Op welke hoogte vliegt het?', options: ['A) Boven FL195', 'B) Op of onder FL195', 'C) Precies op FL195', 'D) Niet te bepalen'], answer: 'B) Op of onder FL195', explanation: 'Geldige redenering (modus tollens) toegepast op een luchtvaartregel.' },
    { id: 'VB16', level: 3, questionType: 'multiple_choice', question: 'Piloten met meer dan 1500 vlieguren mogen als gezagvoerder vliegen. Iris heeft 1200 uur, maar is extra gecertificeerd — een erkende uitzonderingsgrond. Mag Iris als gezagvoerder vliegen?', options: ['A) Ja', 'B) Nee', 'C) Mogelijk', 'D) Alleen op korte vluchten'], answer: 'C) Mogelijk', explanation: 'De uitzondering maakt het onzeker maar niet onmogelijk.' },
    { id: 'VB17', level: 2, questionType: 'multiple_choice', question: 'Om als eerste officier te mogen vliegen heb je een geldig medisch certificaat én een type rating nodig. Mark heeft een medisch certificaat maar geen type rating. Mag Mark als eerste officier vliegen?', options: ['A) Ja', 'B) Nee', 'C) Mogelijk', 'D) Alleen als instructeur'], answer: 'B) Nee', explanation: 'Beide voorwaarden zijn vereist; als er één ontbreekt, is niet aan de eis voldaan.' },
    { id: 'VB18', level: 2, questionType: 'multiple_choice', question: 'Een vlucht is óf VFR óf IFR, nooit beide tegelijk. Deze vlucht is niet VFR. Wat voor vlucht is het?', options: ['A) VFR', 'B) IFR', 'C) Geen van beide', 'D) Niet te bepalen'], answer: 'B) IFR', explanation: 'Bij een exclusieve of: als het één niet is, is het het ander.' },
    { id: 'VB19', level: 2, questionType: 'multiple_choice', question: 'Als de brandstof onder de wettelijke reserve komt, moet de piloot een prioriteitslanding aanvragen. De brandstof van dit vliegtuig zit onder de reserve. Wat moet de piloot doen?', options: ['A) Een prioriteitslanding aanvragen', 'B) Doorvliegen naar de oorspronkelijke bestemming', 'C) Wachten op nieuwe instructies', 'D) Niets, dit is normaal'], answer: 'A) Een prioriteitslanding aanvragen', explanation: 'Geldige redenering (modus ponens).' },
    { id: 'VB20', level: 3, questionType: 'multiple_choice', question: 'Alle vluchten met een Mayday-melding krijgen voorrang van de verkeersleiding. Deze vlucht krijgt voorrang van de verkeersleiding. Heeft deze vlucht zeker een Mayday-melding?', options: ['A) Ja', 'B) Nee', 'C) Niet met zekerheid te zeggen', 'D) Alleen als het nacht is'], answer: 'C) Niet met zekerheid te zeggen', explanation: 'Ook een Pan-Pan-melding of andere noodsituatie kan voorrang krijgen — voorrang bewijst geen Mayday specifiek.' },
  ];
  function genVerbaalVragen() { return oefenShuffleForReplay(VERBAAL_BANK); }

  // ---- Regelgeving: vaste, geverifieerde feitenbank (20) ----
  const REGELGEVING_BANK = [
    { id: 'RG1', level: 1, questionType: 'multiple_choice', question: 'Wat is de transpondercode voor een noodgeval?', options: ['A) 7600', 'B) 7700', 'C) 7500', 'D) 1200'], answer: 'B) 7700', explanation: '7700 = nood. 7600 = radiocontact verloren. 7500 = kaping.' },
    { id: 'RG2', level: 1, questionType: 'multiple_choice', question: 'Wat is luchtruimklasse A?', options: ['A) Vrij luchtruim voor iedereen', 'B) Alleen IFR-vluchten, ATC-klaring verplicht', 'C) VFR mogelijk zonder klaring', 'D) Militair luchtruim'], answer: 'B) Alleen IFR-vluchten, ATC-klaring verplicht', explanation: 'Klasse A = hoogste gecontroleerde luchtruim. Alleen IFR, altijd klaring nodig.' },
    { id: 'RG3', level: 2, questionType: 'open', options: null, question: 'Wat is het verschil tussen Mayday en Pan-Pan?', answer: 'Mayday = direct levensgevaar, onmiddellijke hulp nodig. Pan-Pan = urgente situatie maar nog geen direct levensgevaar.', explanation: null },
    { id: 'RG4', level: 3, questionType: 'open', options: null, question: 'Een piloot vliegt VFR en raakt onbedoeld in IMC (mist). Wat zijn zijn verplichtingen en opties?', answer: 'VFR in IMC is illegaal en levensgevaarlijk. Opties: 180-gradenbocht terug naar VMC, noodklaring bij ATC aanvragen, Mayday uitsturen indien noodzakelijk.', explanation: null },
    { id: 'RG5', level: 1, questionType: 'multiple_choice', question: 'Wat betekent de transpondercode 7600?', options: ['A) Noodgeval', 'B) Radiocommunicatie verloren', 'C) Kaping', 'D) VFR-vlucht'], answer: 'B) Radiocommunicatie verloren', explanation: '7600 wordt gebruikt bij verlies van radiocontact met ATC.' },
    { id: 'RG6', level: 1, questionType: 'multiple_choice', question: 'Wat betekent de transpondercode 7500?', options: ['A) Noodgeval', 'B) Radiocommunicatie verloren', 'C) Kaping (unlawful interference)', 'D) Trainingsvlucht'], answer: 'C) Kaping (unlawful interference)', explanation: '7500 is de wereldwijde code voor onwettige inmenging/kaping.' },
    { id: 'RG7', level: 2, questionType: 'multiple_choice', question: 'Wat is de standaard VFR-conspicuity-code in het Europese luchtruim?', options: ['A) 1200', 'B) 7000', 'C) 2000', 'D) 0000'], answer: 'B) 7000', explanation: '7000 is de Europese standaard conspicuity-code voor VFR-vluchten zonder specifieke toewijzing.' },
    { id: 'RG8', level: 2, questionType: 'open', options: null, question: 'Wat is luchtruimklasse G en wat betekent dat voor een piloot?', answer: 'Ongecontroleerd luchtruim — geen ATC-klaring nodig, de piloot is zelf verantwoordelijk voor separatie (vooral bij VFR).', explanation: null },
    { id: 'RG9', level: 2, questionType: 'open', options: null, question: 'Wat is een NOTAM en waarvoor dient het?', answer: 'Een officiële mededeling aan luchtvarenden over tijdelijke of belangrijke wijzigingen die relevant zijn voor de vlucht, bijv. een baan buiten gebruik, een obstakel, of een luchtruimbeperking.', explanation: null },
    { id: 'RG10', level: 2, questionType: 'open', options: null, question: 'Wat is het doel van een vliegplan (flight plan)?', answer: 'Informeert de luchtverkeersleiding en search-and-rescue-diensten over de geplande vlucht, zodat hulp georganiseerd kan worden als de vlucht niet aankomt zoals gepland.', explanation: null },
    { id: 'RG11', level: 1, questionType: 'open', options: null, question: 'Wat betekent IMC?', answer: 'Instrument Meteorological Conditions — weersomstandigheden waarbij op zicht vliegen niet veilig is en instrumentvliegen vereist is.', explanation: null },
    { id: 'RG12', level: 1, questionType: 'open', options: null, question: 'Wat betekent VMC?', answer: 'Visual Meteorological Conditions — weersomstandigheden met voldoende zicht en wolkenbasis om op zicht te vliegen.', explanation: null },
    { id: 'RG13', level: 2, questionType: 'open', options: null, question: 'Wat is het verschil tussen gecontroleerd en ongecontroleerd luchtruim?', answer: 'In gecontroleerd luchtruim heeft de luchtverkeersleiding gezag en is vaak een klaring nodig; in ongecontroleerd luchtruim is de piloot zelf verantwoordelijk voor separatie.', explanation: null },
    { id: 'RG14', level: 1, questionType: 'open', options: null, question: 'Wat is de juiste noodoproep bij direct levensgevaar, en hoe vaak herhaal je die?', answer: "Mayday, driemaal achter elkaar uitgesproken ('Mayday Mayday Mayday').", explanation: null },
    { id: 'RG15', level: 1, questionType: 'open', options: null, question: 'Wat is de juiste oproep bij een dringende situatie zonder direct levensgevaar, en hoe vaak herhaal je die?', answer: "Pan-Pan, driemaal achter elkaar uitgesproken ('Pan-Pan Pan-Pan Pan-Pan').", explanation: null },
    { id: 'RG16', level: 2, questionType: 'open', options: null, question: 'Wat is de functie van een transponder?', answer: 'Zendt een identificatiecode (en bij Mode C/S ook hoogte-informatie) naar de secundaire surveillanceradar van de grond, zodat ATC het vliegtuig kan identificeren en volgen.', explanation: null },
    { id: 'RG17', level: 3, questionType: 'open', options: null, question: 'Wat regelt ICAO Annex 2 in grote lijnen?', answer: 'De algemene verkeersregels voor de lucht (Rules of the Air), zoals rechten van overpad en basisregels voor VFR- en IFR-vluchten.', explanation: null },
    { id: 'RG18', level: 3, questionType: 'open', options: null, question: 'Wat regelt ICAO Annex 1 in grote lijnen?', answer: 'De standaarden voor het licentiëren van luchtvaartpersoneel, zoals piloten en luchtverkeersleiders (Personnel Licensing).', explanation: null },
    { id: 'RG19', level: 2, questionType: 'multiple_choice', question: 'Wat is de minimumleeftijd volgens de ICAO-standaard voor het behalen van een PPL (Private Pilot Licence)?', options: ['A) 16 jaar', 'B) 17 jaar', 'C) 18 jaar', 'D) 21 jaar'], answer: 'B) 17 jaar', explanation: 'ICAO Annex 1 stelt 17 jaar als standaard minimumleeftijd voor een PPL(A).' },
    { id: 'RG20', level: 2, questionType: 'open', options: null, question: 'Waarom is het melden van een afwijking of incident (safety reporting) belangrijk in de luchtvaart?', answer: "Het stelt de sector in staat patronen en risico's te herkennen en te verbeteren voordat een incident tot een ongeval leidt — een kernprincipe van veiligheidscultuur (Just Culture).", explanation: null },
  ];
  function genRegelgevingVragen() { return oefenShuffleForReplay(REGELGEVING_BANK); }

  // ---- Vliegtuigkennis: vaste, geverifieerde feitenbank (20) ----
  const VLIEGTUIGKENNIS_BANK = [
    { id: 'VK1', level: 1, questionType: 'multiple_choice', question: 'Wat doet een aileron?', options: ['A) Regelt de stijgsnelheid', 'B) Regelt de rolbeweging om de langsas', 'C) Remt het vliegtuig', 'D) Vergroot de lift bij lage snelheid'], answer: 'B) Regelt de rolbeweging om de langsas', explanation: 'Primair stuuroppervlak voor rollen. Werkt asymmetrisch: links omhoog = rechts omlaag.' },
    { id: 'VK2', level: 2, questionType: 'multiple_choice', question: 'Wat doet een fowler flap bij uitklappen?', options: ['A) Vergroot alleen de camber', 'B) Vergroot zowel vleugeloppervlakte als camber, verhoogt lift sterk', 'C) Vergroot alleen de weerstand', 'D) Vermindert de lift'], answer: 'B) Vergroot zowel vleugeloppervlakte als camber, verhoogt lift sterk', explanation: 'Fowler flap schuift naar achteren én omlaag: meer oppervlak + meer camber.' },
    { id: 'VK3', level: 3, questionType: 'open', options: null, question: 'Beschrijf wat er gebeurt tijdens een geïnduceerde stall in een bocht.', answer: 'In een bocht neemt de benodigde lift toe (loadfactor). De effectieve stalsnelheid stijgt daardoor. Bij te langzaam vliegen of te hard trekken kan de kritische hoek van aanval eerder bereikt worden dan verwacht. Gevaarlijk bij lage hoogte in de naderingsbocht.', explanation: null },
    { id: 'VK4', level: 1, questionType: 'open', options: null, question: 'Wat doet het roer (rudder)?', answer: 'Regelt de gierbeweging (yaw) om de verticale as — stuurt de neus naar links of rechts.', explanation: null },
    { id: 'VK5', level: 1, questionType: 'open', options: null, question: 'Wat doet het hoogteroer (elevator)?', answer: 'Regelt de stampbeweging (pitch) om de dwarsas — bepaalt of de neus omhoog of omlaag gaat.', explanation: null },
    { id: 'VK6', level: 2, questionType: 'open', options: null, question: 'Wat is de functie van slats (voorrandkleppen)?', answer: 'Vergroten de kritische hoek van aanval voordat de vleugel stalt, wat lift bij lage snelheid verbetert.', explanation: null },
    { id: 'VK7', level: 2, questionType: 'open', options: null, question: 'Wat is de functie van spoilers?', answer: 'Verminderen lift en verhogen weerstand, bijvoorbeeld om sneller te dalen of na landing de grip op de baan te vergroten.', explanation: null },
    { id: 'VK8', level: 2, questionType: 'open', options: null, question: 'Wat gebeurt er tijdens een stall?', answer: 'De luchtstroom over de vleugel raakt los (separeert) doordat de kritische hoek van aanval wordt overschreden, waardoor de lift plotseling sterk afneemt.', explanation: null },
    { id: 'VK9', level: 1, questionType: 'open', options: null, question: 'Wat is de functie van de trim?', answer: 'Vermindert de stuurkracht die de piloot continu moet leveren om een gewenste vliegstand (bijv. hoogte of snelheid) vast te houden.', explanation: null },
    { id: 'VK10', level: 2, questionType: 'open', options: null, question: 'Wat is het verschil tussen een turbofan en een turboprop?', answer: 'Een turbofan wekt stuwkracht op via een grote fan met een relatief kleine jetkern; een turboprop drijft via een reductiekast een propeller aan voor de stuwkracht.', explanation: null },
    { id: 'VK11', level: 1, questionType: 'open', options: null, question: 'Wat is de functie van het landingsgestel?', answer: 'Draagt het vliegtuig op de grond en absorbeert de schokken bij start en landing.', explanation: null },
    { id: 'VK12', level: 2, questionType: 'open', options: null, question: 'Wat is V1 bij het opstijgen?', answer: 'De beslissingssnelheid: tot en met V1 kan de start nog veilig worden afgebroken, daarna niet meer en moet de start worden voortgezet.', explanation: null },
    { id: 'VK13', level: 2, questionType: 'open', options: null, question: 'Wat is Vr?', answer: 'De rotatiesnelheid — de snelheid waarbij de piloot de neus omhoog haalt (rotate) om op te stijgen.', explanation: null },
    { id: 'VK14', level: 2, questionType: 'open', options: null, question: 'Wat is Vne?', answer: 'De nooit-te-overschrijden snelheid (velocity never exceed) — de structurele snelheidsgrens van het vliegtuig.', explanation: null },
    { id: 'VK15', level: 1, questionType: 'open', options: null, question: 'Wat is de algemene functie van flaps?', answer: 'Vergroten de lift (en meestal ook de weerstand) bij lagere snelheden, vooral belangrijk bij start en landing.', explanation: null },
    { id: 'VK16', level: 2, questionType: 'open', options: null, question: 'Wat is het verschil tussen empty weight en MTOW?', answer: 'Empty weight is het gewicht van het lege toestel; MTOW (Maximum Take-Off Weight) is het maximaal toegestane gewicht bij het opstijgen.', explanation: null },
    { id: 'VK17', level: 2, questionType: 'open', options: null, question: 'Wat is de functie van een winglet?', answer: 'Vermindert de tipwervels (induced drag) aan de vleugeltip, wat de brandstofefficiëntie verbetert.', explanation: null },
    { id: 'VK18', level: 3, questionType: 'open', options: null, question: 'Wat is het zwaartepunt (center of gravity) en waarom is het belangrijk?', answer: 'Het punt waar het gewicht van het vliegtuig effectief aangrijpt; buiten de toegestane grenzen verslechtert het de stabiliteit en bestuurbaarheid.', explanation: null },
    { id: 'VK19', level: 2, questionType: 'open', options: null, question: 'Wat is de functie van de horizontale stabilisator?', answer: 'Zorgt voor langsstabiliteit (pitch-stabiliteit) van het vliegtuig.', explanation: null },
    { id: 'VK20', level: 2, questionType: 'open', options: null, question: 'Wat is de functie van de verticale stabilisator (het kielvlak)?', answer: 'Zorgt voor richtingsstabiliteit (yaw-stabiliteit) van het vliegtuig.', explanation: null },
  ];
  function genVliegtuigkennisVragen() { return oefenShuffleForReplay(VLIEGTUIGKENNIS_BANK); }

  const QUESTION_GENERATORS = {
    cognitief: {
      matrixredeneren: genMatrixVragen,
      'numeriek-redeneren': genNumeriekVragen,
      werkgeheugen: genWerkgeheugenVragen,
      'verbaal-redeneren': genVerbaalVragen,
    },
    compass: {
      'ruimtelijke-orientatie': genRuimtelijkeOrientatieVragen,
      instrumentlezen: genInstrumentlezenVragen,
    },
    'sjt-crm': { algemeen: genSjtVragen },
    luchtvaartkennis: {
      meteorologie: genMeteorologieVragen,
      navigatie: genNavigatieVragen,
      regelgeving: genRegelgevingVragen,
      vliegtuigkennis: genVliegtuigkennisVragen,
    },
  };

  // ---- Engels & Communicatie: scenario's met verse callsigns/waarden ----
  function genAtcClearanceSteps() {
    const callsign = pick(['KLM1234', 'TRA456', 'EZY789', 'BAW321', 'DLH654']);
    const dest = pick(['Amsterdam', 'Rotterdam', 'Eindhoven']);
    const sid = pick(['SUGOL', 'ARTIP', 'LOPIK', 'NIRSI']) + ' departure';
    const flStr = 'FL' + String(pick([60, 70, 80, 90, 100])).padStart(3, '0');
    const squawk = String(randInt(1000, 7677));
    const context = `${callsign}, cleared to ${dest} via ${sid}, climb to ${flStr}, squawk ${squawk}.`;
    return [
      { context, question: 'Wat is de squawkcode?', answer: squawk },
      { context, question: 'Welke hoogte?', answer: flStr },
      { context, question: 'Via welke SID?', answer: sid },
    ];
  }
  function genReadbackSteps() {
    const callsign = pick(['TRA456', 'KLM123', 'EZY789', 'BAW321']);
    const alt = pick([2000, 3000, 4000, 5000]); const qnh = randInt(990, 1030);
    const context = `${callsign}, descend to ${alt} feet, QNH ${qnh}, report outer marker.`;
    return [{ context, question: 'Lees de klaring correct terug.', answer: `Descend to ${alt} feet, QNH ${qnh}, wilco outer marker, ${callsign}.`, hint: 'Callsign aan het eind, alle informatie herhaald, correcte volgorde.' }];
  }
  function genErrorDetectionSteps() {
    const callsign = pick(['EZY789', 'KLM456', 'TRA123']);
    const trueDir = pick(['left', 'right']); const wrongDir = trueDir === 'left' ? 'right' : 'left';
    const heading = String(pick([90, 180, 270, 360])).padStart(3, '0');
    const alt = pick([3000, 4000, 5000]);
    const context = `Controller: 'turn ${trueDir} heading ${heading}, descend to ${alt} feet.' Piloot leest terug: 'Turn ${wrongDir.toUpperCase()} heading ${heading}, descend to ${alt} feet, ${callsign}.'`;
    return [{ context, question: 'Markeer de fout en geef de correcte readback.', answer: trueDir === 'left' ? 'Links werd rechts.' : 'Rechts werd links.' }];
  }
  const ICAO_ALPHABET = { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'Xray', Y: 'Yankee', Z: 'Zulu' };
  function genIcaoSteps() {
    const word = pick(['AMSTERDAM', 'ROTTERDAM', 'SCHIPHOL', 'EINDHOVEN', 'ANTWERPEN', 'BRUSSEL', 'LONDEN', 'PARIJS']);
    const answer = word.split('').map((ch) => ICAO_ALPHABET[ch] || ch).join(' — ');
    return [{ context: null, question: `Spel het woord ${word} via het ICAO-alfabet.`, answer }];
  }
  function genPositionReportSteps() {
    const callsign = pick(['KLM123', 'TRA456', 'EZY789', 'DLH234']);
    const fix = pick(['SUGOL', 'ARTIP', 'LOPIK', 'NIRSI']);
    const fl = pick([80, 100, 120, 140, 160]);
    const dest = pick(['Amsterdam', 'Rotterdam', 'Eindhoven']);
    const hh = randInt(6, 22), mm = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const pad2 = (n) => String(n).padStart(2, '0');
    const situation = { callsign, positie: `boven ${fix}`, hoogte: `FL${String(fl).padStart(3, '0')}`, bestemming: dest, geschatteAankomst: `${pad2(hh)}:${pad2(mm)}` };
    const sitText = Object.entries(situation).map(([k, v]) => `${k}: ${v}`).join(' · ');
    const answer = `${dest} Approach, ${callsign}, position ${fix}, flight level ${spellDigits(fl)}, estimating ${dest} at ${spellDigits(pad2(hh) + pad2(mm))}.`;
    return [{ context: sitText, question: 'Formuleer je positierapport.', answer }];
  }
  function genEmergencySteps() {
    const callsign = pick(['KLM123', 'TRA456', 'EZY789']);
    const problem = pick(['Engine failure', 'Fuel emergency', 'Hydraulic failure', 'Smoke in cockpit']);
    const alt = pick([2000, 3000, 4000, 5000]); const dist = randInt(5, 20); const dir = pick(['north', 'south', 'east', 'west']);
    const airport = pick(['EHAM', 'EGLL', 'EDDF', 'LFPG']); const souls = randInt(2, 8); const fuelHrs = pick([1, 1.5, 2, 2.5]);
    const structure = 'Mayday Mayday Mayday / [callsign] / [situatie] / [positie] / [bedoelingen] / [souls on board] / [brandstof]';
    const situation = `${problem}, ${alt} voet, ${dist} nm van de baan.`;
    const answer = `Mayday Mayday Mayday, ${callsign}, ${problem.toLowerCase()}, ${dist} miles ${dir} of ${airport}, ${alt} feet, requesting immediate return, ${souls} souls on board, ${String(fuelHrs).replace('.', ',')} hours fuel.`;
    return [{ context: `Structuur: ${structure}\n\n${situation}`, question: 'Formuleer je noodbericht.', answer }];
  }
  const ENGELS_STEP_GENERATORS = {
    'atc-clearance-begrijpen': genAtcClearanceSteps,
    'correcte-readback': genReadbackSteps,
    'fout-in-readback-detecteren': genErrorDetectionSteps,
    'icao-alfabet': genIcaoSteps,
    'positierapport-formuleren': genPositionReportSteps,
    'noodcommunicatie-formuleren': genEmergencySteps,
  };

  // ---------- Spel 7: 3D vlucht-coördinatie arcade (Three.js) ----------
  function play3DFlightArcade(el, cfg, finish) {
    el.innerHTML = `
      <style>
        .fl3d-wrap{position:relative;width:100%;height:560px;background:#000;overflow:hidden;font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;outline:none;border-radius:14px}
        .fl3d-mount{position:absolute;inset:0;transition:transform .05s linear}
        .fl3d-hudCanvas{position:absolute;inset:0;pointer-events:none}
        .fl3d-hud{position:absolute;color:#e6ecec}
        .fl3d-panel{background:rgba(8,10,10,.62);border:1px solid rgba(160,180,180,.22);border-radius:4px;padding:7px 13px}
        .fl3d-label{font-size:9.5px;letter-spacing:1.5px;color:#8a9a9a}
        .fl3d-value{font-size:19px;font-weight:600}
        .fl3d-topLeft{top:14px;left:14px}
        .fl3d-topRight{top:14px;right:14px;text-align:right}
        .fl3d-stats{bottom:12px;left:14px;right:14px;font-size:10.5px;color:#7a8a8a;display:flex;gap:16px;flex-wrap:wrap;z-index:5}
        .fl3d-stats b{color:#bcd0d0}
        .fl3d-hearts{display:flex;gap:6px;margin-top:4px}
        .fl3d-comboWrap{position:absolute;top:66px;left:50%;transform:translateX(-50%);text-align:center}
        .fl3d-combo{font-size:22px;font-weight:700;color:#ffcc4d;text-shadow:0 0 8px rgba(255,204,77,.5);opacity:0;transition:opacity .15s,transform .15s;transform:scale(.85)}
        .fl3d-combo.fl3d-show{opacity:1;transform:scale(1)}
        .fl3d-levelBanner{position:absolute;top:36%;left:50%;transform:translate(-50%,-50%) scale(.7);font-size:38px;font-weight:700;letter-spacing:3px;color:#a8d8ff;text-shadow:0 0 14px rgba(168,216,255,.6);opacity:0;pointer-events:none;transition:opacity .3s,transform .3s}
        .fl3d-levelBanner.fl3d-show{opacity:1;transform:translate(-50%,-50%) scale(1)}
        .fl3d-flash{position:absolute;inset:0;background:rgba(220,60,50,0);pointer-events:none;transition:background .08s}
        .fl3d-bezel-vignette{position:absolute;inset:0;pointer-events:none;z-index:4;box-shadow:inset 0 0 90px 30px rgba(0,0,0,.65);border-radius:6px}
        .fl3d-glareshield{position:absolute;left:0;right:0;bottom:0;height:9%;min-height:34px;background:linear-gradient(180deg,#12161a,#05070a);border-top:2px solid #262e33;z-index:5;pointer-events:none}
        .fl3d-glareshield .fl3d-rivet{position:absolute;top:6px;width:5px;height:5px;border-radius:50%;background:#3a4550}
        .fl3d-overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:radial-gradient(ellipse at center,rgba(8,14,16,.94),rgba(2,4,6,.99));text-align:center;color:#e6ecec;overflow-y:auto;padding:20px 0;z-index:10}
        .fl3d-overlay.fl3d-show{display:flex}
        .fl3d-overlay h1{font-size:26px;letter-spacing:3px;color:#a8d8ff;text-shadow:0 0 14px rgba(168,216,255,.5);margin:0}
        .fl3d-overlay .fl3d-sub{font-size:13px;color:#8fa5a5;max-width:460px;line-height:1.6}
        .fl3d-btn{font-family:inherit;font-size:15px;letter-spacing:1px;color:#04120a;font-weight:700;background:linear-gradient(180deg,#6dd88a,#2a9d5c);border:none;padding:13px 30px;border-radius:6px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.4)}
        .fl3d-btn:hover{filter:brightness(1.08)}
        .fl3d-btn-ghost{font-family:inherit;font-size:13px;color:#8fa5a5;background:transparent;border:1px solid rgba(160,180,180,.3);padding:11px 22px;border-radius:6px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
        .fl3d-btn-ghost:hover{color:#e6ecec;border-color:rgba(160,180,180,.6)}
        .fl3d-score-final{font-size:44px;font-weight:700;color:#6dd88a}
        .fl3d-score-table{display:grid;grid-template-columns:auto auto;gap:4px 20px;font-size:13px;color:#9fb0b0;text-align:left}
        .fl3d-score-table b{color:#e6ecec}
        .fl3d-highscore{font-size:12px;color:#ffcc4d;letter-spacing:1px}
        .fl3d-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
      </style>
      <div class="fl3d-wrap" id="fl3d-wrap" tabindex="0">
        <div class="fl3d-mount" id="fl3d-mount"></div>
        <canvas class="fl3d-hudCanvas" id="fl3d-hudCanvas"></canvas>
        <div class="fl3d-bezel-vignette"></div>
        <div class="fl3d-glareshield" id="fl3d-glareshield"></div>
        <div class="fl3d-flash" id="fl3d-flash"></div>

        <div class="fl3d-hud fl3d-panel fl3d-topLeft">
          <div class="fl3d-label">SCORE</div>
          <div class="fl3d-value" id="fl3d-scoreOut" style="color:#5dffb0">0</div>
          <div class="fl3d-label" style="margin-top:6px">LEVENS</div>
          <div class="fl3d-hearts" id="fl3d-hearts"></div>
        </div>
        <div class="fl3d-hud fl3d-panel fl3d-topRight">
          <div class="fl3d-label">LEVEL</div>
          <div class="fl3d-value" id="fl3d-levelOut" style="color:#4dd8ff">1</div>
          <div class="fl3d-label" style="margin-top:6px">RING</div>
          <div class="fl3d-value" id="fl3d-ringOut" style="font-size:15px;color:#cfe8dd">0</div>
        </div>
        <div class="fl3d-comboWrap"><div class="fl3d-combo" id="fl3d-combo">COMBO x1</div></div>
        <div class="fl3d-levelBanner" id="fl3d-levelBanner">LEVEL 2</div>
        <div id="fl3d-reactionDot" style="position:absolute;width:24px;height:24px;border-radius:50%;background:#101c14;border:1px solid #3a4a4a;top:96px;left:50%;transform:translateX(-50%)"></div>

        <div class="fl3d-hud fl3d-stats" id="fl3d-stats">
          <div>RAAK % <b id="fl3d-statHit">—</b></div>
          <div>GEM. RICHTFOUT <b id="fl3d-statErr">—</b></div>
          <div>MISSERS <b id="fl3d-statMiss">0</b></div>
          <div style="margin-left:auto">HIGHSCORE <b id="fl3d-statHigh" style="color:#ffd23d">0</b></div>
        </div>

        <div class="fl3d-overlay fl3d-show" id="fl3d-startOverlay">
          <h1>3D FLIGHT COORDINATION</h1>
          <div class="fl3d-sub">
            <b style="color:#e6f5ee">Hand</b> (muis): pitch (omhoog/omlaag) en roll (bank links/rechts).<br>
            <b style="color:#e6f5ee">Voet</b> (A/D): yaw — je neus links/rechts draaien.<br>
            <b style="color:#e6f5ee">Oog</b>: druk <b>spatie</b> zo snel mogelijk als het amberkleurige signaal bovenin oplicht.<br>
            Stuur door elke ring — de vereiste richting verandert terwijl hij dichterbij komt. 3 levens, elke 6 ringen wordt het lastiger.
          </div>
          <button class="fl3d-btn" id="fl3d-startBtn">START VLUCHT</button>
          <div class="fl3d-highscore" id="fl3d-startHighscore">HIGHSCORE: 0</div>
        </div>

        <div class="fl3d-overlay" id="fl3d-endOverlay">
          <h1>GAME OVER</h1>
          <div class="fl3d-score-final" id="fl3d-finalScore">0</div>
          <div class="fl3d-score-table" id="fl3d-scoreTable"></div>
          <canvas id="fl3d-devChart" width="480" height="150" style="margin-top:4px"></canvas>
          <div class="fl3d-actions">
            <button class="fl3d-btn" id="fl3d-restartBtn">NOG EEN KEER</button>
            <a class="fl3d-btn-ghost" href="#oefenmateriaal/c/coordinatie">Terug naar categorie</a>
          </div>
        </div>
      </div>`;

    const wrap = qs('#fl3d-wrap', el);
    const mount = qs('#fl3d-mount', el);
    const hudCanvas = qs('#fl3d-hudCanvas', el);
    const hctx = hudCanvas.getContext('2d');
    const flashEl = qs('#fl3d-flash', el);
    const scoreOut = qs('#fl3d-scoreOut', el);
    const levelOut = qs('#fl3d-levelOut', el);
    const ringOut = qs('#fl3d-ringOut', el);
    const heartsEl = qs('#fl3d-hearts', el);
    const comboEl = qs('#fl3d-combo', el);
    const levelBanner = qs('#fl3d-levelBanner', el);
    const reactionDot = qs('#fl3d-reactionDot', el);
    const statHit = qs('#fl3d-statHit', el);
    const statErr = qs('#fl3d-statErr', el);
    const statMiss = qs('#fl3d-statMiss', el);
    const statHigh = qs('#fl3d-statHigh', el);
    const startOverlay = qs('#fl3d-startOverlay', el);
    const startHighscore = qs('#fl3d-startHighscore', el);
    const endOverlay = qs('#fl3d-endOverlay', el);
    const finalScoreEl = qs('#fl3d-finalScore', el);
    const scoreTable = qs('#fl3d-scoreTable', el);
    const startBtn = qs('#fl3d-startBtn', el);
    const restartBtn = qs('#fl3d-restartBtn', el);
    const glareshield = qs('#fl3d-glareshield', el);

    const W = () => wrap.clientWidth, H = () => wrap.clientHeight;

    for (let i = 0; i < 14; i++) {
      const r = document.createElement('div');
      r.className = 'fl3d-rivet';
      r.style.left = (2 + i * (96 / 13)) + '%';
      glareshield.appendChild(r);
    }

    function fitHudCanvas() {
      const dpr = window.devicePixelRatio || 1;
      hudCanvas.width = W() * dpr; hudCanvas.height = H() * dpr;
      hudCanvas.style.width = W() + 'px'; hudCanvas.style.height = H() + 'px';
      hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fitHudCanvas();

    const HIGH_KEY = 'hop_flight3d_highscore';
    let highscore = parseInt(localStorage.getItem(HIGH_KEY) || '0', 10);
    statHigh.textContent = highscore;
    startHighscore.textContent = 'HIGHSCORE: ' + highscore;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x05080a, 25, 95);
    const camera = new THREE.PerspectiveCamera(72, W() / H(), 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(W(), H());
    renderer.setClearColor(0x05080a);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x4d6b58, 1.1));
    const dl = new THREE.DirectionalLight(0xbfe8c8, 0.9);
    dl.position.set(5, 8, 4);
    scene.add(dl);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 160;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 160;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x9fc9ff, size: 0.35, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));

    const gridMat = new THREE.LineBasicMaterial({ color: 0x1d3526 });
    for (let g = -40; g <= -5; g += 5) {
      const pts = [];
      for (let a = 0; a <= 32; a++) {
        const ang = (a / 32) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(ang) * 14, Math.sin(ang) * 14 - 6, g));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    function clamp2(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
    function std(arr) { if (arr.length < 2) return 0; const m = mean(arr); return Math.sqrt(arr.reduce((a, b) => a + (b - m) * (b - m), 0) / arr.length); }

    function levelParams(lvl) {
      return {
        speed: 15 + lvl * 1.1,
        spawnInt: Math.max(1.0, 2.25 - lvl * 0.11),
        tolDeg: Math.max(6, 17 - lvl * 1.0),
        glitchChance: Math.min(0.3, lvl * 0.025),
      };
    }

    let gates = [];
    let passed = 0, missed = 0, lives = 3, score = 0, streak = 0, level = 1;
    const totalErrs = [], horizErrs = [], vertErrs = [], resultsSeq = [], tolerances = [];
    let levelErrs = {};
    let oscillations = 0, prevHSign = 0, elapsedPlayTime = 0;
    let spawnTimer = 0;
    let running = false;
    const clock = new THREE.Clock();
    let shakeUntil = 0;
    let rafId = null;

    function spawnGate() {
      const ox = (Math.random() * 2 - 1) * 3.5;
      const oy = (Math.random() * 2 - 1) * 3.0;
      const geo = new THREE.TorusGeometry(2.6, 0.28, 12, 28);
      const mat = new THREE.MeshStandardMaterial({ color: 0x4dd8ff, emissive: 0x0c2430, roughness: 0.5 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ox, oy, -80);
      scene.add(mesh);
      gates.push({ mesh, ox, oy, resolved: false, tolDeg: levelParams(level).tolDeg, speed: levelParams(level).speed });
    }

    let yaw = 0, pitch = 0, roll = 0;
    let mouseRelX = 0, mouseRelY = 0;
    const keys = {};
    function onKeyDown(e) { keys[e.key.toLowerCase()] = true; if (e.key === ' ') { e.preventDefault(); handleSpace(); } }
    function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }
    function onMouseMove(e) {
      const r = wrap.getBoundingClientRect();
      mouseRelX = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseRelY = ((e.clientY - r.top) / r.height) * 2 - 1;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    wrap.addEventListener('mousemove', onMouseMove);

    let reactionActive = false, reactionAt = 0, nextReaction = 3;
    let reactionHits = 0, reactionMisses = 0;
    const reactionRTs = [];
    function handleSpace() {
      if (!running || !reactionActive) return;
      reactionHits++;
      reactionRTs.push(clock.getElapsedTime() - reactionAt);
      reactionActive = false;
      reactionDot.style.background = '#101c14';
      nextReaction = clock.getElapsedTime() + 2.4 + Math.random() * 2.4;
    }

    function playBeep(freq, dur, type, gain) {
      try {
        const actx = playBeep.ctx || (playBeep.ctx = new (window.AudioContext || window.webkitAudioContext)());
        const osc = actx.createOscillator();
        const g = actx.createGain();
        osc.type = type; osc.frequency.value = freq;
        g.gain.value = gain;
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
        osc.connect(g); g.connect(actx.destination);
        osc.start(); osc.stop(actx.currentTime + dur);
      } catch (e) { /* noop */ }
    }

    const qYaw = new THREE.Quaternion(), qPitch = new THREE.Quaternion(), qRoll = new THREE.Quaternion();
    const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
    const dirVec = new THREE.Vector3(), targetVec = new THREE.Vector3(), localVec = new THREE.Vector3();

    function localAngles(worldTarget) {
      const qc = camera.quaternion;
      const qInv = new THREE.Quaternion(-qc.x, -qc.y, -qc.z, qc.w);
      localVec.copy(worldTarget).applyQuaternion(qInv);
      const h = Math.atan2(localVec.x, -localVec.z);
      const v = Math.atan2(localVec.y, -localVec.z);
      return { h, v };
    }

    function showCombo(mult) {
      comboEl.textContent = 'COMBO x' + mult.toFixed(1);
      comboEl.classList.add('fl3d-show');
      clearTimeout(showCombo._t);
      showCombo._t = setTimeout(() => comboEl.classList.remove('fl3d-show'), 900);
    }
    function showLevelBanner(lvl) {
      levelBanner.textContent = 'LEVEL ' + lvl;
      levelBanner.classList.add('fl3d-show');
      setTimeout(() => levelBanner.classList.remove('fl3d-show'), 1400);
    }
    function renderHearts() {
      heartsEl.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const s = document.createElement('span');
        s.textContent = i < lives ? '♥' : '♡';
        s.style.color = i < lives ? '#ff4d5e' : '#3a2a2c';
        s.style.fontSize = '16px';
        heartsEl.appendChild(s);
      }
    }

    function drawHUD(pitchRad, rollRad, yawRad) {
      const w = W(), h = H();
      hctx.clearRect(0, 0, w, h);
      const pitchDeg = pitchRad * 180 / Math.PI;
      const cx = w / 2, cy = h / 2;

      hctx.strokeStyle = '#111'; hctx.lineWidth = 3;
      hctx.beginPath(); hctx.moveTo(cx - 16, cy); hctx.lineTo(cx + 16, cy); hctx.moveTo(cx, cy - 16); hctx.lineTo(cx, cy + 16); hctx.stroke();
      hctx.strokeStyle = '#6dd88a'; hctx.lineWidth = 1.6;
      hctx.beginPath(); hctx.moveTo(cx - 16, cy); hctx.lineTo(cx - 5, cy); hctx.moveTo(cx + 5, cy); hctx.lineTo(cx + 16, cy);
      hctx.moveTo(cx, cy - 16); hctx.lineTo(cx, cy - 5); hctx.moveTo(cx, cy + 5); hctx.lineTo(cx, cy + 16); hctx.stroke();

      const adiR = 68;
      const adiX = cx, adiY = h - 140;
      hctx.save();
      hctx.beginPath(); hctx.arc(adiX, adiY, adiR, 0, Math.PI * 2); hctx.clip();

      hctx.translate(adiX, adiY);
      hctx.rotate(-rollRad);
      const pxPerDeg = adiR / 45;
      const horizonY = pitchDeg * pxPerDeg;
      const big = adiR * 2.4;

      const skyGrad = hctx.createLinearGradient(0, horizonY - big, 0, horizonY);
      skyGrad.addColorStop(0, '#0d2a4a'); skyGrad.addColorStop(1, '#3f7bab');
      hctx.fillStyle = skyGrad;
      hctx.fillRect(-big, horizonY - big, big * 2, big);

      const groundGrad = hctx.createLinearGradient(0, horizonY, 0, horizonY + big);
      groundGrad.addColorStop(0, '#5a4326'); groundGrad.addColorStop(1, '#241a10');
      hctx.fillStyle = groundGrad;
      hctx.fillRect(-big, horizonY, big * 2, big);

      hctx.strokeStyle = '#eef3f3'; hctx.lineWidth = 2;
      hctx.beginPath(); hctx.moveTo(-big, horizonY); hctx.lineTo(big, horizonY); hctx.stroke();

      hctx.font = '9px ui-monospace, monospace';
      hctx.textAlign = 'center';
      for (let d = -40; d <= 40; d += 10) {
        if (d === 0) continue;
        const y = horizonY - d * pxPerDeg;
        const lineW = d % 20 === 0 ? 26 : 14;
        hctx.strokeStyle = 'rgba(238,243,243,0.85)'; hctx.lineWidth = 1.3;
        hctx.setLineDash(d < 0 ? [4, 3] : []);
        hctx.beginPath(); hctx.moveTo(-lineW / 2, y); hctx.lineTo(lineW / 2, y); hctx.stroke();
        hctx.setLineDash([]);
      }
      hctx.restore();

      hctx.strokeStyle = 'rgba(238,243,243,0.5)'; hctx.lineWidth = 1;
      hctx.beginPath(); hctx.arc(adiX, adiY, adiR, 0, Math.PI * 2); hctx.stroke();
      for (const a of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
        const rad = (a - 90) * Math.PI / 180;
        const rr1 = adiR, rr2 = adiR - (a === 0 ? 9 : 5);
        hctx.beginPath();
        hctx.moveTo(adiX + Math.cos(rad) * rr1, adiY + Math.sin(rad) * rr1);
        hctx.lineTo(adiX + Math.cos(rad) * rr2, adiY + Math.sin(rad) * rr2);
        hctx.stroke();
      }
      const rollDeg = -rollRad * 180 / Math.PI;
      const pr = (rollDeg - 90) * Math.PI / 180;
      hctx.fillStyle = '#ffcc4d';
      hctx.beginPath();
      hctx.moveTo(adiX + Math.cos(pr) * (adiR + 2), adiY + Math.sin(pr) * (adiR + 2));
      hctx.lineTo(adiX + Math.cos(pr - 0.05) * (adiR + 10), adiY + Math.sin(pr - 0.05) * (adiR + 10));
      hctx.lineTo(adiX + Math.cos(pr + 0.05) * (adiR + 10), adiY + Math.sin(pr + 0.05) * (adiR + 10));
      hctx.closePath(); hctx.fill();
      hctx.strokeStyle = '#1a1e22'; hctx.lineWidth = 3;
      hctx.beginPath(); hctx.moveTo(adiX - 20, adiY); hctx.lineTo(adiX - 6, adiY); hctx.lineTo(adiX, adiY + 5); hctx.lineTo(adiX + 6, adiY); hctx.lineTo(adiX + 20, adiY); hctx.stroke();
      hctx.strokeStyle = '#ffcc4d'; hctx.lineWidth = 1.6;
      hctx.beginPath(); hctx.moveTo(adiX - 20, adiY); hctx.lineTo(adiX - 6, adiY); hctx.lineTo(adiX, adiY + 5); hctx.lineTo(adiX + 6, adiY); hctx.lineTo(adiX + 20, adiY); hctx.stroke();

      let headingDeg = ((-yawRad * 180 / Math.PI) % 360 + 360) % 360;
      const tapeY = 12, tapeH = 26, tapeW = Math.min(w * 0.5, 320);
      const tx0 = cx - tapeW / 2;
      hctx.fillStyle = 'rgba(6,9,10,0.72)';
      hctx.fillRect(tx0, tapeY, tapeW, tapeH);
      hctx.save();
      hctx.beginPath(); hctx.rect(tx0, tapeY, tapeW, tapeH); hctx.clip();
      const pxPerDegH = tapeW / 90;
      hctx.font = '11px ui-monospace, monospace';
      hctx.strokeStyle = 'rgba(230,240,240,0.6)'; hctx.fillStyle = '#e6ecec';
      const compass = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
      for (let d = -50; d <= 50; d += 5) {
        const x = cx + d * pxPerDegH;
        if (x < tx0 - 10 || x > tx0 + tapeW + 10) continue;
        const hd = ((Math.round(headingDeg) + d) % 360 + 360) % 360;
        const isMajor = hd % 30 === 0;
        hctx.lineWidth = isMajor ? 1.5 : 1;
        hctx.beginPath(); hctx.moveTo(x, tapeY + tapeH); hctx.lineTo(x, tapeY + tapeH - (isMajor ? 10 : 5)); hctx.stroke();
        if (isMajor) {
          hctx.textAlign = 'center';
          hctx.fillText(compass[hd] !== undefined ? compass[hd] : hd, x, tapeY + 12);
        }
      }
      hctx.restore();
      hctx.strokeStyle = '#ffcc4d'; hctx.lineWidth = 2;
      hctx.beginPath(); hctx.moveTo(cx, tapeY - 2); hctx.lineTo(cx - 5, tapeY + 5); hctx.lineTo(cx + 5, tapeY + 5); hctx.closePath(); hctx.stroke();
      hctx.fillStyle = 'rgba(6,9,10,0.9)';
      hctx.fillRect(cx - 20, tapeY + tapeH + 2, 40, 16);
      hctx.fillStyle = '#ffcc4d'; hctx.font = 'bold 12px ui-monospace, monospace'; hctx.textAlign = 'center';
      hctx.fillText(String(Math.round(headingDeg)).padStart(3, '0'), cx, tapeY + tapeH + 13);
      hctx.textAlign = 'left';
    }

    function drawDeviationChart() {
      const canvas = qs('#fl3d-devChart', el);
      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.clientWidth || 480, ch = 150;
      canvas.width = cw * dpr; canvas.height = ch * dpr;
      canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
      const dctx = canvas.getContext('2d');
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dctx.clearRect(0, 0, cw, ch);

      const n = totalErrs.length;
      if (n < 2) {
        dctx.fillStyle = '#5c7a6d';
        dctx.font = '12px ui-monospace, monospace';
        dctx.fillText('nog te weinig ringen voor een grafiek', 10, ch / 2);
        return;
      }
      const padL = 30, padR = 10, padT = 10, padB = 18;
      const plotW = cw - padL - padR, plotH = ch - padT - padB;
      const maxDeg = Math.max(20, ...totalErrs, ...tolerances);
      const xAt = (i) => padL + (n === 1 ? 0 : (i / (n - 1)) * plotW);
      const yAt = (v) => padT + plotH - (v / maxDeg) * plotH;

      dctx.strokeStyle = 'rgba(77,216,255,0.35)';
      dctx.setLineDash([3, 3]);
      dctx.beginPath();
      tolerances.forEach((tv, i) => { const x = xAt(i), y = yAt(tv); i === 0 ? dctx.moveTo(x, y) : dctx.lineTo(x, y); });
      dctx.stroke();
      dctx.setLineDash([]);

      dctx.strokeStyle = 'rgba(207,232,221,0.35)';
      dctx.lineWidth = 1.3;
      dctx.beginPath();
      totalErrs.forEach((v, i) => { const x = xAt(i), y = yAt(v); i === 0 ? dctx.moveTo(x, y) : dctx.lineTo(x, y); });
      dctx.stroke();

      totalErrs.forEach((v, i) => {
        const x = xAt(i), y = yAt(v);
        dctx.fillStyle = resultsSeq[i] ? '#5dffb0' : '#ff4d5e';
        dctx.beginPath(); dctx.arc(x, y, 3.2, 0, Math.PI * 2); dctx.fill();
      });

      dctx.fillStyle = '#5c7a6d';
      dctx.font = '10px ui-monospace, monospace';
      dctx.textAlign = 'left';
      dctx.fillText('0°', 2, ch - padB + 4);
      dctx.fillText(Math.round(maxDeg) + '°', 2, padT + 8);
      dctx.fillText('ring 1', padL, ch - 4);
      dctx.textAlign = 'right';
      dctx.fillText('ring ' + n, cw - padR, ch - 4);
      dctx.textAlign = 'left';
    }

    function endRound() {
      running = false;
      const total = passed + missed;
      const hitPct = total ? Math.round((passed / total) * 100) : 0;
      const avgErr = mean(totalErrs);
      const errStd = std(totalErrs);
      const hBias = mean(horizErrs) * 180 / Math.PI;
      const vBias = mean(vertErrs) * 180 / Math.PI;
      const hLabel = Math.abs(hBias) < 1.2 ? 'geen duidelijke bias' : (hBias > 0 ? hBias.toFixed(1) + '° naar rechts' : Math.abs(hBias).toFixed(1) + '° naar links');
      const vLabel = Math.abs(vBias) < 1.2 ? 'geen duidelijke bias' : (vBias > 0 ? vBias.toFixed(1) + '° te hoog' : Math.abs(vBias).toFixed(1) + '° te laag');
      const oscPerMin = elapsedPlayTime > 0 ? (oscillations / (elapsedPlayTime / 60)).toFixed(1) : '0';

      const levelKeys = Object.keys(levelErrs).map(Number).sort((a, b) => a - b);
      let ceilingLevel = null;
      for (const lvl of levelKeys) { if (levelErrs[lvl].length >= 2 && mean(levelErrs[lvl]) > 13) { ceilingLevel = lvl; break; } }
      const ceilingLabel = ceilingLevel ? 'level ' + ceilingLevel : (levelKeys.length ? 'nog niet bereikt' : '—');

      let trendLabel = 'onvoldoende data';
      if (totalErrs.length >= 6) {
        const half = Math.floor(totalErrs.length / 2);
        const earlyHit = resultsSeq.slice(0, half).filter(Boolean).length / half * 100;
        const lateHit = resultsSeq.slice(half).filter(Boolean).length / (resultsSeq.length - half) * 100;
        const diff = Math.round(earlyHit - lateHit);
        trendLabel = diff > 8 ? 'werd slechter (' + Math.round(earlyHit) + '% → ' + Math.round(lateHit) + '%)'
          : diff < -8 ? 'werd beter (' + Math.round(earlyHit) + '% → ' + Math.round(lateHit) + '%)'
          : 'stabiel (' + Math.round(earlyHit) + '% → ' + Math.round(lateHit) + '%)';
      }

      const reactTotal = reactionHits + reactionMisses;
      const reactHitPct = reactTotal ? Math.round((reactionHits / reactTotal) * 100) : 0;
      const avgRT = reactionRTs.length ? Math.round(mean(reactionRTs) * 1000) : 0;

      if (score > highscore) { highscore = score; localStorage.setItem(HIGH_KEY, String(highscore)); }
      statHigh.textContent = highscore;

      finalScoreEl.textContent = score;
      scoreTable.innerHTML =
        '<span>Level bereikt</span><b>' + level + '</b>' +
        '<span>Ringen geraakt</span><b>' + passed + ' / ' + total + ' (' + hitPct + '%)</b>' +
        '<span>Gem. richtfout</span><b>' + avgErr.toFixed(1) + '°</b>' +
        '<span>Spreiding (consistentie)</span><b>±' + errStd.toFixed(1) + '°</b>' +
        '<span>Horizontale bias (hand+voet)</span><b>' + hLabel + '</b>' +
        '<span>Verticale bias (hand)</span><b>' + vLabel + '</b>' +
        '<span>Overcorrecties</span><b>' + oscPerMin + ' / min</b>' +
        '<span>Moeilijkheidsplafond</span><b>' + ceilingLabel + '</b>' +
        '<span>Trend binnen sessie</span><b>' + trendLabel + '</b>' +
        '<span>Reactie (oog) — raak</span><b>' + reactHitPct + '% (' + reactionHits + '/' + reactTotal + ')</b>' +
        '<span>Reactie (oog) — gem. tijd</span><b>' + (avgRT || '—') + (avgRT ? ' ms' : '') + '</b>' +
        '<span>Missers</span><b>' + missed + '</b>' +
        '<span>Highscore</span><b>' + highscore + '</b>';
      endOverlay.classList.add('fl3d-show');
      drawDeviationChart();

      const platformScore = Math.round(Math.min(100, hitPct * 0.75 + Math.min(25, (level - 1) * 4)));
      HopApi.saveExerciseScore({ candidate_id: session.user_id, category_id: 'coordinatie', type_id: '3d-vlucht-arcade', score: platformScore, scale_type: 'percentage' }).catch((e) => console.warn(e));
    }

    function start() {
      gates.forEach((g) => { scene.remove(g.mesh); g.mesh.geometry.dispose(); g.mesh.material.dispose(); });
      gates = []; passed = 0; missed = 0; lives = 3; score = 0; streak = 0; level = 1;
      totalErrs.length = 0; horizErrs.length = 0; vertErrs.length = 0; resultsSeq.length = 0; tolerances.length = 0;
      levelErrs = {}; oscillations = 0; prevHSign = 0; elapsedPlayTime = 0;
      yaw = 0; pitch = 0; roll = 0; spawnTimer = 0;
      reactionActive = false; reactionHits = 0; reactionMisses = 0; reactionRTs.length = 0;
      reactionDot.style.background = '#101c14';
      startOverlay.classList.remove('fl3d-show');
      endOverlay.classList.remove('fl3d-show');
      renderHearts();
      scoreOut.textContent = 0; levelOut.textContent = 1; ringOut.textContent = 0;
      statHit.textContent = '—'; statErr.textContent = '—'; statMiss.textContent = 0;
      wrap.focus();
      clock.start();
      nextReaction = 3;
      running = true;
      rafId = requestAnimationFrame(animate);
    }

    function animate() {
      if (!running) { renderer.render(scene, camera); drawHUD(pitch, roll, yaw); return; }
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, clock.getDelta());
      const t = clock.getElapsedTime();
      elapsedPlayTime = t;

      const p = levelParams(level);
      let yawDir = 0;
      if (keys['a'] || keys['arrowleft']) { yaw += 1.8 * dt; yawDir = 1; }
      if (keys['d'] || keys['arrowright']) { yaw -= 1.8 * dt; yawDir = -1; }
      const pitchTarget = -mouseRelY * 0.55;
      const rollTarget = yawDir * 0.35;
      pitch += (pitchTarget - pitch) * Math.min(1, dt * 6);
      roll += (rollTarget - roll) * Math.min(1, dt * 4);
      if (Math.random() < p.glitchChance * dt) yaw += (Math.random() - 0.5) * 0.25;

      qYaw.setFromAxisAngle(AY, yaw);
      qPitch.setFromAxisAngle(AX, pitch);
      qRoll.setFromAxisAngle(AZ, roll);
      camera.quaternion.copy(qYaw).multiply(qPitch);
      camera.updateMatrixWorld(true);
      camera.getWorldDirection(dirVec);

      if (t >= spawnTimer) { spawnGate(); spawnTimer = t + p.spawnInt; }

      const nearest = gates.filter((g) => !g.resolved).sort((a, b) => b.mesh.position.z - a.mesh.position.z)[0];
      if (nearest) {
        targetVec.set(nearest.ox, nearest.oy, nearest.mesh.position.z).normalize();
        const ang = localAngles(targetVec);
        const hDeg = ang.h * 180 / Math.PI;
        if (Math.abs(hDeg) > 1.5) {
          const s = Math.sign(hDeg);
          if (prevHSign !== 0 && s !== prevHSign) oscillations++;
          prevHSign = s;
        }
      }

      gates.forEach((g) => {
        if (!running) return;
        g.mesh.position.z += g.speed * dt;
        if (!g.resolved && g.mesh.position.z > -7) {
          g.resolved = true;
          targetVec.set(g.ox, g.oy, g.mesh.position.z).normalize();
          const ang = localAngles(targetVec);
          const errDeg = Math.hypot(ang.h, ang.v) * 180 / Math.PI;
          totalErrs.push(errDeg); horizErrs.push(ang.h); vertErrs.push(ang.v); tolerances.push(g.tolDeg);
          (levelErrs[level] = levelErrs[level] || []).push(errDeg);

          if (errDeg <= g.tolDeg) {
            resultsSeq.push(true);
            passed++; streak++;
            const precision = 1 - clamp2(errDeg / g.tolDeg, 0, 1);
            const mult = Math.min(4, 1 + Math.floor(streak / 3) * 0.5);
            const pts = Math.round(100 * mult + precision * 50);
            score += pts;
            if (streak >= 3) showCombo(mult);
            playBeep(660 + precision * 220, 0.12, 'sine', 0.05);
            g.mesh.material.color.set(0x639922); g.mesh.material.emissive.set(0x1a3a08);
          } else {
            resultsSeq.push(false);
            missed++; lives--; streak = 0;
            flashEl.style.background = 'rgba(255,60,70,0.35)';
            setTimeout(() => { flashEl.style.background = 'rgba(255,60,70,0)'; }, 90);
            shakeUntil = t + 0.3;
            playBeep(140, 0.25, 'sawtooth', 0.06);
            renderHearts();
            g.mesh.material.color.set(0xd85a30); g.mesh.material.emissive.set(0x3a1206);
          }

          const total = passed + missed;
          const newLevel = Math.floor(total / 6) + 1;
          if (newLevel !== level) { level = newLevel; showLevelBanner(level); }
          scoreOut.textContent = score; levelOut.textContent = level; ringOut.textContent = total;
          statHit.textContent = total ? Math.round((passed / total) * 100) + '%' : '—';
          statErr.textContent = totalErrs.length ? (mean(totalErrs)).toFixed(1) + '°' : '—';
          statMiss.textContent = missed;

          if (lives <= 0) { endRound(); return; }
        }
      });
      gates = gates.filter((g) => {
        if (g.mesh.position.z > 6) { scene.remove(g.mesh); g.mesh.geometry.dispose(); g.mesh.material.dispose(); return false; }
        return true;
      });

      if (!reactionActive && t >= nextReaction && passed + missed >= 1) { reactionActive = true; reactionAt = t; reactionDot.style.background = '#ffb020'; }
      if (reactionActive && t - reactionAt > 2.0) { reactionActive = false; reactionMisses++; reactionDot.style.background = '#101c14'; nextReaction = t + 2.4 + Math.random() * 2.4; }

      if (t < shakeUntil) mount.style.transform = 'translate(' + ((Math.random() - 0.5) * 8) + 'px,' + ((Math.random() - 0.5) * 8) + 'px)';
      else mount.style.transform = 'translate(0,0)';

      drawHUD(pitch, roll, yaw);
      renderer.render(scene, camera);
    }

    function onResize() {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
      fitHudCanvas();
    }
    window.addEventListener('resize', onResize);

    function cleanup() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      if (playBeep.ctx) { try { playBeep.ctx.close(); } catch (e) { /* noop */ } }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose()); else obj.material.dispose(); }
      });
      renderer.dispose();
    }
    window._oefGameCleanup = cleanup;

    startBtn.addEventListener('click', start);
    restartBtn.addEventListener('click', start);
    renderHearts();
    renderer.render(scene, camera);
    drawHUD(pitch, roll, yaw);
  }

  const INTERACTIVE_EXERCISES = {
    coordinatie: {
      'enkelvoudige-tracking': playTrackingSingle,
      'dubbele-tracking': playTrackingDouble,
      'reactiesnelheid-enkelvoudig': playReactionSimple,
      'keuze-reactietaak': playChoiceReaction,
      'go-no-go': playGoNoGo,
      'dual-task-tracking-rekenen': playDualTask,
      '3d-vlucht-arcade': play3DFlightArcade,
    },
    'engels-communicatie': {
      'atc-clearance-begrijpen': playScenarioSteps,
      'correcte-readback': playScenarioSteps,
      'fout-in-readback-detecteren': playScenarioSteps,
      'icao-alfabet': playScenarioSteps,
      'positierapport-formuleren': playScenarioSteps,
      'noodcommunicatie-formuleren': playScenarioSteps,
    },
  };
})();
