import { useState, useEffect } from 'react';
import TableroDisenoUI from './components/TableroDisenoUI';
import { actualizarTareaDiseno } from '../infrastructure/diseno.api';

export default function TableroDisenoContainer() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarRequerimientos = async () => {
        try {
            const res = await fetch('/api/requerimientos');
            const json = await res.json();
            setDatos(json);
        } catch (err) {
            console.error(err);
            alert('Error cargando tareas de diseño');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarRequerimientos();
    }, []);

    const manejarCambioCampo = (idTarea, campo, valor) => {
        setDatos(prev => prev.map(item => {
            const td = item.tareas_diseno?.[0];
            if (td && td.id_tarea === idTarea) {
                return {
                    ...item,
                    tareas_diseno: [{ ...td, [campo]: valor }]
                };
            }
            return item;
        }));
    };

    const manejarGuardar = async (idTarea) => {
        const item = datos.find(d => d.tareas_diseno?.[0]?.id_tarea === idTarea);
        if (!item) return;
        const { estado, progreso_porcentaje, fecha_limite } = item.tareas_diseno[0];

        try {
            await actualizarTareaDiseno(idTarea, { estado, progreso_porcentaje, fecha_limite });
            alert('Tarea de diseño guardada correctamente.');
        } catch (err) {
            alert(`Error al guardar: ${err.message}`);
        }
    };

    return (
        <TableroDisenoUI
            tareas={datos}
            cargando={cargando}
            alCambiarCampo={manejarCambioCampo}
            alGuardar={manejarGuardar}
        />
    );
}