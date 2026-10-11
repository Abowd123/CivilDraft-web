import {escapeHtml as esc} from "../core/escape.js";
import {trapFocus} from "./focustrap.js";
let box=null, release=null;
export function rptClose(){
if(release){try{release()}catch(e){} release=null}
if(box){box.remove(); box=null}
}
export const rptIsOpen=()=>!!box;
export const rptBox=()=>box;
export function rptOpen(title,body){
rptClose();
box=document.createElement("div");
box.className="rpt";
box.setAttribute("role","dialog");
box.setAttribute("aria-modal","true");
box.setAttribute("aria-label",String(title));
box.setAttribute("dir","rtl");
box.innerHTML=`<div class="rpt-h"><h3>${esc(title)}</h3>`
+`<button type="button" class="rpt-x" data-rpt="close" `
+`aria-label="إغلاق">×</button></div>`
+`<div class="rpt-b">${body}</div>`;
box.addEventListener("click",e=>{
if(e.target.closest&&e.target.closest("[data-rpt=close]"))rptClose();
});
document.body.appendChild(box);
release=trapFocus(box,{onEsc:rptClose});
return box;
}
