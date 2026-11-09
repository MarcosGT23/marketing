export const TIPOS_EVENTO = {
  grabacion: 'Grabación / Dron',
  pauteo: 'Pauteo',
  edicion: 'Edición',
};

export function fechaBolivia(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
}

export function fechaLocal(fecha) {
  return new Date(`${fecha}T12:00:00`);
}

export function esDiaEdicion(fecha) {
  return [1, 3, 5].includes(fechaLocal(fecha).getDay());
}

export function horaTexto(hora) {
  const minutos = Math.round(Number(hora) * 60);
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

export function diasDelMes(anio, mes, incluirDomingos = false) {
  const primero = new Date(anio, mes, 1, 12);
  const ultimo = new Date(anio, mes + 1, 0, 12);
  const primerDiaVisible = !incluirDomingos && primero.getDay() === 0 ? 2 : 1;
  const desplazamiento = !incluirDomingos && primero.getDay() === 0 ? 0 : (primero.getDay() + 6) % 7;
  const semanas = Math.ceil((desplazamiento + ultimo.getDate() - primerDiaVisible + 1) / 7);
  return Array.from({ length: semanas * 7 }, (_, indice) => {
    const dia = new Date(anio, mes, primerDiaVisible - desplazamiento + indice, 12);
    const fecha = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
    return { fecha, numero: dia.getDate(), otroMes: dia.getMonth() !== mes, domingo: dia.getDay() === 0 };
  }).filter(dia => incluirDomingos || !dia.domingo);
}

export function validarEvento(evento, { exigirMotivo = true } = {}) {
  if (!evento || typeof evento !== 'object') return 'El evento no es válido.';
  if (typeof evento.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(evento.id)) return 'El identificador del evento no es válido.';
  if (typeof evento.title !== 'string' || !evento.title.trim() || evento.title.length > 200) return 'Escribe un título de hasta 200 caracteres.';
  if (typeof evento.agent !== 'string' || !evento.agent.trim() || evento.agent.length > 100) return 'Selecciona una persona responsable.';
  if (!Object.hasOwn(TIPOS_EVENTO, evento.type)) return 'Selecciona un tipo de actividad válido.';
  if (typeof evento.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(evento.date)) return 'Selecciona una fecha válida.';
  const dia = fechaLocal(evento.date);
  if (Number.isNaN(dia.getTime()) || dia.getFullYear() !== Number(evento.date.slice(0, 4)) || dia.getMonth() + 1 !== Number(evento.date.slice(5, 7)) || dia.getDate() !== Number(evento.date.slice(8))) return 'La fecha seleccionada no existe.';
  if (dia.getDay() === 0) return 'El calendario permite reservas de lunes a sábado.';
  if (typeof evento.start !== 'number' || typeof evento.duration !== 'number' || !Number.isFinite(evento.start) || !Number.isFinite(evento.duration) || evento.start < 7 || evento.duration < 0.5 || evento.start + evento.duration > 19 || !Number.isInteger(evento.start * 2) || !Number.isInteger(evento.duration * 2)) return 'Selecciona un horario entre 07:00 y 19:00, en intervalos de 30 minutos.';
  if (evento.exceptionReason != null && (typeof evento.exceptionReason !== 'string' || evento.exceptionReason.length > 500)) return 'El motivo de excepción admite hasta 500 caracteres.';
  if (exigirMotivo && esDiaEdicion(evento.date) && evento.type !== 'edicion' && (evento.exceptionReason || '').trim().length < 4) return 'Esta fecha está reservada para edición. Escribe el motivo de la excepción.';
  return null;
}

export function haySolape(primero, segundo) {
  return primero.id !== segundo.id && primero.date === segundo.date &&
    primero.agent.trim().toLocaleLowerCase('es') === segundo.agent.trim().toLocaleLowerCase('es') &&
    primero.start < segundo.start + segundo.duration && segundo.start < primero.start + primero.duration;
}
