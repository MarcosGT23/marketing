import { useState, useEffect, useCallback } from 'react';
import FormularioPropiedadUI from './components/FormularioPropiedadUI';
import { crearRequerimiento } from '../infrastructure/requerimiento.api';

const CREAR_PROP_INICIAL = (idAgente = '', periodo = 'Septiembre 2026') => ({
    id_agente: idAgente,
    periodo_mensual: periodo,
    nombre_propiedad: '',
    categoria: 'Departamento',
    tipo: 'Venta',
    ubicacion: '',
    precio: '',
    superficie: '',
    habitaciones: '',
    descripcion_propiedad: '',
    elemento_destacar: '',
    publico_objetivo: '',
    // Enrutamiento de entregables
    req_arte_estatico: true,
    req_carrusel: false,
    req_reel: false,
    // Especificaciones técnicas
    req_guion: false,
    req_fotos: false,
    req_grabacion: false,
    req_edicion: false,
    req_voz_off: false,
    fecha_rodaje: '',
    notas_produccion: '',
    canales: ['Facebook / Instagram'],
    plataforma: 'Facebook / Instagram',
    presupuesto: ''
});

export default function AgenteContainer() {
    const [cargando, setCargando] = useState(false);
    const [agentes, setAgentes] = useState([]);
    const [requerimientosLista, setRequerimientosLista] = useState([]);
    const [editandoIndex, setEditandoIndex] = useState(null);
    const [isCollapsing, setIsCollapsing] = useState(false);
    const [formAnimKey, setFormAnimKey] = useState(1);
    const [toastMensaje, setToastMensaje] = useState(null);
    const [progresoEnvio, setProgresoEnvio] = useState(null);

    const [formData, setFormData] = useState(CREAR_PROP_INICIAL());

    // Cargar la lista real de agentes desde Supabase
    useEffect(() => {
        async function obtenerAgentes() {
            try {
                const res = await fetch('/api/usuarios?rol=Agente');
                const data = await res.json();
                setAgentes(data);
                if (data.length > 0) {
                    setFormData((prev) => ({
                        ...prev,
                        id_agente: prev.id_agente || data[0].id_usuario
                    }));
                }
            } catch (error) {
                console.error('Error al cargar agentes:', error);
            }
        }
        obtenerAgentes();
    }, []);

    const manejarCambioDato = (campo, valor) => {
        setFormData((prev) => {
            const next = { ...prev, [campo]: valor };
            if (campo === 'canales') {
                next.plataforma = Array.isArray(valor) ? valor.join(', ') : valor;
            }
            return next;
        });
    };

    const manejarCambioCheckbox = (campo, estaMarcado) => {
        setFormData((prev) => ({
            ...prev,
            [campo]: estaMarcado
        }));
    };

    // Añadir o actualizar requerimiento en forma de burbuja con animación de cierre
    const manejarAnadirRequerimiento = () => {
        if (!formData.nombre_propiedad || !formData.nombre_propiedad.trim()) {
            alert('Por favor, ingresa el nombre de la propiedad antes de añadirla a la lista de requerimientos.');
            return;
        }

        if (!formData.id_agente) {
            alert('Por favor, selecciona un agente solicitante.');
            return;
        }

        // 1. Iniciar animación de cierre/colapso del formulario
        setIsCollapsing(true);

        // 2. Tras la transición de cierre (~300ms), guardar en la cola de burbujas y resetear formulario
        setTimeout(() => {
            const nombreProp = formData.nombre_propiedad.trim();

            if (editandoIndex !== null) {
                // Actualizar burbuja existente
                setRequerimientosLista((prev) => {
                    const copia = [...prev];
                    copia[editandoIndex] = {
                        ...formData,
                        _id: copia[editandoIndex]._id || ('req-' + Date.now())
                    };
                    return copia;
                });
                setToastMensaje(`✓ Requerimiento "${nombreProp}" actualizado.`);
                setEditandoIndex(null);
            } else {
                // Añadir nueva burbuja a la cola
                const nuevoItem = {
                    ...formData,
                    _id: 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
                };
                setRequerimientosLista((prev) => [...prev, nuevoItem]);
                setToastMensaje(`✨ Requerimiento "${nombreProp}" guardado en la burbuja.`);
            }

            // Limpiar datos específicos de la propiedad, MANTENIENDO el agente y el periodo mensual
            setFormData(CREAR_PROP_INICIAL(formData.id_agente, formData.periodo_mensual));
            setFormAnimKey((k) => k + 1);
            setIsCollapsing(false);

            // Auto-ocultar notificación
            setTimeout(() => {
                setToastMensaje((actual) => (actual?.includes(nombreProp) ? null : actual));
            }, 3500);
        }, 320);
    };

    // Seleccionar una burbuja para editar en el formulario
    const manejarSeleccionarBurbuja = (index) => {
        const item = requerimientosLista[index];
        if (!item) return;

        if (editandoIndex === index) {
            // Ya se encuentra en edición
            return;
        }

        setIsCollapsing(true);
        setTimeout(() => {
            setFormData({ ...item });
            setEditandoIndex(index);
            setIsCollapsing(false);
            setFormAnimKey((k) => k + 1);

            const el = document.getElementById('sec-propiedad');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 250);
    };

    // Eliminar una burbuja de la cola
    const manejarEliminarBurbuja = (index) => {
        const item = requerimientosLista[index];
        const nombre = item?.nombre_propiedad || 'este requerimiento';

        if (!confirm(`¿Eliminar la burbuja de "${nombre}"?`)) {
            return;
        }

        setRequerimientosLista((prev) => prev.filter((_, i) => i !== index));

        if (editandoIndex === index) {
            setEditandoIndex(null);
            setFormData(CREAR_PROP_INICIAL(formData.id_agente, formData.periodo_mensual));
            setFormAnimKey((k) => k + 1);
        } else if (editandoIndex !== null && editandoIndex > index) {
            setEditandoIndex(editandoIndex - 1);
        }
    };

    // Cancelar la edición de una burbuja
    const manejarCancelarEdicion = () => {
        setEditandoIndex(null);
        setFormData(CREAR_PROP_INICIAL(formData.id_agente, formData.periodo_mensual));
        setFormAnimKey((k) => k + 1);
    };

    // Enviar todos los requerimientos (burbujas acumuladas + requerimiento en formulario si existe)
    const manejarEnvio = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Construir la lista consolidada
        let listaFinal = [...requerimientosLista];

        // Si el usuario tiene datos en el formulario actual y no estaba en modo edición de una existente
        if (editandoIndex === null && formData.nombre_propiedad && formData.nombre_propiedad.trim()) {
            if (!formData.id_agente) {
                alert('Por favor, selecciona un agente.');
                return;
            }
            listaFinal.push({ ...formData, _id: 'req-actual-' + Date.now() });
        } else if (editandoIndex !== null) {
            // Asegurar sincronización del requerimiento que se estaba editando
            listaFinal[editandoIndex] = { ...formData };
        }

        if (listaFinal.length === 0) {
            alert('Por favor, ingresa al menos el nombre de la propiedad antes de enviar.');
            return;
        }

        if (!listaFinal[0].id_agente) {
            alert('Por favor, selecciona un agente solicitante.');
            return;
        }

        setCargando(true);
        setProgresoEnvio({
            total: listaFinal.length,
            actual: 0,
            actualNombre: listaFinal[0].nombre_propiedad,
            exitosos: [],
            completado: false
        });

        try {
            const exitosos = [];

            for (let i = 0; i < listaFinal.length; i++) {
                const req = listaFinal[i];
                setProgresoEnvio({
                    total: listaFinal.length,
                    actual: i + 1,
                    actualNombre: req.nombre_propiedad,
                    exitosos: [...exitosos],
                    completado: false
                });

                const respuesta = await crearRequerimiento(req);
                exitosos.push({
                    nombre: req.nombre_propiedad,
                    id: respuesta.id_requerimiento
                });
            }

            setProgresoEnvio({
                total: listaFinal.length,
                actual: listaFinal.length,
                actualNombre: '¡Finalizado!',
                exitosos,
                completado: true
            });

            // Redirección con breve pausa para mostrar el éxito
            setTimeout(() => {
                window.location.href = '/agente/dashboard';
            }, 1600);

        } catch (error) {
            console.error('Error al guardar requerimientos:', error);
            alert(`Error al guardar: ${error.message}`);
            setCargando(false);
            setProgresoEnvio(null);
        }
    };

    // Cálculo del total para el botón principal
    const totalRequerimientos =
        editandoIndex !== null
            ? requerimientosLista.length
            : requerimientosLista.length + (formData.nombre_propiedad?.trim() ? 1 : 0);

    return (
        <div className="w-full">
            <FormularioPropiedadUI
                datos={formData}
                alCambiarDato={manejarCambioDato}
                alCambiarCheckbox={manejarCambioCheckbox}
                alEnviar={manejarEnvio}
                cargando={cargando}
                agentes={agentes}
                requerimientosLista={requerimientosLista}
                editandoIndex={editandoIndex}
                alAnadirRequerimiento={manejarAnadirRequerimiento}
                alSeleccionarBurbuja={manejarSeleccionarBurbuja}
                alEliminarBurbuja={manejarEliminarBurbuja}
                alCancelarEdicion={manejarCancelarEdicion}
                isCollapsing={isCollapsing}
                formAnimKey={formAnimKey}
                toastMensaje={toastMensaje}
                progresoEnvio={progresoEnvio}
                totalRequerimientos={totalRequerimientos}
            />
        </div>
    );
}