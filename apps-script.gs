// Premios Okupas: recibe los votos y los guarda en esta planilla.
// Se pega en Extensiones → Apps Script de una planilla de Google (ver README).
// Solo quien tenga acceso a la planilla ve los votos y los resultados.

const PERSONAS = ['Fran', 'Fede', 'Alan', 'Andi', 'Tobi', 'Titi', 'Tony', 'Nacho', 'Nano', 'El Enano', 'Pétalo'];
const CATEGORIAS = [
  'Glow up', 'Downgrade', 'Mejor vestido', 'Peor vestido', 'Gym bro', 'Tóxico',
  '+ Levanté', 'Come gatos', 'Desaparecido', 'Héroe', 'Comediante', 'NPC',
  'Fumón', 'Borracho', 'Plot twist', 'Organizador', 'Segundero', 'Mejor anécdota',
  'Chófer', 'Desarrollo de pj', 'Pj revelación', 'Repartidor', 'Frase del año',
  'Pelado', 'Mejor pelado', 'Futuro pelado', 'Personaje del año',
];
// Ternas donde cada uno escribe; después vos elegís finalistas y se votan en finalistas.html.
const ABIERTAS = ['Mejor anécdota', 'Frase del año'];

const campo = (cat) => 'c' + (CATEGORIAS.indexOf(cat) + 1);
const limpiar = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const hoja = (nombre) => SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);

// ---------------------------------------------------------------- configuración

// Correr UNA vez a mano: crea las hojas. Ojo: si la volvés a correr, borra todo.
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const crear = (n) => { const h = ss.getSheetByName(n) || ss.insertSheet(n); h.clear(); h.setFrozenRows(1); return h; };

  // Votos: una fila por persona, con todo lo que votó y lo que escribió.
  const votos = crear('Votos');
  votos.getRange(1, 1, 1, CATEGORIAS.length + 2).setValues([['Fecha', 'Votante', ...CATEGORIAS]]).setFontWeight('bold');

  // Propuestas: lo escrito en las ternas abiertas, para tildar finalistas.
  const prop = crear('Propuestas');
  prop.getRange(1, 1, 1, 5).setValues([['Fecha', 'Quién propuso', 'Terna', 'Propuesta', 'Finalista']]).setFontWeight('bold');
  prop.getRange('E2:E').setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  prop.setColumnWidth(4, 420);
  prop.getRange('D:D').setWrap(true);

  // Finalistas: votos de la segunda vuelta.
  const fin = crear('Finalistas');
  fin.getRange(1, 1, 1, ABIERTAS.length + 2).setValues([['Fecha', 'Votante', ...ABIERTAS]]).setFontWeight('bold');

  const res = crear('Resultados');
  const ultimaCol = letra(PERSONAS.length + 1);
  res.getRange(1, 1, 1, PERSONAS.length + 2).setValues([['Terna', ...PERSONAS, 'Ganador']]).setFontWeight('bold');
  let fila = 2;
  CATEGORIAS.filter((c) => !ABIERTAS.includes(c)).forEach((cat) => {
    const col = letra(CATEGORIAS.indexOf(cat) + 3); // en "Votos": A=Fecha, B=Votante, C=primera terna
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
  fila++;
  res.getRange(fila, 1).setValue('Votaron finalistas').setFontWeight('bold');
  res.getRange(fila, 2).setFormula('=COUNTA(Finalistas!B2:B)');

  ABIERTAS.forEach((cat, i) => {
    fila += 2;
    const col = letra(i + 3);
    res.getRange(fila, 1).setValue(cat + ' (finalistas)').setFontWeight('bold').setFontColor('#b8860b');
    res.getRange(fila + 1, 1).setFormula(
      `=IFERROR(QUERY(Finalistas!${col}2:${col}, "select ${col}, count(${col}) where ${col} is not null group by ${col} order by count(${col}) desc label ${col} 'Finalista', count(${col}) 'Votos'", 0), "Sin votos todavía")`,
    );
    fila += 2 + 10; // lugar para hasta 10 finalistas
  });
  res.setColumnWidth(1, 200);
}

// ---------------------------------------------------------------- menú de la planilla

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Premios Okupas')
    .addItem('Eliminar votos de una persona…', 'eliminarVotos')
    .addSeparator()
    .addItem('Generar HTML de finalistas', 'generarHtmlFinalistas')
    .addToUi();
}

// Borra todo lo de una persona: su voto, lo que escribió y su voto de finalistas.
function eliminarVotos() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Eliminar votos', `¿De quién? (${PERSONAS.join(', ')})`, ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const quien = PERSONAS.find((p) => p.toLowerCase() === r.getResponseText().trim().toLowerCase());
  if (!quien) return ui.alert(`No encontré a "${r.getResponseText()}".`);
  if (ui.alert(`¿Borrar todo lo que votó y escribió ${quien}?`, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  let total = 0;
  conLock(() => { ['Votos', 'Propuestas', 'Finalistas'].forEach((n) => { total += borrarFilasDe(hoja(n), quien); }); });
  ui.alert(total ? `Listo: se borraron los votos de ${quien}.` : `${quien} no había votado.`);
}

function borrarFilasDe(h, quien) {
  let n = 0;
  for (let r = h.getLastRow(); r >= 2; r--) {
    if (h.getRange(r, 2).getValue() === quien) { h.deleteRow(r); n++; }
  }
  return n;
}

function finalistas(cat) {
  const h = hoja('Propuestas');
  if (h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, 5).getValues()
    .filter((r) => r[2] === cat && r[4] === true)
    .map((r) => limpiar(r[3]))
    .filter((t, i, arr) => t && arr.indexOf(t) === i);
}

function generarHtmlFinalistas() {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // Una tarjeta por terna abierta. En finalistas.html la tarjeta 0 es "¿Quién sos?",
  // así que la terna k es el paso k+1.
  const bloques = ABIERTAS.map((cat, k) => {
    const paso = k + 1;
    const name = campo(cat);
    const lista = finalistas(cat);
    const opciones = lista.length
      ? `          <div class="chips largas">\n${lista.map((t, i) =>
          `            <input class="voto" type="radio" name="${name}" id="${name}-${i + 1}" value="${esc(t)}" required><label for="${name}-${i + 1}">${esc(t)}</label>`,
        ).join('\n')}\n          </div>`
      : '          <p class="vacio">Todavía no se eligieron las finalistas.</p>';
    return `        <section class="paso requiere">
          <p class="contador">Finalistas · ${k + 1} de ${ABIERTAS.length}</p>
          <h2>${cat}</h2>
${opciones}
          <nav class="nav">
            <label for="paso-${paso - 1}" class="btn sec">← Atrás</label>
            <label for="paso-${paso + 1}" class="btn sig">Siguiente →</label>
          </nav>
        </section>`;
  });
  const html = '        <!-- INICIO FINALISTAS -->\n' + bloques.join('\n\n') + '\n        <!-- FIN FINALISTAS -->';
  const dialogo = HtmlService.createHtmlOutput(
    `<p style="font-family:sans-serif;font-size:13px">Copiá todo y reemplazá en <b>finalistas.html</b> desde
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
  return p.tipo === 'final' ? guardarFinal(p) : guardarVoto(p);
}

function guardarVoto(p) {
  const valores = [];
  for (const cat of CATEGORIAS) {
    if (ABIERTAS.includes(cat)) {
      valores.push(String(p[campo(cat)] || '').trim().slice(0, 500));
    } else {
      if (!PERSONAS.includes(p[campo(cat)])) return pagina('Te faltó una terna', `Volvé atrás y votá en "${cat}".`);
      valores.push(p[campo(cat)]);
    }
  }

  conLock(() => {
    reemplazarFila(hoja('Votos'), p.votante, [new Date(), p.votante, ...valores]);
    // Lo escrito en las ternas abiertas va también a "Propuestas" (reemplaza lo anterior de esa persona).
    const prop = hoja('Propuestas');
    borrarFilasDe(prop, p.votante);
    const nuevas = ABIERTAS.map((cat) => [new Date(), p.votante, cat, valores[CATEGORIAS.indexOf(cat)]]).filter((r) => r[3]);
    if (nuevas.length) prop.getRange(prop.getLastRow() + 1, 1, nuevas.length, 4).setValues(nuevas);
  });
  return pagina('¡Voto guardado! 🏆', 'Si te arrepentiste de algo, volvé a votar y se reemplaza tu voto anterior.');
}

function guardarFinal(p) {
  const valores = [];
  for (const cat of ABIERTAS) {
    const v = limpiar(p[campo(cat)]);
    if (!finalistas(cat).includes(v)) return pagina('Te faltó una terna', `Volvé atrás y votá en "${cat}".`);
    valores.push(v);
  }
  conLock(() => reemplazarFila(hoja('Finalistas'), p.votante, [new Date(), p.votante, ...valores]));
  return pagina('¡Voto guardado! ✨', 'Si te arrepentiste, volvé a votar y se reemplaza tu voto anterior.');
}

// Si alguien abre la URL del script directamente, no ve nada.
function doGet() {
  return pagina('Premios Okupas', 'Acá no hay nada para ver 👀');
}

// ---------------------------------------------------------------- utilidades

// Un voto por persona: si ya votó, se reemplaza su fila.
function reemplazarFila(h, votante, fila) {
  const nombres = h.getRange(2, 2, Math.max(h.getLastRow() - 1, 1), 1).getValues().flat();
  const existente = nombres.indexOf(votante);
  if (existente !== -1) h.getRange(existente + 2, 1, 1, fila.length).setValues([fila]);
  else h.appendRow(fila);
}

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

function letra(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
