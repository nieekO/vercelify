import { useState, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-950 border border-[rgba(255,255,255,0.08)] rounded-[8px] p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
  loading?: boolean;
}

export function ConfirmDeleteModal({ open, onClose, onConfirm, projectName, loading }: ConfirmDeleteModalProps) {
  const [input, setInput] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Delete Project">
      <p className="text-sm text-gray-400 mb-4">
        This action is irreversible. Type <span className="text-white font-mono">{projectName}</span> to confirm.
      </p>
      <input
        className="w-full bg-gray-900 border border-[rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
        placeholder={projectName}
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          disabled={input !== projectName}
          loading={loading}
          onClick={onConfirm}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}
