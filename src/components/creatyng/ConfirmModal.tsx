import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
}: ConfirmModalProps) {
  const isDanger = variant === 'danger';
  const Icon = isDanger ? AlertTriangle : HelpCircle;

  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isDanger ? 'bg-red-50' : 'bg-creatyng-accent-pale'
          }`}
        >
          <Icon
            className={`h-5 w-5 ${isDanger ? 'text-creatyng-error' : 'text-creatyng-accent'}`}
          />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#141417]">{title}</h3>
          {description && (
            <p className="text-sm text-[#8e8e96] leading-relaxed">{description}</p>
          )}
        </div>

        <div className="flex gap-2 w-full pt-1">
          <Button variant="ghost" size="md" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            size="md"
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
