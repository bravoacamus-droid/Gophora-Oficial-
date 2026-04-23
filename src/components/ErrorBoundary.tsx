import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-heading font-bold">Algo salió mal</h1>
            <p className="text-sm text-muted-foreground font-body">
              Ocurrió un error inesperado. Intenta recargar la página o vuelve al inicio.
            </p>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-[10px] text-left bg-muted/50 p-3 rounded-lg overflow-auto max-h-40 font-mono">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={this.handleReload} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Recargar
            </Button>
            <Button variant="outline" onClick={this.handleGoHome}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
