# 🚀 Guía Completa de Instalación - Sistema de Turnos UNAD
## VPS Ubuntu 22.04/24.04 (Instalación Limpia)

---

## 📋 Requisitos Previos
- VPS con Ubuntu 22.04 o 24.04
- Mínimo 1GB RAM, 1 CPU, 20GB disco
- Acceso root o usuario con sudo
- Dominio apuntando al VPS (opcional pero recomendado)

---

## PASO 1: Actualizar el Sistema

```bash
# Conectarse al VPS
ssh root@TU_IP_DEL_VPS

# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl wget git nano unzip software-properties-common
```

---

## PASO 2: Instalar Node.js 20.x

```bash
# Agregar repositorio de Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x

# Instalar Yarn globalmente
sudo npm install -g yarn

# Verificar Yarn
yarn --version
```

---

## PASO 3: Instalar Python 3.11+

```bash
# Instalar Python y pip
sudo apt install -y python3 python3-pip python3-venv

# Verificar instalación
python3 --version  # Debe mostrar 3.10+ 
pip3 --version
```

---

## PASO 4: Instalar MongoDB

```bash
# Importar clave GPG de MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Agregar repositorio (Ubuntu 22.04)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Para Ubuntu 24.04, usar:
# echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" | \
#    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Actualizar e instalar MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Iniciar y habilitar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar que está corriendo
sudo systemctl status mongod
```

---

## PASO 5: Instalar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar y habilitar
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar
sudo systemctl status nginx
```

---

## PASO 6: Instalar PM2 (Gestor de Procesos)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar
pm2 --version
```

---

## PASO 7: Crear Usuario para la Aplicación (Recomendado)

```bash
# Crear usuario 'turnos'
sudo adduser turnos

# Agregar al grupo sudo (opcional)
sudo usermod -aG sudo turnos

# Cambiar a ese usuario
su - turnos
```

---

## PASO 8: Descargar el Código de la Aplicación

### Opción A: Desde GitHub (si tienes el repo)
```bash
cd /home/turnos
git clone https://github.com/TU_USUARIO/turnos-unad.git app
cd app
```

### Opción B: Transferir desde tu máquina local con SCP
```bash
# Desde tu máquina local, ejecutar:
scp -r /ruta/a/tu/proyecto turnos@TU_IP_VPS:/home/turnos/app
```

### Opción C: Descargar desde Emergent
```bash
# Si descargaste el código como ZIP desde Emergent
cd /home/turnos
unzip turnos-unad.zip -d app
cd app
```

---

## PASO 9: Configurar el Backend

```bash
cd /home/turnos/app/backend

# Crear entorno virtual de Python
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# Crear archivo .env
nano .env
```

### Contenido del archivo `.env` del backend:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=turnos_unad
SECRET_KEY=CAMBIA_ESTO_POR_UNA_CLAVE_SEGURA_DE_32_CARACTERES
```

**Genera una clave segura:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Inicializar la base de datos:
```bash
# Asegúrate de estar en el entorno virtual
source venv/bin/activate

# Ejecutar script de inicialización
python3 init_db.py

# Deberías ver: "Base de datos inicializada correctamente"
```

---

## PASO 10: Configurar el Frontend

```bash
cd /home/turnos/app/frontend

# Instalar dependencias
yarn install

# Crear archivo .env
nano .env
```

### Contenido del archivo `.env` del frontend:
```env
REACT_APP_BACKEND_URL=https://tu-dominio.com
```

**⚠️ IMPORTANTE:** Cambia `tu-dominio.com` por tu dominio real o IP pública.

### Compilar el frontend para producción:
```bash
yarn build
```

Esto creará la carpeta `build/` con los archivos estáticos.

---

## PASO 11: Configurar PM2 para el Backend

```bash
cd /home/turnos/app/backend

# Crear archivo de configuración PM2
nano ecosystem.config.js
```

### Contenido de `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'turnos-backend',
    script: 'venv/bin/uvicorn',
    args: 'server:app --host 0.0.0.0 --port 8001',
    cwd: '/home/turnos/app/backend',
    env: {
      MONGO_URL: 'mongodb://localhost:27017',
      DB_NAME: 'turnos_unad',
      SECRET_KEY: 'TU_CLAVE_SECRETA_AQUI'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

### Iniciar el backend con PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Ejecutar el comando que PM2 te muestre** (algo como `sudo env PATH=$PATH...`)

### Verificar que está corriendo:
```bash
pm2 status
pm2 logs turnos-backend
```

---

## PASO 12: Configurar Nginx

```bash
# Crear configuración del sitio
sudo nano /etc/nginx/sites-available/turnos-unad
```

### Contenido de la configuración Nginx:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;  # Cambiar por tu dominio o IP

    # Logs
    access_log /var/log/nginx/turnos-unad-access.log;
    error_log /var/log/nginx/turnos-unad-error.log;

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket (Socket.IO)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Frontend (archivos estáticos)
    location / {
        root /home/turnos/app/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### Habilitar el sitio:
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/turnos-unad /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Si dice "syntax is ok", reiniciar Nginx
sudo systemctl restart nginx
```

---

## PASO 13: Configurar Firewall (UFW)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP y HTTPS
sudo ufw allow 'Nginx Full'

# Verificar reglas
sudo ufw status
```

---

## PASO 14: Instalar Certificado SSL (HTTPS) - RECOMENDADO

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL (reemplaza con tu dominio)
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Seguir las instrucciones en pantalla
# Seleccionar opción para redirigir HTTP a HTTPS

# Verificar renovación automática
sudo certbot renew --dry-run
```

---

## PASO 15: Verificar la Instalación

### Probar el backend:
```bash
curl http://localhost:8001/api/health
# Debe devolver algo como {"status": "ok"}

curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@unad.edu.co","password":"admin123"}'
# Debe devolver un token JWT
```

### Probar desde el navegador:
1. Abre `https://tu-dominio.com` (o `http://TU_IP`)
2. Deberías ver la página de login del sistema de turnos
3. Inicia sesión con: `admin@unad.edu.co` / `admin123`

---

## 🔧 Comandos Útiles

### Gestión de PM2:
```bash
pm2 status                    # Ver estado de procesos
pm2 logs turnos-backend       # Ver logs en tiempo real
pm2 restart turnos-backend    # Reiniciar backend
pm2 stop turnos-backend       # Detener backend
pm2 delete turnos-backend     # Eliminar proceso
```

### Gestión de Nginx:
```bash
sudo systemctl status nginx   # Ver estado
sudo systemctl restart nginx  # Reiniciar
sudo nginx -t                 # Probar configuración
sudo tail -f /var/log/nginx/turnos-unad-error.log  # Ver errores
```

### Gestión de MongoDB:
```bash
sudo systemctl status mongod  # Ver estado
sudo systemctl restart mongod # Reiniciar
mongosh                       # Conectar a MongoDB
```

---

## 🐛 Solución de Problemas

### Error: "502 Bad Gateway"
```bash
# Verificar que el backend está corriendo
pm2 status
pm2 logs turnos-backend

# Si no está corriendo, iniciarlo
pm2 start ecosystem.config.js
```

### Error: "Connection refused" en MongoDB
```bash
# Verificar estado de MongoDB
sudo systemctl status mongod

# Si no está corriendo
sudo systemctl start mongod
```

### WebSocket no conecta
```bash
# Verificar configuración de Nginx
sudo nginx -t

# Verificar que los headers están bien
sudo cat /etc/nginx/sites-available/turnos-unad | grep -A5 socket.io
```

### Permisos de archivos
```bash
# Asegurar permisos correctos
sudo chown -R turnos:turnos /home/turnos/app
chmod -R 755 /home/turnos/app
```

---

## 📊 Credenciales por Defecto

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@unad.edu.co | admin123 |
| Funcionario | funcionario@unad.edu.co | func123 |
| VAP | vap@unad.edu.co | vap123 |

**⚠️ IMPORTANTE:** Cambia estas contraseñas después de la instalación desde el panel de administración.

---

## ✅ Checklist Final

- [ ] Sistema actualizado
- [ ] Node.js 20.x instalado
- [ ] Python 3.11+ instalado
- [ ] MongoDB instalado y corriendo
- [ ] Nginx instalado y corriendo
- [ ] PM2 instalado
- [ ] Código descargado
- [ ] Backend configurado (.env)
- [ ] Frontend configurado (.env) y compilado
- [ ] PM2 corriendo el backend
- [ ] Nginx configurado
- [ ] Firewall configurado
- [ ] SSL instalado (opcional)
- [ ] Aplicación accesible desde navegador
- [ ] Login funcionando

---

## 📞 Soporte

Si tienes problemas, proporciona:
1. Salida de `pm2 logs turnos-backend`
2. Salida de `sudo tail -50 /var/log/nginx/turnos-unad-error.log`
3. Capturas de la consola del navegador (F12 > Console)
