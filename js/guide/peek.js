import { lessonById } from "./catalog.js";
import { escapeHtml as esc } from "../core/escape.js";
let box = null;
function ensure() {
if (box && document.body.contains(box)) return box;
box = document.createElement("div");
box.id = "gdPeek";
box.hidden = true;
box.dir = "rtl";
document.body.appendChild(box);
return box;
}
export function peekOpen(id, onFull) {
const L = lessonById(id);
const b = ensure();
if (!L) { b.hidden = true; return b; }
b.innerHTML = `
 <div class="gd-peek-hd"><b>${esc(L.title)}</b>
  <button type="button" class="gd-peek-x" data-peekx="1" aria-label="إغلاق">✕</button></div>
 <p class="gd-peek-goal">${esc((L.goals || [])[0] || "")}</p>
 <button type="button" class="gd-peek-full" data-peekfull="${esc(id)}">الشرح الكامل</button>`;
b.hidden = false;
const x = b.querySelector("[data-peekx]");
if (x) x.onclick = () => { b.hidden = true; };
const full = b.querySelector("[data-peekfull]");
if (full) full.onclick = () => { b.hidden = true; if (onFull) onFull(id); };
return b;
}
export function peekClose() { if (box) box.hidden = true; }
export const peekIsOpen = () => !!(box && !box.hidden);
