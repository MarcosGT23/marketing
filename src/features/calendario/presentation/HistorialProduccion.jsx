import { useState } from 'react';
import TextoExpandible from '../../../core/ui/TextoExpandible';
import { fechaLocal } from '../domain/eventos';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function HistorialProduccion({ produccion }) {
  const [periodo, setPeriodo] = useState('todos');
  const notas = produccion.anotaciones.filter(nota => periodo === 'todos' || nota.period === periodo);

  return <details className="cal-historial">
    <summary>Ver todas las anotaciones de CALENDARIO PRODUCCIÓN ({produccion.anotaciones.length})</summary>
    <div className="cal-historial-controles">
      <label>Período de la hoja
        <select value={periodo} onChange={evento => setPeriodo(evento.target.value)}>
          <option value="todos">Todos los meses</option>
          {produccion.meses.map(mes => <option key={mes.valor} value={mes.valor}>{mes.nombre}</option>)}
        </select>
      </label>
      <p role="status">{notas.length} anotaciones. Las notas sin fecha se conservan con su celda de origen.</p>
    </div>
    <div className="cal-tabla-scroll">
      <table>
        <thead><tr><th>Fecha</th><th>Período</th><th>Celda</th><th>Información anotada</th></tr></thead>
        <tbody>{notas.map(nota => <tr key={nota.id}>
          <td>{nota.date ? FORMATO_FECHA.format(fechaLocal(nota.date)) : 'Sin fecha indicada'}</td>
          <td>{nota.periodLabel}</td>
          <td><a href={nota.sourceUrl} target="_blank" rel="noreferrer">{nota.cell}</a></td>
          <td><TextoExpandible texto={nota.text} limite={180} etiqueta={`Mostrar anotación completa de ${nota.cell}`} etiquetaVisual="Mostrar información completa" /></td>
        </tr>)}</tbody>
      </table>
      {!notas.length && <p className="cal-nota">Este período no tiene anotaciones.</p>}
    </div>
  </details>;
}
