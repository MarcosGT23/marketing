# Calendario de producción y Google Sheets

La sección está en `/equipo/calendario`. La API del panel es `/api/events.json`. El navegador consulta al panel, y el servidor conecta con Google Apps Script usando variables privadas.

## Preparar la hoja

El archivo compartido es [Plan de contenido Julio 2026.xlsx](https://docs.google.com/spreadsheets/d/1vYr3FGQCPqwPscycq2ypRTzoBiXF1wCC/edit). En Google Sheets, abre **Archivo → Guardar como Hojas de cálculo de Google**. Usa el ID de la hoja convertida que aparece entre `/d/` y `/edit` en su nueva dirección.

El calendario usa una pestaña nueva llamada `Eventos`. Las pestañas del plan de contenido conservan su estructura. Los eventos del calendario visual antiguo requieren una importación aparte si se quieren trasladar.

## Publicar Apps Script

1. En la hoja convertida abre **Extensiones → Apps Script**.
2. Copia el contenido completo de `integrations/google-apps-script/Calendario.gs` al editor y guarda.
3. En **Configuración del proyecto → Propiedades del script**, añade `SPREADSHEET_ID` con el ID de la hoja convertida y `CALENDAR_TOKEN` con una clave aleatoria larga de uso exclusivo para esta conexión. Puedes generar una con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. Selecciona y ejecuta `prepararCalendario`. Autoriza el acceso a la hoja. Esto crea la pestaña `Eventos` y sus columnas si aún no existe. Si ya tiene columnas diferentes, el script pide revisarlas.
5. Publica con **Implementar → Nueva implementación → Aplicación web**, ejecutada como el propietario y accesible para **Cualquier persona**. La clave del paso anterior se verifica en cada petición de lectura o escritura. La hoja puede conservar sus permisos privados.
6. Copia la URL de implementación terminada en `/exec`.

Las aplicaciones web de Apps Script reciben peticiones en `doGet` y `doPost`. La implementación determina con qué usuario se ejecutan. [Documentación de Google](https://developers.google.com/apps-script/guides/web)

## Conectar el panel

Añade estas variables privadas al archivo `.env` local y a las variables de Production de Vercel, y vuelve a publicar el panel.

```dotenv
GOOGLE_SHEETS_CALENDAR_URL=https://script.google.com/macros/s/ID_IMPLEMENTACION/exec
GOOGLE_SHEETS_CALENDAR_TOKEN=LA_MISMA_CLAVE_DE_CALENDAR_TOKEN
```

El panel muestra la conexión pendiente mientras falte esa configuración. La URL y la clave se usan exclusivamente en el servidor. Para actualizar el código de Apps Script, edita la implementación existente para que use la nueva versión.

## Estructura y reglas

La primera fila de `Eventos` contiene, en este orden, `id`, `title`, `agent`, `type`, `date`, `start`, `duration`, `exceptionReason`, `createdAt`. Las fechas se guardan como texto `AAAA-MM-DD`, y los horarios como horas numéricas. Por ejemplo, `9.5` representa las 09:30.

- Actividades de grabación/dron, pauteo y edición, de lunes a sábado y entre 07:00 y 19:00 de Bolivia.
- Lunes, miércoles y viernes se reservan para edición. Las demás actividades requieren un motivo que se guarda con el evento.
- Una misma persona no puede tener reservas que se superpongan. Otras personas pueden trabajar en paralelo. Los agentes provienen del panel y se incluye Equipo Interno.
- El servidor confirma cada alta o eliminación antes de reflejarla. Cada reserva conserva su identificador al reintentar, para evitar duplicados tras una respuesta interrumpida.
- Apps Script usa un bloqueo compartido al comprobar disponibilidad y guardar. [Documentación de LockService](https://developers.google.com/apps-script/reference/lock/lock-service)
- Los eventos se vuelven a consultar al sincronizar y cada 30 segundos mientras la pestaña está visible. Los cambios manuales en `Eventos` deben respetar sus columnas, tipos y reglas.

El calendario organiza reservas independientes. La creación de un requerimiento todavía se gestiona desde su formulario.
