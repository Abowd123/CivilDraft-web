import { S } from "../core/state.js";
import { openState } from "../core/opens.js";
import { isStale } from "../core/areas.js";
import { isArc, wallLen } from "../core/walls.js";
export function wallsBBox(state) {
const L = (state && state.walls) || S.walls;
let x0 = 1 / 0, y0 = 1 / 0, x1 = -1 / 0, y1 = -1 / 0;
for (const w of L) {
[w.a, w.b].forEach(p => {
if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
});
}
return (x1 < 0) ? null : { x0, y0, x1, y1 };
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
export const CHECKS = {
"wall.len3": state => {
const W = (state && state.walls) || S.walls;
return W.length === 1 && near(wallLen(W[0]), 3000, 2);
},
"rect.clear": (state, wMm, hMm) => {
const b = wallsBBox(state);
return ((state && state.walls) || S.walls).length === 4
&& !!b
&& near((b.x1 - b.x0), wMm, 2)
&& near((b.y1 - b.y0), hMm, 2);
},
"wall.arc": state => {
const W = (state && state.walls) || S.walls;
return W.length > 0 && W.some(w => isArc(w));
},
"open.good": (state, kind) => {
const O = (state && state.opens) || S.opens;
return O.length > 0
&& (kind == null || O.every(o => o.kind === kind))
&& O.every(o => openState(o) === "ok");
},
"open.over": state => {
const O = (state && state.opens) || S.opens;
return O.length > 0 && openState(O[0]) === "over";
},
"area.baked": state => {
const A = (state && state.areas) || S.areas;
return A.length === 1
&& Array.isArray(A[0].ring)
&& A[0].ring.length >= 3
&& !isStale(A[0]);
},
"area.stale": state => {
const A = (state && state.areas) || S.areas;
return A.length === 1 && isStale(A[0]);
}
};
export function runCheck(name, state, args) {
const fn = CHECKS[name];
if (!fn) throw new Error(`فحصٌ غير معروف: ${name}`);
return fn(state, args);
}
