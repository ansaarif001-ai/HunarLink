import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { t } from '../../i18n';
import { LanguageCode } from '../../types';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

function getPreferredLang(): LanguageCode {
  if (typeof document !== 'undefined' && document.documentElement.lang === 'ur') {
    return 'ur';
  }
  return 'en';
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || '',
    };
  }

  render() {
    if (this.state.hasError) {
      const lang = getPreferredLang();
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
          <div className="w-full max-w-md rounded-xl border border-[#E3EAF3] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#D64545]">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-[#102A43]">
              {t('error.title', lang)}
            </h1>
            <p className="mt-2 text-base text-[#62748A]">
              {this.state.message || t('error.defaultMsg', lang)}
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                variant="primary"
                onClick={() => {
                  this.setState({ hasError: false, message: '' });
                  window.location.href = '/';
                }}
              >
                <Home className="h-5 w-5" aria-hidden="true" />
                <span>{t('error.goHome', lang)}</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
