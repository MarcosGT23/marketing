import { useState, useEffect } from 'react';
import PanelVideoUI from './components/PanelVideoUI';
import { actualizarTareaVideo } from '../infrastructure/video.api';

export default function PanelVideoContainer() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const cargarRequerimientos = async () => {
        try {
            const res = await fetch('/api/requerimientos');
            const json = await res.json();
            if (!res.ok || json?.error) {
                console.error("Error API Video:", json);
                alert(json?.error || 'Error cargando producciones de video');
                setDatos([]);
                return;
            }
            setDatos(Array.isArray(json) ? json : []);
        } catch (err) {
            console.error(err);
            alert('Error cargando producciones de video: ' + err.message);
            setDatos([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarRequerimientos();
    }, []);

    const manejarCambioCheck = (idTarea, campo, checked) => {
        setDatos(prev => prev.map(item => {
            const tv = item.tareas_video?.[0];
            if (tv && tv.id_tarea === idTarea) {
                return {
                    ...item,
                    tareas_video: [{ ...tv, [campo]: checked }]
                };
            }
            return item;
        }));
    };

    const manejarCambioCampo = (idTarea, campo, valor) => {
        setDatos(prev => prev.map(item => {
            const tv = item.tareas_video?.[0];
            if (tv && tv.id_tarea === idTarea) {
                return {
                    ...item,
                    tareas_video: [{ ...tv, [campo]: valor }]
                };
            }
            return item;
        }));
    };

    const manejarGuardar = async (idTarea) => {
        const item = datos.find(d => d.tareas_video?.[0]?.id_tarea === idTarea);
        if (!item) return;
        const { req_guion, req_fotos, req_grabacion, req_edicion, req_voz_off, estado, progreso_porcentaje } = item.tareas_video[0];

        try {
            await actualizarTareaVideo(idTarea, {
                req_guion, req_fotos, req_grabacion, req_edicion, req_voz_off, estado, progreso_porcentaje
            });
            alert('Datos de video sincronizados correctamente.');
        } catch (err) {
            alert(`Error al guardar: ${err.message}`);
        }
    };

    return (
        <PanelVideoUI
            tareas={datos}
            cargando={cargando}
            alCambiarCheck={manejarCambioCheck}
            alCambiarCampo={manejarCambioCampo}
            alGuardar={manejarGuardar}
        />
    );
}