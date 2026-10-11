const OBS={};
const keepObserver=(name,ob)=>{
const old=OBS[name];
if(old&&old!==ob&&old.disconnect){try{old.disconnect()}catch(e){}}
OBS[name]=ob;
return ob;
};
export const ribbonObservers=()=>Object.keys(OBS);
export function disposeRibbonObservers(){
let n=0;
Object.keys(OBS).forEach(k=>{
const ob=OBS[k];
if(ob&&ob.disconnect){try{ob.disconnect(); n++}catch(e){}}
delete OBS[k];
});
return n;
}
export function scrollState(pos,max,eps=1){
const m=Math.max(0,+max||0), p=Math.min(Math.max(0,Math.abs(+pos||0)),m);
if(m<=eps)return {start:false,end:false};
return {start:p>eps, end:p<m-eps};
}
export function planFit(widths,avail,moreW){
const n=widths.length;
if(n<=1)return n;
const total=widths.reduce((a,b)=>a+b,0);
if(total<=avail)return n;
let sum=0, keep=0;
for(let i=0;i<n;i++){
if(sum+widths[i]+moreW>avail)break;
sum+=widths[i]; keep++;
}
return Math.max(1,keep);
}
const $=s=>document.querySelector(s);
const isRtl=()=>getComputedStyle(document.documentElement).direction==="rtl";
const STEP=260;
const LEFT="l"+"eft";
function bottomBar(rb){
return getComputedStyle(rb).position==="fixed";
}
function wheelScroll(el){
el.addEventListener("wheel",e=>{
if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
const max=el.scrollWidth-el.clientWidth;
if(max<=1)return;
const dy=e.deltaMode===1?e.deltaY*32:e.deltaY;
const dir=isRtl()?-1:1;
const pos=Math.abs(el.scrollLeft);
if((dy>0&&pos>=max-1)||(dy<0&&pos<=1))return;
e.preventDefault();
el.scrollBy({[LEFT]:dir*dy,behavior:"instant"});
},{passive:false});
}
function paneOf(){return document.querySelector("#rbPanes .rbPane:not([hidden])")}
export function syncEdges(){
const wrap=$("#rbPanes");
if(!wrap)return;
const pane=paneOf();
const s=pane?scrollState(pane.scrollLeft,pane.scrollWidth-pane.clientWidth)
:{start:false,end:false};
wrap.classList.toggle("can-s",s.start);
wrap.classList.toggle("can-e",s.end);
const a=$("#rbArrS"), b=$("#rbArrE");
if(a)a.hidden=!s.start;
if(b)b.hidden=!s.end;
}
function arrow(cls,label,glyph,dirSign){
const b=document.createElement("button");
b.type="button"; b.className="rbArr "+cls; b.hidden=true;
b.title=label; b.setAttribute("aria-label",label);
b.textContent=glyph;
b.addEventListener("click",e=>{
e.stopPropagation();
const p=paneOf();
if(p)p.scrollBy({[LEFT]:(isRtl()?-1:1)*dirSign*STEP,behavior:"smooth"});
});
return b;
}
function moreBtn(){
const b=document.createElement("button");
b.type="button"; b.id="rbMoreBtn"; b.className="rbMoreBtn";
b.title="ألواحٌ أخرى"; b.setAttribute("aria-haspopup","true");
b.setAttribute("aria-expanded","false");
b.innerHTML='<span class="lb">المزيد</span><span aria-hidden="true">▾</span>';
b.addEventListener("click",e=>{e.stopPropagation(); toggleMore()});
return b;
}
export function closeMore(){
const m=$("#rbMore"), b=$("#rbMoreBtn");
if(m)m.hidden=true;
if(b)b.setAttribute("aria-expanded","false");
}
function toggleMore(){
const m=$("#rbMore"), b=$("#rbMoreBtn");
if(!m||!b)return;
const open=m.hidden;
m.hidden=!open;
b.setAttribute("aria-expanded",open?"true":"false");
}
function restore(){
const m=$("#rbMore");
const b=$("#rbMoreBtn");
if(b)b.remove();
if(!m)return;
const back=[...m.children];
back.forEach(p=>{
const home=document.getElementById(p.dataset.home||"");
if(!home){p.remove(); return}
home.appendChild(p);
});
const homes=new Set(back.map(p=>p.dataset.home));
homes.forEach(id=>{
const home=document.getElementById(id);
if(!home)return;
[...home.querySelectorAll(":scope > .rbp")]
.sort((a,c)=>(+a.dataset.i)-(+c.dataset.i))
.forEach(p=>home.appendChild(p));
});
m.hidden=true;
}
const boxW=el=>{
const cs=getComputedStyle(el);
return el.getBoundingClientRect().width
+(parseFloat(cs.marginLeft)||0)+(parseFloat(cs.marginRight)||0);
};
let lastW=-1, busy=false;
export function fitRibbon(force){
const rb=$("#ribbon");
if(!rb||busy)return;
const pane=paneOf();
if(!pane){syncEdges(); return}
const w=pane.clientWidth;
if(!force&&w===lastW){syncEdges(); return}
busy=true;
try{
lastW=w;
restore();
const kids=[...pane.querySelectorAll(":scope > .rbp")];
kids.forEach((p,i)=>{
if(p.dataset.i==null)p.dataset.i=String(i);
p.dataset.home=pane.id;
});
if(bottomBar(rb)||kids.length<2||rb.classList.contains("min")){
syncEdges(); return;
}
if(pane.scrollWidth<=pane.clientWidth+1){syncEdges(); return}
const btn=moreBtn();
pane.appendChild(btn);
const moreW=boxW(btn);
btn.remove();
const keep=planFit(kids.map(boxW),w,moreW);
if(keep>=kids.length){syncEdges(); return}
const m=$("#rbMore");
if(!m){syncEdges(); return}
kids.slice(keep).forEach(p=>m.appendChild(p));
pane.appendChild(btn);
}finally{
busy=false;
syncEdges();
}
}
export function unfitRibbon(){restore()}
export function refitRibbon(){
lastW=-1;
closeMore();
fitRibbon(true);
}
let docWired=false;
function wireDoc(){
if(docWired)return;
docWired=true;
document.addEventListener("mousedown",e=>{
const m=$("#rbMore");
if(!m||m.hidden)return;
if(e.target.closest("#rbMore,#rbMoreBtn"))return;
closeMore();
},true);
document.addEventListener("keydown",e=>{
if(e.key!=="Escape")return;
const m=$("#rbMore");
if(m&&!m.hidden){closeMore(); const b=$("#rbMoreBtn"); if(b)b.focus()}
});
let raf=0;
addEventListener("resize",()=>{
if(raf)return;
raf=requestAnimationFrame(()=>{raf=0; fitRibbon(false)});
});
}
function onWheel(e){
const p=paneOf();
if(!p||!p.contains(e.target))return;
if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
const max=p.scrollWidth-p.clientWidth;
if(max<=1)return;
const dy=e.deltaMode===1?e.deltaY*32:e.deltaY;
const pos=Math.abs(p.scrollLeft);
if((dy>0&&pos>=max-1)||(dy<0&&pos<=1))return;
e.preventDefault();
p.scrollBy({[LEFT]:(isRtl()?-1:1)*dy,behavior:"instant"});
}
export function mountOverflow(){
const wrap=$("#rbPanes");
if(!wrap)return false;
wireDoc();
if(!wrap.dataset.ov){
wrap.dataset.ov="1";
const m=document.createElement("div");
m.id="rbMore"; m.hidden=true; m.setAttribute("role","group");
m.setAttribute("aria-label","ألواحٌ أخرى");
wrap.appendChild(m);
const rtl=isRtl();
const aS=arrow("s","مرّر نحو البداية",rtl?"›":"‹",-1);
const aE=arrow("e","مرّر نحو النهاية",rtl?"‹":"›",1);
aS.setAttribute("id","rbArrS");
aE.setAttribute("id","rbArrE");
wrap.appendChild(aS);
wrap.appendChild(aE);
wrap.addEventListener("scroll",syncEdges,{capture:true,passive:true});
wrap.addEventListener("wheel",onWheel,{passive:false});
wrap.addEventListener("click",e=>{
if(e.target.closest("#rbMore"))setTimeout(closeMore,0);
});
if(typeof ResizeObserver!=="undefined"){
let raf=0;
keepObserver("ribbonWrap",new ResizeObserver(()=>{
if(raf)return;
raf=requestAnimationFrame(()=>{raf=0; fitRibbon(false)});
})).observe(wrap);
}
}
const rb=$("#ribbon");
if(rb&&!rb.dataset.hov){
rb.dataset.hov="1";
const pub=()=>document.documentElement.style.setProperty(
"--rbH",Math.ceil(rb.getBoundingClientRect().height)+"px");
pub();
if(typeof ResizeObserver!=="undefined")
keepObserver("ribbonH",new ResizeObserver(pub)).observe(rb);
}
const tabs=$("#rbTabs");
if(tabs&&!tabs.dataset.ov){tabs.dataset.ov="1"; wheelScroll(tabs)}
refitRibbon();
return true;
}
