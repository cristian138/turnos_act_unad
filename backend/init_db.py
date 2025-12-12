import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def inicializar_base_datos():
    print("Inicializando base de datos...")
    
    await db.usuarios.delete_many({})
    await db.servicios.delete_many({})
    await db.turnos.delete_many({})
    await db.configuracion.delete_many({})
    
    usuarios_prueba = [
        {
            "id": str(uuid.uuid4()),
            "nombre": "Administrador UNAD",
            "email": "admin@unad.edu.co",
            "password_hash": pwd_context.hash("admin123"),
            "rol": "administrador",
            "activo": True,
            "servicios_asignados": [],
            "fecha_creacion": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "Funcionario de Atención",
            "email": "funcionario@unad.edu.co",
            "password_hash": pwd_context.hash("func123"),
            "rol": "funcionario",
            "activo": True,
            "servicios_asignados": [],
            "fecha_creacion": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "VAP Principal",
            "email": "vap@unad.edu.co",
            "password_hash": pwd_context.hash("vap123"),
            "rol": "vap",
            "activo": True,
            "servicios_asignados": [],
            "fecha_creacion": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.usuarios.insert_many(usuarios_prueba)
    print(f"Creados {len(usuarios_prueba)} usuarios de prueba")
    
    servicios_prueba = [
        {
            "id": str(uuid.uuid4()),
            "nombre": "Registro Académico",
            "prefijo": "A",
            "activo": True,
            "fecha_creacion": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "Servicios Financieros",
            "prefijo": "B",
            "activo": True,
            "fecha_creacion": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "nombre": "Información General",
            "prefijo": "C",
            "activo": True,
            "fecha_creacion": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    result = await db.servicios.insert_many(servicios_prueba)
    print(f"Creados {len(servicios_prueba)} servicios de prueba")
    
    servicios = await db.servicios.find({}, {"_id": 0, "id": 1}).to_list(10)
    servicios_ids = [s["id"] for s in servicios]
    
    if len(servicios_ids) >= 2:
        funcionario = await db.usuarios.find_one({"rol": "funcionario"})
        if funcionario:
            await db.usuarios.update_one(
                {"id": funcionario["id"]},
                {"$set": {"servicios_asignados": servicios_ids[:2]}}
            )
            print(f"Asignados servicios al funcionario")
    
    configuracion = {
        "impresion_habilitada": True,
        "prioridades": ["Discapacidad", "Embarazo", "Adulto Mayor"]
    }
    
    await db.configuracion.insert_one(configuracion)
    print("Configuración inicial creada")
    
    print("\n=== Base de datos inicializada exitosamente ===")
    print("\nCredenciales de prueba:")
    print("Admin: admin@unad.edu.co / admin123")
    print("Funcionario: funcionario@unad.edu.co / func123")
    print("VAP: vap@unad.edu.co / vap123")
    print("\nServicios creados:")
    for servicio in servicios_prueba:
        print(f"- {servicio['nombre']} (Prefijo: {servicio['prefijo']})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(inicializar_base_datos())
