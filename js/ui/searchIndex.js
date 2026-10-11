import * as R from "../tools/registry.js";
import {ACTIONS} from "./actions.js";
import {norm,toLat,score} from "./searchcommon.js";
export {norm,toLat,score};
export function buildIndex(){
const out=[];
R.toolList().filter(d=>d&&d.id).forEach(d=>{
const al=Object.keys(R.TOOLS).filter(k=>R.TOOLS[k]===d&&k!==d.id);
out.push({
type:"cmd", id:d.id, label:d.label||d.id,
hint:d.hint||[d.id,...al].join(" · "),
hay:norm([d.id,d.label,...al,d.hint||""].join(" ")),
destruct:!!d.destruct,
run:{cmd:d.id}
});
});
Object.values(ACTIONS).forEach(a=>{
out.push({
type:"act", id:a.id, label:a.n,
hint:"أمر",
hay:norm(`${a.n} ${a.id}`),
destruct:false,
run:{act:a.id}
});
});
return out;
}
export function search(q,limit=9){
const idx=buildIndex();
const n=norm(q), na=norm(toLat(q));
if(!n)return idx.slice(0,limit);
return idx
.map(it=>({it,s:Math.max(score(it.hay,n),na!==n?score(it.hay,na):-1)}))
.filter(x=>x.s>=0)
.sort((a,b)=>b.s-a.s)
.slice(0,limit)
.map(x=>x.it);
}
