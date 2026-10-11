export const TBDEF={
open:{
n:"جدول الأبواب والنوافذ",
cols:[["الرمز",0.14],["النوع",0.22],["العرض",0.16],
["الارتفاع",0.16],["الجلسة",0.16],["العدد",0.16]]
},
area:{
n:"جدول المساحات",
cols:[["المنطقة",0.46],["المساحة م²",0.3],["المحيط م",0.24]]
},
legend:{
n:"مفتاح الرسم",
cols:[["العيّنة",0.2],["الطبقة",0.3],["الوصف",0.5]],
sw:0
},
sym:{
n:"مفتاح الرموز",
cols:[["الرمز",0.18],["الاسم",0.40],["العدد",0.14],["الطبقة",0.28]],
ic:0
}
};
export const TBKINDS=Object.keys(TBDEF);
export const TBLIM=Object.freeze({
col:Object.freeze({min:1000,max:60000}),
row:Object.freeze({min:300,max:20000}),
rows:Object.freeze({max:200})
});
