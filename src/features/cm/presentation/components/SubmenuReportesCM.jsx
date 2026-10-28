// src/features/cm/presentation/components/SubmenuReportesCM.jsx
import { useMemo, useState } from 'react';
import { idAgenteDeReporte, nombreAgenteDeReporte } from '../../utils/reportesMeta';

const formateadorNumero = new Intl.NumberFormat('es-BO');

function formatearNumero(valor) {
  return formateadorNumero.format(Math.round(Number(valor) || 0));
}

function formatearDinero(valor) {
  return `$${formatearNumero(valor)}`;
}

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  const date = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fecha;
  return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function estiloSelect() {
  return {
    background: 'var(--color-surface-container-low)',
    border: '1px solid var(--color-outline-variant)',
    color: 'var(--color-on-surface)'
  };
}

function aplicarFocoSelect(e) {
  e.currentTarget.style.borderColor = 'var(--color-primary-container)';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
  e.currentTarget.style.background = 'var(--color-surface-container-lowest)';
}

function quitarFocoSelect(e) {
  e.currentTarget.style.borderColor = 'var(--color-outline-variant)';
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.background = 'var(--color-surface-container-low)';
}

export default function SubmenuReportesCM({ reportes = [], cargando = false, busqueda = '' }) {
  const [campanaId, setCampanaId] = useState('todas');
  const [agenteId, setAgenteId] = useState('todos');
  const [reportesExpandidos, setReportesExpandidos] = useState({});

  const campanas = useMemo(() => {
    const mapa = new Map();

    reportes.forEach((reporte) => {
      const id = String(reporte.id_requerimiento);
      if (!mapa.has(id)) {
        mapa.set(id, {
          id,
          nombre: reporte.propiedad?.nombre_propiedad || `Requerimiento #${reporte.id_requerimiento}`,
          agenteId: idAgenteDeReporte(reporte),
          agenteNombre: nombreAgenteDeReporte(reporte),
          reportes: 0
        });
      }
      mapa.get(id).reportes += 1;
    });

    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [reportes]);

  const agentes = useMemo(() => {
    const mapa = new Map();

    campanas.forEach((campana) => {
      if (!mapa.has(campana.agenteId)) {
        mapa.set(campana.agenteId, { id: campana.agenteId, nombre: campana.agenteNombre, campanas: 0 });
      }
      mapa.get(campana.agenteId).campanas += 1;
    });

    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [campanas]);

  const reportesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return reportes.filter((reporte) => {
      if (campanaId !== 'todas' && String(reporte.id_requerimiento) !== campanaId) return false;
      if (agenteId !== 'todos' && idAgenteDeReporte(reporte) !== agenteId) return false;
      if (!termino) return true;

      const propiedad = (reporte.propiedad?.nombre_propiedad || '').toLowerCase();
      const agente = nombreAgenteDeReporte(reporte).toLowerCase();
      return propiedad.includes(termino) || agente.includes(termino);
    });
  }, [reportes, campanaId, agenteId, busqueda]);

  const resumen = useMemo(() => {
    return reportesFiltrados.reduce((acc, reporte) => {
      acc.leads += Number(reporte.leads) || 0;
      acc.inversion += Number(reporte.inversion) || 0;
      acc.alcance += Number(reporte.alcance) || 0;
      acc.ctr += Number(reporte.ctr_clics) || 0;
      acc.reportes += 1;
      return acc;
    }, { leads: 0, inversion: 0, alcance: 0, ctr: 0, reportes: 0 });
  }, [reportesFiltrados]);

  const propiedadesVisibles = useMemo(
    () => new Set(reportesFiltrados.map((r) => r.id_requerimiento)).size,
    [reportesFiltrados]
  );

  const filtroActivo = campanaId !== 'todas' || agenteId !== 'todos';
  const agenteSeleccionado = agentes.find((a) => a.id === agenteId) || null;
  const cplPromedio = resumen.leads > 0 ? resumen.inversion / resumen.leads : 0;
  const ctrPromedio = resumen.reportes > 0 ? resumen.ctr / resumen.reportes : 0;

  const alternarReporte = (id) => {
    setReportesExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (cargando) {
    return (
      <div className="tab-panel flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--color-on-surface-variant)' }}>
        <span className="material-symbols-outlined animate-spin text-primary-container text-3xl">progress_activity</span>
        <span className="text-sm font-medium">Cargando reportes CSV de Meta Ads...</span>
      </div>
    );
  }

  if (reportes.length === 0) {
    return (
      <div className="tab-panel text-center py-16 rounded-2xl"
        style={{
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
          color: 'var(--color-outline)'
        }}>
        <span className="material-symbols-outlined text-4xl block mb-2">table_view</span>
        <p className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>Aún no hay reportes CSV cargados</p>
        <p className="text-xs mt-1">Usa el botón «Nuevo Reporte / CSV» para importar las métricas de una propiedad.</p>
      </div>
    );
  }

  return (
    <div className="tab-panel space-y-4">
      {/* Submenú de filtros: campaña y agente */}
      <section className="rounded-2xl p-4 sm:p-5 space-y-4"
        style={{
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--color-outline)' }}>
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              Reportes CSV por propiedad
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-outline)' }}>
              Elige una campaña o un agente para revisar las métricas importadas desde Meta Ads.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0"
            style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
            {resumen.reportes} reporte(s) · {propiedadesVisibles} propiedad(es)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="cm-filtro-campana" className="block text-[11px] font-semibold mb-1"
              style={{ color: 'var(--color-outline)' }}>
              Campaña / Propiedad
            </label>
            <select
              id="cm-filtro-campana"
              value={campanaId}
              onChange={(e) => setCampanaId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer focus:outline-none transition-all"
              style={estiloSelect()}
              onFocus={aplicarFocoSelect}
              onBlur={quitarFocoSelect}
            >
              <option value="todas">Todas las campañas ({campanas.length})</option>
              {campanas.map((campana) => (
                <option key={campana.id} value={campana.id}>
                  {campana.nombre} · {campana.agenteNombre} ({campana.reportes})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cm-filtro-agente" className="block text-[11px] font-semibold mb-1"
              style={{ color: 'var(--color-outline)' }}>
              Agente
            </label>
            <select
              id="cm-filtro-agente"
              value={agenteId}
              onChange={(e) => setAgenteId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer focus:outline-none transition-all"
              style={estiloSelect()}
              onFocus={aplicarFocoSelect}
              onBlur={quitarFocoSelect}
            >
              <option value="todos">Todos los agentes ({agentes.length})</option>
              {agentes.map((agente) => (
                <option key={agente.id} value={agente.id}>
                  {agente.nombre} ({agente.campanas} campaña{agente.campanas === 1 ? '' : 's'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtroActivo && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--color-on-surface-variant)' }}>
              <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--color-primary-container)' }}>
                {agenteSeleccionado ? 'person' : 'filter_alt'}
              </span>
              {agenteSeleccionado
                ? `Reportes de ${agenteSeleccionado.nombre}`
                : `Filtrando por ${campanas.find((c) => c.id === campanaId)?.nombre || 'campaña'}`}
            </span>
            <button
              type="button"
              onClick={() => { setCampanaId('todas'); setAgenteId('todos'); }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors hover:bg-surface-container"
              style={{ color: 'var(--color-primary-container)' }}
            >
              <span className="material-symbols-outlined text-[15px]">filter_alt_off</span>
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Resumen agregado de los reportes filtrados */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-xl"
          style={{
            background: 'var(--color-surface-container-low)',
            border: '1px solid var(--color-outline-variant)'
          }}>
          {[
            { label: 'Leads (Lids)', valor: formatearNumero(resumen.leads) },
            { label: 'Coste por resultados', valor: formatearDinero(cplPromedio) },
            { label: 'Inversión', valor: formatearDinero(resumen.inversion) },
            { label: 'Alcance', valor: formatearNumero(resumen.alcance) },
            { label: 'CTR - Clic', valor: formatearNumero(ctrPromedio) }
          ].map((metrica) => (
            <div key={metrica.label} className="min-w-0">
              <span className="uppercase text-[10px] font-bold block truncate" style={{ color: 'var(--color-outline)' }}>
                {metrica.label}
              </span>
              <strong className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
                {metrica.valor}
              </strong>
            </div>
          ))}
        </div>
      </section>

      {/* Tarjetas de reportes por propiedad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reportesFiltrados.map((reporte) => {
          const anuncios = reporte.reportes_meta_anuncios || [];
          const activos = anuncios.filter((a) => a.activo).length;
          const inactivos = anuncios.length - activos;
          const expandido = Boolean(reportesExpandidos[reporte.id_reporte]);

          return (
            <article key={reporte.id_reporte}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: 'var(--color-surface-container-lowest)',
                border: '1px solid var(--color-outline-variant)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
              }}>
              <header className="p-4 sm:p-5 flex items-start justify-between gap-3"
                style={{
                  background: 'linear-gradient(to right, rgba(219, 225, 255, 0.2), transparent)',
                  borderBottom: '1px solid var(--color-outline-variant)'
                }}>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-sm sm:text-base line-clamp-2"
                    style={{ color: 'var(--color-on-surface)' }}>
                    {reporte.propiedad?.nombre_propiedad || `Requerimiento #${reporte.id_requerimiento}`}
                  </h3>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-outline)' }}>
                    <span className="material-symbols-outlined text-[14px] align-middle mr-0.5">person</span>
                    {nombreAgenteDeReporte(reporte)} • {reporte.periodo_mensual || 'Sin período'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
                  style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
                  {formatearFecha(reporte.fecha_reporte)}
                </span>
              </header>

              <div className="p-4 sm:p-5 space-y-3 flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    { label: 'Leads (Lids)', valor: formatearNumero(reporte.leads) },
                    { label: 'Coste por resultados', valor: formatearDinero(reporte.costo_por_lead) },
                    { label: 'Inversión', valor: formatearDinero(reporte.inversion) },
                    { label: 'Alcance', valor: formatearNumero(reporte.alcance) },
                    { label: 'CTR - Clic', valor: formatearNumero(reporte.ctr_clics) }
                  ].map((metrica) => (
                    <div key={metrica.label} className="p-2 rounded-lg min-w-0"
                      style={{
                        background: 'var(--color-surface-container-low)',
                        border: '1px solid var(--color-outline-variant)'
                      }}>
                      <span className="uppercase text-[10px] font-bold block truncate" style={{ color: 'var(--color-outline)' }}>
                        {metrica.label}
                      </span>
                      <strong className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        {metrica.valor}
                      </strong>
                    </div>
                  ))}
                </div>

                {anuncios.length === 0 ? (
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-outline)' }}>
                    <span className="material-symbols-outlined text-[15px]">info</span>
                    Solo métricas consolidadas: este reporte no trae anuncios individuales del CSV.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold">
                        {activos} activo(s)
                      </span>
                      {inactivos > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold">
                          {inactivos} inactivo(s)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => alternarReporte(reporte.id_reporte)}
                      aria-expanded={expandido}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors hover:bg-surface-container"
                      style={{ color: 'var(--color-primary-container)' }}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {expandido ? 'visibility_off' : 'visibility'}
                      </span>
                      {expandido ? 'Ocultar anuncios' : `Ver ${anuncios.length} anuncio(s) del CSV`}
                    </button>
                  </div>
                )}

                {expandido && anuncios.length > 0 && (
                  <div className="animate-fadeIn">
                    <p className="sm:hidden text-[10px] mb-1" style={{ color: 'var(--color-outline)' }}>
                      Desliza la tabla para ver todas las métricas.
                    </p>
                    <div
                      className="overflow-x-auto rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-container)]"
                      tabIndex={0}
                      role="region"
                      aria-label={`Anuncios del reporte de ${reporte.propiedad?.nombre_propiedad || 'la propiedad'}`}
                      style={{ border: '1px solid var(--color-outline-variant)' }}>
                        <table className="w-full min-w-[540px] text-xs">
                          <thead style={{ background: 'var(--color-surface-container-low)' }}>
                            <tr style={{ color: 'var(--color-outline)' }}>
                              <th className="text-left px-3 py-2 font-bold uppercase text-[10px] tracking-wider">Anuncio</th>
                              <th className="text-left px-3 py-2 font-bold uppercase text-[10px] tracking-wider">Estado</th>
                              <th className="text-right px-3 py-2 font-bold uppercase text-[10px] tracking-wider">Lids</th>
                              <th className="text-right px-3 py-2 font-bold uppercase text-[10px] tracking-wider">Coste/Resultado</th>
                              <th className="text-right px-3 py-2 font-bold uppercase text-[10px] tracking-wider">Inversión</th>
                              <th className="text-right px-3 py-2 font-bold uppercase text-[10px] tracking-wider">Alcance</th>
                              <th className="text-right px-3 py-2 font-bold uppercase text-[10px] tracking-wider">CTR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {anuncios.map((anuncio, indice) => (
                              <tr key={anuncio.id_anuncio || `${reporte.id_reporte}-${indice}`}
                                style={{
                                  borderTop: '1px solid var(--color-outline-variant)',
                                  color: 'var(--color-on-surface)'
                                }}>
                                <td className="px-3 py-2 font-medium max-w-[180px] truncate" title={anuncio.nombre_anuncio}>
                                  {anuncio.nombre_anuncio}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                                    anuncio.activo
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                  }`}>
                                    {anuncio.estado_texto}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">{formatearNumero(anuncio.leads)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{formatearDinero(anuncio.costo_por_lead)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{formatearDinero(anuncio.inversion)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{formatearNumero(anuncio.alcance)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{formatearNumero(anuncio.ctr_clics)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {reportesFiltrados.length === 0 && (
        <div className="text-center py-12 rounded-2xl"
          style={{
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            color: 'var(--color-outline)'
          }}>
          <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
          <p className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>Sin reportes que coincidan</p>
          <p className="text-xs mt-1">Prueba con otra campaña, otro agente o limpia los filtros.</p>
          {filtroActivo && (
            <button
              type="button"
              onClick={() => { setCampanaId('todas'); setAgenteId('todos'); }}
              className="mt-3 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'var(--color-primary-container)', color: 'white' }}
            >
              Ver todos los reportes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
