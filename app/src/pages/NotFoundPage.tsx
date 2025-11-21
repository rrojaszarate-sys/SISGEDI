import { Card, CardBody, Button } from '@nextui-org/react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { DEV_MODE } from '../lib/supabase';

export default function NotFoundPage() {
  const navigate = useNavigate();

  // Log en desarrollo
  if (DEV_MODE) {
    console.warn('');
    console.warn('==========================================');
    console.warn('SISGEDI DEV - PAGINA NO ENCONTRADA (404)');
    console.warn('==========================================');
    console.warn('URL actual:', window.location.href);
    console.warn('Pathname:', window.location.pathname);
    console.warn('==========================================');
    console.warn('');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-guinda-50 via-white to-guinda-100 p-4">
      <Card className="max-w-md w-full border border-guinda-200 shadow-xl">
        <CardBody className="text-center p-8">
          <div className="bg-guinda-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🔍</span>
          </div>

          <h1 className="text-6xl font-bold text-guinda-700 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-guinda-800 mb-4">
            Pagina No Encontrada
          </h2>
          <p className="text-guinda-600 mb-6">
            La pagina que buscas no existe o ha sido movida.
          </p>

          {DEV_MODE && (
            <div className="bg-gray-900 text-green-400 rounded-lg p-3 mb-6 font-mono text-xs text-left">
              <p className="text-yellow-400">DEV MODE - Info:</p>
              <p>URL: {window.location.href}</p>
              <p>Path: {window.location.pathname}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button
              color="primary"
              className="bg-guinda-700 hover:bg-guinda-800"
              startContent={<Home size={18} />}
              onPress={() => navigate('/')}
            >
              Ir al Inicio
            </Button>
            <Button
              variant="bordered"
              className="border-guinda-300 text-guinda-700"
              startContent={<ArrowLeft size={18} />}
              onPress={() => navigate(-1)}
            >
              Volver
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
