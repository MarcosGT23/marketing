import TextoExpandible from '../../../../core/ui/TextoExpandible';
import OpcionesSolicitadas from './OpcionesSolicitadas';

export default function InformacionRequerimiento({ requerimiento: item, omitirDescripcion = false, mostrarUbicacion = false, descripcionPrincipal, etiquetaDescripcion = 'Descripción' }) {
  const video = (Array.isArray(item.tareas_video) ? item.tareas_video[0] : item.tareas_video) || {};
  const campos = [
    [etiquetaDescripcion, descripcionPrincipal ?? (!omitirDescripcion && item.descripcion_propiedad)],
    ['Público objetivo', item.publico_objetivo],
    ['Hook / Elemento a destacar', item.elemento_destacar],
    ['Notas de producción', item.notas_produccion],
  ];
  const adicionales = [
    ['Descripción de la propiedad', descripcionPrincipal && item.descripcion_propiedad !== descripcionPrincipal && item.descripcion_propiedad],
    ['Observaciones audiovisuales', video.Descripcion],
    ['Fecha tentativa de rodaje', item.fecha_rodaje],
    ['Precio', item.precio],
    ['Ubicación', mostrarUbicacion && item.ubicacion],
  ].filter(([, valor]) => valor);
  return <div className="work-card__info">
    <OpcionesSolicitadas requerimiento={item} />
    <div className="work-card__fields">
      {campos.map(([etiqueta, valor]) => <section key={etiqueta} aria-label={etiqueta} className="work-card__field">
        <h4>{etiqueta}</h4>
        {valor ? <TextoExpandible texto={valor} limite={55} etiqueta={`Mostrar información completa: ${etiqueta.toLowerCase()}`} etiquetaVisual="Mostrar información completa" /> : <p className="work-card__field-placeholder">Sin especificar</p>}
      </section>)}
    </div>
    {adicionales.length > 0 ? <details className="work-card__details">
      <summary>Información adicional <span>{adicionales.length} {adicionales.length === 1 ? 'dato' : 'datos'}</span></summary>
      <div className="work-card__details-body">{adicionales.map(([etiqueta, valor]) => <section key={etiqueta} aria-label={etiqueta}>
        <h4>{etiqueta}</h4><TextoExpandible texto={valor} etiqueta={`Mostrar información completa: ${etiqueta.toLowerCase()}`} />
      </section>)}</div>
    </details> : <div className="work-card__details-placeholder"><span>Información adicional</span><span>Sin otros datos</span></div>}
  </div>;
}
