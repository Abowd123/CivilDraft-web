import {boq} from "../core/boq.js";
import {sqm,m2,m3} from "../core/units.js";
const X=s=>String(s==null?"":s)
.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function note(sec){
const parts=[];
if(sec.hidden)parts.push(`${sec.hidden} عنصراً مخفيّاً`);
if(sec.noplot)parts.push(`${sec.noplot} غير قابلٍ للطباعة`);
return parts.length?`<p><em>${X(parts.join(" · "))}</em></p>`:"";
}
const TBL='<table border="1" cellpadding="6" cellspacing="0" width="100%">';
export function boqHTML(B){
B=B||boq();
const rows=[];
const hrow=c=>rows.push(`<tr>${c.map(x=>`<th>${X(x)}</th>`).join("")}</tr>`);
const row=c=>rows.push(`<tr>${c.map(x=>
`<td>${x.bad?`<b>${x.h}</b>`:x.h}</td>`).join("")}</tr>`);
rows.push(`<h1>${X(B.name||"مشروع")} — حصر كميات`
+(B.tag?` (${X(B.tag)})`:"")+`</h1>`);
rows.push(`<p>المقياس 1:${X(B.scale)}`
+(B.date?` · التاريخ ${X(B.date)}`:"")
+` · ارتفاع الجدار ${X(m2(B.wallH))} م</p>`);
rows.push(`<h2>الجدران</h2>${TBL}`);
hrow(["النوع","العدد","السماكة الأشيع (م)","سماكات",
"الطول (م)","وجه الجدار (م²)","الحجم (م³)","الفتحات"]);
(B.walls.rows||[]).forEach(r=>row([
{h:X(r.name)},{h:String(r.n)},{h:m3(r.t)},
{h:r.tn>1?String(r.tn):"—"},
{h:m2(r.len)},{h:sqm(r.face)},
{h:m3(r.vol)},{h:String(r.opens||0)}]));
rows.push(`</table>${note(B.walls)}`);
rows.push(`<h2>الفتحات</h2>${TBL}`);
hrow(["النوع","العدد","أصغر عرض (م)","أكبر عرض (م)",
"المساحة (م²)","المصاريع","معطوبة"]);
(B.opens.rows||[]).forEach(r=>row([
{h:X(r.name)},{h:String(r.n)},{h:m2(r.wMin)},{h:m2(r.wMax)},
{h:sqm(r.ar)},{h:r.pan?String(r.pan):"—"},
{h:r.bad?String(r.bad):"—",bad:!!r.bad}]));
rows.push(`</table>${note(B.opens)}`);
rows.push(`<h2>المناطق</h2>${TBL}`);
hrow(["المعرّف","الاسم","المساحة (م²)","المحيط (م)","الحالة"]);
(B.areas.rows||[]).forEach(r=>row([
{h:X(r.id)},{h:X(r.name)},{h:sqm(r.area)},{h:m2(r.perim)},
{h:X(r.valid||(r.stale?"قديمة":"سليمة")),bad:!!r.stale}]));
rows.push(`</table>${note(B.areas)}`);
if(B.cols&&B.cols.n){
rows.push(`<h2>الأعمدة</h2>${TBL}`);
hrow(["النوع · المادّة","العدد","أصغر مقاس (م)","أكبر مقاس (م)","المساحة (م²)"]);
(B.cols.rows||[]).forEach(r=>row([
{h:X(r.name)},{h:String(r.n)},{h:m2(r.wMin)},{h:m2(r.wMax)},{h:sqm(r.area)}]));
rows.push(`</table>${note(B.cols)}`);
}
if(B.fixt&&B.fixt.n){
rows.push(`<h2>الأدوات الصحية والمطبخية</h2>${TBL}`);
hrow(["النوع","العدد"]);
(B.fixt.rows||[]).forEach(r=>row([{h:X(r.name)},{h:String(r.n)}]));
rows.push(`</table>${note(B.fixt)}`);
}
if(B.stairs&&B.stairs.n){
rows.push(`<h2>الدرج</h2>${TBL}`);
hrow(["المعرّف","العرض (م)","عدد القوائم","طول القِلعة (م)","الحالة"]);
(B.stairs.rows||[]).forEach(r=>row([
{h:X(r.id)},{h:m2(r.w)},{h:String(r.n)},{h:m2(r.len)},
{h:r.ok?"سليم":"خارج المدى المريح",bad:!r.ok}]));
rows.push(`</table>${note(B.stairs)}`);
}
const body=rows.join("\n");
return `<!DOCTYPE html><html lang="ar" dir="rtl"><head>`
+`<meta charset="utf-8"><title>${X(B.name||"مشروع")} — حصر كميات</title>`
+`</head><body>${body}</body></html>`;
}
export function opensCSV(B){
B=B||boq();
const q=v=>{
const s=String(v==null?"":v);
return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
 };
 const head=["النوع","العدد","أصغر عرض (م)","أكبر عرض (م)",
  "المساحة (م²)","المصاريع","معطوبة"];
 const lines=[head].concat((B.opens.rows||[]).map(r=>
  [r.name,r.n,m2(r.wMin),m2(r.wMax),sqm(r.ar),r.pan||0,r.bad||0]));
 return "\uFEFF"+lines.map(row=>row.map(q).join(",")).join("\r\n")+"\r\n";
}
