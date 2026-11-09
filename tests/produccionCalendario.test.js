import test from 'node:test';
import assert from 'node:assert/strict';
import { leerFilasCsv } from '../src/core/utils/csv.js';
import { leerProduccionCsv } from '../src/features/calendario/domain/produccion.js';
import { diasDelMes } from '../src/features/calendario/domain/eventos.js';

test('CSV conserva comillas, saltos de línea, espacios y filas para identificar celdas', () => {
  const filas = leerFilasCsv('a,"Nota con ""comillas""\ny dos líneas", c\r\n,,\r\n1,2,3');
  assert.equal(filas.length, 3);
  assert.equal(filas[0][1], 'Nota con "comillas"\ny dos líneas');
  assert.equal(filas[0][2], ' c');
  assert.deepEqual(filas[1], ['', '', '']);
});

test('las notas conservan su fecha del calendario y la celda, incluso entre meses y años', () => {
  const csv = [
    ',2026,diciembre',
    ',LUNES,MARTES,MIÉRCOLES,JUEVES,VIERNES,SÁBADO,DOMINGO',
    ',30,01,02,03,04,05,06',
    ',Nota de noviembre,"Rodaje de prueba\n09:00 a 12:30",,,,,Nota de domingo',
    ',,,,,,,,Nota lateral',
    ',2027,enero',
    ',LUNES,MARTES,MIÉRCOLES,JUEVES,VIERNES,SÁBADO,DOMINGO',
    ',28,29,30,31,01,02,03',
    ',,,,Cierre de año,Inicio de año',
  ].join('\r\n');
  const datos = leerProduccionCsv(csv);
  const celda = nombre => datos.anotaciones.find(nota => nota.cell === nombre);
  assert.equal(datos.anotaciones.length, 6);
  assert.equal(celda('B4').date, '2026-11-30');
  assert.equal(celda('C4').date, '2026-12-01');
  assert.equal(celda('C4').text, 'Rodaje de prueba\n09:00 a 12:30');
  assert.equal(celda('H4').date, '2026-12-06');
  assert.equal(celda('I5').date, null);
  assert.equal(celda('I5').period, '2026-12');
  assert.equal(celda('E9').date, '2026-12-31');
  assert.equal(celda('F9').date, '2027-01-01');
  assert.ok(datos.anotaciones.every(nota => !('start' in nota) && !('duration' in nota)));
});

test('los días de producción también son anotaciones y un día incoherente queda sin fecha', () => {
  const datos = leerProduccionCsv(',2026,noviembre\n,LUNES,MARTES,MIÉRCOLES,JUEVES,VIERNES,SÁBADO,DOMINGO\n,26,27,28,29,30,31,01\n\n,02,03,04,05,06,07,08\n,,PRODUCCIÓN,,Actividad por confirmar');
  assert.equal(datos.anotaciones[0].cell, 'C6');
  assert.equal(datos.anotaciones[0].date, '2026-11-03');
  assert.equal(datos.anotaciones[0].text, 'PRODUCCIÓN');
  const incoherente = leerProduccionCsv(',2026,noviembre\n,20,21,22,23,24,25,26\n,,Nota sin fecha confirmada');
  assert.equal(incoherente.anotaciones[0].date, null);
  assert.throws(() => leerProduccionCsv('<html>Iniciar sesión</html>'), /encabezados/);
});

test('la vista de la hoja puede mostrar domingos conservando el calendario de reservas', () => {
  assert.ok(diasDelMes(2026, 10, true).some(dia => dia.fecha === '2026-11-01' && dia.domingo));
  assert.ok(!diasDelMes(2026, 10).some(dia => dia.domingo));
});
