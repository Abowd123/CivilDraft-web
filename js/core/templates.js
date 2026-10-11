import {S,edit} from "./state.js";
import {addWall} from "./walls.js";
import {addOpen} from "./opens.js";
import {regionAt,addArea} from "./areas.js";
import {regionLoops} from "./render.js";
import {addAxis} from "./dims.js";
const T = new Map();
export function defineTemplate(t) { if (!t || !t.name) throw new Error("template: name"); T.set(t.name, t); return t; }
export const templateList = () => [...T.values()].map(t => ({ name: t.name, title: t.title || t.name }));
export const getTemplate = name => T.get(name) || null;
export function build(name) {
const t = T.get(name); if (!t) return null;
return typeof t.build === "function" ? t.build() : JSON.parse(JSON.stringify(t.seed || {}));
}
export const wallArgs = w => [w.a, w.b, w.th, w.type || "int", "c", w.h];
let RUNNER = null;
export const setScriptRunner = f => { RUNNER = (typeof f === "function") ? f : null; };
export const isScript = name => !!(T.get(name) && T.get(name).script);
export function apply(name) {
const t = T.get(name);
if (t && t.script) {
if (!RUNNER) throw new Error(`القالب «${t.title || name}» يحتاج منفِّذ الأدوات`);
return RUNNER(t);
}
const seed = build(name); if (!seed) return null;
return edit(() => {
const walls = (seed.walls || []).map(w => addWall(...wallArgs(w)));
const opens = (seed.opens || []).map(o => {
const target = walls[o.wallIndex || 0];
if (!target)
throw new Error(`فتحة القالب: لا جدار بالفهرس ${o.wallIndex||0}`);
return addOpen(target, o.s, o.kind || "door", o.w, o.h, o.sill,
{ hinge: o.hinge, swing: o.swing, pan: o.pan });
});
const areas = [];
if ((seed.areas || []).length) {
const loops = regionLoops();
(seed.areas || []).forEach(ar => {
const ring = regionAt(loops, ar.at[0], ar.at[1]);
if (!ring)
throw new Error(`منطقة القالب «${ar.name || ""}»: لا حلقةَ مغلقة `
+ `عند (${ar.at[0]}، ${ar.at[1]})`);
areas.push(addArea(ring, ar.name || "", { showArea: 1 }));
});
}
let axes = 0;
const AX = seed.axes || {};
[["x", AX.xs], ["y", AX.ys]].forEach(([d, L]) => (L || []).forEach(v => {
const A = (d === "y") ? S.grid.ys : S.grid.xs;
if (A.some(x => Math.abs(x - v) < 20)) return;
addAxis(d, v); axes++;
}));
if (seed.meta && seed.meta.scale) S.meta.scale = seed.meta.scale;
return { walls, opens, areas, axes };
}, `تطبيق قالب ${name}`);
}
const room = (w, h, th = 150, type = "ext") => [
{ a: [0, 0], b: [w, 0], th, type }, { a: [w, 0], b: [w, h], th, type },
{ a: [w, h], b: [0, h], th, type }, { a: [0, h], b: [0, 0], th, type }
];
export function installDefaults() {
defineTemplate({ name: "room", title: "غرفة مستطيلة", build: () => ({
walls: room(4000, 3000),
opens: [{ wallIndex: 0, s: 1600, kind: "door", w: 900, h: 2100, sill: 0 }],
meta: { scale: 50 }
})});
defineTemplate({ name: "studio", title: "استوديو", build: () => ({
walls: room(6000, 4000),
opens: [
{ wallIndex: 0, s: 2500, kind: "door", w: 900, h: 2100, sill: 0 },
{ wallIndex: 2, s: 1700, kind: "window", w: 1200, h: 1400, sill: 900 }
],
meta: { scale: 75 }
})});
defineTemplate({ name: "office", title: "مكتب", build: () => ({
walls: [...room(8000, 5000), { a: [5000, 0], b: [5000, 5000], th: 150, type: "int" }],
opens: [
{ wallIndex: 0, s: 2000, kind: "door", w: 900, h: 2100, sill: 0 },
{ wallIndex: 4, s: 2500, kind: "door", w: 900, h: 2100, sill: 0 },
{ wallIndex: 2, s: 1700, kind: "window", w: 1200, h: 1400, sill: 900 }
],
meta: { scale: 100 }
})});
installHomes();
installPlans();
}
function installPlans() {
defineTemplate({ name: "grid10x9", title: "بيت ١٠×٩ م بمحاور", build: () => ({
walls: [
X([0, 0], [10000, 0]), X([10000, 0], [10000, 9000]),
X([10000, 9000], [0, 9000]), X([0, 9000], [0, 0]),
I([0, 6000], [4500, 6000]),
I([6000, 6000], [10000, 6000]),
I([4500, 6000], [4500, 9000]),
I([6000, 6000], [6000, 9000]),
I([4500, 7400], [6000, 7400]),
I([3000, 3000], [3000, 6000]),
I([6000, 3000], [6000, 6000]),
I([0, 3000], [3000, 3000]),
I([4500, 3000], [6000, 3000]),
I([6000, 3000], [10000, 3000]),
I([4500, 0], [4500, 1600]),
I([6000, 0], [6000, 3000]),
I([4500, 1600], [6000, 1600])
],
opens: [
D(3, 7600, 1000),
D(6, 900, 800), D(7, 900, 800),
D(8, 750, 700),
D(9, 2200, 800), D(10, 2200, 800),
D(15, 2300, 800),
D(16, 750, 700),
N(2, 7750, 1500, 1400, 900, 2),
N(2, 2000, 1500, 1400, 900, 2),
WET(2, 4750),
N(3, 4500, 1200, 1400, 900, 2),
N(1, 4500, 1200, 1000, 1100, 2),
N(0, 2250, 1500, 1400, 900, 2),
WET(0, 5250),
N(0, 8000, 1800, 1400, 900, 2)
],
areas: [
{ at: [2250, 7500], name: "غرفة نوم ١" }, { at: [5250, 8200], name: "حمّام" },
{ at: [8000, 7500], name: "غرفة نوم رئيسية" }, { at: [1500, 4500], name: "غرفة نوم ٢" },
{ at: [8000, 4500], name: "مطبخ" }, { at: [2000, 1500], name: "صالة وممرّ" },
{ at: [5250, 800], name: "حمّام ضيوف" }, { at: [8000, 1500], name: "مجلس" }
],
axes: { xs: [0, 3000, 4500, 6000, 10000], ys: [0, 3000, 6000, 9000] },
meta: { scale: 100 }
})});
const twin = () => {
const walls = [
X([0, 0], [10000, 0]), X([10000, 0], [10000, 15000]),
X([10000, 15000], [0, 15000]), X([0, 15000], [0, 0])
];
const opens = [D(1, 7500, 1200)];
const half = (f, top) => {
const i0 = walls.length, w = (a, b) => walls.push(I(a.map((v, k) => k ? f(v) : v), b.map((v, k) => k ? f(v) : v))) - 1;
const yA = w([0, 4000], [2000, 4000]);
const yB = w([2000, 4000], [3200, 4000]);
const yC = w([3200, 4000], [6600, 4000]);
const xB = w([2000, 4000], [2000, 5300]);
const yD = w([0, 5300], [3200, 5300]);
if (!top) w([0, 7500], [3200, 7500]);
const x1 = w([3200, 0], [3200, 4000]);
const x2 = w([3200, 5300], [3200, 7500]);
const x3 = w([6600, 0], [6600, 5000]);
const yF = w([6600, 5000], [10000, 5000]);
const xW = w([8400, 5000], [8400, 6300]);
const yG = w([8400, 6300], [10000, 6300]);
opens.push(D(yB, 600, 800), D(yC, 1700, 900), D(xB, 650, 700),
D(x2, 1100, 800), D(yF, 900, 800), D(xW, 650, 700));
return i0;
};
half(y => y, 0);
half(y => 15000 - y, 1);
return { walls, opens };
};
defineTemplate({ name: "twin15", title: "عمارة شقّتين متناظرتين ١٠×١٥ م", build: () => {
const { walls, opens } = twin();
const S0 = n => walls.findIndex(w => w.type === "ext" && n(w));
const south = S0(w => w.a[1] === 0 && w.b[1] === 0), north = S0(w => w.a[1] === 15000 && w.b[1] === 15000);
const west = S0(w => w.a[0] === 0 && w.b[0] === 0), east = S0(w => w.a[0] === 10000 && w.b[0] === 10000);
opens.push(
N(south, 1600, 1500, 1400, 900, 2), N(south, 4900, 1500, 1400, 900, 2), N(south, 8300, 1500, 1400, 900, 2),
N(north, 1700, 1500, 1400, 900, 2), N(north, 5100, 1500, 1400, 900, 2), N(north, 8400, 1500, 1400, 900, 2),
N(west, 8600, 1200, 1400, 900, 2), N(west, 6400, 1200, 1400, 900, 2),
WET(west, 10350), WET(west, 4650), WET(east, 5650), WET(east, 9350));
return { walls, opens,
areas: [
{ at: [1600, 2000], name: "غرفة نوم ١" }, { at: [4900, 2000], name: "غرفة نوم ٢" },
{ at: [8300, 2500], name: "صالة ١" }, { at: [1000, 4650], name: "حمّام ١" },
{ at: [1600, 6400], name: "غرفة ١أ" }, { at: [9250, 5650], name: "حمّام ١ب" },
{ at: [1600, 13000], name: "غرفة نوم ٣" }, { at: [4900, 13000], name: "غرفة نوم ٤" },
{ at: [8300, 12500], name: "صالة ٢" }, { at: [1000, 10350], name: "حمّام ٢" },
{ at: [1600, 8600], name: "غرفة ٢أ" }, { at: [9250, 9350], name: "حمّام ٢ب" },
{ at: [4900, 7500], name: "ممرّ ومدخل" }
],
meta: { scale: 100 } };
}});
}
const X = (a, b) => ({ a, b, th: 250, type: "ext" });
const I = (a, b) => ({ a, b, th: 150, type: "int" });
const D = (wallIndex, s, w = 900) => ({ wallIndex, s, kind: "door", w, h: 2100, sill: 0 });
const O = (wallIndex, s, w) => ({ wallIndex, s, kind: "opening", w, h: 2100, sill: 0 });
const N = (wallIndex, s, w, h, sill, pan) =>
({ wallIndex, s, kind: "window", w, h, sill, pan });
const WET = (wallIndex, s) => N(wallIndex, s, 600, 600, 1600, 1);
function installHomes() {
defineTemplate({ name: "villa", title: "فيلا دور أرضي", build: () => ({
walls: [
X([0, 0], [14000, 0]), X([14000, 0], [14000, 10000]),
X([14000, 10000], [0, 10000]), X([0, 10000], [0, 0]),
I([4500, 0], [4500, 4500]),
I([6500, 0], [6500, 4500]),
I([11000, 0], [11000, 4500]),
I([0, 4500], [4500, 4500]),
I([4500, 4500], [6500, 4500]),
I([6500, 4500], [11000, 4500]),
I([11000, 4500], [14000, 4500]),
I([0, 6000], [3500, 6000]),
I([3500, 6000], [5200, 6000]),
I([6500, 6000], [10000, 6000]),
I([10000, 6000], [11300, 6000]),
I([11300, 6000], [14000, 6000]),
I([3500, 6000], [3500, 10000]),
I([5200, 6000], [5200, 10000]),
I([3500, 8000], [5200, 8000]),
I([6500, 6000], [6500, 10000]),
I([10000, 6000], [10000, 10000]),
I([11300, 6000], [11300, 10000])
],
opens: [
{ ...D(0, 5500, 1200), kind: "double", h: 2200 },
N(0, 2250, 2000, 1600, 900, 2),
N(0, 8750, 2000, 1600, 900, 2),
N(0, 12500, 1500, 1400, 900, 2),
D(4, 2250),
O(5, 2250, 1500),
O(6, 2250, 1500),
O(8, 1000, 1200),
D(11, 1750),
D(15, 1350),
O(14, 650, 1000),
D(17, 1000, 700),
D(17, 3000, 700),
D(19, 2000),
N(3, 2000, 1500, 1400, 900, 2),
N(2, 5750, 1200, 1000, 1100, 2),
WET(2, 9650),
N(2, 1350, 1500, 1400, 900, 2)
],
areas: [
{ at: [2250, 2250], name: "مجلس رجال" }, { at: [5500, 2250], name: "مدخل" },
{ at: [8750, 2250], name: "صالة عائلية" }, { at: [12500, 2250], name: "غرفة طعام" },
{ at: [2000, 5250], name: "ممر توزيع" }, { at: [1750, 8000], name: "غرفة خادمة" },
{ at: [4350, 7000], name: "دورة مياه خدمة" }, { at: [4350, 9000], name: "دورة مياه ضيوف" },
{ at: [8250, 8000], name: "مطبخ" }, { at: [10650, 8000], name: "سلّم" },
{ at: [12650, 8000], name: "مكتب" }
],
meta: { scale: 100 }
})});
defineTemplate({ name: "apt3", title: "شقة ٣ غرف", build: () => ({
walls: [
X([0, 0], [12000, 0]), X([12000, 0], [12000, 10000]),
X([12000, 10000], [0, 10000]), X([0, 10000], [0, 0]),
I([5500, 0], [5500, 4500]),
I([7000, 0], [7000, 4500]),
I([0, 4500], [5500, 4500]),
I([5500, 4500], [7000, 4500]),
I([7000, 4500], [10400, 4500]),
I([10400, 4500], [12000, 4500]),
I([10400, 2900], [10400, 4500]),
I([10400, 2900], [12000, 2900]),
I([0, 6000], [4300, 6000]),
I([4300, 6000], [7800, 6000]),
I([7800, 6000], [12000, 6000]),
I([4300, 6000], [4300, 10000]),
I([7800, 6000], [7800, 10000]),
I([1600, 8000], [1600, 10000]),
I([0, 8000], [1600, 8000])
],
opens: [
D(0, 6250, 1000),
N(0, 2750, 2000, 1600, 900, 2),
N(0, 8700, 1200, 1000, 1100, 2),
O(4, 2250, 1800),
D(5, 2250, 800),
O(7, 750, 1200),
D(9, 800, 700),
WET(1, 3700),
D(12, 3500), D(13, 2700), D(14, 3300),
D(17, 1000, 700),
N(2, 9000, 1500, 1400, 900, 2),
N(2, 5950, 1500, 1400, 900, 2),
N(2, 2100, 1500, 1400, 900, 2),
WET(2, 11200)
],
areas: [
{ at: [2750, 2250], name: "صالة" }, { at: [6250, 2250], name: "مدخل" },
{ at: [3000, 5250], name: "ممر" }, { at: [8700, 2250], name: "مطبخ" },
{ at: [11200, 3700], name: "حمام مشترك" }, { at: [3000, 8000], name: "غرفة نوم رئيسية" },
{ at: [800, 9000], name: "حمام رئيسي" }, { at: [6050, 8000], name: "غرفة نوم ٢" },
{ at: [9900, 8000], name: "غرفة نوم ٣" }
],
meta: { scale: 100 }
})});
}
