import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, FileText, Camera, Video, Film, Mic } from "lucide-react";
import "./ChecklistRequerimientos.css";

export interface ItemChecklist {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; color?: string }>;
  color: string;
  bg: string;
}

export const ITEMS_DEFECTO: ItemChecklist[] = [
  { id: "req_guion", name: "Guion", role: "Estructura y narrativa", icon: FileText, color: "#2563eb", bg: "rgba(37,99,235,0.12)" },
  { id: "req_fotos", name: "Fotos", role: "Tomas fijas de calidad", icon: Camera, color: "#059669", bg: "rgba(16,185,129,0.12)" },
  { id: "req_grabacion", name: "Grabación", role: "Rodaje audiovisual", icon: Video, color: "#9333ea", bg: "rgba(147,51,234,0.12)" },
  { id: "req_edicion", name: "Edición", role: "Montaje, ritmo y color", icon: Film, color: "#4f46e5", bg: "rgba(79,70,229,0.12)" },
  { id: "req_voz_off", name: "Voz en Off", role: "Locución y audio", icon: Mic, color: "#ea580c", bg: "rgba(234,88,12,0.12)" },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const FACE = 28;
const CORNER = 20;
const LAP = 10;

interface Props {
  valores: Record<string, boolean>;
  alCambiar: (id: string, activo: boolean) => void;
  items?: ItemChecklist[];
  deshabilitado?: boolean;
  corner?: number;
  overlap?: number;
}

export function ChecklistRequerimientos({
  valores = {},
  alCambiar,
  items = ITEMS_DEFECTO,
  deshabilitado = false,
  corner = CORNER,
  overlap = LAP,
}: Props) {
  const [open, setOpen] = useState(false);

  const picked = items.filter((it) => Boolean(valores[it.id])).map((it) => it.id);

  const r = clamp(corner, 0, 26);
  const lap = clamp(overlap, 0, 22);

  const rail = !picked.length ? 0 : FACE + (picked.length - 1) * (FACE - lap);

  const toggle = (id: string) => {
    if (deshabilitado) return;
    const actual = Boolean(valores[id]);
    alCambiar(id, !actual);
  };

  return (
    <div className="pik-container">
      <button
        type="button"
        disabled={deshabilitado}
        className="pik-pill"
        style={{ borderRadius: `${r}px` }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="pik-left">
          {picked.length > 0 && (
            <span className="pik-rail" style={{ width: `${rail}px` }}>
              <AnimatePresence initial={false}>
                {picked.map((id, i) => {
                  const item = items.find((it) => it.id === id);
                  if (!item) return null;
                  const Icon = item.icon;
                  const tx = i * (FACE - lap);

                  return (
                    <motion.span
                      key={id}
                      className="pik-face"
                      style={{
                        zIndex: items.length - i,
                        background: item.bg,
                        borderColor: "white",
                      }}
                      initial={{ scale: 0.2, opacity: 0, x: tx, y: -10, rotate: -22 }}
                      animate={{ scale: 1, opacity: 1, x: tx, y: 0, rotate: 0 }}
                      exit={{ scale: 0.2, opacity: 0, x: tx, y: -6, rotate: 14 }}
                      transition={{
                        type: "spring",
                        stiffness: 600,
                        damping: 21,
                        mass: 0.8,
                        x: { type: "spring", stiffness: 660, damping: 34, mass: 0.7 },
                        y: { type: "spring", stiffness: 660, damping: 34, mass: 0.7 },
                        scale: { type: "spring", stiffness: 660, damping: 34, mass: 0.7 },
                        opacity: { duration: 0.12 },
                      }}
                    >
                      <Icon size={14} color={item.color} strokeWidth={2.4} />
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </span>
          )}

          {picked.length === 0 ? (
            <span className="pik-say">Sin requerimientos asignados</span>
          ) : (
            <span className="pik-count">
              {picked.length} de {items.length} seleccionados
            </span>
          )}
        </div>

        <ChevronDown
          className={`pik-chev ${open ? "is-open" : ""}`}
          size={16}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="pik-card"
            style={{ borderRadius: `${r}px` }}
            initial={{ opacity: 0, y: -10, scaleX: 0.86, scaleY: 0.72 }}
            animate={{ opacity: 1, y: 0, scaleX: 1, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleX: 0.92, scaleY: 0.86 }}
            transition={{
              type: "spring",
              stiffness: 460,
              damping: 23,
              mass: 0.9,
              opacity: { duration: 0.12 },
            }}
          >
            {items.map((p, idx) => {
              const on = picked.includes(p.id);
              const Icon = p.icon;
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  disabled={deshabilitado}
                  className="pik-row"
                  data-on={on ? "true" : undefined}
                  onClick={() => toggle(p.id)}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 620,
                    damping: 34,
                    mass: 0.7,
                    delay: 0.03 * idx + 0.02,
                  }}
                >
                  <div className="pik-item-info">
                    <span className="pik-row-icon" style={{ background: p.bg }}>
                      <Icon size={16} color={p.color} strokeWidth={2.2} />
                    </span>
                    <span className="pik-who">
                      <span className="pik-name">{p.name}</span>
                      <span className="pik-role">{p.role}</span>
                    </span>
                  </div>

                  <span className="pik-mark">
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span
                          className="pik-tick"
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 600, damping: 28, mass: 0.6 }}
                        >
                          <Check size={13} strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}