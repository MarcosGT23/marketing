# Revisión funcional — 3 de noviembre de 2026

La revisión se realizó sobre el código local. Se consultaron los datos conectados en modo lectura; las pruebas de escritura y eliminación utilizaron una base simulada aislada de Supabase. No se publicó un despliegue.

## Cobertura

| Apartado | Comprobaciones |
| --- | --- |
| Dashboard | Carga, períodos y comparación mensual, paginación, volumen y demanda, filtros mediante pruebas automatizadas y exportación Excel desde la interfaz. |
| Nuevo requerimiento | Carga de agentes y formulario, agregado y reapertura de un borrador local; creación y distribución de tareas mediante pruebas de API simuladas. |
| Requerimientos | Directorio, vista global, filtro de noviembre, acceso a edición y exportación Excel. |
| Diseño | Directorio y tareas, apertura y cancelación de tarea interna, controles de avance y exportación Excel; guardados y errores mediante pruebas simuladas. |
| Video | Directorio, producciones, controles de checklist y exportación Excel; guardados, descripciones y cambios parciales mediante pruebas simuladas. |
| Pauta Digital y Meta Ads | 23 requerimientos de noviembre, cambio a octubre, 63 reportes CSV de octubre, desglose de anuncios, formulario de edición y exportación Excel; retiro, reactivación e importación mediante pruebas simuladas. |

También se comprobaron respuestas HTTP correctas para las seis páginas principales y los endpoints de requerimientos, usuarios, períodos, historial, requerimientos de CM, reportes y anuncios.

## Correcciones

- Visibilidad de requerimientos pendientes de configurar en CM y consistencia del formulario de edición al habilitar o retirar pauta.
- Relación explícita de reportes en el endpoint de CM, que anteriormente devolvía un error por relaciones ambiguas.
- Lectura de reportes con ordenación por fecha e ID, mostrando los errores de consulta en lugar de devolver un reporte vacío como si hubiera funcionado.
- Inclusión de la descripción de video en la consulta general para conservarla al recargar y guardar.
- Ediciones parciales de video que conservan los otros checks; creación de tareas solicitadas sin exigir que esté marcado Reel.
- Conservación de la fecha límite de diseño cuando la edición no envía una fecha nueva.
- Reactivación de pautas retiradas y conservación de presupuesto y moneda en ediciones parciales.
- Confirmaciones de tarea interna de Diseño basadas en la respuesta del servidor y avisos de fallo de autoguardado.
- Reintentos de envíos múltiples que conservan solo los pendientes y reversión de solicitudes nuevas si falla la creación de sus tareas.
- Reportes anteriores conservados hasta guardar el nuevo reporte y sus anuncios, junto con soporte de presupuesto cero.
- Conteo de campañas activadas desde `estado_general` y requerimientos sin tareas clasificados como pendientes.
- Restauración de meses, años y rangos de días en el selector de pauta; los rangos nuevos incluyen el año.
- Directorio del listado general filtrado por período y categoría, y categorías disponibles al editar consistentes con el formulario de alta.
- Errores de carga visibles en Diseño y Requerimientos, conservando la lista anterior ante una consulta fallida.

## Validación

- `npm test`: 56 pruebas aprobadas.
- `npm run build`: compilación completada.
- `git diff --check`: sin errores de espacios.
- Cinco exportaciones Excel ejecutadas desde la interfaz: Dashboard, Requerimientos, Diseño, Video y CM, todas con confirmación de generación.
- Las consultas de comprobación devolvieron 147 requerimientos totales, 23 de noviembre y 63 reportes CSV.

## Alcance de la verificación

Los guardados y eliminaciones se comprobaron con datos simulados, incluyendo fallos del servidor. No se ejecutó un ciclo de escritura y eliminación sobre registros reales ni se verificó el despliegue publicado. Las operaciones que escriben en varias tablas siguen dependiendo de varias consultas a la base de datos; estas pruebas no equivalen a una transacción de PostgreSQL.

Soporte y Guías de Marca quedaron fuera de alcance por indicación del usuario.
