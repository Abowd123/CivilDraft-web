import {edit,editFailed} from "../core/state.js";
import {applyOps} from "./ops.js";
export function runOps(list,opt){
return edit(()=>applyOps(list,opt));
}
export function runAtomic(label,fn){
let why="";
const out=edit(()=>{
try{return fn(list=>applyOps(list,{atomic:1}))}
catch(e){why=(e&&e.message)||String(e); throw e}
},label);
if(out===undefined||editFailed())
return {ok:0,error:why||"تعذّر التنفيذ"};
return {ok:1,out};
}
