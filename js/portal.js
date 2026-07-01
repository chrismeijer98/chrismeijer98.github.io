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
  const TABS = ['dashboard', 'agenda', 'lab', 'ontwikkeling', 'oefenmateriaal'];
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
    const tab = currentTab();
    qsa('.side-link').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'agenda') renderAgenda();
    else if (tab === 'lab') renderLab();
    else if (tab === 'ontwikkeling') renderOntwikkeling();
    else if (tab === 'oefenmateriaal') renderOefenmateriaal();
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

        <button class="sect-card soon" disabled>
          <div class="sect-ico" style="background:rgba(30,74,122,.1);color:var(--navy)">${ICONS.fileText}</div>
          <div class="sect-t">Oefenmateriaal</div>
          <div class="sect-d">Oefeningen en materiaal om mee aan de slag te gaan. Dit onderdeel wordt later uitgewerkt.</div>
          <div class="sect-foot" style="color:var(--muted)">Binnenkort beschikbaar</div>
        </button>
      </div>
    </div>`;

    qs('#sect-agenda').onclick = () => go('agenda');
    qs('#sect-lab').onclick = () => go('lab');
    qs('#sect-ontw').onclick = () => go('ontwikkeling');

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
  function renderOefenmateriaal() {
    comingSoon('Oefenmateriaal', 'Oefeningen en materiaal om mee aan de slag te gaan.', ICONS.fileText);
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
    const sub = ['feedback', 'coaching'].includes(parts[1]) ? parts[1] : 'pcp';

    // Volledig-schermsubviews
    if (sub === 'feedback' && parts[2] === 'new') return renderNewSession();
    if (sub === 'feedback' && parts[2] === 'manage' && parts[3]) return renderManageSession(parts[3]);
    if (sub === 'coaching' && parts[2] === 'r' && parts[3]) return renderCoachingRelation(parts[3]);

    qs('#main').innerHTML = `<div class="fade-up">
      <div class="eyebrow">Ontwikkeling</div>
      <div class="tabs" id="ontw-tabs" style="margin-top:10px">
        <button class="tab ${sub === 'pcp' ? 'active' : ''}" data-sub="pcp">PCP — Competenties</button>
        <button class="tab ${sub === 'feedback' ? 'active' : ''}" data-sub="feedback">360° Feedback</button>
        <button class="tab ${sub === 'coaching' ? 'active' : ''}" data-sub="coaching">Coaching</button>
      </div>
      <div id="ontw-body"></div>
    </div>`;
    qsa('#ontw-tabs .tab').forEach((b) =>
      b.addEventListener('click', () => go('ontwikkeling', b.dataset.sub)));

    if (sub === 'feedback') renderFeedbackHub();
    else if (sub === 'coaching') renderCoachingIndex();
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
          <input id="n-name" class="input" placeholder="bv. StormTromp" value="${escapeHtml(session.full_name.replace(/\s/g, ''))}">
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
})();
