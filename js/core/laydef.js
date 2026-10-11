const BASE={
"A-WALL":     {c:7, lw:50, css:"#e8eef4"},
"A-WALL-PATT":{c:8, lw:13, css:"#6d7987"},
"A-WALL-LOW": {c:8, lw:18, css:"#95a3b5"},
"A-COLS":     {c:6, lw:50, css:"#d9a3e8"},
"A-STRU":     {c:6, lw:35, css:"#c08adf"},
"A-DOOR":     {c:3, lw:25, css:"#7fe0a6"},
"A-GLAZ":     {c:4, lw:25, css:"#86ccf0"},
"A-FIXT":     {c:5, lw:18, css:"#a4b6f0"},
"A-ELEC":     {c:2, lw:13, css:"#f0c674"},
"A-FURN":     {c:3, lw:13, css:"#9ad9a4"},
"A-STRS":     {c:5, lw:25, css:"#8fa6f0"},
"A-ROOF":     {c:4, lw:25, css:"#86ccf0"},
"A-ROOF-PATT":{c:8, lw:13, css:"#6d7987"},
"A-PLINE":    {c:7, lw:18, css:"#a8b8c4"},
"A-BLKS":     {c:30,lw:18, css:"#e0b08a"},
"A-ELEV":     {c:7, lw:50, css:"#e8eef4"},
"A-SECT":     {c:7, lw:50, css:"#e8eef4"},
"A-AREA":     {c:2, lw:18, css:"#e8c46a"},
"A-DIMS":     {c:1, lw:13, css:"#f09a9a"},
"A-ANNO":     {c:2, lw:18, css:"#d9c489"},
"A-CALLOUT":  {c:2, lw:25, css:"#ffd06b"},
"A-CLOUD":    {c:1, lw:25, css:"#f0655a"},
"A-GRID":     {c:8, lw:9,  css:"#5d6876"},
"A-SHET":     {c:7, lw:35, css:"#9daab4"},
"A-REFR":     {c:8, lw:9,  css:"#69737f"}
};
export {BASE as LAYERS};
export const PRN={
"A-WALL":"#000000","A-WALL-PATT":"#6a6a6a","A-WALL-LOW":"#555555",
"A-COLS":"#4a2d5c","A-DOOR":"#1a6b3c","A-GLAZ":"#12557f",
"A-STRU":"#3f2a52","A-FIXT":"#3a4a7a","A-ELEC":"#8a5a00","A-FURN":"#2f6b3a","A-STRS":"#3a4a7a","A-ROOF":"#12557f","A-ROOF-PATT":"#6a6a6a","A-BLKS":"#7a4f2a","A-ELEV":"#000000",
"A-SECT":"#000000",
"A-PLINE":"#000000","A-CALLOUT":"#a02020","A-CLOUD":"#b00020",
"A-AREA":"#8a6d1f",
"A-DIMS":"#a02020","A-ANNO":"#7a5f14","A-GRID":"#7a7a7a",
"A-SHET":"#000000","A-REFR":"#999999"
};
export const LT={
solid:  {n:"متّصل",         dxf:"CONTINUOUS", mm:[]},
dash:   {n:"مشروح",         dxf:"DASHED",     mm:[6,3]},
hidden: {n:"مخفيّ",          dxf:"HIDDEN",     mm:[3,2]},
center: {n:"محوري",         dxf:"CENTER",     mm:[12,2,2,2]},
dashdot:{n:"شرطة ونقطة",    dxf:"DASHDOT",    mm:[8,2,0.2,2]},
dot:    {n:"منقّط",          dxf:"DOT",        mm:[0.2,3]}
};
export const ltOf=k=>LT[k]||LT.solid;
export const LWS=[
[0,"افتراضي"],[5,"0.05"],[9,"0.09"],[13,"0.13"],[15,"0.15"],
[18,"0.18"],[20,"0.20"],[25,"0.25"],[30,"0.30"],[35,"0.35"],
[40,"0.40"],[50,"0.50"],[60,"0.60"],[70,"0.70"],[80,"0.80"],
[100,"1.00"],[120,"1.20"],[140,"1.40"],[200,"2.00"]
];
export const lwOk=v=>{
const n=Math.round(+v||0);
let best=0, bd=1/0;
LWS.forEach(([w])=>{
const d=Math.abs(w-n);
if(d<bd){bd=d; best=w}
});
return best;
};
export const ORDER=[
"A-WALL","A-WALL-PATT","A-WALL-LOW","A-COLS","A-STRU",
"A-DOOR","A-GLAZ","A-STRS","A-ROOF","A-ROOF-PATT","A-PLINE","A-BLKS",
"A-FIXT","A-FURN","A-ELEC","A-ELEV","A-SECT",
"A-AREA","A-DIMS","A-ANNO","A-CALLOUT","A-CLOUD",
"A-GRID","A-SHET","A-REFR"
];
export const DESC={
"A-WALL":"الجدران","A-WALL-PATT":"تعبئة الجدران",
"A-WALL-LOW":"السَّتَر والجدران المنخفضة","A-COLS":"الأعمدة",
"A-STRU":"الكمرات والقواعد والبلاطات",
"A-DOOR":"الأبواب","A-GLAZ":"الشبابيك والفتحات",
"A-STRS":"الدرج","A-ROOF":"السقف","A-ROOF-PATT":"تعبئة السقف","A-BLKS":"مكتبة العناصر (الكتل)",
"A-FIXT":"الأدوات الصحية","A-FURN":"الأثاث","A-ELEC":"الكهرباء",
"A-ELEV":"الواجهات",
"A-SECT":"المقاطع",
"A-AREA":"المناطق والمساحات","A-DIMS":"الأبعاد والسلاسل",
"A-ANNO":"النصوص والقوائد","A-GRID":"المحاور",
"A-SHET":"الورقة وبلوك العنوان","A-REFR":"المرجع المستورد",
"A-PLINE":"الخطوط المتعددة",
"A-CALLOUT":"أوسمة التفاصيل",
"A-CLOUD":"سحب المراجعة"
};
export const AUX=new Set(["A-WALL-PATT","A-BLKS","A-GRID","A-SHET","A-REFR","A-CALLOUT"]);
export const BLK_LAY="A-BLKS";
export const layRow=n=>{
const b=BASE[n]||{};
return {n,
col:b.css||"#e8eef4",
pcol:PRN[n]||"#000000",
aci:(b.c===undefined)?7:b.c,
lw:lwOk(b.lw||0),
lt:"solid",
op:0,
off:0, lk:0,
plot:(n==="A-REFR"||n==="A-CLOUD")?0:1,
d:DESC[n]||n};
};
export const DEFLAYS=()=>{
const seen=new Set(ORDER);
const rest=Object.keys(BASE).filter(n=>!seen.has(n));
return ORDER.concat(rest).filter(n=>BASE[n]).map(layRow);
};
