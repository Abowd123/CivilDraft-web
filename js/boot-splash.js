const SAFETY_MS = 10000;
const SLOW_MS   = 45000;
let hidden = false;
function hideSplash(){
if(hidden)return;
hidden = true;
const el = document.getElementById("splash");
if(!el)return;
el.classList.add("splash-hide");
el.setAttribute("aria-hidden", "true");
const remove = () => el.remove();
el.addEventListener("transitionend", remove, {once:true});
setTimeout(remove, 450);
}
function showBootFail(){
if(hidden)return;
const el = document.getElementById("splash");
if(!el)return;
el.style.zIndex = "9000";
el.setAttribute("aria-label", "CivilDraft — تعذّر الإقلاع");
const tag = el.querySelector(".splash-tag");
if(tag){
tag.textContent = document.getElementById("bootErr")
? "تعذّر الإقلاع — راجع الرسالة أعلى الشاشة"
: "تعذّر الإقلاع — أعِد تحميل الصفحة (السبب في وحدة التحكّم)";
tag.style.color = "#ffb3b3";
}
const bar = el.querySelector(".splash-bar");
if(bar)bar.style.display = "none";
const mark = el.querySelector(".splash-mark");
if(mark)mark.style.animation = "none";
}
addEventListener("civildraft:bootok", hideSplash, {once:true});
const t0 = Date.now();
function safety(){
const loading = typeof document !== "undefined"
&& (document.readyState === "loading" || document.readyState === "interactive");
if(loading && Date.now()-t0 < SLOW_MS){setTimeout(safety, 2000); return}
showBootFail();
}
setTimeout(safety, SAFETY_MS);
