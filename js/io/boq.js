import {sqm,m2,m3} from "../core/units.js";
const BOM="\ufeff";
const Q=v=>{
const s=String(v==null?"":v);
return /[",\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
};
const row=a=>a.map(Q).join(",");


const A2=v=>sqm(v);           
const L2=v=>m2(v);            
const L3=v=>m3(v);            
const V3=v=>((+v||0)/1e9).toFixed(3);    

export function toCSV(B,opt){
 const O=Object.assign({sep:"\n"},opt||{});
 const L=[];
 const put=a=>L.push(row(a));
 const gap=()=>L.push("");

  
 put(["جدول الكميات",B.name]);
 if(B.tag)put(["المستوى",B.tag]);
 put(["المقياس",`1:${B.scale}`]);
 if(B.date)put(["التاريخ",B.date]);
 put(["ارتفاع الجدار (م)",L2(B.wallH)]);
 gap();

 

 put(["المناطق"]);
 put(["المعرّف","الاسم","المساحة (م²)","المحيط (م)","الحالة","ملاحظة"]);
 B.areas.rows.forEach(r=>{
  put([r.id,r.name,A2(r.area),L2(r.perim),
   r.valid||(r.stale?"قديمة":"سليمة"),r.stale?"قديمة":""]);
 });
 put(["","المجموع",A2(B.areas.total),"",
  B.areas.stale?`${B.areas.stale} قديمة`:""]);
 gap();

 

 put(["الفتحات"]);
 put(["النوع","العدد","أصغر عرض (م)","أكبر عرض (م)",
  "أصغر ارتفاع (م)","أكبر ارتفاع (م)","المساحة (م²)","المصاريع",
  "معطوبة"]);
 B.opens.rows.forEach(r=>{
  put([r.name,r.n,L2(r.wMin),L2(r.wMax),
   L2(r.hMin),L2(r.hMax),A2(r.ar),r.pan||"",r.bad||""]);
 });
 put(["المجموع",B.opens.total,"","","","",A2(B.opens.ar),"",
  B.opens.bad||""]);
 gap();

 

 put(["الجدران"]);
 put(["النوع","العدد","الطول (م)","السماكة الأشيع (م)","سماكات",
  "الارتفاع (م)","مساحة الوجه (م²)","الحجم (م³)","فتحات"]);
 B.walls.rows.forEach(r=>{
  put([r.name,r.n,L2(r.len),L3(r.t),r.tn,
   L2(r.h),A2(r.face),V3(r.vol),r.opens||""]);
 });
 put(["المجموع",B.walls.n,L2(B.walls.len),"","","",
  A2(B.walls.face),V3(B.walls.vol),""]);

 

 if(B.cols&&B.cols.n){
  gap();
  put(["الأعمدة"]);
  put(["النوع · المادّة","العدد","أصغر مقاس (م)","أكبر مقاس (م)",
   "المساحة (م²)"]);
  B.cols.rows.forEach(r=>{
   put([r.name,r.n,L2(r.wMin),L2(r.wMax),A2(r.area)]);
  });
  put(["المجموع",B.cols.n,"","",A2(B.cols.area)]);
 }
  
 if(B.fixt&&B.fixt.n){
  gap();
  put(["الأدوات الصحية والمطبخية"]);
  put(["النوع","العدد"]);
  B.fixt.rows.forEach(r=>put([r.name,r.n]));
  put(["المجموع",B.fixt.n]);
 }
 

 if(B.stairs&&B.stairs.n){
  gap();
  put(["الدرج"]);
  put(["المعرّف","العرض (م)","عدد القوائم","طول القِلعة (م)","الحالة"]);
  B.stairs.rows.forEach(r=>{
   put([r.id,L2(r.w),r.n,L2(r.len),r.ok?"سليم":"خارج المدى المريح"]);
  });
  put(["المجموع",L2(B.stairs.len),"","",
   B.stairs.bad?`${B.stairs.bad} خارج المدى`:""]);
 }

 

 if(B.wallsDetail){
  gap();
  put(["الجدران — تفصيلي"]);
  put(["المعرّف","النوع","الطول (م)","السماكة (م)","الارتفاع (م)",
   "مساحة الوجه (م²)","الحجم (م³)","الحالة","عدد الفتحات"]);
  B.wallsDetail.forEach(r=>{
   put([r.id,r.name,L2(r.len),L3(r.t),L2(r.h),
    A2(r.face),V3(r.vol),r.state,r.opens]);
  });
 }
  
 if(B.opensDetail){
  gap();
  put(["الفتحات — تفصيلي"]);
  put(["المعرّف","النوع","العرض (م)","الارتفاع (م)","الجدار",
   "الموضع (م)","الحالة","صلاحية الطبقة"]);
  B.opensDetail.forEach(r=>{
   put([r.id,r.name,L2(r.w),L2(r.h),r.wall,L2(r.s),r.valid,r.layValid]);
  });
 }

 return {txt:BOM+L.join(O.sep)+O.sep,
  lines:L.length,
  notes:noteOf(B)};
}


export function noteOf(B){
 const n=[];
 if(B.areas.stale)
  n.push(`${B.areas.stale} منطقةً قديمة دخلت المجموع — `
   +`حدّثها بأمر arearef قبل الاعتماد عليه`);
 B.walls.rows.forEach(r=>{
  if(r.tn>1)
   n.push(`${r.name}: ${r.tn} سماكات مختلفة — `
    +`الحجم محسوبٌ بالأشيع (${m3(r.t)} م)`);
 });
 if(B.opens.total)
  n.push("أطوال الجدران ومساحاتها لا تُطرَح منها الفتحات");
 

 if(B.opens.bad)
  n.push(`${B.opens.bad} فتحةً معطوبة (تخرج عن مدى جدارها أو `
   +`تتراكب مع أخرى أو جدارها مفقود) دخلت العدّ — راجعها من لوحة `
   +`الحالة قبل الاعتماد على الجدول`);
 

 if(B.stairs&&B.stairs.bad)
  n.push(`${B.stairs.bad} درجاً خارج المدى المريح (القائمة أو `
   +`النائمة أو قاعدة 2ق+ن أو العرض) دخل العدّ — راجعه من لوحة `
   +`الخصائص قبل الاعتماد على الجدول`);
 

 const C=B.cols||{hidden:0,noplot:0,n:0}, F=B.fixt||{hidden:0,noplot:0,n:0},
  T=B.stairs||{hidden:0,noplot:0,n:0};
 const hid=B.walls.hidden+B.opens.hidden+B.areas.hidden
  +C.hidden+F.hidden+T.hidden;
 const nop=B.walls.noplot+B.opens.noplot+B.areas.noplot
  +C.noplot+F.noplot+T.noplot;
 if(hid)
  n.push(`${hid} عنصراً على طبقةٍ مخفيّة استُبعد من الجدول — `
   +`الإخفاء عرضٌ لا حذف`);
 if(nop)
  n.push(`${nop} عنصراً على طبقةٍ تُرى ولا تُطبَع استُبعد من الجدول`);
 if(!B.areas.n&&!B.walls.n&&!B.opens.total&&!C.n&&!F.n&&!T.n&&!hid&&!nop)
  n.push("المشروع فارغ");
 return n;
}
 
export const csvName=B=>String(B.name||"PLAN")
 .replace(/[\\/:*?"<>|]+/g,"_").slice(0,40).trim()
 .replace(/\s+/g,"_")+"-BOQ.csv";
