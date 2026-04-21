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
    qsa('#role-pilot,#role-coach').forEach((b) => {
      b.classList.toggle('active', b.dataset.role === session.role);
    });
    const card = qs('#role-card');
    const isCoach = session.role === 'coach';
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
  qsa('.role-btn[data-role]').forEach((b) => {
    b.addEventListener('click', () => {
      session.role = b.dataset.role;
      HopSession.set(session);
      updateRoleUI();
      renderActiveTab();
    });
  });
  updateRoleUI();

  // --------------------------------------------------------
  // Tab routing (hash: #dashboard / #pcp / #feedback[:...])
  // --------------------------------------------------------
  const TABS = ['dashboard', 'pcp', 'feedback'];
  function currentTab() {
    const h = (location.hash || '#dashboard').replace(/^#/, '').split('/')[0];
    return TABS.includes(h) ? h : 'dashboard';
  }
  function go(tab, extra = '') {
    location.hash = '#' + tab + (extra ? '/' + extra : '');
  }
  window.addEventListener('hashchange', renderActiveTab);
  qsa('.side-link').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));

  function renderActiveTab() {
    const tab = currentTab();
    qsa('.side-link').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'dashboard') renderDashboard();
    else if (tab === 'pcp') renderPCP();
    else if (tab === 'feedback') renderFeedback();
  }
  renderActiveTab();

  // ==========================================================
  // DASHBOARD
  // ==========================================================
  async function renderDashboard() {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up"><div class="eyebrow">Welkom terug</div>
      <h1 class="page-title">${session.role === 'coach' ? 'Coach dashboard.' : 'Jouw PCP dashboard.'}</h1>
      <p class="page-lead">Overzicht van je voortgang in het programma.</p>
      <div id="dash-body"><div class="spinner" style="margin:80px auto"></div></div></div>`;

    const total = COMPETENCE_CATEGORIES.reduce(
      (s, c) => s + c.competences.reduce((ss, cc) => ss + cc.subcompetences.length + 1, 0), 0);

    let scored = 0, sessions = [];
    try {
      const scores = await HopApi.listScores(session.user_id);
      scored = scores.filter((s) => s.scored_by === session.role).length;
    } catch (e) { console.warn(e); }
    try { sessions = await HopApi.listSessions(session.user_id); } catch (e) { console.warn(e); }

    const percent = total ? Math.round((scored / total) * 100) : 0;

    // Count total responses across sessions
    let totalResponses = 0;
    await Promise.all(sessions.map(async (s) => {
      try { const rs = await HopApi.listResponses(s.code); totalResponses += rs.length; } catch (e) {}
    }));

    qs('#dash-body').innerHTML = `
      <div class="panel" style="margin-bottom:20px">
        <div style="position:relative;display:grid;grid-template-columns:1fr auto;gap:32px;align-items:center">
          <div>
            <div style="font-size:10px;letter-spacing:.3em;color:var(--coral);text-transform:uppercase;margin-bottom:10px;font-weight:600">Voortgang competentieprofiel</div>
            <div class="font-display" style="font-size:40px;font-weight:600;line-height:1;margin-bottom:12px">
              ${scored} / ${total} <span style="font-size:16px;color:rgba(255,255,255,.6);font-weight:400">gescoord</span>
            </div>
            <div style="height:8px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden;max-width:420px">
              <div style="width:${percent}%;height:100%;background:linear-gradient(90deg,var(--coral),#F59E0B);transition:width .6s"></div>
            </div>
          </div>
          <button class="btn btn-coral" id="d-go-pcp">
            ${scored === 0 ? 'Start invullen' : 'Verder invullen'} ${ICONS.arrowRight}
          </button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px">
        <button class="dash-stat" id="d-go-fb">
          <div class="icon-wrap" style="background:rgba(30,74,122,.15);color:var(--navy)">${ICONS.users}</div>
          <div style="flex:1;text-align:left">
            <div class="t">360° Feedback</div>
            <div class="d">${sessions.length} sessie(s) · ${totalResponses} respons(en)</div>
          </div>
          <span style="color:var(--muted)">${ICONS.arrowRight}</span>
        </button>

        <button class="dash-stat" id="d-go-pcp2">
          <div class="icon-wrap" style="background:rgba(229,107,62,.15);color:var(--coral-dark)">${ICONS.target}</div>
          <div style="flex:1;text-align:left">
            <div class="t">PCP — Competenties</div>
            <div class="d">${scored}/${total} competenties gescoord (${percent}%)</div>
          </div>
          <span style="color:var(--muted)">${ICONS.arrowRight}</span>
        </button>
      </div>
    `;
    qs('#d-go-pcp').onclick = () => go('pcp');
    qs('#d-go-pcp2').onclick = () => go('pcp');
    qs('#d-go-fb').onclick = () => go('feedback');
  }

  // ==========================================================
  // PCP MODULE
  // ==========================================================
  async function renderPCP() {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up">
      <div class="eyebrow">Pilot Career Plan</div>
      <h1 class="page-title">Competentieprofiel.</h1>
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

    const activeId = (location.hash.split('/')[1]) || COMPETENCE_CATEGORIES[0].id;

    // Render category tabs
    qs('#pcp-tabs').innerHTML = COMPETENCE_CATEGORIES.map((cat) => `
      <button class="tab ${cat.id === activeId ? 'active' : ''}" data-cat="${cat.id}" style="${cat.id === activeId ? `border-bottom-color:${cat.accent}` : ''}">
        <span class="font-display" style="font-style:italic;color:${cat.accent};font-size:15px">${cat.number}</span>
        ${cat.title}
      </button>`).join('');
    qsa('#pcp-tabs .tab').forEach((b) => {
      b.addEventListener('click', () => go('pcp', b.dataset.cat));
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
  // FEEDBACK MODULE — hub, new, manage
  // ==========================================================
  async function renderFeedback() {
    const [, sub, code] = (location.hash || '').split('/');
    // feedback/new            -> new session
    // feedback/manage/CODE    -> manage + responses
    if (sub === 'new')    return renderNewSession();
    if (sub === 'manage' && code) return renderManageSession(code);
    return renderFeedbackHub();
  }

  async function renderFeedbackHub() {
    const main = qs('#main');
    main.innerHTML = `<div class="fade-up">
      <div class="eyebrow">360° feedback</div>
      <h1 class="page-title">Feedback van je omgeving.</h1>
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

    qs('#fb-new').onclick = () => go('feedback', 'new');
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
        card.querySelector('[data-act=open]').onclick = () => go('feedback', 'manage/' + s.code);
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
      <a href="#feedback" class="back-link">${ICONS.chevLeft} Terug</a>
      <h1 class="page-title" style="font-size:38px">Nieuwe feedbackronde.</h1>
      <p class="page-lead">Over wie gaat deze feedback? Daarna maken we de code waarmee anderen kunnen invullen.</p>

      <div class="card card-lg">
        <div class="field">
          <label class="field-label">Naam</label>
          <input id="n-name" class="input" placeholder="bv. Storm Tromp" value="${escapeHtml(session.full_name)}">
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
        go('feedback', 'manage/' + code);
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
      main.innerHTML = `<div class="card" style="color:var(--danger)">Sessie "${escapeHtml(code)}" niet gevonden. <a href="#feedback">Terug</a></div>`;
      return;
    }

    const shareUrl = `${location.origin}${location.pathname.replace(/portal\.html$/, '')}feedback.html?code=${encodeURIComponent(code)}`;

    main.innerHTML = `<div class="fade-up">
      <a href="#feedback" class="back-link">${ICONS.chevLeft} Terug naar sessies</a>
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
