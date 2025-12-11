# Actualización: Captura de Datos del Cliente en Turnos

## Fecha: 11 de Diciembre de 2024

## Cambios Implementados

### 1. Backend - Modelo de Turno Actualizado

**Archivo**: `/app/backend/server.py`

**Nuevos campos agregados al modelo `Turno`**:
- `tipo_documento`: Tipo de documento (CC, CE, TI, PAS)
- `numero_documento`: Número de documento del cliente
- `nombre_completo`: Nombre completo del cliente
- `telefono`: Teléfono de contacto
- `correo`: Email del cliente (con validación EmailStr)
- `tipo_usuario`: Tipo de usuario (aspirante, estudiante, tercero)

**Modelo `TurnoCreate` actualizado** para requerir estos campos al generar un turno.

### 2. Frontend - Formulario VAP Mejorado

**Archivo**: `/app/frontend/src/pages/VAPDashboard.js`

**Campos agregados al formulario**:
1. **Tipo de Documento** (Select):
   - Cédula de Ciudadanía (CC)
   - Cédula de Extranjería (CE)
   - Tarjeta de Identidad (TI)
   - Pasaporte (PAS)

2. **Número de Documento** (Input numérico, requerido)

3. **Nombre Completo** (Input de texto, requerido)

4. **Teléfono** (Input numérico, requerido)

5. **Correo Electrónico** (Input email, requerido)

6. **Tipo de Usuario** (Select):
   - Aspirante
   - Estudiante
   - Tercero

**Validación**: El sistema valida que todos los campos obligatorios estén completos antes de permitir generar el turno.

### 3. Visualización de Datos del Cliente

#### En VAP (después de generar turno)
Se muestra una tarjeta con toda la información del cliente:
- Documento completo (tipo + número)
- Nombre completo
- Teléfono
- Correo electrónico
- Tipo de usuario

#### En Dashboard Funcionario
Cuando un funcionario llama y atiende un turno, puede ver:
- Código del turno
- Servicio solicitado
- Prioridad (si aplica)
- **Sección completa de información del cliente**:
  - Documento (tipo y número)
  - Nombre completo destacado
  - Teléfono de contacto
  - Correo electrónico
  - Tipo de usuario

### 4. Reportes Actualizados

**Archivo**: `/app/backend/server.py`

Los reportes Excel ahora incluyen columnas adicionales:
- Tipo Doc
- Num Doc
- Nombre Cliente
- Teléfono
- Correo
- Tipo Usuario

Esto permite:
- Seguimiento detallado de clientes atendidos
- Análisis por tipo de usuario
- Base de datos de contactos
- Identificación de usuarios frecuentes

### 5. Ticket de Impresión Actualizado

El mock de impresión ahora debe incluir:
```
=============================
        UNAD
  Sistema de Turnos
=============================

  Turno: A-004
  Servicio: Registro Académico
  
  Cliente: María González Rodríguez
  CC: 1234567890
  Tipo: Estudiante
  
  Fecha: 2024-12-11 10:30:15
  
  Por favor espere su turno
  
=============================
```

## Beneficios

### Para la Institución
- ✅ **Trazabilidad completa**: Saber quién fue atendido y cuándo
- ✅ **Base de datos de contactos**: Emails y teléfonos para comunicaciones
- ✅ **Análisis de perfiles**: Identificar si mayoría son estudiantes, aspirantes o terceros
- ✅ **Seguimiento personalizado**: Contactar usuarios si es necesario
- ✅ **Estadísticas mejoradas**: Reportes más completos con información demográfica

### Para los Funcionarios
- ✅ **Atención personalizada**: Ver nombre del cliente antes de atender
- ✅ **Verificación de identidad**: Documento visible para confirmar
- ✅ **Contexto del usuario**: Saber si es aspirante, estudiante o tercero
- ✅ **Comunicación efectiva**: Tener teléfono y correo a la mano

### Para los Usuarios
- ✅ **Servicio personalizado**: La institución conoce sus datos
- ✅ **Ticket identificado**: Turno asociado a su nombre
- ✅ **Seguimiento**: Pueden ser contactados si es necesario

## Flujo de Uso

### Generación de Turno (VAP)

1. Usuario llega a la ventanilla
2. VAP solicita documento y datos de contacto
3. VAP ingresa:
   - Tipo y número de documento
   - Nombre completo del usuario
   - Teléfono de contacto
   - Correo electrónico
   - Tipo de usuario (aspirante/estudiante/tercero)
4. VAP selecciona el servicio requerido
5. VAP indica prioridad (si aplica)
6. Sistema genera turno con código único
7. Se muestra ticket con código y datos del cliente
8. Se imprime ticket térmico (si está habilitado)

### Atención de Turno (Funcionario)

1. Funcionario ve cola de turnos en espera
2. Funcionario hace clic en "Llamar Siguiente Turno"
3. Sistema muestra:
   - Código del turno (grande)
   - Servicio solicitado
   - **Información completa del cliente**
4. Funcionario puede verificar identidad del usuario
5. Funcionario atiende el servicio solicitado
6. Funcionario cierra el turno cuando termina

### Pantalla Pública

La pantalla pública **NO muestra datos personales** del cliente, solo:
- Código del turno
- Servicio
- Funcionario que atiende

Esto protege la privacidad del usuario.

## Aspectos de Privacidad y GDPR

### Datos Capturados
- ✅ Los datos son necesarios para la prestación del servicio
- ✅ Los datos se almacenan de forma segura en MongoDB
- ✅ Solo personal autorizado puede ver los datos completos
- ✅ La pantalla pública no expone información personal

### Recomendaciones para Cumplimiento
1. **Consentimiento**: Informar al usuario que sus datos serán capturados
2. **Propósito**: Explicar que los datos son para mejorar el servicio
3. **Retención**: Definir política de retención de datos (ej: 1 año)
4. **Acceso**: Solo funcionarios autorizados acceden a datos personales
5. **Seguridad**: Implementar autenticación MongoDB en producción

## Migración de Datos Existentes

### Turnos Antiguos

Si hay turnos generados antes de esta actualización, tendrán campos vacíos:
- `tipo_documento`: null
- `numero_documento`: null
- `nombre_completo`: null
- `telefono`: null
- `correo`: null
- `tipo_usuario`: null

Esto no afecta el funcionamiento del sistema. Los nuevos turnos siempre tendrán estos datos.

### Script de Limpieza (Opcional)

Si deseas limpiar turnos antiguos sin datos de cliente:

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def limpiar_turnos_sin_cliente():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Eliminar turnos sin datos de cliente
    result = await db.turnos.delete_many({
        "nombre_completo": None
    })
    
    print(f"Eliminados {result.deleted_count} turnos sin datos de cliente")
    client.close()

if __name__ == "__main__":
    asyncio.run(limpiar_turnos_sin_cliente())
```

## Testing

### Casos de Prueba

1. **Generar turno con todos los datos**
   - ✅ Validar que todos los campos son requeridos
   - ✅ Validar formato de email
   - ✅ Verificar que el turno se crea correctamente

2. **Visualización en Funcionario**
   - ✅ Verificar que se muestran todos los datos del cliente
   - ✅ Validar que el formato es legible

3. **Reportes Excel**
   - ✅ Verificar que incluyen nuevas columnas
   - ✅ Validar que los datos se exportan correctamente

4. **Privacidad en Pantalla Pública**
   - ✅ Confirmar que NO se muestran datos personales
   - ✅ Solo código de turno y servicio visibles

## Próximos Pasos Sugeridos

1. **Búsqueda de Turnos**: Agregar búsqueda por documento o nombre
2. **Historial de Cliente**: Ver todos los turnos de un cliente
3. **Notificaciones**: Enviar SMS/Email cuando el turno esté próximo
4. **Estadísticas por Tipo**: Gráficos de distribución de tipos de usuario
5. **Validación de Documentos**: Integrar con base de datos de la institución
6. **Auto-completado**: Sugerir datos si el cliente ya estuvo antes

## Soporte

Para preguntas sobre esta actualización:
- Revisar código en `/app/backend/server.py`
- Revisar interfaz en `/app/frontend/src/pages/VAPDashboard.js`
- Consultar documentación en `/app/README_SISTEMA_TURNOS_UNAD.md`
