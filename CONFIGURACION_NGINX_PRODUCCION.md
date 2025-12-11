# Configuración de Nginx para Producción - Sistema de Turnos UNAD

## Problema Identificado

Al desplegar la aplicación en un VPS con Nginx como proxy reverso, se presentan los siguientes errores:

1. **Duplicación de rutas**: `api/api/auth/login:1 Failed to load resource` - La ruta `/api` se está duplicando
2. **Fallo de WebSocket**: `WebSocket connection failed` - Nginx no está configurado para manejar conexiones WebSocket

## Solución

A continuación se presenta la configuración correcta de Nginx para resolver ambos problemas.

---

## Configuración de Nginx

### Archivo: `/etc/nginx/sites-available/turnos-unad`

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;  # Cambiar por tu dominio o IP

    # Redirigir a HTTPS (opcional pero recomendado)
    # return 301 https://$server_name$request_uri;

    # Logs
    access_log /var/log/nginx/turnos-unad-access.log;
    error_log /var/log/nginx/turnos-unad-error.log;

    # =====================================================
    # BACKEND API - Puerto 8001
    # =====================================================
    # IMPORTANTE: No incluir /api en proxy_pass para evitar duplicación
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # =====================================================
    # WEBSOCKET - Socket.IO
    # =====================================================
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8001/socket.io/;
        proxy_http_version 1.1;
        
        # Headers CRÍTICOS para WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts más largos para WebSocket
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # =====================================================
    # FRONTEND - Puerto 3000 (o archivos estáticos)
    # =====================================================
    location / {
        # Opción A: Si el frontend está corriendo en desarrollo (puerto 3000)
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket para hot reload de desarrollo (opcional)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Opción B: Si compilaste el frontend (npm run build)
        # root /ruta/a/tu/frontend/build;
        # index index.html;
        # try_files $uri $uri/ /index.html;
    }
}
```

---

## Configuración con HTTPS (Recomendado para Producción)

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # Certificados SSL (usar Certbot/Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    
    # Configuración SSL recomendada
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

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
    }

    # WebSocket
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

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Pasos de Instalación

### 1. Crear el archivo de configuración
```bash
sudo nano /etc/nginx/sites-available/turnos-unad
```
Pegar la configuración anterior y guardar.

### 2. Habilitar el sitio
```bash
sudo ln -s /etc/nginx/sites-available/turnos-unad /etc/nginx/sites-enabled/
```

### 3. Verificar la configuración
```bash
sudo nginx -t
```
Debe mostrar: `syntax is ok` y `test is successful`

### 4. Reiniciar Nginx
```bash
sudo systemctl restart nginx
```

### 5. (Opcional) Instalar certificado SSL con Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

---

## Verificación

### Probar API
```bash
curl -X POST https://tu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@unad.edu.co","password":"admin123"}'
```

### Probar WebSocket
Abrir la consola del navegador en la página y verificar que no hay errores de conexión WebSocket.

---

## Variables de Entorno en el VPS

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=turnos_unad
SECRET_KEY=tu_clave_secreta_muy_segura
```

### Frontend (.env o configuración de build)
```env
REACT_APP_BACKEND_URL=https://tu-dominio.com
```

**IMPORTANTE**: El frontend debe apuntar al dominio público (no a localhost) para que las llamadas API funcionen correctamente.

---

## Solución de Problemas Comunes

### Error: "502 Bad Gateway"
- Verificar que el backend está corriendo: `sudo systemctl status backend` o `pm2 status`
- Verificar logs: `sudo tail -f /var/log/nginx/turnos-unad-error.log`

### Error: "WebSocket connection failed"
- Verificar que los headers `Upgrade` y `Connection` están configurados
- Verificar que el puerto 8001 está accesible

### Error: "api/api/" duplicación
- Asegurarse de que `proxy_pass` termine con `/api/` (con slash al final)
- No duplicar `/api` en la URL del proxy

---

## Contacto y Soporte

Si tienes problemas adicionales, proporciona:
1. Salida de `sudo nginx -t`
2. Contenido de `/var/log/nginx/turnos-unad-error.log`
3. Captura de la consola del navegador con los errores
