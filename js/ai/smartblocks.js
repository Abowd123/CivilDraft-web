import {validate} from "./ops.js";
import {runAtomic} from "./opsrun.js";
const MIN_DIM=0.4;
function rect(org, w, h, {t=0.2, type="int", align="c"}={}) {
const [x,y] = org, x1 = x+w, y1 = y+h;
const edges = [
[[x,y],[x1,y]], [[x1,y],[x1,y1]], [[x1,y1],[x,y1]], [[x,y1],[x,y]]
];
return edges
.filter(([a,b]) => Math.hypot(b[0]-a[0], b[1]-a[1]) > 0)
.map(([a,b]) => ({op:"wall", a, b, t, type, align}));
}
export const BLOCKS = {
room: { id: "room", label: "غرفة", cat:"معماري",
params: {w:4, h:4, name:""}, def:{w:4, h:4, name:""},
build(org, p) {
const ops = rect(org, p.w, p.h, {t:0.2, type:"ext"});
if (String(p.name).trim()) {
ops.push({op:"area", at:[org[0]+p.w/2, org[1]+p.h/2], name:String(p.name).trim()});
}
return {ops};
}
},
iconDoor: { id: "iconDoor", label: "غرفة بباب", cat:"معماري",
params: {w:4, h:4, dX:0.9, dMin:0.6, name:"غرفة"}, def:{w:4, h:4, dX:0.9, dMin:0.6, name:"غرفة"},
build(org, p) {
const ops = rect(org, p.w, p.h, {t:0.2, type:"ext"});
const doorW = Math.min(Math.max(+p.dX || 0.9, +p.dMin || 0.4), Math.max(0.4, p.w - 0.4));
const door = {wallIndex: 0, at: p.w/2, w: doorW, kind: "door"};
return {ops, door};
}
},
bath: { id: "bath", label: "حمام صغير", cat:"معماري",
params: {w:1.5, h:2}, def:{w:1.5, h:2},
build(org, p) {
const ops = rect(org, p.w, p.h, {t:0.15, type:"int"});
ops.push({op:"area", at:[org[0]+p.w/2, org[1]+p.h/2], name:"حمام"});
return {ops};
}
},
kitchen: { id: "kitchen", label: "مطبخ", cat:"معماري",
params: {w:3, h:2}, def:{w:3, h:2},
build(org, p) {
const ops = rect(org, p.w, p.h, {t:0.15, type:"int"});
ops.push({op:"area", at:[org[0]+p.w/2, org[1]+p.h/2], name:"مطبخ"});
return {ops};
}
},
arcWall: { id: "arcWall", label: "جدار قوسي", cat:"معماري",
params: {L:4, bulge:0.5, t:0.2, type:"ext"},
def: {L:4, bulge:0.5, t:0.2, type:"ext"},
build(org, p) {
const L=+p.L||4;
if(!(L>=MIN_DIM)||!isFinite(L))
return {ops:[], error:`طول الجدار القوسي دون ${MIN_DIM} م أو غير رقمي`};
const bg=isFinite(+p.bulge)?Math.max(-8,Math.min(8,+p.bulge)):NaN;
if(!isFinite(bg)||Math.abs(bg)<1e-6)
return {ops:[], error:isFinite(bg)
?"bulge صفرٌ لا يبني قوساً":"bulge غير رقمي"};
return {ops:[{op:"wall", a:org, b:[org[0]+L, org[1]],
t:+p.t||0.2, type:p.type||"ext", align:"c", bulge:bg}]};
}
}
};
export const blockList = Object.values(BLOCKS)
.map(b => ({id: b.id, label: b.label, cat: b.cat, params: b.params}));
export function blockOps(blockId, org, params) {
const b = BLOCKS[blockId];
if (!b) return {ops:[], unknown: blockId};
const v = (params && typeof params === "object") ? {...b.def, ...params} : b.def;
if (!Array.isArray(org) || org.length !== 2
|| !org.every(n => typeof n === "number" && isFinite(n)))
return {ops:[], error: "نقطة الأصل ليست [x,y] رقميّة"};
if ("w" in v || "h" in v) {
const w = +v.w, h = +v.h;
if (!(w >= MIN_DIM) || !(h >= MIN_DIM) || !isFinite(w) || !isFinite(h))
return {ops:[], error: `أبعاد الكتلة دون ${MIN_DIM} م أو غير رقميّة`};
}
return b.build(org, v);
}
export function placeBlock(blockId, org, params, {commit=false}={}) {
const b = BLOCKS[blockId];
if (!b) return {error: `كتلة غير معروفة: ${blockId}`, ops:[], valid:false};
const built = blockOps(blockId, org, params);
if (built.error)
return {block: blockId, error: built.error, generated: 0, valid: 0,
rejected: [{i:0, why: built.error}], committed: false};
const ops = built.ops || [];
const {ok, bad} = validate(ops);
const report = {block: blockId, generated: ops.length, valid: ok.length, rejected: bad};
if (!commit || !ok.length) return report;
if (bad.length) {
report.committed = false;
report.error = `رُفضت ${bad.length} عملية — لم يُدرَج شيء`;
return report;
}
const r = runAtomic(`إدراج «${b.label}»`, apply => {
const r1 = apply(ops);
let r2 = null;
if (built.door) {
const wallIds = r1.made.filter(m => m.k === "wall").map(m => m.id);
const wallId = wallIds[built.door.wallIndex];
if (!wallId) throw new Error("الجدار المقصود للباب لم يُدرَج");
r2 = apply([{op:"open", wall: wallId, at: built.door.at,
kind: built.door.kind || "door", w: built.door.w}]);
}
return {r1, r2};
});
if (!r.ok) {
report.committed = false;
report.rolledBack = true;
report.error = `لم يُدرَج شيء — ${r.error}`;
if (built.door) report.doorRejected = [{i:0, why: r.error}];
return report;
}
report.result = r.out.r1;
report.committed = true;
if (r.out.r2) report.doorResult = r.out.r2;
return report;
}
