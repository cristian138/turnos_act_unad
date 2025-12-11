import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  usuarios: {
    listar: () => axios.get(`${API}/usuarios`, { headers: getAuthHeaders() }),
    crear: (data) => axios.post(`${API}/usuarios`, data, { headers: getAuthHeaders() }),
    actualizar: (id, data) => axios.put(`${API}/usuarios/${id}`, data, { headers: getAuthHeaders() }),
    eliminar: (id) => axios.delete(`${API}/usuarios/${id}`, { headers: getAuthHeaders() })
  },
  servicios: {
    listar: () => axios.get(`${API}/servicios`, { headers: getAuthHeaders() }),
    crear: (data) => axios.post(`${API}/servicios`, data, { headers: getAuthHeaders() }),
    actualizar: (id, data) => axios.put(`${API}/servicios/${id}`, data, { headers: getAuthHeaders() }),
    eliminar: (id) => axios.delete(`${API}/servicios/${id}`, { headers: getAuthHeaders() })
  },
  turnos: {
    generar: (data) => axios.post(`${API}/turnos/generar`, data, { headers: getAuthHeaders() }),
    obtenerCola: (servicioId) => axios.get(`${API}/turnos/cola/${servicioId}`, { headers: getAuthHeaders() }),
    obtenerTodos: () => axios.get(`${API}/turnos/todos`, { headers: getAuthHeaders() }),
    llamar: (data) => axios.post(`${API}/turnos/llamar`, data, { headers: getAuthHeaders() }),
    cerrar: (data) => axios.post(`${API}/turnos/cerrar`, data, { headers: getAuthHeaders() }),
    redirigir: (data) => axios.post(`${API}/turnos/redirigir`, data, { headers: getAuthHeaders() }),
    obtenerLlamadosRecientes: () => axios.get(`${API}/turnos/llamados-recientes`)
  },
  configuracion: {
    obtener: () => axios.get(`${API}/configuracion`, { headers: getAuthHeaders() }),
    actualizar: (data) => axios.put(`${API}/configuracion`, data, { headers: getAuthHeaders() })
  },
  clientes: {
    buscarPorDocumento: (numeroDocumento) => axios.get(`${API}/clientes/buscar/${numeroDocumento}`, { headers: getAuthHeaders() })
  },
  reportes: {
    generarReporteAtencion: (params) => axios.get(`${API}/reportes/atencion`, {
      params,
      headers: getAuthHeaders(),
      responseType: params.formato === 'excel' ? 'blob' : 'json'
    })
  }
};
