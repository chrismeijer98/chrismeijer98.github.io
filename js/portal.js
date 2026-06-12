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
  const TABS = ['dashboard', 'lab', 'ontwikkeling', 'oefenmateriaal'];
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
    if (tab === 'lab') renderLab();
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
      <p class="page-lead">Het House of Pilots programma bestaat uit drie onderdelen.</p>

      <div class="sect-grid">
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

    qs('#sect-lab').onclick = () => go('lab');
    qs('#sect-ontw').onclick = () => go('ontwikkeling');

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

  function renderLab() {
    const parts = hashParts(); // ['lab', seg1, seg2]
    const seg1 = parts[1], seg2 = parts[2];
    if (session.role === 'coach') {
      if (seg1 === 'new' && seg2) return renderLabNew(seg2);
      if (seg1 === 'a' && seg2)   return renderLabCoachDetail(seg2);
      return renderLabCoachIndex();
    }
    if (seg1 === 'p' && seg2) return renderLabPilotDetail(seg2);
    return renderLabPilotIndex();
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
    const sub = parts[1] === 'feedback' ? 'feedback' : 'pcp';

    // Feedback-subschermen (nieuw/beheer) vullen het hele scherm
    if (sub === 'feedback' && parts[2] === 'new') return renderNewSession();
    if (sub === 'feedback' && parts[2] === 'manage' && parts[3]) return renderManageSession(parts[3]);

    qs('#main').innerHTML = `<div class="fade-up">
      <div class="eyebrow">Ontwikkeling</div>
      <div class="tabs" id="ontw-tabs" style="margin-top:10px">
        <button class="tab ${sub === 'pcp' ? 'active' : ''}" data-sub="pcp">PCP — Competenties</button>
        <button class="tab ${sub === 'feedback' ? 'active' : ''}" data-sub="feedback">360° Feedback</button>
      </div>
      <div id="ontw-body"></div>
    </div>`;
    qsa('#ontw-tabs .tab').forEach((b) =>
      b.addEventListener('click', () => go('ontwikkeling', b.dataset.sub)));

    if (sub === 'feedback') renderFeedbackHub();
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
})();
