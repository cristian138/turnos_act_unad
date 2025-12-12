import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { Ticket, Printer, CheckCircle, Clock, PhoneCall, UserCheck, XCircle, RefreshCw } from 'lucide-react';

const VAPDashboard = () => {
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [prioridades, setPrioridades] = useState([]);
  const [turnoGenerado, setTurnoGenerado] = useState(null);
  const [config, setConfig] = useState(null);
  const [turnosHoy, setTurnosHoy] = useState([]);
  const [datosCliente, setDatosCliente] = useState({
    tipo_documento: 'CC',
    numero_documento: '',
    nombre_completo: '',
    telefono: '',
    correo: '',
    tipo_usuario: 'estudiante',
    observaciones: ''
  });
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  useEffect(() => {
    cargarDatos();
    cargarTurnosHoy();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarTurnosHoy, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      const [serviciosRes, configRes] = await Promise.all([
        api.servicios.listar(),
        api.configuracion.obtener()
      ]);
      setServicios(serviciosRes.data.filter(s => s.activo));
      setConfig(configRes.data);
      setPrioridades(configRes.data.prioridades || []);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  const cargarTurnosHoy = async () => {
    try {
      const response = await api.turnos.obtenerListaCompleta();
      setTurnosHoy(response.data);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    }
  };

  const buscarClientePorDocumento = async (numeroDocumento) => {
    if (!numeroDocumento || numeroDocumento.length < 5) {
      setClienteEncontrado(false);
      return;
    }

    setBuscandoCliente(true);
    try {
      const response = await api.clientes.buscarPorDocumento(numeroDocumento);
      const cliente = response.data;
      
      setDatosCliente({
        tipo_documento: cliente.tipo_documento,
        numero_documento: cliente.numero_documento,
        nombre_completo: cliente.nombre_completo,
        telefono: cliente.telefono,
        correo: cliente.correo,
        tipo_usuario: cliente.tipo_usuario
      });
      
      setClienteEncontrado(true);
      toast.success(`¡Cliente encontrado! ${cliente.nombre_completo}`);
    } catch (error) {
      if (error.response?.status === 404) {
        setClienteEncontrado(false);
        toast.info('Cliente nuevo - Por favor ingrese los datos');
      } else {
        toast.error('Error al buscar cliente');
      }
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleGenerar = async () => {
    if (!servicioSeleccionado) {
      toast.error('Selecciona un servicio');
      return;
    }

    if (!datosCliente.numero_documento || !datosCliente.nombre_completo || !datosCliente.telefono || !datosCliente.correo) {
      toast.error('Completa todos los datos del cliente');
      return;
    }

    try {
      const response = await api.turnos.generar({
        servicio_id: servicioSeleccionado,
        prioridad: prioridad || null,
        ...datosCliente
      });

      setTurnoGenerado(response.data);
      toast.success('Turno generado exitosamente');

      if (config?.impresion_habilitada) {
        handleImprimir(response.data);
      }

      setServicioSeleccionado('');
      setPrioridad('');
      setDatosCliente({
        tipo_documento: 'CC',
        numero_documento: '',
        nombre_completo: '',
        telefono: '',
        correo: '',
        tipo_usuario: 'estudiante',
        observaciones: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al generar turno');
    }
  };

  const handleImprimir = (turno) => {
    // Crear ventana de impresión con formato de ticket 58mm
    const servicioNombre = servicios.find(s => s.id === turno.servicio_id)?.nombre || turno.servicio_nombre || 'Servicio';
    const fecha = new Date(turno.fecha_creacion);
    const fechaFormateada = fecha.toLocaleDateString('es-CO', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const horaFormateada = fecha.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket ${turno.codigo}</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            width: 58mm;
            padding: 2mm;
            font-size: 12px;
          }
          .ticket {
            text-align: center;
          }
          .logo {
            width: 40mm;
            height: auto;
            margin-bottom: 2mm;
          }
          .titulo {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 3mm;
            border-bottom: 1px dashed #000;
            padding-bottom: 2mm;
          }
          .codigo {
            font-size: 36px;
            font-weight: bold;
            margin: 5mm 0;
            letter-spacing: 2px;
          }
          .servicio {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3mm;
            padding: 2mm;
            border: 1px solid #000;
          }
          .info {
            font-size: 10px;
            margin: 2mm 0;
          }
          .prioridad {
            font-size: 12px;
            font-weight: bold;
            margin: 2mm 0;
            padding: 1mm;
            background: #000;
            color: #fff;
          }
          .fecha {
            font-size: 10px;
            margin-top: 3mm;
            border-top: 1px dashed #000;
            padding-top: 2mm;
          }
          .footer {
            font-size: 8px;
            margin-top: 3mm;
            border-top: 1px dashed #000;
            padding-top: 2mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <img src="${window.location.origin}/Logo_unad_color.png" class="logo" alt="UNAD" onerror="this.style.display='none'"/>
          <div class="titulo">SISTEMA DE TURNOS<br/>UNAD</div>
          <div class="codigo">${turno.codigo}</div>
          <div class="servicio">${servicioNombre}</div>
          ${turno.prioridad ? `<div class="prioridad">⚠ PRIORIDAD: ${turno.prioridad.toUpperCase()}</div>` : ''}
          <div class="info">
            <strong>${turno.nombre_completo || 'Cliente'}</strong>
          </div>
          <div class="fecha">
            ${fechaFormateada} - ${horaFormateada}
          </div>
          <div class="footer">
            Conserve este ticket<br/>
            Espere a ser llamado
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    const ventanaImpresion = window.open('', '_blank', 'width=300,height=400');
    ventanaImpresion.document.write(ticketHTML);
    ventanaImpresion.document.close();
    
    toast.success('Ticket enviado a imprimir');
  };

  return (
    <div data-testid="vap-dashboard" className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <img src="/logo-unad.png" alt="UNAD Logo" className="h-24 mx-auto mb-4" />
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Generar Turno</h1>
        <p className="text-lg text-slate-600">Ventanilla de Atención Presencial</p>
      </div>

      <Card className="p-8 bg-white border-2 border-primary/20">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Tipo de Documento</label>
              <Select 
                value={datosCliente.tipo_documento} 
                onValueChange={(val) => setDatosCliente({...datosCliente, tipo_documento: val})}
              >
                <SelectTrigger className="h-12" data-testid="tipo-documento-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                  <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                  <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                  <SelectItem value="PAS">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">
                Número de Documento * 
                {buscandoCliente && <span className="text-primary ml-2 text-xs">Buscando...</span>}
                {clienteEncontrado && <span className="text-green-600 ml-2 text-xs">✓ Cliente encontrado</span>}
              </label>
              <Input
                value={datosCliente.numero_documento}
                onChange={(e) => {
                  const valor = e.target.value;
                  setDatosCliente({...datosCliente, numero_documento: valor});
                  setClienteEncontrado(false);
                }}
                onBlur={(e) => buscarClientePorDocumento(e.target.value)}
                placeholder="Ej: 1234567890"
                className={`h-12 ${clienteEncontrado ? 'border-green-500 bg-green-50' : ''}`}
                data-testid="numero-documento-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Nombre Completo *</label>
            <Input
              value={datosCliente.nombre_completo}
              onChange={(e) => setDatosCliente({...datosCliente, nombre_completo: e.target.value})}
              placeholder="Ej: Juan Pérez García"
              className={`h-12 ${clienteEncontrado ? 'bg-slate-100' : ''}`}
              readOnly={clienteEncontrado}
              data-testid="nombre-completo-input"
            />
            {clienteEncontrado && (
              <p className="text-xs text-slate-500 mt-1">Datos cargados automáticamente</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Teléfono *</label>
              <Input
                value={datosCliente.telefono}
                onChange={(e) => setDatosCliente({...datosCliente, telefono: e.target.value})}
                placeholder="Ej: 3001234567"
                className={`h-12 ${clienteEncontrado ? 'bg-slate-100' : ''}`}
                readOnly={clienteEncontrado}
                data-testid="telefono-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Correo Electrónico *</label>
              <Input
                type="email"
                value={datosCliente.correo}
                onChange={(e) => setDatosCliente({...datosCliente, correo: e.target.value})}
                placeholder="correo@ejemplo.com"
                className={`h-12 ${clienteEncontrado ? 'bg-slate-100' : ''}`}
                readOnly={clienteEncontrado}
                data-testid="correo-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Tipo de Usuario</label>
            <Select 
              value={datosCliente.tipo_usuario} 
              onValueChange={(val) => setDatosCliente({...datosCliente, tipo_usuario: val})}
              disabled={clienteEncontrado}
            >
              <SelectTrigger className={`h-12 ${clienteEncontrado ? 'bg-slate-100' : ''}`} data-testid="tipo-usuario-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aspirante">Aspirante</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
                <SelectItem value="tercero">Tercero</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Observaciones / Motivo de la Solicitud</label>
            <textarea
              value={datosCliente.observaciones}
              onChange={(e) => setDatosCliente({...datosCliente, observaciones: e.target.value})}
              placeholder="Ej: Solicita información sobre inscripciones para el período 2024-2..."
              className="w-full h-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              data-testid="observaciones-input"
            />
            <p className="text-xs text-slate-500 mt-1">Describe brevemente el motivo de la consulta o solicitud</p>
          </div>

          {clienteEncontrado && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Cliente Registrado</p>
                  <p className="text-xs text-green-700">Los datos se cargaron automáticamente del último turno</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setClienteEncontrado(false);
                  toast.info('Ahora puedes editar los datos del cliente');
                }}
                data-testid="editar-datos-button"
              >
                Editar Datos
              </Button>
            </div>
          )}

          <div className="border-t pt-4">
            <div>
              <label className="block text-lg font-semibold mb-3 text-slate-900">Servicio a Solicitar *</label>
              <Select value={servicioSeleccionado} onValueChange={setServicioSeleccionado}>
                <SelectTrigger className="h-14 text-base" data-testid="servicio-select">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-base py-3">
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Prioridad (Opcional)</label>
            <Select value={prioridad || "ninguna"} onValueChange={(val) => setPrioridad(val === "ninguna" ? "" : val)}>
              <SelectTrigger className="h-12" data-testid="prioridad-select">
                <SelectValue placeholder="Sin prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Sin prioridad</SelectItem>
                {prioridades.map(p => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerar}
            className="w-full h-16 text-lg bg-primary"
            data-testid="generar-turno-button"
          >
            <Ticket className="mr-3 h-6 w-6" />
            Generar Turno
          </Button>
        </div>
      </Card>

      {turnoGenerado && (
        <Card className="p-8 mt-6 border-4 border-primary">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl text-slate-600 mb-2">Turno Generado Exitosamente</p>
            <p className="font-mono text-7xl font-black text-primary mb-4">
              {turnoGenerado.codigo}
            </p>
            <p className="text-2xl text-slate-700 mb-2">{turnoGenerado.servicio_nombre}</p>
            {turnoGenerado.prioridad && (
              <div className="inline-flex items-center px-6 py-3 bg-red-100 rounded-full mb-4">
                <span className="text-red-600 text-xl font-semibold">{turnoGenerado.prioridad}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Datos del Cliente</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600 font-medium">Documento</p>
                <p className="text-slate-900">{turnoGenerado.tipo_documento} {turnoGenerado.numero_documento}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Nombre</p>
                <p className="text-slate-900">{turnoGenerado.nombre_completo}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Teléfono</p>
                <p className="text-slate-900">{turnoGenerado.telefono}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Correo</p>
                <p className="text-slate-900">{turnoGenerado.correo}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-600 font-medium">Tipo de Usuario</p>
                <p className="text-slate-900 capitalize">{turnoGenerado.tipo_usuario}</p>
              </div>
            </div>
          </div>

          {config?.impresion_habilitada && (
            <Button
              onClick={() => handleImprimir(turnoGenerado)}
              variant="outline"
              size="lg"
              className="w-full"
              data-testid="reimprimir-button"
            >
              <Printer className="mr-2 h-5 w-5" />
              Reimprimir Ticket
            </Button>
          )}
        </Card>
      )}

      {/* Lista de Turnos del Día */}
      <Card className="p-6 mt-6 bg-white border-2 border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold text-primary">Turnos del Día</h2>
          <Button variant="outline" size="sm" onClick={cargarTurnosHoy}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
        
        {/* Resumen */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {turnosHoy.filter(t => t.estado === 'creado').length}
            </p>
            <p className="text-sm text-blue-700">Pendientes</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <PhoneCall className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">
              {turnosHoy.filter(t => t.estado === 'llamado').length}
            </p>
            <p className="text-sm text-orange-700">Llamados</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <UserCheck className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {turnosHoy.filter(t => t.estado === 'atendiendo').length}
            </p>
            <p className="text-sm text-purple-700">En Atención</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {turnosHoy.filter(t => t.estado === 'finalizado').length}
            </p>
            <p className="text-sm text-green-700">Finalizados</p>
          </div>
        </div>

        {/* Tabla de turnos */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-semibold">Código</th>
                <th className="text-left p-3 font-semibold">Cliente</th>
                <th className="text-left p-3 font-semibold">Servicio</th>
                <th className="text-left p-3 font-semibold">Estado</th>
                <th className="text-left p-3 font-semibold">Módulo</th>
                <th className="text-left p-3 font-semibold">Hora</th>
              </tr>
            </thead>
            <tbody>
              {turnosHoy.map((turno) => (
                <tr key={turno.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold">{turno.codigo}</td>
                  <td className="p-3">
                    <p className="font-medium">{turno.nombre_completo}</p>
                    <p className="text-xs text-slate-500">{turno.numero_documento}</p>
                  </td>
                  <td className="p-3">{turno.servicio_nombre}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      turno.estado === 'creado' ? 'bg-blue-100 text-blue-700' :
                      turno.estado === 'llamado' ? 'bg-orange-100 text-orange-700' :
                      turno.estado === 'atendiendo' ? 'bg-purple-100 text-purple-700' :
                      turno.estado === 'finalizado' ? 'bg-green-100 text-green-700' :
                      turno.estado === 'cancelado' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {turno.estado === 'creado' ? 'Pendiente' :
                       turno.estado === 'llamado' ? 'Llamado' :
                       turno.estado === 'atendiendo' ? 'En Atención' :
                       turno.estado === 'finalizado' ? 'Finalizado' :
                       turno.estado === 'cancelado' ? 'Cancelado' :
                       turno.estado}
                    </span>
                  </td>
                  <td className="p-3">{turno.modulo || '-'}</td>
                  <td className="p-3 text-slate-500">
                    {new Date(turno.fecha_creacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {turnosHoy.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No hay turnos registrados hoy
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default VAPDashboard;
