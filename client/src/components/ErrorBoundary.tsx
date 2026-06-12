import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f4f4f6] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="font-inter font-bold text-[#171a1f] text-xl mb-2">Щось пішло не так</h2>
            <p className="font-inter text-[#9095a1] text-sm mb-6">
              Виникла неочікувана помилка. Спробуйте оновити сторінку.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1f8cf9] text-white font-inter font-semibold text-sm px-6 py-3 rounded-2xl hover:bg-blue-600"
            >
              Оновити сторінку
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
