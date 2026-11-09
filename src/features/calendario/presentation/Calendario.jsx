import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TIPOS_EVENTO, diasDelMes, esDiaEdicion, fechaBolivia, fechaLocal, haySolape, horaTexto, validarEvento } from '../domain/eventos';
import { obtenerJson } from '../../../core/utils/http';
import HistorialProduccion from './HistorialProduccion';
import './calendario.css';

const FORMATO_MES = new Intl.DateTimeFormat('es-BO', { month: 'long', year: 'numeric' });
const FORMATO_DIA = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const ACTIVIDADES_POR_PAGINA = 5;

function Modal({ titulo, cerrar, ocupado, children }) {
  const dialogo = useRef(null);
  useEffect(() => {
    const nodo = dialogo.current;
    nodo.showModal();
    return () => nodo.close();
  }, []);
  return <dialog ref={dialogo} className="cal-modal" aria-labelledby="cal-modal-titulo" onCancel={evento => { evento.preventDefault(); if (!ocupado) cerrar(); }}>
    <div className="cal-modal-cabecera"><h2 id="cal-modal-titulo">{titulo}</h2><button type="button" className="cal-icono" aria-label="Cerrar ventana" disabled={ocupado} onClick={cerrar}>×</button></div>
    {children}
  </dialog>;
}

function Evento({ evento, abrir, compacto = false, fechaPasada = false }) {
  const fecha = !compacto && <span className="cal-fecha-evento">
    {FORMATO_DIA.format(fechaLocal(evento.date))}
    {fechaPasada && <span className="cal-fecha-pasada">Pasada</span>}
  </span>;

  if (evento.source === 'produccion') {
    return <button type="button" className="cal-evento produccion" onClick={() => abrir(evento)}>
      {fecha}
      <span className="cal-origen-nota">Hoja · {evento.cell}</span>
      <span className="cal-contenido-anotacion">{evento.text}</span>
      <span className="cal-ver-nota">Ver información completa</span>
    </button>;
  }
  return <button type="button" className={`cal-evento ${evento.type}`} onClick={() => abrir(evento)}>
    {fecha}
    <strong>{evento.title}</strong>
    <span>{horaTexto(evento.start)}–{horaTexto(evento.start + evento.duration)}</span>
    <span className="cal-responsable">{evento.agent}</span>
  </button>;
}

function ActividadesDelMes({ actividades, mes, hoy, cargando, abrirDetalle }) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(actividades.length / ACTIVIDADES_POR_PAGINA));
  const paginaVisible = Math.min(pagina, totalPaginas);
  const inicio = (paginaVisible - 1) * ACTIVIDADES_POR_PAGINA;

  return <aside className="cal-proximos">
    <div className="cal-titulo-aside"><h2>Actividades del mes</h2><span>{actividades.length}</span></div>
    <p>{FORMATO_MES.format(mes)}</p>
    {actividades.slice(inicio, inicio + ACTIVIDADES_POR_PAGINA).map(evento => <Evento key={evento.id} evento={evento} abrir={abrirDetalle} fechaPasada={evento.date < hoy} />)}
    {!actividades.length && <div className="cal-vacio"><span aria-hidden="true">▦</span><strong>{cargando ? 'Cargando actividades…' : 'Sin actividades para mostrar'}</strong>{!cargando && <p>No se encontraron actividades para este mes con el filtro actual.</p>}</div>}
    {totalPaginas > 1 && <nav className="cal-paginacion" aria-label="Paginación de actividades del mes">
      <button type="button" className="cal-icono" aria-label="Página anterior" disabled={paginaVisible === 1} onClick={() => setPagina(paginaVisible - 1)}>‹</button>
      <span aria-live="polite">Página {paginaVisible} de {totalPaginas}</span>
      <button type="button" className="cal-icono" aria-label="Página siguiente" disabled={paginaVisible === totalPaginas} onClick={() => setPagina(paginaVisible + 1)}>›</button>
    </nav>}
  </aside>;
}

export default function Calendario() {
  const [hoy, setHoy] = useState(fechaBolivia);
  const [mes, setMes] = useState(() => { const dia = fechaLocal(fechaBolivia()); return new Date(dia.getFullYear(), dia.getMonth(), 1, 12); });
  const [eventos, setEventos] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [conectado, setConectado] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [produccion, setProduccion] = useState(null);
  const [errorProduccion, setErrorProduccion] = useState('');
  const [aviso, setAviso] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [zoom, setZoom] = useState(140);
  const [formulario, setFormulario] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const ocupado = useRef(false);
  const secuencia = useRef(0);

  const cargar = useCallback(async () => {
    if (ocupado.current) return;
    const peticion = ++secuencia.current;
    setCargando(true);
    try {
      const [reservas, anotaciones] = await Promise.allSettled([
        obtenerJson('/api/events.json'),
        obtenerJson('/api/calendario/produccion'),
      ]);
      if (peticion !== secuencia.current || ocupado.current) return;
      if (reservas.status === 'fulfilled' && Array.isArray(reservas.value)) {
        setEventos(reservas.value);
        setConectado(true);
        setErrorCarga('');
      } else {
        setErrorCarga(reservas.reason?.message || 'No se pudieron cargar las reservas.');
        setConectado(false);
      }
      if (anotaciones.status === 'fulfilled' && Array.isArray(anotaciones.value?.anotaciones)) {
        setProduccion(anotaciones.value);
        setErrorProduccion('');
      } else {
        setErrorProduccion(anotaciones.reason?.message || 'No se pudieron cargar las anotaciones de la hoja.');
      }
    } catch (error) {
      if (peticion !== secuencia.current || ocupado.current) return;
      setErrorCarga(error.message);
      setConectado(false);
    } finally {
      if (peticion === secuencia.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    obtenerJson('/api/usuarios?rol=Agente').then(datos => {
      if (Array.isArray(datos)) setAgentes(datos.map(agente => agente.nombre).filter(Boolean));
    }).catch(() => setAgentes([]));
    const intervalo = setInterval(() => {
      setHoy(fechaBolivia());
      if (document.visibilityState === 'visible') cargar();
    }, 30000);
    return () => { clearInterval(intervalo); secuencia.current++; };
  }, [cargar]);

  const ordenados = useMemo(() => [...eventos].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start), [eventos]);
  const visibles = ordenados.filter(evento => filtro === 'todos' || evento.type === filtro);
  const notasVisibles = filtro === 'todos' || filtro === 'produccion' ? produccion?.anotaciones.filter(nota => nota.date) || [] : [];
  const dias = diasDelMes(mes.getFullYear(), mes.getMonth(), true);
  const mesSeleccionado = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`;
  const actividadesDelMes = [...visibles, ...notasVisibles]
    .filter(actividad => actividad.date.slice(0, 7) === mesSeleccionado)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? 0) - (b.start ?? 0));
  const mesesDisponibles = [...new Set([mesSeleccionado, ...(produccion?.meses.map(periodo => periodo.valor) || []), ...eventos.map(evento => evento.date.slice(0, 7))])].sort();
  const responsables = [...new Set(['Equipo Interno', ...agentes, ...eventos.map(evento => evento.agent)])];
  const conflicto = formulario && eventos.find(evento => haySolape(evento, formulario));

  function abrirReserva(fecha) {
    setErrorFormulario('');
    setAviso('');
    setFormulario({ id: crypto.randomUUID(), title: '', agent: responsables[0], type: esDiaEdicion(fecha) ? 'edicion' : 'grabacion', date: fecha, start: 9, duration: 2, exceptionReason: '' });
  }

  function abrirDetalle(evento) {
    setDetalle(evento);
    setConfirmarBorrado(false);
    setErrorFormulario('');
  }

  function cambiar(campo, valor) {
    setFormulario(actual => ({ ...actual, [campo]: valor }));
    setErrorFormulario('');
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (ocupado.current) return;
    const error = validarEvento(formulario);
    if (error) { setErrorFormulario(error); return; }
    if (conflicto) { setErrorFormulario(`El horario coincide con «${conflicto.title}», asignado a ${conflicto.agent}.`); return; }
    ocupado.current = true;
    secuencia.current++;
    setCargando(false);
    setGuardando(true);
    try {
      const resultado = await obtenerJson('/api/events.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', ...formulario }) });
      setEventos(actuales => [...actuales.filter(item => item.id !== resultado.event.id), resultado.event]);
      setFormulario(null);
      setAviso('Evento guardado en Google Sheets.');
    } catch (error) {
      setErrorFormulario(error.message);
    } finally {
      ocupado.current = false;
      setGuardando(false);
      cargar();
    }
  }

  async function eliminar() {
    if (ocupado.current) return;
    ocupado.current = true;
    secuencia.current++;
    setCargando(false);
    setGuardando(true);
    try {
      await obtenerJson('/api/events.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: detalle.id }) });
      setEventos(actuales => actuales.filter(evento => evento.id !== detalle.id));
      setDetalle(null);
      setAviso('Evento eliminado de Google Sheets.');
    } catch (error) { setErrorFormulario(error.message); }
    finally { ocupado.current = false; setGuardando(false); cargar(); }
  }

  function moverMes(desplazamiento) {
    setMes(actual => new Date(actual.getFullYear(), actual.getMonth() + desplazamiento, 1, 12));
  }

  return <section className="cal-app" aria-label="Calendario de producción" style={{ '--cal-altura': `${zoom}px` }}>
    <header className="cal-encabezado">
      <div><span className="cal-eyebrow">Organización del equipo</span><h1>Calendario de producción</h1><p>Grabaciones, edición y pauta en una misma agenda.</p></div>
      <div className="cal-acciones"><button className="cal-boton" disabled={cargando || guardando} onClick={cargar}>{cargando ? 'Sincronizando…' : 'Sincronizar'}</button><button className="cal-boton primario" disabled={!conectado || guardando} onClick={() => abrirReserva(hoy)}>+ Agendar evento</button></div>
    </header>

    {errorCarga && <div className="cal-alerta" role="alert"><strong>Calendario pendiente de sincronizar</strong><p>{errorCarga} Los eventos se mostrarán cuando la conexión esté disponible.</p></div>}
    {errorProduccion && <div className="cal-alerta" role="alert"><strong>Anotaciones de la hoja pendientes de sincronizar</strong><p>{errorProduccion}{produccion ? ' Se conserva la última lectura disponible.' : ''}</p></div>}
    {aviso && <p role="status" className="cal-exito">{aviso}</p>}
    {produccion && <div className="cal-fuente-produccion">
      <div><strong>CALENDARIO PRODUCCIÓN</strong><p>{produccion.anotaciones.length} anotaciones de la hoja. Pulsa una tarjeta para leer su contenido completo.</p></div>
      <a href={produccion.sourceUrl} target="_blank" rel="noreferrer" className="cal-boton">Abrir hoja original</a>
    </div>}

    <div className="cal-toolbar">
      <div className="cal-filtros" aria-label="Filtrar actividades">
        <button aria-pressed={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todas</button>
        {Object.entries(TIPOS_EVENTO).map(([tipo, nombre]) => <button key={tipo} className={tipo} aria-pressed={filtro === tipo} onClick={() => setFiltro(tipo)}><span aria-hidden="true">● </span>{nombre}</button>)}
        <button className="produccion" aria-pressed={filtro === 'produccion'} onClick={() => setFiltro('produccion')}>Anotaciones de la hoja</button>
      </div>
      <div className="cal-controles">
        <div className="cal-zoom"><button className="cal-icono" aria-label="Reducir altura de los días" disabled={zoom <= 100} onClick={() => setZoom(actual => actual - 20)}>−</button><button className="cal-icono" aria-label="Aumentar altura de los días" disabled={zoom >= 240} onClick={() => setZoom(actual => actual + 20)}>+</button></div>
        <div className="cal-navegacion"><button className="cal-icono" aria-label="Mes anterior" onClick={() => moverMes(-1)}>‹</button><h2 aria-live="polite">{FORMATO_MES.format(mes)}</h2><button className="cal-icono" aria-label="Mes siguiente" onClick={() => moverMes(1)}>›</button></div>
        <button className="cal-boton" onClick={() => { const dia = fechaLocal(hoy); setMes(new Date(dia.getFullYear(), dia.getMonth(), 1, 12)); }}>Hoy</button>
      </div>
    </div>
    <label className="cal-selector-mes">Ir a un mes
      <select value={mesSeleccionado} onChange={evento => { const [anio, numeroMes] = evento.target.value.split('-').map(Number); setMes(new Date(anio, numeroMes - 1, 1, 12)); }}>
        {mesesDisponibles.map(periodo => <option key={periodo} value={periodo}>{FORMATO_MES.format(fechaLocal(`${periodo}-01`))}</option>)}
      </select>
    </label>

    <div className="cal-cuerpo">
      <div className="cal-agenda">
        <div className="cal-scroll"><div className="cal-semana">{DIAS.map(dia => <div key={dia}>{dia}</div>)}</div>
          <div className="cal-cuadricula">{dias.map(dia => {
            const reservada = esDiaEdicion(dia.fecha);
            return <div key={dia.fecha} className={`cal-dia ${dia.otroMes ? 'otro-mes' : ''} ${reservada ? 'reservado' : ''} ${dia.fecha === hoy ? 'hoy' : ''} ${dia.fecha < hoy ? 'pasado' : ''}`}>
              <button className="cal-dia-numero" disabled={dia.domingo || !conectado || guardando} aria-label={`${dia.domingo ? 'Domingo' : 'Agendar el'} ${FORMATO_DIA.format(fechaLocal(dia.fecha))}${reservada ? ', reservado para edición' : ''}`} onClick={() => abrirReserva(dia.fecha)}><span>{reservada && <span aria-hidden="true">◈ </span>}{dia.numero}</span>{!dia.domingo && <span aria-hidden="true">+</span>}</button>
              {visibles.filter(evento => evento.date === dia.fecha).map(evento => <Evento key={evento.id} evento={evento} abrir={abrirDetalle} compacto />)}
              {notasVisibles.filter(nota => nota.date === dia.fecha).map(nota => <Evento key={nota.id} evento={nota} abrir={abrirDetalle} compacto />)}
            </div>;
          })}</div>
        </div>
        <p className="cal-nota">Las anotaciones mantienen el texto y la fecha de la hoja original. Para nuevas reservas, lunes, miércoles y viernes se reservan para edición y las excepciones requieren un motivo. Horario de reservas de lunes a sábado · Bolivia · 07:00–19:00.</p>
      </div>
      <ActividadesDelMes key={`${mesSeleccionado}-${filtro}`} actividades={actividadesDelMes} mes={mes} hoy={hoy} cargando={cargando} abrirDetalle={abrirDetalle} />
    </div>
    {produccion && <HistorialProduccion produccion={produccion} />}

    {formulario && <Modal titulo="Agendar evento" ocupado={guardando} cerrar={() => setFormulario(null)}><form onSubmit={guardar}>
      <fieldset disabled={guardando} className="cal-form">
        <label>Título<input autoFocus required maxLength={200} value={formulario.title} onChange={evento => cambiar('title', evento.target.value)} placeholder="Ej. Rodaje exterior Urubó" /></label>
        <div className="cal-dos-columnas"><label>Fecha<input required type="date" value={formulario.date} onChange={evento => cambiar('date', evento.target.value)} /></label><label>Tipo<select value={formulario.type} onChange={evento => cambiar('type', evento.target.value)}>{Object.entries(TIPOS_EVENTO).map(([tipo, nombre]) => <option key={tipo} value={tipo}>{nombre}</option>)}</select></label></div>
        <label>Responsable<select value={formulario.agent} onChange={evento => cambiar('agent', evento.target.value)}>{responsables.map(persona => <option key={persona}>{persona}</option>)}</select></label>
        <div className="cal-dos-columnas"><label>Hora de inicio<select value={formulario.start} onChange={evento => cambiar('start', Number(evento.target.value))}>{Array.from({ length: 24 }, (_, indice) => 7 + indice / 2).map(hora => <option key={hora} value={hora}>{horaTexto(hora)}</option>)}</select></label><label>Duración<select value={formulario.duration} onChange={evento => cambiar('duration', Number(evento.target.value))}>{Array.from({ length: 24 }, (_, indice) => (indice + 1) / 2).map(duracion => <option key={duracion} value={duracion}>{duracion} {duracion === 1 ? 'hora' : 'horas'}</option>)}</select></label></div>
        {esDiaEdicion(formulario.date) && formulario.type !== 'edicion' && <label>Motivo de excepción<textarea required minLength={4} maxLength={500} rows={3} value={formulario.exceptionReason} onChange={evento => cambiar('exceptionReason', evento.target.value)} placeholder="Explica por qué se necesita esta fecha reservada para edición" /></label>}
        {conflicto && <p className="cal-error">El horario coincide con «{conflicto.title}», asignado a {conflicto.agent}.</p>}
        {errorFormulario && <p className="cal-error" role="alert">{errorFormulario}</p>}
        <div className="cal-pie-modal"><button type="button" className="cal-boton" onClick={() => setFormulario(null)}>Cancelar</button><button type="submit" className="cal-boton primario" disabled={Boolean(conflicto) || !conectado}>{guardando ? 'Guardando…' : 'Guardar en calendario'}</button></div>
      </fieldset>
    </form></Modal>}

    {detalle?.source === 'produccion' && <Modal titulo="Anotación de CALENDARIO PRODUCCIÓN" ocupado={false} cerrar={() => setDetalle(null)}>
      <p className="cal-nota">{detalle.date ? FORMATO_DIA.format(fechaLocal(detalle.date)) : 'Sin fecha indicada'} · Celda {detalle.cell}</p>
      <div className="cal-texto-original">{detalle.text}</div>
      <div className="cal-pie-modal"><a className="cal-boton" href={detalle.sourceUrl} target="_blank" rel="noreferrer">Ver celda en Google Sheets</a><button className="cal-boton" onClick={() => setDetalle(null)}>Cerrar</button></div>
    </Modal>}
    {detalle && detalle.source !== 'produccion' && <Modal titulo="Detalle del evento" ocupado={guardando} cerrar={() => setDetalle(null)}>
      <div className={`cal-resumen ${detalle.type}`}><strong>{detalle.title}</strong><p>{detalle.agent}</p></div>
      <dl className="cal-datos"><div><dt>Actividad</dt><dd>{TIPOS_EVENTO[detalle.type]}</dd></div><div><dt>Fecha</dt><dd>{FORMATO_DIA.format(fechaLocal(detalle.date))}</dd></div><div><dt>Horario</dt><dd>{horaTexto(detalle.start)}–{horaTexto(detalle.start + detalle.duration)} · Bolivia</dd></div>{detalle.exceptionReason && <div><dt>Motivo de excepción</dt><dd>{detalle.exceptionReason}</dd></div>}</dl>
      {confirmarBorrado && <p className="cal-error">Se eliminará «{detalle.title}» de la hoja de Google Sheets.</p>}
      {errorFormulario && <p className="cal-error" role="alert">{errorFormulario}</p>}
      <div className="cal-pie-modal"><button className="cal-boton peligro" disabled={guardando || !conectado} onClick={() => confirmarBorrado ? eliminar() : setConfirmarBorrado(true)}>{guardando ? 'Eliminando…' : confirmarBorrado ? 'Confirmar eliminación' : 'Eliminar evento'}</button><button className="cal-boton" disabled={guardando} onClick={() => confirmarBorrado ? setConfirmarBorrado(false) : setDetalle(null)}>{confirmarBorrado ? 'Cancelar' : 'Cerrar'}</button></div>
    </Modal>}
  </section>;
}
