import { useState, useEffect } from 'react';
import FormularioPropiedadUI from './components/FormularioPropiedadUI';
import { crearRequerimiento } from '../infrastructure/requerimiento.api';

export default function AgenteContainer() {
    const [cargando, setCargando] = useState(false);
    const [agentes, setAgentes] = useState([]);

    const [formData, setFormData] = useState({
        id_agente: '',
        periodo_mensual: 'Septiembre 2026',
        nombre_propiedad: '',
        categoria: 'Casa',
        tipo: 'Venta',
        ubicacion: '',
        precio: '',
        superficie: '',
        habitaciones: '',
        descripcion_propiedad: '',
        elemento_destacar: '',
        publico_objetivo: '',
        req_guion: false,
        req_fotos: false,
        req_grabacion: false,
        req_edicion: false,
        req_voz_off: false,
        canales: [],
        presupuesto: ''
    });

    // Cargar la lista real de agentes desde Supabase
    useEffect(() => {
        async function obtenerAgentes() {
            try {
                const res = await fetch('/api/usuarios?rol=Agente');
                const data = await res.json();
                setAgentes(data);
                if (data.length > 0) {
                    setFormData((prev) => ({ ...prev, id_agente: data[0].id_usuario }));
                }
            } catch (error) {
                console.error('Error al cargar agentes:', error);
            }
        }
        obtenerAgentes();
    }, []);

    const manejarCambioDato = (campo, valor) => {
        setFormData((prev) => ({
            ...prev,
            [campo]: valor
        }));
    };

    const manejarCambioCheckbox = (campo, estaMarcado) => {
        setFormData((prev) => ({
            ...prev,
            [campo]: estaMarcado
        }));
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();

        if (!formData.nombre_propiedad.trim()) {
            alert('Por favor, ingresa el nombre de la propiedad.');
            return;
        }

        if (!formData.id_agente) {
            alert('Por favor, selecciona un agente.');
            return;
        }

        setCargando(true);

        try {
            const respuesta = await crearRequerimiento(formData);
            alert(`¡Campaña creada con éxito! ID asignado: ${respuesta.id_requerimiento}`);
            window.location.href = '/agente/dashboard';
        } catch (error) {
            console.error('Error al guardar:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="w-full">
            <FormularioPropiedadUI
                datos={formData}
                alCambiarDato={manejarCambioDato}
                alCambiarCheckbox={manejarCambioCheckbox}
                alEnviar={manejarEnvio}
                cargando={cargando}
                agentes={agentes}
            />
        </div>
    );
}