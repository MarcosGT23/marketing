import { supabaseServer } from './supabaseServer';

// Respuesta JSON uniforme (incluye errores) para que el cliente nunca reciba HTML.
export function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

/**
 * Actualiza una tarea por id_tarea o id_requerimiento y la crea si aún no existe.
 * Sin SELECT previo: en el caso normal (la tarea ya existe) es una sola escritura.
 */
export async function guardarTarea({
  tabla,
  idTarea,
  idRequerimiento,
  campos,
  valoresIniciales = {},
  columnas = '*'
}) {
  const camposValidos = Object.fromEntries(
    Object.entries(campos || {}).filter(([, valor]) => valor !== undefined)
  );

  if (Object.keys(camposValidos).length === 0) {
    return { data: null, sinCambios: true };
  }

  if (idTarea) {
    const { data, error } = await supabaseServer
      .from(tabla)
      .update(camposValidos)
      .eq('id_tarea', idTarea)
      .select(columnas);

    if (error) return { error };
    if (data?.length) return { data: data[0] };
  }

  if (!idRequerimiento) return { data: null, noEncontrada: true };

  const { data: porRequerimiento, error: errorRequerimiento } = await supabaseServer
    .from(tabla)
    .update(camposValidos)
    .eq('id_requerimiento', idRequerimiento)
    .select(columnas);

  if (errorRequerimiento) return { error: errorRequerimiento };
  if (porRequerimiento?.length) return { data: porRequerimiento[0] };

  const { data: creada, error: errorInsercion } = await supabaseServer
    .from(tabla)
    .insert([{ id_requerimiento: idRequerimiento, ...valoresIniciales, ...camposValidos }])
    .select(columnas)
    .single();

  if (!errorInsercion) return { data: creada };

  // Otra petición creó la tarea entre el update y el insert: reintentar el update.
  if (errorInsercion.code === '23505') {
    const { data: reintento, error: errorReintento } = await supabaseServer
      .from(tabla)
      .update(camposValidos)
      .eq('id_requerimiento', idRequerimiento)
      .select(columnas)
      .single();

    if (errorReintento) return { error: errorReintento };
    return { data: reintento };
  }

  return { error: errorInsercion };
}

/**
 * Registra la bitácora sin bloquear la respuesta si la tabla está lenta.
 */
export async function registrarHistorial(registro, timeoutMs = 1500) {
  try {
    const insercion = supabaseServer.from('historial_seguimiento').insert(registro);
    const resultado = await Promise.race([
      insercion,
      new Promise((resolve) => setTimeout(resolve, timeoutMs))
    ]);

    if (resultado?.error) {
      console.warn('[historial_seguimiento] No se registró la bitácora:', resultado.error.message);
    }
  } catch (err) {
    console.warn('[historial_seguimiento] No se registró la bitácora:', err?.message || err);
  }
}

export function estadoValido(estado, permitidos) {
  return estado === undefined || permitidos.includes(estado);
}
