import { toolList } from "../tools/registry.js";
import { autoLessons } from "./auto.js";
import { COURSES } from "./courses.js";
import { norm, toLat, score } from "../ui/searchcommon.js";
let LESS = null;
export function lessons(force) {
if (force || !LESS) LESS = autoLessons(force);
return LESS;
}
export const lessonById = id => lessons().find(l => l.id === id) || null;
function hayOf(l) {
return [l.id, l.title,
...(l.aliases || []),
...(l.goals || []),
...(l.why || [])].filter(Boolean).join(" ");
}
function entryOf(l) {
return {
kind: "lesson", id: l.id,
title: l.kind === "tool" ? "شرح: " + l.title : l.title,
level: l.level, minutes: l.minutes, icon: l.icon,
placement: l.placement,
hay: hayOf(l) + " شرح تعلم كيف بطاقة",
lesson: l
};
}
function courseEntries() {
return COURSES.map(c => ({
kind: "course", id: c.id, title: c.title,
hay: norm(c.title + " " + c.units.map(u => u.title).join(" ")),
lesson: null, course: c
}));
}
export function guideEntries() {
return [
...lessons().map(entryOf),
...courseEntries()
];
}
export function search(q, limit = 12) {
const n = norm(q), na = norm(toLat(q));
const base = guideEntries();
if (!n) return base.slice(0, limit).map(it => ({ it, s: 1 }));
return base
.map(it => ({ it, s: Math.max(score(it.hay, n), na !== n ? score(it.hay, na) : 0) }))
.filter(x => x.s > 0)
.sort((a, b) => b.s - a.s)
.slice(0, limit);
}
export function coverage() {
const ids = toolList().map(d => d.id);
const have = new Set(
lessons().filter(l => l.kind === "tool").map(l => l.id));
const missing = ids.filter(id => !have.has(id));
const total = ids.length;
return {
total,
covered: total - missing.length,
missing,
pct: total ? Math.round((total - missing.length) / total * 100) : 100
};
}
