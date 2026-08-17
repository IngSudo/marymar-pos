import Modal from '../Modal/Modal';
import './ConfirmModal.scss';

export default function ConfirmModal({ titulo, mensaje, onConfirmar, onCancelar, peligroso = true }) {
  return (
    <Modal titulo={titulo} onClose={onCancelar}>
      <div className="confirm-modal">
        <p>{mensaje}</p>
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