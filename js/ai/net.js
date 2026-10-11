const K="civildraft.ai";
export const MAX_RESPONSE=1024*1024;
const TIMEOUT_MS=60000;
export const MAX_QUESTION=8000;
export const MAX_CONTEXT=20000;
export const MAX_IMAGE=4*1024*1024;
const ENVELOPE=200;
export const MODELS_TIMEOUT_MS=15000;
const OLD_K="mistar.ai";
function migrateAI(){
try{
if(localStorage.getItem(K)!==null)return;
const v=localStorage.getItem(OLD_K);
if(v!==null)localStorage.setItem(K,v);
}catch(e){}
}
export const AI={url:"http://localhost:11434/v1/chat/completions",
key:"", model:"", preset:"ollama", temp:0, vision:0, maxLines:200, on:0,
keep:0,
wantIns:0, wantTtl:0};
const KEYS=["url","key","model","preset","temp","vision","maxLines","on",
"keep","wantIns","wantTtl"];
export const PRESETS=[
{id:"ollama",    label:"Ollama (محلّي)",
url:"http://localhost:11434/v1/chat/completions"},
{id:"llamacpp",  label:"llama.cpp (محلّي)",
url:"http://localhost:8080/v1/chat/completions"},
{id:"openai",    label:"OpenAI",
url:"https://api.openai.com/v1/chat/completions"},
{id:"groq",      label:"Groq",
url:"https://api.groq.com/openai/v1/chat/completions"},
{id:"gemini",    label:"Google Gemini",
url:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"},
{id:"openrouter",label:"OpenRouter",
url:"https://openrouter.ai/api/v1/chat/completions"},
{id:"custom",    label:"مخصّص (المضيفون المدعومون فقط)", url:""}
];
export function loadAI(){
if(typeof localStorage==="undefined")return AI;
migrateAI();
try{
const raw=localStorage.getItem(K);
if(!raw)return AI;
const d=JSON.parse(raw)||{};
KEYS.forEach(k=>{if(d[k]!==undefined)AI[k]=d[k]});
AI.url=String(AI.url||"").slice(0,300);
AI.key=String(AI.key||"");
AI.key=AI.key.slice(0,500);
AI.model=String(AI.model||"").slice(0,80);
AI.preset=String(AI.preset||"").slice(0,40);
AI.temp=Math.max(0,Math.min(1,+AI.temp||0));
AI.maxLines=Math.max(1,Math.min(2000,+AI.maxLines||200));
["vision","on","keep","wantIns","wantTtl"]
.forEach(k=>{AI[k]=AI[k]?1:0});
delete AI.__ok;
}catch(e){}
return AI;
}
let AIFAIL=null, AISAID=false;
export const setAiError=f=>{AIFAIL=(typeof f==="function")?f:null};
export function saveAI(){
if(typeof localStorage==="undefined")return {ok:0,err:"لا تخزين"};
const o={};
KEYS.forEach(k=>{o[k]=AI[k]});
if(!AI.keep)o.key="";
try{
localStorage.setItem(K,JSON.stringify(o));
AISAID=false;
return {ok:1};
}catch(e){
const n=(e&&e.name)||"خطأ";
if(AIFAIL&&!AISAID){AISAID=true; AIFAIL(n)}
return {ok:0,err:n};
}
}
export function validateUrl(url){
const s=String(url==null?"":url).trim();
if(!s)throw new Error("عنوان المزوّد فارغ");
if(s.length>300)throw new Error("عنوان المزوّد أطول من 300 محرف");
let u;
try{u=new URL(s)}
catch(e){throw new Error("عنوان المزوّد غير صالح")}
if(u.protocol!=="http:"&&u.protocol!=="https:")
throw new Error(`بروتوكول «${u.protocol}» غير مسموح — `
+`http أو https فقط`);
if(!u.hostname)throw new Error("عنوان المزوّد بلا مضيف");
if(u.username||u.password)
throw new Error("لا بيانات دخولٍ داخل العنوان — ضعها في حقل المفتاح");
if(u.port!==""){
const p=+u.port;
if(!(p>=1&&p<=65535))throw new Error("منفذٌ خارج 1–65535");
}
return u;
}
export const CSP_ORIGINS=Object.freeze([
"http://localhost:11434","http://localhost:8080",
"http://127.0.0.1:11434","http://127.0.0.1:8080",
"https://api.openai.com","https://api.groq.com",
"https://generativelanguage.googleapis.com","https://openrouter.ai"]);
export function assertReachable(url){
const u=(url instanceof URL)?url:validateUrl(url);
if(!cspAllows(u))
throw new Error(`المضيف «${u.host}» محجوبٌ بسياسة الأمان (CSP) — `
+"المدعوم: Ollama وllama.cpp محلّياً، وOpenAI وGroq وGemini وOpenRouter");
return u;
}
export function cspAllows(u){
if(CSP_ORIGINS.includes(u.origin))return true;
try{return typeof location!=="undefined"&&u.origin===location.origin}
catch(e){return false}
}
export const httpHint=s=>s===401||s===403?" (المفتاح غير صالح أو بلا صلاحية)"
:s===404?" (العنوان أو اسم النموذج غير صحيح)"
:s===429?" (تجاوزتَ حدَّ الطلبات أو الرصيد — انتظر قليلاً)"
:s>=500?" (عطلٌ عند المزوّد نفسه)":"";
export const ready=()=>!!(AI.on&&AI.url&&AI.model);
const LOCAL_HOSTS=new Set(["localhost","127.0.0.1","::1"]);
export const isLocal=()=>{
try{
const u=validateUrl(AI.url);
const h=u.hostname.replace(/^\[|\]$/g,"").replace(/\.$/,"")
.toLowerCase();
return LOCAL_HOSTS.has(h);
}catch(e){return false}
};
export const hostOf=()=>{
try{return new URL(AI.url).host}
catch(e){return String(AI.url||"—").slice(0,60)}
};
const ASK_CTRLS=new Set();
let MODELS_CTRL=null;
export const abortAsk=()=>{
ASK_CTRLS.forEach(c=>{try{c.abort()}catch(e){}});
ASK_CTRLS.clear();
};
export const abortModels=()=>{
if(MODELS_CTRL){try{MODELS_CTRL.abort()}catch(e){} MODELS_CTRL=null}
};
export const abort=()=>{abortAsk(); abortModels()};
export async function ask(sys,user,img){
if(!ready())throw new Error("المزوّد غير مُهيَّأ — اضبطه في لوحة "
+"«المساعد»");
validateUrl(AI.url);
assertReachable(AI.url);
const sysS=String(sys==null?"":sys), userS=String(user==null?"":user);
if(sysS.length>MAX_CONTEXT)
throw new Error(`تعليمات النظام ${sysS.length} محرفاً — الحدّ `
+`${MAX_CONTEXT}`);
if(userS.length>MAX_CONTEXT+MAX_QUESTION+ENVELOPE)
throw new Error(`الطلب ${userS.length} محرفاً — الحدّ `
+`${MAX_CONTEXT+MAX_QUESTION+ENVELOPE} (خلاصة المشروع `
+`${MAX_CONTEXT} + السؤال ${MAX_QUESTION})`);
if(img){
if(typeof img!=="string"||!/^data:image\//i.test(img))
throw new Error("الصورة ليست data:image");
if(img.length>MAX_IMAGE)
throw new Error(`الصورة ${img.length} محرفاً — الحدّ ${MAX_IMAGE}`);
}
const content=img
? [{type:"text",text:user},
{type:"image_url",image_url:{url:img}}]
: user;
const t0=performance.now();
const makeSend=()=>{
const ctrl=new AbortController();
ASK_CTRLS.add(ctrl);
const timer=setTimeout(()=>ctrl.abort(),TIMEOUT_MS);
const p=fetch(AI.url,{method:"POST",signal:ctrl.signal,
headers:Object.assign({"content-type":"application/json"},
AI.key?{authorization:"Bearer "+AI.key}:{}),
body:JSON.stringify({model:AI.model,
temperature:+AI.temp||0,
messages:[{role:"system",content:sys},
{role:"user",content}]})})
.finally(()=>{clearTimeout(timer); ASK_CTRLS.delete(ctrl)});
return p;
};
let r;
try{
try{ r=await makeSend() }
catch(e1){
if(e1.name==="AbortError")throw e1;
r=await makeSend();
}
if(r.status>=500)r=await makeSend();
}catch(e){
if(e.name==="AbortError")
throw new Error("أُلغي الطلب أو تجاوز المهلة");
throw new Error("تعذّر الوصول إلى المزوّد: "+e.message
+(isLocal()?" — هل الخدمة المحلّية تعمل؟":""));
}
if(!r.ok){
const t=await r.text().catch(()=>"");
throw new Error(`المزوّد ${r.status}${httpHint(r.status)}: ${t.slice(0,180)}`);
}
const text=await r.text();
if(text.length>MAX_RESPONSE)
throw new Error(`ردٌّ أكبر من الحدّ `
+`(${MAX_RESPONSE} محرف) — المزوّد أرسل ${text.length}`);
let j;
try{j=JSON.parse(text)}
catch(e){throw new Error("ردٌّ ليس JSON صالحاً")}
const msg=j.choices&&j.choices[0]&&j.choices[0].message;
if(!msg||msg.content==null)throw new Error("ردٌّ بلا محتوى");
return {txt:String(msg.content), usage:j.usage||null,
ms:Math.round(performance.now()-t0)};
}
export function modelsUrl(){
const s=String(AI.url||"").trim().replace(/\s+/g,"");
let u;
try{ u=new URL(s); }catch(e){
let t=s.replace(/\/+$/,"").replace(/\/chat\/completions$/i,"");
return t+"/models";
}
u.pathname=u.pathname.replace(/\/+$/,"").replace(/\/chat\/completions$/i,"");
u.search=""; u.hash="";
let out=u.toString().replace(/\/+$/,"");
return out+"/models";
}
export async function listModels(){
if(!AI.url)throw new Error("اضبط العنوان أوّلاً");
validateUrl(AI.url);
const url=modelsUrl();
validateUrl(url);
assertReachable(url);
abortModels();
const ctrl=new AbortController();
MODELS_CTRL=ctrl;
const timer=setTimeout(()=>ctrl.abort(),MODELS_TIMEOUT_MS);
try{
const r=await fetch(url,{method:"GET",signal:ctrl.signal,
headers:AI.key?{authorization:"Bearer "+AI.key}:{}});
if(!r.ok){
const t=await r.text().catch(()=>"");
throw new Error(`المزوّد ${r.status}${httpHint(r.status)}: ${t.slice(0,140)}`);
}
const text=await r.text();
if(text.length>MAX_RESPONSE)
throw new Error(`ردٌّ أكبر من الحدّ (${MAX_RESPONSE} محرف)`);
let j;
try{j=JSON.parse(text)}
catch(e){throw new Error("ردٌّ ليس JSON صالحاً")}
const ids=((j&&(j.data||j.models))||[])
.map(m=>m&&(m.id||m.name)).filter(Boolean)
.sort((a,b)=>String(a).localeCompare(String(b)));
if(!ids.length)throw new Error("ردٌّ بلا نماذج");
return ids;
}catch(e){
if(e.name==="AbortError")
throw new Error("أُلغي الطلب أو تجاوز مهلة "
+`${MODELS_TIMEOUT_MS/1000} ثانية`);
throw new Error("تعذّر جلب النماذج: "+e.message
+(isLocal()?" — هل الخدمة المحلّية تعمل؟":""));
}finally{
clearTimeout(timer);
if(MODELS_CTRL===ctrl)MODELS_CTRL=null;
}
}
