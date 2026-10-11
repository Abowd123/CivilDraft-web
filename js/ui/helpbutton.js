export function mountHelpButton(opts={}){
const bar=document.querySelector(opts.mountSelector||"#top");
if(!bar) return null;
if(bar.querySelector(".hb-open-btn")) return null;
const btn=document.createElement("button");
btn.className="hb-open-btn"; btn.type="button";
btn.setAttribute("aria-label", opts.ariaLabel||"فتح مساعد الدردشة");
btn.title=opts.title||"مساعد CivilDraft (اسأل: كيف أفعل كذا؟)";
btn.textContent=opts.label||"؟ مساعد";
const onClick=typeof opts.onClick==="function"?opts.onClick:()=>{};
btn.addEventListener("click",onClick);
const gap=bar.querySelector(".gap");
if(gap && gap.nextSibling) bar.insertBefore(btn, gap.nextSibling);
else bar.appendChild(btn);
return btn;
}
