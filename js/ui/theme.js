import {resolve} from "../core/layers.js";
import {PRN} from "../core/laydef.js";
export {PRN as PRINT};
const DARK={
bg:"#101317",
gMinor:"#171b21", gMajor:"#1e242b", gAxis:"#3a434e",
hatch:"rgba(167,176,187,.55)", solid:"#727c88",
tint:"rgba(200,164,92,.07)",
sel:"#e3b567", sel2:"#c8a45c",
compareAdd:"#4cc38a", compareDel:"#f0706a", compareChg:"#e8b04a",
grip:"#6ea8fe", gripHov:"#e3b567", gripHot:"#e8736f",
gripLn:"#101317",
snap:"#6cc08a", snapLn:"rgba(108,192,138,.5)",
pre:"rgba(110,168,254,.62)", preTx:"#cfe3ff",
preLn:"rgba(110,168,254,.5)",
chip:"rgba(16,19,23,.9)", chip2:"rgba(16,19,23,.85)",
trkO:"rgba(108,192,138,.45)", trkP:"rgba(227,181,103,.42)",
guide:"rgba(227,181,103,.5)", path:"rgba(110,168,254,.25)",
loose:"#e8736f", bar:"#a7b0bb",
win:"#6ea8fe", winF:"rgba(110,168,254,.08)",
cross:"#6cc08a", crossF:"rgba(108,192,138,.08)",
ghost:"#e3b567",
warn:"#e3b567", bad:"#e8736f", er:"#e8736f",
dflt:"#e9edf2"
};
const LIGHT={
bg:"#f4f5f7",
gMinor:"#ebedf1", gMajor:"#e2e5ea", gAxis:"#b8c0ca",
hatch:"rgba(75,83,93,.55)", solid:"#78818c",
tint:"rgba(138,106,32,.13)",
sel:"#8a5a00", sel2:"#8a6a20",
compareAdd:"#137a43", compareDel:"#b3261e", compareChg:"#a86a00",
grip:"#1f68cc", gripHov:"#8a5a00", gripHot:"#b3261e",
gripLn:"#f4f5f7",
snap:"#137a43", snapLn:"rgba(19,122,67,.5)",
pre:"rgba(31,104,204,.7)", preTx:"#0e4794",
preLn:"rgba(31,104,204,.5)",
chip:"rgba(244,245,247,.94)", chip2:"rgba(244,245,247,.9)",
trkO:"rgba(19,122,67,.5)", trkP:"rgba(138,90,0,.5)",
guide:"rgba(138,90,0,.55)", path:"rgba(31,104,204,.3)",
loose:"#b3261e", bar:"#4b535d",
win:"#1f68cc", winF:"rgba(31,104,204,.08)",
cross:"#137a43", crossF:"rgba(19,122,67,.08)",
ghost:"#8a5a00",
warn:"#8a5a00", bad:"#b3261e", er:"#b3261e",
dflt:"#171a1e"
};
export const SCREEN={dark:DARK,light:LIGHT};
export const KEYS=Object.keys(DARK);
let CUR="dark";
export const pal=()=>SCREEN[CUR];
export const themeName=()=>CUR;
export const isDark=()=>CUR==="dark";
export function setPal(t){
CUR=(t==="light")?"light":"dark";
document.documentElement.dataset.theme=CUR;
return CUR;
}
export const layCss=L=>resolve(L,CUR).css;
export const primCss=g=>{
const P=SCREEN[CUR];
return g.bad?P.bad:(g.warn?P.warn:layCss(g.L||"0"));
};
