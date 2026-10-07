/* وِردي — page de l'enseignant.
 * L'enseignant crée ses groupes une fois, puis chaque mois fixe pour chaque groupe
 * la plage (sourate + verset de début, sourate + verset de fin). La page découpe,
 * vérifie qu'aucun verset n'est oublié, et fabrique le lien à envoyer au groupe WhatsApp.
 * Les données restent dans ce navigateur (sauvegarde/restauration par fichier).
 */
"use strict";
(() => {
  const KEY = "wirdi-teacher";
  const DEF = { mosque: "", lang: "ar", groups: [] };
  let S = { ...DEF, ...W.store.get(KEY, {}) };
  let UI = { edit: null, confirmDel: null, link: null, toast: null };
  const save = () => W.store.set(KEY, S);
  const ar = () => S.lang === "ar";
  const e = W.esc;

  const T = {
    ar: {
      title: "صفحة المعلّم", lead: "أنشئ الأفواج مرة واحدة، ثم حدّد في آخر كل شهر بداية الورد ونهايته لكل فوج. يقسّم التطبيق الورد على الأيام ويتحقق من أنه لم تُنسَ أي آية، ثم أرسل الرابط إلى مجموعة الفوج في واتساب.",
      mosque: "اسم المسجد (يظهر على بطاقة المتابعة)", groups: "الأفواج", noGroups: "لا يوجد أي فوج بعد. أضف أول فوج، مثلا «الرجال 1».",
      newGroup: "اسم الفوج الجديد", add: "إضافة", del: "حذف", delQ: n => `حذف فوج «${n}» وكل برامجه؟`, yes: "نعم، احذف", no: "إلغاء",
      plan: "تخطيط ورد الشهر", noPlan: "لم يُخطَّط أي ورد بعد.", link: "الرابط",
      from: "البداية: السورة والآية", to: "النهاية: السورة والآية", start: "تاريخ بداية الورد", parts: "عدد الأجزاء (أيام الدورة)",
      ayah: "الآية", preview: "التقسيم", table: "جدول الشهر", save: "حفظ وإنشاء الرابط", cancel: "إلغاء",
      covOk: n => `✓ تمّ التحقق: ${n} آية، دون نقص ولا تكرار`, invalid: "رقم آية غير موجود في السورة المختارة.",
      exceed: n => `عدد الأجزاء أكبر من أيام الشهر المتبقية (${n}): بعض الأجزاء لن تُقرأ هذا الشهر.`,
      pg: n => `~${n} ص`, vv: n => `${n} آية`, partsN: n => `${n} أجزاء`,
      linkTitle: "رابط الورد", linkHelp: "أرسل هذا الرابط إلى مجموعة الفوج في واتساب. يفتحه كل طالب ليبدأ ورده.",
      copy: "نسخ الرابط", copied: "تمّ نسخ الرابط", wa: "إرسال إلى واتساب", openStudent: "فتح كما يراه الطالب", close: "إغلاق",
      waMsg: (g, m, r, k, url) => `السلام عليكم ورحمة الله\nورد شهر ${m} — ${g}\n${r} (${k} أجزاء)\nافتح الرابط لتسجيل الورد اليومي:\n${url}`,
      backup: "نسخة احتياطية", backupHelp: "تُحفظ الأفواج في هذا المتصفح فقط. احفظ نسخة في ملف لاسترجاعها على جهاز آخر.",
      export: "حفظ في ملف", import: "استرجاع من ملف", imported: "تمّ استرجاع الأفواج", badFile: "الملف غير صالح.",
      day: "اليوم", date: "التاريخ", wird: "الورد", part: "الجزء", lang: "Français", dup: "يوجد فوج بهذا الاسم.",
      since: d => `ابتداء من ${d}`,
    },
    fr: {
      title: "Page de l'enseignant", lead: "Créez vos groupes une fois. À la fin de chaque mois, fixez pour chaque groupe le début et la fin du wird. L'application répartit le wird sur les jours, vérifie qu'aucun verset n'est oublié, puis vous envoyez le lien au groupe WhatsApp.",
      mosque: "Nom de la mosquée (affiché sur la fiche de suivi)", groups: "Groupes", noGroups: "Aucun groupe pour l'instant. Ajoutez le premier, par exemple « الرجال 1 ».",
      newGroup: "Nom du nouveau groupe", add: "Ajouter", del: "Supprimer", delQ: n => `Supprimer le groupe « ${n} » et tous ses programmes ?`, yes: "Oui, supprimer", no: "Annuler",
      plan: "Planifier le wird du mois", noPlan: "Aucun wird planifié.", link: "Lien",
      from: "Début : sourate et verset", to: "Fin : sourate et verset", start: "Date de début du wird", parts: "Nombre de parts (jours de la rotation)",
      ayah: "Verset", preview: "Découpage", table: "Tableau du mois", save: "Enregistrer et créer le lien", cancel: "Annuler",
      covOk: n => `✓ Vérifié : ${n} versets, aucun oublié ni répété`, invalid: "Ce numéro de verset n'existe pas dans la sourate choisie.",
      exceed: n => `Plus de parts que de jours restants dans le mois (${n}) : certaines parts ne seront pas lues ce mois-ci.`,
      pg: n => `~${n} p.`, vv: n => `${n} v.`, partsN: n => `${n} parts`,
      linkTitle: "Lien du wird", linkHelp: "Envoyez ce lien au groupe WhatsApp. Chaque élève l'ouvre pour commencer son wird.",
      copy: "Copier le lien", copied: "Lien copié", wa: "Envoyer sur WhatsApp", openStudent: "Ouvrir comme un élève", close: "Fermer",
      waMsg: (g, m, r, k, url) => `السلام عليكم ورحمة الله\nورد شهر ${m} — ${g}\n${r} (${k} أجزاء)\nافتح الرابط لتسجيل الورد اليومي:\n${url}`,
      backup: "Sauvegarde", backupHelp: "Les groupes sont enregistrés dans ce navigateur seulement. Sauvegardez-les dans un fichier pour les retrouver sur un autre appareil.",
      export: "Enregistrer dans un fichier", import: "Restaurer depuis un fichier", imported: "Groupes restaurés", badFile: "Fichier non valide.",
      day: "Jour", date: "Date", wird: "Wird", part: "Part", lang: "العربية", dup: "Un groupe porte déjà ce nom.",
      since: d => `à partir du ${d}`,
    },
  };
  const t = () => T[S.lang];

  const studentBase = () => new URL("index.html", location.href).toString();
  const toPlan = (g, p) => ({ id: g.id, group: g.name, mosque: S.mosque.trim(), start: p.start, a: p.a, b: p.b, k: p.k });
  const rangeTxt = p => `${W.verseLabel(...p.a)} ← ${W.verseLabel(...p.b)}`;
  const newId = () => Math.random().toString(36).slice(2, 8);

  function toast(msg) { UI.toast = msg; render(); clearTimeout(toast.h); toast.h = setTimeout(() => { UI.toast = null; render(); }, 2600); }

  // ---------------------------------------------------------------- rendu
  const KEEP_FOCUS = new Set(["ed-fa", "ed-ta", "ed-fs", "ed-ts", "ed-start"]);
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
    document.getElementById("app").innerHTML = viewMain();
    document.getElementById("layer").innerHTML = (UI.edit ? viewEditor() : "") + (UI.link ? viewLink() : "") +
      (UI.toast ? `<div class="toast" role="status">${e(UI.toast)}</div>` : "");
  }

  function viewMain() {
    const groups = S.groups.map(g => {
      const plans = [...g.plans].sort((x, y) => (x.start < y.start ? 1 : -1)).slice(0, 3);
      const list = plans.length ? plans.map((p, i) => `
        <div class="row small" style="border-top:1px dashed var(--line);padding-top:8px">
          <div class="grow"><b>${W.monthTxt(W.ym(p.start), ar())}</b> · ${t().since(W.dateTxt(p.start, ar()))}<br>
            <span class="quran" style="font-size:17px">${e(rangeTxt(p))}</span> · ${t().partsN(p.k)}</div>
          <button class="link" data-a="show-link" data-g="${g.id}" data-s="${p.start}">${t().link}</button>
        </div>`).join("") : `<p class="muted small">${t().noPlan}</p>`;
      const confirm = UI.confirmDel === g.id ? `
        <div class="errbox row"><span class="grow">${e(t().delQ(g.name))}</span>
          <button class="btn danger" data-a="del-yes" data-g="${g.id}">${t().yes}</button>
          <button class="btn" data-a="del-no">${t().no}</button></div>` : "";
      return `<section class="card">
        <div class="row"><h2 class="grow">${e(g.name)}</h2>
          <button class="btn primary" data-a="plan" data-g="${g.id}">${t().plan}</button>
          <button class="btn danger" data-a="del" data-g="${g.id}" aria-label="${t().del} ${e(g.name)}">${t().del}</button></div>
        ${confirm}${list}</section>`;
    }).join("");
    return `
      <header class="row"><div class="grow"><h1>وِردي · ${t().title}</h1></div>
        <button class="btn" data-a="lang">${t().lang}</button></header>
      <p class="muted">${t().lead}</p>
      <section class="card"><label for="mosque">${t().mosque}</label>
        <input id="mosque" value="${e(S.mosque)}" placeholder="جامع …" autocomplete="off"></section>
      <h2 class="k">${t().groups}</h2>
      ${groups || `<p class="muted">${t().noGroups}</p>`}
      <section class="card">
        <label for="newgroup">${t().newGroup}</label>
        <div class="row"><input id="newgroup" class="grow" style="flex:1" placeholder="الرجال 1" autocomplete="off">
          <button class="btn primary" data-a="add">${t().add}</button></div>
      </section>
      <section class="card">
        <h3>${t().backup}</h3><p class="muted small">${t().backupHelp}</p>
        <div class="row"><button class="btn" data-a="export">${t().export}</button>
          <label class="btn" for="importfile" style="color:var(--ink);font-size:16px">${t().import}</label>
          <input type="file" id="importfile" accept="application/json,.json" hidden></div>
      </section>`;
  }

  function surahOptions(v) { return W.SURAHS.map((n, i) => `<option value="${i + 1}" ${i + 1 === v ? "selected" : ""}>${i + 1}. ${n}</option>`).join(""); }

  function viewEditor() {
    const P = UI.edit, g = S.groups.find(x => x.id === P.g);
    const A = [P.fs, +P.fa], B = [P.ts, +P.ta], okA = W.valid(...A), okB = W.valid(...B), ok = okA && okB;
    const nv = ok ? Math.abs(W.idx(...B) - W.idx(...A)) + 1 : 1, mx = Math.min(31, nv), k = Math.max(1, Math.min(P.k, mx));
    const segs = ok ? W.split(A, B, k) : [], cov = ok ? W.verify(A, B, segs) : null;
    const left = W.daysIn(W.ym(P.start)) - +P.start.slice(8) + 1;
    const good = cov && !cov.problems.length;
    const status = !ok ? `<div class="errbox">${t().invalid}</div>`
      : cov.problems.length ? `<div class="errbox">${cov.problems.map(e).join("<br>")}</div>`
      : `<div class="ok">${t().covOk(cov.verses)}</div>`;
    const parts = segs.map((s, i) => `<div class="p"><span class="n">${i + 1}</span><span class="t">${e(W.label(s))}</span>
      <span class="m">${t().pg(Math.round(W.segPages(s)))} · ${t().vv(W.segVerses(s))}</span></div>`).join("");
    let table = "";
    if (good) {
      const m = W.ym(P.start), plan = { start: P.start, a: A, b: B, k };
      table = W.monthDays(m).filter(d => d >= P.start).map(d => {
        const w = W.wirdFor([plan], d);
        return `<tr><td class="d">${W.dayName(d, ar())}</td><td>${W.dateTxt(d, ar())}</td><td class="w">${e(W.label(w.seg))}</td><td>${w.part}</td></tr>`;
      }).join("");
    }
    return `<div class="overlay" data-a="close-edit"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ed-title">
      <h2 id="ed-title">${t().plan} · ${e(g.name)}</h2>
      <label for="ed-start">${t().start}</label><input type="date" id="ed-start" value="${P.start}">
      <label for="ed-fs">${t().from}</label>
      <div class="verse-in"><select id="ed-fs">${surahOptions(P.fs)}</select>
        <input id="ed-fa" inputmode="numeric" value="${e(P.fa)}" aria-label="${t().ayah}" aria-invalid="${!okA}" title="1–${W.AY[P.fs - 1]}"></div>
      <label for="ed-ts">${t().to}</label>
      <div class="verse-in"><select id="ed-ts">${surahOptions(P.ts)}</select>
        <input id="ed-ta" inputmode="numeric" value="${e(P.ta)}" aria-label="${t().ayah}" aria-invalid="${!okB}" title="1–${W.AY[P.ts - 1]}"></div>
      <div class="row"><span class="grow">${t().parts}</span>
        <span class="stepper"><button data-a="k-" ${k <= 1 ? "disabled" : ""} aria-label="−">−</button><b>${k}</b>
        <button data-a="k+" ${k >= mx ? "disabled" : ""} aria-label="+">+</button></span></div>
      ${k > left ? `<div class="errbox small">${t().exceed(left)}</div>` : ""}
      ${status}
      ${segs.length ? `<h3 class="k">${t().preview}</h3><div class="parts">${parts}</div>` : ""}
      ${table ? `<details><summary class="k" style="cursor:pointer">${t().table}</summary><div class="tablewrap"><table class="month">
        <tr><th>${t().day}</th><th>${t().date}</th><th>${t().wird}</th><th>${t().part}</th></tr>${table}</table></div></details>` : ""}
      <div class="actions"><button class="btn" data-a="close-edit">${t().cancel}</button>
        <button class="btn primary" data-a="save-plan" ${good ? "" : "disabled"}>${t().save}</button></div>
    </div></div>`;
  }

  function viewLink() {
    const { g, start } = UI.link, grp = S.groups.find(x => x.id === g), p = grp && grp.plans.find(x => x.start === start);
    if (!p) return "";
    const url = W.planLink(studentBase(), toPlan(grp, p));
    const msg = t().waMsg(grp.name, W.monthTxt(W.ym(p.start), true), rangeTxt(p), p.k, url);
    return `<div class="overlay" data-a="close-link"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ln-title">
      <h2 id="ln-title">${t().linkTitle} · ${e(grp.name)} · ${W.monthTxt(W.ym(p.start), ar())}</h2>
      <p class="muted small">${t().linkHelp}</p>
      <textarea id="linktext" rows="4" readonly dir="ltr" style="font-size:13px">${e(url)}</textarea>
      <div class="actions" style="justify-content:flex-start">
        <a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${t().wa}</a>
        <button class="btn" data-a="copy">${t().copy}</button>
        <a class="btn" href="${e(url)}" target="_blank" rel="noopener">${t().openStudent}</a>
        <button class="btn" data-a="close-link">${t().close}</button></div>
    </div></div>`;
  }

  // ---------------------------------------------------------------- actions
  function openEditor(g) {
    const last = [...g.plans].sort((x, y) => (x.start < y.start ? -1 : 1)).pop();
    const next = W.addMonths(W.ym(W.today()), 1) + "-01";
    const a = last ? last.a : [78, 1], b = last ? last.b : [114, 6];
    UI.edit = { g: g.id, start: next, fs: a[0], fa: String(a[1]), ts: b[0], ta: String(b[1]), k: last ? last.k : W.suggest(a, b), touched: !!last };
  }

  document.addEventListener("click", ev => {
    const el = ev.target.closest("[data-a]");
    if (!el) return;
    const a = el.dataset.a;
    if ((a === "close-edit" || a === "close-link") && el.classList.contains("overlay") && ev.target !== el) return;
    const g = S.groups.find(x => x.id === el.dataset.g);
    switch (a) {
      case "lang": S.lang = ar() ? "fr" : "ar"; save(); break;
      case "add": {
        const inp = document.getElementById("newgroup"), name = inp.value.trim();
        if (!name) { inp.focus(); return; }
        if (S.groups.some(x => x.name === name)) { toast(t().dup); return; }
        S.groups.push({ id: newId(), name, plans: [] }); save(); break;
      }
      case "del": UI.confirmDel = el.dataset.g; break;
      case "del-no": UI.confirmDel = null; break;
      case "del-yes": S.groups = S.groups.filter(x => x.id !== el.dataset.g); UI.confirmDel = null; save(); break;
      case "plan": openEditor(g); break;
      case "close-edit": UI.edit = null; break;
      case "close-link": UI.link = null; break;
      case "k-": UI.edit.k = Math.max(1, UI.edit.k - 1); UI.edit.touched = true; break;
      case "k+": UI.edit.k = UI.edit.k + 1; UI.edit.touched = true; break;
      case "save-plan": {
        const P = UI.edit, grp = S.groups.find(x => x.id === P.g);
        const A = [P.fs, +P.fa], B = [P.ts, +P.ta];
        if (!W.valid(...A) || !W.valid(...B)) return;
        const [lo, hi] = W.idx(...A) <= W.idx(...B) ? [A, B] : [B, A];
        const k = Math.max(1, Math.min(P.k, 31, W.idx(...hi) - W.idx(...lo) + 1));
        if (W.verify(lo, hi, W.split(lo, hi, k)).problems.length) return;
        grp.plans = grp.plans.filter(x => x.start !== P.start).concat({ start: P.start, a: lo, b: hi, k });
        save(); UI.edit = null; UI.link = { g: grp.id, start: P.start }; break;
      }
      case "show-link": UI.link = { g: el.dataset.g, start: el.dataset.s }; break;
      case "copy": {
        const ta = document.getElementById("linktext");
        const done = () => toast(t().copied);
        if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); });
        else ta.select();
        return;
      }
      case "export": {
        const blob = new Blob([JSON.stringify({ app: "wirdi", version: 1, ...S }, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href = url; link.download = `wirdi-afwaj-${W.today()}.json`; document.body.appendChild(link); link.click();
        setTimeout(() => { URL.revokeObjectURL(url); link.remove(); }, 1000);
        return;
      }
      default: return;
    }
    render();
  });

  document.addEventListener("change", ev => {
    const id = ev.target.id, v = ev.target.value;
    if (id === "mosque") { S.mosque = v.trim(); save(); return; }
    if (id === "importfile" && ev.target.files[0]) {
      ev.target.files[0].text().then(txt => {
        try {
          const d = JSON.parse(txt);
          if (d.app !== "wirdi" || !Array.isArray(d.groups)) throw new Error();
          S = { ...DEF, mosque: d.mosque || "", lang: S.lang, groups: d.groups };
          save(); toast(t().imported);
        } catch (err) { toast(t().badFile); }
      });
      return;
    }
    if (!UI.edit) return;
    const P = UI.edit;
    if (id === "ed-start" && v) P.start = v;
    if (id === "ed-fs") { P.fs = +v; P.fa = "1"; }
    if (id === "ed-ts") { P.ts = +v; P.ta = String(W.AY[P.ts - 1]); }
    if (id === "ed-fa" || id === "ed-ta") return;          // déjà pris en compte pendant la saisie
    autoParts(P);
    render();
  });
  // Numéros de verset : mis à jour pendant la saisie (aperçu et vérification en direct).
  document.addEventListener("input", ev => {
    const id = ev.target.id;
    if (!UI.edit || (id !== "ed-fa" && id !== "ed-ta")) return;
    const v = ev.target.value.replace(/\D/g, "").slice(0, 3);
    if (id === "ed-fa") UI.edit.fa = v; else UI.edit.ta = v;
    autoParts(UI.edit);
    render();
  });
  function autoParts(P) {
    if (!P.touched && W.valid(P.fs, +P.fa) && W.valid(P.ts, +P.ta)) P.k = W.suggest([P.fs, +P.fa], [P.ts, +P.ta]);
  }
  document.addEventListener("keydown", ev => {
    if (ev.key === "Enter" && ev.target.id === "newgroup") document.querySelector('[data-a="add"]').click();
    if (ev.key === "Escape" && (UI.edit || UI.link)) { UI.edit = null; UI.link = null; render(); }
  });

  render();
})();
