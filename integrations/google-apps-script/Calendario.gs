// Pegar este archivo completo en Apps Script y ejecutar prepararCalendario una vez.
// Propiedades del script requeridas: SPREADSHEET_ID y CALENDAR_TOKEN.
var COLUMNAS_EVENTOS = ['id', 'title', 'agent', 'type', 'date', 'start', 'duration', 'exceptionReason', 'createdAt'];

function salida(datos) {
  return ContentService.createTextOutput(JSON.stringify(datos)).setMimeType(ContentService.MimeType.JSON);
}

function fallo(mensaje, codigo) {
  var error = new Error(mensaje);
  error.codigoCalendario = codigo;
  throw error;
}

function abrirHoja(crear) {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) fallo('Configura SPREADSHEET_ID con el ID de una hoja de Google.', 'CONFIGURATION');
  var libro = SpreadsheetApp.openById(id);
  var hoja = libro.getSheetByName('Eventos');
  if (!hoja && crear) hoja = libro.insertSheet('Eventos');
  if (!hoja) fallo('Ejecuta prepararCalendario para crear la pestaña Eventos.', 'CONFIGURATION');
  if (hoja.getLastRow() === 0 && crear) {
    hoja.getRange(1, 1, 1, COLUMNAS_EVENTOS.length).setValues([COLUMNAS_EVENTOS]);
    hoja.setFrozenRows(1);
  }
  var cabecera = hoja.getRange(1, 1, 1, COLUMNAS_EVENTOS.length).getValues()[0];
  if (JSON.stringify(cabecera) !== JSON.stringify(COLUMNAS_EVENTOS)) fallo('La pestaña Eventos tiene otras columnas. Revisa su cabecera antes de continuar.', 'CONFIGURATION');
  return hoja;
}

function prepararCalendario() {
  var propiedades = PropertiesService.getScriptProperties();
  if (!propiedades.getProperty('CALENDAR_TOKEN')) fallo('Configura CALENDAR_TOKEN en las propiedades del script.', 'CONFIGURATION');
  var bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(15000);
  try {
    abrirHoja(true);
    SpreadsheetApp.flush();
  } finally { bloqueo.releaseLock(); }
}

function autorizar(token) {
  var esperado = PropertiesService.getScriptProperties().getProperty('CALENDAR_TOKEN');
  if (!esperado || typeof token !== 'string' || token !== esperado) fallo('La clave de conexión del calendario no coincide.', 'UNAUTHORIZED');
}

function leerEventos(hoja) {
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, COLUMNAS_EVENTOS.length).getValues().map(function(fila, indice) {
    if (fila.every(function(celda) { return celda === ''; })) return null;
    var evento = {};
    COLUMNAS_EVENTOS.forEach(function(columna, columnaIndice) { evento[columna] = fila[columnaIndice]; });
    evento.id = String(evento.id);
    evento.date = evento.date instanceof Date ? Utilities.formatDate(evento.date, 'America/La_Paz', 'yyyy-MM-dd') : String(evento.date);
    evento.start = Number(evento.start);
    evento.duration = Number(evento.duration);
    evento.exceptionReason = String(evento.exceptionReason || '');
    var error = validarReserva(evento);
    if (error) fallo('Fila ' + (indice + 2) + ' de Eventos: ' + error, 'INVALID_EVENT');
    return evento;
  }).filter(function(evento) { return evento !== null; });
}

function validarReserva(evento) {
  if (!evento || typeof evento.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(evento.id)) return 'Identificador inválido.';
  if (typeof evento.title !== 'string' || !evento.title.trim() || evento.title.length > 200) return 'Escribe un título de hasta 200 caracteres.';
  if (typeof evento.agent !== 'string' || !evento.agent.trim() || evento.agent.length > 100) return 'Selecciona una persona responsable.';
  if (['grabacion', 'pauteo', 'edicion'].indexOf(evento.type) < 0) return 'Tipo de actividad inválido.';
  if (typeof evento.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(evento.date)) return 'Fecha inválida.';
  var fecha = new Date(evento.date + 'T12:00:00Z');
  if (isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== evento.date) return 'La fecha no existe.';
  var dia = fecha.getUTCDay();
  if (dia === 0) return 'Solo se permiten reservas de lunes a sábado.';
  if (typeof evento.start !== 'number' || typeof evento.duration !== 'number' || !isFinite(evento.start) || !isFinite(evento.duration) || evento.start < 7 || evento.duration < 0.5 || evento.start + evento.duration > 19 || !Number.isInteger(evento.start * 2) || !Number.isInteger(evento.duration * 2)) return 'El horario debe estar entre 07:00 y 19:00, en intervalos de 30 minutos.';
  if (evento.exceptionReason != null && (typeof evento.exceptionReason !== 'string' || evento.exceptionReason.length > 500)) return 'El motivo admite hasta 500 caracteres.';
  if ([1, 3, 5].indexOf(dia) >= 0 && evento.type !== 'edicion' && String(evento.exceptionReason || '').trim().length < 4) return 'Escribe un motivo para reservar una actividad distinta a edición en esta fecha.';
  return null;
}

function conBloqueo(operacion) {
  var bloqueo = LockService.getScriptLock();
  try {
    bloqueo.waitLock(15000);
    return salida(operacion());
  } catch (error) {
    return salida({ ok: false, code: error.codigoCalendario || 'SHEETS_ERROR', error: error.codigoCalendario ? error.message : 'No se pudo acceder al calendario. Revisa las propiedades del script y la pestaña Eventos.' });
  } finally {
    if (bloqueo.hasLock()) bloqueo.releaseLock();
  }
}

function doGet(e) {
  return conBloqueo(function() {
    autorizar(e && e.parameter && e.parameter.token);
    return { ok: true, events: leerEventos(abrirHoja(false)) };
  });
}

function mismoEvento(primero, segundo) {
  return COLUMNAS_EVENTOS.slice(0, 8).every(function(campo) { return String(primero[campo] || '') === String(segundo[campo] || ''); });
}

function doPost(e) {
  return conBloqueo(function() {
    var body;
    try { body = JSON.parse(e.postData.contents); } catch (error) { fallo('Los datos enviados no son válidos.', 'INVALID_EVENT'); }
    autorizar(body && body.token);
    if (['add', 'delete'].indexOf(body.action) < 0) fallo('Acción no válida.', 'INVALID_EVENT');
    var hoja = abrirHoja(false);
    var eventos = leerEventos(hoja);
    if (body.action === 'delete') {
      if (typeof body.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(body.id)) fallo('Identificador inválido.', 'INVALID_EVENT');
      // Buscar la fila física por ID para soportar filas vacías y reintentos.
      if (hoja.getLastRow() > 1) {
        var ids = hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues();
        var indice = ids.findIndex(function(fila) { return String(fila[0]) === body.id; });
        if (indice >= 0) hoja.deleteRow(indice + 2);
      }
      SpreadsheetApp.flush();
      return { ok: true, id: body.id };
    }
    var evento = body.event;
    var error = validarReserva(evento);
    if (error) fallo(error, 'INVALID_EVENT');
    evento.title = evento.title.trim();
    evento.agent = evento.agent.trim();
    evento.exceptionReason = (evento.exceptionReason || '').trim();
    var existente = eventos.find(function(actual) { return actual.id === evento.id; });
    if (existente) {
      if (!mismoEvento(existente, evento)) fallo('Esta reserva ya se guardó con otros datos. Actualiza el calendario.', 'ID_CONFLICT');
      return { ok: true, event: existente };
    }
    var choque = eventos.find(function(actual) {
      return actual.date === evento.date && actual.agent.trim().toLowerCase() === evento.agent.toLowerCase() && actual.start < evento.start + evento.duration && evento.start < actual.start + actual.duration;
    });
    if (choque) fallo('El horario coincide con «' + choque.title + '», asignado a ' + choque.agent + '.', 'CONFLICT');
    evento.createdAt = new Date().toISOString();
    var fila = COLUMNAS_EVENTOS.map(function(campo) {
      var valor = evento[campo];
      // Los textos del usuario deben guardarse como texto, incluidas las fórmulas.
      return typeof valor === 'string' && /^[=+@\-]/.test(valor) ? "'" + valor : valor;
    });
    hoja.getRange(hoja.getLastRow() + 1, 1, 1, COLUMNAS_EVENTOS.length).setNumberFormat('@').setValues([fila]);
    SpreadsheetApp.flush();
    return { ok: true, event: evento };
  });
}
