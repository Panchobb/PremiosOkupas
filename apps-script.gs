// Premios Okupas: recibe propuestas y votos y los guarda en esta planilla.
// Se pega en Extensiones → Apps Script de una planilla de Google (ver README).
// Solo quien tenga acceso a la planilla ve las propuestas y los resultados.

const PERSONAS = ['Fran', 'Fede', 'Alan', 'Andi', 'Tobi', 'Titi', 'Tony', 'Nacho', 'Nano', 'El Enano', 'Pétalo'];
const CATEGORIAS = [
  'Glow up', 'Downgrade', 'Mejor vestido', 'Peor vestido', 'Gym bro', 'Tóxico',
  '+ Levanté', 'Come gatos', 'Desaparecido', 'Héroe', 'Comediante', 'NPC',
  'Fumón', 'Borracho', 'Plot twist', 'Organizador', 'Segundero', 'Mejor anécdota',
  'Chófer', 'Desarrollo de pj', 'Pj revelación', 'Repartidor', 'Frase del año',
  'Personaje del año',
];
// Ternas donde no se vota a una persona: primero cada uno propone, después vos elegís finalistas.
const ABIERTAS = ['Mejor anécdota', 'Frase del año'];

const campo = (cat) => 'c' + (CATEGORIAS.indexOf(cat) + 1);
const limpiar = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- configuración

// Correr UNA vez a mano: crea las hojas "Propuestas", "Votos" y "Resultados".
// Ojo: si la volvés a correr, borra todo lo que haya.
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const prop = ss.getSheetByName('Propuestas') || ss.insertSheet('Propuestas');
  prop.clear();
  prop.getRange(1, 1, 1, 5).setValues([['Fecha', 'Quién propuso', 'Terna', 'Propuesta', 'Finalista']]).setFontWeight('bold');
  prop.getRange('E2:E').setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  prop.setColumnWidth(4, 420);
  prop.getRange('D:D').setWrap(true);
  prop.setFrozenRows(1);

  const votos = ss.getSheetByName('Votos') || ss.insertSheet('Votos');
  votos.clear();
  votos.getRange(1, 1, 1, CATEGORIAS.length + 2).setValues([['Fecha', 'Votante', ...CATEGORIAS]]).setFontWeight('bold');
  votos.setFrozenRows(1);

  const res = ss.getSheetByName('Resultados') || ss.insertSheet('Resultados');
  res.clear();
  const ultimaCol = letra(PERSONAS.length + 1);
  res.getRange(1, 1, 1, PERSONAS.length + 2).setValues([['Terna', ...PERSONAS, 'Ganador']]).setFontWeight('bold');
  let fila = 2;
  CATEGORIAS.filter((c) => !ABIERTAS.includes(c)).forEach((cat) => {
    const col = colVotos(cat);
    res.getRange(fila, 1).setValue(cat);
    PERSONAS.forEach((_, j) => {
      res.getRange(fila, j + 2).setFormula(`=COUNTIF(Votos!${col}2:${col}, ${letra(j + 2)}$1)`);
    });
    const rango = `B${fila}:${ultimaCol}${fila}`;
    res.getRange(fila, PERSONAS.length + 2)
      .setFormula(`=IF(MAX(${rango})=0, "", TEXTJOIN(", ", TRUE, FILTER(B$1:${ultimaCol}$1, ${rango}=MAX(${rango}))))`)
      .setFontWeight('bold').setFontColor('#b8860b');
    fila++;
  });

  fila++;
  res.getRange(fila, 1).setValue('Votaron').setFontWeight('bold');
  res.getRange(fila, 2).setFormula('=COUNTA(Votos!B2:B)');

  // Ternas abiertas: ranking de las finalistas más votadas.
  ABIERTAS.forEach((cat) => {
    fila += 2;
    const col = colVotos(cat);
    res.getRange(fila, 1).setValue(cat).setFontWeight('bold').setFontColor('#b8860b');
    res.getRange(fila + 1, 1).setFormula(
      `=IFERROR(QUERY(Votos!${col}2:${col}, "select ${col}, count(${col}) where ${col} is not null group by ${col} order by count(${col}) desc label ${col} 'Finalista', count(${col}) 'Votos'", 0), "Sin votos todavía")`,
    );
    fila += 2 + 10; // lugar para hasta 10 finalistas
  });
  res.setFrozenRows(1);
  res.setColumnWidth(1, 200);
}

// Menú en la planilla para generar el HTML de las finalistas.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Premios Okupas')
    .addItem('Generar HTML de finalistas', 'generarHtmlFinalistas')
    .addToUi();
}

function finalistas(cat) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Propuestas');
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 5).getValues()
    .filter((r) => r[2] === cat && r[4] === true)
    .map((r) => limpiar(r[3]))
    .filter((t, i, arr) => t && arr.indexOf(t) === i);
}

function generarHtmlFinalistas() {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const bloques = ABIERTAS.map((cat) => {
    const n = String(CATEGORIAS.indexOf(cat) + 1).padStart(2, '0');
    const name = campo(cat);
    const lista = finalistas(cat);
    const opciones = lista.length
      ? `        <div class="chips largas">\n${lista.map((t, i) =>
          `          <input type="radio" name="${name}" id="${name}-${i + 1}" value="${esc(t)}" required><label for="${name}-${i + 1}">${esc(t)}</label>`,
        ).join('\n')}\n        </div>`
      : '        <p class="vacio">Todavía no se eligieron las finalistas.</p>';
    return `      <fieldset class="card">\n        <legend><span class="n">${n}</span>${cat}</legend>\n${opciones}\n      </fieldset>`;
  });
  const html = '      <!-- INICIO FINALISTAS -->\n' + bloques.join('\n\n') + '\n      <!-- FIN FINALISTAS -->';
  const dialogo = HtmlService.createHtmlOutput(
    `<p style="font-family:sans-serif;font-size:13px">Copiá todo y reemplazá en <b>index.html</b> desde
     <code>&lt;!-- INICIO FINALISTAS</code> hasta <code>&lt;!-- FIN FINALISTAS --&gt;</code> (inclusive).</p>
     <textarea style="width:100%;height:330px;font-family:monospace;font-size:12px" readonly
       onclick="this.select()">${esc(html)}</textarea>`,
  ).setWidth(720).setHeight(440);
  SpreadsheetApp.getUi().showModalDialog(dialogo, 'HTML de finalistas');
}

// ---------------------------------------------------------------- recepción

function doPost(e) {
  const p = e.parameter || {};
  if (!PERSONAS.includes(p.votante)) return pagina('Falta elegir quién sos', 'Volvé atrás y elegí tu nombre.');
  return p.tipo === 'propuesta' ? guardarPropuestas(p) : guardarVoto(p);
}

function guardarPropuestas(p) {
  const nuevas = ABIERTAS.map((cat) => [cat, String(p[campo(cat)] || '').trim().slice(0, 500)]).filter(([, t]) => t);
  if (!nuevas.length) return pagina('No escribiste nada', 'Volvé atrás y proponé algo en al menos una terna.');

  conLock(() => {
    const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Propuestas');
    // Si ya había mandado propuestas, se reemplazan.
    for (let r = hoja.getLastRow(); r >= 2; r--) {
      if (hoja.getRange(r, 2).getValue() === p.votante) hoja.deleteRow(r);
    }
    const desde = hoja.getLastRow() + 1;
    hoja.getRange(desde, 1, nuevas.length, 4).setValues(nuevas.map(([cat, t]) => [new Date(), p.votante, cat, t]));
  });
  return pagina('¡Propuestas guardadas! ✍️', 'Cuando se elijan las finalistas, se votan junto con el resto de las ternas.');
}

function guardarVoto(p) {
  const elegidos = [];
  for (const cat of CATEGORIAS) {
    const valor = ABIERTAS.includes(cat) ? limpiar(p[campo(cat)]) : p[campo(cat)];
    const validas = ABIERTAS.includes(cat) ? finalistas(cat) : PERSONAS;
    if (!validas.includes(valor)) return pagina('Te faltó una terna', `Volvé atrás y votá en "${cat}".`);
    elegidos.push(valor);
  }

  conLock(() => {
    const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Votos');
    const fila = [new Date(), p.votante, ...elegidos];
    // Un voto por persona: si ya votó, se reemplaza.
    const nombres = hoja.getRange(2, 2, Math.max(hoja.getLastRow() - 1, 1), 1).getValues().flat();
    const existente = nombres.indexOf(p.votante);
    if (existente !== -1) hoja.getRange(existente + 2, 1, 1, fila.length).setValues([fila]);
    else hoja.appendRow(fila);
  });
  return pagina('¡Voto guardado! 🏆', 'Si te arrepentiste de algo, volvé a votar y se reemplaza tu voto anterior.');
}

// Si alguien abre la URL del script directamente, no ve nada.
function doGet() {
  return pagina('Premios Okupas', 'Acá no hay nada para ver 👀');
}

// ---------------------------------------------------------------- utilidades

function conLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { fn(); } finally { lock.releaseLock(); }
}

function pagina(titulo, texto) {
  const html = `
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <div style="font-family:system-ui,sans-serif;background:#0e0c0a;color:#f3ede4;min-height:100vh;
                margin:-8px;padding:64px 16px;text-align:center">
      <h1 style="color:#e6b450;margin:0 0 12px">${titulo}</h1>
      <p style="color:#a59a8c;margin:0">${texto}</p>
    </div>`;
  return HtmlService.createHtmlOutput(html).setTitle('Premios Okupas');
}

function colVotos(cat) {
  return letra(CATEGORIAS.indexOf(cat) + 3); // en "Votos": A=Fecha, B=Votante, C=primera terna
}

function letra(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
