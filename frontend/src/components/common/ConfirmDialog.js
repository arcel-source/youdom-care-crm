import React from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import Modal from './Modal';
import Button from '../ui/Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer l\'action',
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
}) {
  const icons = {
    danger: <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
      <Trash2 size={22} className="text-red-600" />
    </div>,
    warning: <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
      <AlertTriangle size={22} className="text-amber-600" />
    </div>,
    info: <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
      <Info size={22} className="text-blue-600" />
    </div>,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        {icons[variant] || icons.warning}
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
