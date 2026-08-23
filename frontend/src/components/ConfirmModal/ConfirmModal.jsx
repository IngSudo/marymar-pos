import { AlertTriangle, HelpCircle } from 'lucide-react';
import Modal from '../modal/Modal';
import './ConfirmModal.scss';

export default function ConfirmModal({ titulo, mensaje, nota, onConfirmar, onCancelar, peligroso = true }) {
  return (
    <Modal titulo={titulo} onClose={onCancelar}>
      <div className="confirm-modal">
        <div className={`confirm-modal__icono ${peligroso ? 'confirm-modal__icono--peligro' : ''}`}>
          {peligroso ? <AlertTriangle size={20} strokeWidth={2} /> : <HelpCircle size={20} strokeWidth={2} />}
        </div>
        <p>{mensaje}</p>
        {nota && <p className="confirm-modal__nota">{nota}</p>}
        <div className="confirm-modal__acciones">
          <button className="confirm-modal__cancelar" onClick={onCancelar}>Cancelar</button>
          <button
            className={`confirm-modal__confirmar ${peligroso ? 'confirm-modal__confirmar--peligro' : ''}`}
            onClick={onConfirmar}
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
}
