import { useState } from 'react';
import TextoExpandible from './TextoExpandible';
import './workCards.css';

const TEMAS = {
  general: { color: '#2563eb', fondo: '#eff6ff', icono: 'assignment', nombre: 'Requerimiento' },
  diseno: { color: '#087f5b', fondo: '#ecfdf5', icono: 'palette', nombre: 'Diseño gráfico' },
  video: { color: '#7c3aed', fondo: '#f5f3ff', icono: 'movie', nombre: 'Producción audiovisual' },
  cm: { color: '#2563eb', fondo: '#eff6ff', icono: 'ads_click', nombre: 'Pauta digital' },
};

export default function TarjetaTrabajo({ tema = 'general', prioridad, completada = false, titulo, children }) {
  const estilo = TEMAS[tema] || TEMAS.general;
  return <article className="work-card" aria-label={titulo} data-prioridad={prioridad} data-completada={completada || undefined}
    style={{ '--card-accent': estilo.color, '--card-tint': estilo.fondo }}>
    {children}
  </article>;
}

export function CabeceraTarjeta({ tema = 'general', item, agente, estado, bloqueada, children }) {
  const [tituloCompleto, setTituloCompleto] = useState(false);
  const estilo = TEMAS[tema] || TEMAS.general;
  const titulo = item.nombre_propiedad || `Requerimiento #${item.id_requerimiento}`;
  const finalizada = estado === 'Finalizado';
  return <header className="work-card__header">
    <div className="work-card__topline">
      <div className="work-card__department"><span className="material-symbols-outlined" aria-hidden="true">{estilo.icono}</span><span>{estilo.nombre}</span></div>
      <div className="work-card__actions">
        <span className="work-card__reference">#{item.id_requerimiento}</span>
        {children}
      </div>
    </div>
    <div className="work-card__title-area">
      <h3 className={tituloCompleto ? 'work-card__title' : 'work-card__title work-card__title--preview'}>{titulo}</h3>
      {titulo.length > 65 && <button type="button" aria-expanded={tituloCompleto} className="work-card__text-action"
        onClick={() => setTituloCompleto(prev => !prev)}>{tituloCompleto ? 'Ocultar título completo' : 'Ver título completo'}</button>}
    </div>
    <p className="work-card__agent"><span className="material-symbols-outlined" aria-hidden="true">person</span><span>{agente || 'Sin agente asignado'}</span></p>
    <div className="work-card__meta">
      <span className="work-card__period"><span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>{item.periodo_mensual || 'Sin período'}</span>
      <span className="work-card__priority" data-prioridad={item.prioridad || 'Baja'}><span aria-hidden="true" />{item.prioridad === 'Alta' ? 'Prioridad alta' : item.prioridad === 'Media' ? 'Prioridad media' : 'Prioridad baja'}</span>
      {estado && <span className="work-card__status" data-finalizada={finalizada || undefined}>
        {bloqueada && <span className="material-symbols-outlined" aria-label="Bloqueada">lock</span>}{estado}
      </span>}
    </div>
  </header>;
}

export function ResumenTarjeta({ campos, ubicacion }) {
  return <div className="work-card__summary">
    <dl className="work-card__facts" data-count={campos.length} style={{ '--fact-count': campos.length }}>
      {campos.map(([nombre, valor]) => <div key={nombre} className="work-card__fact">
        <dt>{nombre}</dt><dd><TextoExpandible texto={valor || 'Sin especificar'} limite={32} /></dd>
      </div>)}
    </dl>
    <div className="work-card__location"><span className="material-symbols-outlined" aria-hidden="true">location_on</span>
      <TextoExpandible texto={ubicacion || 'Ubicación por definir'} limite={65} />
    </div>
  </div>;
}
