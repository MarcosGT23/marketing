import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Camera, Video, Film, Mic } from "lucide-react";

export interface ItemChecklist {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    color: string; // Color para el icono
}

// Lista canónica de los 5 requerimientos audiovisuales
export const ITEMS_DEFECTO: ItemChecklist[] = [
    { id: "req_guion", label: "Guion", icon: FileText, color: "text-blue-600" },
    { id: "req_fotos", label: "Fotos", icon: Camera, color: "text-emerald-600" },
    { id: "req_grabacion", label: "Grabación", icon: Video, color: "text-purple-600" },
    { id: "req_edicion", label: "Edición", icon: Film, color: "text-indigo-600" },
    { id: "req_voz_off", label: "Voz en Off", icon: Mic, color: "text-slate-500" },
];

interface Props {
    valores: Record<string, boolean>;
    alCambiar: (id: string, activo: boolean) => void;
    items?: ItemChecklist[];
    deshabilitado?: boolean;
}

export function ChecklistRequerimientos({
    valores,
    alCambiar,
    items = ITEMS_DEFECTO,
    deshabilitado = false,
}: Props) {
    return (
        <div className="w-full space-y-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Checklist de Requerimientos
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((item) => {
                    const marcado = Boolean(valores[item.id]);
                    const Icono = item.icon;

                    return (
                        <motion.button
                            key={item.id}
                            type="button"
                            disabled={deshabilitado}
                            onClick={() => alCambiar(item.id, !marcado)}
                            whileTap={{ scale: 0.98 }}
                            className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors select-none text-left ${marcado
                                    ? "bg-blue-50/60 border-blue-500 ring-1 ring-blue-500/20"
                                    : "bg-blue-50/30 hover:bg-blue-50/50 border-blue-100/60"
                                } ${deshabilitado ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                            {/* Icono + Etiqueta */}
                            <div className="flex items-center gap-2.5">
                                <Icono size={18} strokeWidth={2.2} className={item.color} />
                                <span className="text-xs font-semibold text-slate-700">
                                    {item.label}
                                </span>
                            </div>

                            {/* Casilla de verificación con física Bencho */}
                            <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${marcado ? "bg-blue-600" : "bg-blue-100/50"
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
                                            className="text-white"
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