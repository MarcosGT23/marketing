/**
 * Parsea un archivo CSV exportado de Meta Ads (Reporte 28 días).
 * Devuelve un array de anuncios individuales con sus métricas y su estado basado
 * en la columna 'Entrega del anuncio' (filtrado frontend).
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

  // 1. Identificar columna del Nombre del anuncio
  const idxNombre = encabezados.findIndex(h =>
    h.includes('nombre del anuncio') || h.includes('ad name') || h.includes('nombre de campana') || h.includes('campaign name') || h.includes('nombre')
  );

  // 2. Identificar columna de Entrega del anuncio (prioridad máxima a "entrega del anuncio")
  let idxEstado = encabezados.findIndex(h =>
    h.includes('entrega del anuncio') || h.includes('ad delivery')
  );

  if (idxEstado === -1) {
    idxEstado = encabezados.findIndex(h =>
      h.includes('estado de la entrega') ||
      h.includes('estado del anuncio') ||
      h.includes('configuracion de la entrega') ||
      h.includes('entrega') ||
      h.includes('delivery') ||
      h === 'estado' ||
      h === 'status'
    );
  }

  // Si aún no se encontró en los encabezados, inspeccionar las primeras filas para detectar la columna
  if (idxEstado === -1) {
    const palabrasClave = ['circulacion', 'desactiv', 'pausad', 'inactiv', 'active', 'inactive'];
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

  // 3. Identificar columnas numéricas
  const idxLeads = encabezados.findIndex(h =>
    h.includes('resultados') || h.includes('clientes potenciales') || h.includes('leads')
  );
  const idxCostoLead = encabezados.findIndex(h =>
    h.includes('costo por resultado') || h.includes('coste por resultado') || h.includes('costo por cliente potencial')
  );
  const idxInversion = encabezados.findIndex(h =>
    h.includes('importe gastado') || h.includes('inversion') || h.includes('amount spent')
  );
  const idxAlcance = encabezados.findIndex(h =>
    h.includes('alcance') || h.includes('reach')
  );
  const idxCtr = encabezados.findIndex(h =>
    h.includes('ctr (porcentaje de clics en el enlace)') || h.includes('ctr') || h.includes('clics en el enlace')
  );

  const limpiarNumero = (val) => {
    if (!val) return 0;
    const limpio = String(val).replace(/["'\$%]/g, '').trim();
    return parseFloat(limpio) || 0;
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
    if (nombreNorm.includes('total') || nombreNorm.includes('resultado de')) continue;

    // Extraer y evaluar el estado de 'Entrega del anuncio'
    const rawEstado = idxEstado !== -1 ? String(fila[idxEstado] || '').trim() : '';
    const estadoMin = normalizar(rawEstado);

    // Criterios de inactividad
    const esInactivo = (
      estadoMin.includes('desactiv') ||
      estadoMin.includes('inactiv') ||
      estadoMin.includes('pausad') ||
      estadoMin.includes('pause') ||
      estadoMin.includes('archivad') ||
      estadoMin.includes('rechazad') ||
      estadoMin.includes('completad') ||
      estadoMin.includes('completed') ||
      estadoMin.includes('finalizad') ||
      estadoMin.includes('eliminad') ||
      estadoMin.includes('deleted') ||
      estadoMin.includes('no en circulaci') ||
      estadoMin.includes('no se entrega') ||
      estadoMin.includes('not delivering') ||
      estadoMin.includes('error') ||
      estadoMin.includes('sin publicar') ||
      estadoMin === 'off'
    );

    // Criterios de actividad
    const esActivo = (
      estadoMin.includes('activ') ||
      estadoMin.includes('circulaci') ||
      estadoMin.includes('marcha') ||
      estadoMin.includes('running') ||
      estadoMin.includes('programad') ||
      estadoMin.includes('revision') ||
      estadoMin.includes('aprendizaje')
    ) && !esInactivo;

    // Determinación final de activo (frontend)
    const activo = esActivo ? true : (esInactivo ? false : (rawEstado ? false : true));
    const estado_texto = rawEstado || (activo ? 'En circulación' : 'Desactivado');

    anuncios.push({
      nombre_anuncio: nombre.trim(),
      leads: idxLeads !== -1 ? Math.round(limpiarNumero(fila[idxLeads])) : 0,
      costo_por_lead: idxCostoLead !== -1 ? limpiarNumero(fila[idxCostoLead]) : 0,
      inversion: idxInversion !== -1 ? limpiarNumero(fila[idxInversion]) : 0,
      alcance: idxAlcance !== -1 ? Math.round(limpiarNumero(fila[idxAlcance])) : 0,
      ctr_clics: idxCtr !== -1 ? limpiarNumero(fila[idxCtr]) : 0,
      activo,
      estado_texto
    });
  }

  if (anuncios.length === 0) {
    throw new Error('No se encontraron anuncios válidos en el CSV.');
  }

  console.log(`[parseMetaCsv] Total: ${anuncios.length} anuncios | Activos: ${anuncios.filter(a => a.activo).length} | Inactivos: ${anuncios.filter(a => !a.activo).length}`);

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