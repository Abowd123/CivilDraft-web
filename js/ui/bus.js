export const HOOK={
props:()=>{}, refresh:()=>{}, status:()=>{},
report:()=>{}, prompt:()=>{}, toggles:()=>{}, help:()=>{},
defs:()=>{}, ws:()=>{}, ctx:()=>false,
layCtl:()=>{}, ctxPanel:()=>{},
clean:()=>{}
};
const msgOf=e=>{
const m=(e&&e.message)?String(e.message):String(e||"خطأ");
return m.length>140?m.slice(0,140)+"…":m;
};
export function safe(p,label){
return Promise.resolve(p).catch(e=>{
HOOK.report("er",(label?label+": ":"")+msgOf(e));
return null;
});
}
export const lazy=(fn,label)=>{
let p;
try{p=fn()}catch(e){p=Promise.reject(e)}
void safe(p,label);
};
