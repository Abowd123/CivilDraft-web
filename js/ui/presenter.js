let ON=0, BOX=null, T=null;
const LIFE=2400, MAX=4;
export const presenterOn=()=>!!ON;
export function keyLabel(e){
if(!e||!e.key)return "";
const mod=[e.ctrlKey||e.metaKey?"Ctrl":"",e.altKey?"Alt":"",e.shiftKey&&e.key.length>1?"Shift":""].filter(Boolean);
const k=e.key===" "?"Space":e.key==="Escape"?"Esc":e.key;
if(mod.length&&k.length===1)return [...mod,k.toUpperCase()].join("+");
if(/^(Enter|Esc|Tab|Delete|Backspace|F\d{1,2}|Arrow\w+)$/.test(k))return [...mod,k].join("+");
return "";
}
function box(){
if(BOX)return BOX;
BOX=document.createElement("div"); BOX.id="prKeys"; BOX.setAttribute("aria-hidden","true");
document.body.appendChild(BOX); return BOX;
}
export function show(txt,kind){
if(!ON||!txt)return;
const b=box(), el=document.createElement("span");
el.className="pk "+(kind||"cmd"); el.textContent=txt;
b.appendChild(el);
while(b.childElementCount>MAX)b.firstChild.remove();
setTimeout(()=>{el.classList.add("out"); setTimeout(()=>el.remove(),400)},LIFE);
}
const onKey=e=>{const l=keyLabel(e); if(l)show(l,"key")};
const onCmd=e=>{const s=e&&e.detail&&e.detail.s; if(s)show(String(s).slice(0,60),"cmd")};
export function setPresenter(v){
const on=v?1:0;
if(on===ON)return ON;
ON=on;
document.documentElement.classList.toggle("presenter",!!ON);
if(ON){document.addEventListener("keydown",onKey,true); document.addEventListener("cd:cmd",onCmd)}
else{document.removeEventListener("keydown",onKey,true); document.removeEventListener("cd:cmd",onCmd); if(BOX)BOX.innerHTML=""}
return ON;
}
export const togglePresenter=()=>setPresenter(!ON);
