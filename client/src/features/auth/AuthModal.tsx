import { useState } from 'react';
import { IconX } from '../../components/layout/icons';
import { useAuth } from '../../app/providers';
import RegisterStudentForm from './RegisterStudentForm';
import RegisterTeacherForm from './RegisterTeacherForm';
import LoginForm from './LoginForm';
import SuccessModal from './SuccessModal';

const MODAL_CONFIG = {
  student: { title: 'Реєстрація учня',  subtitle: 'Заповніть форму, щоб розпочати навчання на LearnNYX' },
  teacher: { title: 'Стати викладачем', subtitle: 'Заповніть анкету, щоб приєднатися до нашої команди' },
  login:   { title: 'Вхід до системи', subtitle: '' },
} as const;

export default function AuthModal() {
  const { modal, closeModal } = useAuth();
  const [success, setSuccess] = useState(false);

  if (!modal) return null;

  const config = MODAL_CONFIG[modal];

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSuccess(false);
      closeModal();
    }
  };

  const handleClose = () => {
    setSuccess(false);
    closeModal();
  };

  if (success) {
    return <SuccessModal onClose={handleClose} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-2">
          <div>
            <h2 id="auth-modal-title" className="font-poppins font-bold text-xl text-slate-900">
              {config.title}
            </h2>
            {config.subtitle && (
              <p className="font-inter text-sm text-[#565d6d] mt-0.5">
                {config.subtitle}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors mt-0.5 flex-shrink-0 text-[#9095a1]"
            aria-label="Закрити вікно"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-4">
          {modal === 'student' && <RegisterStudentForm onSuccess={() => setSuccess(true)} />}
          {modal === 'teacher' && <RegisterTeacherForm onSuccess={() => setSuccess(true)} />}
          {modal === 'login'   && <LoginForm onSuccess={handleClose} />}
        </div>
      </div>
    </div>
  );
}