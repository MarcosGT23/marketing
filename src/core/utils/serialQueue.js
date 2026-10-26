// Cola de guardado por requerimiento: una escritura en vuelo a la vez y
// coalescencia de cambios rápidos (gana el último estado).
const colas = new Map();
const esperadores = new Map();

function obtenerEstado(clave) {
  let estado = colas.get(clave);
  if (!estado) {
    estado = {
      enVuelo: false,
      pendiente: null,
      ultimaActividad: 0,
      promesa: null
    };
    colas.set(clave, estado);
  }
  return estado;
}

async function procesar(clave) {
  const estado = obtenerEstado(clave);
  estado.enVuelo = true;

  try {
    while (estado.pendiente) {
      const carga = estado.pendiente;
      estado.pendiente = null;

      try {
        await carga();
      } catch (err) {
        console.error(`[serialQueue:${clave}] Error guardando:`, err);
        estado.ultimoError = err;
      }

      estado.ultimaActividad = Date.now();
    }
  } finally {
    estado.enVuelo = false;
    estado.promesa = null;

    const pendientesEspera = esperadores.get(clave);
    if (pendientesEspera) {
      pendientesEspera.forEach((resolver) => resolver());
      esperadores.delete(clave);
    }
  }
}

export function encolar(clave, carga) {
  const estado = obtenerEstado(clave);
  estado.pendiente = carga;
  estado.ultimaActividad = Date.now();

  if (!estado.enVuelo) {
    estado.promesa = procesar(clave);
  }

  return estado.promesa;
}

export function tienePendientes(clave) {
  const estado = colas.get(clave);
  return Boolean(estado && (estado.enVuelo || estado.pendiente));
}

export function estaReciente(clave, ventanaMs = 2000) {
  const estado = colas.get(clave);
  return Boolean(estado && Date.now() - estado.ultimaActividad < ventanaMs);
}

export function debePreservar(clave, ventanaMs = 2000) {
  return tienePendientes(clave) || estaReciente(clave, ventanaMs);
}

export function esperarCola(clave) {
  const estado = colas.get(clave);
  if (!estado || (!estado.enVuelo && !estado.pendiente)) {
    return Promise.resolve();
  }

  return new Promise((resolver) => {
    if (!esperadores.has(clave)) esperadores.set(clave, new Set());
    esperadores.get(clave).add(resolver);
  });
}
