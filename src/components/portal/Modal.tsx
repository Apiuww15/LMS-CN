"use client";
import { ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, description, children, wide = false }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-card ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="modal-head">
          <div><div className="eyebrow">EduCN</div><h3>{title}</h3>{description && <p>{description}</p>}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
