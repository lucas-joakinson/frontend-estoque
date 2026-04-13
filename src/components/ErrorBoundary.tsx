import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface border border-border-primary rounded-3xl p-8 text-center space-y-6 shadow-glow-purple/10">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-text-primary">Ops! Algo deu errado.</h1>
              <p className="text-text-secondary text-sm font-mono leading-relaxed">
                Ocorreu um erro inesperado na aplicação. Por favor, tente recarregar a página.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-hover-bg rounded-xl border border-border-primary text-left">
                <p className="text-[10px] font-mono text-text-secondary uppercase mb-1 tracking-widest">Detalhes técnicos:</p>
                <p className="text-xs font-mono text-red-400 break-all">{this.state.error.message}</p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-xl font-mono font-bold uppercase tracking-wider transition-all shadow-glow-purple"
            >
              <RefreshCcw size={18} />
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
