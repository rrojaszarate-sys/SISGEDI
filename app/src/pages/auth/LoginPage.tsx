import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Input,
  Button,
  Divider,
} from '@nextui-org/react';
import { FileText, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header institucional */}
      <header
        className="text-white py-3 px-6 shadow-lg"
        style={{ backgroundColor: 'var(--theme-primary-700)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={28} style={{ color: 'var(--theme-secondary, #d9a316)' }} />
            <div>
              <h1 className="text-lg font-bold tracking-wide">GOBIERNO DEL ESTADO</h1>
              <p className="text-xs opacity-70">Sistema de Gestion Documental</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm opacity-70">Portal Oficial</p>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main
        className="flex-1 flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary-50) 0%, white 50%, var(--theme-primary-100) 100%)`
        }}
      >
        <Card
          className="w-full max-w-md shadow-2xl"
          style={{ borderColor: 'var(--theme-primary-200)', borderWidth: '1px' }}
        >
          <CardBody className="p-8">
            {/* Logo y titulo */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div
                  className="p-4 rounded-xl shadow-lg"
                  style={{ backgroundColor: 'var(--theme-primary-700)' }}
                >
                  <FileText size={44} className="text-white" />
                </div>
              </div>
              <h1
                className="text-3xl font-bold"
                style={{ color: 'var(--theme-primary-800)' }}
              >
                SISGEDI
              </h1>
              <p
                className="mt-1 text-sm font-medium"
                style={{ color: 'var(--theme-primary-600)' }}
              >
                Sistema de Gestion Documental Inteligente
              </p>
              <p className="text-gray-500 mt-1 text-xs">Version 2.0</p>
            </div>

            <Divider className="my-4" />

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                type="email"
                label="Correo institucional"
                placeholder="usuario@institucion.gob.mx"
                value={email}
                onValueChange={setEmail}
                startContent={
                  <Mail size={18} style={{ color: 'var(--theme-primary-400)' }} />
                }
                variant="bordered"
                isRequired
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                label="Contrasena"
                placeholder="Ingresa tu contrasena"
                value={password}
                onValueChange={setPassword}
                startContent={
                  <Lock size={18} style={{ color: 'var(--theme-primary-400)' }} />
                }
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff size={18} style={{ color: 'var(--theme-primary-400)' }} />
                    ) : (
                      <Eye size={18} style={{ color: 'var(--theme-primary-400)' }} />
                    )}
                  </button>
                }
                variant="bordered"
                isRequired
              />

              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold text-white"
                style={{ backgroundColor: 'var(--theme-primary-700)' }}
                isLoading={loading}
              >
                Iniciar Sesion
              </Button>
            </form>

            {/* Ayuda */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Problemas para acceder? Contacta al administrador de tu unidad.
              </p>
            </div>
          </CardBody>
        </Card>
      </main>

      {/* Footer institucional */}
      <footer
        className="text-white py-4 px-6"
        style={{ backgroundColor: 'var(--theme-primary-800)' }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm opacity-70">
            Sistema de uso exclusivo para servidores publicos autorizados
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span
              className="font-semibold"
              style={{ color: 'var(--theme-secondary, #d9a316)' }}
            >
              SISGEDI 2.0
            </span>
            <span className="opacity-50">|</span>
            <span className="text-xs opacity-60">2025 - Todos los derechos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
