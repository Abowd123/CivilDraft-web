export const norm=s=>String(s==null?"":s).toLowerCase()
.replace(/[\u064B-\u0652\u0670\u0640]/g,"")
.replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
.replace(/\s+/g," ").trim();
const KB={ض:"q",ص:"w",ث:"e",ق:"r",ف:"t",غ:"y",ع:"u",ه:"i",
خ:"o",ح:"p",ش:"a",س:"s",ي:"d",ب:"f",ل:"g",ا:"h",ت:"j",
ن:"k",م:"l",ئ:"z",ء:"x",ؤ:"c",ر:"v",ى:"n",ة:"m",
ج:"[",د:"]",ك:";",ط:"'",و:",",ز:".",ظ:"/"};
export const toLat=s=>[...String(s||"")].map(c=>KB[c]===undefined?c:KB[c]).join("");
export function score(hay,q){
if(!q)return 0;
hay=norm(hay); q=norm(q);
if(hay.startsWith(q))return 1000-hay.length;
const i=hay.indexOf(q);
if(i>=0)return 700-i-hay.length*.1;
let s=0,j=0,run=0;
for(const ch of q){
const k=hay.indexOf(ch,j);
if(k<0)return -1;
run=(k===j)?run+1:0;
s+=10+run*6-Math.min(k-j,20)*.5;
j=k+1;
}
return s;
}
