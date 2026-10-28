import test from 'node:test';
import assert from 'node:assert/strict';
import { procesarCsvMeta, detectarIdiomaCsv, limpiarNumero } from '../src/features/cm/utils/parseMetaCsv.js';

const CSV_ES = [
  'Nombre del anuncio;Entrega del anuncio;Resultados;Importe gastado (BOB);Alcance;CTR (porcentaje de clics en el enlace)',
  '"Oferta Ñandú";En circulación;12;1.234,50;8.000;2,5%',
  'Anuncio pausado;Pausado;3;200,00;1.500;1,2%',
  ';Activo;9;99;99;9'
].join('\r\n');

const CSV_EN = [
  'Ad name,Ad delivery,Results,Amount spent,Reach,CTR (link click-through rate)',
  'Ad Alpha,active,10,100.50,5000,2.5',
  'Ad Beta,paused,5,50,2000,1.2'
].join('\n');

const CSV_PT = [
  'Nome do anúncio,Veiculação do anúncio,Resultados,Valor gasto (BRL),Alcance,CTR (taxa de cliques no link)',
  'Anúncio Ação,Em veiculação,9,"R$ 1.200,50",4000,1,8%',
  'Anúncio Parado,Desativado,2,"R$ 100,00",900,1,0%'
].join('\n');

test('detecta informe español, separador ";" y decimales latinos', () => {
  const anuncios = procesarCsvMeta(CSV_ES);

  assert.equal(anuncios.idioma, 'es');
  assert.equal(anuncios.nivel, 'anuncio');
  assert.equal(anuncios.length, 2);
  assert.equal(anuncios.meta.filasDescartadas, 1);
  assert.equal(anuncios[0].nombre_anuncio, 'Oferta Ñandú');
  assert.equal(anuncios[0].inversion, 1235);
  assert.equal(anuncios[0].alcance, 8000);
  assert.equal(anuncios[0].activo, true);
  assert.equal(anuncios[0].estado_texto, 'En circulación');
  assert.equal(anuncios[1].activo, false);
  assert.equal(anuncios[1].estado_texto, 'Pausado');
  assert.equal(anuncios.moneda.codigo, 'BOB');
  assert.equal(anuncios.moneda.simbolo, 'Bs');
});

test('detecta informe inglés y clasifica estados', () => {
  const anuncios = procesarCsvMeta(CSV_EN);

  assert.equal(anuncios.idioma, 'en');
  assert.equal(anuncios.length, 2);
  assert.equal(anuncios[0].activo, true);
  assert.equal(anuncios[1].activo, false);
  assert.equal(anuncios[1].estado_texto, 'Pausado');
  assert.equal(anuncios[0].costo_por_lead, 10);
});

test('detecta informe portugués de Brasil', () => {
  const anuncios = procesarCsvMeta(CSV_PT);

  assert.equal(anuncios.idioma, 'pt');
  assert.equal(anuncios.idiomaNombre, 'Portugués (Português)');
  assert.equal(anuncios[0].nombre_anuncio, 'Anúncio Ação');
  assert.equal(anuncios[0].estado_texto, 'En circulación');
  assert.equal(anuncios[1].activo, false);
  assert.equal(anuncios[1].estado_texto, 'Desactivado');
});

test('repara mojibake en cabeceras, nombres y estados', () => {
  const mojibake = [
    'Nombre del anuncio,Entrega del anuncio,Resultados,Importe gastado',
    'Anuncio Ã±andÃº,En circulaciÃ³n,3,10',
    'CampaÃ±a vieja,Pausado,1,5'
  ].join('\n');

  const anuncios = procesarCsvMeta(mojibake);

  assert.equal(anuncios[0].nombre_anuncio, 'Anuncio ñandú');
  assert.equal(anuncios[0].estado_texto, 'En circulación');
  assert.equal(anuncios[0].activo, true);
  assert.equal(anuncios.meta.encodingReparado, true);
  assert.ok(anuncios.meta.advertencias.some(a => a.includes('codificación')));
});

test('acepta informes agrupados por campaña y usa el nombre de la campaña', () => {
  const csv = [
    '"Inicio del informe","Fin del informe","Nombre de la campaña","Entrega de la campaña","Configuración de atribución",Resultados,"Indicador de resultado","Costo por resultados","Presupuesto del conjunto de anuncios","Tipo de presupuesto del conjunto de anuncios","Monto gastado (USD)",Impresiones,Alcance,Finalización,"Resultados (iniciales)","Indicador de resultados (iniciales)"',
    '2026-09-28,2026-10-28,"Casa en venta, Hacienda del Urubo 750.000",active,"7 días tras clic o 1 día tras visualización",4,actions:onsite_conversion.messaging_conversation_started_7d,1.1025,2,Diario,4.41,1427,1013,"En curso",,'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios.nivel, 'campana');
  assert.equal(anuncios.length, 1);
  assert.equal(anuncios[0].nombre_anuncio, 'Casa en venta, Hacienda del Urubo 750.000');
  assert.equal(anuncios[0].leads, 4);
  assert.equal(anuncios[0].costo_por_lead, 1);
  assert.equal(anuncios[0].inversion, 4);
  assert.equal(anuncios[0].alcance, 1013);
  assert.equal(anuncios[0].activo, true);
  assert.equal(anuncios.meta.columnas.campaign_name, 'Nombre de la campaña');
  assert.equal(anuncios.moneda.codigo, 'USD');
});

test('acepta informes agrupados por conjunto de anuncios', () => {
  const csv = [
    'Nombre del conjunto de anuncios,Entrega del conjunto de anuncios,Resultados,Importe gastado',
    'Conjunto A,Activo,5,100'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios.nivel, 'conjunto');
  assert.equal(anuncios[0].nombre_anuncio, 'Conjunto A');
  assert.equal(anuncios[0].leads, 5);
});

test('detecta la moneda USD desde la cabecera del gasto', () => {
  const csv = [
    'Nombre de la campaña,Entrega de la campaña,Resultados,Monto gastado (USD),Alcance',
    'Campaña A,active,4,4.41,1013'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios.moneda.codigo, 'USD');
  assert.equal(anuncios.moneda.simbolo, '$');
  assert.equal(anuncios.moneda.origen, 'cabecera');
  assert.equal(anuncios.meta.moneda.codigo, 'USD');
});

test('detecta moneda BRL y su símbolo', () => {
  const csv = [
    'Nome do anúncio,Veiculação do anúncio,Resultados,Valor gasto (BRL)',
    'Anúncio A,Em veiculação,2,"R$ 100"'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios.moneda.codigo, 'BRL');
  assert.equal(anuncios.moneda.simbolo, 'R$');
});

test('detecta moneda desde una columna dedicada', () => {
  const csv = [
    'Nombre del anuncio,Entrega del anuncio,Resultados,Importe gastado,Moneda',
    'Anuncio A,Activo,2,200,BOB'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios.moneda.codigo, 'BOB');
  assert.equal(anuncios.moneda.origen, 'columna');
});

test('sin pistas de moneda devuelve null y avisa en las advertencias', () => {
  const csv = [
    'Nombre del anuncio,Entrega del anuncio,Resultados,Importe gastado',
    'Anuncio A,Activo,2,200'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios.moneda, null);
  assert.ok(anuncios.meta.advertencias.some((a) => a.includes('moneda')));
});

test('rechaza CSV sin ninguna columna de nombre', () => {
  const csv = [
    'Inicio del informe,Entrega del anuncio,Resultados',
    '01/10/2026,Activo,5'
  ].join('\n');

  assert.throws(() => procesarCsvMeta(csv), /columna de nombre/i);
});

test('rechaza CSV sin columnas de métricas reconocibles', () => {
  const csv = [
    'Nombre del anuncio,Entrega del anuncio,Presupuesto',
    'Anuncio A,Activo,10'
  ].join('\n');

  assert.throws(() => procesarCsvMeta(csv), /columna de métricas/i);
});

test('descarta filas de totales y nombres vacíos', () => {
  const csv = [
    'Nombre del anuncio,Entrega del anuncio,Resultados,Importe gastado',
    'Anuncio A,Activo,4,40',
    'Total,Activo,4,40',
    'Resultados de la campaña,Activo,4,40',
    ',Activo,1,10'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios.length, 1);
  assert.equal(anuncios.meta.filasDescartadas, 3);
});

test('calcula costo por lead cuando la columna viene vacía', () => {
  const csv = [
    'Nombre del anuncio,Entrega del anuncio,Resultados,Costo por resultado,Importe gastado',
    'Anuncio A,Activo,10,,200'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);
  assert.equal(anuncios[0].costo_por_lead, 20);
  assert.equal(anuncios.meta.metricasCalculadas.costo_por_resultado, true);
  assert.ok(anuncios.meta.advertencias.some((a) => a.includes('coste por resultados')));
});

test('calcula el CTR con clics en el enlace e impresiones cuando falta la columna', () => {
  const csv = [
    'Nombre del anuncio,Entrega del anuncio,Resultados,Importe gastado,Impresiones,Clics en el enlace',
    'Anuncio A,Activo,10,200,2000,100',
    'Anuncio B,Pausado,5,100,1000,0'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios[0].ctr_clics, 5);
  assert.equal(anuncios[1].ctr_clics, 0);
  assert.equal(anuncios.meta.columnas.clicks, 'Clics en el enlace');
  assert.equal(anuncios.meta.columnas.impressions, 'Impresiones');
  assert.equal(anuncios.meta.metricasCalculadas.ctr, true);
  assert.ok(anuncios.meta.advertencias.some((a) => a.includes('CTR')));
});

test('no confunde la cabecera de CTR con la columna de clics', () => {
  const csv = [
    'Nombre del anuncio,Entrega del anuncio,Resultados,Importe gastado,CTR (porcentaje de clics en el enlace)',
    'Anuncio A,Activo,10,200,5%'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios.meta.columnas.ctr, 'CTR (porcentaje de clics en el enlace)');
  assert.equal(anuncios.meta.columnas.clicks, undefined);
  assert.equal(anuncios[0].ctr_clics, 5);
  assert.equal(anuncios.meta.metricasCalculadas.ctr, false);
});

test('prefiere el CTR del CSV en lugar de calcularlo con clics', () => {
  const csv = [
    'Nombre del anuncio,Entrega del anuncio,Resultados,Importe gastado,Impresiones,Clics en el enlace,CTR (porcentaje de clics en el enlace)',
    'Anuncio A,Activo,10,200,2000,100,7%'
  ].join('\n');

  const anuncios = procesarCsvMeta(csv);

  assert.equal(anuncios[0].ctr_clics, 7);
  assert.equal(anuncios.meta.metricasCalculadas.ctr, false);
});

test('detectarIdiomaCsv tolera cabeceras con mojibake', () => {
  const info = detectarIdiomaCsv(['Nome do anÃºncio', 'VeiculaÃ§Ã£o do anÃºncio', 'Valor gasto']);
  assert.equal(info.codigo, 'pt');
});

test('limpiarNumero interpreta formatos de moneda y CTR', () => {
  assert.equal(limpiarNumero('"$ 1.234,56"'), 1235);
  assert.equal(limpiarNumero('R$ 1,200.50'), 1201);
  assert.equal(limpiarNumero('3,5%', true), 4);
  assert.equal(limpiarNumero('0.035', true), 4);
  assert.equal(limpiarNumero(''), 0);
});
