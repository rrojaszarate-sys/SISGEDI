import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { DEV_MODE } from '../lib/supabase';

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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log detallado en modo desarrollo
    if (DEV_MODE) {
      console.error('');
      console.error('==========================================');
      console.error('SISGEDI DEV - ERROR CAPTURADO');
      console.error('==========================================');
      console.error('Mensaje:', error.message);
      console.error('Nombre:', error.name);
      console.error('Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('==========================================');
      console.error('');
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-guinda-50 via-white to-guinda-100 p-4">
          <Card className="max-w-2xl w-full border border-guinda-200 shadow-xl">
            <CardBody className="p-8">
              <div className="text-center mb-6">
                <div className="bg-guinda-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">💥</span>
                </div>
                <h1 className="text-2xl font-bold text-guinda-800 mb-2">
                  Error en la Aplicacion
                </h1>
                <p className="text-guinda-600">
                  Ha ocurrido un error inesperado. Por favor intenta recargar la pagina.
                </p>
              </div>

              {/* Detalles del error en modo desarrollo */}
              {DEV_MODE && this.state.error && (
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-6 overflow-auto max-h-64 font-mono text-xs">
                  <p className="text-red-400 font-bold mb-2">
                    === MODO DESARROLLO - DETALLES DEL ERROR ===
                  </p>
                  <p className="text-yellow-400">Mensaje: {this.state.error.message}</p>
                  <p className="text-yellow-400">Tipo: {this.state.error.name}</p>
                  {this.state.error.stack && (
                    <>
                      <p className="text-gray-400 mt-2">Stack Trace:</p>
                      <pre className="text-green-300 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <p className="text-gray-400 mt-2">Component Stack:</p>
                      <pre className="text-blue-300 whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  color="primary"
                  className="bg-guinda-700 hover:bg-guinda-800"
                  onPress={this.handleReload}
                >
                  Recargar Pagina
                </Button>
                <Button
                  variant="bordered"
                  className="border-guinda-300 text-guinda-700"
                  onPress={this.handleGoHome}
                >
                  Ir al Inicio
                </Button>
              </div>

              {DEV_MODE && (
                <p className="text-center text-xs text-gray-500 mt-4">
                  Revisa la consola del navegador (F12) para mas detalles
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
