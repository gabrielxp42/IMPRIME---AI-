import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {

        if (this.state.hasError) {
            // Log moved to componentDidCatch to avoid render side-effects
            return (
                <div style={{
                    padding: '20px',
                    backgroundColor: '#ff0000',
                    color: '#ffffff',
                    height: '100vh',
                    width: '100vw',
                    overflow: 'auto',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 99999
                }}>
                    <h2>💥 Ocorreu um erro crítico de renderização</h2>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                    >
                        🔄 Recarregar Aplicação
                    </button>
                    <details open style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: '#330000', padding: '10px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>Saiba mais</summary>
                        <div style={{ marginTop: '10px' }}>
                            <strong>Erro:</strong><br />
                            {this.state.error && this.state.error.toString()}
                            <br /><br />
                            <strong>Stack Trace:</strong><br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
