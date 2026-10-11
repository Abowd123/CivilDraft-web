import {newId} from "./units.js";
import {BLK_LAY} from "./laydef.js";
import {V} from "./validate.js";
import {LIM} from "./limits.js";
import {distSeg} from "./geom.js";
const DEFS = new Map();
const SAFE_NAME=/^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
export function safeBlockName(name){
const n=String(name==null?"":name);
if(!SAFE_NAME.test(n))
throw new Error(`اسم الكتلة «${n.slice(0,40)}» غير صالح — `
+`يبدأ بحرف لاتيني ويحوي حروفاً وأرقاماً و-_ فقط، بحدّ 64`);
return n;
}
const HTML_KEYS=["html","innerHTML","outerHTML"];
function checkPrims(prims){
if(!Array.isArray(prims))return;
prims.forEach((p,i)=>{
if(!p||typeof p!=="object")return;
HTML_KEYS.forEach(k=>{
if(k in p)
throw new Error(`primitive #${i}: حقل «${k}» محظور — `
+`الأوّليات بياناتٌ هندسية لا HTML`);
});
});
}
let HOOK=()=>{};
export const installBlockHook=f=>{
HOOK=(typeof f==="function")?f:(()=>{});
};
let SNAP=()=>null;
export const installBlockSnapshotFn=f=>{
SNAP=(typeof f==="function")?f:(()=>null);
};
let SILENT=0;
function notifyBlockChange(what,name,pre){
if(SILENT)return;
HOOK(what,name,pre);
}
export function defineBlock(def) {
if (!def || !def.name) throw new Error("block: name مطلوب");
const name = safeBlockName(def.name);
if (!DEFS.has(name) && DEFS.size >= LIM.blockDefs.max)
throw new Error(`لا يمكن تعريف كتلة جديدة «${name.slice(0, 40)}» — `
+ `بلغ عدد التعريفات الحدّ الأقصى (${LIM.blockDefs.max})؛ `
+ `احذف كتلاً غير مستعملة أولاً`);
const pre=SILENT?null:SNAP();
const d = { base: [0, 0], prims: [], ...def, name };
if (!Array.isArray(d.prims)) d.prims = [];
checkPrims(d.prims);
DEFS.set(name, d);
notifyBlockChange("define",name,pre);
return d;
}
export const getBlock = name => DEFS.get(name) || null;
export const hasBlock = name => DEFS.has(name);
export const blockList = () =>
[...DEFS.values()].map(d => ({ name: d.name, title: d.title || d.name }));
let USE=()=>0;
export const installBlockUsageFn=f=>{
USE=(typeof f==="function")?f:(()=>0);
};
export const blockUses=name=>USE(name)|0;
export function removeBlock(name,opts){
const had=DEFS.has(name);
if(had&&!(opts&&opts.force)){
const n=blockUses(name);
if(n>0)throw new Error(
`الكتلة «${name}» مستعملةٌ في ${n} مثيلاً — احذف مثيلاتها أولاً`);
}
const pre=had?SNAP():null;
DEFS.delete(name);
if(had)notifyBlockChange("remove",name,pre);
return had;
}
export function defineFromPrims(name, title, prims, base = [0, 0]) {
const local = (prims || []).map(p => translate(p, -(base[0] || 0), -(base[1] || 0)));
return defineBlock({ name, title, prims: local, base: [0, 0] });
}
export function makeInstance(name, opts = {}) {
if (!DEFS.has(name)) throw new Error("block غير معرّف: " + name);
return {
id: opts.id || newId("b"),
block: name,
x: Number.isFinite(+opts.x) ? +opts.x : 0,
y: Number.isFinite(+opts.y) ? +opts.y : 0,
rot: Number.isFinite(+opts.rot) ? +opts.rot : 0,
scale: Number.isFinite(+opts.scale) && +opts.scale > 0 ? +opts.scale : 1,
scaleX: Number.isFinite(+opts.scaleX) && +opts.scaleX > 0 ? +opts.scaleX : 1,
scaleY: Number.isFinite(+opts.scaleY) && +opts.scaleY > 0 ? +opts.scaleY : 1,
mirror: opts.mirror ? 1 : 0,
layer: opts.layer || BLK_LAY
};
}
function xform(inst) {
const c = Math.cos(inst.rot || 0), s = Math.sin(inst.rot || 0);
const k = Number.isFinite(+inst.scale) && +inst.scale > 0 ? +inst.scale : 1;
const kx = k * (Number.isFinite(+inst.scaleX) && +inst.scaleX > 0 ? +inst.scaleX : 1);
const ky = k * (Number.isFinite(+inst.scaleY) && +inst.scaleY > 0 ? +inst.scaleY : 1);
const mx = inst.mirror ? -1 : 1;
return ([px, py]) => {
const lx = px * kx * mx, ly = py * ky;
return [inst.x + lx * c - ly * s, inst.y + lx * s + ly * c];
};
}
function arcPts(c, r, a0, a1) {
const span = a1 - a0;
const n = Math.max(2, Math.ceil(Math.abs(span) / (Math.PI / 12)));
const out = [];
for (let i = 0; i <= n; i++) {
const a = a0 + span * i / n;
out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
}
return out;
}
export function explode(inst) {
const def = DEFS.get(inst && inst.block);
if (!def) return [];
const T = xform(inst), out = [];
const k = Number.isFinite(+inst.scale) && +inst.scale > 0 ? +inst.scale : 1;
const sx = Number.isFinite(+inst.scaleX) && +inst.scaleX > 0 ? +inst.scaleX : 1;
const sy = Number.isFinite(+inst.scaleY) && +inst.scaleY > 0 ? +inst.scaleY : 1;
const rigid = Math.abs(k * sx - k * sy) < 1e-9;
const th = +inst.rot || 0;
for (const p of def.prims) {
if (p.t === "line") {
out.push({ t: "line", a: T(p.a), b: T(p.b), layer: inst.layer });
} else if (p.t === "pline") {
out.push({ t: "pline", pts: p.pts.map(T), closed: !!p.closed, layer: inst.layer });
} else if (p.t === "circle") {
if (rigid) {
const c = T(p.c);
out.push({ t: "arc", cx: c[0], cy: c[1], r: Math.abs(p.r) * k * sx,
a0: 0, a1: 360, layer: inst.layer });
} else {
out.push({ t: "pline", pts: arcPts(p.c, p.r, 0, Math.PI * 2).map(T),
closed: true, layer: inst.layer });
}
} else if (p.t === "arc") {
if (rigid) {
const c = T(p.c);
let a0, a1;
if (inst.mirror) { a0 = th + Math.PI - p.a0; a1 = th + Math.PI - p.a1; }
else { a0 = th + p.a0; a1 = th + p.a1; }
out.push({ t: "arc", cx: c[0], cy: c[1], r: Math.abs(p.r) * k * sx,
a0: a0 * 180 / Math.PI, a1: a1 * 180 / Math.PI, layer: inst.layer });
} else {
out.push({ t: "pline", pts: arcPts(p.c, p.r, p.a0, p.a1).map(T),
closed: false, layer: inst.layer });
}
}
}
return out;
}
export function bbox(inst) {
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
const put = (x, y) => {
minX = Math.min(minX, x); minY = Math.min(minY, y);
maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
};
for (const p of explode(inst)) {
let pts = [];
if (p.t === "line") pts = [p.a, p.b];
else if (p.t === "pline") pts = p.pts;
else if (p.t === "arc") pts = arcPts([p.cx, p.cy], p.r,
p.a0 * Math.PI / 180, p.a1 * Math.PI / 180);
pts.forEach(([x, y]) => put(x, y));
}
if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
return { minX, minY, maxX, maxY };
}
export function segsOfPrim(p) {
if (p.t === "line") return [[p.a, p.b]];
if (p.t === "pline") {
const S2 = [], P = p.pts || [];
for (let i = 0; i + 1 < P.length; i++) S2.push([P[i], P[i + 1]]);
if (p.closed && P.length > 2) S2.push([P[P.length - 1], P[0]]);
return S2;
}
if (p.t === "arc") {
const a0 = (+p.a0 || 0) * Math.PI / 180, a1 = (+p.a1 || 0) * Math.PI / 180;
const at = t => [p.cx + p.r * Math.cos(t), p.cy + p.r * Math.sin(t)];
const o = [];
for (let i = 0; i < 8; i++) o.push([at(a0 + (a1 - a0) * i / 8), at(a0 + (a1 - a0) * (i + 1) / 8)]);
return o;
}
return [];
}
export function instDist(inst, x, y) {
let prims = [], bd = Infinity;
try { prims = explode(inst) || []; } catch (e) { return Infinity; }
for (const p of prims) for (const [a, b] of segsOfPrim(p)) {
const d = distSeg(a, b, x, y);
if (d < bd) bd = d;
}
return bd;
}
export function instPoly(inst) {
const b = bbox(inst);
return [[b.minX, b.minY], [b.maxX, b.minY], [b.maxX, b.maxY], [b.minX, b.maxY]];
}
export const toJSON = () => ({ defs: [...DEFS.values()] });
export function checkDefs(data) {
if (!data || !Array.isArray(data.defs))
return { ok: 0, why: "لا مصفوفة defs", bad: [] };
if (data.defs.length > LIM.blockDefs.max)
return { ok: 0, bad: [], why: `${data.defs.length} تعريفاً — `
+ `الأقصى ${LIM.blockDefs.max}` };
const good = [], bad = [], seen = new Set();
data.defs.forEach((d, i) => {
try {
const v = V("blockDef", d, { keep: true });
safeBlockName(v.name);
checkPrims(v.prims);
if (seen.has(v.name)) throw new Error(`الاسم «${v.name}» مكرّر`);
seen.add(v.name);
good.push(v);
} catch (e) {
bad.push({ name: (d && typeof d.name === "string") ? d.name : `#${i}`,
why: e.message });
}
});
if (bad.length)
return { ok: 0, bad, why: `${bad.length} تعريفاً فاسداً — `
+ `${bad[0].name}: ${bad[0].why}` };
return { ok: 1, good };
}
export function fromJSON(data) {
const c = checkDefs(data);
if (!c.ok) return { ok: 0, why: c.why, bad: c.bad, kept: DEFS.size };
SILENT++;
try {
DEFS.clear();
c.good.forEach(d => defineBlock(d));
} finally {
SILENT--;
}
return { ok: 1, n: c.good.length };
}
function translate(p, dx, dy) {
const t = ([x, y]) => [x + dx, y + dy];
if (p.t === "line") return { ...p, a: t(p.a), b: t(p.b) };
if (p.t === "pline") return { ...p, pts: p.pts.map(t) };
if (p.t === "circle" || p.t === "arc") return { ...p, c: t(p.c) };
return p;
}
export function installDefaults() {
SILENT++;
try {
[
{ name: "door", title: "باب مفرد", prims: [
{ t: "line", a: [0, 0], b: [0, 900] },
{ t: "arc", c: [0, 0], r: 900, a0: 0, a1: Math.PI / 2 }
]},
{ name: "window", title: "نافذة", prims: [
{ t: "line", a: [0, 0], b: [1200, 0] },
{ t: "line", a: [0, 200], b: [1200, 200] },
{ t: "line", a: [0, 100], b: [1200, 100] }
]},
{ name: "table", title: "طاولة", prims: [
{ t: "pline", pts: [[0, 0], [1200, 0], [1200, 700], [0, 700]], closed: true }
]}
].forEach(defineBlock);
} finally {
SILENT--;
}
}
