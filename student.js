/* وِردي — application de l'élève.
 * L'élève ouvre le lien envoyé par l'enseignant : le programme du mois est enregistré
 * dans le téléphone. Chaque jour il voit son ورد, le coche, et en fin de mois envoie
 * la fiche PDF par WhatsApp. Les rappels passent par l'agenda du téléphone.
 */
"use strict";
(() => {
  const KEY = "wirdi-student";
  const DEF = { name: "", lang: "ar", plans: [], done: {}, remindAt: "07:00" };
  let S = { ...DEF, ...W.store.get(KEY, {}) };
  let UI = { tab: "today", month: null, toast: null, sheet: null, draft: "", linkError: null, busy: false };
  let installEvent = null;
  const save = () => W.store.set(KEY, S);
  const ar = () => S.lang === "ar";
  const e = W.esc;
  const today = () => W.today();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const appUrl = () => new URL("index.html", location.href).toString();

  const T = {
    ar: {
      today: "اليوم", month: "الشهر", settings: "الإعدادات", hello: n => `السلام عليكم، ${n}`,
      wird: "الورد اليومي", part: (i, n) => `الجزء ${i} من ${n}`, none: "لا يوجد ورد مبرمج لهذا اليوم.",
      mark: "سجّل: تمّت القراءة", undo: "تمّت القراءة ✓ — اضغط للإلغاء",
      progress: (m, a, b) => `شهر ${m}: ${a} من ${b} يومًا`, tomorrow: w => `ورد الغد: ${w}`,
      welcome: "مرحبا بك في وِردي", welcomeText: "افتح الرابط الذي أرسله المعلّم في مجموعة الفوج على واتساب، أو الصقه هنا.",
      paste: "الصق رابط الورد هنا", addLink: "تسجيل الورد",
      added: (g, m) => `تمّ تسجيل ورد شهر ${m} — ${g}`,
      linkErr: { checksum: "الرابط ناقص أو تغيّر عند النسخ. اطلب من المعلّم إعادة إرساله.", missing: "هذا ليس رابط ورد.", bad: "هذا ليس رابط ورد.", invalid: "الرابط يحتوي على آيات غير صحيحة.", coverage: "التقسيم غير مكتمل في هذا الرابط." },
      name: "اسم الطالب", namePrompt: "اكتب اسمك كما سيظهر على بطاقة المتابعة.", save: "حفظ", cancel: "إلغاء", edit: "تعديل",
      send: "إرسال البطاقة إلى المعلّم", sending: "جارٍ إنشاء البطاقة…", saved: "حُفظت البطاقة في التنزيلات. أرسلها إلى المعلّم عبر واتساب.",
      shareText: (m, n) => `بطاقة متابعة شهر ${m} — ${n}`,
      reminders: "التذكير اليومي", remindTime: "وقت التذكير",
      remindHelp: "يضيف التذكير إلى رزنامة الهاتف، فيصلك تنبيه كل يوم في الوقت المختار. أعد إضافته كل شهر بعد تسجيل الورد الجديد.",
      google: "إضافة إلى رزنامة Google", ics: "إضافة إلى رزنامة الهاتف (ملف)",
      icsHint: isIOS ? "على الآيفون: اضغط «إضافة إلى رزنامة الهاتف» ثم «إضافة الكل»." : "على أندرويد: استعمل زر رزنامة Google. ملف الرزنامة يعمل مع رزنامة سامسونغ وOutlook.",
      remindFor: m => `التذكيرات لشهر ${m}`, noPlanYet: "سجّل الورد أولا من رابط المعلّم.",
      plans: "الأوراد المسجّلة", del: "حذف", from: d => `ابتداء من ${d}`, partsN: n => `${n} أجزاء`,
      addAnother: "إضافة ورد من رابط", lang: "Français", install: "تثبيت التطبيق على الشاشة الرئيسية",
      installIOS: "للتثبيت على الآيفون: اضغط زر المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».",
      setReminder: "فعّل التذكير اليومي في الرزنامة", calEvent: "ورد اليوم", calOpen: "افتح وِردي",
      monthEmpty: "لا يوجد ورد لهذا الشهر.", count: (a, b) => `${a} من ${b}`,
    },
    fr: {
      today: "Aujourd'hui", month: "Mois", settings: "Réglages", hello: n => `Salam, ${n}`,
      wird: "Wird du jour", part: (i, n) => `Part ${i} sur ${n}`, none: "Aucun wird prévu ce jour.",
      mark: "Marquer comme lu", undo: "Lu ✓ — toucher pour annuler",
      progress: (m, a, b) => `${m} : ${a} jour(s) sur ${b}`, tomorrow: w => `Wird de demain : ${w}`,
      welcome: "Bienvenue dans وِردي", welcomeText: "Ouvrez le lien envoyé par l'enseignant dans le groupe WhatsApp, ou collez-le ici.",
      paste: "Collez ici le lien du wird", addLink: "Enregistrer le wird",
      added: (g, m) => `Wird de ${m} enregistré — ${g}`,
      linkErr: { checksum: "Le lien est incomplet ou a été modifié en le copiant. Demandez à l'enseignant de le renvoyer.", missing: "Ce n'est pas un lien de wird.", bad: "Ce n'est pas un lien de wird.", invalid: "Le lien contient des versets incorrects.", coverage: "Le découpage de ce lien est incomplet." },
      name: "Nom de l'élève", namePrompt: "Votre nom tel qu'il apparaîtra sur la fiche de suivi.", save: "Enregistrer", cancel: "Annuler", edit: "Modifier",
      send: "Envoyer la fiche à l'enseignant", sending: "Création de la fiche…", saved: "Fiche enregistrée dans les téléchargements. Envoyez-la à l'enseignant sur WhatsApp.",
      shareText: (m, n) => `بطاقة متابعة شهر ${m} — ${n}`,
      reminders: "Rappel quotidien", remindTime: "Heure du rappel",
      remindHelp: "Le rappel est ajouté à l'agenda du téléphone, qui vous prévient chaque jour à l'heure choisie. Ajoutez-le à nouveau chaque mois, après avoir enregistré le nouveau wird.",
      google: "Ajouter à Google Agenda", ics: "Ajouter à l'agenda du téléphone (fichier)",
      icsHint: isIOS ? "Sur iPhone : touchez « Ajouter à l'agenda du téléphone » puis « Tout ajouter »." : "Sur Android : utilisez le bouton Google Agenda. Le fichier agenda fonctionne avec Samsung Agenda et Outlook.",
      remindFor: m => `Rappels pour ${m}`, noPlanYet: "Enregistrez d'abord le wird à partir du lien de l'enseignant.",
      plans: "Wirds enregistrés", del: "Supprimer", from: d => `à partir du ${d}`, partsN: n => `${n} parts`,
      addAnother: "Ajouter un wird depuis un lien", lang: "العربية", install: "Installer l'application sur l'écran d'accueil",
      installIOS: "Sur iPhone : touchez le bouton Partager de Safari, puis « Sur l'écran d'accueil ».",
      setReminder: "Activez le rappel quotidien dans l'agenda", calEvent: "ورد اليوم", calOpen: "Ouvrir وِردي",
      monthEmpty: "Aucun wird ce mois-ci.", count: (a, b) => `${a} / ${b}`,
    },
  };
  const t = () => T[S.lang];

  function toast(msg, ms = 3200) { UI.toast = msg; render(); clearTimeout(toast.h); toast.h = setTimeout(() => { UI.toast = null; render(); }, ms); }

  // ---------------------------------------------------------------- lien de l'enseignant
  function addPlanFrom(text) {
    const r = W.parsePlan(text);
    if (r.error) return r.error;
    const p = r.plan;
    S.plans = S.plans.filter(x => !(x.id === p.id && x.start === p.start)).concat(p).sort((x, y) => (x.start < y.start ? -1 : 1));
    save();
    UI.tab = "today";
    toast(t().added(p.group, W.monthTxt(W.ym(p.start), ar())));
    return null;
  }

  // ---------------------------------------------------------------- calculs
  const wird = d => W.wirdFor(S.plans, d);
  function stats(m) {
    let done = 0, due = 0;
    for (const d of W.monthDays(m)) { if (!wird(d)) continue; if (S.done[d]) done++; if (d <= today()) due++; }
    return [done, due];
  }
  const latestPlan = () => S.plans[S.plans.length - 1];

  // ---------------------------------------------------------------- rendu
  const ICON = {
    today: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4C9.8 2.7 7 2 3 2H2v16h1c3.6 0 6.2.8 8.4 2.3l.6.4.6-.4C14.8 18.8 17.4 18 21 18h1V2h-1c-4 0-6.8.7-9 2zm-1 13.5C9.2 16.6 7 16.1 4 16V4c3.2.1 5.4.8 7 1.9zm9-1.5c-3 .1-5.2.6-7 1.5V5.9c1.6-1.1 3.8-1.8 7-1.9z"/></svg>',
    month: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14zM7 11h5v5H7z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>',
  };

  const KEEP_FOCUS = new Set(["rt"]);
  // Rafraîchissement protégé : pas de rendu imbriqué (un champ qui perd le focus pendant le rendu
  // déclenche « change »), et le champ en cours de saisie garde le focus.
  let rendering = false, pending = false;
  function render() {
    if (rendering) { pending = true; return; }
    rendering = true;
    const active = document.activeElement, fid = active && active.id, typing = active && active.tagName === "INPUT" && /^(text|search|tel|)$/.test(active.type || "");
    const caret = typing ? active.selectionStart : null;
    try { draw(); } finally { rendering = false; }
    if (fid && KEEP_FOCUS.has(fid)) { const el = document.getElementById(fid); if (el) { el.focus(); if (caret != null && el.setSelectionRange) el.setSelectionRange(caret, caret); } }
    if (pending) { pending = false; render(); }
  }
  function draw() {
    document.documentElement.lang = S.lang;
    document.documentElement.dir = ar() ? "rtl" : "ltr";
    const app = document.getElementById("app"), nav = document.getElementById("nav"), extra = document.getElementById("extra");
    if (!S.plans.length) {
      nav.hidden = true; extra.innerHTML = "";
      app.innerHTML = viewWelcome();
    } else {
      nav.hidden = false;
      nav.innerHTML = ["today", "month", "settings"].map(k =>
        `<button data-a="tab" data-t="${k}" ${UI.tab === k ? 'aria-current="page"' : ""}>${ICON[k]}<span>${t()[k]}</span></button>`).join("");
      app.innerHTML = UI.tab === "today" ? viewToday() : UI.tab === "month" ? viewMonth() : viewSettings();
      extra.innerHTML = UI.tab === "month" ? `<div class="sendbar"><button class="btn wa block" data-a="send" ${UI.busy ? "disabled" : ""}>${UI.busy ? t().sending : t().send}</button></div>` : "";
    }
    let layer = "";
    if (S.plans.length && !S.name) UI.sheet = UI.sheet || "name";
    if (UI.sheet === "name") {
      layer += `<div class="overlay"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="nm-t">
        <h2 id="nm-t">${t().name}</h2><p class="muted">${t().namePrompt}</p>
        <input id="nm" value="${e(UI.draft || S.name)}" autocomplete="name">
        <div class="actions">${S.name ? `<button class="btn" data-a="sheet-close">${t().cancel}</button>` : ""}
          <button class="btn primary" data-a="save-name">${t().save}</button></div></div></div>`;
    }
    if (UI.toast) layer += `<div class="toast" role="status">${e(UI.toast)}</div>`;
    document.getElementById("layer").innerHTML = layer;
  }

  function linkErrorBox() {
    return UI.linkError ? `<div class="errbox" role="alert">${t().linkErr[UI.linkError] || t().linkErr.bad}</div>` : "";
  }

  function viewWelcome() {
    return `<section class="card hero" style="margin-top:24px">
        <img src="icons/icon-192.png" width="72" height="72" alt="" style="border-radius:18px">
        <h1>${t().welcome}</h1><p class="muted">${t().welcomeText}</p></section>
      ${linkErrorBox()}
      <section class="card"><label for="paste">${t().paste}</label>
        <textarea id="paste" rows="3" dir="ltr">${e(UI.draft)}</textarea>
        <button class="btn primary block" data-a="paste">${t().addLink}</button></section>
      <div class="row" style="justify-content:center"><button class="link" data-a="lang">${t().lang}</button></div>`;
  }

  function viewToday() {
    const d = today(), w = wird(d), done = !!S.done[d], [a, b] = stats(W.ym(d)), tm = wird(W.addDays(d, 1));
    return `${linkErrorBox()}
      <p style="text-align:center">${e(t().hello(S.name || "…"))}</p>
      <p class="date" style="text-align:center">${W.dayName(d, ar())} ${W.dateTxt(d, ar())} ${d.slice(0, 4)}</p>
      <section class="card soft hero">
        <span class="k">${t().wird}</span>
        <div class="wird">${w ? e(W.label(w.seg)) : `<span style="font-size:18px;font-family:var(--f-ui)">${t().none}</span>`}</div>
        ${w ? `<span class="muted small">${e(w.plan.group)} · ${t().part(w.part, w.parts)}</span>` : ""}
      </section>
      ${w ? `<button class="btn ${done ? "" : "primary"} block" data-a="toggle" data-d="${d}" style="${done ? "border:2px solid var(--green);color:var(--green)" : ""}">${done ? t().undo : t().mark}</button>` : ""}
      <section class="card"><span>${t().progress(W.monthTxt(W.ym(d), ar()), a, b)}</span>
        <div class="bar"><i style="width:${b ? (a / b) * 100 : 0}%"></i></div></section>
      ${tm ? `<p class="muted" style="text-align:center">${t().tomorrow(`<span class="quran" style="font-size:18px">${e(W.label(tm.seg))}</span>`)}</p>` : ""}
      ${!S.remindSet ? `<button class="btn block" data-a="goto-remind">🔔 ${t().setReminder}</button>` : ""}`;
  }

  function monthBounds() {
    const first = W.ym(S.plans[0].start), cur = W.ym(today());
    const last = [W.ym(latestPlan().start), cur].sort().pop();
    return [first, last];
  }

  function viewMonth() {
    const [first, last] = monthBounds();
    let m = UI.month || W.ym(today());
    if (m < first) m = first; if (m > last) m = last; UI.month = m;
    const [a, b] = stats(m);
    const rows = W.monthDays(m).map(d => {
      const w = wird(d), can = w && d <= today();
      return `<div class="day ${d === today() ? "is-today" : ""}">
        <div><div class="dn">${W.dayName(d, ar())}</div><div class="dd">${W.dateTxt(d, ar())}</div></div>
        <div class="dw">${w ? e(W.label(w.seg)) : "—"}</div>
        <input type="checkbox" data-a="toggle" data-d="${d}" aria-label="${W.dateTxt(d, ar())}" ${S.done[d] ? "checked" : ""} ${can ? "" : "disabled"}></div>`;
    }).join("");
    const prevSym = ar() ? "›" : "‹", nextSym = ar() ? "‹" : "›";
    return `<div class="mhead">
        <button class="iconbtn" data-a="m" data-n="-1" ${m <= first ? "disabled" : ""} aria-label="−1">${prevSym}</button>
        <h2>${W.monthTxt(m, ar())}<br><span class="muted small" style="font-variant-numeric:tabular-nums">${t().count(a, b)}</span></h2>
        <button class="iconbtn" data-a="m" data-n="1" ${m >= last ? "disabled" : ""} aria-label="+1">${nextSym}</button></div>
      <section class="card" style="padding:8px 10px"><div class="days">${rows}</div></section>
      <div style="height:70px"></div>`;
  }

  function viewSettings() {
    const lp = latestPlan(), from = lp ? [lp.start, today()].sort().pop() : null;
    const plans = [...S.plans].reverse().map(p => `
      <div class="row" style="border-top:1px dashed var(--line);padding-top:8px">
        <div class="grow"><b>${e(p.group)}</b> · ${W.monthTxt(W.ym(p.start), ar())} · ${t().from(W.dateTxt(p.start, ar()))}<br>
          <span class="quran" style="font-size:17px">${e(W.verseLabel(...p.a))} ← ${e(W.verseLabel(...p.b))}</span> · ${t().partsN(p.k)}</div>
        <button class="link" data-a="del-plan" data-id="${e(p.id)}" data-s="${p.start}" style="color:var(--danger)">${t().del}</button></div>`).join("");
    return `${linkErrorBox()}
      <section class="card"><span class="k">${t().name}</span>
        <div class="row"><span class="grow" style="font-size:18px">${e(S.name || "—")}</span><button class="link" data-a="edit-name">${t().edit}</button></div></section>
      <section class="card" id="remind"><span class="k">${t().reminders}</span>
        <p class="muted small">${t().remindHelp}</p>
        <div class="row"><label for="rt">${t().remindTime}</label><input type="time" id="rt" value="${S.remindAt}" style="width:auto"></div>
        ${lp ? `<p class="small"><b>${t().remindFor(W.monthTxt(W.ym(lp.start), ar()))}</b></p>
          <a class="btn primary block" style="text-align:center;text-decoration:none" href="${e(googleLink(lp, from))}" target="_blank" rel="noopener" data-a="remind-set">${t().google}</a>
          <button class="btn block" data-a="ics">${t().ics}</button>
          <p class="muted small">${t().icsHint}</p>` : `<p class="muted">${t().noPlanYet}</p>`}
      </section>
      <section class="card"><span class="k">${t().plans}</span>${plans}
        <label for="paste">${t().addAnother}</label>
        <textarea id="paste" rows="2" dir="ltr">${e(UI.draft)}</textarea>
        <button class="btn" data-a="paste">${t().addLink}</button></section>
      <section class="card">
        ${installEvent ? `<button class="btn primary block" data-a="install">${t().install}</button>` : isIOS ? `<p class="small">${t().installIOS}</p>` : ""}
        <button class="btn" data-a="lang">${t().lang}</button></section>`;
  }

  // ---------------------------------------------------------------- agenda
  const compact = d => d.replace(/-/g, "");
  function hm() { const [h, m] = S.remindAt.split(":"); return `${h}${m}00`; }
  function hmEnd() { const [h, m] = S.remindAt.split(":").map(Number), x = h * 60 + m + 15; return `${String(Math.floor(x / 60) % 24).padStart(2, "0")}${String(x % 60).padStart(2, "0")}00`; }
  /** Événement Google Agenda quotidien jusqu'à la fin du mois du plan. */
  function googleLink(p, from) {
    const end = `${W.ym(p.start)}-${String(W.daysIn(W.ym(p.start))).padStart(2, "0")}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Tunis";
    const q = new URLSearchParams({
      action: "TEMPLATE", text: `${t().calEvent} — وِردي`,
      details: `${p.group}\n${W.verseLabel(...p.a)} ← ${W.verseLabel(...p.b)}\n${t().calOpen}: ${appUrl()}`,
      dates: `${compact(from)}T${hm()}/${compact(from)}T${hmEnd()}`, ctz: tz,
      recur: `RRULE:FREQ=DAILY;UNTIL=${compact(end)}T235959Z`,
    });
    return `https://calendar.google.com/calendar/render?${q.toString()}`;
  }
  /** Fichier .ics : un événement par jour, avec le ورد du jour et une alarme. */
  function icsFile(p, from) {
    const end = `${W.ym(p.start)}-${String(W.daysIn(W.ym(p.start))).padStart(2, "0")}`;
    const escIcs = s => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//wirdi//ar", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    for (let d = from; d <= end; d = W.addDays(d, 1)) {
      const w = wird(d); if (!w) continue;
      lines.push("BEGIN:VEVENT", `UID:wirdi-${p.id}-${d}@wirdi`, `DTSTAMP:${stamp}`,
        `DTSTART:${compact(d)}T${hm()}`, `DTEND:${compact(d)}T${hmEnd()}`,
        `SUMMARY:${escIcs(`${t().calEvent}: ${W.label(w.seg)}`)}`,
        `DESCRIPTION:${escIcs(`${w.plan.group} — ${t().part(w.part, w.parts)}\n${appUrl()}`)}`,
        `URL:${appUrl()}`,
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escIcs(W.label(w.seg))}`, "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return new File([lines.join("\r\n") + "\r\n"], `wird-${W.ym(p.start)}.ics`, { type: "text/calendar" });
  }

  function download(file) {
    const url = URL.createObjectURL(file), a = document.createElement("a");
    a.href = url; a.download = file.name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  }

  // ---------------------------------------------------------------- fiche PDF (dessinée sur canvas, mise en PDF par pdf-lib)
  async function buildPdf(m) {
    try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]); } catch (err) { /* polices de secours */ }
    const sc = 2, Wd = 595, Ht = 842, M = 36, cv = document.createElement("canvas");
    cv.width = Wd * sc; cv.height = Ht * sc;
    const c = cv.getContext("2d"); c.scale(sc, sc);
    c.fillStyle = "#fff"; c.fillRect(0, 0, Wd, Ht); c.direction = "rtl"; c.textBaseline = "middle";
    const UIF = '"IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif', QF = '"Amiri", "Traditional Arabic", serif';
    const txt = (s, x, y, size, color, opt = {}) => {
      c.font = `${opt.bold ? "700 " : ""}${size}px ${opt.quran ? QF : UIF}`; c.fillStyle = color; c.textAlign = opt.align || "right";
      let sz = size;
      if (opt.max) while (c.measureText(s).width > opt.max && sz > 7) { sz -= 0.5; c.font = `${opt.bold ? "700 " : ""}${sz}px ${opt.quran ? QF : UIF}`; }
      c.fillText(s, x, y);
    };
    const days = W.monthDays(m), plan = S.plans.filter(p => p.start <= `${m}-31`).pop() || S.plans[0];
    let y = M + 8;
    txt(plan.mosque || "", Wd - M, y, 12, "#111", { bold: true }); y += 17;
    txt(`برنامج حفظ القرآن: ${plan.group}`, Wd - M, y, 11, "#111"); y += 26;
    txt("بطاقة متابعة", Wd / 2, y, 22, "#2E9E6B", { bold: true, align: "center" }); y += 26;
    txt(`شهر ${W.monthTxt(m, true)}`, Wd / 2, y, 15, "#C92A62", { bold: true, align: "center" }); y += 24;
    txt(`طالب القرآن: ${S.name || "…………"}`, Wd - M, y, 12, "#111"); y += 16;
    const widths = [90, 100, Wd - 2 * M - 290, 100], heads = ["اليوم", "التاريخ", "الورد اليومي", "التأشير"];
    const rowH = Math.min(22, (Ht - M - 70 - y) / (days.length + 1));
    const colX = []; let x = Wd - M; widths.forEach(w => { colX.push([x - w, x]); x -= w; });
    c.lineWidth = 0.8; c.strokeStyle = "#3c3c3c";
    c.fillStyle = "#FCECF2"; c.fillRect(M, y, Wd - 2 * M, rowH);
    heads.forEach((h, i) => txt(h, (colX[i][0] + colX[i][1]) / 2, y + rowH / 2, 11, "#C92A62", { bold: true, align: "center" }));
    const top = y; y += rowH;
    let done = 0, due = 0;
    for (const d of days) {
      const w = wird(d), ok = !!S.done[d];
      if (w && d <= today()) due++; if (w && ok) done++;
      if (d === today()) { c.fillStyle = "#ECF7F1"; c.fillRect(M, y, Wd - 2 * M, rowH); }
      const mid = y + rowH / 2;
      txt(W.dayName(d, true), (colX[0][0] + colX[0][1]) / 2, mid, 10.5, "#1E7FBF", { bold: true, align: "center" });
      txt(W.dateTxt(d, true), (colX[1][0] + colX[1][1]) / 2, mid, 10.5, "#111", { align: "center" });
      txt(w ? W.label(w.seg) : "—", (colX[2][0] + colX[2][1]) / 2, mid, 12, "#111", { align: "center", quran: true, max: widths[2] - 8 });
      if (ok) txt("✓", (colX[3][0] + colX[3][1]) / 2, mid, 14, "#2E9E6B", { bold: true, align: "center" });
      y += rowH;
    }
    for (let r = top; r <= y + 0.1; r += rowH) { c.beginPath(); c.moveTo(M, r); c.lineTo(Wd - M, r); c.stroke(); }
    [M, ...colX.map(cx => cx[1])].forEach(vx => { c.beginPath(); c.moveTo(vx, top); c.lineTo(vx, y); c.stroke(); });
    y += 26;
    txt(`أيام القراءة: ${done} من ${due}`, Wd - M, y, 12.5, "#111", { bold: true });
    txt("الإمضاء: ....................", M, y, 12.5, "#111", { align: "left" });
    txt(`أُنشئت بتطبيق وِردي — ${W.dateTxt(today(), true)} ${today().slice(0, 4)}`, Wd / 2, Ht - M + 10, 8, "#888", { align: "center" });

    const png = await new Promise(r => cv.toBlob(r, "image/png"));
    const pdf = await PDFLib.PDFDocument.create();
    pdf.setTitle(`بطاقة متابعة ${W.monthTxt(m, true)} — ${S.name}`);
    const img = await pdf.embedPng(await png.arrayBuffer());
    pdf.addPage([Wd, Ht]).drawImage(img, { x: 0, y: 0, width: Wd, height: Ht });
    const bytes = await pdf.save();
    return new File([bytes], `wird_${m}.pdf`, { type: "application/pdf" });
  }

  function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = "vendor/pdf-lib.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }

  async function sendSheet() {
    UI.busy = true; render();
    try {
      await loadPdfLib();
      const m = UI.month || W.ym(today());
      const file = await buildPdf(m);
      const text = t().shareText(W.monthTxt(m, true), S.name);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text, title: text }); }
        catch (err) { if (err && err.name !== "AbortError") { download(file); toast(t().saved, 5000); } }
      } else { download(file); toast(t().saved, 5000); }
    } finally { UI.busy = false; render(); }
  }

  // ---------------------------------------------------------------- événements
  document.addEventListener("click", async ev => {
    const el = ev.target.closest("[data-a]");
    if (!el) return;
    const a = el.dataset.a;
    switch (a) {
      case "tab": UI.tab = el.dataset.t; UI.month = null; UI.linkError = null; window.scrollTo(0, 0); break;
      case "toggle": { const d = el.dataset.d; if (S.done[d]) delete S.done[d]; else S.done[d] = true; save(); break; }
      case "m": UI.month = W.addMonths(UI.month, +el.dataset.n); break;
      case "paste": {
        const v = document.getElementById("paste").value; UI.draft = v;
        const err = addPlanFrom(v); UI.linkError = err; if (!err) UI.draft = ""; break;
      }
      case "edit-name": UI.sheet = "name"; UI.draft = S.name; break;
      case "sheet-close": UI.sheet = null; UI.draft = ""; break;
      case "save-name": { const v = document.getElementById("nm").value.trim(); if (!v) return; S.name = v; save(); UI.sheet = null; UI.draft = ""; break; }
      case "del-plan": S.plans = S.plans.filter(p => !(p.id === el.dataset.id && p.start === el.dataset.s)); save(); break;
      case "lang": S.lang = ar() ? "fr" : "ar"; save(); break;
      case "goto-remind": UI.tab = "settings"; render(); document.getElementById("remind")?.scrollIntoView({ behavior: "smooth" }); return;
      case "remind-set": S.remindSet = true; save(); return;            // le lien s'ouvre normalement
      case "ics": { const lp = latestPlan(); const f = icsFile(lp, [lp.start, today()].sort().pop()); download(f); S.remindSet = true; save(); break; }
      case "send": sendSheet(); return;
      case "install": if (installEvent) { installEvent.prompt(); installEvent = null; } break;
      default: return;
    }
    render();
  });
  document.addEventListener("change", ev => {
    if (ev.target.id === "rt" && ev.target.value && ev.target.value !== S.remindAt) { S.remindAt = ev.target.value; save(); render(); }
  });
  document.addEventListener("input", ev => { if (ev.target.id === "nm" || ev.target.id === "paste") UI.draft = ev.target.value; });
  window.addEventListener("beforeinstallprompt", ev => { ev.preventDefault(); installEvent = ev; render(); });
  // La date suit l'horloge du téléphone : on rafraîchit au retour dans l'app et à minuit.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  (function midnight() {
    const n = new Date(), next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 2);
    setTimeout(() => { render(); midnight(); }, next - n);
  })();

  // Ouverture depuis le lien de l'enseignant : on enregistre le programme du mois.
  if (location.search) {
    const err = addPlanFrom(location.href);
    if (err) UI.linkError = err;
    history.replaceState(null, "", location.pathname);       // l'icône installée s'ouvre sans paramètres
  }

  render();
})();
