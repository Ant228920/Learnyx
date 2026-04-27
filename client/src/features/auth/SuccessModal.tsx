import { IconCheckCircle } from '../../components/layout/icons';

interface SuccessModalProps {
  onClose: () => void;
  message?: string;
}

export default function SuccessModal({ onClose, message }: SuccessModalProps) {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Операція успішна"
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
          <IconCheckCircle className="w-9 h-9" />
        </div>
        <h2 className="font-poppins font-bold text-xl text-slate-900">Готово!</h2>
        <p className="font-inter text-sm text-[#565d6d] text-center">
          {message ?? 'Ваша заявка успішно відправлена менеджеру'}
        </p>
        <button onClick={onClose} className="btn-primary">OK</button>
      </div>
    </div>
  );
}