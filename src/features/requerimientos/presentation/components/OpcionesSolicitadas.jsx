import { obtenerOpcionesSolicitadas } from '../../utils/opcionesSolicitadas';
import { useState } from 'react';

export default function OpcionesSolicitadas({ requerimiento }) {
  const entregables = obtenerOpcionesSolicitadas(requerimiento);
  const [verTodas, setVerTodas] = useState(false);
  return <section aria-label="Opciones solicitadas" className="work-card__requested">
    <h4 className="work-card__section-title"><span className="material-symbols-outlined" aria-hidden="true">fact_check</span>Opciones solicitadas <span>· {entregables.length}</span></h4>
    {entregables.length ? <ul className="work-card__requested-list">
      {(verTodas ? entregables : entregables.slice(0, 4)).map(texto => <li key={texto}><span className="material-symbols-outlined" aria-hidden="true">check</span><span>{texto}</span></li>)}
    </ul> : <p className="work-card__field-placeholder mt-3">Sin opciones especificadas.</p>}
    {entregables.length > 4 && <button type="button" className="work-card__text-action mt-2" aria-expanded={verTodas}
      onClick={() => setVerTodas(prev => !prev)}>{verTodas ? 'Ver menos opciones' : `Ver todas las opciones (+${entregables.length - 4})`}</button>}
  </section>;
}
