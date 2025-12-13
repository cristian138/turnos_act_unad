#!/usr/bin/env python3
"""
WebSocket Testing for UNAD Queue Management System
Tests WebSocket connections and real-time events after CORS fix
"""

import socketio
import requests
import asyncio
import json
import sys
from datetime import datetime
import threading
import time

class WebSocketTester:
    def __init__(self, base_url="https://turnosapp.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.socket_url = base_url
        self.sio = None
        self.connected = False
        self.events_received = []
        self.tokens = {}
        self.test_results = []
        
    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def authenticate_users(self):
        """Authenticate test users and get tokens"""
        print("\n🔐 Authenticating test users...")
        
        test_users = [
            {"email": "admin@unad.edu.co", "password": "admin123", "role": "administrador"},
            {"email": "funcionario@unad.edu.co", "password": "func123", "role": "funcionario"},
            {"email": "vap@unad.edu.co", "password": "vap123", "role": "vap"}
        ]
        
        for user_data in test_users:
            try:
                response = requests.post(
                    f"{self.api_url}/auth/login",
                    json={"email": user_data["email"], "password": user_data["password"]},
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.tokens[user_data["role"]] = data['access_token']
                    self.log_test(f"Login {user_data['role']}", True, f"Token obtained for {user_data['email']}")
                else:
                    self.log_test(f"Login {user_data['role']}", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test(f"Login {user_data['role']}", False, f"Exception: {str(e)}")

    def test_cors_headers(self):
        """Test CORS headers in HTTP responses"""
        print("\n🌐 Testing CORS Headers...")
        
        try:
            # Test preflight request
            response = requests.options(
                f"{self.api_url}/auth/login",
                headers={
                    'Origin': 'https://example.com',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout=30
            )
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            # Check if CORS allows all origins
            allow_origin = cors_headers.get('Access-Control-Allow-Origin')
            if allow_origin == '*':
                self.log_test("CORS Allow-Origin", True, "Correctly set to '*' for all origins")
            else:
                self.log_test("CORS Allow-Origin", False, f"Expected '*', got '{allow_origin}'")
            
            # Check credentials setting
            allow_credentials = cors_headers.get('Access-Control-Allow-Credentials')
            if allow_credentials != 'true':  # Should be false or not present for allow_origins=*
                self.log_test("CORS Allow-Credentials", True, f"Correctly set to '{allow_credentials}' (compatible with allow_origins=*)")
            else:
                self.log_test("CORS Allow-Credentials", False, f"Should not be 'true' when allow_origins='*'")
                
            print(f"    CORS Headers: {json.dumps(cors_headers, indent=2)}")
            
        except Exception as e:
            self.log_test("CORS Headers Test", False, f"Exception: {str(e)}")

    def setup_websocket_client(self):
        """Setup WebSocket client with event handlers"""
        print("\n🔌 Setting up WebSocket client...")
        
        self.sio = socketio.Client(
            logger=False,
            engineio_logger=False
        )
        
        @self.sio.event
        def connect():
            print("    WebSocket connected successfully!")
            self.connected = True
            
        @self.sio.event
        def disconnect():
            print("    WebSocket disconnected")
            self.connected = False
            
        @self.sio.event
        def turno_generado(data):
            print(f"    📨 Received 'turno_generado' event: {data.get('codigo', 'N/A')}")
            self.events_received.append({
                'event': 'turno_generado',
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            
        @self.sio.event
        def turno_llamado(data):
            print(f"    📨 Received 'turno_llamado' event: {data.get('codigo', 'N/A')}")
            self.events_received.append({
                'event': 'turno_llamado',
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            
        @self.sio.event
        def turno_atendiendo(data):
            print(f"    📨 Received 'turno_atendiendo' event: {data.get('codigo', 'N/A')}")
            self.events_received.append({
                'event': 'turno_atendiendo',
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            
        @self.sio.event
        def turno_finalizado(data):
            print(f"    📨 Received 'turno_finalizado' event: {data.get('codigo', 'N/A')}")
            self.events_received.append({
                'event': 'turno_finalizado',
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            
        @self.sio.event
        def turno_cancelado(data):
            print(f"    📨 Received 'turno_cancelado' event: {data.get('codigo', 'N/A')}")
            self.events_received.append({
                'event': 'turno_cancelado',
                'data': data,
                'timestamp': datetime.now().isoformat()
            })

    def test_websocket_connection(self):
        """Test WebSocket connection to socket.io endpoint"""
        print("\n🔌 Testing WebSocket Connection...")
        
        try:
            self.setup_websocket_client()
            
            # Attempt to connect
            print(f"    Connecting to: {self.socket_url}")
            self.sio.connect(self.socket_url, socketio_path='socket.io')
            
            # Wait a moment for connection to establish
            time.sleep(2)
            
            if self.connected:
                self.log_test("WebSocket Connection", True, f"Successfully connected to {self.socket_url}")
            else:
                self.log_test("WebSocket Connection", False, "Failed to establish connection")
                return False
                
        except Exception as e:
            self.log_test("WebSocket Connection", False, f"Connection failed: {str(e)}")
            return False
            
        return True

    def get_services(self):
        """Get available services for testing"""
        if 'vap' not in self.tokens:
            return []
            
        try:
            response = requests.get(
                f"{self.api_url}/servicios",
                headers={
                    'Authorization': f'Bearer {self.tokens["vap"]}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                services = response.json()
                print(f"    Found {len(services)} services available")
                return services
            else:
                print(f"    Failed to get services: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            print(f"    Exception getting services: {str(e)}")
            return []

    def test_turno_generation_and_websocket_events(self):
        """Test turno generation and verify WebSocket events are emitted"""
        print("\n🎫 Testing Turno Generation and WebSocket Events...")
        
        if 'vap' not in self.tokens:
            self.log_test("Turno Generation Test", False, "No VAP token available")
            return
            
        # Get services
        services = self.get_services()
        if not services:
            self.log_test("Turno Generation Test", False, "No services available")
            return
            
        service_id = services[0]['id']
        
        # Clear previous events
        self.events_received.clear()
        
        # Generate a turno
        turno_data = {
            "servicio_id": service_id,
            "tipo_documento": "CC",
            "numero_documento": f"WS{int(time.time())}",
            "nombre_completo": "WebSocket Test User",
            "telefono": "3001234567",
            "correo": "websocket.test@unad.edu.co",
            "tipo_usuario": "Estudiante",
            "observaciones": "Test turno for WebSocket verification"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/turnos/generar",
                json=turno_data,
                headers={
                    'Authorization': f'Bearer {self.tokens["vap"]}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                turno = response.json()
                turno_id = turno.get('id')
                turno_code = turno.get('codigo')
                
                self.log_test("Generate Turno", True, f"Generated turno: {turno_code}")
                
                # Wait for WebSocket event
                time.sleep(3)
                
                # Check if turno_generado event was received
                turno_generado_events = [e for e in self.events_received if e['event'] == 'turno_generado']
                if turno_generado_events:
                    event_data = turno_generado_events[0]['data']
                    if event_data.get('id') == turno_id:
                        self.log_test("WebSocket turno_generado Event", True, f"Received event for turno {turno_code}")
                    else:
                        self.log_test("WebSocket turno_generado Event", False, f"Event data mismatch")
                else:
                    self.log_test("WebSocket turno_generado Event", False, "No turno_generado event received")
                
                # Test complete lifecycle with WebSocket events
                self.test_turno_lifecycle_with_websocket(turno_id, turno_code)
                
            else:
                self.log_test("Generate Turno", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Generate Turno", False, f"Exception: {str(e)}")

    def test_turno_lifecycle_with_websocket(self, turno_id: str, turno_code: str):
        """Test complete turno lifecycle and verify WebSocket events"""
        print(f"\n🔄 Testing Turno Lifecycle with WebSocket Events for {turno_code}...")
        
        if 'funcionario' not in self.tokens:
            self.log_test("Turno Lifecycle Test", False, "No funcionario token available")
            return
            
        funcionario_token = self.tokens['funcionario']
        
        # Step 1: Call turno (creado -> llamado)
        try:
            call_data = {"turno_id": turno_id, "modulo": "WebSocket Test Module"}
            response = requests.post(
                f"{self.api_url}/turnos/llamar",
                json=call_data,
                headers={
                    'Authorization': f'Bearer {funcionario_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test("Call Turno", True, f"Called turno {turno_code}")
                
                # Wait for WebSocket event
                time.sleep(2)
                
                # Check for turno_llamado event
                llamado_events = [e for e in self.events_received if e['event'] == 'turno_llamado' and e['data'].get('id') == turno_id]
                if llamado_events:
                    self.log_test("WebSocket turno_llamado Event", True, f"Received event for turno {turno_code}")
                else:
                    self.log_test("WebSocket turno_llamado Event", False, "No turno_llamado event received")
                    
            else:
                self.log_test("Call Turno", False, f"HTTP {response.status_code}: {response.text}")
                return
                
        except Exception as e:
            self.log_test("Call Turno", False, f"Exception: {str(e)}")
            return
            
        # Step 2: Attend turno (llamado -> atendiendo)
        try:
            attend_data = {"turno_id": turno_id}
            response = requests.post(
                f"{self.api_url}/turnos/atender",
                json=attend_data,
                headers={
                    'Authorization': f'Bearer {funcionario_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test("Attend Turno", True, f"Attending turno {turno_code}")
                
                # Wait for WebSocket event
                time.sleep(2)
                
                # Check for turno_atendiendo event
                atendiendo_events = [e for e in self.events_received if e['event'] == 'turno_atendiendo' and e['data'].get('id') == turno_id]
                if atendiendo_events:
                    self.log_test("WebSocket turno_atendiendo Event", True, f"Received event for turno {turno_code}")
                else:
                    self.log_test("WebSocket turno_atendiendo Event", False, "No turno_atendiendo event received")
                    
            else:
                self.log_test("Attend Turno", False, f"HTTP {response.status_code}: {response.text}")
                return
                
        except Exception as e:
            self.log_test("Attend Turno", False, f"Exception: {str(e)}")
            return
            
        # Step 3: Finalize turno (atendiendo -> finalizado)
        try:
            finalize_data = {"turno_id": turno_id}
            response = requests.post(
                f"{self.api_url}/turnos/cerrar",
                json=finalize_data,
                headers={
                    'Authorization': f'Bearer {funcionario_token}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test("Finalize Turno", True, f"Finalized turno {turno_code}")
                
                # Wait for WebSocket event
                time.sleep(2)
                
                # Check for turno_finalizado event
                finalizado_events = [e for e in self.events_received if e['event'] == 'turno_finalizado' and e['data'].get('id') == turno_id]
                if finalizado_events:
                    self.log_test("WebSocket turno_finalizado Event", True, f"Received event for turno {turno_code}")
                else:
                    self.log_test("WebSocket turno_finalizado Event", False, "No turno_finalizado event received")
                    
            else:
                self.log_test("Finalize Turno", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Finalize Turno", False, f"Exception: {str(e)}")

    def cleanup(self):
        """Cleanup WebSocket connection"""
        if self.sio and self.connected:
            try:
                self.sio.disconnect()
                print("    WebSocket disconnected")
            except:
                pass

    def run_websocket_tests(self):
        """Run all WebSocket tests"""
        print("🚀 Starting WebSocket Tests for UNAD Queue Management System")
        print(f"Testing against: {self.base_url}")
        print("=" * 70)
        
        try:
            # Step 1: Authenticate users
            self.authenticate_users()
            
            # Step 2: Test CORS headers
            self.test_cors_headers()
            
            # Step 3: Test WebSocket connection
            if not self.test_websocket_connection():
                print("❌ WebSocket connection failed, skipping event tests")
                return False
            
            # Step 4: Test turno generation and WebSocket events
            self.test_turno_generation_and_websocket_events()
            
        except Exception as e:
            print(f"❌ Critical error during WebSocket testing: {str(e)}")
            return False
        finally:
            self.cleanup()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📋 WEBSOCKET TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"  - {test['name']}: {test['details']}")
        
        print(f"\n📨 WebSocket Events Received: {len(self.events_received)}")
        for event in self.events_received:
            print(f"  - {event['event']}: {event['data'].get('codigo', 'N/A')} at {event['timestamp']}")
        
        return failed_tests == 0

def main():
    tester = WebSocketTester()
    success = tester.run_websocket_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())