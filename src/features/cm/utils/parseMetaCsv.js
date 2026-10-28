import { repararMojibake } from './mojibake.js';

const IDIOMAS = {
  es: { codigo: 'es', nombre: 'Español', icono: '🇪🇸' },
  en: { codigo: 'en', nombre: 'Inglés (English)', icono: '🇺🇸' },
  pt: { codigo: 'pt', nombre: 'Portugués (Português)', icono: '🇧🇷' }
};

// Monedas habituales en cuentas de Meta. El código ISO aparece en la cabecera
// del gasto ("Importe gastado (USD)") o en una columna de moneda.
export const MONEDAS = {
  USD: { codigo: 'USD', nombre: 'Dólar estadounidense', simbolo: '$' },
  BOB: { codigo: 'BOB', nombre: 'Boliviano', simbolo: 'Bs' },
  BRL: { codigo: 'BRL', nombre: 'Real brasileño', simbolo: 'R$' },
  EUR: { codigo: 'EUR', nombre: 'Euro', simbolo: '€' },
  ARS: { codigo: 'ARS', nombre: 'Peso argentino', simbolo: '$' },
  CLP: { codigo: 'CLP', nombre: 'Peso chileno', simbolo: '$' },
  COP: { codigo: 'COP', nombre: 'Peso colombiano', simbolo: '$' },
  MXN: { codigo: 'MXN', nombre: 'Peso mexicano', simbolo: '$' },
  PEN: { codigo: 'PEN', nombre: 'Sol peruano', simbolo: 'S/' },
  PYG: { codigo: 'PYG', nombre: 'Guaraní paraguayo', simbolo: '₲' },
  UYU: { codigo: 'UYU', nombre: 'Peso uruguayo', simbolo: '$U' },
  DOP: { codigo: 'DOP', nombre: 'Peso dominicano', simbolo: 'RD$' },
  GTQ: { codigo: 'GTQ', nombre: 'Quetzal guatemalteco', simbolo: 'Q' },
  CRC: { codigo: 'CRC', nombre: 'Colón costarricense', simbolo: '₡' },
  HNL: { codigo: 'HNL', nombre: 'Lempira hondureño', simbolo: 'L' },
  NIO: { codigo: 'NIO', nombre: 'Córdoba nicaragüense', simbolo: 'C$' },
  PAB: { codigo: 'PAB', nombre: 'Balboa panameño', simbolo: 'B/.' },
  VES: { codigo: 'VES', nombre: 'Bolívar venezolano', simbolo: 'Bs.S' },
  CAD: { codigo: 'CAD', nombre: 'Dólar canadiense', simbolo: 'CA$' }
};

const ALIAS_MONEDA = {
  $: 'USD', 'us$': 'USD', '$us': 'USD', usd: 'USD', dolar: 'USD', dólar: 'USD', dolares: 'USD', dólares: 'USD', dollar: 'USD', dollars: 'USD',
  bs: 'BOB', 'bs.': 'BOB', bob: 'BOB', boliviano: 'BOB', bolivianos: 'BOB',
  'r$': 'BRL', brl: 'BRL', real: 'BRL', reais: 'BRL',
  '€': 'EUR', eur: 'EUR', euro: 'EUR', euros: 'EUR',
  's/': 'PEN', 's/.': 'PEN', pen: 'PEN', sol: 'PEN', soles: 'PEN',
  'bs.s': 'VES', 'bs.s.': 'VES', bss: 'VES', ves: 'VES', bolivar: 'VES', bolívar: 'VES',
  ars: 'ARS', clp: 'CLP', cop: 'COP', mxn: 'MXN',
  '₲': 'PYG', pyg: 'PYG', guarani: 'PYG', guaraní: 'PYG',
  uyu: 'UYU', '$u': 'UYU', dop: 'DOP', 'rd$': 'DOP',
  gtq: 'GTQ', crc: 'CRC', '₡': 'CRC', hnl: 'HNL', nio: 'NIO', 'c$': 'NIO',
  pab: 'PAB', 'b/.': 'PAB', cad: 'CAD', 'ca$': 'CAD'
};

const SIMBOLOS_MONEDA = [
  [/RD\$/i, 'DOP'],
  [/CA\$/i, 'CAD'],
  [/C\$/i, 'NIO'],
  [/\$U/i, 'UYU'],
  [/R\$/i, 'BRL'],
  [/S\/\.?/i, 'PEN'],
  [/Bs\.?\s?S/i, 'VES'],
  [/Bs\.?/i, 'BOB'],
  [/B\/\./i, 'PAB'],
  [/₡/, 'CRC'],
  [/₲/, 'PYG'],
  [/€/, 'EUR'],
  [/\$/, 'USD']
];

// Diccionario de columnas de Meta Ads. `peso` indica cuánto aporta al idioma
// y `comunes` agrupa alias que no distinguen idioma (no votan).
const COLUMNAS = {
  ad_name: {
    peso: 4,
    es: ['nombre del anuncio', 'nombre de anuncio'],
    en: ['ad name', 'ad_name', 'name of ad'],
    pt: ['nome do anuncio', 'nome de anuncio']
  },
  delivery: {
    peso: 3,
    es: ['entrega del anuncio', 'estado de la entrega', 'estado del anuncio', 'entrega de anuncios', 'entrega de la campana', 'estado de la campana', 'entrega del conjunto de anuncios', 'estado del conjunto de anuncios', 'entrega'],
    en: ['ad delivery', 'delivery status', 'ad status', 'campaign delivery', 'campaign status', 'ad set delivery', 'ad set status', 'delivery'],
    pt: ['veiculacao do anuncio', 'status da veiculacao', 'entrega do anuncio', 'status do anuncio', 'entrega da campanha', 'status da campanha', 'entrega do conjunto de anuncios', 'status do conjunto de anuncios', 'veiculacao']
  },
  leads: {
    peso: 2,
    es: ['clientes potenciales', 'conversaciones con mensajes', 'contactos'],
    en: ['results', 'messaging conversations', 'contacts'],
    pt: ['clientes potenciais', 'conversas por mensagem', 'contatos'],
    comunes: ['resultados', 'leads']
  },
  cost: {
    peso: 2,
    es: ['coste por resultado', 'costo por resultado', 'coste por cliente potencial', 'costo por cliente potencial', 'costo por conversacion', 'costo por mensaje', 'costo por contacto'],
    en: ['cost per result', 'cost per lead', 'cost per messaging', 'cost per message', 'cost per contact'],
    pt: ['custo por resultado', 'custo por lead', 'custo por conversa', 'custo por mensagem', 'custo por contato']
  },
  spend: {
    peso: 2,
    es: ['importe gastado', 'monto gastado', 'inversion', 'gasto total', 'gastos'],
    en: ['amount spent', 'total spent', 'spend'],
    pt: ['valor gasto', 'montante gasto', 'investimento', 'gasto total']
  },
  reach: {
    peso: 2,
    comunes: ['alcance', 'reach']
  },
  ctr: {
    peso: 1,
    es: ['porcentaje de clics en el enlace'],
    en: ['link click-through rate', 'click-through rate'],
    pt: ['taxa de cliques no link'],
    comunes: ['ctr']
  },
  impressions: {
    peso: 1,
    es: ['impresiones'],
    en: ['impressions'],
    pt: ['impressoes']
  },
  clicks: {
    peso: 1,
    es: ['clics en el enlace', 'clics en el enlace unico'],
    en: ['link clicks'],
    pt: ['cliques no link']
  },
  campaign_name: {
    peso: 4,
    es: ['nombre de la campana', 'nombre de campana', 'campana'],
    en: ['campaign name', 'campaign'],
    pt: ['nome da campanha', 'campanha']
  },
  adset_name: {
    peso: 4,
    es: ['nombre del conjunto de anuncios', 'conjunto de anuncios', 'grupo de anuncios'],
    en: ['ad set name', 'adset name', 'ad set'],
    pt: ['nome do conjunto de anuncios', 'conjunto de anuncios']
  }
};

const COLUMNAS_METRICA = ['leads', 'cost', 'spend', 'reach', 'ctr', 'impressions', 'clicks'];
const CLAVES_DE_NIVEL = new Set(['campaign_name', 'adset_name']);
const CLAVES_NOMBRE = new Set(['ad_name', 'campaign_name', 'adset_name']);
// Columnas que mencionan "conjunto de anuncios" o "campaña" pero no son nombres.
const PATRON_NO_NOMBRE = /presupuesto|orcamento|budget|tipo de|type of|entrega|delivery|veiculacao|status|estado/;
// Cabeceras de campaña/conjunto: nunca deben usarse como columna de anuncio,
// p. ej. "Entrega de la campaña" no es la entrega del anuncio.
const PATRON_NIVEL_SUPERIOR = /campan|campaign|campanha|conjunto de anuncios|ad ?set|grupo de anuncios/;
// "CTR (porcentaje de clics en el enlace)" contiene "clics en el enlace":
// no debe confundirse con la columna de clics (unidades).
const PATRON_NO_CLICS = /ctr|porcentaje|click-?through|taxa|rate/;

// Los informes pueden venir por anuncio, conjunto de anuncios o campaña.
// El nivel se informa en los metadatos para que la UI etiquete la tabla.

/**
 * Normaliza una cabecera: repara mojibake, quita BOM/comillas, tildes y espacios extra.
 */
export function normalizarCabecera(valor) {
  const { texto } = repararMojibake(String(valor || ''));
  return texto
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function aliasDeIdioma(definicion) {
  const grupos = { es: definicion.es || [], en: definicion.en || [], pt: definicion.pt || [] };
  if (definicion.comunes) grupos.comunes = definicion.comunes;
  return grupos;
}

/**
 * Busca la mejor columna para una clave del diccionario.
 * Prioriza coincidencias exactas y alias más largos.
 */
function buscarColumna(encabezados, clave) {
  const definicion = COLUMNAS[clave];
  const candidatos = [];

  encabezados.forEach((cabecera, indice) => {
    if (!cabecera) return;
    if (CLAVES_NOMBRE.has(clave) && PATRON_NO_NOMBRE.test(cabecera)) return;
    if (clave === 'clicks' && PATRON_NO_CLICS.test(cabecera)) return;
    const cabeceraDeNivel = PATRON_NIVEL_SUPERIOR.test(cabecera);

    for (const [idioma, aliasLista] of Object.entries(aliasDeIdioma(definicion))) {
      for (const aliasCrudo of aliasLista) {
        const alias = normalizarCabecera(aliasCrudo);
        if (!alias) continue;

        // "Entrega de la campaña" solo vale como entrega si el alias también
        // es de nivel campaña/conjunto; el alias genérico "entrega" no.
        if (cabeceraDeNivel && !CLAVES_DE_NIVEL.has(clave) && !PATRON_NIVEL_SUPERIOR.test(alias)) {
          continue;
        }

        const exacto = cabecera === alias;
        if (!exacto) {
          if (alias.length < 3) continue;
          if (!cabecera.includes(alias)) continue;
        }

        candidatos.push({
          indice,
          alias,
          idioma: idioma === 'comunes' ? null : idioma,
          exacto,
          deNivelSuperior: cabeceraDeNivel,
          largo: alias.length
        });
      }
    }
  });

  if (candidatos.length === 0) return null;

  candidatos.sort((a, b) => {
    if (a.exacto !== b.exacto) return a.exacto ? -1 : 1;
    // Si existen ambas columnas, preferir la del nivel más bajo (anuncio).
    if (a.deNivelSuperior !== b.deNivelSuperior) return a.deNivelSuperior ? 1 : -1;
    return b.largo - a.largo;
  });

  return candidatos[0];
}

function listarColumnas(encabezados) {
  const visibles = encabezados
    .map((h) => repararMojibake(String(h || '')).texto.trim())
    .filter(Boolean);
  return visibles.slice(0, 10).join(', ') + (visibles.length > 10 ? '…' : '');
}

/**
 * Analiza cabeceras: columnas reconocidas, nivel del informe e idioma.
 * Nunca lanza: el llamador decide qué validar.
 */
export function analizarCabeceras(encabezadosCrudos = [], lineasMuestra = []) {
  const encabezados = encabezadosCrudos.map(normalizarCabecera);
  const columnas = {};

  Object.keys(COLUMNAS).forEach((clave) => {
    const encontrada = buscarColumna(encabezados, clave);
    if (encontrada) columnas[clave] = encontrada;
  });

  const votos = { es: 0, en: 0, pt: 0 };
  Object.entries(columnas).forEach(([clave, columna]) => {
    if (!columna.idioma) return;
    const peso = COLUMNAS[clave].peso || 1;
    votos[columna.idioma] += peso * (columna.exacto ? 2 : 1);
  });

  const votosTotales = votos.es + votos.en + votos.pt;
  let codigo = 'es';
  if (votosTotales > 0) {
    codigo = Object.entries(votos).sort((a, b) => b[1] - a[1])[0][0];
  } else {
    const porValores = detectarIdiomaPorValores(lineasMuestra);
    if (porValores) codigo = porValores;
  }

  const confianza = votosTotales > 0
    ? Math.min(1, votos[codigo] / votosTotales)
    : 0;

  const idiomaInfo = { ...IDIOMAS[codigo], confianza };

  let nivel = 'desconocido';
  if (columnas.ad_name) nivel = 'anuncio';
  else if (columnas.adset_name) nivel = 'conjunto';
  else if (columnas.campaign_name) nivel = 'campana';

  const usadas = new Set(Object.values(columnas).map((columna) => columna.indice));
  const ignoradas = encabezadosCrudos
    .filter((_, indice) => !usadas.has(indice))
    .map((h) => String(h || '').trim())
    .filter(Boolean);

  return { columnas, nivel, idiomaInfo, votos, votosTotales, ignoradas };
}

function detectarIdiomaPorValores(lineasMuestra = []) {
  const texto = lineasMuestra.join(' ').toLowerCase();
  const tokens = {
    es: ['circulacion', 'desactivad', 'pausad', 'revision', 'aprendizaje', 'programad', 'en circulacion'],
    en: ['delivering', 'paused', 'inactive', 'active', 'scheduled', 'learning', 'not delivering'],
    pt: ['veiculando', 'em veiculacao', 'desativad', 'pausad', 'em analise', 'aprendizado', 'ativo']
  };
  const puntajes = { es: 0, en: 0, pt: 0 };
  Object.entries(tokens).forEach(([idioma, lista]) => {
    lista.forEach((token) => { if (texto.includes(token)) puntajes[idioma] += 1; });
  });
  const mejor = Object.entries(puntajes).sort((a, b) => b[1] - a[1])[0];
  return mejor[1] > 0 ? mejor[0] : null;
}

/**
 * Compatibilidad: detecta el idioma a partir de encabezados y filas de muestra.
 */
export function detectarIdiomaCsv(encabezados = [], lineasMuestra = []) {
  return analizarCabeceras(encabezados, lineasMuestra).idiomaInfo;
}

/**
 * Resuelve un código ISO de moneda desde un texto: código, nombre o símbolo.
 */
function resolverMoneda(valor) {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;

  const alias = ALIAS_MONEDA[texto.toLowerCase().replace(/\s+/g, '')];
  if (alias) return alias;

  const iso = texto.toUpperCase().match(/\b([A-Z]{3})\b/);
  if (iso && MONEDAS[iso[1]]) return iso[1];

  for (const [patron, codigo] of SIMBOLOS_MONEDA) {
    if (patron.test(texto)) return codigo;
  }
  return null;
}

/**
 * Devuelve la info de una moneda por código, con respaldo genérico.
 */
export function obtenerInfoMoneda(codigo) {
  const clave = String(codigo || '').trim().toUpperCase();
  if (MONEDAS[clave]) return { ...MONEDAS[clave] };
  if (!clave) return null;
  return { codigo: clave, nombre: clave, simbolo: clave };
}

/**
 * Detecta la moneda del informe: columna de moneda, sufijo del gasto/costo
 * ("Importe gastado (BOB)") o símbolos en los importes.
 */
export function detectarMonedaCsv(encabezadosCrudos = [], filas = [], columnas = {}) {
  const indiceMoneda = encabezadosCrudos.findIndex((cabecera) =>
    /^(moneda|divisa|currency|moeda)$/.test(normalizarCabecera(cabecera))
  );
  if (indiceMoneda >= 0) {
    for (let i = 1; i < filas.length; i++) {
      const codigo = resolverMoneda(filas[i]?.[indiceMoneda]);
      if (codigo) return { ...MONEDAS[codigo], origen: 'columna' };
    }
  }

  const indicesMonetarios = ['spend', 'cost']
    .map((clave) => columnas[clave]?.indice)
    .filter((indice) => indice != null);

  for (const indice of indicesMonetarios) {
    const cabecera = String(encabezadosCrudos[indice] || '');
    const grupos = cabecera.match(/[（(][^)）]+[)）]/g) || [];
    for (const grupo of grupos) {
      const codigo = resolverMoneda(grupo.slice(1, -1));
      if (codigo) return { ...MONEDAS[codigo], origen: 'cabecera' };
    }
  }

  for (const indice of indicesMonetarios) {
    for (let i = 1; i < filas.length && i <= 10; i++) {
      const codigo = resolverMoneda(filas[i]?.[indice]);
      if (codigo) return { ...MONEDAS[codigo], origen: 'valor' };
    }
  }

  return null;
}

/**
 * Traduce y normaliza el estado de entrega del anuncio a los términos del sistema.
 */
export function traducirEstadoTexto(rawEstado, activo) {
  if (!rawEstado || typeof rawEstado !== 'string') {
    return activo ? 'En circulación' : 'Desactivado';
  }

  const normalizado = rawEstado
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (
    normalizado === 'active' ||
    normalizado === 'ativo' ||
    normalizado === 'en circulacion' ||
    normalizado === 'em veiculacao' ||
    normalizado === 'running' ||
    normalizado === 'on' ||
    normalizado === 'activo'
  ) {
    return normalizado.includes('circulacion') || normalizado.includes('veiculacao')
      ? 'En circulación'
      : 'Activo';
  }

  if (normalizado.includes('review') || normalizado.includes('analise') || normalizado.includes('revision')) {
    return 'En revisión';
  }
  if (normalizado.includes('learning') || normalizado.includes('aprendizado') || normalizado.includes('aprendizaje')) {
    return 'En aprendizaje';
  }
  if (normalizado.includes('scheduled') || normalizado.includes('programado')) {
    return 'Programado';
  }
  if (normalizado.includes('pause') || normalizado.includes('pausad')) {
    return 'Pausado';
  }
  if (normalizado === 'off' || normalizado.includes('desactivad') || normalizado.includes('desativad')) {
    return 'Desactivado';
  }
  if (
    normalizado.includes('complet') ||
    normalizado.includes('conclui') ||
    normalizado.includes('terminad') ||
    normalizado.includes('finalizad')
  ) {
    return 'Completado';
  }
  if (
    normalizado.includes('not delivering') ||
    normalizado.includes('nao esta') ||
    normalizado.includes('no se entrega')
  ) {
    return 'No se entrega';
  }
  if (normalizado.includes('reject') || normalizado.includes('rejeit') || normalizado.includes('rechazad')) {
    return 'Rechazado';
  }
  if (normalizado.includes('delet') || normalizado.includes('exclui') || normalizado.includes('eliminad')) {
    return 'Eliminado';
  }
  if (normalizado.includes('archiv')) {
    return 'Archivado';
  }

  return activo ? 'Activo' : 'Desactivado';
}

function esFilaDeTotales(nombre) {
  const texto = normalizarCabecera(nombre);
  return (
    texto === 'total' ||
    texto.startsWith('total ') ||
    texto.startsWith('resultados de') ||
    texto.startsWith('results of') ||
    texto.startsWith('resultado de') ||
    texto.includes('summary')
  );
}

/**
 * Parsea un CSV exportado de Meta Ads (informe por anuncio).
 * Detecta codificación dañada, nivel del informe y idioma (ES/EN/PT-BR),
 * y lanza errores accionables cuando el archivo no es apto.
 */
export function procesarCsvMeta(textoCsv) {
  const textoOriginal = String(textoCsv || '');
  if (!textoOriginal.trim()) {
    throw new Error('El archivo CSV está vacío o no contiene filas de datos.');
  }

  const { texto: textoReparado, reparado } = repararMojibake(textoOriginal);
  const textoLimpio = textoReparado.replace(/^\uFEFF/, '').trim();
  const delimitador = detectarDelimitador(textoLimpio);
  const filas = parsearCsv(textoLimpio, delimitador);

  if (filas.length < 2) {
    throw new Error('El archivo CSV está vacío o no contiene filas de datos.');
  }

  const encabezadosCrudos = filas[0];
  const lineasMuestra = filas.slice(1, 6).map((fila) => fila.join(' '));
  const analisis = analizarCabeceras(encabezadosCrudos, lineasMuestra);
  const { columnas, nivel, idiomaInfo, votosTotales } = analisis;
  const monedaInfo = detectarMonedaCsv(encabezadosCrudos, filas, columnas);

  // El nombre puede venir por anuncio, conjunto de anuncios o campaña.
  const columnaNombre = columnas.ad_name || columnas.adset_name || columnas.campaign_name;
  if (!columnaNombre) {
    throw new Error(
      `No se encontró una columna de nombre (anuncio, conjunto de anuncios o campaña). Columnas encontradas: ${listarColumnas(encabezadosCrudos)}`
    );
  }
  if (!COLUMNAS_METRICA.some((clave) => columnas[clave])) {
    throw new Error(
      `No se reconoció ninguna columna de métricas (Resultados, Importe gastado, Alcance o CTR). Columnas encontradas: ${listarColumnas(encabezadosCrudos)}`
    );
  }

  const valores = (fila, clave) => {
    const columna = columnas[clave];
    if (!columna) return '';
    return fila[columna.indice] ?? '';
  };

  const anuncios = [];
  let filasDescartadas = 0;
  let ctrDerivado = false;
  let costoDerivado = false;

  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i];
    if (!fila || fila.length < 2) {
      filasDescartadas++;
      continue;
    }

    const nombreCrudo = String(fila[columnaNombre.indice] ?? '').trim();
    if (!nombreCrudo || esFilaDeTotales(nombreCrudo)) {
      filasDescartadas++;
      continue;
    }

    const { texto: nombreReparado } = repararMojibake(nombreCrudo);
    const nombre = nombreReparado.trim();
    if (!nombre) {
      filasDescartadas++;
      continue;
    }

    const rawEstado = String(valores(fila, 'delivery') || '').trim();
    const estadoMin = normalizarCabecera(rawEstado);

    const esInactivo = (
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
      estadoMin.includes('pause') ||
      estadoMin.includes('inactive') ||
      estadoMin.includes('disabled') ||
      estadoMin.includes('archive') ||
      estadoMin.includes('reject') ||
      estadoMin.includes('completed') ||
      estadoMin.includes('delete') ||
      estadoMin.includes('not delivering') ||
      estadoMin.includes('not in circulation') ||
      estadoMin.includes('unpublished') ||
      estadoMin === 'off' ||
      estadoMin.includes('desativ') ||
      estadoMin.includes('inativ') ||
      estadoMin.includes('concluid') ||
      estadoMin.includes('excluid') ||
      estadoMin.includes('rejeitad') ||
      estadoMin.includes('nao esta veiculand') ||
      estadoMin.includes('desligad') ||
      estadoMin.includes('error')
    );

    const esActivo = (
      estadoMin.includes('activ') ||
      estadoMin.includes('circulaci') ||
      estadoMin.includes('marcha') ||
      estadoMin.includes('programad') ||
      estadoMin.includes('revision') ||
      estadoMin.includes('aprendizaje') ||
      estadoMin.includes('delivering') ||
      estadoMin.includes('running') ||
      estadoMin.includes('scheduled') ||
      estadoMin.includes('in review') ||
      estadoMin.includes('learning') ||
      estadoMin === 'on' ||
      estadoMin.includes('veiculand') ||
      estadoMin.includes('em veiculacao') ||
      estadoMin.includes('analise') ||
      estadoMin.includes('aprendizado') ||
      estadoMin === 'ativo'
    ) && !esInactivo;

    const activo = esActivo ? true : (esInactivo ? false : !rawEstado);
    const estado_texto = traducirEstadoTexto(rawEstado, activo);

    const leads = columnas.leads ? limpiarNumero(valores(fila, 'leads')) : 0;
    const inversion = columnas.spend ? limpiarNumero(valores(fila, 'spend')) : 0;
    const alcance = columnas.reach ? limpiarNumero(valores(fila, 'reach')) : 0;
    const impresiones = columnas.impressions ? limpiarNumero(valores(fila, 'impressions')) : 0;
    const clics = columnas.clicks ? limpiarNumero(valores(fila, 'clicks')) : 0;

    let ctr_clics = columnas.ctr ? limpiarNumero(valores(fila, 'ctr'), true) : 0;
    if (ctr_clics === 0 && clics > 0 && impresiones > 0) {
      ctr_clics = Math.round((clics / impresiones) * 100);
      ctrDerivado = true;
    }

    let costo_por_lead = columnas.cost ? limpiarNumero(valores(fila, 'cost')) : 0;
    if (costo_por_lead === 0 && leads > 0 && inversion > 0) {
      costo_por_lead = Math.round(inversion / leads);
      costoDerivado = true;
    }

    anuncios.push({
      nombre_anuncio: nombre,
      leads,
      costo_por_lead,
      inversion,
      alcance,
      ctr_clics,
      activo,
      estado_texto,
      idioma: idiomaInfo.codigo
    });
  }

  if (anuncios.length === 0) {
    throw new Error('No se encontraron anuncios válidos en el CSV. Revisa que el informe incluya filas con nombre de anuncio.');
  }

  const advertencias = [];
  if (reparado) {
    advertencias.push('Se corrigieron caracteres dañados por codificación (UTF-8 leído como Windows-1252).');
  }
  if (votosTotales === 0) {
    advertencias.push('No se pudo determinar el idioma del archivo con certeza; se asumió Español.');
  } else if (idiomaInfo.confianza < 0.5) {
    advertencias.push('Idioma detectado con baja confianza; revisa que las columnas sean correctas.');
  }
  if (!monedaInfo && columnas.spend) {
    advertencias.push('No se pudo detectar la moneda del informe; los importes se mostrarán en USD ($).');
  }
  if (ctrDerivado) {
    advertencias.push('El CSV no traía CTR; se calculó como clics en el enlace ÷ impresiones.');
  }
  if (costoDerivado) {
    advertencias.push('El CSV no traía costo por resultado; se calculó como inversión ÷ leads.');
  }

  anuncios.idiomaInfo = idiomaInfo;
  anuncios.idioma = idiomaInfo.codigo;
  anuncios.idiomaNombre = idiomaInfo.nombre;
  anuncios.nivel = nivel;
  anuncios.moneda = monedaInfo;
  anuncios.meta = {
    nivel,
    idioma: idiomaInfo.codigo,
    idiomaNombre: idiomaInfo.nombre,
    confianzaIdioma: idiomaInfo.confianza,
    moneda: monedaInfo,
    encodingReparado: reparado,
    columnas: Object.fromEntries(
      Object.entries(columnas).map(([clave, columna]) => [clave, String(encabezadosCrudos[columna.indice] || '').trim()])
    ),
    ignoradas: analisis.ignoradas,
    filasDescartadas,
    metricasCalculadas: { ctr: ctrDerivado, costo_por_resultado: costoDerivado },
    advertencias
  };

  console.log(
    `[parseMetaCsv] Idioma: ${idiomaInfo.nombre} (${idiomaInfo.codigo}, ${Math.round(idiomaInfo.confianza * 100)}%) | Moneda: ${monedaInfo?.codigo || 'sin detectar'} | Nivel: ${nivel} | Total: ${anuncios.length} | Activos: ${anuncios.filter((a) => a.activo).length} | Inactivos: ${anuncios.filter((a) => !a.activo).length}${ctrDerivado ? ' | CTR calculado' : ''}${costoDerivado ? ' | CPL calculado' : ''}`
  );

  return anuncios;
}

function detectarDelimitador(texto) {
  const finLinea = texto.search(/[\r\n]/);
  const primeraLinea = finLinea === -1 ? texto : texto.slice(0, finLinea);
  const conteo = { ',': 0, ';': 0, '\t': 0 };
  let entreComillas = false;

  for (let i = 0; i < primeraLinea.length; i++) {
    const caracter = primeraLinea[i];
    if (caracter === '"') {
      entreComillas = !entreComillas;
      continue;
    }
    if (!entreComillas && caracter in conteo) conteo[caracter] += 1;
  }

  return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0][0];
}

// Parser CSV que respeta comillas dobles y saltos de línea dentro de campos.
function parsearCsv(texto, delimitador) {
  const filas = [];
  let fila = [];
  let campo = '';
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i];

    if (entreComillas) {
      if (caracter === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        campo += caracter;
      }
      continue;
    }

    if (caracter === '"') {
      entreComillas = true;
      continue;
    }
    if (caracter === delimitador) {
      fila.push(campo.trim());
      campo = '';
      continue;
    }
    if (caracter === '\n' || caracter === '\r') {
      if (caracter === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo.trim());
      filas.push(fila);
      fila = [];
      campo = '';
      continue;
    }

    campo += caracter;
  }

  if (campo !== '' || fila.length > 0) {
    fila.push(campo.trim());
    filas.push(fila);
  }

  return filas.filter((f) => f.some((valor) => valor !== ''));
}

export function limpiarNumero(val, esCtr = false) {
  if (val == null || val === '') return 0;

  let limpio = String(val)
    .replace(/["'\s]/g, '')
    .replace(/[^\d.,-]/g, '');

  if (!limpio) return 0;

  if (limpio.includes(',') && !limpio.includes('.')) {
    limpio = limpio.replace(',', '.');
  } else if (limpio.includes(',') && limpio.includes('.')) {
    if (limpio.indexOf('.') < limpio.indexOf(',')) {
      limpio = limpio.replace(/\./g, '').replace(',', '.');
    } else {
      limpio = limpio.replace(/,/g, '');
    }
  } else if (!esCtr && /^\d+\.\d{3}$/.test(limpio)) {
    // "8.000" en métricas enteras es separador de miles, no decimal.
    limpio = limpio.replace('.', '');
  }

  const num = parseFloat(limpio);
  if (Number.isNaN(num)) return 0;

  // CTR exportado como ratio (0.035 = 3.5%) sin signo de porcentaje.
  if (esCtr && !String(val).includes('%') && num > 0 && num < 0.5) {
    return Math.round(num * 100);
  }

  return Math.round(num);
}
