import * as R from "../tools/registry.js";
import {UIS,uiSet} from "./store.js";
import {icon as ic} from "./icons.js";
import {escapeHtml as esc} from "../core/escape.js";
import {HOOK} from "./bus.js";
export const RECENT_MAX=6;
const $=s=>document.querySelector(s);
const bar=()=>$("#recent");
const live=id=>{
const d=R.findTool(id);
return (d&&d.id===id)?d:null;
};
export function recentList(){
return (UIS.recent||[]).filter(live).slice(0,RECENT_MAX);
}
export function noteUse(id){
const k=String(id||"");
if(!live(k))return false;
const L=[k].concat((UIS.recent||[]).filter(x=>x!==k))
.slice(0,RECENT_MAX);
uiSet("recent",L);
renderRecent(); renderThumb();
return true;
}
export function clearRecent(){
uiSet("recent",[]);
renderRecent(); renderThumb();
return true;
}
export const QUICK_N=6;
export const QUICK_SEED=["wall","door","win","dim","move","text"];
export function quickList(){
const L=recentList();
for(const id of QUICK_SEED){
if(L.length>=QUICK_N)break;
if(!L.includes(id)&&live(id))L.push(id);
}
return L.slice(0,QUICK_N);
}
const thumbBar=()=>$("#thumb");
export function renderThumb(){
const B=thumbBar();
if(!B)return 0;
const L=quickList();
const used=new Set(recentList());
B.innerHTML=`<button type="button" id="thSrch" data-rcsrch="1"`
+` title="ابحث عن أداةٍ أو أمر" aria-label="ابحث عن أداةٍ أو أمر">`
+`${ic("search",18)||"⌕"}</button>`
+`<span class="thDv" aria-hidden="true"></span>`
+L.map(id=>{
const d=live(id);
if(!d)return "";
const nm=d.label||id;
return `<button type="button" data-rc="${esc(id)}"`
+` title="${esc(nm)}${used.has(id)?" — استعملتَها مؤخّراً":""}"`
+` aria-label="${esc(nm)}">${ic(d.ico||"tool",18)}</button>`;
}).join("");
return L.length;
}
export function renderRecent(){
const B=bar();
if(!B)return 0;
const L=recentList();
if(!L.length){B.hidden=true; B.innerHTML=""; return 0}
B.hidden=false;
B.innerHTML=L.map(id=>{
const d=live(id);
const nm=d.label||id;
return `<button type="button" data-rc="${esc(id)}"`
+` title="${esc(nm)} — استعملتَها مؤخّراً"`
+` aria-label="${esc(nm)}">${ic(d.ico||"tool",16)}</button>`;
}).join("");
return L.length;
}
let SEARCH=null;
export const setSearchHook=fn=>{SEARCH=(typeof fn==="function")?fn:null};
function openSearch(){
if(SEARCH){SEARCH(); return true}
HOOK.report("wr","لوحةُ الأوامرِ لم تُوصَل بعد — جرّب Ctrl+K");
return false;
}
export function wireThumb(){
const B=thumbBar();
if(!B)return false;
if(B.dataset.wired)return true;
B.dataset.wired="1";
B.addEventListener("click",e=>{
const s=e.target.closest&&e.target.closest("[data-rcsrch]");
if(s){e.preventDefault(); openSearch(); return}
const b=e.target.closest&&e.target.closest("[data-rc]");
if(!b)return;
e.preventDefault();
runTool(b.dataset.rc);
});
renderThumb();
return true;
}
function runTool(id){
if(!live(id)){
uiSet("recent",(UIS.recent||[]).filter(x=>x!==id));
renderRecent(); renderThumb();
HOOK.report("in","أداةٌ من سجلِّ الاستعمال لم تعد موجودةً — أُزيلت");
return false;
}
R.histAdd(id);
noteUse(id);
R.begin(id);
HOOK.prompt();
return true;
}
export function wireRecent(){
const B=bar();
if(!B)return false;
B.addEventListener("click",e=>{
const b=e.target.closest("[data-rc]");
if(!b)return;
e.preventDefault();
runTool(b.dataset.rc);
});
renderRecent();
wireThumb();
return true;
}
