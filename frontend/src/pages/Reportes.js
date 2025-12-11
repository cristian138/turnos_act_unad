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
import { toast } from 'sonner';
import { Download, FileText, Loader2 } from 'lucide-react';

const Reportes = () => {
  const [servicios, setServicios] = useState([]);
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    servicio_id: '',
    formato: 'json'
  });
  const [reporteData, setReporteData] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarServicios();
    const hoy = new Date().toISOString().split('T')[0];
    setFiltros(prev => ({
      ...prev,
      fecha_inicio: hoy,
      fecha_fin: hoy
    }));
  }, []);

  const cargarServicios = async () => {
    try {
      const response = await api.servicios.listar();
      setServicios(response.data.filter(s => s.activo));
    } catch (error) {
      toast.error('Error al cargar servicios');
    }
  };

  const handleGenerarReporte = async (formato) => {
    setCargando(true);

    try {
      const params = {
        ...filtros,
        formato
      };

      const response = await api.reportes.generarReporteAtencion(params);

      if (formato === 'excel') {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'reporte_atencion.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Reporte descargado exitosamente');
      } else {
        setReporteData(response.data);
        toast.success('Reporte generado exitosamente');
      }
    } catch (error) {
      toast.error('Error al generar reporte');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div data-testid="reportes-page">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Reportes</h1>
        <p className="text-slate-600">Genera reportes de atención y estadísticas</p>
      </div>

      <Card className="p-6 mb-6 bg-white border-2 border-slate-200">
        <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">Filtros de Reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Fecha Inicio</Label>
            <Input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
              data-testid="fecha-inicio-input"
            />
          </div>
          <div>
            <Label>Fecha Fin</Label>
            <Input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
              data-testid="fecha-fin-input"
            />
          </div>
          <div>
            <Label>Servicio (Opcional)</Label>
            <Select
              value={filtros.servicio_id || "todos"}
              onValueChange={(value) => setFiltros({ ...filtros, servicio_id: value === "todos" ? "" : value })}
            >
              <SelectTrigger data-testid="servicio-select">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {servicios.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <Button
            onClick={() => handleGenerarReporte('json')}
            disabled={cargando}
            data-testid="generar-reporte-json"
          >
            {cargando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Ver Reporte
          </Button>
          <Button
            onClick={() => handleGenerarReporte('excel')}
            className="bg-secondary"
            disabled={cargando}
            data-testid="descargar-reporte-excel"
          >
            {cargando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Descargar Excel
          </Button>
        </div>
      </Card>

      {reporteData && (
        <Card className="p-6 bg-white border-2 border-slate-200">
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">
            Resultados: {reporteData.total} turnos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Código</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Servicio</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Estado</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Funcionario</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Tiempo Espera</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reporteData.turnos.slice(0, 50).map((turno, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm font-mono">{turno.codigo}</td>
                    <td className="px-4 py-2 text-sm">{turno.servicio_nombre}</td>
                    <td className="px-4 py-2 text-sm">{turno.estado}</td>
                    <td className="px-4 py-2 text-sm">{turno.funcionario_nombre || '-'}</td>
                    <td className="px-4 py-2 text-sm">
                      {turno.tiempo_espera ? `${Math.floor(turno.tiempo_espera / 60)} min` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Reportes;
