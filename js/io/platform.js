import {PROJECT_ACCEPT} from "./project.js";
export const isDesktop=()=>typeof window!=="undefined"
&&!!(window.civilDesktop&&window.civilDesktop.isDesktop);
const WEB_EXT="json";
const DESKTOP_EXT="cdraft";
export const projectExt=()=>isDesktop()?DESKTOP_EXT:WEB_EXT;
const COMMANDS={new:"#bNew", open:"#xOpen", save:"#xSave"};
export function runCommand(cmd,doc){
const sel=Object.prototype.hasOwnProperty.call(COMMANDS,cmd)?COMMANDS[cmd]:null;
if(!sel)return false;
const d=doc||(typeof document!=="undefined"?document:null);
const el=d&&d.querySelector(sel);
if(!el||el.disabled)return false;
el.click();
return true;
}
const OPEN_FILTERS=[
{name:"مشروع CivilDraft",
extensions:PROJECT_ACCEPT.split(",").filter(x=>x[0]===".").map(x=>x.slice(1))},
{name:"كل الملفات",extensions:["*"]}];
function nativeOpen(D,openText,doc){
return Promise.resolve().then(()=>D.openFile(OPEN_FILTERS,false)).then(r=>{
if(r&&r.canceled)return;
if(r&&r.ok&&typeof r.data==="string")
openText(r.data.replace(/^\uFEFF/,""),String(r.name||""));
else openText(null,"");
}).catch(()=>{runCommand("open",doc)});
}
export function bindDesktop(openText,doc){
if(!isDesktop())return false;
const D=window.civilDesktop;
if(typeof D.onCommand==="function")D.onCommand(c=>{
if(c==="open"&&typeof D.openFile==="function"){
const d=doc||(typeof document!=="undefined"?document:null);
const el=d&&d.querySelector(COMMANDS.open);
if(el&&!el.disabled){nativeOpen(D,openText,doc); return}
}
runCommand(c,doc);
});
if(typeof D.onOpenFile==="function")D.onOpenFile(f=>{
if(f&&typeof f.data==="string")openText(f.data,String(f.name||""));
});
if(typeof D.ready==="function")D.ready();
return true;
}
