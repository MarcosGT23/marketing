# Solicitud y avance audiovisual

Los campos `req_guion`, `req_fotos`, `req_grabacion`, `req_edicion` y `req_voz_off` representan las opciones pedidas por el agente. Se crean y editan desde el requerimiento y se muestran como información de solo lectura en las tarjetas.

El checklist de producción usa `actividades_completadas`, con las mismas claves, de forma independiente. Marcar un pendiente modifica el avance, su porcentaje y el estado, sin cambiar lo solicitado.

## Persistencia compatible

En Supabase, `tareas_video.Descripcion` es una fecha. Al guardar observaciones o avance, la API añade a `historial_seguimiento` un registro de Video con el estado, porcentaje, checklist y observaciones. El último registro de avance se usa para mostrar la tarea, y la API de bitácora presenta su comentario legible. Así, el panel guarda el avance completo en una sola escritura y conserva el campo de fecha y las opciones solicitadas.

Una tarea anterior sin avance separado comienza con las actividades pendientes. Si su estado ya era `Finalizado`, se conserva como completada. No se reescriben masivamente tareas existentes ni se intenta reconstruir solicitudes históricas que se hubieran alterado antes de esta separación.

`PATCH /api/tareas/video` ya no modifica las opciones solicitadas, aunque un cliente anterior envíe esas claves. Su edición corresponde a `PUT /api/requerimientos`. La descripción y el avance se conservan al editar cualquiera de ellos por separado.

## Información en tarjetas

Requerimientos, Diseño, Video y CM comparten la sección de opciones solicitadas e información adicional. Cada texto largo o con saltos de línea tiene un control accesible para mostrar toda su información y volver a contraerla. Este control también aparece si no hay descripción y solo existen notas, público objetivo u otros datos adicionales.
