// ============================================================
// Feedback respondent flow
// URL:  feedback.html?code=XY-ABCD[&self=1]
// ============================================================
(function () {
  const { h, qs, qsa, escapeHtml, toast, getQueryParams, ICONS } = window.HopUtil;
  const params = getQueryParams();
  const initialCode = (params.code || '').toUpperCase();
  const forceSelf = params.self === '1';

  const state = {
    session: null,
    isSelf: forceSelf ? true : null,
    name: '',
    role: '',
    ratings: {},
    notes: {},
    themeIdx: 0,
  };

  const main = () => qs('#main');

  // -----------------------------------------------------------
  if (!initialCode) {
    return renderEnterCode();
  }
  boot();

  async function boot() {
    try {
      const s = await HopApi.getSession(initialCode);
      if (!s) return renderNotFound(initialCode);
      state.session = s;

      if (forceSelf) {
        state.isSelf = true;
        state.name = s.subject_name;
        state.role = 'Zelfreflectie';
        // Pre-populate existing self-answers if present so pilot can edit
        try {
          const rows = await HopApi.listResponses(s.code);
          const me = rows.find((r) => r.is_self);
          if (me) {
            state.ratings = me.ratings || {};
            state.notes = me.notes || {};
          }
        } catch (e) {}
        renderFilling();
      } else {
        renderIdentity();
      }
    } catch (e) {
      main().innerHTML = `<div class="card" style="color:var(--danger)">Kon sessie niet laden: ${escapeHtml(e.message)}</div>`;
    }
  }

  // -----------------------------------------------------------
  function renderEnterCode() {
    main().innerHTML = `
      <div class="fade-up card card-lg">
        <div class="eyebrow">Feedback geven</div>
        <h1 class="page-title" style="font-size:32px">Voer de code in</h1>
        <p class="page-lead">Vul de code in die je ontvangen hebt van de aspirant piloot.</p>
        <div class="field">
          <label class="field-label">Sessiecode</label>
          <input id="code-in" class="input input-code" placeholder="BV. ST-4F7K">
        </div>
        <div id="err" style="font-size:13px;color:var(--danger);margin-bottom:10px;display:none"></div>
        <button class="btn btn-primary" id="go">Verder ${ICONS.arrowRight}</button>
      </div>`;
    const go = async () => {
      const c = qs('#code-in').value.trim().toUpperCase();
      if (!c) return;
      try {
        const s = await HopApi.getSession(c);
        if (!s) throw new Error('nope');
        location.search = `?code=${encodeURIComponent(c)}`;
      } catch (e) {
        qs('#err').textContent = 'Sessiecode niet gevonden.';
        qs('#err').style.display = 'block';
      }
    };
    qs('#go').onclick = go;
    qs('#code-in').addEventListener('keydown', (e) => e.key === 'Enter' && go());
  }

  function renderNotFound(code) {
    main().innerHTML = `
      <div class="card card-lg" style="text-align:center">
        <div style="color:var(--danger);margin:0 auto 12px;display:flex;justify-content:center">${ICONS.alert}</div>
        <h2 class="font-display" style="font-size:22px;color:var(--navy-deep);margin-bottom:8px">Sessie niet gevonden</h2>
        <p style="color:var(--muted);margin-bottom:20px">De code <strong>${escapeHtml(code)}</strong> bestaat niet of is verwijderd.</p>
        <a href="feedback.html" class="btn btn-primary">Andere code invoeren</a>
      </div>`;
  }

  // -----------------------------------------------------------
  function renderIdentity() {
    const s = state.session;
    main().innerHTML = `
      <div class="fade-up">
        <div class="eyebrow">Feedback voor ${escapeHtml(s.subject_name)}</div>
        <h1 class="page-title" style="font-size:38px">Wie ben jij?</h1>
        <p class="page-lead">Vul in hoe je genoemd wilt worden in het rapport en wat je relatie is tot ${escapeHtml(s.subject_name.split(' ')[0])}.</p>

        <div class="card card-lg">
          <label class="card" style="display:flex;gap:12px;align-items:flex-start;margin-bottom:20px;padding:14px;background:rgba(229,107,62,.1);border-color:rgba(229,107,62,.3);cursor:pointer">
            <input type="checkbox" id="cb-self" style="width:18px;height:18px;margin-top:2px;accent-color:var(--coral)">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--navy-deep)">Ik ben ${escapeHtml(s.subject_name)} (zelfreflectie)</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">Vink aan als jij de aspirant piloot bent.</div>
            </div>
          </label>

          <div class="field">
            <label class="field-label">Jouw naam</label>
            <input id="r-name" class="input" placeholder="bv. Frank Tromp">
          </div>
          <div class="field">
            <label class="field-label">Jouw relatie tot ${escapeHtml(s.subject_name.split(' ')[0])}</label>
            <input id="r-role" class="input" placeholder="bv. Collega, leidinggevende, vriend">
          </div>

          <button class="btn btn-coral" id="btn-start" disabled>Start feedback (${FEEDBACK_THEMES.length} thema's) ${ICONS.arrowRight}</button>
        </div>
      </div>`;

    const cb = qs('#cb-self'), nameEl = qs('#r-name'), roleEl = qs('#r-role'), btn = qs('#btn-start');
    const check = () => (btn.disabled = !(nameEl.value.trim() && roleEl.value.trim()));
    cb.addEventListener('change', () => {
      state.isSelf = cb.checked;
      if (cb.checked) {
        nameEl.value = state.session.subject_name; nameEl.disabled = true;
        roleEl.value = 'Zelfreflectie'; roleEl.disabled = true;
      } else {
        nameEl.disabled = false; roleEl.disabled = false;
        nameEl.value = ''; roleEl.value = '';
      }
      check();
    });
    nameEl.addEventListener('input', check);
    roleEl.addEventListener('input', check);
    btn.onclick = () => {
      state.name = nameEl.value.trim();
      state.role = roleEl.value.trim();
      renderFilling();
    };
  }

  // -----------------------------------------------------------
  function renderFilling() {
    const s = state.session;
    const theme = FEEDBACK_THEMES[state.themeIdx];
    const progress = (state.themeIdx / FEEDBACK_THEMES.length) * 100;
    const isLast = state.themeIdx === FEEDBACK_THEMES.length - 1;

    main().innerHTML = `
      <div class="fade-up">
        <div class="eyebrow">Feedback voor ${escapeHtml(s.subject_name)} · ${escapeHtml(state.name)}</div>
        <div class="progress"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div style="font-size:11px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;font-weight:600;margin-bottom:6px">
          Thema ${state.themeIdx + 1} van ${FEEDBACK_THEMES.length}
        </div>
        <h2 class="font-display" style="font-size:32px;font-weight:600;color:var(--navy-deep);margin-bottom:12px;letter-spacing:-.02em">${escapeHtml(theme.label)}</h2>
        <div style="padding:16px;background:rgba(30,74,122,.08);border-left:3px solid var(--navy);border-radius:0 8px 8px 0;font-size:13px;color:#374151;line-height:1.65;margin-bottom:24px">
          ${escapeHtml(theme.def)}
        </div>

        <div id="stmts"></div>

        <div class="card" style="margin-bottom:16px">
          <label style="display:block;font-size:13px;color:#374151;margin-bottom:8px;font-weight:500">${escapeHtml(theme.note)}</label>
          <textarea id="note" class="input" rows="3" placeholder="Optioneel — voorbeelden maken feedback concreet…">${escapeHtml(state.notes[theme.key] || '')}</textarea>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn" id="back" ${state.themeIdx === 0 ? 'disabled' : ''}>${ICONS.chevLeft} Terug</button>
          <div style="margin-left:auto"></div>
          <button class="btn btn-${isLast ? 'coral' : 'primary'}" id="next">
            ${isLast ? `${ICONS.send} Feedback verzenden` : `Volgende ${ICONS.chevRight}`}
          </button>
        </div>
      </div>`;

    const stmtsBox = qs('#stmts');
    theme.stmts.forEach((stmt, idx) => {
      const row = h('div', { class: 'card', style: { marginBottom: '10px' } });
      row.innerHTML = `<div style="font-size:14px;color:#1F2937;line-height:1.55;margin-bottom:12px">${escapeHtml(stmt)}</div>
        <div class="scale"></div>`;
      const scale = row.querySelector('.scale');
      const key = `${theme.key}_${idx}`;
      FB_SCALE_LABELS.forEach((lbl, i) => {
        const v = i + 1;
        const btn = h('button', {
          type: 'button',
          class: `scale-opt ${state.ratings[key] === v ? 'active' : ''}`,
          style: { flex: '1' },
        });
        btn.innerHTML = `<span class="n">${v}</span><span>${lbl}</span>`;
        btn.addEventListener('click', () => {
          state.ratings[key] = v;
          qsa('.scale-opt', scale).forEach((b, bi) => b.classList.toggle('active', bi === i));
          checkNext();
        });
        scale.appendChild(btn);
      });
      stmtsBox.appendChild(row);
    });

    qs('#note').addEventListener('input', (e) => { state.notes[theme.key] = e.target.value; });
    qs('#back').onclick = () => { if (state.themeIdx > 0) { state.themeIdx--; renderFilling(); window.scrollTo(0, 0); } };
    qs('#next').onclick = async () => {
      if (!canContinue()) { toast('Beantwoord eerst alle stellingen', 'error'); return; }
      if (!isLast) { state.themeIdx++; renderFilling(); window.scrollTo(0, 0); return; }
      await submit();
    };

    function canContinue() {
      return theme.stmts.every((_, i) => !!state.ratings[`${theme.key}_${i}`]);
    }
    function checkNext() {
      const btn = qs('#next');
      btn.disabled = !canContinue();
    }
    checkNext();
  }

  async function submit() {
    const btn = qs('#next');
    btn.disabled = true; btn.innerHTML = 'Verzenden…';
    try {
      // If self & already has a row, update instead of insert
      if (state.isSelf) {
        const rows = await HopApi.listResponses(state.session.code);
        const existing = rows.find((r) => r.is_self);
        if (existing) {
          await HopApi.patchResponse(existing.id, {
            respondent_name: state.name,
            respondent_role: state.role,
            ratings: state.ratings,
            notes: state.notes,
          });
        } else {
          await HopApi.postResponse({
            session_code: state.session.code,
            respondent_name: state.name,
            respondent_role: state.role,
            is_self: true,
            ratings: state.ratings,
            notes: state.notes,
          });
        }
      } else {
        await HopApi.postResponse({
          session_code: state.session.code,
          respondent_name: state.name,
          respondent_role: state.role,
          is_self: false,
          ratings: state.ratings,
          notes: state.notes,
        });
      }
      renderDone();
    } catch (e) {
      console.error(e);
      toast('Kon antwoorden niet opslaan: ' + e.message, 'error', 3500);
      btn.disabled = false;
      btn.innerHTML = `${ICONS.send} Feedback verzenden`;
    }
  }

  function renderDone() {
    main().innerHTML = `
      <div class="fade-up card card-lg" style="text-align:center">
        <div class="success-icon">${ICONS.check}</div>
        <h1 class="font-display" style="font-size:32px;font-weight:600;color:var(--navy-deep);margin-bottom:10px">
          Bedankt, ${escapeHtml(state.name.split(' ')[0])}!
        </h1>
        <p style="color:var(--muted);margin-bottom:24px;line-height:1.6">
          Je feedback voor <strong>${escapeHtml(state.session.subject_name)}</strong> is opgeslagen.
          ${state.isSelf ? 'Je kunt nu je rapport bekijken zodra de feedbackgevers hun deel ingevuld hebben.' : 'Dit draagt echt bij aan hun groei.'}
        </p>
        <a href="${state.isSelf ? `portal.html#feedback/manage/${encodeURIComponent(state.session.code)}` : 'index.html'}" class="btn btn-primary">
          ${state.isSelf ? 'Terug naar sessie' : 'Sluit venster'}
        </a>
      </div>`;
  }
})();
