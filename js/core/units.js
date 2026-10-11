import {LIM} from "./limits.js";
export const D2R=Math.PI/180, R2D=180/Math.PI;
export const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const AR="٠١٢٣٤٥٦٧٨٩", FA="۰۱۲۳۴۵۶۷۸۹";
export function norm(s){
s=String(s==null?"":s);
let o="";
for(const ch of s){
let i=AR.indexOf(ch); if(i<0)i=FA.indexOf(ch);
o+=(i>=0)?String(i):ch;
}
return o.trim().toLowerCase()
.replace(/[\u064B-\u0652\u0670\u0640]/g,"")
.replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي")
.replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/ة/g,"ه")
.replace(/٫/g,".")
.replace(/[،؛]/g,",");
}
const MAXCO=LIM.coord.max;
export function Mx(v){
if(v==null||v==="")return null;
if(typeof v==="number"){
if(!isFinite(v))return null;
const mm=Math.round(v*1000);
return Math.abs(mm)<=MAXCO?mm:null;
}
const s=norm(v).replace(/\s+/g,"").replace(/,/g,".");
const m=/^(-?\d*\.?\d+)(mm|cm|m|مم|سم|م)?$/.exec(s);
if(!m)return null;
const n=parseFloat(m[1]);
if(!isFinite(n))return null;
const u=m[2]||"m";
const k=(u==="mm"||u==="مم")?1:((u==="cm"||u==="سم")?10:1000);
const mm=Math.round(n*k);
return Math.abs(mm)<=MAXCO?mm:null;
}
export function Nx(v){
if(typeof v==="number")return isFinite(v)?v:null;
const s=norm(String(v==null?"":v)).replace(/\s+/g,"")
.replace(/,/g,".");
if(!/^-?\d*\.?\d+$/.test(s))return null;
const n=parseFloat(s);
return isFinite(n)?n:null;
}
export const M=v=>{const r=Mx(v); return r==null?0:r};
export function isLen(v){
if(typeof v==="number")return isFinite(v);
return /^(-?\d*\.?\d+)(mm|cm|m|مم|سم|م)?$/
.test(norm(String(v)).replace(/\s+/g,"").replace(/,/g,"."));
}
export const mm=v=>(v||0)/1000;
export const m2=v=>((v||0)/1000).toFixed(2);
export const m3=v=>((v||0)/1000).toFixed(3);
export const sqm=v=>((v||0)/1e6).toFixed(2);
export const mnum=v=>{
const s=((v||0)/1000).toFixed(3).replace(/0+$/,"").replace(/\.$/,"");
return (s===""||s==="-0"||s===".")?"0":s;
};
const LRI="\u2066", PDI="\u2069";
export const ltr=s=>LRI+String(s==null?"":s)+PDI;
export const rng =(a,b,u)=>ltr(`${a}–${b}`)+(u?" "+u:"");
export const dim2=(a,b,u)=>ltr(`${a}×${b}`)+(u?" "+u:"");
export const scl =k=>ltr(`1:${k}`);
export const pair=(a,b)=>ltr(`${a} , ${b}`);
export const arrow=(a,b)=>ltr(`${a} → ${b}`);
export const rng2=(a,b,u)=>rng(m2(a),m2(b),u);
export const rng3=(a,b,u)=>rng(m3(a),m3(b),u);
export const dm2 =(a,b,u)=>dim2(m2(a),m2(b),u);
export const pt2 =p=>pair(m2(p[0]),m2(p[1]));
let IDC=0;
export const setIdc=v=>{IDC=Math.max(0,v|0)};
export const idc=()=>IDC;
export const bumpIdc=v=>{if((v|0)>IDC)IDC=v|0};
export const newId=p=>`${p}${++IDC}`;
export const idNum=id=>{
const m=/(\d+)$/.exec(String(id||""));
return m?parseInt(m[1],10):0;
};
export const deg=a=>((a%360)+360)%360;
