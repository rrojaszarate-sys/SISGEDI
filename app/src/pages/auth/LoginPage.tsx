import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Input,
  Button,
  Divider,
} from '@nextui-org/react';
import { FileText, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardBody className="p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary p-4 rounded-full">
                <FileText size={40} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">SISGEDI 2.0</h1>
            <p className="text-gray-500 mt-2">Sistema de Gestión Documental Inteligente</p>
          </div>

          <Divider className="my-4" />

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Correo institucional"
              placeholder="usuario@institucion.gob.mx"
              value={email}
              onValueChange={setEmail}
              startContent={<Mail size={18} className="text-gray-400" />}
              variant="bordered"
              isRequired
            />

            <Input
              type={showPassword ? 'text' : 'password'}
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onValueChange={setPassword}
              startContent={<Lock size={18} className="text-gray-400" />}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-gray-400" />
                  ) : (
                    <Eye size={18} className="text-gray-400" />
                  )}
                </button>
              }
              variant="bordered"
              isRequired
            />

            <Button
              type="submit"
              color="primary"
              size="lg"
              className="w-full font-semibold"
              isLoading={loading}
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Sistema de uso exclusivo para servidores públicos</p>
            <p className="mt-1">© 2025 SISGEDI - Todos los derechos reservados</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
