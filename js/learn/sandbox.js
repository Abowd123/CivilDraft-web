import * as St from "../core/state.js";
import * as R from "../tools/registry.js";
import {runActs} from "./acts.js";
let BOX=null;
export const inSandbox=()=>!!BOX;
export const setupOk=()=>!!(BOX&&BOX.setupOk);
export const sandboxLog=()=>BOX&&BOX.log?BOX.log.slice():[];
const defaults=()=>R.toolList().forEach(d=>(d.opts||[]).forEach(f=>{
if(f.def!==undefined)R.OPT[d.id]=Object.assign(R.OPT[d.id]||{},{[f.k]:f.def});
}));
export function enterSandbox(lesson,hooks){
if(BOX)return false;
const h=hooks||{};
try{if(R.active())R.cancel(true)}catch(e){}
try{St.saveNow(); St.saveResume()}catch(e){}
const box={
state:St.snapshot(),
opt:JSON.stringify(R.OPT),
view:h.view&&h.view.get?h.view.get():null,
hooks:h, lesson:lesson&&lesson.id||""
};
BOX=box;
if(h.snap){try{Promise.resolve(h.snap("قبل الواجهة التعليمية")).catch(()=>{})}catch(e){}}
St.saveHold(1);
St.historyPark();
if(h.sel)try{h.sel([])}catch(e){}
St.edit(()=>{St.loadState(St.DEF(),false)},"درس جديد");
defaults();
let ok=true;
if(lesson&&Array.isArray(lesson.setup)&&lesson.setup.length){
const rep=R.H.rep, errs=[];
R.H.rep=(c,m)=>{if(c==="er")errs.push(m)};
try{St.edit(()=>{ok=runActs(lesson.setup); if(R.active())R.cancel(true)},"تهيئة الدرس")}
catch(e){ok=false}
finally{R.H.rep=rep}
if(errs.length)ok=false;
if(h.sel)try{h.sel([])}catch(e){}
}
St.clearHistory();
box.setupOk=ok;
R.T.last=null;
box.rep=R.H.rep; box.log=[];
R.H.rep=(c,m)=>{box.log.push(String(m||"")); if(box.log.length>40)box.log.shift(); return box.rep&&box.rep(c,m)};
return true;
}
export function exitSandbox(){
const box=BOX;
if(!box)return false;
BOX=null;
const h=box.hooks;
if(box.rep)R.H.rep=box.rep;
try{if(R.active())R.cancel(true)}catch(e){}
if(h.sel)try{h.sel([])}catch(e){}
let ok=true;
try{St.edit(()=>{St.loadState(JSON.parse(box.state),false)},"العودة إلى مشروعك")}
catch(e){ok=false}
St.historyUnpark();
const o=JSON.parse(box.opt);
Object.keys(R.OPT).forEach(k=>{if(!(k in o))delete R.OPT[k]});
Object.assign(R.OPT,o);
try{R.saveOpts()}catch(e){}
if(box.view&&h.view&&h.view.set)try{h.view.set(box.view)}catch(e){}
St.saveHold(0);
return ok&&!St.editFailed();
}
