import {defTool,TOOLS} from "../tools/registry.js";
import {jrIgnore} from "../core/journal.js";
import {HOOK} from "./bus.js";
import {viewGo,viewSave,viewDel} from "./navbar.js";
const argOf=ctx=>(ctx&&ctx.arg)?String(ctx.arg).trim():"";
const FLAGS={own:1,nojr:1,noplan:1,arg:1,steps:[]};
defTool(Object.assign({
id:"view", alias:"منظر view vw", label:"منظر مسمّى",
hint:"view <اسم> — يقفز إلى منظرٍ محفوظ",
start(ctx){
const n=argOf(ctx);
if(!n){HOOK.report("wr","اكتب: view <اسم>"); return false}
if(!viewGo(n))HOOK.report("wr",`لا منظر باسم «${n}»`);
return false;
}},FLAGS));
defTool(Object.assign({
id:"viewsave", alias:"احفظ_منظر viewsave", label:"حفظ منظر",
hint:"viewsave <اسم> — يحفظ موضع العرض والمقياس الحاليين",
start(ctx){
const n=argOf(ctx);
if(!n){HOOK.report("wr","اكتب: viewsave <اسم>"); return false}
viewSave(n); return false;
}},FLAGS));
defTool(Object.assign({
id:"viewdel", alias:"احذف_منظر viewdel", label:"حذف منظر",
hint:"viewdel <اسم>",
start(ctx){
const n=argOf(ctx);
if(!n){HOOK.report("wr","اكتب: viewdel <اسم>"); return false}
if(!viewDel(n))HOOK.report("wr",`لا منظر باسم «${n}»`);
return false;
}},FLAGS));
["view","viewsave","viewdel"].forEach(id=>{
const d=TOOLS[id]; if(!d)return;
jrIgnore(id);
String(d.alias||"").split(/\s+/).filter(Boolean).forEach(jrIgnore);
});
