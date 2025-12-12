"""
Servicio de Impresión ESC-POS para Sistema de Turnos UNAD
=========================================================

Este script crea un servidor local que recibe peticiones HTTP
y envía comandos ESC-POS a la impresora térmica.

INSTALACIÓN:
1. Instalar Python 3.8+ en la PC donde está la impresora
2. Instalar dependencias: pip install flask flask-cors pyusb
3. En Windows también: pip install pywin32
4. Ejecutar: python servicio_impresion.py

El servicio escuchará en http://localhost:9100/print
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

app = Flask(__name__)
CORS(app)  # Permitir peticiones desde el navegador

# Configuración de la impresora
PRINTER_NAME = "XP-58"  # Cambiar por el nombre exacto de tu impresora
USE_USB_DIRECT = False   # True para USB directo, False para usar el driver de Windows

def generar_comandos_escpos(ticket_data):
    """Genera los comandos ESC-POS para el ticket"""
    ESC = b'\x1b'
    GS = b'\x1d'
    
    comandos = bytearray()
    
    # Inicializar impresora
    comandos.extend(ESC + b'@')  # Reset
    
    # Centrar texto
    comandos.extend(ESC + b'a\x01')
    
    # Título UNAD (doble altura)
    comandos.extend(ESC + b'!\x10')  # Doble altura
    comandos.extend('UNAD\n'.encode('cp437'))
    comandos.extend(ESC + b'!\x00')  # Normal
    comandos.extend('Sistema de Turnos\n'.encode('cp437'))
    comandos.extend('--------------------------------\n'.encode('cp437'))
    
    # Código del turno (grande y negrita)
    comandos.extend(GS + b'!\x11')  # Doble ancho y alto
    comandos.extend(ESC + b'E\x01')  # Negrita ON
    comandos.extend(f"\n{ticket_data['codigo']}\n\n".encode('cp437'))
    comandos.extend(ESC + b'E\x00')  # Negrita OFF
    comandos.extend(GS + b'!\x00')  # Tamaño normal
    
    # Servicio (negrita)
    comandos.extend(ESC + b'!\x08')  # Negrita
    comandos.extend(f"{ticket_data['servicio']}\n".encode('cp437'))
    comandos.extend(ESC + b'!\x00')  # Normal
    
    # Prioridad si existe
    if ticket_data.get('prioridad'):
        comandos.extend(GS + b'B\x01')  # Invertir colores
        comandos.extend(f" PRIORIDAD: {ticket_data['prioridad'].upper()} \n".encode('cp437'))
        comandos.extend(GS + b'B\x00')  # Normal
    
    comandos.extend('--------------------------------\n'.encode('cp437'))
    
    # Cliente
    cliente = ticket_data.get('cliente', 'Cliente')
    # Reemplazar caracteres especiales para cp437
    cliente = cliente.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
    cliente = cliente.replace('ñ', 'n').replace('Ñ', 'N')
    comandos.extend(f"{cliente}\n".encode('cp437', errors='replace'))
    
    # Fecha y hora
    comandos.extend(f"{ticket_data['fecha']} - {ticket_data['hora']}\n".encode('cp437'))
    
    comandos.extend('--------------------------------\n'.encode('cp437'))
    comandos.extend('Conserve este ticket\n'.encode('cp437'))
    comandos.extend('Espere a ser llamado\n'.encode('cp437'))
    comandos.extend('\n\n\n'.encode('cp437'))
    
    # Cortar papel
    comandos.extend(GS + b'V\x00')  # Corte total
    
    return bytes(comandos)


def imprimir_windows(comandos):
    """Imprime usando el driver de Windows"""
    try:
        import win32print
        import win32api
        
        # Buscar la impresora
        printers = [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL)]
        printer_name = None
        
        for p in printers:
            if PRINTER_NAME.lower() in p.lower() or 'pos' in p.lower() or '58' in p.lower():
                printer_name = p
                break
        
        if not printer_name:
            # Usar impresora predeterminada
            printer_name = win32print.GetDefaultPrinter()
        
        print(f"Imprimiendo en: {printer_name}")
        
        # Abrir impresora
        handle = win32print.OpenPrinter(printer_name)
        try:
            # Iniciar documento
            win32print.StartDocPrinter(handle, 1, ("Ticket", None, "RAW"))
            win32print.StartPagePrinter(handle)
            
            # Enviar datos
            win32print.WritePrinter(handle, comandos)
            
            # Finalizar
            win32print.EndPagePrinter(handle)
            win32print.EndDocPrinter(handle)
        finally:
            win32print.ClosePrinter(handle)
        
        return True
    except Exception as e:
        print(f"Error al imprimir: {e}")
        return False


def imprimir_linux(comandos):
    """Imprime en Linux usando lp o directamente al dispositivo"""
    try:
        # Intentar encontrar la impresora
        import subprocess
        
        # Opción 1: Usar lp
        result = subprocess.run(['lpstat', '-p'], capture_output=True, text=True)
        if 'XP' in result.stdout or 'POS' in result.stdout or '58' in result.stdout:
            # Encontrar nombre de impresora
            for line in result.stdout.split('\n'):
                if 'XP' in line or 'POS' in line or '58' in line:
                    printer_name = line.split()[1]
                    process = subprocess.Popen(['lp', '-d', printer_name], stdin=subprocess.PIPE)
                    process.communicate(comandos)
                    return True
        
        # Opción 2: Escribir directamente al dispositivo USB
        devices = ['/dev/usb/lp0', '/dev/usb/lp1', '/dev/lp0']
        for device in devices:
            if os.path.exists(device):
                with open(device, 'wb') as f:
                    f.write(comandos)
                return True
        
        return False
    except Exception as e:
        print(f"Error al imprimir en Linux: {e}")
        return False


@app.route('/print', methods=['POST', 'OPTIONS'])
def imprimir():
    """Endpoint para recibir datos e imprimir"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        ticket_data = request.json
        print(f"Recibido ticket: {ticket_data['codigo']}")
        
        # Generar comandos ESC-POS
        comandos = generar_comandos_escpos(ticket_data)
        
        # Imprimir según el sistema operativo
        if sys.platform == 'win32':
            success = imprimir_windows(comandos)
        else:
            success = imprimir_linux(comandos)
        
        if success:
            return jsonify({'success': True, 'message': 'Ticket impreso correctamente'})
        else:
            return jsonify({'success': False, 'message': 'Error al imprimir'}), 500
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/status', methods=['GET'])
def status():
    """Verificar que el servicio está activo"""
    return jsonify({'status': 'ok', 'service': 'ESC-POS Print Service'})


@app.route('/test', methods=['GET'])
def test_print():
    """Imprimir un ticket de prueba"""
    ticket_data = {
        'codigo': 'TEST-01',
        'servicio': 'Prueba de Impresion',
        'cliente': 'Usuario de Prueba',
        'prioridad': None,
        'fecha': '11/12/2025',
        'hora': '10:30'
    }
    
    comandos = generar_comandos_escpos(ticket_data)
    
    if sys.platform == 'win32':
        success = imprimir_windows(comandos)
    else:
        success = imprimir_linux(comandos)
    
    if success:
        return jsonify({'success': True, 'message': 'Ticket de prueba impreso'})
    else:
        return jsonify({'success': False, 'message': 'Error al imprimir prueba'}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("Servicio de Impresión ESC-POS")
    print("Sistema de Turnos UNAD")
    print("=" * 50)
    print(f"Sistema operativo: {sys.platform}")
    print("Iniciando servidor en http://localhost:9100")
    print("")
    print("Endpoints disponibles:")
    print("  POST http://localhost:9100/print  - Imprimir ticket")
    print("  GET  http://localhost:9100/status - Verificar servicio")
    print("  GET  http://localhost:9100/test   - Imprimir prueba")
    print("")
    print("Presiona Ctrl+C para detener")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=9100, debug=False)
