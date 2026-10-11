export const JR={lines:[],taint:[],max:4000,n:0,tn:0};
let MUTE=0;
const IGN=new Set();
const nk=s=>String(s==null?"":s).trim().toLowerCase();
export const jrIgnore=name=>{const k=nk(name); if(k)IGN.add(k)};
export const jrIsIgnored=s=>IGN.has(nk(s).split(/\s+/)[0]||"");
export const jrMute=v=>{MUTE=v?1:0};
export function jrAdd(s){
if(MUTE)return;
s=String(s==null?"":s).trim();
if(!s)return;
if(jrIsIgnored(s))return;
if(s==="esc"&&JR.lines[JR.lines.length-1]==="esc")return;
JR.lines.push(s); JR.n++;
if(JR.lines.length>JR.max)JR.lines.shift();
}
export function jrTaint(why){
if(MUTE)return;
JR.tn++;
const at=JR.lines.length;
const last=JR.taint[JR.taint.length-1];
if(last&&last.why===why&&last.at===at)return;
JR.taint.push({at,why:String(why||"عملية غير قابلة للتمثيل")});
if(JR.taint.length>200)JR.taint.shift();
}
export const jrClear=()=>{JR.lines.length=0;JR.taint.length=0};
export const jrMark=()=>({n:JR.n,tn:JR.tn});
export function jrSince(m){
if(!m)return {lost:1,lines:[],taint:[]};
const k=JR.n-m.n;
if(k<0||k>JR.lines.length)return {lost:1,lines:[],taint:[]};
const t=Math.max(0,JR.tn-m.tn);
const why=JR.taint.slice(Math.max(0,JR.taint.length-t)).map(x=>x.why);
while(why.length<t)why.push("عملية غير قابلة للتمثيل");
return {lost:0,lines:k?JR.lines.slice(JR.lines.length-k):[],taint:why};
}
export const jrCount=()=>JR.lines.length;
export const jrTainted=()=>JR.taint.length;
export function jrText(){
const H=[`# سجلّ CivilDraft — ${JR.lines.length} سطراً`];
if(JR.taint.length){
const w=[...new Set(JR.taint.map(t=>t.why))].join(" · ");
H.push(`# مشوب: ${w} — لا يُعبَّر عنها بسطر، فالإعادة تختلف`);
}
return H.concat(JR.lines).join("\n");
}
export const jrPlan=()=>"```plan\n"+JR.lines.join("\n")+"\n```";
