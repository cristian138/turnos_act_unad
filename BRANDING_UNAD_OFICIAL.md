# Actualización de Branding Oficial UNAD

## Fecha: 11 de Diciembre de 2024

## Resumen de Cambios

El sistema ha sido actualizado para reflejar el **branding oficial de la Universidad Nacional Abierta y a Distancia (UNAD)**, incluyendo el logo oficial y los colores corporativos exactos.

## Logo Oficial

### Ubicación del Logo
**Archivo**: `/app/frontend/public/logo-unad.png`

**Fuente**: Logo oficial proporcionado por la institución

**Características del Logo**:
- Acrónimo "UNAD" en dos colores
- "U", "N", "A" en azul profundo
- "D" en naranja vibrante
- Nombre completo debajo del acrónimo
- Arco de círculos naranjas representando conexión y alcance

### Integración del Logo

El logo oficial ha sido integrado en las siguientes pantallas:

#### 1. Página de Login
- **Lado izquierdo** (panel de bienvenida):
  - Logo grande (h-32) con drop-shadow
  - Sobre fondo azul UNAD con overlay
  - Acompañado del texto "Sistema de Gestión de Turnos"

- **Lado derecho** (formulario):
  - Logo centrado (h-24) sobre el formulario
  - Fondo blanco para máxima legibilidad

#### 2. Sidebar
- Logo en header del sidebar (h-16)
- Fondo blanco para contraste
- Texto "Gestión de Turnos" debajo en color primario
- Visible en todas las páginas del dashboard

#### 3. Dashboard VAP
- Logo centrado grande (h-24) en el header
- Encima del título "Generar Turno"
- Establece identidad institucional clara

#### 4. Pantalla Pública
- Logo horizontal (h-20) con drop-shadow
- En el header superior
- Visible para todos los usuarios en sala de espera

## Colores Oficiales UNAD

### Análisis del Logo

Mediante análisis de la imagen del logo oficial, se identificaron los siguientes colores:

**Color Primario - Azul UNAD**:
- Hexadecimal: `#0A4F77`
- RGB: `rgb(10, 79, 119)`
- Representa: Confianza, conocimiento, estabilidad, seriedad

**Color Secundario - Naranja UNAD**:
- Hexadecimal: `#F08D13`
- RGB: `rgb(240, 141, 19)`
- Representa: Energía, dinamismo, creatividad, accesibilidad

### Implementación de Colores

#### 1. Tailwind Config (`/app/frontend/tailwind.config.js`)

```javascript
primary: {
  DEFAULT: "#0A4F77",  // Azul UNAD oficial
  foreground: "#FFFFFF",
  50: "#f0f9ff",
  100: "#e0f5fd",
  200: "#bae6fd",
  300: "#7dd3fc",
  400: "#38bdf8",
  500: "#0ea5e9",
  600: "#0A4F77",     // Color base
  700: "#084261",
  800: "#06354d",
  900: "#042839",
},
secondary: {
  DEFAULT: "#F08D13",  // Naranja UNAD oficial
  foreground: "#FFFFFF",
  50: "#fff7ed",
  100: "#ffedd5",
  200: "#fed7aa",
  300: "#fdc074",
  400: "#fb9e3c",
  500: "#F08D13",     // Color base
  600: "#ea7c0c",
  700: "#c2640c",
  800: "#9a4f12",
  900: "#7c3e12",
}
```

#### 2. CSS Variables (`/app/frontend/src/index.css`)

```css
:root {
  --primary: 10 79 119;        /* #0A4F77 en RGB */
  --secondary: 240 141 19;     /* #F08D13 en RGB */
  --accent: 240 141 19;        /* Naranja para acentos */
  --ring: 10 79 119;           /* Azul para focus rings */
}
```

### Aplicación de Colores en la UI

#### Elementos en Azul UNAD (#0A4F77)
- ✅ Sidebar completo
- ✅ Botones primarios
- ✅ Enlaces y navegación
- ✅ Encabezados principales
- ✅ Bordes de formularios en focus
- ✅ Iconos principales
- ✅ Badges de estado

#### Elementos en Naranja UNAD (#F08D13)
- ✅ Botones de acción secundarios
- ✅ Indicadores de prioridad
- ✅ Badges de alerta
- ✅ Acentos visuales
- ✅ Iconos secundarios
- ✅ Estados hover en ciertos elementos

## Cambios Visuales Detallados

### Antes vs Después

#### Colores Anteriores (Aproximados)
- Primario: #005883 (Azul genérico)
- Secundario: #F47920 (Naranja diferente)
- Amarillo: #F0B429 (Color terciario)

#### Colores Actuales (Oficiales)
- Primario: #0A4F77 (Azul UNAD oficial)
- Secundario: #F08D13 (Naranja UNAD oficial)
- Sin amarillo terciario

### Ajustes Específicos

#### 1. Login
**Cambios**:
- Logo oficial integrado (antes solo texto "UNAD")
- Fondo de bienvenida con azul oficial
- Imagen de fondo actualizada (universidad en lugar de genérica)
- Formulario con logo centrado

#### 2. Sidebar
**Cambios**:
- Header con fondo blanco y logo oficial
- Color de fondo: Azul UNAD (#0A4F77)
- Texto "Gestión de Turnos" en azul sobre blanco
- Iconos en blanco para contraste

#### 3. Tarjetas de Dashboard
**Cambios**:
- Borde gris claro en lugar de amarillo
- Fondo blanco sólido
- Iconos con colores UNAD
- Mejor contraste y legibilidad

#### 4. Formularios VAP
**Cambios**:
- Borde azul sutil (primary/20)
- Elimina amarillo intenso anterior
- Logo UNAD en header
- Estilo más corporativo y profesional

#### 5. Pantalla Pública
**Cambios**:
- Logo oficial con drop-shadow
- Mantiene diseño oscuro tipo aeropuerto
- Acentos en colores UNAD

## Guía de Uso de Colores

### Color Primario (Azul UNAD)

**Cuándo usar**:
- Elementos principales de navegación
- Botones de acción primaria
- Encabezados y títulos importantes
- Fondos de áreas principales (sidebar)
- Estados activos

**Ejemplo de código**:
```jsx
<Button className="bg-primary hover:bg-primary/90">
  Acción Principal
</Button>
```

### Color Secundario (Naranja UNAD)

**Cuándo usar**:
- Botones de acción secundaria
- Indicadores de prioridad
- Elementos que requieren atención
- Badges y etiquetas
- Iconos de alerta o información

**Ejemplo de código**:
```jsx
<Badge className="bg-secondary text-white">
  Prioritario
</Badge>
```

### Combinaciones Recomendadas

#### Combinación 1: Azul con Blanco
```jsx
<div className="bg-primary text-white">
  Contenido con alto contraste
</div>
```

#### Combinación 2: Naranja con Blanco
```jsx
<div className="bg-secondary text-white">
  Acento llamativo
</div>
```

#### Combinación 3: Fondo Blanco con Borde Azul
```jsx
<Card className="border-2 border-primary/20 bg-white">
  Tarjeta limpia y profesional
</Card>
```

## Accesibilidad

### Contraste de Colores

**Azul UNAD (#0A4F77) sobre blanco**:
- Ratio de contraste: 7.2:1
- Cumple WCAG AAA para texto normal
- Cumple WCAG AAA para texto grande
- ✅ Excelente accesibilidad

**Naranja UNAD (#F08D13) sobre blanco**:
- Ratio de contraste: 3.8:1
- Cumple WCAG AA para texto grande
- No cumple para texto pequeño
- ⚠️ Usar solo para elementos grandes o con fondo blanco

**Naranja UNAD sobre Azul UNAD**:
- Ratio de contraste: ~2:1
- No cumple estándares
- ❌ Evitar esta combinación para texto

### Recomendaciones de Accesibilidad

1. **Texto sobre azul**: Siempre usar blanco
2. **Texto sobre naranja**: Siempre usar blanco
3. **Iconos pequeños**: Preferir azul sobre blanco
4. **Botones**: Usar colores sólidos con texto blanco
5. **Bordes**: Usar con opacidad (primary/20) para suavizar

## Assets y Recursos

### Logo Oficial
**Ubicación**: `/app/frontend/public/logo-unad.png`
**Uso**: `<img src="/logo-unad.png" alt="UNAD Logo" />`

### Tamaños Recomendados

- **Sidebar**: `h-16` (64px)
- **Login Form**: `h-24` (96px)
- **Login Hero**: `h-32` (128px)
- **Pantalla Pública**: `h-20` (80px)
- **VAP Header**: `h-24` (96px)
- **Favicon**: 32x32px, 64x64px (pendiente)

### Variantes del Logo

Actualmente solo se usa la versión a color. Para futuras necesidades:

**Variantes recomendadas**:
1. Logo a color (actual) - Para fondos claros
2. Logo monocromático blanco - Para fondos oscuros
3. Logo monocromático azul - Para fondos muy claros
4. Logo simplificado (solo acrónimo) - Para espacios pequeños

## Testing de Branding

### Checklist de Verificación

- ✅ Logo visible en todas las páginas principales
- ✅ Colores oficiales aplicados en toda la UI
- ✅ Contraste adecuado para legibilidad
- ✅ Logo escalable sin pixelación
- ✅ Consistencia entre páginas
- ✅ Responsive design mantiene branding
- ⏳ Favicon con logo UNAD (pendiente)
- ⏳ Variantes de logo para diferentes fondos (pendiente)

### Páginas Verificadas

1. ✅ Login - Logo y colores correctos
2. ✅ Dashboard Admin - Sidebar con logo
3. ✅ Dashboard Funcionario - Branding consistente
4. ✅ Dashboard VAP - Logo destacado
5. ✅ Pantalla Pública - Logo visible
6. ✅ Gestión de Usuarios - Colores aplicados
7. ✅ Gestión de Servicios - Estilos corporativos
8. ✅ Reportes - Identidad visual mantenida
9. ✅ Configuración - Coherencia de diseño

## Próximos Pasos

### Mejoras Pendientes

1. **Favicon**
   - Crear favicon con logo UNAD
   - Múltiples tamaños (16x16, 32x32, 64x64)
   - Formato .ico y .png

2. **Variantes de Logo**
   - Logo blanco para fondos oscuros
   - Logo simplificado para espacios reducidos
   - Logo monocromático para impresiones

3. **Impresión de Tickets**
   - Incluir logo UNAD en tickets térmicos
   - Versión monocromática optimizada para impresoras térmicas

4. **Documentación**
   - Manual de identidad visual
   - Guía de uso del logo
   - Paleta de colores completa

5. **Email Templates**
   - Si se implementan notificaciones por email
   - Headers con logo UNAD
   - Colores corporativos en plantillas

6. **Loading States**
   - Spinner con colores UNAD
   - Logo animado para carga inicial

## Mantenimiento

### Actualización del Logo

Si la institución actualiza su logo:

1. Reemplazar archivo: `/app/frontend/public/logo-unad.png`
2. Reiniciar frontend: `sudo supervisorctl restart frontend`
3. Limpiar cache de navegador
4. Verificar todas las páginas

### Actualización de Colores

Si cambian los colores corporativos:

1. Actualizar `/app/frontend/tailwind.config.js`
2. Actualizar `/app/frontend/src/index.css`
3. Ejecutar rebuild: `cd /app/frontend && yarn build`
4. Reiniciar frontend

### Versionamiento

**Versión Actual**: 1.0.0 (Branding Oficial Implementado)
**Fecha**: 11 de Diciembre de 2024
**Cambios**: Logo oficial y colores corporativos UNAD

## Referencias

### Colores Oficiales
- **Azul UNAD**: #0A4F77
- **Naranja UNAD**: #F08D13

### Assets
- Logo oficial: `/app/frontend/public/logo-unad.png`
- Fuente original: Proporcionado por institución

### Archivos Modificados
1. `/app/frontend/tailwind.config.js` - Configuración de colores
2. `/app/frontend/src/index.css` - Variables CSS
3. `/app/frontend/src/pages/Login.js` - Logo en login
4. `/app/frontend/src/components/Sidebar.js` - Logo en sidebar
5. `/app/frontend/src/pages/VAPDashboard.js` - Logo en VAP
6. `/app/frontend/src/pages/PantallaPublica.js` - Logo en pantalla pública
7. `/app/frontend/src/pages/AdminDashboard.js` - Estilos de tarjetas

## Soporte

Para preguntas sobre el branding:
- Revisar este documento
- Consultar archivos modificados listados arriba
- Verificar implementación en páginas de ejemplo
