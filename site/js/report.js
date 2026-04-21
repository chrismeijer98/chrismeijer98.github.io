// ============================================================
// 360° Report viewer
// URL: report.html?code=XY-ABCD
// ============================================================
(function () {
  const { qs, escapeHtml, formatDateLong, getQueryParams, toast } = window.HopUtil;

  qs('#btn-print').addEventListener('click', () => window.print());

  const code = (getQueryParams().code || '').toUpperCase();
  if (!code) {
    qs('#main').innerHTML = `<div class="card">Geen sessiecode opgegeven.</div>`;
    return;
  }

  boot();

  async function boot() {
    const main = qs('#main');
    let s, rows = [];
    try {
      s = await HopApi.getSession(code);
      if (!s) throw new Error('Sessie niet gevonden');
      rows = await HopApi.listResponses(code);
    } catch (e) {
      main.innerHTML = `<div class="card" style="color:var(--danger)">${escapeHtml(e.message)}</div>`;
      return;
    }

    const self = rows.find((r) => r.is_self);
    const others = rows.filter((r) => !r.is_self);
    const subjectName = s.subject_name;

    // ---- helpers
    const themeAvg = (ratingsObj, key) => {
      const t = FEEDBACK_THEMES.find((x) => x.key === key);
      if (!t || !ratingsObj) return 3;
      const vals = t.stmts.map((_, i) => +ratingsObj[`${key}_${i}`] || 3);
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    const scored = FEEDBACK_THEMES.map((t) => {
      const selfA = self ? +themeAvg(self.ratings, t.key).toFixed(2) : 0;
      const othersAvgs = others.map((r) => +themeAvg(r.ratings, t.key).toFixed(2));
      const all = [...(self ? [selfA] : []), ...othersAvgs];
      const avg = all.length ? +(all.reduce((a, b) => a + b, 0) / all.length).toFixed(2) : 0;
      return { key: t.key, label: t.label, shortLabel: t.shortLabel, self: selfA, avg, othersAvgs };
    });
    const sortedByAvg = [...scored].sort((a, b) => b.avg - a.avg);

    // ---- COVER
    const cover = `
      <div class="report-cover">
        <div class="report-cover-inner">
          <div class="report-cover-label">360° Feedback Rapport</div>
          <div class="report-cover-name font-display">${escapeHtml(subjectName)}</div>
          <div class="report-cover-date">OPGEMAAKT OP ${formatDateLong(new Date().toISOString()).toUpperCase()}</div>
          <div class="report-cover-logo">HOUSE OF PILOTS</div>
        </div>
      </div>`;

    // ---- OVERVIEW
    const ovThemes = FEEDBACK_THEMES.map((t) =>
      `<div class="rep-list-item"><span class="rep-bullet"></span><span style="color:#444">${escapeHtml(t.label)}</span></div>`).join('');
    const ovDeeln = rows.map((r) =>
      `<div class="rep-list-item"><span class="rep-bullet ${r.is_self ? 'coral' : ''}"></span>
         <span style="color:#333;flex:1">${escapeHtml(r.respondent_name)}</span>
         <span style="color:#888">(${r.is_self ? 'Zelfreflectie' : escapeHtml(r.respondent_role || 'Feedbackgever')})</span>
       </div>`).join('');
    const legenda = FB_SCALE_LABELS.map((l, i) =>
      `<div style="font-size:13px;color:#555;padding:3px 0">${i + 1}. ${escapeHtml(l)}</div>`).join('');

    const overview = `
      <div class="report-page">
        <h2 class="report-h0">360° feedback rapport <em>${escapeHtml(subjectName)}</em></h2>
        <div class="report-h2">Thema's waarop feedback werd gevraagd:</div>
        <div style="margin-bottom:28px">${ovThemes}</div>
        <div class="report-h2">Deelnemers aan deze sessie (${rows.length})</div>
        <div style="margin-bottom:28px">${ovDeeln}</div>
        <div class="report-h2">Legenda schaal</div>
        ${legenda}
      </div>`;

    // ---- SUMMARY
    const summaryBars = sortedByAvg.map((t) => {
      const pct = (t.avg / 5) * 100;
      const spread = Math.round(Math.abs(t.avg - t.self) * 25) + 12;
      return `<div class="sam-row">
          <div class="sam-label">${escapeHtml(t.shortLabel)}</div>
          <div class="sam-track">
            <div class="sam-fill" style="width:${pct}%"></div>
            <div class="sam-spread" style="width:${spread}px"></div>
          </div>
          <div class="sam-score">${t.avg.toFixed(1)}</div>
        </div>`;
    }).join('');

    const summary = `
      <div class="report-page">
        <h2 class="report-h0">Samenvatting</h2>
        <p class="report-body">De thema's gesorteerd van hoge naar lage gemiddelde score. Gekleurde balk = gemiddelde van alle deelnemers. De streep geeft aan hoeveel jouw zelfreflectie afwijkt van het gemiddelde.</p>
        <div style="display:flex;justify-content:space-between;padding-left:240px;font-size:9.5px;color:#BBB;margin-bottom:8px">
          ${FB_SCALE_LABELS.map((l) => `<span>${escapeHtml(l)}</span>`).join('')}
        </div>
        ${summaryBars}
      </div>`;

    // ---- SITUATIESCHETS (radar + observation)
    const lowest = sortedByAvg[sortedByAvg.length - 1];
    const highest = sortedByAvg[0];
    const diff = self ? Math.abs(lowest.self - lowest.avg) : 0;
    let obsHtml;
    if (!others.length) {
      obsHtml = 'Er is nog geen externe feedback binnen — zodra feedbackgevers invullen, verschijnt hier de analyse.';
    } else if (diff >= 1 && self) {
      obsHtml = `Je zelfreflectie wijkt bij <strong>${escapeHtml(lowest.label)}</strong> ${diff.toFixed(1)} punt af van het gemiddelde: je geeft jezelf een ${lowest.self < lowest.avg ? 'lagere' : 'hogere'} score dan je omgeving. Dit is een waardevol gespreksonderwerp met je coach.`;
    } else {
      obsHtml = `Je zelfreflectie komt grotendeels overeen met de scores van je omgeving. Je hoogste thema is <strong>${escapeHtml(highest.label)}</strong> (${highest.avg.toFixed(1)}), je laagste thema is <strong>${escapeHtml(lowest.label)}</strong> (${lowest.avg.toFixed(1)}).`;
    }

    const radar = `
      <div class="report-page">
        <h2 class="report-h0">Situatieschets</h2>
        <p class="report-body">De feedback van alle feedbackgevers tezamen (de <strong style="color:var(--navy-deep)">donkere lijn</strong>) afgezet tegen je zelfreflectie (het <strong style="color:var(--coral-dark)">gekleurde vlak</strong>). Als vlak en lijn overeenkomen, is je zelfbeeld identiek aan hoe de omgeving je ziet.</p>
        <div class="radar-wrap"><canvas id="radar" width="500" height="500"></canvas></div>
        <div class="radar-legend">
          <span><span class="box" style="background:var(--coral);opacity:.5"></span> Zelfreflectie</span>
          <span><span class="box" style="background:var(--navy-deep);height:2px"></span> Gemiddelde feedbackgevers</span>
        </div>
        <div class="obs-box"><strong>Observatie:</strong> ${obsHtml}</div>
      </div>`;

    // ---- PER THEME
    const themesHtml = FEEDBACK_THEMES.map((theme) => {
      const selfA = self ? +themeAvg(self.ratings, theme.key).toFixed(2) : 0;
      const stmtSelf = theme.stmts.map((_, i) => (self?.ratings?.[`${theme.key}_${i}`] || 0));
      const othersData = others.map((r) => ({
        name: r.respondent_name,
        role: r.respondent_role,
        scores: theme.stmts.map((_, i) => r.ratings?.[`${theme.key}_${i}`] || 0),
        note: r.notes?.[theme.key] || '',
      }));
      const othersThemeAvg = othersData.length
        ? +(othersData.reduce((a, r) => a + r.scores.reduce((x, y) => x + y, 0) / r.scores.length, 0) / othersData.length).toFixed(1)
        : 0;

      let cats = '';
      if (self) {
        cats += `<div class="cat-row">
          <div class="cat-label">TESTPERSOON</div>
          <div class="cat-track"><div class="cat-fill tp" style="width:${(selfA / 5) * 100}%"></div></div>
          <div class="cat-score">${selfA.toFixed(1)}</div>
        </div>`;
      }
      if (othersData.length) {
        cats += `<div class="cat-row">
          <div class="cat-label">OMGEVING (${othersData.length})</div>
          <div class="cat-track"><div class="cat-fill omg" style="width:${(othersThemeAvg / 5) * 100}%"></div></div>
          <div class="cat-score">${othersThemeAvg.toFixed(1)}</div>
        </div>`;
      }
      cats += `<div style="display:flex;justify-content:space-between;padding-left:188px;font-size:9px;color:#CCC;margin-top:4px">${[1,2,3,4,5].map(n=>`<span>${n}</span>`).join('')}</div>`;

      const thead = `<thead><tr>
        <th class="lft">Stelling</th>
        ${self ? '<th>Zelf</th>' : ''}
        ${othersData.map((r) => `<th>${escapeHtml(r.name.split(' ')[0])}</th>`).join('')}
        <th>Gem.</th>
      </tr></thead>`;
      const tbody = '<tbody>' + theme.stmts.map((stmt, si) => {
        const sv = stmtSelf[si];
        const ov = othersData.map((r) => r.scores[si]);
        const all = [...(self ? [sv] : []), ...ov].filter(Boolean);
        const avg = all.length ? +(all.reduce((a, b) => a + b, 0) / all.length).toFixed(1) : 0;
        return `<tr>
          <td class="q">${escapeHtml(stmt)}</td>
          ${self ? `<td style="text-align:center"><span class="sc-badge sc-self">${sv || '—'}</span></td>` : ''}
          ${ov.map((v) => `<td style="text-align:center"><span class="sc-badge sc-resp">${v || '—'}</span></td>`).join('')}
          <td class="sc-avg">${avg || '—'}</td>
        </tr>`;
      }).join('') + '</tbody>';

      const selfNote = self?.notes?.[theme.key];
      const noteHtml = selfNote ? `
        <div class="notitie-box">
          <div class="notitie-label">Notitie van ${escapeHtml(subjectName)}:</div>
          <div class="notitie-text">${escapeHtml(selfNote)}</div>
        </div>` : '';

      const quotes = othersData.filter((r) => r.note).length
        ? `<div class="quotes-grid">${othersData.filter((r) => r.note).map((r) => `
            <div>
              <div class="quote-author">${escapeHtml(r.name.toUpperCase())}:</div>
              <div class="quote-text">${escapeHtml(r.note)}</div>
            </div>`).join('')}</div>`
        : '';

      return `
        <div class="report-page">
          <h2 class="report-h0">Thema <em>${escapeHtml(theme.label)}</em></h2>
          <div class="report-body"><strong style="color:var(--coral-dark)">DEFINITIE:</strong> ${escapeHtml(theme.def)}</div>
          <div class="report-h2">Scores per categorie</div>
          ${cats}
          <div class="report-h2" style="margin-top:28px">Scores per stelling</div>
          <table class="s-tbl">${thead}${tbody}</table>
          ${noteHtml}
          ${quotes}
        </div>`;
    }).join('');

    // Compose
    main.innerHTML = cover + overview + summary + radar + themesHtml;

    // Draw radar
    drawRadar(qs('#radar'), scored, !!self);
  }

  // -----------------------------------------------------------
  function drawRadar(canvas, scored, hasSelf) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 500; canvas.width = size; canvas.height = size;
    const cx = size / 2, cy = size / 2 - 5, r = 160, n = scored.length;
    ctx.clearRect(0, 0, size, size);

    // rings
    for (let ring = 1; ring <= 5; ring++) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        const rr = (ring / 5) * r;
        const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1; ctx.stroke();
    }
    // spokes
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1; ctx.stroke();
    }
    // self polygon
    if (hasSelf) {
      ctx.beginPath();
      scored.forEach((t, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        const rr = (t.self / 5) * r;
        const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(229,107,62,0.25)'; ctx.fill();
      ctx.strokeStyle = '#E56B3E'; ctx.lineWidth = 2.5; ctx.stroke();
    }
    // others line
    const hasOthers = scored.some((t) => t.othersAvgs.length);
    if (hasOthers) {
      ctx.beginPath();
      scored.forEach((t, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        const avgO = t.othersAvgs.length ? t.othersAvgs.reduce((x, y) => x + y, 0) / t.othersAvgs.length : 3;
        const rr = (avgO / 5) * r;
        const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = '#081A2F'; ctx.lineWidth = 2.2; ctx.stroke();
    }
    // labels
    ctx.font = '600 10px Inter, sans-serif'; ctx.fillStyle = '#374151'; ctx.textAlign = 'center';
    scored.forEach((t, i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      const lx = cx + (r + 30) * Math.cos(a), ly = cy + (r + 30) * Math.sin(a);
      const lbl = t.shortLabel.length > 16 ? t.shortLabel.substring(0, 14) + '…' : t.shortLabel;
      ctx.fillText(lbl, lx, ly);
    });
  }
})();
