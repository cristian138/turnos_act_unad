#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for UNAD Queue Management System
Tests all endpoints with proper authentication and role-based access
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class UNADQueueAPITester:
    def __init__(self, base_url="https://academia-queue.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}
        self.users = {}
        self.services = []
        self.turnos = []
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": name, "details": details})

    def make_request(self, method: str, endpoint: str, data: dict = None, 
                    token: str = None, expected_status: int = 200) -> tuple:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test credentials
        test_users = [
            {"email": "admin@unad.edu.co", "password": "admin123", "role": "administrador"},
            {"email": "funcionario@unad.edu.co", "password": "func123", "role": "funcionario"},
            {"email": "vap@unad.edu.co", "password": "vap123", "role": "vap"}
        ]

        for user_data in test_users:
            success, response = self.make_request(
                'POST', 'auth/login', 
                {"email": user_data["email"], "password": user_data["password"]}
            )
            
            if success and 'access_token' in response:
                self.tokens[user_data["role"]] = response['access_token']
                self.users[user_data["role"]] = response['usuario']
                self.log_test(f"Login {user_data['role']}", True, f"Token obtained for {user_data['email']}")
            else:
                self.log_test(f"Login {user_data['role']}", False, f"Failed: {response}")

        # Test invalid credentials
        success, response = self.make_request(
            'POST', 'auth/login', 
            {"email": "invalid@unad.edu.co", "password": "wrong"}, 
            expected_status=401
        )
        self.log_test("Invalid login", success, "Correctly rejected invalid credentials")

        # Test /auth/me endpoint
        if 'administrador' in self.tokens:
            success, response = self.make_request(
                'GET', 'auth/me', token=self.tokens['administrador']
            )
            self.log_test("Get user profile", success, f"Retrieved profile for admin")

    def test_user_management(self):
        """Test user management endpoints (admin only)"""
        print("\n👥 Testing User Management...")
        
        if 'administrador' not in self.tokens:
            self.log_test("User management", False, "No admin token available")
            return

        admin_token = self.tokens['administrador']

        # List users
        success, response = self.make_request('GET', 'usuarios', token=admin_token)
        self.log_test("List users", success, f"Retrieved {len(response) if success else 0} users")

        # Create test user
        test_user = {
            "nombre": "Test User",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@unad.edu.co",
            "password": "test123",
            "rol": "funcionario",
            "servicios_asignados": []
        }

        success, response = self.make_request('POST', 'usuarios', test_user, admin_token, 200)
        if success:
            created_user_id = response.get('id')
            self.log_test("Create user", True, f"Created user with ID: {created_user_id}")
            
            # Update user
            update_data = {"nombre": "Updated Test User"}
            success, response = self.make_request(
                'PUT', f'usuarios/{created_user_id}', update_data, admin_token
            )
            self.log_test("Update user", success, "User updated successfully")
            
            # Delete user
            success, response = self.make_request(
                'DELETE', f'usuarios/{created_user_id}', token=admin_token
            )
            self.log_test("Delete user", success, "User deleted successfully")
        else:
            self.log_test("Create user", False, f"Failed: {response}")

        # Test unauthorized access (funcionario trying to manage users)
        if 'funcionario' in self.tokens:
            success, response = self.make_request(
                'GET', 'usuarios', token=self.tokens['funcionario'], expected_status=403
            )
            self.log_test("Unauthorized user access", success, "Correctly blocked funcionario from user management")

    def test_service_management(self):
        """Test service management endpoints"""
        print("\n🏢 Testing Service Management...")
        
        if 'administrador' not in self.tokens:
            self.log_test("Service management", False, "No admin token available")
            return

        admin_token = self.tokens['administrador']

        # List services
        success, response = self.make_request('GET', 'servicios', token=admin_token)
        if success:
            self.services = response
            self.log_test("List services", True, f"Retrieved {len(response)} services")
        else:
            self.log_test("List services", False, f"Failed: {response}")

        # Create test service
        test_service = {
            "nombre": f"Test Service {datetime.now().strftime('%H%M%S')}",
            "prefijo": "T"
        }

        success, response = self.make_request('POST', 'servicios', test_service, admin_token)
        if success:
            created_service_id = response.get('id')
            self.log_test("Create service", True, f"Created service with ID: {created_service_id}")
            
            # Update service
            update_data = {"nombre": "Updated Test Service"}
            success, response = self.make_request(
                'PUT', f'servicios/{created_service_id}', update_data, admin_token
            )
            self.log_test("Update service", success, "Service updated successfully")
            
            # Delete service
            success, response = self.make_request(
                'DELETE', f'servicios/{created_service_id}', token=admin_token
            )
            self.log_test("Delete service", success, "Service deleted successfully")
        else:
            self.log_test("Create service", False, f"Failed: {response}")

    def test_queue_management(self):
        """Test queue/turno management endpoints"""
        print("\n🎫 Testing Queue Management...")
        
        if not self.services:
            self.log_test("Queue management", False, "No services available for testing")
            return

        # Test with VAP user
        if 'vap' in self.tokens:
            vap_token = self.tokens['vap']
            service_id = self.services[0]['id'] if self.services else None
            
            if service_id:
                # Generate turno without priority
                turno_data = {"servicio_id": service_id}
                success, response = self.make_request('POST', 'turnos/generar', turno_data, vap_token, 200)
                if success:
                    turno_id = response.get('id')
                    self.turnos.append(response)
                    self.log_test("Generate turno (no priority)", True, f"Generated turno: {response.get('codigo')}")
                else:
                    self.log_test("Generate turno (no priority)", False, f"Failed: {response}")

                # Generate turno with priority
                turno_data_priority = {"servicio_id": service_id, "prioridad": "Discapacidad"}
                success, response = self.make_request('POST', 'turnos/generar', turno_data_priority, vap_token, 200)
                if success:
                    priority_turno_id = response.get('id')
                    self.turnos.append(response)
                    self.log_test("Generate turno (with priority)", True, f"Generated priority turno: {response.get('codigo')}")
                else:
                    self.log_test("Generate turno (with priority)", False, f"Failed: {response}")

        # Test queue listing
        if 'funcionario' in self.tokens:
            funcionario_token = self.tokens['funcionario']
            
            # Get all turnos
            success, response = self.make_request('GET', 'turnos/todos', token=funcionario_token)
            self.log_test("List all turnos", success, f"Retrieved {len(response) if success else 0} turnos")

            # Get turnos for specific service
            if self.services:
                service_id = self.services[0]['id']
                success, response = self.make_request('GET', f'turnos/cola/{service_id}', token=funcionario_token)
                self.log_test("List service queue", success, f"Retrieved queue for service")

        # Test calling and closing turnos
        if self.turnos and 'funcionario' in self.tokens:
            funcionario_token = self.tokens['funcionario']
            turno = self.turnos[0]
            
            # Call turno
            call_data = {"turno_id": turno['id']}
            success, response = self.make_request('POST', 'turnos/llamar', call_data, funcionario_token)
            self.log_test("Call turno", success, f"Called turno: {turno.get('codigo')}")
            
            # Close turno
            close_data = {"turno_id": turno['id']}
            success, response = self.make_request('POST', 'turnos/cerrar', close_data, funcionario_token)
            self.log_test("Close turno", success, f"Closed turno: {turno.get('codigo')}")

        # Test recent called turnos (public endpoint)
        success, response = self.make_request('GET', 'turnos/llamados-recientes')
        self.log_test("Get recent called turnos", success, f"Retrieved recent turnos for public screen")

    def test_configuration(self):
        """Test configuration endpoints"""
        print("\n⚙️ Testing Configuration...")
        
        if 'administrador' not in self.tokens:
            self.log_test("Configuration", False, "No admin token available")
            return

        admin_token = self.tokens['administrador']

        # Get configuration
        success, response = self.make_request('GET', 'configuracion', token=admin_token)
        if success:
            current_config = response
            self.log_test("Get configuration", True, f"Retrieved config: impresion={current_config.get('impresion_habilitada')}")
            
            # Update configuration
            update_config = {"impresion_habilitada": not current_config.get('impresion_habilitada', True)}
            success, response = self.make_request('PUT', 'configuracion', update_config, admin_token)
            self.log_test("Update configuration", success, "Configuration updated successfully")
        else:
            self.log_test("Get configuration", False, f"Failed: {response}")

    def test_reports(self):
        """Test report generation endpoints"""
        print("\n📊 Testing Reports...")
        
        if 'administrador' not in self.tokens:
            self.log_test("Reports", False, "No admin token available")
            return

        admin_token = self.tokens['administrador']
        
        # Test JSON report
        today = datetime.now().strftime('%Y-%m-%d')
        params = f"fecha_inicio={today}&fecha_fin={today}&formato=json"
        
        success, response = self.make_request('GET', f'reportes/atencion?{params}', token=admin_token)
        self.log_test("Generate JSON report", success, f"Generated report with {response.get('total', 0) if success else 0} records")

        # Test Excel report (we can't easily test the binary response, but we can check if it doesn't error)
        params_excel = f"fecha_inicio={today}&fecha_fin={today}&formato=excel"
        try:
            url = f"{self.base_url}/api/reportes/atencion?{params_excel}"
            headers = {'Authorization': f'Bearer {admin_token}'}
            response = requests.get(url, headers=headers, timeout=30)
            success = response.status_code == 200 and 'application/vnd.openxmlformats' in response.headers.get('content-type', '')
            self.log_test("Generate Excel report", success, "Excel report generated successfully")
        except Exception as e:
            self.log_test("Generate Excel report", False, f"Failed: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting UNAD Queue Management System API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        try:
            self.test_authentication()
            self.test_user_management()
            self.test_service_management()
            self.test_queue_management()
            self.test_configuration()
            self.test_reports()
        except Exception as e:
            print(f"❌ Critical error during testing: {str(e)}")
            return False

        # Print summary
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")

        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")

        return len(self.failed_tests) == 0

def main():
    tester = UNADQueueAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())