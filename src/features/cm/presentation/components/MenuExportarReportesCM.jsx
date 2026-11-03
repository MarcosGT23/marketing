import MenuExportarExcel from '../../../../core/ui/MenuExportarExcel';
import { exportarReportesCmExcel } from '../../utils/cmExcelMapper';

export default function MenuExportarReportesCM({ reportes = [], tareas = [], periodoInicial }) {
  return <MenuExportarExcel
    registros={reportes}
    periodosReferencia={tareas}
    periodoInicial={periodoInicial}
    conAgentes
    colorTema="primary"
    descripcion="Elige el mes, el agente y la campaña para exportar las métricas del CSV."
    alExportar={exportarReportesCmExcel}
  />;
}
