/**
 * Detecta el idioma del CSV basado en los encabezados y contenido de muestra.
 * Soporta Español, Inglés y Portugués (los principales idiomas de exportación de Meta Ads).
 */
export function detectarIdiomaCsv(encabezados = [], lineasMuestra = []) {
  const textoHeaders = encabezados.join(' ').toLowerCase();
  const textoMuestra = lineasMuestra.join(' ').toLowerCase();
  const todo = `${textoHeaders} ${textoMuestra}`;

  let scoreEs = 0;
  let scoreEn = 0;
  let scorePt = 0;

  // Español
  const tokensEs = [
    'anuncio', 'entrega', 'nombre del anuncio', 'entrega del anuncio', 'importe gastado',
    'costo por resultado', 'coste por resultado', 'resultados', 'circulacion', 'pausado',
    'desactivado', 'alcance', 'clics en el enlace', 'campana'
  ];
  tokensEs.forEach(t => { if (todo.includes(t)) scoreEs += 2; });

  // Inglés
  const tokensEn = [
    'ad name', 'ad delivery', 'amount spent', 'cost per result', 'reach', 'results',
    'link clicks', 'click-through rate', 'delivering', 'paused', 'inactive', 'active',
    'campaign name', 'completed'
  ];
  tokensEn.forEach(t => { if (todo.includes(t)) scoreEn += 2; });

  // Portugués
  const tokensPt = [
    'veiculacao', 'nome do anuncio', 'veiculacao do anuncio', 'valor gasto', 'custo por resultado',
    'taxa de cliques', 'em veiculacao', 'desativado', 'ativo', 'campanha'
  ];
  tokensPt.forEach(t => { if (todo.includes(t)) scorePt += 2; });

  if (scoreEn > scoreEs && scoreEn > scorePt) {
    return { codigo: 'en', nombre: 'Inglés (English)', icono: '🇺🇸' };
  }
  if (scorePt > scoreEs && scorePt > scoreEn) {
    return { codigo: 'pt', nombre: 'Portugués (Português)', icono: '🇧🇷' };
  }
  return { codigo: 'es', nombre: 'Español', icono: '🇪🇸' };
}

/**
 * Parsea un archivo CSV exportado de Meta Ads (Reporte 28 días).
 * Detecta el idioma (Español, Inglés, Portugués), normaliza delimitadores y columnas,
 * y separa anuncios en Activos e Inactivos.
 */
export function procesarCsvMeta(textoCsv) {
  // Limpiar BOM de UTF-8 y dividir líneas
  const textoLimpio = textoCsv.replace(/^\uFEFF/, '').trim();
  const lineas = textoLimpio.split(/\r\n|\n/).filter(linea => linea.trim() !== '');

  if (lineas.length < 2) {
    throw new Error('El archivo CSV está vacío o no contiene filas de datos.');
  }

  // Detectar delimitador (coma o punto y coma)
  const primeraLinea = lineas[0];
  const cantComas = (primeraLinea.match(/,/g) || []).length;
  const cantPuntosComa = (primeraLinea.match(/;/g) || []).length;
  const delimitador = cantPuntosComa > cantComas ? ';' : ',';

  // Función para normalizar texto (sin tildes, minúsculas, sin comillas)
  const normalizar = (str) =>
    String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^["']|["']$/g, '')
      .trim()
      .toLowerCase();

  // Parsear encabezados usando exactamente el mismo parser de filas
  const encabezadosRaw = parsearFilaCsv(primeraLinea, delimitador);
  const encabezados = encabezadosRaw.map(normalizar);

  // 0. Detectar idioma del archivo
  const idiomaInfo = detectarIdiomaCsv(encabezados, lineas.slice(1, 6));

  // 1. Identificar columna del Nombre del anuncio (Multilingüe: ES, EN, PT)
  const idxNombre = encabezados.findIndex(h =>
    h.includes('nombre del anuncio') || 
    h.includes('ad name') || 
    h.includes('nome do anuncio') || 
    h.includes('campaign name') || 
    h.includes('nombre de campana') || 
    h.includes('nome da campanha') || 
    h.includes('nombre') || 
    h === 'name' || 
    h.includes('ad_name')
  );

  // 2. Identificar columna de Entrega del anuncio (Multilingüe: ES, EN, PT)
  let idxEstado = encabezados.findIndex(h =>
    h.includes('entrega del anuncio') || 
    h.includes('ad delivery') || 
    h.includes('veiculacao do anuncio') ||
    h.includes('delivery status') ||
    h.includes('estado de la entrega') ||
    h.includes('status da veiculacao')
  );

  if (idxEstado === -1) {
    idxEstado = encabezados.findIndex(h =>
      h.includes('estado del anuncio') ||
      h.includes('configuracion de la entrega') ||
      h.includes('delivery') ||
      h.includes('entrega') ||
      h.includes('veiculacao') ||
      h === 'estado' ||
      h === 'status'
    );
  }

  // Si aún no se encontró en los encabezados, inspeccionar las primeras filas para detectar la columna
  if (idxEstado === -1) {
    const palabrasClave = [
      'circulacion', 'desactiv', 'pausad', 'inactiv', 'active', 'inactive',
      'paused', 'delivering', 'completed', 'veiculand', 'ativo', 'desativ'
    ];
    for (let r = 1; r < Math.min(lineas.length, 5); r++) {
      const filaPrueba = parsearFilaCsv(lineas[r], delimitador);
      for (let c = 0; c < filaPrueba.length; c++) {
        const valNorm = normalizar(filaPrueba[c]);
        if (palabrasClave.some(p => valNorm.includes(p))) {
          idxEstado = c;
          break;
        }
      }
      if (idxEstado !== -1) break;
    }
  }

  // 3. Identificar columnas numéricas (Multilingüe: ES, EN, PT)
  const idxLeads = encabezados.findIndex(h =>
    h.includes('resultados') || 
    h.includes('results') || 
    h.includes('clientes potenciales') || 
    h.includes('leads') || 
    h.includes('cadastro') || 
    h.includes('contatos')
  );

  const idxCostoLead = encabezados.findIndex(h =>
    h.includes('costo por resultado') || 
    h.includes('coste por resultado') || 
    h.includes('cost per result') || 
    h.includes('custo por resultado') || 
    h.includes('costo por cliente potencial') ||
    h.includes('cost per lead') ||
    h.includes('custo por lead') ||
    h.includes('cost per') ||
    h.includes('costo por') ||
    h.includes('coste por') ||
    h.includes('custo por')
  );

  const idxInversion = encabezados.findIndex(h =>
    h.includes('importe gastado') || 
    h.includes('amount spent') || 
    h.includes('valor gasto') || 
    h.includes('inversion') || 
    h.includes('spend') ||
    h.includes('gastos')
  );

  const idxAlcance = encabezados.findIndex(h =>
    h.includes('alcance') || 
    h.includes('reach')
  );

  const idxCtr = encabezados.findIndex(h =>
    h.includes('ctr (porcentaje de clics en el enlace)') || 
    h.includes('ctr (link click-through rate)') || 
    h.includes('ctr (taxa de cliques no link)') || 
    h.includes('link click-through rate') || 
    h.includes('porcentaje de clics en el enlace') || 
    h.includes('taxa de cliques no link') || 
    h.includes('ctr') || 
    h.includes('clics en el enlace') ||
    h.includes('link clicks')
  );

  const limpiarNumero = (val) => {
    if (!val) return 0;
    let limpio = String(val).replace(/["'\$%]/g, '').trim();
    if (limpio.includes(',') && !limpio.includes('.')) {
      limpio = limpio.replace(',', '.');
    } else if (limpio.includes(',') && limpio.includes('.')) {
      if (limpio.indexOf('.') < limpio.indexOf(',')) {
        limpio = limpio.replace(/\./g, '').replace(',', '.');
      } else {
        limpio = limpio.replace(/,/g, '');
      }
    }
    const num = parseFloat(limpio);
    return isNaN(num) ? 0 : Math.round(num);
  };

  // Procesar todas las filas de anuncios
  const anuncios = [];

  for (let i = 1; i < lineas.length; i++) {
    const fila = parsearFilaCsv(lineas[i], delimitador);
    if (fila.length < 2) continue;

    const nombre = idxNombre !== -1
      ? (fila[idxNombre] || `Anuncio ${i}`)
      : `Anuncio ${i}`;

    // Saltar fila de totales si el CSV la incluye
    const nombreNorm = normalizar(nombre);
    if (
      nombreNorm.includes('total') || 
      nombreNorm.includes('resultado de') || 
      nombreNorm.includes('results of') ||
      nombreNorm.includes('summary')
    ) continue;

    // Extraer y evaluar el estado de 'Entrega del anuncio'
    const rawEstado = idxEstado !== -1 ? String(fila[idxEstado] || '').trim() : '';
    const estadoMin = normalizar(rawEstado);

    // Criterios de inactividad (Multilingüe: ES, EN, PT)
    const esInactivo = (
      // Español
      estadoMin.includes('desactiv') ||
      estadoMin.includes('inactiv') ||
      estadoMin.includes('pausad') ||
      estadoMin.includes('archivad') ||
      estadoMin.includes('rechazad') ||
      estadoMin.includes('completad') ||
      estadoMin.includes('finalizad') ||
      estadoMin.includes('eliminad') ||
      estadoMin.includes('no en circulaci') ||
      estadoMin.includes('no se entrega') ||
      estadoMin.includes('sin publicar') ||
      // Inglés
      estadoMin.includes('pause') ||
      estadoMin.includes('paused') ||
      estadoMin.includes('inactive') ||
      estadoMin.includes('disabled') ||
      estadoMin.includes('archive') ||
      estadoMin.includes('archived') ||
      estadoMin.includes('reject') ||
      estadoMin.includes('rejected') ||
      estadoMin.includes('completed') ||
      estadoMin.includes('delete') ||
      estadoMin.includes('deleted') ||
      estadoMin.includes('not delivering') ||
      estadoMin.includes('not in circulation') ||
      estadoMin.includes('unpublished') ||
      estadoMin === 'off' ||
      // Portugués
      estadoMin.includes('desativ') ||
      estadoMin.includes('inativ') ||
      estadoMin.includes('concluid') ||
      estadoMin.includes('excluid') ||
      estadoMin.includes('rejeitad') ||
      estadoMin.includes('nao esta veiculand') ||
      estadoMin.includes('desligad') ||
      // Generales
      estadoMin.includes('error')
    );

    // Criterios de actividad (Multilingüe: ES, EN, PT)
    const esActivo = (
      // Español
      estadoMin.includes('activ') ||
      estadoMin.includes('circulaci') ||
      estadoMin.includes('marcha') ||
      estadoMin.includes('programad') ||
      estadoMin.includes('revision') ||
      estadoMin.includes('aprendizaje') ||
      // Inglés
      estadoMin.includes('active') ||
      estadoMin.includes('delivering') ||
      estadoMin.includes('running') ||
      estadoMin.includes('scheduled') ||
      estadoMin.includes('in review') ||
      estadoMin.includes('learning') ||
      estadoMin === 'on' ||
      // Portugués
      estadoMin.includes('veiculand') ||
      estadoMin.includes('em veiculacao') ||
      estadoMin.includes('analise') ||
      estadoMin.includes('aprendizado')
    ) && !esInactivo;

    // Determinación final de activo (frontend)
    const activo = esActivo ? true : (esInactivo ? false : (rawEstado ? false : true));
    const estado_texto = rawEstado || (activo ? 'En circulación' : 'Desactivado');

    anuncios.push({
      nombre_anuncio: nombre.trim(),
      leads: idxLeads !== -1 ? limpiarNumero(fila[idxLeads]) : 0,
      costo_por_lead: idxCostoLead !== -1 ? limpiarNumero(fila[idxCostoLead]) : 0,
      inversion: idxInversion !== -1 ? limpiarNumero(fila[idxInversion]) : 0,
      alcance: idxAlcance !== -1 ? limpiarNumero(fila[idxAlcance]) : 0,
      ctr_clics: idxCtr !== -1 ? limpiarNumero(fila[idxCtr]) : 0,
      activo,
      estado_texto,
      idioma: idiomaInfo.codigo
    });
  }

  if (anuncios.length === 0) {
    throw new Error('No se encontraron anuncios válidos en el CSV.');
  }

  // Adjuntar metadatos de idioma al array resultante
  anuncios.idiomaInfo = idiomaInfo;
  anuncios.idioma = idiomaInfo.codigo;
  anuncios.idiomaNombre = idiomaInfo.nombre;

  console.log(`[parseMetaCsv] Idioma detectado: ${idiomaInfo.nombre} (${idiomaInfo.codigo}) | Total: ${anuncios.length} anuncios | Activos: ${anuncios.filter(a => a.activo).length} | Inactivos: ${anuncios.filter(a => !a.activo).length}`);

  return anuncios;
}

// Parser robusto de fila CSV que respeta comillas dobles y delimitador configurable
function parsearFilaCsv(textoFila, delimitador = ',') {
  const delim = delimitador === ';' ? ';' : ',';
  const regex = new RegExp(
    `(?:${delim}|\\n|^)("(?:(?:"")*[^"]*)*"|[^"${delim}\\n]*|(?:\\n|$))`,
    'g'
  );
  const valores = [];
  let match;
  while ((match = regex.exec(textoFila)) !== null && match.index < textoFila.length) {
    let valor = match[1] ? match[1].replace(/^"|"$/g, '').replace(/""/g, '"').trim() : '';
    valores.push(valor);
  }
  return valores;
}