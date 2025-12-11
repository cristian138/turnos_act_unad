# Sistema de Gestión de Turnos UNAD

## Descripción General

Sistema completo de gestión de turnos para la Universidad Nacional Abierta y a Distancia (UNAD), diseñado para optimizar la atención al público mediante un sistema de colas inteligente con prioridades, tiempo real y reportes detallados.

## Características Principales

### 🎯 Funcionalidades Core

- **Gestión de Turnos**: Generación, llamado, cierre y redirección de turnos
- **Sistema de Prioridades**: Discapacidad, Embarazo, Adulto Mayor (configurable)
- **Tiempo Real**: WebSocket para actualizaciones instantáneas en pantalla pública
- **Múltiples Roles**: Administrador, Funcionario de Atención, VAP
- **Reportes Excel**: Exportación de datos con filtros avanzados
- **Impresión Térmica**: Soporte para impresoras XPrinter XP-58 (ESC-POS)
- **Diseño Corporativo**: Colores institucionales UNAD (#F47920, #F0B429, #005883)

### 👥 Roles del Sistema

#### 1. Administrador
- Gestión completa de usuarios (CRUD)
- Gestión de servicios de atención
- Asignación de servicios a funcionarios
- Configuración del sistema
- Generación y exportación de reportes
- Visualización de estadísticas

#### 2. Funcionario de Atención
- Módulo de atención de turnos
- Llamado de siguiente turno
- Rellamado de turno actual
- Cierre de turnos atendidos
- Redirección a otros servicios
- Vista de cola de espera

#### 3. VAP (Ventanilla de Atención Presencial)
- Generación de turnos
- Selección de servicio y prioridad
- Impresión de tickets
- Cierre de turnos autorizados

## Tecnologías Utilizadas

### Backend
- **FastAPI**: Framework web moderno y rápido
- **Python 3.11**: Lenguaje de programación
- **MongoDB**: Base de datos NoSQL
- **Motor**: Driver asíncrono para MongoDB
- **Socket.IO**: Comunicación en tiempo real
- **JWT**: Autenticación segura
- **OpenPyXL**: Generación de reportes Excel
- **Bcrypt**: Encriptación de contraseñas

### Frontend
- **React 19**: Biblioteca de UI
- **Tailwind CSS**: Framework de estilos
- **Shadcn/UI**: Componentes UI accesibles
- **Socket.IO Client**: Cliente WebSocket
- **Axios**: Cliente HTTP
- **React Router**: Navegación
- **Sonner**: Notificaciones toast
- **Recharts**: Gráficos y visualizaciones

## Estructura del Proyecto

```
/app/
├── backend/
│   ├── server.py              # Aplicación FastAPI principal
│   ├── init_db.py             # Script de inicialización de BD
│   ├── requirements.txt       # Dependencias Python
│   └── .env                   # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── App.js            # Componente principal
│   │   ├── context/          # Contextos (Auth, Socket)
│   │   ├── pages/            # Páginas de la aplicación
│   │   ├── components/       # Componentes reutilizables
│   │   └── lib/              # Utilidades y API
│   ├── package.json          # Dependencias Node.js
│   └── .env                  # Variables de entorno
└── design_guidelines.json    # Guías de diseño
```

## Instalación y Configuración

### Requisitos Previos
- Python 3.11+
- Node.js 18+
- MongoDB 5.0+
- Yarn package manager

### Instalación

```bash
# Clonar el repositorio
cd /app

# Instalar dependencias del backend
cd backend
pip install -r requirements.txt

# Instalar dependencias del frontend
cd ../frontend
yarn install
```

### Configuración de Variables de Entorno

**Backend (.env)**
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="unad_turnos"
CORS_ORIGINS="*"
SECRET_KEY="tu-clave-secreta-super-segura"
```

**Frontend (.env)**
```bash
REACT_APP_BACKEND_URL=https://tu-dominio.com
```

### Inicialización de Base de Datos

```bash
cd /app/backend
python init_db.py
```

Esto creará:
- 3 usuarios de prueba (admin, funcionario, vap)
- 3 servicios ejemplo (Registro Académico, Servicios Financieros, Información General)
- Configuración inicial del sistema

### Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@unad.edu.co | admin123 |
| Funcionario | funcionario@unad.edu.co | func123 |
| VAP | vap@unad.edu.co | vap123 |

## Ejecución

### Desarrollo

**Backend:**
```bash
cd /app/backend
uvicorn server:socket_app --host 0.0.0.0 --port 8001 --reload
```

**Frontend:**
```bash
cd /app/frontend
yarn start
```

### Producción con Supervisor

```bash
sudo supervisorctl restart backend frontend
sudo supervisorctl status
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener perfil del usuario

### Usuarios (Solo Admin)
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/{id}` - Actualizar usuario
- `DELETE /api/usuarios/{id}` - Eliminar usuario

### Servicios
- `GET /api/servicios` - Listar servicios
- `POST /api/servicios` - Crear servicio (Admin)
- `PUT /api/servicios/{id}` - Actualizar servicio (Admin)
- `DELETE /api/servicios/{id}` - Eliminar servicio (Admin)

### Turnos
- `POST /api/turnos/generar` - Generar nuevo turno
- `GET /api/turnos/cola/{servicio_id}` - Ver cola de un servicio
- `GET /api/turnos/todos` - Ver todos los turnos en espera
- `POST /api/turnos/llamar` - Llamar siguiente turno
- `POST /api/turnos/cerrar` - Cerrar turno
- `POST /api/turnos/redirigir` - Redirigir turno a otro servicio
- `GET /api/turnos/llamados-recientes` - Últimos 10 turnos llamados

### Configuración
- `GET /api/configuracion` - Obtener configuración
- `PUT /api/configuracion` - Actualizar configuración (Admin)

### Reportes
- `GET /api/reportes/atencion` - Generar reporte con filtros
  - Parámetros: `fecha_inicio`, `fecha_fin`, `servicio_id`, `funcionario_id`, `prioridad`, `formato`

## WebSocket Events

El sistema emite eventos en tiempo real para actualizar las pantallas:

- `turno_generado` - Cuando se crea un nuevo turno
- `turno_llamado` - Cuando un funcionario llama un turno
- `turno_cerrado` - Cuando se cierra un turno
- `turno_redirigido` - Cuando se redirige un turno

## Pantallas del Sistema

### 1. Login
- Acceso con email y contraseña
- Redirección automática según rol

### 2. Dashboard Administrador
- Estadísticas generales
- Accesos rápidos a gestión
- Métricas en tiempo real

### 3. Gestión de Usuarios
- Tabla con todos los usuarios
- Crear/Editar/Eliminar usuarios
- Asignar roles y servicios

### 4. Gestión de Servicios
- Tarjetas con servicios
- Crear/Editar/Eliminar servicios
- Configurar prefijos para códigos

### 5. Dashboard Funcionario
- Cola de turnos asignados
- Panel de atención principal
- Botones de acción (Llamar, Rellamar, Cerrar)

### 6. Dashboard VAP
- Interfaz tipo kiosko
- Botones grandes touch-friendly
- Selección de servicio y prioridad
- Visualización del turno generado

### 7. Pantalla Pública
- Modo oscuro (estilo aeropuerto)
- Turno actual grande y visible
- Lista de turnos recientes
- Actualización en tiempo real

### 8. Reportes
- Filtros por fecha, servicio, funcionario, prioridad
- Vista previa de datos
- Exportación a Excel

### 9. Configuración
- Habilitar/deshabilitar impresión
- Configurar prioridades
- Ajustes del sistema

## Impresión de Tickets Térmicos

### Configuración de Impresora

El sistema está preparado para impresoras térmicas XPrinter XP-58 con protocolo ESC-POS.

**Actualmente implementado:**
- Mock de impresión (log en consola)
- Estructura de comandos ESC-POS preparada

**Para habilitar impresión real:**
1. Conectar impresora térmica
2. Instalar drivers en el servidor
3. Implementar envío de comandos ESC-POS al dispositivo
4. Configurar ruta del dispositivo en backend

### Formato del Ticket

```
=============================
        UNAD
  Sistema de Turnos
=============================

  Turno: A-001
  Servicio: Registro Académico
  Prioridad: Discapacidad
  
  Fecha: 2024-12-11 10:30:15
  
  Por favor espere su turno
  
=============================
```

## MongoDB en Equipo Local

Ver archivo `INSTRUCCIONES_MONGODB.md` para configuración detallada de:
- Instalación de MongoDB en equipo local
- Configuración de acceso remoto
- Seguridad y autenticación
- Conexión desde VPS en la nube

## Seguridad

### Implementado
- ✅ Autenticación JWT
- ✅ Encriptación de contraseñas con Bcrypt
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Validación de datos con Pydantic
- ✅ CORS configurado
- ✅ HTTPS en producción

### Recomendaciones Adicionales
- Implementar rate limiting
- Configurar autenticación en MongoDB
- Usar VPN para conexión a base de datos remota
- Implementar logs de auditoría
- Configurar backups automáticos

## Arquitectura de Datos

### Colecciones MongoDB

**usuarios**
```json
{
  "id": "uuid",
  "nombre": "string",
  "email": "string",
  "password_hash": "string",
  "rol": "administrador|funcionario|vap",
  "activo": "boolean",
  "servicios_asignados": ["servicio_id"],
  "fecha_creacion": "ISO datetime"
}
```

**servicios**
```json
{
  "id": "uuid",
  "nombre": "string",
  "prefijo": "string",
  "activo": "boolean",
  "fecha_creacion": "ISO datetime"
}
```

**turnos**
```json
{
  "id": "uuid",
  "codigo": "string",
  "servicio_id": "string",
  "servicio_nombre": "string",
  "prioridad": "string|null",
  "estado": "espera|llamado|cerrado",
  "funcionario_id": "string|null",
  "funcionario_nombre": "string|null",
  "fecha_creacion": "ISO datetime",
  "fecha_llamado": "ISO datetime|null",
  "fecha_cierre": "ISO datetime|null",
  "tiempo_espera": "integer|null",
  "tiempo_atencion": "integer|null"
}
```

**configuracion**
```json
{
  "impresion_habilitada": "boolean",
  "prioridades": ["string"]
}
```

## Métricas y Reportes

### Métricas Disponibles
- Turnos generados por día/semana/mes
- Tiempo promedio de espera
- Tiempo promedio de atención
- Turnos por servicio
- Turnos por funcionario
- Distribución de prioridades
- Horas pico de atención

### Exportación
Todos los reportes pueden exportarse a Excel con:
- Formato profesional
- Colores institucionales
- Filtros aplicados
- Metadatos incluidos

## Troubleshooting

### Backend no inicia
```bash
tail -n 50 /var/log/supervisor/backend.err.log
```

### Frontend no carga
```bash
tail -n 50 /var/log/supervisor/frontend.err.log
```

### WebSocket no conecta
- Verificar que backend esté corriendo
- Verificar CORS_ORIGINS en .env
- Verificar firewall permite WebSocket

### MongoDB connection refused
- Verificar que MongoDB esté corriendo: `sudo systemctl status mongod`
- Verificar MONGO_URL en .env
- Verificar firewall si es remoto

## Soporte

Para soporte técnico o consultas:
- Email: soporte@unad.edu.co
- Documentación: Ver archivos en `/app/`

## Licencia

Sistema desarrollado para la Universidad Nacional Abierta y a Distancia (UNAD).
Todos los derechos reservados © 2024 UNAD.

## Créditos

Desarrollado con ❤️ usando:
- FastAPI
- React
- MongoDB
- Socket.IO
- Tailwind CSS
- Shadcn/UI
