import { normalizarPeriodo, periodoAFecha, resumirPeriodos } from '../../../core/utils/dateUtils';

export const ESTADO_SIN_INICIAR = 'Sin iniciar';
export const ESTADO_EN_PROCESO = 'En proceso';
export const ESTADO_ENTREGADO = 'Entregado';

export const TIPOS_CONTENIDO = [
  { id: 'arte', label: 'Arte estático', icon: 'image' },
  { id: 'carrusel', label: 'Carrusel', icon: 'view_carousel' },
  { id: 'reel', label: 'Reel / Video', icon: 'movie' },
  { id: 'historias', label: 'Historias', icon: 'auto_stories' },
  { id: 'pauta', label: 'Pauta publicitaria', icon: 'campaign' },
  { id: 'diseno_interno', label: 'Diseño interno', icon: 'design_services' },
];

export const RESPONSABLES_PRODUCCION = [
  { id: 'diseno', label: 'Diseño gráfico', icon: 'palette' },
  { id: 'video', label: 'Producción audiovisual', icon: 'videocam' },
  { id: 'cm', label: 'Pauta digital / CM', icon: 'ads_click' },
];

export const ESTADOS_REQUERIMIENTO = [
  { id: ESTADO_SIN_INICIAR, label: 'Sin iniciar', icon: 'pending' },
  { id: ESTADO_EN_PROCESO, label: 'En proceso', icon: 'sync' },
  { id: ESTADO_ENTREGADO, label: 'Entregado', icon: 'task_alt' },
];

export const PRIORIDADES = ['Alta', 'Media', 'Baja'];

export const TIPOS_VOLUMEN = [
    { id: 'video', label: 'Videos' },
    { id: 'fotografia', label: 'Fotografía' },
    { id: 'artes', label: 'Artes' },
    { id: 'carruseles', label: 'Carruseles' },
    { id: 'pauta', label: 'Campañas publicitarias' },
];

export const AREAS_DEMANDA = [
    { id: 'fotografia', label: 'Fotografía' },
    { id: 'video', label: 'Video' },
    { id: 'diseno', label: 'Diseño' },
    { id: 'redes', label: 'Redes' },
    { id: 'pauta', label: 'Pauta publicitaria' },
];

export function obtenerTarea(relacion) {
  if (Array.isArray(relacion)) return relacion[0] || null;
  return relacion || null;
}

export function tienePauta(requerimiento) {
  const cm = obtenerTarea(requerimiento?.tareas_cm);
  const pautaConfigurada = Boolean(
    cm &&
    (cm.plataforma || cm.presupuesto || cm.descripcion_pauta || cm.estado === 'Campaña Activa' || cm.estado === 'Finalizado')
  );

  return pautaConfigurada ||
    requerimiento?.tipo === 'Pauta Publicitaria' ||
    requerimiento?.categoria === 'Meta Ads';
}

export function obtenerAreasRequeridas(requerimiento) {
  const diseno = obtenerTarea(requerimiento?.tareas_diseno);
  const video = obtenerTarea(requerimiento?.tareas_video);
  const cm = obtenerTarea(requerimiento?.tareas_cm);
  const areas = [];

  if (diseno) areas.push({ area: 'diseno', estado: diseno.estado || 'Por Hacer' });
  if (video) areas.push({ area: 'video', estado: video.estado || 'Por Hacer' });
  if (tienePauta(requerimiento)) {
    areas.push({ area: 'cm', estado: cm?.estado || 'Por Hacer' });
  }

  return areas;
}

function areaCompletada({ area, estado }) {
  if (area === 'cm') return estado === 'Campaña Activa' || estado === 'Finalizado';
  return estado === 'Finalizado';
}

function areaIniciada({ estado }) {
  return estado !== 'Por Hacer' && estado !== 'Sin Pauta';
}

export function obtenerEstadoRequerimiento(requerimiento) {
  const areas = obtenerAreasRequeridas(requerimiento);

  if (areas.every(areaCompletada)) return ESTADO_ENTREGADO;
  if (areas.some(areaIniciada)) return ESTADO_EN_PROCESO;
  return ESTADO_SIN_INICIAR;
}

export function obtenerTiposContenido(requerimiento) {
  const tipos = [];

  if (requerimiento?.req_arte_estatico) tipos.push('arte');
  if (requerimiento?.req_carrusel) tipos.push('carrusel');
  if (requerimiento?.req_reel) tipos.push('reel');
  if (requerimiento?.categoria_diseno === 'Historias') tipos.push('historias');
  if (requerimiento?.categoria === 'Diseño Interno') tipos.push('diseno_interno');
  if (tienePauta(requerimiento)) tipos.push('pauta');

  return tipos;
}

export function obtenerTiposVolumen(requerimiento) {
    const video = obtenerTarea(requerimiento?.tareas_video);
    const tipos = [];

    if (requerimiento?.req_reel || video?.id_tarea) tipos.push('video');
    if (requerimiento?.req_fotos || video?.req_fotos) tipos.push('fotografia');
    if (requerimiento?.req_arte_estatico) tipos.push('artes');
    if (requerimiento?.req_carrusel) tipos.push('carruseles');
    if (tienePauta(requerimiento)) tipos.push('pauta');

    return tipos;
}

export function calcularVolumenPorTipo(requerimientos) {
    const conteo = Object.fromEntries(TIPOS_VOLUMEN.map((tipo) => [tipo.id, 0]));

    (requerimientos || []).forEach((requerimiento) => {
        obtenerTiposVolumen(requerimiento).forEach((id) => {
            conteo[id] += 1;
        });
    });

    return TIPOS_VOLUMEN.map((tipo) => ({ ...tipo, total: conteo[tipo.id] }));
}

export function calcularDemandaPorArea(requerimientos) {
    const items = requerimientos || [];
    const conteo = Object.fromEntries(AREAS_DEMANDA.map((area) => [area.id, 0]));

    items.forEach((requerimiento) => {
        const diseno = obtenerTarea(requerimiento?.tareas_diseno);
        const video = obtenerTarea(requerimiento?.tareas_video);

        if (requerimiento?.req_fotos || video?.req_fotos) conteo.fotografia += 1;
        if (requerimiento?.req_reel || video?.id_tarea) conteo.video += 1;
        if (diseno || requerimiento?.req_arte_estatico || requerimiento?.req_carrusel || requerimiento?.categoria === 'Diseño Interno') conteo.diseno += 1;
        if (requerimiento?.req_arte_estatico || requerimiento?.req_carrusel || requerimiento?.categoria_diseno === 'Historias') conteo.redes += 1;
        if (tienePauta(requerimiento)) conteo.pauta += 1;
    });

    const maximo = Math.max(...Object.values(conteo), 1);

    return AREAS_DEMANDA.map((area) => ({
        ...area,
        total: conteo[area.id],
        porcentaje: items.length > 0 ? Math.round((conteo[area.id] / items.length) * 100) : 0,
        proporcion: Math.round((conteo[area.id] / maximo) * 100),
    }));
}

export function calcularParticipacionAgentes(requerimientos) {
    const items = requerimientos || [];
    const mapa = new Map();

    items.forEach((requerimiento) => {
        const id = requerimiento.id_agente == null ? 'sin-agente' : String(requerimiento.id_agente);
        const nombre = requerimiento.usuarios?.nombre || (requerimiento.id_agente ? `Agente #${requerimiento.id_agente}` : 'Sin agente');

        if (!mapa.has(id)) mapa.set(id, { id, nombre, total: 0 });
        mapa.get(id).total += 1;
    });

    return Array.from(mapa.values())
        .map((agente) => ({
            ...agente,
            participacion: items.length > 0 ? Math.round((agente.total / items.length) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
}

export function calcularSerieMensual(requerimientos, periodos) {
    const items = requerimientos || [];
    const ordenados = [...(periodos || [])].sort((a, b) => {
        const fechaA = periodoAFecha(a)?.getTime() ?? 0;
        const fechaB = periodoAFecha(b)?.getTime() ?? 0;
        return fechaA - fechaB;
    });

    return ordenados.map((periodo) => {
        const delPeriodo = items.filter(
            (requerimiento) => normalizarPeriodo(requerimiento.periodo_mensual) === periodo
        );
        const metricas = calcularMetricas(delPeriodo);

        return {
            periodo,
            total: metricas.total,
            finalizadas: metricas.entregados,
        };
    });
}

export function filtrarRequerimientos(requerimientos, filtros) {
  return (requerimientos || []).filter((requerimiento) => {
    if (filtros.agente) {
      const idAgente = requerimiento.id_agente == null ? 'sin-agente' : String(requerimiento.id_agente);
      if (idAgente !== filtros.agente) return false;
    }

    if (filtros.tipo && !obtenerTiposContenido(requerimiento).includes(filtros.tipo)) return false;

    if (filtros.responsable) {
      const areas = obtenerAreasRequeridas(requerimiento).map((item) => item.area);
      if (!areas.includes(filtros.responsable)) return false;
    }

    if (filtros.estado && obtenerEstadoRequerimiento(requerimiento) !== filtros.estado) return false;

    if (filtros.prioridad && (requerimiento.prioridad || 'Baja') !== filtros.prioridad) return false;

    return true;
  });
}

export function calcularMetricas(requerimientos) {
  const items = requerimientos || [];
  const agentes = new Set();
  let entregados = 0;
  let enProceso = 0;
  let sinIniciar = 0;
  let activas = 0;

  items.forEach((requerimiento) => {
    const estado = obtenerEstadoRequerimiento(requerimiento);

    if (estado === ESTADO_ENTREGADO) entregados += 1;
    else if (estado === ESTADO_EN_PROCESO) enProceso += 1;
    else sinIniciar += 1;

    if (requerimiento.id_agente != null) agentes.add(String(requerimiento.id_agente));
    if (obtenerTarea(requerimiento.tareas_cm)?.estado === 'Campaña Activa') activas += 1;
  });

  return {
    total: items.length,
    entregados,
    pendientes: items.length - entregados,
    enProceso,
    sinIniciar,
    agentesActivos: agentes.size,
    activas,
  };
}

export function obtenerPeriodos(requerimientos) {
  return resumirPeriodos(requerimientos).periodos;
}

export function obtenerOpcionesAgentes(requerimientos) {
  const mapa = new Map();
  let tieneSinAgente = false;

  (requerimientos || []).forEach((requerimiento) => {
    if (requerimiento.id_agente == null) {
      tieneSinAgente = true;
      return;
    }

    const id = String(requerimiento.id_agente);
    if (!mapa.has(id)) {
      mapa.set(id, requerimiento.usuarios?.nombre || `Agente #${id}`);
    }
  });

  const opciones = Array.from(mapa, ([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  if (tieneSinAgente) opciones.push({ id: 'sin-agente', nombre: 'Sin agente asignado' });

  return opciones;
}
