import { Button, Modal } from '../../components/ui';

export interface CancelOfferModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelOfferModal({
  open,
  loading,
  onClose,
  onConfirm,
}: CancelOfferModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancelar oferta"
      description="Al cancelar la oferta se rechazarán automáticamente sus propuestas pendientes."
      footer={
        <>
          <Button variant="ghost" disabled={loading} onClick={onClose}>
            Volver
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            Confirmar cancelación
          </Button>
        </>
      }
    >
      <p>Esta acción no se puede deshacer.</p>
    </Modal>
  );
}
