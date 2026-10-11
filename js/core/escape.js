const HAS = /[&<>"']/;
export function escapeHtml(s) {
if (s == null) return "";
const t = String(s);
if (!HAS.test(t)) return t;
return t
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#39;");
}
export const escapeAttr = escapeHtml;
export function setText(el, value) {
if (el) el.textContent = value == null ? "" : String(value);
return el;
}
export const hasHtml = s => HAS.test(String(s == null ? "" : s));
export function errMsg(e) {
if (e == null) return "";
if (typeof e === "string") return e;
if (typeof e === "object" && typeof e.message === "string" && e.message)
return e.message;
return String(e);
}
export const errMsgHtml = e => escapeHtml(errMsg(e));
const INJECTION=[
/<\|im_(start|end)\|>/gi,
/\[\/?INST\]/gi,
/<<\/?SYS>>/gi,
/^###\s*(Instruction|Response|Human|Assistant|System)\s*:?\s*/gim,
/^(system|user|assistant)\s*:\s*/gim,
/<\/?script\b[^>]*>/gi
];
const CTRL=/[\x00-\x08\x0B\x0C\x0E-\x1F]/g;
export function sanitizeExternal(s){
if(s==null)return "";
let t=String(s);
INJECTION.forEach(re=>{t=t.replace(re,"")});
t=t.replace(CTRL,"");
return t;
}
