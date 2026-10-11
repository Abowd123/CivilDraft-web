import {SAFE,fatal,bootOk} from "./bootguard.js";
import {errMsg} from "./core/escape.js";
import {initInstall} from "./ui/install.js";
initInstall();
import "./tools/draw.js";
import "./tools/sketch.js";
import "./tools/openings.js";
import "./tools/parts.js";
import "./tools/roof.js";
import "./tools/areas.js";
import "./tools/modify.js";
import "./tools/annotate.js";
import "./tools/ref.js";
import "./tools/boq.js";
import "./tools/boqreport.js";
import "./tools/elev.js";
import "./tools/section.js";
import "./tools/sheet.js";
import "./tools/clouds.js";
import "./tools/groups.js";
import "./tools/macros.js";
import "./tools/showcase.js";
import {keysFor,renderKeys} from "./ui/cmdkeys.js";
import "./ui/hygiene.js";
import "./ui/gate.js";
import "./ui/levelManager.js";
import "./ui/styleManager.js";
import {refreshUnderlayPanel} from "./ui/underlayPanel.js";
import {refreshPricingPanel} from "./ui/pricingPanel.js";
import "./ui/view3d.js";
import {installDefaults as installBlockDefaults}
from "./core/blocks.js";
import {initBlockTool} from "./tools/blocks.js";
import {initBlockPanel} from "./ui/blockpanel.js";
import "./ui/appcmds.js";
import "./ui/viewcmds.js";
import {installDefaults as installTemplateDefaults,apply as applyTemplate}
from "./core/templates.js";
import {onChange as onUnderlayChange,onWarn as onUnderlayWarn}
from "./core/underlay.js";
import {BLK_LAY} from "./core/laydef.js";
import {loadCode} from "./core/code.js";
import {jrAdd,jrTaint} from "./core/journal.js";
import {snapsLoad,snapAutoStart,setSnapError} from "./io/snaps.js";
import {wirePalette,extendPalette,paletteQuery,paletteExec} from "./ui/palette.js";
import {openStudio} from "./ui/studio.js";
import {wireRecent} from "./ui/recentbar.js";
import {applyDensity} from "./ui/ribbon/wire.js";
import {wireTour,tourMaybe,tourStart} from "./ui/tour.js";
import {initWelcome} from "./ui/welcome.js";
import {createHelpBot} from "./ui/helpbot.js";
import {mountHelpButton} from "./ui/helpbutton.js";
import {migrateAutosave} from "./core/migrate-autosave.js";
import {S,restore,setAfterEdit,sizeNotice,setSaveError,setRefLost,saveNow,saveResume,saveMode,undo,redo,touch,autosave,ensureShape,shapeNotes,edit,editFailed,setConflict,takeNewer,keepMine,conflictCopy} from "./core/state.js";
import {setBackupHook} from "./core/state.js";
import {restore as bkRestore, schedule as bkSchedule, flushSoon as bkFlush,
onBackupSay, BK as BKST} from "./io/backup.js";
import {toJSON as projToJSON} from "./io/project.js";
import {clamp} from "./core/units.js";
import {osSummary,MODES} from "./core/osnap.js";
import {showAll} from "./core/layers.js";
import * as R from "./tools/registry.js";
import {resize,draw,fit,delSel,setSel,selList,hitTest,V} from "./ui/canvas.js";
import {buildTools,buildOptbar,syncOptbar,syncTools} from "./ui/optbar.js";
import {buildSide,loadForms,wireForms,refresh,renderProps,
rep,eInfo,syncToggles} from "./ui/props.js";
import {wireInspector,runInspect,clearFindings} from "./ui/inspector.js";
import {wireDefaults,syncDefaults} from "./ui/defaults.js";
import {wireAI} from "./ui/ai.js";
import {setAiError} from "./ai/net.js";
import {HOOK,safe} from "./ui/bus.js";
import {loadUI,UIS,setUiError,watchUI,onUiConflict} from "./ui/store.js";
import {setPrefError} from "./core/delegate.js";
import {VERSION,VERSION_LABEL} from "./core/version.js";
import {stampPrefSchema} from "./io/store.js";
import {mountIcons} from "./ui/icons.js";
import {initRibbonCustom} from "./ui/ribbon/custom.js";
import {buildQAT,setTab,syncRibbon,syncRibbonTogs} from "./ui/ribbon/render.js";
import {wireRibbon,setShell,setClean,setTheme,ribbonSel,autoFit,runSpec,ACT,setBeginner} from "./ui/ribbon/wire.js";
import {guideRegister} from "./guide/wire.js";
import {wireAppMenu} from "./ui/appmenu.js";
import {initDock,wsApply} from "./ui/dock.js";
import {WS} from "./ui/layout.js";
import {wireStatus,syncStatus} from "./ui/statusbar.js";
import {initLevelBar} from "./ui/levelbar.js";
import {wireNav,syncNav} from "./ui/navbar.js";
import {wireOverlay,syncOverlay} from "./ui/overlay.js";
import {setTheme as setCanvasTheme} from "./ui/canvas.js";
import {wireCmd} from "./ui/cmdline.js";
import {wireDyn,syncDyn} from "./ui/dyninput.js";
import {wireCtx,ctxOpen} from "./ui/ctxmenu.js";
import {wireQuick,quickSel} from "./ui/quickprops.js";
import {initHistoryPanel,refreshHistoryPanel} from "./ui/historypanel.js";
import {help} from "./ui/helppan.js";
import {initSugg} from "./ui/sugg.js";
import {initKeymap,rbToggle} from "./ui/keymap.js";
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const cl=$("#clIn"), clP=$("#clPrompt"), clL=$("#clLive"),
clSug=$("#clSug");
function build(){
const bm=document.getElementById("bootMsg");
if(bm)bm.remove();
const prefv=stampPrefSchema();
const uiLoaded=loadUI(SAFE);
const laptop=typeof matchMedia==="function"&&matchMedia("(pointer:fine) and (min-width:1100px)").matches;
document.documentElement.toggleAttribute("data-laptop",laptop);
loadCode();
snapsLoad();
mountIcons();
initRibbonCustom();
HOOK.props=()=>{renderProps(); ribbonSel(); quickSel()};
HOOK.refresh=r=>refresh(!!r);
HOOK.status=m=>eInfo(m);
HOOK.report=(c,m)=>rep(c,m);
HOOK.prompt=()=>syncPrompt();
HOOK.toggles=()=>{syncToggles();renderOsPop();syncRibbonTogs();
syncStatus();syncNav();syncOverlay()};
HOOK.help=()=>help();
HOOK.defs=()=>syncDefaults();
HOOK.ctx=(x,y)=>ctxOpen(x,y);
HOOK.ws=w=>{
if(w.shell&&w.shell!==UIS.shell)setShell(w.shell);
if(w.tab)setTab(w.tab);
if((w.clean?1:0)!==(UIS.clean?1:0))setClean(w.clean?1:0);
syncRibbonTogs();
};
HOOK.clean=v=>setClean(!!v);
R.H.draw=draw;
R.H.rep=(c,m)=>rep(c,m);
R.H.prompt=()=>syncPrompt();
R.H.refresh=()=>refresh(false);
R.H.hit=(x,y,k)=>hitTest(x,y,k);
R.H.sel=()=>selList();
R.H.setSel=l=>setSel(l||[],null);
R.H.del=()=>delSel();
safe(import("./guide/usage.js").then(U=>{
U.loadUsage();
R.H.begin=d=>{
if(U.markUsed(d.id)){
rep("in",`أداة «${d.label||d.id}» — الدليل التعليمي (Ctrl+K) فيه شرحها الكامل`);
}
};
}),"تتبّع الاستخدام");
guideRegister({ACT,R,HOOK,extendPalette});
migrateAutosave().then(r=>{
if(r&&r.from)rep("in","نُقلت نسخةٌ احتياطية قديمة "
+"إلى المخزن الجديد — لا تُستَخدَم تلقائياً.");
});
setAfterEdit(reload=>{
try{refresh(!!reload)}
catch(e){rep("er","تحديث الواجهة: "+errMsg(e))}
refreshHistoryPanel();
refreshUnderlayPanel();
refreshPricingPanel();
try{const z=sizeNotice(); if(z)rep(z.sev,z.msg)}catch(e){}
});
setSaveError(onSaveFail);
setConflict(onConflict);
watchUI(()=>{
try{setCanvasTheme(UIS.theme); syncRibbonTogs(); refresh(false)}catch(e){}
});
onUiConflict(()=>rep("in","تخطيطُ الواجهة تبدّل في تبويبٍ آخر — "
+"تبنّيناه هنا بدل محوه."));
setRefLost(()=>rep("wr","المرجع المستورد لم يعد في متناول "
+"التراجع — أعِد استيراده إن احتجتَه. رسمك سليم."));
if(prefv.newer)rep("wr",`تفضيلاتُ هذا المتصفّح من بناءٍ أحدث `
+`(${prefv.v} مقابل ${prefv.ours}) — قد لا يُقرأ بعضُها هنا، ولم يُمحَ شيء. `
+`حدِّث البرنامجَ أو استعمل البناءَ الأحدث.`);
setPrefError((key,name)=>rep("wr",`تعذّر حفظ «${key}»`
+((name==="QuotaExceededError")?" — التخزين ممتلئ":(name?` — ${name}`:""))
+" · ما غيّرته الآن لن يبقى بعد إغلاق الصفحة."));
setAiError(n=>rep("wr","تعذّر حفظ إعداد المزوّد"
+((n==="QuotaExceededError")?" — التخزين ممتلئ":(n?` — ${n}`:""))
+" · أعِد إدخاله في الجلسة القادمة."));
setSnapError(n=>rep("wr","تعذّر تحديث فهرس اللقطات"
+((n==="QuotaExceededError")?" — التخزين ممتلئ":(n?` — ${n}`:""))
+" · قد لا تظهر آخرُ لقطةٍ في القائمة."));
onBackupSay((lv,m)=>rep(lv||"in",m));
setBackupHook(()=>{
if(!BKST.on)return;
try{bkSchedule(JSON.stringify(projToJSON()))}catch(e){}
});
bkRestore().then(r=>{
if(r&&r.ok)rep("in",`النسخةُ الاحتياطيةُ الخارجية مُفعَّلةٌ إلى «${r.name}»`);
}).catch(()=>{});
setUiError(n=>rep("wr","تعذّر حفظ تفضيلات الواجهة"
+((n==="QuotaExceededError")?" — التخزين ممتلئ":(n?` — ${n}`:""))
+" · تخطيط اللوحات والمناظر لن يبقى بعد إغلاق الصفحة. "
+"امسح ما لا تحتاجه من «CivilDraft ← امسح كل ما هو محفوظ محلّياً»."));
setCanvasTheme(UIS.theme);
document.documentElement.dataset.shell=UIS.shell;
buildTools();
buildSide();
wireForms();
wireInspector();
R.loadOpts();
wireDefaults();
initDock();
wireAI();
buildOptbar();
buildQAT();
wireAppMenu();
wireRibbon();
wireStatus();
initLevelBar();
wireNav();
wireOverlay();
wireCmd();
wireDyn();
wireCtx();
wireQuick();
wirePalette();
wireRecent();
applyDensity();
wireTour();
initSugg({cl,clSug,syncPrompt});
initKeymap({cl,syncPrompt});
const helpBot=createHelpBot({activate:toolId=>R.begin(toolId)});
mountHelpButton({onClick:()=>helpBot.toggle()});
initHistoryPanel();
installBlockDefaults();
installTemplateDefaults();
initBlockPanel();
initBlockTool({
addInstance:inst=>{(S.blocks||(S.blocks=[])).push(inst)},
redraw:()=>draw(),
snap:w=>[Math.round(w[0]),Math.round(w[1])],
defaultLayer:BLK_LAY
});
onUnderlayChange(()=>{draw(); refreshUnderlayPanel()});
onUnderlayWarn(m=>rep("er",m));
setShell(UIS.shell);
if(UIS.clean)setClean(1);
if(!SAFE && !uiLoaded && !UIS.wsCur){
wsApply("arch",1);
}
const DESKTOP=typeof window!=="undefined"&&!!(window.civilDesktop&&window.civilDesktop.isDesktop);
if(!SAFE&&typeof navigator!=="undefined"&&"serviceWorker" in navigator){
if(!DESKTOP){
let reloaded=false;
const askUpdate=reg=>{
const w=reg&&reg.waiting;
if(!w)return;
let yes=false;
try{
yes=confirm("نسخةٌ جديدةٌ من CivilDraft جاهزة.\n\n"
+"موافق = حدّث الآن (ستُعاد الصفحة — احفظ عملك أوّلاً)\n"
+"إلغاء = أكمل على هذه النسخة، والتحديثُ يُطبَّق لاحقاً");
}catch(e){yes=false}
if(!yes){rep("in","التحديثُ جاهزٌ ويُطبَّق عند فتحٍ قادم."); return}
try{w.postMessage({type:"SKIP_WAITING"})}catch(e){}
};
navigator.serviceWorker.addEventListener("controllerchange",()=>{
if(reloaded)return;
reloaded=true;
try{location.reload()}catch(e){}
});
safe(navigator.serviceWorker.register("./sw.js",{scope:"./"}).then(reg=>{
if(!reg)return;
if(reg.waiting&&navigator.serviceWorker.controller)askUpdate(reg);
reg.addEventListener("updatefound",()=>{
const inst=reg.installing;
if(!inst)return;
inst.addEventListener("statechange",()=>{
if(inst.state==="installed"&&navigator.serviceWorker.controller)
askUpdate(reg);
});
});
}),"تسجيلُ عامل الخدمة");
}}
try{
const vb=document.getElementById("stVer");
if(vb){
vb.textContent=VERSION_LABEL; vb.title=`إصدار ${VERSION} — انقر للتفاصيل والتواصل`;
import("./ui/about.js").then(M=>M.wireVersionBadge(vb)).catch(()=>{});
}
document.documentElement.dataset.ver=VERSION;
}catch(e){}
autoFit();
}
function useTemplate(name){
let r=null;
try{r=applyTemplate(name)}
catch(e){rep("er","تعذّر القالب: "+errMsg(e)); draw(); return}
if(!editFailed()&&r){rep("ok","طُبّق القالب");draw();refresh(false);autoFit()}
}
try{build()}
catch(e){
fatal((e&&e.stack)?String(e.stack).split("\n").slice(0,4).join("\n")
:errMsg(e),"بناء الواجهة");
}
let saveWarned=false;
function onSaveFail(r){
if(saveWarned)return;
saveWarned=true;
rep("er","تعذّر الحفظ التلقائي"
+((r.err==="QuotaExceededError")?" — التخزين ممتلئ":
(r.err?` — ${r.err}`:""))
+(r.refs?` · المرجع ${r.refs} كياناً`:"")
+" · احفظ المشروع ملفّاً (Ctrl+S) احتياطاً، ورسمك سليم.");
}
let conflWarned=false;
function onConflict(r){
rep("wr",`تبويبٌ آخر حفظ نسخةً أحدث (مراجعة ${r.theirs} مقابل ${r.ours||0})`
+(r.kept?" · نسختك محفوظةٌ جانباً — لن تضيع":"")+".");
if(conflWarned)return;
conflWarned=true;
const keep=conflictCopy();
const q="نسخةٌ أحدث من هذا المشروع محفوظةٌ من تبويبٍ آخر.\n\n"
+"موافق = حمّل الأحدث"+(keep?" (نسختك تبقى محفوظةً جانباً)":"")+"\n"
+"إلغاء = ثبّت نسختك أنت واكتبها فوق الأحدث";
let yes=true;
try{yes=confirm(q)}catch(e){yes=true}
if(yes){
takeNewer().then(ok=>{
if(ok){draw(); refresh(true); rep("ok","حُمّلت النسخة الأحدث.")}
else rep("er","تعذّر تحميل النسخة الأحدث — نسختك كما هي.");
}).catch(e=>rep("er","تحميل الأحدث: "+errMsg(e)));
}else{
keepMine().then(x=>{
rep(x&&x.ok?"ok":"er",x&&x.ok
?"ثُبّتت نسختك. النسخة الأخرى ما زالت محفوظةً جانباً."
:"تعذّر تثبيت نسختك.");
}).catch(e=>rep("er","تثبيت النسخة: "+errMsg(e)));
}
}
export function syncPrompt(){
const q=R.promptText();
renderKeys($("#clKeys"),R.active()?keysFor(R.T.def,R.step(),k=>R.ov(R.T.def.id,k)):[]);
const p=(q.tool?q.tool+" · ":"")+q.p;
if(clP.textContent!==p)clP.textContent=p;
const lv=q.live||"";
if(clL.textContent!==lv)clL.textContent=lv;
const hn=$("#stHint");
const h=R.active()
? (R.T.def.hint||"")+" · Esc يلغي"
: "لا أداة نشطة · انقر لتحديد · اسحب إطاراً على الفراغ";
if(hn&&hn.textContent!==h)hn.textContent=h;
syncTools();
syncRibbon();
syncDyn();
syncOptbar();
}
{const kb=$("#clKeys"); if(kb)kb.addEventListener("click",e=>{
const b=e.target.closest("[data-ins]"); if(!b)return;
const c=$("#clIn"); if(!c)return;
c.value=(c.value&&!/\s$/.test(c.value)?c.value+" ":c.value)+b.dataset.ins;
c.focus(); c.setSelectionRange(c.value.length,c.value.length);
})}
$("#tools").addEventListener("click",e=>{
const b=e.target.closest("button");
if(!b)return;
if(b.id==="bUndo"){
const ok=undo(); if(ok)jrTaint("تراجع");
rep(ok?"in":"wr","تراجع"); return;
}
if(b.id==="bRedo"){
const ok=redo(); if(ok)jrTaint("إعادة");
rep(ok?"in":"wr","إعادة"); return;
}
if(b.id==="bFit"){fit();eInfo("مُلوئم");return}
if(b.id==="bHelp"){help();return}
if(b.id==="bLall"){
const n=edit(()=>showAll(),"إظهار كل الطبقات");
if(editFailed())return;
rep(n?"ok":"in",n?`أُظهرت ${n} طبقة`:"كل الطبقات ظاهرة");
refresh(false); return;
}
const cmd=b.dataset.cmd;
if(cmd===undefined)return;
if(cmd==="@insp"){runInspect();return}
if(!cmd){jrAdd("esc"); R.cancel(true)}
else{jrAdd(cmd); R.begin(cmd)}
syncPrompt(); draw(); cl.focus();
});
$("#status").addEventListener("click",e=>{
const ob=e.target.closest("#osBtn,#polBtn");
if(ob){
pop.hidden=!pop.hidden;
renderOsPop();
placeOsPop(ob);
if(!pop.hidden&&ob.id==="polBtn"){
const i=$("#polInc");
if(i){i.focus(); i.select()}
}
return;
}
const b=e.target.closest("[data-rb]");
if(b){rbToggle(b.dataset.rb); return}
const a=e.target.closest("[data-act]");
if(!a)return;
if(a.dataset.act==="wsMenu")a.dataset.wsx="1";
runSpec({act:a.dataset.act});
});
$("#stage").addEventListener("click",e=>{
const a=e.target.closest("[data-act]");
if(a)runSpec({act:a.dataset.act});
});
const pop=$("#osPop");
function placeOsPop(btn){
if(pop.hidden||!btn)return;
const r=btn.getBoundingClientRect();
const rtl=getComputedStyle(document.documentElement)
.direction==="rtl";
const w=pop.offsetWidth||190;
const x=rtl?(innerWidth-r.right):r.left;
pop.style.insetInlineStart=Math.round(
clamp(x,4,Math.max(4,innerWidth-w-4)))+"px";
}
function renderOsPop(){
if(pop.hidden)return;
pop.innerHTML=`<h5>أنماط الالتقاط</h5>`
+MODES.map(m=>`<label><input type="checkbox" data-os="${m.k}"`
+`${+S.os[m.k]?" checked":""}> ${m.n}</label>`).join("")
+`<div class="pi">زاوية القطبي <input type="number" id="polInc"
    class="num" min="1" max="90" step="1"
    value="${clamp(parseInt(S.pol.inc,10)||15,1,90)}"> °</div>
   <div class="fr"><button data-osa="all">الكل</button>
    <button data-osa="none">لا شيء</button></div>`;
}
pop.addEventListener("change",e=>{
const t=e.target;
if(t.dataset.os){
S.os[t.dataset.os]=t.checked?1:0;
touch(); autosave(); draw();
eInfo("الالتقاط: "+osSummary());
return;
}
if(t.id==="polInc"){
S.pol.inc=clamp(parseInt(t.value,10)||15,1,90);
touch(); autosave(); draw();
eInfo(`التتبّع القطبي كل ${S.pol.inc}°`);
}
});
pop.addEventListener("click",e=>{
const a=e.target.dataset.osa;
if(!a)return;
MODES.forEach(m=>{S.os[m.k]=(a==="all")?1:0});
touch(); renderOsPop(); autosave(); draw();
eInfo("الالتقاط: "+osSummary());
});
addEventListener("mousedown",e=>{
if(pop.hidden)return;
if(!pop.contains(e.target)&&!e.target.closest("#osBtn,#polBtn"))
pop.hidden=true;
},true);
addEventListener("resize",resize);
document.addEventListener("visibilitychange",()=>{
if(document.hidden){saveNow(); bkFlush()}
else saveResume();
});
addEventListener("beforeunload",()=>{saveNow(); bkFlush()});
(async function boot(){
let had=false;
if(SAFE)rep("wr","يعمل في وضع الإنقاذ: لم تُحمَّل الجلسةُ ولا التفضيلات. "
+"المحفوظُ في مكانه كما هو — احذف ?safe من العنوان للعودة إلى الوضع العادي.");
else{
try{had=await restore()}
catch(e){rep("er","تعذّر استعادة الجلسة: "+errMsg(e))}
}
ensureShape();
shapeNotes().forEach(([sev,msg])=>rep(sev,msg));
{const z=sizeNotice(); if(z)rep(z.sev,z.msg)}
loadForms();
clearFindings();
if(!SAFE)snapAutoStart(10);
refresh(true);
safe(import("./ui/viewport.js").then(m=>m.initViewport()),"viewport")
.catch(e=>console.warn("[viewport] تعذّر تحميل تحسين الهاتف:",e&&e.message));
resize();
if(had){
fit();
rep("in",`أهلاً من جديد — استُعيدت جلستك السابقة: ${S.walls.length} جدار · `
+`${S.opens.length} فتحة · ${S.areas.length} منطقة`
+((S.ref&&S.ref.ents&&S.ref.ents.length)
?` · مرجع ${S.ref.ents.length} كياناً`:""));
const via=(had&&had.via)||had;
if(via==="migrate")rep("ok","نُقلت الجلسة إلى IndexedDB — "
+"لا حدَّ ٥ م.ب بعد الآن");
if(via==="healed")rep("wr","آخر إغلاقٍ لم يتّسع للمرجع في "
+`الحفظ السريع، فرُمِّم من النسخة الكاملة (${had.refs} كياناً). `
+"رسمك من الأحدث والمرجع من الأسبق — راجعه إن كنت حاذيتَه "
+"قُبيل الإغلاق.");
}else{
V.k=0.05; V.cx=6000; V.cy=4000;
draw();
rep("in","أهلاً بيك! ابدأ بأول نقطة جدار، أو لو حابّ تجرّب "
+"اكتب 3×4 واضغط Enter. وF1 فيها كل حاجة.");
}
if(saveMode()==="ls")rep("wr","IndexedDB غير متاح — الحفظ "
+"التلقائي في localStorage بحدّ ٥ م.ب، ومرجعٌ كبير قد لا يُحفَظ. "
+"احفظ ملفّاً بين حينٍ وحين.");
ribbonSel();
syncRibbonTogs();
if(UIS.wsCur)rep("in",
`سطح العمل: ${(WS[UIS.wsCur]&&WS[UIS.wsCur].n)||UIS.wsCur}`);
syncPrompt();
cl.focus();
const welcoming=initWelcome({
safe:SAFE,
startWall:()=>{R.begin("wall"); syncPrompt(); draw(); cl.focus()},
openDxf:()=>runSpec({act:"rImp"}),
useTemplate,
openTour:()=>tourStart(),
openStudio:()=>openStudio(),
openLearn:()=>runSpec({act:"learn"}),
search:q=>paletteQuery(q,6),
exec:it=>paletteExec(it),
setBeginner
});
if(!welcoming)tourMaybe(SAFE,had);
bootOk();
})().catch(e=>fatal(errMsg(e),"الإقلاع"));
