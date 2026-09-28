import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Camera, Video, Film, Mic } from "lucide-react";

export interface ItemChecklist {
  id: string;
  label: string;
  desc?: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; color?: string }>;
  color: string;
  bgActive: string;
  borderActive: string;
  iconColorClass: string;
}

export const ITEMS_DEFECTO: ItemChecklist[] = [
  {
    id: "req_guion",
    label: "Guion",
    desc: "Narrativa",
    icon: FileText,
    color: "#2563eb",
    bgActive: "rgba(37, 99, 235, 0.08)",
    borderActive: "#3b82f6",
    iconColorClass: "text-blue-600",
  },
  {
    id: "req_fotos",
    label: "Fotos",
    desc: "Tomas fijas",
    icon: Camera,
    color: "#059669",
    bgActive: "rgba(16, 185, 129, 0.08)",
    borderActive: "#10b981",
    iconColorClass: "text-emerald-600",
  },
  {
    id: "req_grabacion",
    label: "Grabación",
    desc: "Rodaje",
    icon: Video,
    color: "#9333ea",
    bgActive: "rgba(147, 51, 234, 0.08)",
    borderActive: "#a855f7",
    iconColorClass: "text-purple-600",
  },
  {
    id: "req_edicion",
    label: "Edición",
    desc: "Montaje & color",
    icon: Film,
    color: "#4f46e5",
    bgActive: "rgba(79, 70, 229, 0.08)",
    borderActive: "#6366f1",
    iconColorClass: "text-indigo-600",
  },
  {
    id: "req_voz_off",
    label: "Voz en Off",
    desc: "Audio & locución",
    icon: Mic,
    color: "#ea580c",
    bgActive: "rgba(234, 88, 12, 0.08)",
    borderActive: "#f97316",
    iconColorClass: "text-amber-600",
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
  const activosCount = items.filter((item) => Boolean(valores[item.id])).length;

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Checklist de Requerimientos
        </span>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {activosCount} de {items.length} activos
        </span>
      </div>

      {/* Grid directo de 1 clic sin pasos extras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => {
          const marcado = Boolean(valores[item.id]);
          const Icono = item.icon;

          return (
            <motion.button
              key={item.id}
              type="button"
              disabled={deshabilitado}
              onClick={() => alCambiar(item.id, !marcado)}
              whileTap={deshabilitado ? undefined : { scale: 0.98 }}
              className={`relative flex items-center justify-between p-2.5 sm:px-3 sm:py-2.5 rounded-xl border transition-all select-none text-left ${
                marcado
                  ? "bg-blue-50/70 border-blue-500/70 ring-1 ring-blue-500/25 shadow-xs"
                  : "bg-surface-container-low/50 hover:bg-surface-container-low border-surface-container"
              } ${deshabilitado ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Icono + Etiqueta */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    marcado ? "bg-white shadow-xs" : "bg-surface-container"
                  }`}
                >
                  <Icono size={16} strokeWidth={2.2} className={item.iconColorClass} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate leading-tight">
                    {item.label}
                  </span>
                  {item.desc && (
                    <span className="text-[10px] text-slate-400 block truncate leading-tight mt-0.5">
                      {item.desc}
                    </span>
                  )}
                </div>
              </div>

              {/* Casilla de verificación con física Bencho */}
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ml-2 ${
                  marcado ? "bg-blue-600 shadow-xs" : "bg-surface-container-high border border-outline-variant/40"
                }`}
              >
                <AnimatePresence initial={false}>
                  {marcado && (
                    <motion.span
                      initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.3, opacity: 0, rotate: 15 }}
                      transition={{
                        type: "spring",
                        stiffness: 650,
                        damping: 26,
                        mass: 0.5,
                      }}
                      className="text-white flex items-center justify-center"
                    >
                      <Check size={13} strokeWidth={3.2} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}