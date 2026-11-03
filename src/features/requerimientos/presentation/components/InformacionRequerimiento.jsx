import TextoExpandible from '../../../../core/ui/TextoExpandible';
import OpcionesSolicitadas from './OpcionesSolicitadas';

export default function InformacionRequerimiento({ requerimiento: item, omitirDescripcion = false, mostrarUbicacion = false }) {
  const video = (Array.isArray(item.tareas_video) ? item.tareas_video[0] : item.tareas_video) || {};
  const campos = [
    ['Descripción', !omitirDescripcion && item.descripcion_propiedad],
    ['Público objetivo', item.publico_objetivo],
    ['Hook / Elemento a destacar', item.elemento_destacar],
    ['Notas de producción', item.notas_produccion],
    ['Observaciones audiovisuales', video.Descripcion],
    ['Fecha tentativa de rodaje', item.fecha_rodaje],
    ['Precio', item.precio],
    ['Ubicación', mostrarUbicacion && item.ubicacion],
  ].filter(([, valor]) => valor);
  return <div className="space-y-3 text-xs pt-2">
    <OpcionesSolicitadas requerimiento={item} />
    {campos.map(([etiqueta, valor]) => <section key={etiqueta} aria-label={etiqueta} className="space-y-1 min-w-0">
      <h4 className="font-semibold text-outline">{etiqueta}</h4>
      <TextoExpandible texto={valor} className="text-on-surface-variant" etiqueta={`Mostrar información completa: ${etiqueta.toLowerCase()}`} />
    </section>)}
  </div>;
}
