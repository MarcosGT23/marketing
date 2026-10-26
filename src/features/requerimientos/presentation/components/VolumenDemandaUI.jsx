import {
    calcularDemandaPorArea,
    calcularParticipacionAgentes,
    calcularSerieMensual,
    calcularVolumenPorTipo,
} from '../../utils/dashboardMetrics';

const COLORES_TIPO = {
    video: '#2563eb',
    fotografia: '#7d4ce7',
    artes: '#006c49',
    carruseles: '#f59e0b',
    pauta: '#ec4899',
};

const ICONOS_TIPO = {
    video: 'movie',
    fotografia: 'camera_alt',
    artes: 'image',
    carruseles: 'view_carousel',
    pauta: 'campaign',
};

const COLORES_AREA = {
    fotografia: '#7d4ce7',
    video: '#2563eb',
    diseno: '#006c49',
    redes: '#f59e0b',
    pauta: '#ec4899',
};

const ICONOS_AREA = {
    fotografia: 'camera_alt',
    video: 'videocam',
    diseno: 'palette',
    redes: 'share',
    pauta: 'campaign',
};

function etiquetaMes(periodo) {
    if (!periodo) return '';
    const [mes, ano] = periodo.split(' ');
    return `${(mes || '').slice(0, 3)} ${(ano || '').slice(-2)}`.trim();
}

function iniciales(nombre) {
    if (!nombre) return 'AG';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function PanelCard({ title, subtitle, icon, accent = 'var(--color-primary-container)', bg = 'var(--color-primary-fixed)', badge, children, className = '' }) {
    return (
        <section className={`rounded-2xl p-4 sm:p-5 ${className}`}
            style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '19px', color: accent }}>{icon}</span>
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-headline-md font-bold" style={{ color: 'var(--color-on-surface)', fontSize: '15px' }}>
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="font-body-sm text-[11px] mt-0.5" style={{ color: 'var(--color-outline)' }}>{subtitle}</p>
                        )}
                    </div>
                </div>
                {badge && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-outline)' }}>
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </section>
    );
}

function TarjetaResumen({ label, value, hint, icon, accent, bg, compacto = false }) {
    return (
        <div className="rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3"
            style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="min-w-0">
                <p className="font-label-sm uppercase tracking-wider text-[10px]" style={{ color: 'var(--color-outline)' }}>{label}</p>
                <p className="font-stat-metric mt-2 break-words"
                    style={{ fontSize: compacto ? '18px' : '30px', lineHeight: compacto ? 1.25 : 1, color: accent }}>{value}</p>
                <p className="font-body-sm text-[11px] mt-2 leading-snug" style={{ color: 'var(--color-outline)' }}>{hint}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <span className="material-symbols-outlined" style={{ fontSize: '19px', color: accent }}>{icon}</span>
            </div>
        </div>
    );
}

function GraficoEvolucionMensual({ serie, periodoSeleccionado }) {
    if (serie.length === 0) {
        return (
            <div className="py-12 text-center">
                <span className="material-symbols-outlined block mx-auto mb-2" style={{ fontSize: '34px', color: 'var(--color-outline)' }}>timeline</span>
                <p className="font-body-sm text-[12px]" style={{ color: 'var(--color-outline)' }}>No hay períodos con requerimientos para los filtros seleccionados.</p>
            </div>
        );
    }

    const width = 720;
    const height = 260;
    const margen = { top: 24, right: 18, bottom: 42, left: 42 };
    const ancho = width - margen.left - margen.right;
    const alto = height - margen.top - margen.bottom;
    const maximo = Math.max(...serie.map((item) => item.total), 1);
    const techo = Math.max(4, Math.ceil(maximo / 4) * 4);
    const ticks = [0, techo / 4, techo / 2, (techo * 3) / 4, techo];
    const posicionX = (indice) => (
        serie.length > 1
            ? margen.left + (indice / (serie.length - 1)) * ancho
            : margen.left + ancho / 2
    );
    const posicionY = (valor) => margen.top + alto - (valor / techo) * alto;

    const puntos = serie.map((item, indice) => ({
        ...item,
        x: posicionX(indice),
        y: posicionY(item.total),
    }));
    const linea = puntos.map((punto, indice) => `${indice === 0 ? 'M' : 'L'} ${punto.x.toFixed(1)} ${punto.y.toFixed(1)}`).join(' ');
    const area = puntos.length > 1
        ? `${linea} L ${puntos[puntos.length - 1].x.toFixed(1)} ${margen.top + alto} L ${puntos[0].x.toFixed(1)} ${margen.top + alto} Z`
        : '';

    return (
        <div>
            <div className="overflow-x-auto pb-1">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[540px]" role="img" aria-label="Evolución mensual de requerimientos">
                <defs>
                    <linearGradient id="volumen-area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {ticks.map((tick) => (
                    <g key={tick}>
                        <line x1={margen.left} y1={posicionY(tick)} x2={width - margen.right} y2={posicionY(tick)}
                            stroke="var(--color-surface-container)" strokeWidth="1" strokeDasharray="3 4" />
                        <text x={margen.left - 8} y={posicionY(tick) + 3} textAnchor="end" fontSize="10"
                            fill="var(--color-outline)" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {Math.round(tick)}
                        </text>
                    </g>
                ))}

                {area && <path className="chart-fade" d={area} fill="url(#volumen-area-grad)" />}
                {puntos.length > 1 && <path pathLength="1" className="chart-line" d={linea} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                {puntos.map((punto, indice) => (
                    <g key={punto.periodo} className="chart-point" style={{ animationDelay: `${120 + indice * 70}ms` }}>
                        <circle cx={punto.x} cy={punto.y} r={punto.periodo === periodoSeleccionado ? 6 : 4}
                            fill={punto.periodo === periodoSeleccionado ? 'var(--color-primary-container)' : '#ffffff'}
                            stroke="var(--color-primary-container)" strokeWidth="2">
                            <title>{`${punto.periodo}: ${punto.total} requerimientos`}</title>
                        </circle>
                        {serie.length <= 8 && (
                            <text x={punto.x} y={punto.y - 12} textAnchor="middle" fontSize="10" fontWeight="700"
                                fill="var(--color-on-surface)" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {punto.total}
                            </text>
                        )}
                        <text x={punto.x} y={height - 14} textAnchor="middle" fontSize="9"
                            fontWeight={punto.periodo === periodoSeleccionado ? 700 : 500}
                            fill={punto.periodo === periodoSeleccionado ? 'var(--color-on-surface)' : 'var(--color-outline)'}
                            style={{ fontFamily: 'Inter, sans-serif' }}>
                            {etiquetaMes(punto.periodo)}
                        </text>
                    </g>
                ))}
            </svg>
            </div>

            {serie.length === 1 && (
                <p className="font-body-sm text-[11px] mt-1 text-center" style={{ color: 'var(--color-outline)' }}>
                    Solo hay un período registrado. La evolución mensual se apreciará cuando existan más meses.
                </p>
            )}
        </div>
    );
}

function GraficoDonaTipos({ datos, totalPeriodo }) {
    const totalMenciones = datos.reduce((suma, item) => suma + item.total, 0);

    if (totalMenciones === 0) {
        return (
            <div className="py-12 text-center">
                <span className="material-symbols-outlined block mx-auto mb-2" style={{ fontSize: '34px', color: 'var(--color-outline)' }}>pie_chart</span>
                <p className="font-body-sm text-[12px]" style={{ color: 'var(--color-outline)' }}>Sin tipos de contenido en el período.</p>
            </div>
        );
    }

    const radio = 54;
    const grosor = 22;
    const centro = 76;
    const circunferencia = 2 * Math.PI * radio;
    const segmentos = datos.filter((item) => item.total > 0);
    const separacion = segmentos.length > 1 ? 3 : 0;
    let acumulado = 0;

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative shrink-0">
                    <svg width="152" height="152" viewBox="0 0 152 152" role="img" aria-label="Distribución de requerimientos por tipo de contenido">
                        <circle cx={centro} cy={centro} r={radio} fill="none" stroke="var(--color-surface-container-high)" strokeWidth={grosor} />
                        <g className="chart-donut">
                            {segmentos.map((item) => {
                                const longitud = (item.total / totalMenciones) * circunferencia;
                                const longitudVisible = Math.max(longitud - separacion, 0);
                                const segmento = (
                                    <circle
                                        key={item.id}
                                        cx={centro}
                                        cy={centro}
                                        r={radio}
                                        fill="none"
                                        stroke={COLORES_TIPO[item.id]}
                                        strokeWidth={grosor}
                                        strokeDasharray={`${longitudVisible} ${circunferencia - longitudVisible}`}
                                        strokeDashoffset={-acumulado}
                                        transform={`rotate(-90 ${centro} ${centro})`}
                                    >
                                        <title>{`${item.label}: ${item.total}`}</title>
                                    </circle>
                                );
                                acumulado += longitud;
                                return segmento;
                            })}
                        </g>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <strong style={{ color: 'var(--color-on-surface)', fontSize: '27px', lineHeight: 1 }}>{totalMenciones}</strong>
                        <span className="text-[9px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--color-outline)' }}>menciones</span>
                    </div>
                </div>

                <div className="flex-1 w-full space-y-2.5">
                    {datos.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORES_TIPO[item.id] }} />
                                <span className="material-symbols-outlined shrink-0" style={{ fontSize: '15px', color: COLORES_TIPO[item.id] }}>{ICONOS_TIPO[item.id]}</span>
                                <span className="font-body-sm text-[12px] truncate" style={{ color: 'var(--color-on-surface)' }}>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <strong className="text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{item.total}</strong>
                                <span className="text-[10px] w-9 text-right" style={{ color: 'var(--color-outline)' }}>
                                    {Math.round((item.total / totalMenciones) * 100)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="font-body-sm text-[10px] mt-4" style={{ color: 'var(--color-outline)' }}>
                {totalPeriodo} {totalPeriodo === 1 ? 'solicitud' : 'solicitudes'} en el período. Una solicitud puede incluir más de un tipo.
            </p>
        </div>
    );
}

function GraficoAgentes({ agentes, totalPeriodo, sinAgente = 0 }) {
    if (agentes.length === 0) {
        return (
            <div className="py-12 text-center">
                <span className="material-symbols-outlined block mx-auto mb-2" style={{ fontSize: '34px', color: 'var(--color-outline)' }}>groups</span>
                <p className="font-body-sm text-[12px]" style={{ color: 'var(--color-outline)' }}>Sin solicitudes de agentes en el período.</p>
            </div>
        );
    }

    const maximo = Math.max(...agentes.map((agente) => agente.total), 1);
    const dosColumnas = agentes.length > 8;

    return (
        <div>
            {!dosColumnas && (
                <div className="grid grid-cols-[minmax(100px,150px)_1fr_60px] gap-2.5 mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Agente</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>Volumen</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-right" style={{ color: 'var(--color-outline)' }}>Total · %</span>
                </div>
            )}

            <div className={dosColumnas ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3' : 'space-y-2.5'}>
                {agentes.map((agente, indice) => {
                    const barra = (
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container)' }}>
                            <div className="bar-grow h-full rounded-full"
                                style={{
                                    width: `${(agente.total / maximo) * 100}%`,
                                    animationDelay: `${indice * 50}ms`,
                                    background: indice === 0
                                        ? 'linear-gradient(90deg, var(--color-primary-container), var(--color-tertiary))'
                                        : 'var(--color-primary-container)',
                                }} />
                        </div>
                    );
                    const identificacion = (
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                                style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                                {iniciales(agente.nombre)}
                            </span>
                            <span className="font-body-sm text-[12px] truncate" style={{ color: 'var(--color-on-surface)' }} title={agente.nombre}>
                                {agente.nombre}
                            </span>
                        </div>
                    );

                    if (dosColumnas) {
                        return (
                            <div key={agente.id} className="min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    {identificacion}
                                    <span className="shrink-0 text-[12px] font-bold" style={{ color: 'var(--color-on-surface)' }}>
                                        {agente.total}
                                        <span className="ml-1 text-[9px] font-medium" style={{ color: 'var(--color-outline)' }}>{agente.participacion}%</span>
                                    </span>
                                </div>
                                <div className="mt-1.5">{barra}</div>
                            </div>
                        );
                    }

                    return (
                        <div key={agente.id} className="grid grid-cols-[minmax(100px,150px)_1fr_60px] items-center gap-2.5">
                            {identificacion}
                            {barra}
                            <div className="text-right leading-tight">
                                <strong className="block text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{agente.total}</strong>
                                <span className="block text-[9px]" style={{ color: 'var(--color-outline)' }}>{agente.participacion}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="font-body-sm text-[10px] mt-4" style={{ color: 'var(--color-outline)' }}>
                Porcentaje sobre {totalPeriodo} {totalPeriodo === 1 ? 'solicitud' : 'solicitudes'} del período.
                {sinAgente > 0 ? ` Incluye ${sinAgente} sin agente asignado.` : ''}
            </p>
        </div>
    );
}

function GraficoNuevasFinalizadas({ serie, periodoSeleccionado }) {
    if (serie.length === 0) {
        return (
            <div className="py-12 text-center">
                <span className="material-symbols-outlined block mx-auto mb-2" style={{ fontSize: '34px', color: 'var(--color-outline)' }}>bar_chart</span>
                <p className="font-body-sm text-[12px]" style={{ color: 'var(--color-outline)' }}>Sin datos para comparar.</p>
            </div>
        );
    }

    const maximo = Math.max(...serie.map((item) => Math.max(item.total, item.finalizadas)), 1);
    const altura = (valor) => (valor === 0 ? 3 : Math.max(6, (valor / maximo) * 150));

    return (
        <div>
            <div className="flex items-center justify-end gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: 'var(--color-outline)' }}>
                    <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-primary-container)' }} /> Nuevas
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: 'var(--color-outline)' }}>
                    <span className="w-2 h-2 rounded-sm" style={{ background: 'var(--color-secondary)' }} /> Finalizadas
                </span>
            </div>

            <div className="overflow-x-auto pb-1">
                <div className="flex items-end justify-around gap-2 min-w-full" style={{ minWidth: `${Math.max(serie.length * 78, 220)}px` }}>
                    {serie.map((item, indice) => {
                        const esActual = item.periodo === periodoSeleccionado;
                        return (
                            <div key={item.periodo} className="flex flex-col items-center gap-2 flex-1 min-w-[64px] max-w-[110px]">
                                <div className="flex items-end justify-center gap-1.5 h-[150px]" style={{ opacity: esActual ? 1 : 0.55 }}>
                                    <div className="chart-bar w-[18px] rounded-t-md"
                                        style={{ height: `${altura(item.total)}px`, animationDelay: `${indice * 40}ms`, background: 'var(--color-primary-container)' }}
                                        title={`${item.periodo} · Nuevas: ${item.total}`} />
                                    <div className="chart-bar w-[18px] rounded-t-md"
                                        style={{ height: `${altura(item.finalizadas)}px`, animationDelay: `${indice * 40 + 60}ms`, background: 'var(--color-secondary)' }}
                                        title={`${item.periodo} · Finalizadas: ${item.finalizadas}`} />
                                </div>
                                <div className="text-center leading-tight">
                                    <span className="block text-[10px] font-semibold" style={{ color: esActual ? 'var(--color-on-surface)' : 'var(--color-outline)' }}>
                                        {etiquetaMes(item.periodo)}
                                    </span>
                                    <span className="block text-[9px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
                                        {item.total} / {item.finalizadas}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function GraficoDemandaAreas({ areas }) {
    return (
        <div>
            <div className="space-y-3.5">
                {areas.map((area, indice) => (
                    <div key={area.id} className="grid grid-cols-[minmax(100px,148px)_1fr_58px] items-center gap-2.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="material-symbols-outlined shrink-0" style={{ fontSize: '16px', color: COLORES_AREA[area.id] }}>{ICONOS_AREA[area.id]}</span>
                            <span className="font-body-sm text-[12px] truncate" style={{ color: 'var(--color-on-surface)' }}>{area.label}</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container)' }}>
                            <div className="bar-grow h-full rounded-full"
                                style={{ width: `${area.proporcion}%`, animationDelay: `${indice * 60}ms`, background: COLORES_AREA[area.id] }} />
                        </div>
                        <div className="text-right leading-tight">
                            <strong className="block text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{area.total}</strong>
                            <span className="block text-[9px]" style={{ color: 'var(--color-outline)' }}>{area.porcentaje}%</span>
                        </div>
                    </div>
                ))}
            </div>

            <p className="font-body-sm text-[10px] mt-4" style={{ color: 'var(--color-outline)' }}>
                Una solicitud puede demandar más de un área. El porcentaje se calcula sobre el total del período.
            </p>
        </div>
    );
}

export default function VolumenDemandaUI({
    requerimientosPeriodo = [],
    requerimientosFiltrados = [],
    periodos = [],
    periodoSeleccionado,
    metricas,
}) {
    const serieMensual = calcularSerieMensual(requerimientosFiltrados, periodos);
    const tipos = calcularVolumenPorTipo(requerimientosPeriodo);
    const agentes = calcularParticipacionAgentes(requerimientosPeriodo);
    const areas = calcularDemandaPorArea(requerimientosPeriodo);

    const totalHistorico = serieMensual.reduce((suma, item) => suma + item.total, 0);
    const promedioMensual = serieMensual.length > 0
        ? Math.round((totalHistorico / serieMensual.length) * 10) / 10
        : 0;
    const tasaFinalizacion = metricas.total > 0 ? Math.round((metricas.entregados / metricas.total) * 100) : 0;
    const areaPrincipal = [...areas].sort((a, b) => b.total - a.total)[0];
    const agentesAsignados = agentes.filter((agente) => agente.id !== 'sin-agente').length;
    const sinAgente = agentes.find((agente) => agente.id === 'sin-agente')?.total || 0;

    return (
        <div className="flex flex-col gap-4 sm:gap-5">
            <section className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="absolute -right-14 -top-14 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-secondary))' }} />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '23px' }}>bar_chart</span>
                        </div>
                        <div>
                            <h2 className="font-display font-bold" style={{ color: 'var(--color-on-surface)', fontSize: '20px' }}>
                                Dashboard de volumen y demanda
                            </h2>
                            <p className="font-body-sm text-[12px] mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Cuánto trabajo ingresa a la agencia y cómo se distribuye por tipo, agente y área.
                            </p>
                        </div>
                    </div>
                    <span className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold w-fit"
                        style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}>
                        {periodoSeleccionado || 'Sin período'}
                    </span>
                </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <TarjetaResumen
                    label="Solicitudes del período"
                    value={metricas.total}
                    hint={`${metricas.agentesActivos} ${metricas.agentesActivos === 1 ? 'agente activo' : 'agentes activos'}`}
                    icon="assignment"
                    accent="var(--color-primary-container)"
                    bg="rgba(37,99,235,0.10)"
                />
                <TarjetaResumen
                    label="Promedio mensual"
                    value={promedioMensual}
                    hint={`${serieMensual.length} ${serieMensual.length === 1 ? 'mes registrado' : 'meses registrados'}`}
                    icon="calendar_month"
                    accent="var(--color-tertiary)"
                    bg="var(--color-tertiary-fixed)"
                />
                <TarjetaResumen
                    label="Finalizadas del período"
                    value={metricas.entregados}
                    hint={`${tasaFinalizacion}% de finalización`}
                    icon="task_alt"
                    accent="var(--color-secondary)"
                    bg="var(--color-secondary-container)"
                />
                <TarjetaResumen
                    label="Área con mayor demanda"
                    value={areaPrincipal?.label || '—'}
                    hint={areaPrincipal ? `${areaPrincipal.total} solicitudes · ${areaPrincipal.porcentaje}% del período` : 'Sin datos en el período'}
                    icon="local_fire_department"
                    accent="#b45309"
                    bg="rgba(245,158,11,0.14)"
                    compacto
                />
            </section>

            <PanelCard
                title="Requerimientos por mes"
                subtitle="Evolución mensual de las solicitudes recibidas."
                icon="show_chart"
                badge="Todos los períodos filtrados">
                <GraficoEvolucionMensual serie={serieMensual} periodoSeleccionado={periodoSeleccionado} />
            </PanelCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 items-start">
                <PanelCard
                    title="Requerimientos por tipo"
                    subtitle="Videos, fotografía, artes, carruseles y campañas publicitarias."
                    icon="donut_small"
                    accent="var(--color-tertiary)"
                    bg="var(--color-tertiary-fixed)"
                    badge={periodoSeleccionado}>
                    <GraficoDonaTipos datos={tipos} totalPeriodo={metricas.total} />
                </PanelCard>

                <PanelCard
                    title="Requerimientos y participación por agente"
                    subtitle="Cantidad de solicitudes y porcentaje del total del período."
                    icon="bar_chart"
                    badge={`${agentesAsignados} ${agentesAsignados === 1 ? 'agente' : 'agentes'}`}>
                    <GraficoAgentes agentes={agentes} totalPeriodo={metricas.total} sinAgente={sinAgente} />
                </PanelCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 items-start">
                <PanelCard
                    title="Solicitudes nuevas vs. finalizadas"
                    subtitle="Trabajo que ingresa frente al que se completa en cada mes."
                    icon="compare_arrows"
                    accent="var(--color-secondary)"
                    bg="var(--color-secondary-container)">
                    <GraficoNuevasFinalizadas serie={serieMensual} periodoSeleccionado={periodoSeleccionado} />
                </PanelCard>

                <PanelCard
                    title="Demanda por área"
                    subtitle="Carga de trabajo de fotografía, video, diseño, redes y pauta."
                    icon="assignment_turned_in"
                    badge={periodoSeleccionado}>
                    <GraficoDemandaAreas areas={areas} />
                </PanelCard>
            </div>
        </div>
    );
}
