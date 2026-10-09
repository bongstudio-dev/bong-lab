// Exporta los tokens web del Figma Master (broRXp9etWG4y2IjFyCC3V) a JSON.
// Se corre en el archivo con la Plugin API (use_figma de Claude, o la consola
// de un plugin de desarrollo). Toma las variables de 01 · Primitivas y 06 · Web
// que tienen code syntax WEB del tipo var(--nombre), resuelve los alias y
// devuelve { nombre: { valor, figma } }. Lo que devuelve va a tokens.json.
// Movimiento/* sale en ms; Resorte/* y Proporción/* sin unidad (rigidez,
// amortiguacion, escalas y fracciones de pantalla); las demas medidas en px.
// Si dos variables dan el mismo nombre con valores distintos, lo informa en
// "conflictos".
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const cn = Object.fromEntries(cols.map(c => [c.id, c.name]));
const all = await figma.variables.getLocalVariablesAsync();
const byId = Object.fromEntries(all.map(v => [v.id, v]));
const modo = v => cols.find(c => c.id === v.variableCollectionId).modes[0].modeId;
function resolver(v) { let val = v.valuesByMode[modo(v)], n = 0; while (val && val.type === 'VARIABLE_ALIAS' && n++ < 10) { const w = byId[val.id]; val = w.valuesByMode[modo(w)]; } return val; }
const h = x => Math.round(x * 255).toString(16).padStart(2, '0').toUpperCase();
function fmt(v, val) {
  if (v.resolvedType === 'COLOR') { const a = val.a === undefined ? 1 : val.a; return a >= 0.999 ? '#' + h(val.r) + h(val.g) + h(val.b) : `rgba(${Math.round(val.r * 255)}, ${Math.round(val.g * 255)}, ${Math.round(val.b * 255)}, ${+a.toFixed(2)})`; }
  if (v.resolvedType === 'FLOAT') {
    if (/^Web\/(Resorte|Proporción)\//.test(v.name)) return String(+val.toFixed(4));
    return v.name.startsWith('Web/Movimiento/') ? `${val}ms` : `${val}px`;
  }
  return String(val);
}
const tokens = {}, conflictos = [];
for (const v of all) {
  if (!/^0[16] /.test(cn[v.variableCollectionId])) continue;
  const m = ((v.codeSyntax && v.codeSyntax.WEB) || '').match(/^var\(--([a-z0-9-]+)\)$/); if (!m) continue;
  const valor = fmt(v, resolver(v));
  if (tokens[m[1]] && tokens[m[1]].valor !== valor) conflictos.push([m[1], tokens[m[1]].valor, valor, v.name]);
  if (!tokens[m[1]]) tokens[m[1]] = { valor, figma: v.name };
}
return { conflictos, tokens };
