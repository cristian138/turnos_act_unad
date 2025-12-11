import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    prefijo: ''
  });

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      const response = await api.servicios.listar();
      setServicios(response.data);
    } catch (error) {
      toast.error('Error al cargar servicios');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modoEdicion) {
        await api.servicios.actualizar(servicioSeleccionado.id, formData);
        toast.success('Servicio actualizado exitosamente');
      } else {
        await api.servicios.crear(formData);
        toast.success('Servicio creado exitosamente');
      }

      setDialogOpen(false);
      resetForm();
      cargarServicios();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar servicio');
    }
  };

  const handleEditar = (servicio) => {
    setServicioSeleccionado(servicio);
    setFormData({
      nombre: servicio.nombre,
      prefijo: servicio.prefijo
    });
    setModoEdicion(true);
    setDialogOpen(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      await api.servicios.eliminar(id);
      toast.success('Servicio eliminado exitosamente');
      cargarServicios();
    } catch (error) {
      toast.error('Error al eliminar servicio');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      prefijo: ''
    });
    setModoEdicion(false);
    setServicioSeleccionado(null);
  };

  return (
    <div data-testid="servicios-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-primary mb-2">Servicios</h1>
          <p className="text-slate-600">Gestiona los servicios de atención</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary" data-testid="nuevo-servicio-button">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modoEdicion ? 'Editar Servicio' : 'Nuevo Servicio'}
              </DialogTitle>
              <DialogDescription>
                {modoEdicion ? 'Modifica la información del servicio' : 'Define un nuevo servicio de atención'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre del Servicio</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Registro Académico"
                  required
                  data-testid="servicio-nombre-input"
                />
              </div>
              <div>
                <Label>Prefijo (letra para el código)</Label>
                <Input
                  value={formData.prefijo}
                  onChange={(e) => setFormData({ ...formData, prefijo: e.target.value.toUpperCase() })}
                  placeholder="Ej: A"
                  maxLength={3}
                  required
                  data-testid="servicio-prefijo-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="guardar-servicio-button">
                {modoEdicion ? 'Actualizar' : 'Crear'} Servicio
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicios.map((servicio) => (
          <Card key={servicio.id} className="p-6" data-testid={`servicio-card-${servicio.id}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-1">
                  {servicio.nombre}
                </h3>
                <p className="text-sm text-slate-600">
                  Prefijo: <span className="font-mono font-bold text-primary">{servicio.prefijo}</span>
                </p>
              </div>
              {servicio.activo ? (
                <CheckCircle className="h-5 w-5 text-green-500" data-testid="servicio-activo" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" data-testid="servicio-inactivo" />
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditar(servicio)}
                className="flex-1"
                data-testid={`editar-servicio-${servicio.id}`}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEliminar(servicio.id)}
                className="flex-1 text-red-500 hover:text-red-600"
                data-testid={`eliminar-servicio-${servicio.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Servicios;
