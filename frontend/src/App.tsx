import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'
import LoginPage from '@/modules/auth/pages/LoginPage'
import DashboardPage from '@/modules/dashboard/pages/DashboardPage'
import MainLayout from '@/shared/components/layout/MainLayout'

function App() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Cargando SISGEDI 2.0...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        {/* Rutas protegidas */}
        <Route
          path="/*"
          element={
            user ? (
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  {/* Más rutas se agregarán aquí */}
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
