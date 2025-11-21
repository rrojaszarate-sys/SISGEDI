import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Spinner } from '@nextui-org/react';

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
