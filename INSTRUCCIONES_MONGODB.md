# Instrucciones para Configurar MongoDB Local

## Requisito: MongoDB en Equipo Local Conectado desde VPS Ubuntu

El sistema está diseñado para que **la base de datos MongoDB esté en un equipo local** y el **backend/frontend estén en un VPS Ubuntu en la nube**.

## Pasos para Configuración

### 1. Instalar MongoDB en el Equipo Local

```bash
# En Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb

# En Windows
# Descargar desde: https://www.mongodb.com/try/download/community
```

### 2. Configurar MongoDB para Aceptar Conexiones Remotas

Editar el archivo de configuración de MongoDB:

```bash
# Linux
sudo nano /etc/mongod.conf

# Windows
# C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg
```

Cambiar la línea de `bindIp`:

```yaml
net:
  port: 27017
  bindIp: 0.0.0.0  # Permitir conexiones desde cualquier IP
```

Reiniciar MongoDB:

```bash
# Linux
sudo systemctl restart mongod

# Windows
net stop MongoDB
net start MongoDB
```

### 3. Configurar Firewall en el Equipo Local

**Linux:**
```bash
sudo ufw allow 27017
```

**Windows:**
- Ir a Panel de Control → Firewall de Windows
- Agregar regla de entrada para puerto 27017

### 4. Obtener la IP Pública del Equipo Local

Visitar: https://www.whatismyip.com/

O ejecutar:
```bash
curl ifconfig.me
```

### 5. Configurar el VPS

En el servidor VPS, editar `/app/backend/.env`:

```bash
MONGO_URL="mongodb://IP_PUBLICA_EQUIPO_LOCAL:27017"
DB_NAME="unad_turnos"
CORS_ORIGINS="*"
SECRET_KEY="tu-clave-secreta-super-segura-cambiala-en-produccion-unad-2024"
```

Reemplazar `IP_PUBLICA_EQUIPO_LOCAL` con la IP obtenida en el paso 4.

### 6. Probar la Conexión

Desde el VPS:

```bash
mongo --host IP_PUBLICA_EQUIPO_LOCAL --port 27017
```

### 7. Reiniciar el Backend

```bash
sudo supervisorctl restart backend
```

### 8. Inicializar la Base de Datos

```bash
cd /app/backend
python init_db.py
```

## Seguridad Adicional (Recomendado)

### Autenticación en MongoDB

1. Crear un usuario administrador:

```bash
mongo
use admin
db.createUser({
  user: "admin_unad",
  pwd: "contraseña_segura",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})
```

2. Habilitar autenticación en `mongod.conf`:

```yaml
security:
  authorization: enabled
```

3. Actualizar la URL de conexión:

```bash
MONGO_URL="mongodb://admin_unad:contraseña_segura@IP_PUBLICA:27017/unad_turnos?authSource=admin"
```

### VPN (Alternativa Más Segura)

En lugar de exponer MongoDB directamente, considera usar una VPN como:
- WireGuard
- OpenVPN
- Tailscale

Esto permite conectar el VPS y el equipo local de forma segura sin exponer puertos públicamente.

## Troubleshooting

### Error: "Connection refused"
- Verificar que MongoDB esté corriendo: `sudo systemctl status mongod`
- Verificar firewall: `sudo ufw status`
- Verificar que `bindIp` esté configurado correctamente

### Error: "Authentication failed"
- Verificar credenciales en MONGO_URL
- Verificar que el usuario tenga permisos correctos

### Error: "Timeout"
- Verificar que la IP pública sea la correcta
- Verificar que el router tenga port forwarding configurado para el puerto 27017

## Configuración Actual (Desarrollo)

Actualmente el sistema usa MongoDB local en el mismo servidor (`localhost:27017`) para desarrollo y pruebas.

Para producción, sigue los pasos anteriores para conectar a una base de datos remota.
