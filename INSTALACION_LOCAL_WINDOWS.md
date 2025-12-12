# 🖥️ Instalación Local - Sistema de Turnos UNAD
## Tu PC como Servidor (Windows 10/11)

Esta guía te permite instalar el sistema completo en tu PC y acceder desde otros equipos de la red local.

---

## Requisitos Mínimos

- Windows 10/11
- 4 GB RAM (8 GB recomendado)
- 10 GB espacio en disco
- Conexión a red local (WiFi o cable)

---

## PASO 1: Instalar Node.js

1. Descarga Node.js LTS desde: https://nodejs.org/
2. Ejecuta el instalador
3. Marca todas las opciones por defecto
4. Marca "Automatically install the necessary tools"

**Verificar instalación:**
Abre PowerShell y ejecuta:
```powershell
node --version
npm --version
```

Instala Yarn:
```powershell
npm install -g yarn
```

---

## PASO 2: Instalar Python

1. Descarga Python desde: https://www.python.org/downloads/
2. **IMPORTANTE:** Marca ✅ "Add Python to PATH"
3. Clic en "Install Now"

**Verificar instalación:**
```powershell
python --version
pip --version
```

---

## PASO 3: Instalar MongoDB

1. Descarga MongoDB Community desde: https://www.mongodb.com/try/download/community
   - Version: 7.0 (o más reciente)
   - Platform: Windows
   - Package: MSI

2. Ejecuta el instalador:
   - Selecciona "Complete"
   - ✅ Marca "Install MongoDB as a Service"
   - ✅ Marca "Install MongoDB Compass"

3. MongoDB se iniciará automáticamente como servicio de Windows

**Verificar:**
Abre MongoDB Compass y conecta a: `mongodb://localhost:27017`

---

## PASO 4: Instalar Git

1. Descarga Git desde: https://git-scm.com/download/win
2. Instala con opciones por defecto

---

## PASO 5: Descargar el Código

Abre PowerShell y ejecuta:
```powershell
cd C:\
git clone https://github.com/cristian138/turnos_act_unad.git turnos-unad
cd turnos-unad
```

---

## PASO 6: Configurar el Backend

```powershell
cd C:\turnos-unad\backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
.\venv\Scripts\Activate

# Instalar dependencias
pip install -r requirements.txt
```

### Crear archivo .env:
```powershell
notepad .env
```

Pega este contenido:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=turnos_unad
SECRET_KEY=clave-secreta-super-segura-unad-2024-local
```

Guarda y cierra.

### Inicializar base de datos:
```powershell
python init_db.py
```

---

## PASO 7: Obtener tu IP Local

```powershell
ipconfig
```

Busca "Dirección IPv4" en tu adaptador de red (WiFi o Ethernet).
Ejemplo: `192.168.1.100`

**Anota tu IP:** `_______________`

---

## PASO 8: Configurar el Frontend

```powershell
cd C:\turnos-unad\frontend

# Instalar dependencias
yarn install
```

### Crear archivo .env:
```powershell
notepad .env
```

Pega este contenido (reemplaza con TU IP):
```env
REACT_APP_BACKEND_URL=http://192.168.1.100:8001
```

Guarda y cierra.

### Compilar el frontend:
```powershell
yarn build
```

---

## PASO 9: Instalar Servidor Web (serve)

```powershell
npm install -g serve
```

---

## PASO 10: Configurar Firewall de Windows

### Abrir puertos necesarios:

1. Presiona `Win + R`, escribe `wf.msc`, Enter
2. Clic en **"Reglas de entrada"**
3. Para cada puerto (3000, 8001), crear regla:
   - Clic en **"Nueva regla..."**
   - **Puerto** → Siguiente
   - **TCP**, puerto **3000** → Siguiente
   - **Permitir conexión** → Siguiente
   - Marca todo → Siguiente
   - Nombre: "Sistema Turnos Frontend" → Finalizar

4. Repetir para puerto **8001** (nombre: "Sistema Turnos Backend")

### O usar PowerShell (más rápido):
```powershell
# Ejecutar como Administrador
netsh advfirewall firewall add rule name="Turnos Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Turnos Backend" dir=in action=allow protocol=TCP localport=8001
```

---

## PASO 11: Crear Scripts de Inicio

### Crear archivo `iniciar-backend.bat`:
```powershell
notepad C:\turnos-unad\iniciar-backend.bat
```

Contenido:
```batch
@echo off
cd C:\turnos-unad\backend
call venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001
pause
```

### Crear archivo `iniciar-frontend.bat`:
```powershell
notepad C:\turnos-unad\iniciar-frontend.bat
```

Contenido:
```batch
@echo off
cd C:\turnos-unad\frontend
serve -s build -l 3000
pause
```

### Crear archivo `iniciar-todo.bat`:
```powershell
notepad C:\turnos-unad\iniciar-todo.bat
```

Contenido:
```batch
@echo off
echo Iniciando Sistema de Turnos UNAD...
echo.

echo [1/2] Iniciando Backend...
start "Backend Turnos" cmd /k "cd C:\turnos-unad\backend && venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001"

timeout /t 5

echo [2/2] Iniciando Frontend...
start "Frontend Turnos" cmd /k "cd C:\turnos-unad\frontend && serve -s build -l 3000"

echo.
echo ============================================
echo Sistema iniciado correctamente!
echo.
echo Accede desde este equipo:
echo   http://localhost:3000
echo.
echo Accede desde otros equipos:
echo   http://TU_IP:3000
echo ============================================
pause
```

**Reemplaza `TU_IP` con tu IP real (ej: 192.168.1.100)**

---

## PASO 12: Iniciar el Sistema

Doble clic en: `C:\turnos-unad\iniciar-todo.bat`

Se abrirán dos ventanas de comandos (no las cierres).

---

## PASO 13: Probar el Sistema

### Desde tu PC:
Abre el navegador: `http://localhost:3000`

### Desde otros equipos de la red:
Abre el navegador: `http://192.168.1.100:3000` (usa tu IP real)

### Credenciales:
| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@unad.edu.co | admin123 |
| Funcionario | funcionario@unad.edu.co | func123 |
| VAP | vap@unad.edu.co | vap123 |

---

## PASO 14: Inicio Automático con Windows (Opcional)

Para que el sistema inicie automáticamente al encender la PC:

1. Presiona `Win + R`, escribe `shell:startup`, Enter
2. Copia el archivo `iniciar-todo.bat` a esa carpeta
3. O crea un acceso directo del archivo ahí

---

## Configuración para Pantalla Pública

En el TV o monitor de la sala de espera:

1. Conecta el TV/monitor a la red (WiFi o cable)
2. Abre el navegador (Chrome recomendado)
3. Ve a: `http://192.168.1.100:3000/pantalla-publica`
4. Presiona F11 para pantalla completa

### Configurar Chrome en modo kiosco (opcional):
Crea un acceso directo con:
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk http://192.168.1.100:3000/pantalla-publica
```

---

## Solución de Problemas

### "No se puede acceder desde otro equipo"
1. Verifica que ambos equipos estén en la misma red
2. Verifica las reglas del firewall (paso 10)
3. Prueba hacer ping: `ping 192.168.1.100`
4. Asegúrate de usar la IP correcta

### "Error de conexión a MongoDB"
1. Abre "Servicios" (Win + R → services.msc)
2. Busca "MongoDB Server"
3. Asegúrate de que esté "En ejecución"
4. Si no, clic derecho → Iniciar

### "El frontend no carga"
1. Verifica que ambas ventanas de comandos estén abiertas
2. Revisa si hay errores en la ventana del Backend
3. Recompila el frontend: `yarn build`

### "La IP cambió"
Si tu router asigna IPs dinámicas:
1. Configura IP estática en tu PC
2. O actualiza el archivo `.env` del frontend con la nueva IP
3. Recompila: `yarn build`

---

## Configurar IP Estática (Recomendado)

Para que tu IP no cambie:

1. Panel de Control → Redes e Internet → Centro de redes
2. Clic en tu conexión (WiFi o Ethernet)
3. Propiedades → Protocolo de Internet versión 4
4. "Usar la siguiente dirección IP":
   - IP: 192.168.1.100 (o la que quieras)
   - Máscara: 255.255.255.0
   - Puerta de enlace: 192.168.1.1 (tu router)
   - DNS: 8.8.8.8

---

## Estructura de Archivos Final

```
C:\turnos-unad\
├── backend\
│   ├── venv\
│   ├── server.py
│   ├── init_db.py
│   ├── requirements.txt
│   └── .env
├── frontend\
│   ├── build\
│   ├── src\
│   ├── package.json
│   └── .env
├── iniciar-backend.bat
├── iniciar-frontend.bat
└── iniciar-todo.bat
```

---

## Comandos Útiles

### Detener el sistema:
Cierra las dos ventanas de comandos (Backend y Frontend)

### Ver logs del backend:
Los logs aparecen en la ventana "Backend Turnos"

### Actualizar código:
```powershell
cd C:\turnos-unad
git pull origin main
cd backend
pip install -r requirements.txt
cd ..\frontend
yarn install
yarn build
```

---

## URLs del Sistema

| Página | URL |
|--------|-----|
| Login | http://TU_IP:3000 |
| Dashboard Admin | http://TU_IP:3000/dashboard |
| VAP (Generar turnos) | http://TU_IP:3000/dashboard |
| Pantalla Pública | http://TU_IP:3000/pantalla-publica |
| Usuarios | http://TU_IP:3000/usuarios |
| Servicios | http://TU_IP:3000/servicios |
| Reportes | http://TU_IP:3000/reportes |

Reemplaza `TU_IP` con tu IP local (ej: 192.168.1.100)
