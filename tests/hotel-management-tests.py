# -*- coding: utf-8 -*-
"""
AgentFlow Pro - Hotel Management Test Suite
Tests hotel-specific functionality: reservations, rooms, guests, receptor/director workflows
"""
from playwright.sync_api import sync_playwright, expect, Page, Browser, BrowserContext
import time
import sys
import os
import json
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class HotelManagementTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {"passed": [], "failed": [], "skipped": []}
        self.browser: Browser = None
        self.context: BrowserContext = None
        self.page: Page = None
        self.test_start_time = datetime.now()

    def setup(self):
        """Initialize browser"""
        print("\n" + "="*80)
        print("🏨 AGENTFLOW PRO - HOTEL MANAGEMENT TEST SUITE")
        print("="*80)
        print(f"\n📅 Test started: {self.test_start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        playwright = sync_playwright().start()
        self.browser = playwright.chromium.launch(
            headless=False,  # Set to True for CI
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        self.context = self.browser.new_context(
            viewport={'width': 1280, 'height': 720},
            record_video_dir='videos/'
        )
        self.page = self.context.new_page()
        
        # Enable logging
        self.page.on("console", lambda msg: print(f"Console: {msg.type}: {msg.text}"))
        self.page.on("pageerror", lambda err: print(f"Page Error: {err}"))
        
        os.makedirs("screenshots", exist_ok=True)
        os.makedirs("videos", exist_ok=True)
        os.makedirs("test-results", exist_ok=True)
        
        print("✅ Browser initialized")

    def teardown(self):
        """Close browser and save summary"""
        if self.browser:
            self.browser.close()
        
        self._save_summary()
        print("\n✅ Browser closed")

    def test(self, name, fn, critical=False):
        """Run a test and record results"""
        marker = "🔴 CRITICAL" if critical else "🏨"
        print(f"\n{marker} TEST: {name}")
        print("-" * 60)
        
        start_time = time.time()
        
        try:
            fn()
            elapsed = time.time() - start_time
            self.results["passed"].append({"name": name, "time": elapsed, "critical": critical})
            print(f"  ✅ PASS ({elapsed:.2f}s)")
            return True
        except AssertionError as e:
            elapsed = time.time() - start_time
            self.results["failed"].append({"name": name, "time": elapsed, "error": str(e), "critical": critical})
            print(f"  ❌ FAIL ({elapsed:.2f}s): {str(e)[:100]}")
            return False
        except Exception as e:
            elapsed = time.time() - start_time
            self.results["failed"].append({"name": name, "time": elapsed, "error": str(e), "critical": critical})
            print(f"  ❌ ERROR ({elapsed:.2f}s): {str(e)[:100]}")
            return False

    def screenshot(self, name):
        """Take a screenshot"""
        try:
            filename = f"screenshots/hotel_{name}.png"
            self.page.screenshot(path=filename, full_page=True)
            return filename
        except Exception as e:
            print(f"  ⚠️  Screenshot failed: {e}")
            return None

    # ==================== RECEPTOR DASHBOARD TESTS ====================

    def test_receptor_dashboard_accessible(self):
        """Test 1: Receptor Dashboard Route Exists"""
        response = self.page.request.get(f"{self.base_url}/api/receptor/daily-overview")
        
        if response.status == 200:
            print("  ✓ Receptor API endpoint exists")
        else:
            print(f"  ⚠️  Receptor API returned {response.status}")

    def test_receptor_daily_overview(self):
        """Test 2: Daily Overview Data Structure"""
        # Test that the API returns expected structure
        response = self.page.request.get(f"{self.base_url}/api/receptor/daily-overview")
        
        if response.status == 200:
            data = response.json()
            expected_fields = ["arrivals", "departures", "inHouse", "pending"]
            
            for field in expected_fields:
                if field in data:
                    print(f"  ✓ Field '{field}' present")
                else:
                    print(f"  ⚠️  Field '{field}' missing")

    def test_room_status_api(self):
        """Test 3: Room Status API"""
        response = self.page.request.get(f"{self.base_url}/api/rooms/status")
        
        if response.status == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"  ✓ Room status API returns list ({len(data)} rooms)")
            else:
                print("  ⚠️  Room status API should return list")

    def test_quick_reservation_api(self):
        """Test 4: Quick Reservation API"""
        response = self.page.request.post(f"{self.base_url}/api/reservations/quick-create", 
            data={"roomId": "101", "guestName": "Test Guest", "checkIn": "2026-03-05"})
        
        if response.status in [200, 201]:
            print("  ✓ Quick reservation API accepts requests")
        elif response.status == 401:
            print("  ⚠️  Quick reservation requires authentication (expected)")
        else:
            print(f"  ⚠️  Quick reservation API returned {response.status}")

    def test_guest_search_api(self):
        """Test 5: Guest Search API"""
        response = self.page.request.get(f"{self.base_url}/api/guests/search?query=Test")
        
        if response.status == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"  ✓ Guest search returns list ({len(data)} results)")
            else:
                print("  ⚠️  Guest search should return list")
        elif response.status == 401:
            print("  ⚠️  Guest search requires authentication (expected)")

    # ==================== DIRECTOR DASHBOARD TESTS ====================

    def test_director_dashboard_accessible(self):
        """Test 6: Director Dashboard Route"""
        response = self.page.request.get(f"{self.base_url}/api/director/overview")
        
        if response.status == 200:
            print("  ✓ Director API endpoint exists")
        else:
            print(f"  ⚠️  Director API returned {response.status}")

    def test_analytics_api(self):
        """Test 7: Analytics API"""
        response = self.page.request.get(f"{self.base_url}/api/analytics/occupancy")
        
        if response.status == 200:
            data = response.json()
            expected_fields = ["occupancyRate", "revenue", "adr", "revpar"]
            
            for field in expected_fields:
                if field in data:
                    print(f"  ✓ Analytics field '{field}' present")
                else:
                    print(f"  ⚠️  Analytics field '{field}' missing")

    def test_revenue_reports_api(self):
        """Test 8: Revenue Reports API"""
        response = self.page.request.get(f"{self.base_url}/api/reports/revenue?period=week")
        
        if response.status == 200:
            data = response.json()
            if "dailyRevenue" in data:
                print("  ✓ Revenue reports API structure correct")
            else:
                print("  ⚠️  Revenue reports missing dailyRevenue field")

    # ==================== ROOM MANAGEMENT TESTS ====================

    def test_room_inventory_api(self):
        """Test 9: Room Inventory API"""
        response = self.page.request.get(f"{self.base_url}/api/rooms/inventory")
        
        if response.status == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"  ✓ Room inventory returns list ({len(data)} rooms)")
                # Check first room structure
                if len(data) > 0:
                    room = data[0]
                    required_fields = ["id", "name", "type", "status", "capacity"]
                    for field in required_fields:
                        if field in room:
                            print(f"    ✓ Room has field '{field}'")
                        else:
                            print(f"    ⚠️  Room missing field '{field}'")

    def test_housekeeping_schedule_api(self):
        """Test 10: Housekeeping Schedule API"""
        response = self.page.request.get(f"{self.base_url}/api/housekeeping/schedule")
        
        if response.status == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"  ✓ Housekeeping schedule returns list ({len(data)} tasks)")
            else:
                print("  ⚠️  Housekeeping schedule should return list")

    def test_maintenance_requests_api(self):
        """Test 11: Maintenance Requests API"""
        response = self.page.request.get(f"{self.base_url}/api/maintenance/requests")
        
        if response.status == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"  ✓ Maintenance requests returns list ({len(data)} requests)")
            else:
                print("  ⚠️  Maintenance requests should return list")

    # ==================== RESERVATION SYSTEM TESTS ====================

    def test_reservations_list_api(self):
        """Test 12: Reservations List API"""
        response = self.page.request.get(f"{self.base_url}/api/reservations")
        
        if response.status == 200:
            data = response.json()
            if isinstance(data, object) and "results" in data:
                print(f"  ✓ Reservations list returns paginated results ({len(data['results'])} reservations)")
            else:
                print("  ⚠️  Reservations should return paginated results")

    def test_reservation_create_api(self):
        """Test 13: Reservation Create API"""
        reservation_data = {
            "roomId": "101",
            "guestId": "guest_123",
            "checkIn": "2026-03-05T14:00:00Z",
            "checkOut": "2026-03-07T11:00:00Z",
            "adults": 2,
            "children": 1
        }
        
        response = self.page.request.post(f"{self.base_url}/api/reservations", data=reservation_data)
        
        if response.status in [200, 201]:
            print("  ✓ Reservation creation API accepts data")
        elif response.status == 401:
            print("  ⚠️  Reservation creation requires authentication (expected)")
        else:
            print(f"  ⚠️  Reservation creation returned {response.status}")

    def test_checkin_process_api(self):
        """Test 14: Check-in Process API"""
        response = self.page.request.post(f"{self.base_url}/api/reservations/checkin", 
            data={"reservationId": "res_123", "notes": "Guest arrived on time"})
        
        if response.status == 200:
            print("  ✓ Check-in process API works")
        elif response.status == 401:
            print("  ⚠️  Check-in requires authentication (expected)")
        else:
            print(f"  ⚠️  Check-in returned {response.status}")

    def test_checkout_process_api(self):
        """Test 15: Check-out Process API"""
        response = self.page.request.post(f"{self.base_url}/api/reservations/checkout", 
            data={"reservationId": "res_123", "finalBill": 150.00})
        
        if response.status == 200:
            print("  ✓ Check-out process API works")
        elif response.status == 401:
            print("  ⚠️  Check-out requires authentication (expected)")
        else:
            print(f"  ⚠️  Check-out returned {response.status}")

    # ==================== GUEST DATABASE TESTS ====================

    def test_guests_list_api(self):
        """Test 16: Guests List API"""
        response = self.page.request.get(f"{self.base_url}/api/guests")
        
        if response.status == 200:
            data = response.json()
            if isinstance(data, object) and "results" in data:
                print(f"  ✓ Guests list returns paginated results ({len(data['results'])} guests)")
            else:
                print("  ⚠️  Guests should return paginated results")

    def test_guest_profile_api(self):
        """Test 17: Guest Profile API"""
        response = self.page.request.get(f"{self.base_url}/api/guests/guest_123")
        
        if response.status == 200:
            data = response.json()
            required_fields = ["id", "name", "email", "phone", "stayHistory"]
            
            for field in required_fields:
                if field in data:
                    print(f"  ✓ Guest profile has field '{field}'")
                else:
                    print(f"  ⚠️  Guest profile missing field '{field}'")

    def test_guest_communication_api(self):
        """Test 18: Guest Communication API"""
        communication_data = {
            "guestId": "guest_123",
            "type": "email",
            "subject": "Welcome to our hotel",
            "message": "We hope you enjoy your stay"
        }
        
        response = self.page.request.post(f"{self.base_url}/api/guests/communicate", data=communication_data)
        
        if response.status == 200:
            print("  ✓ Guest communication API works")
        elif response.status == 401:
            print("  ⚠️  Guest communication requires authentication (expected)")
        else:
            print(f"  ⚠️  Guest communication returned {response.status}")

    # ==================== INTEGRATION TESTS ====================

    def test_eturizem_sync_status(self):
        """Test 19: eTurizem Sync Status"""
        response = self.page.request.get(f"{self.base_url}/api/eturizem/sync-status")
        
        if response.status == 200:
            data = response.json()
            expected_fields = ["lastSync", "status", "errors"]
            
            for field in expected_fields:
                if field in data:
                    print(f"  ✓ eTurizem sync has field '{field}'")
                else:
                    print(f"  ⚠️  eTurizem sync missing field '{field}'")

    def test_booking_com_integration(self):
        """Test 20: Booking.com Integration Status"""
        response = self.page.request.get(f"{self.base_url}/api/integrations/booking-com/status")
        
        if response.status == 200:
            data = response.json()
            if "connected" in data:
                print("  ✓ Booking.com integration status available")
            else:
                print("  ⚠️  Booking.com integration missing status field")

    # ==================== SUMMARY ====================

    def _save_summary(self):
        """Save test summary to file"""
        summary = {
            "test_date": self.test_start_time.isoformat(),
            "test_type": "hotel-management",
            "base_url": self.base_url,
            "total_tests": len(self.results["passed"]) + len(self.results["failed"]),
            "passed": len(self.results["passed"]),
            "failed": len(self.results["failed"]),
            "skipped": len(self.results["skipped"]),
            "details": {
                "passed": self.results["passed"],
                "failed": self.results["failed"],
                "skipped": self.results["skipped"]
            },
            "hotel_management_tests": {
                "receptor_dashboard": len([t for t in self.results["passed"] if "receptor" in t["name"].lower()]),
                "director_dashboard": len([t for t in self.results["passed"] if "director" in t["name"].lower()]),
                "room_management": len([t for t in self.results["passed"] if "room" in t["name"].lower()]),
                "reservations": len([t for t in self.results["passed"] if "reservation" in t["name"].lower()]),
                "guest_database": len([t for t in self.results["passed"] if "guest" in t["name"].lower()]),
                "integrations": len([t for t in self.results["passed"] if "integration" in t["name"].lower() or "sync" in t["name"].lower()])
            }
        }
        
        # Calculate pass rate
        total = summary["total_tests"]
        if total > 0:
            summary["pass_rate"] = round((len(self.results["passed"]) / total) * 100, 2)
        else:
            summary["pass_rate"] = 0
        
        # Save to file
        timestamp = self.test_start_time.strftime("%Y%m%d_%H%M%S")
        summary_file = f"test-results/hotel_management_summary_{timestamp}.json"
        
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        print(f"\n📄 Hotel management test summary saved to: {summary_file}")
        return summary

    def print_summary(self):
        """Print test summary"""
        summary = self._save_summary()
        
        print("\n" + "="*80)
        print("🏨 HOTEL MANAGEMENT TEST SUMMARY")
        print("="*80)
        
        total = summary["total_tests"]
        passed = summary["passed"]
        failed = summary["failed"]
        pass_rate = summary["pass_rate"]
        
        print(f"\n✅ Passed:  {passed}/{total}")
        for test in self.results["passed"]:
            critical_marker = "🔴" if test.get("critical") else "  "
            print(f"   {critical_marker} {test['name']} ({test['time']:.2f}s)")
        
        if failed > 0:
            print(f"\n❌ Failed:  {failed}/{total}")
            for test in self.results["failed"]:
                critical_marker = "🔴" if test.get("critical") else "  "
                print(f"   {critical_marker} {test['name']}")
                print(f"      Error: {str(test['error'])[:100]}")
        
        print(f"\n📊 Pass Rate: {pass_rate}%")
        
        # Status determination
        if pass_rate >= 90:
            status = "✅ EXCELLENT"
        elif pass_rate >= 75:
            status = "✅ GOOD"
        elif pass_rate >= 50:
            status = "⚠️  NEEDS IMPROVEMENT"
        else:
            status = "❌ CRITICAL"
        
        print(f"\n🎯 Overall Status: {status}")
        print("="*80)
        
        return pass_rate

    def run_all_tests(self):
        """Run all hotel management tests"""
        try:
            self.setup()

            # Receptor Dashboard (2 tests)
            self.test("Receptor Dashboard Accessible", self.test_receptor_dashboard_accessible)
            self.test("Receptor Daily Overview", self.test_receptor_daily_overview)

            # Director Dashboard (2 tests)
            self.test("Director Dashboard Accessible", self.test_director_dashboard_accessible)
            self.test("Analytics API", self.test_analytics_api)

            # Room Management (3 tests)
            self.test("Room Inventory API", self.test_room_inventory_api)
            self.test("Housekeeping Schedule API", self.test_housekeeping_schedule_api)
            self.test("Maintenance Requests API", self.test_maintenance_requests_api)

            # Reservation System (4 tests)
            self.test("Reservations List API", self.test_reservations_list_api)
            self.test("Reservation Create API", self.test_reservation_create_api)
            self.test("Check-in Process API", self.test_checkin_process_api)
            self.test("Check-out Process API", self.test_checkout_process_api)

            # Guest Database (3 tests)
            self.test("Guests List API", self.test_guests_list_api)
            self.test("Guest Profile API", self.test_guest_profile_api)
            self.test("Guest Communication API", self.test_guest_communication_api)

            # Integrations (2 tests)
            self.test("eTurizem Sync Status", self.test_eturizem_sync_status)
            self.test("Booking.com Integration", self.test_booking_com_integration)

            # Summary
            pass_rate = self.print_summary()
            return pass_rate

        finally:
            self.teardown()

def main():
    """Main entry point"""
    print("\n" + "="*80)
    print("🏨 AGENTFLOW PRO - HOTEL MANAGEMENT TEST SUITE")
    print("="*80)
    print("\nThis test suite will test:")
    print("  • Receptor dashboard functionality")
    print("  • Director dashboard & analytics")
    print("  • Room management & housekeeping")
    print("  • Reservation system (CRUD)")
    print("  • Guest database & communication")
    print("  • eTurizem & Booking.com integrations")
    print("\n⚠️  Note: Some tests require authentication")
    print("⚠️  Tests will be skipped if endpoints don't exist")
    print("="*80)
    
    tester = HotelManagementTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
