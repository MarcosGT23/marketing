import { useId, useState } from 'react';

export default function TextoExpandible({ texto, limite = 90, className = '', etiqueta = 'Mostrar información completa' }) {
  const [expandido, setExpandido] = useState(false);
  const id = useId();
  if (!texto) return null;
  const largo = String(texto).length > limite || String(texto).includes('\n');
  return <div className={`min-w-0 ${className}`}>
    <p id={id} className={`whitespace-pre-wrap break-words ${largo && !expandido ? 'line-clamp-2' : ''}`}>{texto}</p>
    {largo && <button type="button" aria-expanded={expandido} aria-controls={id}
      onClick={e => { e.stopPropagation(); setExpandido(prev => !prev); }}
      className="mt-1 text-[11px] font-semibold text-primary-container hover:underline cursor-pointer">
      {expandido ? 'Mostrar menos' : etiqueta}
    </button>}
  </div>;
}
