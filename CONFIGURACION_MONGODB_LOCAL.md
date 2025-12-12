# Configuración de MongoDB Local para Sistema de Turnos UNAD

## Arquitectura

El sistema funcionará así:
- **VPS (72.61.73.65)**: Frontend + Backend API
- **Servidor Local (tu entidad)**: MongoDB con los datos

---

## OPCIÓN A: MongoDB en Windows (Recomendado para tu caso)

### Paso 1: Descargar e Instalar MongoDB

1. Descarga MongoDB Community Server desde:
   https://www.mongodb.com/try/download/community

2. Selecciona:
   - Version: 7.0 (o la más reciente)
   - Platform: Windows
   - Package: MSI

3. Ejecuta el instalador:
   - Selecciona "Complete"
   - ✅ Marca "Install MongoDB as a Service"
   - ✅ Marca "Install MongoDB Compass" (herramienta gráfica)

### Paso 2: Configurar MongoDB para Conexiones Remotas

1. Abre el archivo de configuración:
   ```
   C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg
   ```

2. Busca la sección `net:` y modifícala:
   ```yaml
   net:
     port: 27017
     bindIp: 0.0.0.0
   ```

3. Agrega autenticación (IMPORTANTE para seguridad):
   ```yaml
   security:
     authorization: enabled
   ```

   El archivo completo debería verse así:
   ```yaml
   storage:
     dbPath: C:\Program Files\MongoDB\Server\7.0\data
   
   systemLog:
     destination: file
     path: C:\Program Files\MongoDB\Server\7.0\log\mongod.log
     logAppend: true
   
   net:
     port: 27017
     bindIp: 0.0.0.0
   
   security:
     authorization: enabled
   ```

4. Guarda el archivo

### Paso 3: Crear Usuario Administrador

1. Abre **MongoDB Compass** o **PowerShell**

2. Si usas PowerShell, conecta a MongoDB:
   ```powershell
   cd "C:\Program Files\MongoDB\Server\7.0\bin"
   .\mongosh.exe
   ```

3. Crea el usuario administrador:
   ```javascript
   use admin
   db.createUser({
     user: "adminUnad",
     pwd: "TuPasswordSeguro123!",
     roles: [{ role: "root", db: "admin" }]
   })
   ```

4. Crea la base de datos y usuario para la aplicación:
   ```javascript
   use turnos_unad
   db.createUser({
     user: "turnos_user",
     pwd: "TurnosUnad2024!",
     roles: [{ role: "readWrite", db: "turnos_unad" }]
   })
   ```

5. Sal de mongosh:
   ```javascript
   exit
   ```

### Paso 4: Reiniciar MongoDB

1. Abre "Servicios" de Windows (Win + R, escribe `services.msc`)
2. Busca "MongoDB Server"
3. Clic derecho → Reiniciar

### Paso 5: Probar Conexión Local

```powershell
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongosh.exe "mongodb://turnos_user:TurnosUnad2024!@localhost:27017/turnos_unad"
```

Si conecta correctamente, verás el prompt `turnos_unad>`

---

## Paso 6: Configurar Firewall de Windows

1. Presiona `Win + R`, escribe `wf.msc` y Enter
2. Clic en **"Reglas de entrada"**
3. Clic en **"Nueva regla..."**
4. Selecciona **"Puerto"** → Siguiente
5. **TCP** y **Puertos locales específicos:** `27017` → Siguiente
6. **"Permitir la conexión"** → Siguiente
7. Marca: ✅ Dominio, ✅ Privado, ✅ Público → Siguiente
8. Nombre: `MongoDB` → Finalizar

---

## Paso 7: Configurar Router de la Entidad

Solicita a TI que configure:

### Port Forwarding:
- **Puerto externo:** 27017
- **Puerto interno:** 27017
- **IP interna:** La IP local del servidor (ej: 192.168.1.100)
- **Protocolo:** TCP

### Restricción por IP (Recomendado):
- **IP origen permitida:** `72.61.73.65` (tu VPS)
- **Puerto destino:** 27017

---

## Paso 8: Obtener tu IP Pública

Desde el servidor local:
1. Abre: https://www.cualesmiip.com/
2. O en PowerShell: `(Invoke-WebRequest ifconfig.me).Content`

Anota esta IP: `_______________`

---

## Paso 9: Configurar el VPS

### 9.1 Conectar al VPS
```bash
ssh root@72.61.73.65
```

### 9.2 Actualizar el archivo .env
```bash
nano /root/app/backend/.env
```

Cambia el contenido por:
```env
MONGO_URL=mongodb://turnos_user:TurnosUnad2024!@TU_IP_PUBLICA:27017/turnos_unad?authSource=turnos_unad
DB_NAME=turnos_unad
SECRET_KEY=tu-clave-secreta-muy-larga-y-segura-unad-2024
```

**Reemplaza:**
- `TU_IP_PUBLICA` → La IP pública de tu servidor local (paso 8)
- `TurnosUnad2024!` → La contraseña que creaste en el paso 3

### 9.3 Actualizar código
```bash
cd /root/app
git pull origin main
```

### 9.4 Probar conexión desde VPS
```bash
cd /root/app/backend
source venv/bin/activate
python3 -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv('.env')
client = MongoClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
print('✅ Conexión exitosa!')
print(f'Base de datos: {db.name}')
print(f'Colecciones: {db.list_collection_names()}')
"
```

### 9.5 Inicializar base de datos
```bash
python3 init_db.py
```

### 9.6 Reiniciar backend
```bash
pm2 restart turnos-backend
pm2 logs turnos-backend
```

---

## Paso 10: Probar el Sistema

1. Abre tu navegador: `http://72.61.73.65`
2. Inicia sesión con: `admin@unad.edu.co` / `admin123`

---

## Solución de Problemas

### Error: "Connection refused"
1. Verifica que MongoDB esté corriendo:
   - Windows: Servicios → MongoDB Server → debe estar "En ejecución"
2. Verifica `bindIp: 0.0.0.0` en mongod.cfg
3. Verifica el firewall de Windows
4. Verifica el router/firewall de la entidad

### Error: "Authentication failed"
1. Verifica usuario y contraseña
2. Asegúrate de incluir `?authSource=turnos_unad` en la URL
3. Vuelve a crear el usuario si es necesario

### Error: "Network is unreachable"
1. El puerto 27017 no está abierto en el router
2. Verifica con: `telnet TU_IP_PUBLICA 27017` desde otra red

---

## Verificar desde otra red

Puedes probar desde tu celular (con datos móviles, no WiFi):
1. Descarga "MongoDB Compass" en tu PC personal
2. Conecta a: `mongodb://turnos_user:TurnosUnad2024!@TU_IP_PUBLICA:27017/turnos_unad`

Si conecta, el VPS también podrá conectar.

---

## Seguridad Adicional (Recomendado)

### Limitar acceso solo al VPS

En el router, configura que solo la IP `72.61.73.65` pueda acceder al puerto 27017.

### Usar conexión cifrada (SSL/TLS)

Para producción, considera configurar SSL en MongoDB. Esto requiere:
1. Certificado SSL
2. Configuración adicional en mongod.cfg
3. Modificar la URL de conexión

---

## Resumen de Credenciales

| Componente | Usuario | Contraseña |
|------------|---------|------------|
| MongoDB Admin | adminUnad | TuPasswordSeguro123! |
| MongoDB App | turnos_user | TurnosUnad2024! |
| Sistema - Admin | admin@unad.edu.co | admin123 |
| Sistema - Funcionario | funcionario@unad.edu.co | func123 |
| Sistema - VAP | vap@unad.edu.co | vap123 |

---

## Checklist Final

- [ ] MongoDB instalado en servidor local
- [ ] `bindIp: 0.0.0.0` configurado
- [ ] `authorization: enabled` configurado
- [ ] Usuario `turnos_user` creado
- [ ] Puerto 27017 abierto en firewall Windows
- [ ] Puerto 27017 redirigido en router
- [ ] IP pública conocida
- [ ] `.env` actualizado en VPS con la IP correcta
- [ ] Conexión probada desde VPS
- [ ] `init_db.py` ejecutado
- [ ] Backend reiniciado
- [ ] Login funcionando en navegador
