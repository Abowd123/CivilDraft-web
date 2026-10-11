const KEY="civildraft.ui";
const OLD_KEY="mistar.ui";
let MIGD=false;
function migrateKey(){
if(MIGD)return; MIGD=true;
if(typeof localStorage==="undefined")return;
try{
if(localStorage.getItem(KEY)!==null)return;
const v=localStorage.getItem(OLD_KEY);
if(v!==null)localStorage.setItem(KEY,v);
}catch(e){}
}
export const DEFUI=()=>({
shell:"ribbon",
theme:"dark",
icons:1,
tab:"draw",
ribbonMin:0,
beginner:0,
clean:0,
ctxAuto:0,
welcomed:0,
layout:null,
ws:{},
wsCur:"",
logH:84,
stHide:{joins:1,solo:1,theme:1,save:1},
views:[],
compass:1, vpLabel:1, navbar:1, lockUI:0,
cmdMode:"bottom", cmdOpa:100, cmdX:24, cmdY:0, cmdW:620,
rclick:"auto",
qp:1, qpFree:0, qpX:16, qpY:16,
recent:[],
density:"comfy",
learn:{}
});
export const UIS=DEFUI();
let FAIL=0;
const RK="__rev";
let REV=0, ONCONF=null, WATCH=false, SUBS=[];
export const uiRevision=()=>REV;
export const onUiConflict=f=>{ONCONF=(typeof f==="function")?f:null};
const revOf=o=>{const v=o&&+o[RK]; return (isFinite(v)&&v>0)?(v|0):0};
function peekRev(){
if(typeof localStorage==="undefined")return 0;
try{
const raw=localStorage.getItem(KEY);
return raw?revOf(JSON.parse(raw)):0;
}catch(e){return 0}
}
export function watchUI(fn){
if(typeof fn==="function"&&SUBS.indexOf(fn)<0)SUBS.push(fn);
if(!WATCH&&typeof addEventListener==="function"){
WATCH=true;
addEventListener("storage",e=>{
if(!e||e.key!==KEY)return;
if(peekRev()<=REV)return;
if(loadUI())SUBS.slice().forEach(f=>{try{f({rev:REV})}catch(x){}});
});
}
return ()=>{SUBS=SUBS.filter(x=>x!==fn)};
}
export function loadUI(skip){
migrateKey();
if(skip)return false;
if(typeof localStorage==="undefined")return false;
try{
const raw=localStorage.getItem(KEY);
if(!raw)return false;
const d=JSON.parse(raw);
if(!d||typeof d!=="object")return false;
REV=Math.max(REV,revOf(d));
const def=DEFUI();
Object.keys(def).forEach(k=>{
if(d[k]!==undefined&&typeof d[k]===typeof def[k])UIS[k]=d[k];
});
if(!/^(classic|ribbon)$/.test(UIS.shell))UIS.shell="ribbon";
if(!/^(dark|light)$/.test(UIS.theme))UIS.theme="dark";
if(!/^(comfy|compact|touch)$/.test(UIS.density))UIS.density="comfy";
UIS.icons=UIS.icons?1:0;
if(typeof UIS.tab!=="string"||!/^[\w-]{1,16}$/.test(UIS.tab))
UIS.tab="draw";
["ribbonMin","beginner","clean","ctxAuto","welcomed"].forEach(k=>{UIS[k]=UIS[k]?1:0});
UIS.logH=Math.max(0,Math.min(400,+UIS.logH||120));
const plain=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
if(!plain(UIS.layout))UIS.layout=null;
if(!plain(UIS.ws))UIS.ws={};
if(!Array.isArray(UIS.recent))UIS.recent=[];
UIS.recent=UIS.recent
.filter(v=>typeof v==="string"&&/^[\w.-]{1,32}$/.test(v))
.slice(0,6);
UIS.ws=Object.fromEntries(Object.entries(UIS.ws).slice(0,24));
UIS.wsCur=String(UIS.wsCur||"").slice(0,32);
if(!plain(UIS.stHide))UIS.stHide={};
UIS.learn=Object.fromEntries(Object.entries(plain(UIS.learn)?UIS.learn:{})
.filter(([k,v])=>/^[\w-]{1,32}$/.test(k)&&plain(v))
.slice(0,256)
.map(([k,v])=>[k,{stars:Math.max(0,Math.min(3,(+v.stars|0))),at:isFinite(+v.at)?+v.at:0,
dur:Math.max(0,Math.min(86400,(+v.dur|0)))}]));
UIS.views=(Array.isArray(UIS.views)?UIS.views:[])
.filter(v=>v&&typeof v.n==="string"&&isFinite(v.k)
&&isFinite(v.cx)&&isFinite(v.cy)).slice(0,24);
["compass","vpLabel","navbar","lockUI"]
.forEach(k=>{UIS[k]=UIS[k]?1:0});
if(!/^(bottom|top|float)$/.test(UIS.cmdMode))UIS.cmdMode="bottom";
if(!/^(auto|enter|menu)$/.test(UIS.rclick))UIS.rclick="auto";
UIS.cmdOpa=Math.max(40,Math.min(100,+UIS.cmdOpa||100));
["qp","qpFree"].forEach(k=>{UIS[k]=UIS[k]?1:0});
["cmdX","cmdY","cmdW","qpX","qpY"].forEach(k=>{
UIS[k]=isFinite(+UIS[k])?Math.round(+UIS[k]):0;
});
return true;
}catch(e){return false}
}
let T=null, ONFAIL=null, WARNED=false;
export const setUiError=f=>{ONFAIL=(typeof f==="function")?f:null};
export function saveUI(){
if(typeof localStorage==="undefined")return;
if(T)clearTimeout(T);
T=setTimeout(()=>{
T=null;
try{
const theirs=peekRev();
if(theirs>REV){
REV=theirs;
loadUI();
if(ONCONF)ONCONF({theirs,ours:REV});
SUBS.slice().forEach(f=>{try{f({rev:REV,conflict:1})}catch(x){}});
return;
}
REV=theirs+1;
localStorage.setItem(KEY,JSON.stringify(Object.assign({},UIS,{[RK]:REV})));
FAIL=0;
}catch(e){
FAIL++;
if(!WARNED&&ONFAIL){
WARNED=true;
ONFAIL((e&&e.name)||"خطأ");
}
}
},500);
}
export const uiFailed=()=>FAIL;
export function uiSet(k,v){
if(!(k in UIS))return false;
UIS[k]=v; saveUI();
return true;
}
const pOf=id=>{
if(!UIS.layout||!UIS.layout.p)return null;
return UIS.layout.p[id]||null;
};
export function secSet(id,open){
const p=pOf(id);
if(!p)return;
p.o=open?1:0;
saveUI();
}
export const secOpen=(id,def)=>{
const p=pOf(id);
return p?!!p.o:!!def;
};
export function resetUI(){
const d=DEFUI();
Object.keys(d).forEach(k=>{UIS[k]=d[k]});
saveUI();
}
