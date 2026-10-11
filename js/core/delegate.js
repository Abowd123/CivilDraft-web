const K=(type,key)=>"__bind1_"+(key||type);
export function bindOnce(el,type,fn,key){
if(!el||typeof el.addEventListener!=="function")return false;
if(typeof fn!=="function")return false;
const k=K(type,key);
if(el[k])return false;
el[k]=fn;
el.addEventListener(type,fn);
return true;
}
export const isBound=(el,type,key)=>!!(el&&el[K(type,key)]);
export function unbind(el,type,key){
if(!el||typeof el.removeEventListener!=="function")return false;
const k=K(type,key);
const fn=el[k];
if(!fn)return false;
el.removeEventListener(type,fn);
el[k]=null;
return true;
}
const OBS=new Map();
export function keepObserver(name,ob){
if(!name||!ob)return ob;
const old=OBS.get(name);
if(old&&old!==ob&&typeof old.disconnect==="function"){
try{old.disconnect()}catch(e){}
}
OBS.set(name,ob);
return ob;
}
export const observerNames=()=>[...OBS.keys()];
export const observerOf=name=>OBS.get(name)||null;
export function disposeObservers(name){
const names=name?[name]:[...OBS.keys()];
let n=0;
names.forEach(k=>{
const ob=OBS.get(k);
if(!ob)return;
if(typeof ob.disconnect==="function"){try{ob.disconnect(); n++}catch(e){}}
OBS.delete(k);
});
return n;
}
let PREF_FAIL=null;
const SAID=new Set();
export const setPrefError=f=>{PREF_FAIL=(typeof f==="function")?f:null};
export function writePref(key,value){
if(typeof localStorage==="undefined")return {ok:0,err:"لا تخزين"};
try{
localStorage.setItem(key,typeof value==="string"?value:JSON.stringify(value));
SAID.delete(key);
return {ok:1};
}catch(e){
const n=(e&&e.name)||"خطأ";
if(PREF_FAIL&&!SAID.has(key)){SAID.add(key); PREF_FAIL(key,n)}
return {ok:0,err:n};
}
}
export const prefSaid=()=>[...SAID];
export const isPlain=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
export function parseObj(raw){
if(raw==null||raw==="")return null;
let v=null;
try{v=JSON.parse(raw)}catch(e){return null}
return isPlain(v)?v:null;
}
export function parseArr(raw){
if(raw==null||raw==="")return null;
let v=null;
try{v=JSON.parse(raw)}catch(e){return null}
return Array.isArray(v)?v:null;
}
export function mergeKnown(target,src,shape){
const d=isPlain(src)?src:null;
if(!d)return 0;
let n=0;
Object.keys(shape||{}).forEach(k=>{
if(d[k]===undefined)return;
if(typeof d[k]!==typeof shape[k])return;
if(Array.isArray(shape[k])!==Array.isArray(d[k]))return;
target[k]=d[k]; n++;
});
return n;
}
