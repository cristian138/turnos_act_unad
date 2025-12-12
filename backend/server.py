from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from io import BytesIO
from fastapi.responses import StreamingResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SECRET_KEY = os.environ.get('SECRET_KEY', 'tu-clave-secreta-super-segura-cambiala-en-produccion')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Usuario(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    email: EmailStr
    rol: str
    activo: bool = True
    servicios_asignados: List[str] = []
    modulo: Optional[str] = None
    fecha_creacion: str

class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol: str
    servicios_asignados: List[str] = []
    modulo: Optional[str] = None

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    servicios_asignados: Optional[List[str]] = None
    modulo: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    usuario: Usuario

class Servicio(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    prefijo: str
    activo: bool = True
    fecha_creacion: str

class ServicioCreate(BaseModel):
    nombre: str
    prefijo: str

class ServicioUpdate(BaseModel):
    nombre: Optional[str] = None
    prefijo: Optional[str] = None
    activo: Optional[bool] = None

class Turno(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    codigo: str
    servicio_id: str
    servicio_nombre: str
    prioridad: Optional[str] = None
    estado: str
    observaciones: Optional[str] = None
    funcionario_id: Optional[str] = None
    funcionario_nombre: Optional[str] = None
    modulo: Optional[str] = None
    fecha_creacion: str
    fecha_llamado: Optional[str] = None
    fecha_atencion: Optional[str] = None
    fecha_cierre: Optional[str] = None
    tiempo_espera: Optional[int] = None
    tiempo_atencion: Optional[int] = None
    tipo_documento: str
    numero_documento: str
    nombre_completo: str
    telefono: str
    correo: EmailStr
    tipo_usuario: str

class TurnoCreate(BaseModel):
    servicio_id: str
    prioridad: Optional[str] = None
    observaciones: Optional[str] = None
    tipo_documento: str
    numero_documento: str
    nombre_completo: str
    telefono: str
    correo: EmailStr
    tipo_usuario: str

class TurnoLlamar(BaseModel):
    turno_id: str
    modulo: Optional[str] = None

class TurnoAtender(BaseModel):
    turno_id: str

class TurnoCerrar(BaseModel):
    turno_id: str

class TurnoRedirigir(BaseModel):
    turno_id: str
    nuevo_servicio_id: str

class Configuracion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    impresion_habilitada: bool = True
    prioridades: List[str] = ["Discapacidad", "Embarazo", "Adulto Mayor"]

class ConfiguracionUpdate(BaseModel):
    impresion_habilitada: Optional[bool] = None
    prioridades: Optional[List[str]] = None

def verificar_password(password_plano: str, password_hash: str) -> bool:
    return pwd_context.verify(password_plano, password_hash)

def obtener_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def crear_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def obtener_usuario_actual(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    usuario = await db.usuarios.find_one({"email": email}, {"_id": 0})
    if usuario is None:
        raise credentials_exception
    return Usuario(**usuario)

def requerir_rol(roles_permitidos: List[str]):
    async def verificar_rol(usuario: Usuario = Depends(obtener_usuario_actual)):
        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción"
            )
        return usuario
    return verificar_rol

@api_router.post("/auth/login", response_model=Token)
async def login(request: LoginRequest):
    usuario = await db.usuarios.find_one({"email": request.email}, {"_id": 0})
    if not usuario or not verificar_password(request.password, usuario["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    if not usuario.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = crear_access_token(
        data={"sub": usuario["email"]}, expires_delta=access_token_expires
    )
    
    usuario_response = Usuario(**usuario)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        usuario=usuario_response
    )

@api_router.get("/auth/me", response_model=Usuario)
async def obtener_perfil(usuario: Usuario = Depends(obtener_usuario_actual)):
    return usuario

@api_router.get("/usuarios", response_model=List[Usuario])
async def listar_usuarios(usuario: Usuario = Depends(requerir_rol(["administrador"]))):
    usuarios = await db.usuarios.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [Usuario(**u) for u in usuarios]

@api_router.post("/usuarios", response_model=Usuario)
async def crear_usuario(datos: UsuarioCreate, usuario: Usuario = Depends(requerir_rol(["administrador"]))):
    usuario_existente = await db.usuarios.find_one({"email": datos.email})
    if usuario_existente:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    import uuid
    usuario_id = str(uuid.uuid4())
    password_hash = obtener_password_hash(datos.password)
    
    usuario_doc = {
        "id": usuario_id,
        "nombre": datos.nombre,
        "email": datos.email,
        "password_hash": password_hash,
        "rol": datos.rol,
        "activo": True,
        "servicios_asignados": datos.servicios_asignados,
        "modulo": datos.modulo,
        "fecha_creacion": datetime.now(timezone.utc).isoformat()
    }
    
    await db.usuarios.insert_one(usuario_doc)
    
    usuario_response = await db.usuarios.find_one({"id": usuario_id}, {"_id": 0, "password_hash": 0})
    return Usuario(**usuario_response)

@api_router.put("/usuarios/{usuario_id}", response_model=Usuario)
async def actualizar_usuario(
    usuario_id: str,
    datos: UsuarioUpdate,
    usuario: Usuario = Depends(requerir_rol(["administrador"]))
):
    update_data = {k: v for k, v in datos.model_dump().items() if v is not None}
    
    if "password" in update_data:
        update_data["password_hash"] = obtener_password_hash(update_data.pop("password"))
    
    if "email" in update_data:
        usuario_con_email = await db.usuarios.find_one({"email": update_data["email"], "id": {"$ne": usuario_id}})
        if usuario_con_email:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.usuarios.update_one({"id": usuario_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario_actualizado = await db.usuarios.find_one({"id": usuario_id}, {"_id": 0, "password_hash": 0})
    return Usuario(**usuario_actualizado)

@api_router.delete("/usuarios/{usuario_id}")
async def eliminar_usuario(usuario_id: str, usuario: Usuario = Depends(requerir_rol(["administrador"]))):
    result = await db.usuarios.delete_one({"id": usuario_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario eliminado exitosamente"}

@api_router.get("/servicios", response_model=List[Servicio])
async def listar_servicios(usuario: Usuario = Depends(obtener_usuario_actual)):
    servicios = await db.servicios.find({}, {"_id": 0}).to_list(1000)
    return [Servicio(**s) for s in servicios]

@api_router.post("/servicios", response_model=Servicio)
async def crear_servicio(datos: ServicioCreate, usuario: Usuario = Depends(requerir_rol(["administrador"]))):
    import uuid
    servicio_id = str(uuid.uuid4())
    
    servicio_doc = {
        "id": servicio_id,
        "nombre": datos.nombre,
        "prefijo": datos.prefijo.upper(),
        "activo": True,
        "fecha_creacion": datetime.now(timezone.utc).isoformat()
    }
    
    await db.servicios.insert_one(servicio_doc)
    servicio_response = await db.servicios.find_one({"id": servicio_id}, {"_id": 0})
    return Servicio(**servicio_response)

@api_router.put("/servicios/{servicio_id}", response_model=Servicio)
async def actualizar_servicio(
    servicio_id: str,
    datos: ServicioUpdate,
    usuario: Usuario = Depends(requerir_rol(["administrador"]))
):
    update_data = {k: v for k, v in datos.model_dump().items() if v is not None}
    
    if "prefijo" in update_data:
        update_data["prefijo"] = update_data["prefijo"].upper()
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.servicios.update_one({"id": servicio_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    servicio_actualizado = await db.servicios.find_one({"id": servicio_id}, {"_id": 0})
    return Servicio(**servicio_actualizado)

@api_router.delete("/servicios/{servicio_id}")
async def eliminar_servicio(servicio_id: str, usuario: Usuario = Depends(requerir_rol(["administrador"]))):
    result = await db.servicios.delete_one({"id": servicio_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return {"message": "Servicio eliminado exitosamente"}

@api_router.post("/turnos/generar", response_model=Turno)
async def generar_turno(datos: TurnoCreate, usuario: Usuario = Depends(obtener_usuario_actual)):
    if usuario.rol not in ["vap", "funcionario", "administrador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para generar turnos")
    
    servicio = await db.servicios.find_one({"id": datos.servicio_id}, {"_id": 0})
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    ultimo_turno = await db.turnos.find_one(
        {"servicio_id": datos.servicio_id},
        {"_id": 0, "codigo": 1},
        sort=[("fecha_creacion", -1)]
    )
    
    if ultimo_turno and ultimo_turno.get("codigo"):
        numero = int(ultimo_turno["codigo"].split("-")[1]) + 1
    else:
        numero = 1
    
    codigo = f"{servicio['prefijo']}-{numero:03d}"
    
    import uuid
    turno_id = str(uuid.uuid4())
    
    turno_doc = {
        "id": turno_id,
        "codigo": codigo,
        "servicio_id": datos.servicio_id,
        "servicio_nombre": servicio["nombre"],
        "prioridad": datos.prioridad,
        "observaciones": datos.observaciones,
        "estado": "creado",
        "funcionario_id": None,
        "funcionario_nombre": None,
        "modulo": None,
        "fecha_creacion": datetime.now(timezone.utc).isoformat(),
        "fecha_llamado": None,
        "fecha_atencion": None,
        "fecha_cierre": None,
        "tiempo_espera": None,
        "tiempo_atencion": None,
        "tipo_documento": datos.tipo_documento,
        "numero_documento": datos.numero_documento,
        "nombre_completo": datos.nombre_completo,
        "telefono": datos.telefono,
        "correo": datos.correo,
        "tipo_usuario": datos.tipo_usuario
    }
    
    await db.turnos.insert_one(turno_doc)
    
    await sio.emit('turno_generado', turno_doc)
    
    turno_response = await db.turnos.find_one({"id": turno_id}, {"_id": 0})
    return Turno(**turno_response)

@api_router.get("/turnos/cola/{servicio_id}", response_model=List[Turno])
async def obtener_cola_turnos(servicio_id: str, usuario: Usuario = Depends(obtener_usuario_actual)):
    turnos = await db.turnos.find(
        {"servicio_id": servicio_id, "estado": "creado"},
        {"_id": 0}
    ).sort("fecha_creacion", 1).to_list(1000)
    
    turnos_ordenados = []
    for turno in turnos:
        if turno.get("prioridad"):
            turnos_ordenados.insert(0, turno)
        else:
            turnos_ordenados.append(turno)
    
    return [Turno(**t) for t in turnos_ordenados]

@api_router.get("/turnos/todos", response_model=List[Turno])
async def obtener_todos_turnos(usuario: Usuario = Depends(obtener_usuario_actual)):
    if usuario.rol == "funcionario":
        servicios_ids = usuario.servicios_asignados
        turnos = await db.turnos.find(
            {"servicio_id": {"$in": servicios_ids}, "estado": "creado"},
            {"_id": 0}
        ).sort("fecha_creacion", 1).to_list(1000)
    else:
        turnos = await db.turnos.find(
            {"estado": "creado"},
            {"_id": 0}
        ).sort("fecha_creacion", 1).to_list(1000)
    
    # Ordenar turnos por prioridad
    turnos_ordenados = []
    for turno in turnos:
        if turno.get("prioridad"):
            turnos_ordenados.insert(0, turno)
        else:
            turnos_ordenados.append(turno)
    
    return [Turno(**t) for t in turnos_ordenados]

@api_router.get("/turnos/lista-completa", response_model=List[Turno])
async def obtener_lista_completa_turnos(usuario: Usuario = Depends(obtener_usuario_actual)):
    """Obtiene todos los turnos del día con todos los estados (para VAP y Admin)"""
    if usuario.rol not in ["vap", "administrador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver esta lista")
    
    # Obtener turnos de hoy
    hoy = datetime.now(timezone.utc).date().isoformat()
    
    turnos = await db.turnos.find(
        {},
        {"_id": 0}
    ).sort("fecha_creacion", -1).to_list(1000)
    
    # Filtrar solo los de hoy
    turnos_hoy = [t for t in turnos if t.get("fecha_creacion", "").startswith(hoy)]
    
    return [Turno(**t) for t in turnos_hoy]

@api_router.post("/turnos/cancelar", response_model=Turno)
async def cancelar_turno_pendiente(datos: TurnoCerrar, usuario: Usuario = Depends(requerir_rol(["administrador"]))):
    """Permite al administrador cancelar/cerrar turnos que están pendientes (estado creado)"""
    turno = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    if turno["estado"] != "creado":
        raise HTTPException(status_code=400, detail="Solo se pueden cancelar turnos en estado pendiente (creado)")
    
    fecha_cierre = datetime.now(timezone.utc)
    
    update_data = {
        "estado": "cancelado",
        "fecha_cierre": fecha_cierre.isoformat(),
        "funcionario_id": usuario.id,
        "funcionario_nombre": f"Cancelado por: {usuario.nombre}"
    }
    
    await db.turnos.update_one({"id": datos.turno_id}, {"$set": update_data})
    
    turno_actualizado = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    
    await sio.emit('turno_cancelado', turno_actualizado)
    
    return Turno(**turno_actualizado)

@api_router.post("/turnos/llamar", response_model=Turno)
async def llamar_turno(datos: TurnoLlamar, usuario: Usuario = Depends(requerir_rol(["funcionario", "administrador"]))):
    turno = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    if turno["estado"] != "creado":
        raise HTTPException(status_code=400, detail="El turno no está en estado creado")
    
    if usuario.rol == "funcionario" and turno["servicio_id"] not in usuario.servicios_asignados:
        raise HTTPException(status_code=403, detail="No tienes asignado este servicio")
    
    fecha_llamado = datetime.now(timezone.utc)
    fecha_creacion = datetime.fromisoformat(turno["fecha_creacion"])
    tiempo_espera = int((fecha_llamado - fecha_creacion).total_seconds())
    
    # Usar el módulo del usuario si está asignado, sino usar el proporcionado o generar uno
    modulo_asignado = usuario.modulo or datos.modulo or f"Módulo {usuario.nombre.split()[0]}"
    
    update_data = {
        "estado": "llamado",
        "funcionario_id": usuario.id,
        "funcionario_nombre": usuario.nombre,
        "modulo": modulo_asignado,
        "fecha_llamado": fecha_llamado.isoformat(),
        "tiempo_espera": tiempo_espera
    }
    
    await db.turnos.update_one({"id": datos.turno_id}, {"$set": update_data})
    
    turno_actualizado = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    
    await sio.emit('turno_llamado', turno_actualizado)
    
    return Turno(**turno_actualizado)

@api_router.post("/turnos/atender", response_model=Turno)
async def atender_turno(datos: TurnoAtender, usuario: Usuario = Depends(requerir_rol(["funcionario", "administrador"]))):
    turno = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    if turno["estado"] != "llamado":
        raise HTTPException(status_code=400, detail="El turno no está en estado llamado")
    
    fecha_atencion = datetime.now(timezone.utc)
    
    update_data = {
        "estado": "atendiendo",
        "fecha_atencion": fecha_atencion.isoformat()
    }
    
    await db.turnos.update_one({"id": datos.turno_id}, {"$set": update_data})
    
    turno_actualizado = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    
    await sio.emit('turno_atendiendo', turno_actualizado)
    
    return Turno(**turno_actualizado)

@api_router.post("/turnos/cerrar", response_model=Turno)
async def cerrar_turno(datos: TurnoCerrar, usuario: Usuario = Depends(obtener_usuario_actual)):
    if usuario.rol not in ["funcionario", "vap", "administrador"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para cerrar turnos")
    
    turno = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    if turno["estado"] == "finalizado":
        raise HTTPException(status_code=400, detail="El turno ya está finalizado")
    
    fecha_cierre = datetime.now(timezone.utc)
    
    tiempo_atencion = None
    if turno.get("fecha_atencion"):
        fecha_atencion = datetime.fromisoformat(turno["fecha_atencion"])
        tiempo_atencion = int((fecha_cierre - fecha_atencion).total_seconds())
    elif turno.get("fecha_llamado"):
        fecha_llamado = datetime.fromisoformat(turno["fecha_llamado"])
        tiempo_atencion = int((fecha_cierre - fecha_llamado).total_seconds())
    
    update_data = {
        "estado": "finalizado",
        "fecha_cierre": fecha_cierre.isoformat(),
        "tiempo_atencion": tiempo_atencion
    }
    
    await db.turnos.update_one({"id": datos.turno_id}, {"$set": update_data})
    
    turno_actualizado = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    
    await sio.emit('turno_finalizado', turno_actualizado)
    
    return Turno(**turno_actualizado)

@api_router.post("/turnos/redirigir", response_model=Turno)
async def redirigir_turno(datos: TurnoRedirigir, usuario: Usuario = Depends(requerir_rol(["funcionario", "administrador"]))):
    turno = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    servicio = await db.servicios.find_one({"id": datos.nuevo_servicio_id}, {"_id": 0})
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    update_data = {
        "servicio_id": datos.nuevo_servicio_id,
        "servicio_nombre": servicio["nombre"],
        "estado": "espera",
        "funcionario_id": None,
        "funcionario_nombre": None
    }
    
    await db.turnos.update_one({"id": datos.turno_id}, {"$set": update_data})
    
    turno_actualizado = await db.turnos.find_one({"id": datos.turno_id}, {"_id": 0})
    
    await sio.emit('turno_redirigido', turno_actualizado)
    
    return Turno(**turno_actualizado)

@api_router.get("/turnos/llamados-recientes", response_model=List[Turno])
async def obtener_turnos_llamados_recientes():
    turnos = await db.turnos.find(
        {"estado": {"$in": ["llamado", "atendiendo", "finalizado"]}},
        {"_id": 0}
    ).sort("fecha_llamado", -1).limit(10).to_list(10)
    
    return [Turno(**t) for t in turnos]

@api_router.get("/configuracion", response_model=Configuracion)
async def obtener_configuracion(usuario: Usuario = Depends(obtener_usuario_actual)):
    config = await db.configuracion.find_one({}, {"_id": 0})
    if not config:
        config_default = {
            "impresion_habilitada": True,
            "prioridades": ["Discapacidad", "Embarazo", "Adulto Mayor"]
        }
        await db.configuracion.insert_one(config_default)
        return Configuracion(**config_default)
    return Configuracion(**config)

@api_router.put("/configuracion", response_model=Configuracion)
async def actualizar_configuracion(
    datos: ConfiguracionUpdate,
    usuario: Usuario = Depends(requerir_rol(["administrador"]))
):
    update_data = {k: v for k, v in datos.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    await db.configuracion.update_one({}, {"$set": update_data}, upsert=True)
    
    config = await db.configuracion.find_one({}, {"_id": 0})
    return Configuracion(**config)

@api_router.get("/clientes/buscar/{numero_documento}")
async def buscar_cliente_por_documento(numero_documento: str):
    # Primero buscar en la colección de clientes (datos migrados)
    cliente = await db.clientes.find_one(
        {"numero_documento": numero_documento},
        {"_id": 0, "tipo_documento": 1, "numero_documento": 1, "nombre_completo": 1, 
         "telefono": 1, "correo": 1, "tipo_usuario": 1}
    )
    
    if cliente:
        return cliente
    
    # Si no está en clientes, buscar en turnos anteriores
    turno_reciente = await db.turnos.find_one(
        {"numero_documento": numero_documento},
        {"_id": 0, "tipo_documento": 1, "numero_documento": 1, "nombre_completo": 1, 
         "telefono": 1, "correo": 1, "tipo_usuario": 1},
        sort=[("fecha_creacion", -1)]
    )
    
    if turno_reciente:
        return turno_reciente
    
    raise HTTPException(status_code=404, detail="Cliente no encontrado")

@api_router.get("/reportes/atencion")
async def generar_reporte_atencion(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    servicio_id: Optional[str] = None,
    funcionario_id: Optional[str] = None,
    prioridad: Optional[str] = None,
    formato: str = "json",
    usuario: Usuario = Depends(requerir_rol(["administrador", "funcionario"]))
):
    filtro = {}
    
    if fecha_inicio and fecha_fin:
        filtro["fecha_creacion"] = {
            "$gte": fecha_inicio,
            "$lte": fecha_fin
        }
    
    if servicio_id:
        filtro["servicio_id"] = servicio_id
    
    if funcionario_id:
        filtro["funcionario_id"] = funcionario_id
    
    if prioridad:
        filtro["prioridad"] = prioridad
    
    turnos = await db.turnos.find(filtro, {"_id": 0}).to_list(10000)
    
    if formato == "excel":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Reporte de Atención"
        
        headers = ["Código", "Servicio", "Prioridad", "Estado", "Funcionario", 
                   "Tipo Doc", "Num Doc", "Nombre Cliente", "Teléfono", "Correo", "Tipo Usuario",
                   "Fecha Creación", "Fecha Llamado", "Fecha Cierre", 
                   "Tiempo Espera (seg)", "Tiempo Atención (seg)"]
        ws.append(headers)
        
        header_fill = PatternFill(start_color="005883", end_color="005883", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True)
        
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")
        
        for turno in turnos:
            ws.append([
                turno.get("codigo", ""),
                turno.get("servicio_nombre", ""),
                turno.get("prioridad", "Normal"),
                turno.get("estado", ""),
                turno.get("funcionario_nombre", ""),
                turno.get("tipo_documento", ""),
                turno.get("numero_documento", ""),
                turno.get("nombre_completo", ""),
                turno.get("telefono", ""),
                turno.get("correo", ""),
                turno.get("tipo_usuario", ""),
                turno.get("fecha_creacion", ""),
                turno.get("fecha_llamado", ""),
                turno.get("fecha_cierre", ""),
                turno.get("tiempo_espera", ""),
                turno.get("tiempo_atencion", "")
            ])
        
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        headers = {
            'Content-Disposition': 'attachment; filename="reporte_atencion.xlsx"'
        }
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    
    return {"turnos": turnos, "total": len(turnos)}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
    socketio_path='socket.io'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8001, reload=True)
