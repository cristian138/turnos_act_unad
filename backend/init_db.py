"""
Script de inicialización de Base de Datos MySQL
Sistema de Turnos UNAD
"""

import pymysql
from passlib.context import CryptContext
from uuid import uuid4
from datetime import datetime, timezone
import json
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuración MySQL
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'turnos_unad')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_connection(database=None):
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=database,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def crear_base_datos():
    """Crea la base de datos si no existe"""
    print(f"Conectando a MySQL en {MYSQL_HOST}:{MYSQL_PORT}...")
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    print(f"✅ Base de datos '{MYSQL_DATABASE}' verificada/creada")
    
    conn.close()

def crear_tablas():
    """Crea las tablas necesarias"""
    conn = get_connection(MYSQL_DATABASE)
    cursor = conn.cursor()
    
    # Tabla de usuarios
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id VARCHAR(36) PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            rol ENUM('administrador', 'funcionario', 'vap') NOT NULL,
            activo BOOLEAN DEFAULT TRUE,
            servicios_asignados JSON,
            modulo VARCHAR(100),
            fecha_creacion DATETIME NOT NULL,
            INDEX idx_email (email),
            INDEX idx_rol (rol)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Tabla 'usuarios' creada")
    
    # Tabla de servicios
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS servicios (
            id VARCHAR(36) PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            prefijo VARCHAR(10) NOT NULL,
            activo BOOLEAN DEFAULT TRUE,
            fecha_creacion DATETIME NOT NULL,
            INDEX idx_prefijo (prefijo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Tabla 'servicios' creada")
    
    # Tabla de clientes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS clientes (
            id VARCHAR(36) PRIMARY KEY,
            tipo_documento VARCHAR(10) NOT NULL,
            numero_documento VARCHAR(50) UNIQUE NOT NULL,
            nombre_completo VARCHAR(255) NOT NULL,
            telefono VARCHAR(20),
            correo VARCHAR(255),
            tipo_usuario ENUM('aspirante', 'estudiante', 'tercero') DEFAULT 'estudiante',
            INDEX idx_documento (numero_documento)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Tabla 'clientes' creada")
    
    # Tabla de turnos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS turnos (
            id VARCHAR(36) PRIMARY KEY,
            codigo VARCHAR(20) NOT NULL,
            servicio_id VARCHAR(36) NOT NULL,
            servicio_nombre VARCHAR(255) NOT NULL,
            prioridad VARCHAR(50),
            estado ENUM('creado', 'llamado', 'atendiendo', 'finalizado', 'cancelado') DEFAULT 'creado',
            observaciones TEXT,
            funcionario_id VARCHAR(36),
            funcionario_nombre VARCHAR(255),
            modulo VARCHAR(100),
            fecha_creacion DATETIME NOT NULL,
            fecha_llamado DATETIME,
            fecha_atencion DATETIME,
            fecha_cierre DATETIME,
            tiempo_espera INT,
            tiempo_atencion INT,
            tipo_documento VARCHAR(10) NOT NULL,
            numero_documento VARCHAR(50) NOT NULL,
            nombre_completo VARCHAR(255) NOT NULL,
            telefono VARCHAR(20),
            correo VARCHAR(255),
            tipo_usuario VARCHAR(50),
            INDEX idx_servicio (servicio_id),
            INDEX idx_estado (estado),
            INDEX idx_fecha (fecha_creacion),
            INDEX idx_codigo (codigo),
            FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Tabla 'turnos' creada")
    
    # Tabla de configuración
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS configuracion (
            id INT AUTO_INCREMENT PRIMARY KEY,
            impresion_habilitada BOOLEAN DEFAULT TRUE,
            prioridades JSON
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Tabla 'configuracion' creada")
    
    conn.commit()
    conn.close()

def crear_datos_iniciales():
    """Crea usuarios y servicios de prueba"""
    conn = get_connection(MYSQL_DATABASE)
    cursor = conn.cursor()
    
    fecha_actual = datetime.now(timezone.utc)
    
    # Crear servicios
    servicios = [
        {"id": str(uuid4()), "nombre": "Registro Académico", "prefijo": "A"},
        {"id": str(uuid4()), "nombre": "Servicios Financieros", "prefijo": "B"},
        {"id": str(uuid4()), "nombre": "Información General", "prefijo": "C"}
    ]
    
    for servicio in servicios:
        cursor.execute("SELECT id FROM servicios WHERE prefijo = %s", (servicio['prefijo'],))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO servicios (id, nombre, prefijo, activo, fecha_creacion) VALUES (%s, %s, %s, %s, %s)",
                (servicio['id'], servicio['nombre'], servicio['prefijo'], True, fecha_actual)
            )
            print(f"  ✅ Servicio '{servicio['nombre']}' creado")
        else:
            print(f"  ⏩ Servicio '{servicio['nombre']}' ya existe")
    
    # Obtener IDs de servicios
    cursor.execute("SELECT id FROM servicios")
    servicios_ids = [row['id'] for row in cursor.fetchall()]
    
    # Crear usuarios
    usuarios = [
        {
            "id": str(uuid4()),
            "nombre": "Administrador UNAD",
            "email": "admin@unad.edu.co",
            "password": "admin123",
            "rol": "administrador",
            "servicios_asignados": [],
            "modulo": None
        },
        {
            "id": str(uuid4()),
            "nombre": "Funcionario de Prueba",
            "email": "funcionario@unad.edu.co",
            "password": "func123",
            "rol": "funcionario",
            "servicios_asignados": servicios_ids[:2],
            "modulo": "Módulo 1"
        },
        {
            "id": str(uuid4()),
            "nombre": "Operador VAP",
            "email": "vap@unad.edu.co",
            "password": "vap123",
            "rol": "vap",
            "servicios_asignados": [],
            "modulo": None
        }
    ]
    
    for usuario in usuarios:
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (usuario['email'],))
        if not cursor.fetchone():
            password_hash = pwd_context.hash(usuario['password'])
            cursor.execute(
                """INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo, servicios_asignados, modulo, fecha_creacion) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (usuario['id'], usuario['nombre'], usuario['email'], password_hash, usuario['rol'], 
                 True, json.dumps(usuario['servicios_asignados']), usuario['modulo'], fecha_actual)
            )
            print(f"  ✅ Usuario '{usuario['nombre']}' creado")
        else:
            print(f"  ⏩ Usuario '{usuario['email']}' ya existe")
    
    # Crear configuración inicial
    cursor.execute("SELECT id FROM configuracion")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO configuracion (impresion_habilitada, prioridades) VALUES (%s, %s)",
            (True, json.dumps(["Discapacidad", "Embarazo", "Adulto Mayor"]))
        )
        print("  ✅ Configuración inicial creada")
    else:
        print("  ⏩ Configuración ya existe")
    
    conn.commit()
    conn.close()

def main():
    print("=" * 60)
    print("Inicialización de Base de Datos MySQL")
    print("Sistema de Turnos UNAD")
    print("=" * 60)
    print()
    
    try:
        print("📦 Paso 1: Crear base de datos...")
        crear_base_datos()
        print()
        
        print("📋 Paso 2: Crear tablas...")
        crear_tablas()
        print()
        
        print("👥 Paso 3: Crear datos iniciales...")
        crear_datos_iniciales()
        print()
        
        print("=" * 60)
        print("✅ BASE DE DATOS INICIALIZADA EXITOSAMENTE")
        print("=" * 60)
        print()
        print("Credenciales de prueba:")
        print("-" * 40)
        print("Admin:       admin@unad.edu.co / admin123")
        print("Funcionario: funcionario@unad.edu.co / func123")
        print("VAP:         vap@unad.edu.co / vap123")
        print("=" * 60)
        
    except pymysql.Error as e:
        print()
        print("❌ ERROR DE CONEXIÓN A MYSQL")
        print("-" * 40)
        print(f"Error: {e}")
        print()
        print("Verifica:")
        print("1. Que MySQL/XAMPP esté corriendo")
        print("2. Las credenciales en el archivo .env:")
        print(f"   MYSQL_HOST={MYSQL_HOST}")
        print(f"   MYSQL_PORT={MYSQL_PORT}")
        print(f"   MYSQL_USER={MYSQL_USER}")
        print(f"   MYSQL_DATABASE={MYSQL_DATABASE}")
        print("3. Que el usuario tenga permisos para crear bases de datos")
        print()

if __name__ == "__main__":
    main()
