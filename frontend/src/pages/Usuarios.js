import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'funcionario',
    servicios_asignados: [],
    modulo: ''
  });

  useEffect(() => {
    cargarUsuarios();
    cargarServicios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await api.usuarios.listar();
      setUsuarios(response.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await api.servicios.listar();
      setServicios(response.data.filter(s => s.activo));
    } catch (error) {
      toast.error('Error al cargar servicios');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modoEdicion) {
        await api.usuarios.actualizar(usuarioSeleccionado.id, formData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        await api.usuarios.crear(formData);
        toast.success('Usuario creado exitosamente');
      }

      setDialogOpen(false);
      resetForm();
      cargarUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar usuario');
    }
  };

  const handleEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      servicios_asignados: usuario.servicios_asignados || [],
      modulo: usuario.modulo || ''
    });
    setModoEdicion(true);
    setDialogOpen(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await api.usuarios.eliminar(id);
      toast.success('Usuario eliminado exitosamente');
      cargarUsuarios();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'funcionario',
      servicios_asignados: [],
      modulo: ''
    });
    setModoEdicion(false);
    setUsuarioSeleccionado(null);
  };

  const getRolBadgeColor = (rol) => {
    const colors = {
      administrador: 'bg-primary text-white',
      funcionario: 'bg-secondary text-white',
      vap: 'bg-accent text-black'
    };
    return colors[rol] || 'bg-slate-200';
  };

  return (
    <div data-testid="usuarios-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-primary mb-2">Usuarios</h1>
          <p className="text-slate-600">Gestiona los usuarios del sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary" data-testid="nuevo-usuario-button">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription>
                {modoEdicion ? 'Modifica la información del usuario' : 'Completa el formulario para crear un nuevo usuario del sistema'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  data-testid="usuario-nombre-input"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="usuario-email-input"
                />
              </div>
              <div>
                <Label>Contraseña {modoEdicion && '(dejar vacío para no cambiar)'}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!modoEdicion}
                  data-testid="usuario-password-input"
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Select
                  value={formData.rol}
                  onValueChange={(value) => setFormData({ ...formData, rol: value })}
                >
                  <SelectTrigger data-testid="usuario-rol-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="funcionario">Funcionario</SelectItem>
                    <SelectItem value="vap">VAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.rol === 'funcionario' && (
                <>
                  <div>
                    <Label>Módulo de Atención</Label>
                    <Input
                      value={formData.modulo}
                      onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                      placeholder="Ej: Módulo 1, Ventanilla 3, etc."
                      data-testid="usuario-modulo-input"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Este módulo se mostrará en la pantalla pública cuando llame un turno
                    </p>
                  </div>
                  <div>
                    <Label>Servicios Asignados</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {servicios.length > 0 ? (
                        servicios.map((servicio) => (
                          <label key={servicio.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.servicios_asignados.includes(servicio.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    servicios_asignados: [...formData.servicios_asignados, servicio.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    servicios_asignados: formData.servicios_asignados.filter(id => id !== servicio.id)
                                  });
                                }
                              }}
                              className="h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm">{servicio.nombre}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No hay servicios disponibles</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Selecciona los servicios que este funcionario podrá atender
                    </p>
                  </div>
                </>
              )}
              <Button type="submit" className="w-full" data-testid="guardar-usuario-button">
                {modoEdicion ? 'Actualizar' : 'Crear'} Usuario
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="usuarios-table">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Rol</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Módulo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Servicios</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Estado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{usuario.nombre}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{usuario.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRolBadgeColor(usuario.rol)}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {usuario.modulo || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {usuario.servicios_asignados && usuario.servicios_asignados.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {usuario.servicios_asignados.map((servicioId) => {
                          const servicio = servicios.find(s => s.id === servicioId);
                          return servicio ? (
                            <span key={servicioId} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              {servicio.nombre}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {usuario.activo ? (
                      <UserCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <UserX className="h-5 w-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditar(usuario)}
                      data-testid={`editar-usuario-${usuario.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEliminar(usuario.id)}
                      data-testid={`eliminar-usuario-${usuario.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Usuarios;
