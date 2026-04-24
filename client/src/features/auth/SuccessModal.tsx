import { IconCheckCircle } from '../../components/layout/icons';

interface SuccessModalProps {
  onClose: () => void;
 feat/frontend-foundation
  message?: string;
}

export default function SuccessModal({ onClose, message }: SuccessModalProps) {

}

export default function SuccessModal({ onClose }: SuccessModalProps) {
 develop
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
 feat/frontend-foundation
      aria-label="Операція успішна"

      aria-label="Заявка відправлена"
 develop
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1f8cf9]">
          <IconCheckCircle className="w-9 h-9" />
        </div>
 feat/frontend-foundation
        <h2 className="font-poppins font-bold text-xl text-slate-900">Готово!</h2>
        <p className="font-inter text-sm text-[#565d6d] text-center">
          {message ?? 'Ваша заявка успішно відправлена менеджеру'}
        </p>
        <button onClick={onClose} className="btn-primary">OK</button>

        <h2 className="font-poppins font-bold text-xl text-slate-900">
          Готово!
        </h2>
        <p className="font-inter text-sm text-[#565d6d] text-center">
          Ваша заявка успішно відправлена менеджеру
        </p>
        <button onClick={onClose} className="btn-primary">
          OK
        </button>
 develop
      </div>
    </div>
  );
}