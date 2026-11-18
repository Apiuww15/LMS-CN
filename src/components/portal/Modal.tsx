"use client";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, description, children, wide = false }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; wide?: boolean }) {
  // Keep dialogs attached to the viewport, outside animated/transformed page wrappers.
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-card ${wide ? "max-w-5xl" : "max-w-2xl"}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div><div className="eyebrow">EduCN</div><h3>{title}</h3>{description && <p>{description}</p>}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
