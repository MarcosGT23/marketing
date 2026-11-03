import { obtenerOpcionesSolicitadas } from '../../utils/opcionesSolicitadas';

export default function OpcionesSolicitadas({ requerimiento }) {
  const entregables = obtenerOpcionesSolicitadas(requerimiento);
  return <section aria-label="Opciones solicitadas" className="space-y-2">
    <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline">Opciones solicitadas</h4>
    {entregables.length ? <ul className="flex flex-wrap gap-1.5">
      {entregables.map(texto => <li key={texto} className="rounded-lg px-2 py-1 text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed-variant">{texto}</li>)}
    </ul> : <p className="text-xs text-outline">Sin opciones especificadas.</p>}
  </section>;
}
