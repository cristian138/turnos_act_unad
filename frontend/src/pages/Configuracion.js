import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Save, Printer } from 'lucide-react';

const Configuracion = () => {
  const [config, setConfig] = useState({
    impresion_habilitada: true,
    prioridades: []
  });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await api.configuracion.obtener();
      setConfig(response.data);
    } catch (error) {
      toast.error('Error al cargar configuración');
    }
  };

  const handleGuardar = async () => {
    setCargando(true);
    try {
      await api.configuracion.actualizar(config);
      toast.success('Configuración actualizada exitosamente');
    } catch (error) {
      toast.error('Error al actualizar configuración');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div data-testid="configuracion-page">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Configuración</h1>
        <p className="text-slate-600">Ajusta los parámetros del sistema</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="p-6 bg-white border-2 border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Printer className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Impresión de Tickets</Label>
              </div>
              <p className="text-sm text-slate-600">
                Habilita o deshabilita la impresión automática de tickets térmicos
              </p>
            </div>
            <Switch
              checked={config.impresion_habilitada}
              onCheckedChange={(checked) => setConfig({ ...config, impresion_habilitada: checked })}
              data-testid="impresion-switch"
            />
          </div>
        </Card>

        <Card className="p-6 bg-white border-2 border-slate-200">
          <h3 className="text-lg font-semibold mb-4">Prioridades Configuradas</h3>
          <div className="space-y-2">
            {config.prioridades.map((prioridad, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-md">
                <p className="font-medium">{prioridad}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Las prioridades determinan el orden de atención en la cola de turnos
          </p>
        </Card>

        <Button
          onClick={handleGuardar}
          disabled={cargando}
          className="w-full bg-primary"
          data-testid="guardar-configuracion-button"
        >
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
};

export default Configuracion;
