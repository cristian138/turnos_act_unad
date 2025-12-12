import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { LogIn, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }

    setCargando(false);
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?crop=entropy&cs=srgb&fm=jpg&q=85')`
        }}
      >
        <div className="absolute inset-0 bg-primary/85 flex items-center justify-center">
          <div className="text-white text-center px-8">
            <img src="/logo-unad.png" alt="UNAD Logo" className="h-32 mx-auto mb-6 drop-shadow-2xl" />
            <p className="text-2xl font-heading font-bold mb-2">Sistema de Gestión de Turnos</p>
            <p className="text-lg opacity-90">Eficiencia y transparencia en la atención</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="mb-8 text-center">
              <img src="/logo-unad.png" alt="UNAD Logo" className="h-24 mx-auto mb-6" />
              <h2 className="text-3xl font-heading font-bold text-primary mb-2">Iniciar Sesión</h2>
              <p className="text-slate-600">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" data-testid="email-label">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@unad.edu.co"
                  required
                  data-testid="email-input"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password" data-testid="password-label">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-testid="password-input"
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 h-11"
                disabled={cargando}
                data-testid="login-button"
              >
                {cargando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
