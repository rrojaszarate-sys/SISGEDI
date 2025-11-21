import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Spinner, Card, CardBody, Button } from '@nextui-org/react';
import { isSupabaseConfigured } from './lib/supabase';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UnidadesAdminPage from './pages/catalogos/UnidadesAdminPage';
import RolesPage from './pages/catalogos/RolesPage';
import CatalogosPage from './pages/catalogos/CatalogosPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import DocumentosEntrantesPage from './pages/documentos/DocumentosEntrantesPage';
import NuevoDocumentoPage from './pages/documentos/NuevoDocumentoPage';
import DetalleDocumentoPage from './pages/documentos/DetalleDocumentoPage';
import TurnadoPage from './pages/turnado/TurnadoPage';
import BandejaTurnadosPage from './pages/turnado/BandejaTurnadosPage';
import DocumentosSalientesPage from './pages/salientes/DocumentosSalientesPage';
import NuevoSalientePage from './pages/salientes/NuevoSalientePage';
import InventarioPage from './pages/inventario/InventarioPage';
import BusquedaPage from './pages/reportes/BusquedaPage';

// Componente de ruta protegida
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Cargando..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { loading } = useAuth();

  // Mostrar error si Supabase no esta configurado
  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-lg mx-4">
          <CardBody className="text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              SISGEDI - Configuracion Requerida
            </h1>
            <p className="text-gray-600 mb-4">
              Las variables de entorno de Supabase no estan configuradas.
            </p>
            <div className="bg-gray-100 rounded-lg p-4 text-left text-sm mb-4">
              <p className="font-mono text-gray-700 mb-2">
                <strong>En Vercel, agrega estas variables:</strong>
              </p>
              <p className="font-mono text-blue-600">VITE_SUPABASE_URL</p>
              <p className="font-mono text-blue-600">VITE_SUPABASE_ANON_KEY</p>
            </div>
            <p className="text-sm text-gray-500">
              Encuentra estos valores en tu dashboard de Supabase → Settings → API
            </p>
            <Button
              color="primary"
              className="mt-4"
              onPress={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              Ir a Supabase Dashboard
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600">Cargando SISGEDI...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Catálogos */}
        <Route path="catalogos">
          <Route path="unidades" element={<UnidadesAdminPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="valores" element={<CatalogosPage />} />
        </Route>

        {/* Usuarios */}
        <Route path="usuarios" element={<UsuariosPage />} />

        {/* Documentos Entrantes */}
        <Route path="documentos">
          <Route index element={<DocumentosEntrantesPage />} />
          <Route path="nuevo" element={<NuevoDocumentoPage />} />
          <Route path=":id" element={<DetalleDocumentoPage />} />
        </Route>

        {/* Turnado */}
        <Route path="turnado">
          <Route index element={<BandejaTurnadosPage />} />
          <Route path="nuevo/:docId" element={<TurnadoPage />} />
        </Route>

        {/* Documentos Salientes */}
        <Route path="salientes">
          <Route index element={<DocumentosSalientesPage />} />
          <Route path="nuevo" element={<NuevoSalientePage />} />
        </Route>

        {/* Inventario */}
        <Route path="inventario" element={<InventarioPage />} />

        {/* Búsqueda y Reportes */}
        <Route path="busqueda" element={<BusquedaPage />} />
      </Route>

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
