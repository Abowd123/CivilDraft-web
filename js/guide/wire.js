import { UILIM } from "../core/limits.js";
import { floaterOpen, floaterBody, floaterClose, floaterIsOpen } from "./floater.js";
import { lessonById, guideEntries, coverage } from "./catalog.js";
import { courseById } from "./courses.js";
import { renderLesson } from "./viewer.js";
import { createSession, demoLesson } from "./engine.js";
import { makeSketch } from "./sketch.js";
import { bindOnce } from "../core/delegate.js";
import { escapeHtml as esc } from "../core/escape.js";
let D = null;
export function guideRegister(deps) {
D = deps || {};
if (D.ACT) D.ACT.guide = { fn: () => guideOpen() };
if (D.extendPalette) {
D.extendPalette(guideEntries().map(e => ({
id: e.id, title: e.title, kind: e.kind,
sub: (e.kind === "course") ? "مسار تعلّم" : (e.kind === "article" ? "مقال" : "درس"),
hay: esc(e.hay || e.title)
})));
}
return { open: guideOpen, close: guideClose, isOpen: guideIsOpen };
}
export const guideIsOpen = () => floaterIsOpen();
function renderIndex(body) {
const c = coverage();
body.innerHTML = `
 <div class="gd-home">
  <div class="gd-cov">التغطية: <b>${c.covered}</b>/${c.total} أداة ·
   <span class="gd-pct">${c.pct}%</span></div>
  <div class="gd-search"><input type="text" placeholder="ابحث عن أداة أو مقال..." class="gd-q"></div>
  <div class="gd-results"></div>
 </div>`;
const input = body.querySelector(".gd-q");
const res = body.querySelector(".gd-results");
import("./catalog.js").then(({ search }) => {
input.addEventListener("input", () => {
const r = search(input.value);
res.innerHTML = r.length ? r.slice(0, UILIM.menuResults.def).map(x => `
     <button class="gd-res-i" data-gd-open="${esc(x.it.id)}">
      <span>${esc(x.it.title)}</span>
      <small>${x.it.kind === "course" ? "مسار" : (x.it.kind === "article" ? "مقال" : "أداة")}</small>
     </button>`).join("") : `<div class="gd-empty">لا نتائج</div>`;
});
input.dispatchEvent(new Event("input"));
});
res.addEventListener("click", e => {
const b = e.target.closest("[data-gd-open]");
if (b) guideOpen(b.dataset.gdOpen);
});
}
function renderCourse(body, L) {
let session = createSession(L);
const recipients = renderLesson(body, L, {
onMode: m => startMode(session, L, m),
onTry: () => {
floaterClose();
if (D && D.R) D.R.begin(L.id);
if (D && D.HOOK) { D.HOOK.prompt(); D.HOOK.refresh(true); }
},
onRelated: id => guideOpen(id)
});
const cv = recipients.canvas;
let sketch = null;
if (cv) { try { sketch = makeSketch(cv); } catch (e) {} }
function paint() { if (sketch) try { sketch.paint(); } catch (e) {} }
paint();
function startMode(sess, L, m) {
if (recipients.clearEvents) recipients.clearEvents();
let cur = sess;
if (cur.finished) cur = createSession(L);
session = cur;
if (m === "demo") {
recipients.setStep("عرض تلقائي — شاهد الأداة تعمل");
const s2 = demoLesson(L);
s2.events.forEach(n => { if (recipients.showEvent) recipients.showEvent(n); });
paint();
s2.restore();
paint();
return;
}
cur.start();
if (m === "guide") {
recipients.setStep("تدرّب موجّه — انقر في اللوحة كما يطلب السطر");
} else {
const ex = (L.exercises || [])[0];
recipients.setStep(ex ? ("تمرين: " + ex.goal) : "تمرين حر");
}
if (cv) cv.onclick = e => {
if (!sketch) return;
const w = sketch.toWorld(e.offsetX, e.offsetY);
feed(cur, w);
};
paint();
}
function feed(sess, w) {
try {
sess._step({ do: "feed", val: [Math.round(w[0]), Math.round(w[1])] });
} catch (e) {
if (recipients.showEvent) recipients.showEvent({ c: "er", m: e.message });
}
sess.events.slice(-2).forEach(n => {
if (recipients.showEvent && n.c) recipients.showEvent(n);
});
paint();
}
}
export function guideOpen(id) {
const body = floaterBody();
const f = floaterOpen();
if (id) {
const L = lessonById(id);
const C = courseById(id);
if (C) renderCourseBody(body, { learn: C });
else if (L) renderCourse(body, L);
else renderMissing(body, id);
} else renderIndex(body);
return f;
}
export function guideClose() { floaterClose(); }
function renderMissing(body, id) {
body.innerHTML = `<div class="gd-miss">«${esc(id)}» لا درس مرافقاً له بعد — `
+ `يتولّد شرحُه الأساسي تلقائياً من سجلّ الأدوات.</div>`;
}
function renderCourseBody(body, { learn }) {
const c = learn;
const rows = c.units.map(u => `
   <div class="gd-unit"><h5>${esc(u.title)}</h5>${u.lessons.map(id => `
    <button class="gd-lesson" data-gd-open="${esc(id)}">
     ${esc((lessonById(id) || {}).title || id)}</button>`).join("")}</div>`);
body.innerHTML = `<header class="gd-head"><div class="gd-t">${esc(c.title)}</div>`
+ `<div class="gd-m">${c.units.length} وحدات</div></header>${rows.join("")}`;
bindOnce(body, "click", e => {
const b = e.target.closest("[data-gd-open]");
if (b) guideOpen(b.dataset.gdOpen);
}, "gdCourse");
}
