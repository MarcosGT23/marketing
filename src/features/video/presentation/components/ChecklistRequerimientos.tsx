import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Camera, Video, Film, Mic } from "lucide-react";

export interface ItemChecklist {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; color?: string }>;
  color: string;
  bgLight: string;
  borderLight: string;
}

export const ITEMS_DEFECTO: ItemChecklist[] = [
  {
    id: "req_guion",
    label: "Guion",
    desc: "Narrativa y estructura",
    icon: FileText,
    color: "#2563eb",
    bgLight: "rgba(37, 99, 235, 0.1)",
    borderLight: "rgba(37, 99, 235, 0.35)",
  },
  {
    id: "req_fotos",
    label: "Fotos",
    desc: "Tomas fijas de calidad",
    icon: Camera,
    color: "#059669",
    bgLight: "rgba(16, 185, 129, 0.1)",
    borderLight: "rgba(16, 185, 129, 0.35)",
  },
  {
    id: "req_grabacion",
    label: "Grabación",
    desc: "Rodaje audiovisual",
    icon: Video,
    color: "#9333ea",
    bgLight: "rgba(147, 51, 234, 0.1)",
    borderLight: "rgba(147, 51, 234, 0.35)",
  },
  {
    id: "req_edicion",
    label: "Edición",
    desc: "Montaje, ritmo y color",
    icon: Film,
    color: "#4f46e5",
    bgLight: "rgba(79, 70, 229, 0.1)",
    borderLight: "rgba(79, 70, 229, 0.35)",
  },
  {
    id: "req_voz_off",
    label: "Voz en Off",
    desc: "Locución y audio",
    icon: Mic,
    color: "#ea580c",
    bgLight: "rgba(234, 88, 12, 0.1)",
    borderLight: "rgba(234, 88, 12, 0.35)",
  },
];

interface Props {
  valores: Record<string, boolean>;
  alCambiar: (id: string, activo: boolean) => void;
  items?: ItemChecklist[];
  deshabilitado?: boolean;
}

export function ChecklistRequerimientos({
  valores = {},
  alCambiar,
  items = ITEMS_DEFECTO,
  deshabilitado = false,
}: Props) {
  // Separar completados y pendientes
  const completados = items.filter((item) => Boolean(valores[item.id]));
  const pendientes = items.filter((item) => !Boolean(valores[item.id]));

  return (
    <div className="w-full space-y-3">
      {/* ── SECCIÓN SUPERIOR: Burbujas de Actividades Realizadas ── */}
      <div className="rounded-2xl p-3 bg-surface-container-low/70 border border-surface-container transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Actividades Realizadas ({completados.length}/{items.length})
          </span>
          {completados.length > 0 && !deshabilitado && (
            <span className="text-[10px] text-slate-400">Clic en burbuja para desmarcar</span>
          )}
        </div>

        {/* Bandeja de burbujas flotantes con iconos */}
        <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
          <AnimatePresence mode="popLayout">
            {completados.map((item) => {
              const Icono = item.icon;
              return (
                <motion.button
                  key={item.id}
                  layout
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => alCambiar(item.id, false)}
                  initial={{ scale: 0.3, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.2, opacity: 0, y: 15 }}
                  whileHover={deshabilitado ? undefined : { scale: 1.05, y: -2 }}
                  whileTap={deshabilitado ? undefined : { scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className={`group flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full text-xs font-semibold shadow-xs border transition-all select-none ${
                    deshabilitado ? "cursor-default" : "cursor-pointer hover:shadow-md"
                  }`}
                  style={{
                    background: item.bgLight,
                    borderColor: item.borderLight,
                    color: item.color,
                  }}
                  title={deshabilitado ? item.label : `Desmarcar ${item.label}`}
                >
                  {/* Icono en círculo flotante */}
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ background: item.color }}
                  >
                    <Icono size={13} strokeWidth={2.6} />
                  </span>

                  <span className="font-semibold text-[12px]">{item.label}</span>

                  <Check size={13} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400 ml-0.5" />

                  {!deshabilitado && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-slate-400 hover:text-slate-600 font-bold ml-0.5">
                      ✕
                    </span>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>

          {completados.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-400 italic py-1"
            >
              Ninguna actividad completada todavía. Selecciona una opción abajo:
            </motion.p>
          )}
        </div>
      </div>

      {/* ── SECCIÓN INFERIOR: Opciones Pendientes para Marcar ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pendientes por Realizar ({pendientes.length})
          </span>
          {pendientes.length > 0 && !deshabilitado && (
            <span className="text-[10px] text-slate-400">Clic para completar actividad</span>
          )}
        </div>

        {/* Grid animado con framer-motion */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {pendientes.map((item) => {
              const Icono = item.icon;
              return (
                <motion.button
                  key={item.id}
                  layout
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => alCambiar(item.id, true)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.2, opacity: 0, y: -25, rotate: -8 }}
                  whileHover={deshabilitado ? undefined : { scale: 1.02, y: -1 }}
                  whileTap={deshabilitado ? undefined : { scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 520, damping: 28 }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border bg-surface-container-low/50 hover:bg-surface-container-low border-surface-container transition-colors text-left select-none ${
                    deshabilitado ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                      style={{ background: item.bgLight }}
                    >
                      <Icono size={16} strokeWidth={2.2} color={item.color} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  {/* Botón de acción rápida */}
                  <div className="w-5 h-5 rounded-md flex items-center justify-center border border-slate-300 dark:border-slate-600 bg-surface-container-high shrink-0 ml-2 group-hover:border-primary">
                    <span className="text-slate-400 text-xs font-bold leading-none">+</span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Mensaje de completitud cuando no quedan pendientes */}
        {pendientes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>¡Todas las actividades audiovisuales han sido completadas!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}