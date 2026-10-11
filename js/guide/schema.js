export const KINDS = { tool: 1, article: 1, flow: 1 };
export const LEVELS = [null, { n: "مبتدئ" }, { n: "متوسط" }, { n: "متقدم" }];
export const STEPS_DO = new Set(["begin", "setOpt", "say", "feed", "enter", "finish", "restore"]);
export function validateLesson(L, where) {
const msgs = [];
const w = where || (L && L.id) || "?";
if (!L || !L.id) return [`${w}: لا id`];
if (!KINDS[L.kind]) msgs.push(`${w}: kind غير معروف («${L.kind}»)`);
if (typeof L.title !== "string" || !L.title.trim())
msgs.push(`${w}: title فارغ`);
if (!(L.level >= 1 && L.level <= 3)) msgs.push(`${w}: level خارج 1..3`);
if (!Number.isFinite(L.minutes)) msgs.push(`${w}: minutes غير رقم`);
if (!Array.isArray(L.goals)) msgs.push(`${w}: goals ليست مصفوفة`);
if (!Array.isArray(L.why)) msgs.push(`${w}: why ليس مصفوفة`);
(L.script || []).forEach((s, i) => {
if (!s || !STEPS_DO.has(s.do)) msgs.push(`${w}.script[${i}]: do غير معروف`);
if (s.do === "feed" && s.val == null) msgs.push(`${w}.script[${i}]: feed بلا val`);
});
(L.exercises || []).forEach((e, i) => {
if (!e || typeof e.assert !== "function")
msgs.push(`${w}.exercises[${i}]: assert ليست دالّة`);
});
return msgs;
}
