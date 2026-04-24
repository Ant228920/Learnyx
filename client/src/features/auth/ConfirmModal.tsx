import { IconCheckCircle, IconX } from '../../components/layout/icons';
interface ConfirmModalProps {
  type: 'approve' | 'reject';
  applicantName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  type,
  applicantName,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const isApprove = type === 'approve';

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-fade-in p-8 flex flex-col items-center gap-4">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isApprove ? 'bg-blue-50 text-[#1f8cf9]' : 'bg-red-50 text-red-500'
          }`}
        >
          {isApprove ? (
            <IconCheckCircle className="w-9 h-9" />
          ) : (
            <IconX className="w-9 h-9" />
          )}
        </div>

        {/* Title */}
        <h2
          id="confirm-modal-title"
          className="font-poppins font-bold text-xl text-slate-900 text-center"
        >
          {isApprove ? 'Прийняти заявку?' : 'Відхилити заявку?'}
        </h2>

        {/* Description */}
        <p className="font-inter text-sm text-[#565d6d] text-center">
          {isApprove
            ? `Ви підтверджуєте прийняття заявки від ${applicantName}.`
            : `Ви підтверджуєте відхилення заявки від ${applicantName}.`}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 w-full mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-[#dee1e6] font-inter font-medium text-sm text-[#565d6d] hover:bg-gray-50 transition-colors"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-inter font-medium text-sm text-white transition-colors ${
              isApprove
                ? 'bg-[#1f8cf9] hover:bg-blue-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isApprove ? 'Прийняти' : 'Відхилити'}
          </button>
        </div>
      </div>
    </div>
  );
}