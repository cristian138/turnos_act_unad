"""
Script de Migración: MySQL → MongoDB
Sistema de Turnos UNAD

Este script migra los datos de clientes desde MySQL a MongoDB.
"""

import pymysql
from pymongo import MongoClient
from datetime import datetime

# ============================================
# CONFIGURACIÓN - MODIFICA ESTOS VALORES
# ============================================

# MySQL (origen)
MYSQL_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',  # <-- Pon tu contraseña de MySQL aquí
    'database': 'u494629019_turnos_db',
    'charset': 'utf8mb4'
}

# MongoDB (destino)
MONGO_URL = 'mongodb://localhost:27017'
MONGO_DATABASE = 'turnos_unad'

# ============================================
# NO MODIFICAR DEBAJO DE ESTA LÍNEA
# ============================================

def conectar_mysql():
    """Conecta a MySQL"""
    print("Conectando a MySQL...")
    try:
        conn = pymysql.connect(**MYSQL_CONFIG)
        print("✅ Conectado a MySQL")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return None

def conectar_mongodb():
    """Conecta a MongoDB"""
    print("Conectando a MongoDB...")
    try:
        client = MongoClient(MONGO_URL)
        db = client[MONGO_DATABASE]
        # Verificar conexión
        client.admin.command('ping')
        print("✅ Conectado a MongoDB")
        return db
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return None

def obtener_clientes_mysql(conn):
    """Obtiene los clientes de MySQL"""
    print("Leyendo datos de MySQL...")
    
    query = """
        SELECT 
            documento,
            numero,
            pnombre,
            snombre,
            papellido,
            sapellido,
            correo,
            telefono,
            `tipo de usuario`
        FROM db_clientes
    """
    
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute(query)
    clientes = cursor.fetchall()
    cursor.close()
    
    print(f"✅ Se encontraron {len(clientes)} registros en MySQL")
    return clientes

def transformar_cliente(cliente_mysql):
    """Transforma un registro de MySQL al formato de MongoDB"""
    
    # Construir nombre completo (ignorar valores vacíos o None)
    partes_nombre = []
    for campo in ['pnombre', 'snombre', 'papellido', 'sapellido']:
        valor = cliente_mysql.get(campo)
        if valor and str(valor).strip():
            partes_nombre.append(str(valor).strip())
    
    nombre_completo = ' '.join(partes_nombre)
    
    # Obtener tipo de documento
    tipo_doc = cliente_mysql.get('documento', 'CC')
    if not tipo_doc:
        tipo_doc = 'CC'
    
    # Obtener número de documento
    numero_doc = cliente_mysql.get('numero', '')
    if numero_doc:
        numero_doc = str(numero_doc).strip()
    
    # Obtener tipo de usuario
    tipo_usuario = cliente_mysql.get('tipo de usuario', 'estudiante')
    if not tipo_usuario:
        tipo_usuario = 'estudiante'
    tipo_usuario = tipo_usuario.lower()
    
    # Correo y teléfono
    correo = cliente_mysql.get('correo', '')
    if correo:
        correo = str(correo).strip().lower()
    
    telefono = cliente_mysql.get('telefono', '')
    if telefono:
        telefono = str(telefono).strip()
    
    return {
        'tipo_documento': tipo_doc,
        'numero_documento': numero_doc,
        'nombre_completo': nombre_completo,
        'telefono': telefono,
        'correo': correo,
        'tipo_usuario': tipo_usuario,
        'migrado_desde': 'mysql',
        'fecha_migracion': datetime.utcnow().isoformat()
    }

def migrar_a_mongodb(db, clientes_mysql):
    """Migra los clientes a MongoDB"""
    print("Migrando datos a MongoDB...")
    
    coleccion = db['clientes']
    
    insertados = 0
    actualizados = 0
    errores = 0
    
    for cliente_mysql in clientes_mysql:
        try:
            cliente_mongo = transformar_cliente(cliente_mysql)
            
            # Validar que tenga número de documento
            if not cliente_mongo['numero_documento']:
                print(f"  ⚠️ Registro sin número de documento, saltando...")
                errores += 1
                continue
            
            # Buscar si ya existe por número de documento
            existente = coleccion.find_one({
                'numero_documento': cliente_mongo['numero_documento']
            })
            
            if existente:
                # Actualizar registro existente
                coleccion.update_one(
                    {'numero_documento': cliente_mongo['numero_documento']},
                    {'$set': cliente_mongo}
                )
                actualizados += 1
            else:
                # Insertar nuevo registro
                from uuid import uuid4
                cliente_mongo['id'] = str(uuid4())
                coleccion.insert_one(cliente_mongo)
                insertados += 1
                
        except Exception as e:
            print(f"  ❌ Error migrando registro: {e}")
            errores += 1
    
    return insertados, actualizados, errores

def mostrar_muestra(db, cantidad=5):
    """Muestra una muestra de los datos migrados"""
    print(f"\n📋 Muestra de datos migrados (primeros {cantidad}):")
    print("-" * 60)
    
    coleccion = db['clientes']
    clientes = coleccion.find().limit(cantidad)
    
    for cliente in clientes:
        print(f"  • {cliente.get('numero_documento')} - {cliente.get('nombre_completo')}")
        print(f"    Tipo Doc: {cliente.get('tipo_documento')}, Tipo Usuario: {cliente.get('tipo_usuario')}")
        print(f"    Tel: {cliente.get('telefono')}, Email: {cliente.get('correo')}")
        print()

def main():
    print("=" * 60)
    print("MIGRACIÓN DE DATOS: MySQL → MongoDB")
    print("Sistema de Turnos UNAD")
    print("=" * 60)
    print()
    
    # Conectar a MySQL
    conn_mysql = conectar_mysql()
    if not conn_mysql:
        return
    
    # Conectar a MongoDB
    db_mongo = conectar_mongodb()
    if not db_mongo:
        conn_mysql.close()
        return
    
    print()
    
    # Obtener datos de MySQL
    clientes = obtener_clientes_mysql(conn_mysql)
    
    if not clientes:
        print("⚠️ No hay datos para migrar")
        conn_mysql.close()
        return
    
    print()
    
    # Migrar a MongoDB
    insertados, actualizados, errores = migrar_a_mongodb(db_mongo, clientes)
    
    # Cerrar conexión MySQL
    conn_mysql.close()
    
    # Mostrar resultados
    print()
    print("=" * 60)
    print("RESULTADOS DE LA MIGRACIÓN")
    print("=" * 60)
    print(f"  ✅ Registros insertados:  {insertados}")
    print(f"  🔄 Registros actualizados: {actualizados}")
    print(f"  ❌ Errores:                {errores}")
    print(f"  📊 Total procesados:       {insertados + actualizados + errores}")
    print("=" * 60)
    
    # Mostrar muestra
    mostrar_muestra(db_mongo)
    
    print("✅ Migración completada!")
    print()
    print("Ahora cuando generes un turno e ingreses el número de documento,")
    print("el sistema autocompletará los datos del cliente.")

if __name__ == "__main__":
    main()
