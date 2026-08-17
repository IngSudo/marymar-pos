import { X } from 'lucide-react';
import './Modal.scss';

export default function Modal({ titulo, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{titulo}</h2>
          <button className="modal__cerrar" onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
