# Configuración de MySQL (XAMPP) para Sistema de Turnos UNAD

## Arquitectura

```
┌─────────────────────────┐                    ┌─────────────────────────┐
│      VPS (Nube)         │                    │   Servidor Local        │
│      72.61.73.65        │                    │   (Tu entidad)          │
│                         │     Internet       │                         │
│  ┌─────────────────┐   │                    │  ┌─────────────────┐   │
│  │ Frontend React  │   │                    │  │  XAMPP + MySQL   │   │
│  │    Puerto 80    │   │                    │  │   Puerto 3306    │   │
│  └─────────────────┘   │     Puerto 3306    │  └─────────────────┘   │
│                         │ ◄─────────────────►│                         │
│  ┌─────────────────┐   │                    │  Base de datos:         │
│  │ Backend FastAPI │   │                    │  turnos_unad            │
│  │   Puerto 8001   │───┼────────────────────┼──►                      │
│  └─────────────────┘   │                    │                         │
│                         │                    │                         │
└─────────────────────────┘                    └─────────────────────────┘
```

---

## PASO 1: Configurar XAMPP para Conexiones Remotas

### 1.1 Editar configuración de MySQL

Abre el archivo: `C:\xampp\mysql\bin\my.ini`

Busca la línea:
```ini
bind-address = 127.0.0.1
```

Cámbiala por:
```ini
bind-address = 0.0.0.0
```

### 1.2 Reiniciar MySQL
1. Abre el Panel de Control de XAMPP
2. Detén MySQL (clic en "Stop")
3. Inicia MySQL nuevamente (clic en "Start")

---

## PASO 2: Crear Usuario con Acceso Remoto

### 2.1 Abrir phpMyAdmin
1. Abre el navegador
2. Ve a: `http://localhost/phpmyadmin`

### 2.2 Crear usuario para el VPS
1. Clic en la pestaña **"Cuentas de usuario"** (User accounts)
2. Clic en **"Agregar cuenta de usuario"** (Add user account)
3. Completa:
   - **Nombre de usuario:** `turnos_unad`
   - **Nombre del host:** `%` (permite cualquier IP) o `72.61.73.65` (solo tu VPS)
   - **Contraseña:** `TuContraseñaSegura123!`
   - **Re-escribir:** La misma contraseña

4. En **"Base de datos para el usuario"** selecciona:
   - ✅ Crear base de datos con el mismo nombre y otorgar todos los privilegios

5. En **"Privilegios globales"** marca:
   - ✅ SELECT, INSERT, UPDATE, DELETE
   - ✅ CREATE, DROP, ALTER
   - ✅ INDEX

6. Clic en **"Continuar"** o **"Go"**

### 2.3 O usar SQL directamente
En la pestaña "SQL" ejecuta:

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS turnos_unad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario con acceso remoto
CREATE USER 'turnos_unad'@'%' IDENTIFIED BY 'TuContraseñaSegura123!';

-- Dar permisos
GRANT ALL PRIVILEGES ON turnos_unad.* TO 'turnos_unad'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;
```

---

## PASO 3: Configurar Firewall de Windows

### 3.1 Abrir puerto 3306
1. Presiona `Win + R`, escribe `wf.msc` y Enter
2. Clic en **"Reglas de entrada"** (Inbound Rules)
3. Clic en **"Nueva regla..."** (New Rule)
4. Selecciona **"Puerto"** → Siguiente
5. Selecciona **"TCP"** y **"Puertos locales específicos:"** `3306` → Siguiente
6. Selecciona **"Permitir la conexión"** → Siguiente
7. Marca: ✅ Dominio, ✅ Privado, ✅ Público → Siguiente
8. Nombre: `MySQL XAMPP` → Finalizar

---

## PASO 4: Configurar Router/Firewall de la Entidad

### 4.1 Port Forwarding (Redirección de puertos)
Solicita a TI que configure:
- **Puerto externo:** 3306
- **Puerto interno:** 3306
- **IP interna:** La IP local del servidor con XAMPP (ej: 192.168.1.100)
- **Protocolo:** TCP

### 4.2 Restricción por IP (Recomendado)
Para mayor seguridad, permite solo la IP del VPS:
- **IP origen permitida:** `72.61.73.65`
- **Puerto destino:** 3306

---

## PASO 5: Obtener IP Pública de tu Servidor

Para saber tu IP pública, desde el servidor local:
1. Abre: https://www.cualesmiip.com/
2. O ejecuta en CMD: `curl ifconfig.me`

Anota esta IP: `_______________`

---

## PASO 6: Configurar el VPS

### 6.1 Actualizar .env en el VPS

Conéctate a tu VPS y edita:
```bash
nano /root/app/backend/.env
```

Cambia el contenido por:
```env
# Configuración MySQL
MYSQL_HOST=TU_IP_PUBLICA_SERVIDOR_LOCAL
MYSQL_PORT=3306
MYSQL_USER=turnos_unad
MYSQL_PASSWORD=TuContraseñaSegura123!
MYSQL_DATABASE=turnos_unad

# Seguridad
SECRET_KEY=tu-clave-secreta-muy-larga-y-segura

# CORS
CORS_ORIGINS=*
```

**Reemplaza:**
- `TU_IP_PUBLICA_SERVIDOR_LOCAL` → La IP pública de tu servidor local (paso 5)
- `TuContraseñaSegura123!` → La contraseña que creaste en el paso 2

### 6.2 Actualizar código y dependencias
```bash
cd /root/app
git pull origin main

cd backend
pip install -r requirements.txt
```

### 6.3 Inicializar base de datos
```bash
python3 init_db.py
```

Deberías ver:
```
✅ Base de datos 'turnos_unad' verificada/creada
✅ Tabla 'usuarios' creada
✅ Tabla 'servicios' creada
✅ Tabla 'clientes' creada
✅ Tabla 'turnos' creada
✅ Tabla 'configuracion' creada
✅ BASE DE DATOS INICIALIZADA EXITOSAMENTE
```

### 6.4 Reiniciar el backend
```bash
pm2 restart turnos-backend
pm2 logs turnos-backend
```

---

## PASO 7: Probar Conexión

### 7.1 Desde el VPS, probar conexión a MySQL:
```bash
python3 -c "
import pymysql
conn = pymysql.connect(
    host='TU_IP_PUBLICA',
    port=3306,
    user='turnos_unad',
    password='TuContraseñaSegura123!',
    database='turnos_unad'
)
print('✅ Conexión exitosa!')
conn.close()
"
```

### 7.2 Probar el API:
```bash
curl http://localhost:8001/api/health
```

Debe responder:
```json
{"status": "ok", "database": "connected"}
```

### 7.3 Probar desde navegador:
Abre: `http://72.61.73.65`

---

## Solución de Problemas

### Error: "Can't connect to MySQL server"
1. Verifica que XAMPP y MySQL estén corriendo
2. Verifica que el puerto 3306 esté abierto en el firewall
3. Verifica que el router redirija el puerto correctamente
4. Prueba la conexión desde otra PC en la red local

### Error: "Access denied for user"
1. Verifica usuario y contraseña
2. Verifica que el usuario tenga permisos para la IP del VPS
3. Ejecuta de nuevo los comandos SQL del paso 2.3

### Error: "Unknown database"
1. Ejecuta `init_db.py` para crear las tablas
2. O crea la base de datos manualmente en phpMyAdmin

---

## Checklist Final

- [ ] XAMPP instalado y MySQL corriendo
- [ ] `bind-address = 0.0.0.0` en my.ini
- [ ] Usuario `turnos_unad` creado con acceso remoto
- [ ] Puerto 3306 abierto en firewall de Windows
- [ ] Puerto 3306 redirigido en router
- [ ] IP pública conocida
- [ ] `.env` actualizado en VPS
- [ ] `init_db.py` ejecutado exitosamente
- [ ] Backend reiniciado con PM2
- [ ] Login funcionando en el navegador

---

## Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@unad.edu.co | admin123 |
| Funcionario | funcionario@unad.edu.co | func123 |
| VAP | vap@unad.edu.co | vap123 |
