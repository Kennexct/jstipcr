import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#163300] tracking-tight">Oops! Something broke.</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We're sorry, an unexpected error occurred. This is completely our fault. Refreshing the page usually fixes it!
              </p>
            </div>

            <Button 
              className="w-full rounded-2xl h-14 bg-[#163300] text-white hover:bg-[#1f4700] text-sm font-bold gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
            
            {/* Optional error details in dev */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-slate-100 p-4 rounded-xl overflow-x-auto mt-6">
                <p className="text-xs text-red-600 font-mono font-bold">{this.state.error.toString()}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
