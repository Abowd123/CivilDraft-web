export const LIM = Object.freeze({
coord:      Object.freeze({min: -1e9, max: 1e9}),
length:     Object.freeze({min: 0,    max: 1e9}),
thickness:  Object.freeze({min: 50,   max: 1000}),
height:     Object.freeze({min: 0,    max: 8000}),
geomTol:    Object.freeze({min: 0.1,  max: 5,   def: 1}),
weldTol:    Object.freeze({min: 0.5,  max: 5,   def: 2}),
arcTol:     Object.freeze({min: 0.1,  max: 2,   def: 0.5}),
vertices:   Object.freeze({min: 0,    max: 20000}),
elements:   Object.freeze({min: 0,    max: 60000}),
text:       Object.freeze({min: 0,    max: 120}),
imageBytes: Object.freeze({min: 0,    max: 4 * 1024 * 1024}),
refEnts:    Object.freeze({min: 0,    max: 60000}),
refPts:     Object.freeze({min: 0,    max: 20000}),
blockPrims: Object.freeze({min: 0,    max: 500}),
blockDefs:  Object.freeze({min: 0,    max: 2000}),
ltypes:     Object.freeze({min: 0,    max: 100}),
dimstyles:  Object.freeze({min: 0,    max: 100}),
hatches:    Object.freeze({min: 0,    max: 100}),
aiQuestion: Object.freeze({min: 0,    max: 8000}),
aiContext:  Object.freeze({min: 0,    max: 20000}),
aiResponse: Object.freeze({min: 0,    max: 1024 * 1024}),
aiOps:      Object.freeze({min: 0,    max: 200}),
rvItems:    Object.freeze({min: 0,    max: 200}),
rvMsg:      Object.freeze({min: 0,    max: 300}),
rvSug:      Object.freeze({min: 0,    max: 200}),
sheets:            Object.freeze({min: 0, max: 200}),
sheetCustom:       Object.freeze({min: 100, max: 2000}),
viewportsPerSheet: Object.freeze({min: 0, max: 50}),
vpModelRectMM:     Object.freeze({min: 1, max: 1e7}),
vpPaperRectMM:     Object.freeze({min: 1, max: 100000}),
callouts:          Object.freeze({min: 0, max: 2000}),
groups:            Object.freeze({min: 0, max: 500}),
groupMembers:      Object.freeze({min: 0, max: 60000}),
livefields:        Object.freeze({min: 0, max: 500})
});
export const UILIM=Object.freeze({
searchResults:   Object.freeze({min: 1, max: 12,  def: 12}),
paletteResults:  Object.freeze({min: 1, max: 120, def: 120}),
menuResults:     Object.freeze({min: 1, max: 10,  def: 10}),
layerRows:       Object.freeze({min: 1, max: 60,  def: 60}),
logRows:         Object.freeze({min: 1, max: 400, def: 400}),
debounceMs:      Object.freeze({min: 0, max: 1000, def: 120}),
saveDebounceMs:  Object.freeze({min: 0, max: 5000, def: 400}),
});
export const limMin = lim => (lim && lim.min != null) ? lim.min : null;
export const limMax = lim => (lim && lim.max != null) ? lim.max : null;
export function inLim(v, lim) {
if (typeof v !== "number" || !isFinite(v)) return false;
const lo = limMin(lim), hi = limMax(lim);
if (lo != null && v < lo) return false;
if (hi != null && v > hi) return false;
return true;
}
