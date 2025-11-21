import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Input,
  Button,
  Divider,
} from '@nextui-org/react';
import { FileText, Mail, Lock, Eye, EyeOff, Shield, UserCog, Users, Search } from 'lucide-react';
import { useAuth, DEV_USERS, type DevUserType } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// Configuracion de usuarios dev con iconos
const DEV_USER_OPTIONS: { key: DevUserType; icon: typeof UserCog; color: string }[] = [
  { key: 'admin', icon: Shield, color: '#dc2626' },
  { key: 'adminUA', icon: UserCog, color: '#ea580c' },
  { key: 'operador', icon: Users, color: '#2563eb' },
  { key: 'consulta', icon: Search, color: '#16a34a' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, devSignIn, isDevMode } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast.error('Credenciales incorrectas');
        return;
      }

      toast.success('Bienvenido al sistema');
      navigate('/');
    } catch {
      toast.error('Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = (userType: DevUserType) => {
    devSignIn(userType);
    toast.success(`Entrando como ${DEV_USERS[userType].nombre_completo}`);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header institucional - responsivo */}
      <header
        className="text-white py-2 sm:py-3 px-4 sm:px-6 shadow-lg"
        style={{ backgroundColor: 'var(--theme-primary-700)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield size={24} className="sm:w-7 sm:h-7" style={{ color: 'var(--theme-secondary, #d9a316)' }} />
            <div>
              <h1 className="text-sm sm:text-lg font-bold tracking-wide">GOBIERNO DEL ESTADO</h1>
              <p className="text-[10px] sm:text-xs opacity-70">Gestion Documental Inteligente</p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm opacity-70">Portal Oficial</p>
          </div>
        </div>
      </header>

      {/* Contenido principal - responsivo */}
      <main
        className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary-50) 0%, white 50%, var(--theme-primary-100) 100%)`
        }}
      >
        <div className="w-full max-w-md">
          {/* Banner de modo desarrollo */}
          {isDevMode && (
            <div
              className="mb-4 p-3 rounded-lg text-center text-white text-sm font-medium shadow-lg"
              style={{ backgroundColor: '#f59e0b' }}
            >
              MODO DESARROLLO - Selecciona un tipo de usuario para entrar
            </div>
          )}

          <Card
            className="w-full shadow-2xl"
            style={{ borderColor: 'var(--theme-primary-200)', borderWidth: '1px' }}
          >
            <CardBody className="p-4 sm:p-6 md:p-8">
              {/* Logo y titulo - responsivo */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div
                    className="p-3 sm:p-4 rounded-xl shadow-lg"
                    style={{ backgroundColor: 'var(--theme-primary-700)' }}
                  >
                    <FileText size={36} className="sm:w-11 sm:h-11 text-white" />
                  </div>
                </div>
                <h1
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ color: 'var(--theme-primary-800)' }}
                >
                  SISGEDI
                </h1>
                <p
                  className="mt-1 text-xs sm:text-sm font-medium"
                  style={{ color: 'var(--theme-primary-600)' }}
                >
                  Sistema de Gestion Documental Inteligente
                </p>
                <p className="text-gray-500 mt-1 text-[10px] sm:text-xs">Version 2.0</p>
              </div>

              <Divider className="my-3 sm:my-4" />

              {/* Selector de usuarios en modo desarrollo */}
              {isDevMode ? (
                <div className="space-y-3">
                  <p className="text-center text-sm text-gray-600 mb-4">
                    Selecciona el perfil con el que deseas probar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEV_USER_OPTIONS.map(({ key, icon: Icon, color }) => {
                      const devUser = DEV_USERS[key];
                      return (
                        <button
                          key={key}
                          onClick={() => handleDevLogin(key)}
                          className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg text-left"
                          style={{
                            borderColor: color,
                            backgroundColor: `${color}10`,
                          }}
                        >
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: color }}
                          >
                            <Icon size={20} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color }}>
                              {devUser.rol.nombre_rol}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                              {devUser.unidad_administrativa.nombre_ua}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Divider className="my-4" />

                  <p className="text-center text-xs text-gray-400">
                    O usa el formulario tradicional:
                  </p>
                </div>
              ) : null}

              {/* Formulario de login - siempre visible pero secundario en dev */}
              <form onSubmit={handleSubmit} className={`space-y-4 sm:space-y-5 ${isDevMode ? 'mt-4 opacity-70' : ''}`}>
                <Input
                  type="email"
                  label="Correo institucional"
                  placeholder="usuario@institucion.gob.mx"
                  value={email}
                  onValueChange={setEmail}
                  size="sm"
                  classNames={{ input: 'text-sm' }}
                  startContent={
                    <Mail size={16} style={{ color: 'var(--theme-primary-400)' }} />
                  }
                  variant="bordered"
                  isRequired={!isDevMode}
                />

                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Contrasena"
                  placeholder="Ingresa tu contrasena"
                  value={password}
                  onValueChange={setPassword}
                  size="sm"
                  classNames={{ input: 'text-sm' }}
                  startContent={
                    <Lock size={16} style={{ color: 'var(--theme-primary-400)' }} />
                  }
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff size={16} style={{ color: 'var(--theme-primary-400)' }} />
                      ) : (
                        <Eye size={16} style={{ color: 'var(--theme-primary-400)' }} />
                      )}
                    </button>
                  }
                  variant="bordered"
                  isRequired={!isDevMode}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold text-white text-sm sm:text-base"
                  style={{ backgroundColor: 'var(--theme-primary-700)' }}
                  isLoading={loading}
                >
                  Iniciar Sesion
                </Button>
              </form>

              {/* Ayuda */}
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-[10px] sm:text-xs text-gray-500">
                  Problemas para acceder? Contacta al administrador de tu unidad.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>

      {/* Footer institucional - responsivo */}
      <footer
        className="text-white py-3 sm:py-4 px-4 sm:px-6"
        style={{ backgroundColor: 'var(--theme-primary-800)' }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[10px] sm:text-sm opacity-70">
            Sistema de uso exclusivo para servidores publicos autorizados
          </p>
          <div className="flex items-center justify-center gap-2 mt-1 sm:mt-2">
            <span
              className="font-semibold text-xs sm:text-base"
              style={{ color: 'var(--theme-secondary, #d9a316)' }}
            >
              SISGEDI 2.0
            </span>
            <span className="opacity-50 hidden sm:inline">|</span>
            <span className="text-[10px] sm:text-xs opacity-60 hidden sm:inline">2025 - Todos los derechos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
