const KEY = "civildraft.guide.usage";
export const USED = {};
let T = null;
export function loadUsage() {
if (typeof localStorage === "undefined") return false;
try {
const raw = localStorage.getItem(KEY);
if (!raw) return false;
const d = JSON.parse(raw);
if (d && typeof d === "object") {
Object.keys(d).slice(0, 400).forEach(k => { USED[k] = d[k] ? 1 : 0; });
}
return true;
} catch (e) { return false; }
}
function saveUsage() {
if (typeof localStorage === "undefined") return;
if (T) clearTimeout(T);
T = setTimeout(() => {
T = null;
try { localStorage.setItem(KEY, JSON.stringify(USED)); } catch (e) {}
}, 500);
}
export const usedBefore = id => !!USED[id];
export function markUsed(id) {
if (!id || USED[id]) return false;
USED[id] = 1; saveUsage();
return true;
}
export function usageCoverage(coverageFn) {
const c = coverageFn();
const usedCount = Object.keys(USED).filter(k => USED[k]).length;
return { ...c, usedCount, usedPct: c.total ? Math.round(usedCount / c.total * 100) : 0 };
}
