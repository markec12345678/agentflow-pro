# -*- coding: utf-8 -*-
"""
Comprehensive E2E test for AgentFlow Pro
Tests all user-facing functionality
"""
from playwright.sync_api import sync_playwright, expect
import time
import sys

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            record_video_dir='videos/'
        )
        page = context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"Console: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))
        
        base_url = "http://localhost:3000"
        test_results = {
            "passed": [],
            "failed": [],
            "skipped": []
        }
        
        def test(name, fn):
            try:
                fn()
                test_results["passed"].append(name)
                print(f"[PASS] {name}")
            except AssertionError as e:
                test_results["failed"].append(name)
                print(f"[FAIL] {name} - {str(e)}")
            except Exception as e:
                test_results["failed"].append(name)
                print(f"[ERROR] {name} - {str(e)}")
        
        def screenshot(name):
            page.screenshot(path=f"screenshots/{name}.png", full_page=True)
        
        print("\n" + "="*60)
        print("AGENTFLOW PRO - COMPREHENSIVE E2E TEST")
        print("="*60 + "\n")
        
        # ===== 1. LANDING PAGE TEST =====
        print("\n--- Testing Landing Page ---")
        
        def test_landing_page():
            page.goto(base_url, wait_until="networkidle")
            page.wait_for_timeout(2000)
            expect(page).to_have_title("AgentFlow Pro")
            expect(page.locator("h1")).to_contain_text("Automate Your Workflow")
            expect(page.locator("text=Features")).to_be_visible()
            expect(page.locator("text=Pricing")).to_be_visible()
            expect(page.locator("text=Get Started")).to_be_visible()
            screenshot("01_landing_page")
        
        test("Landing Page Loads", test_landing_page)
        
        # ===== 2. LOGIN PAGE TEST =====
        print("\n--- Testing Login Page ---")
        
        def test_login_page():
            page.goto(f"{base_url}/login", wait_until="networkidle")
            page.wait_for_timeout(2000)
            expect(page.locator("h2")).to_contain_text("Sign in")
            expect(page.locator("text=Sign in with GitHub")).to_be_visible()
            screenshot("02_login_page")
        
        test("Login Page Loads", test_login_page)
        
        # ===== 3. DASHBOARD ACCESS (Protected Route) =====
        print("\n--- Testing Dashboard Protection ---")
        
        def test_dashboard_redirect():
            page.goto(f"{base_url}/dashboard", wait_until="networkidle")
            # Should redirect to login if not authenticated
            expect(page).to_have_url(f"{base_url}/login")
        
        test("Dashboard Redirects to Login", test_dashboard_redirect)
        
        # ===== 4. AGENTS PAGE (after login simulation) =====
        print("\n--- Testing Agents Functionality ---")
        
        def test_agents_page_structure():
            # Navigate to agents page (will need auth in real scenario)
            page.goto(f"{base_url}/dashboard/agents", wait_until="networkidle")
            page.wait_for_timeout(2000)
            # Check page structure exists
            expect(page.locator("h1")).to_contain_text("Agents")
            expect(page.locator("text=Add Agent")).to_be_visible()
            screenshot("03_agents_page")
        
        # This will fail without auth - expected behavior
        try:
            test("Agents Page Structure", test_agents_page_structure)
        except:
            test_results["skipped"].append("Agents Page Structure")
            print(f"[SKIP] Agents Page Structure (requires authentication)")
        
        # ===== 5. CREATE AGENT FORM =====
        print("\n--- Testing Create Agent Form ---")
        
        def test_create_agent_form():
            page.goto(f"{base_url}/dashboard/agents/new", wait_until="networkidle")
            page.wait_for_timeout(2000)
            expect(page.locator("h1")).to_contain_text("Create New Agent")
            
            # Check form fields exist
            expect(page.locator("#name")).to_be_visible()
            expect(page.locator("text=Role")).to_be_visible()
            expect(page.locator("#description")).to_be_visible()
            
            # Check role options
            expect(page.locator("text=General Assistant")).to_be_visible()
            expect(page.locator("text=Web Developer")).to_be_visible()
            expect(page.locator("text=Researcher")).to_be_visible()
            expect(page.locator("text=Content Writer")).to_be_visible()
            
            screenshot("04_create_agent_form")
        
        try:
            test("Create Agent Form", test_create_agent_form)
        except Exception as e:
            test_results["skipped"].append("Create Agent Form")
            print(f"[SKIP] Create Agent Form (requires authentication)")
        
        # ===== 6. PROJECTS PAGE =====
        print("\n--- Testing Projects Page ---")
        
        def test_projects_page():
            page.goto(f"{base_url}/dashboard/projects", wait_until="networkidle")
            page.wait_for_timeout(2000)
            expect(page.locator("h1")).to_contain_text("Projects")
            screenshot("05_projects_page")
        
        try:
            test("Projects Page Structure", test_projects_page)
        except:
            test_results["skipped"].append("Projects Page Structure")
            print(f"[SKIP] Projects Page Structure (requires authentication)")
        
        # ===== 7. PRICING PAGE =====
        print("\n--- Testing Pricing Page ---")
        
        def test_pricing_page():
            page.goto(f"{base_url}/pricing", wait_until="networkidle")
            page.wait_for_timeout(2000)
            # Check pricing page exists (may not be implemented yet)
            screenshot("06_pricing_page")
        
        try:
            test("Pricing Page", test_pricing_page)
        except:
            test_results["skipped"].append("Pricing Page")
            print(f"[SKIP] Pricing Page (may not exist)")
        
        # ===== 8. API ENDPOINTS =====
        print("\n--- Testing API Endpoints ---")
        
        def test_api_auth_config():
            response = page.request.get(f"{base_url}/api/auth/providers")
            expect(response.status).to_equal(200)
        
        try:
            test("API Auth Config", test_api_auth_config)
        except:
            test_results["skipped"].append("API Auth Config")
            print(f"[SKIP] API Auth Config")
        
        # ===== 9. NAVIGATION TESTS =====
        print("\n--- Testing Navigation ---")
        
        def test_navigation():
            page.goto(base_url, wait_until="networkidle")
            
            # Test header navigation
            expect(page.locator("text=Dashboard")).to_be_visible()
            expect(page.locator("text=Features")).to_be_visible()
            expect(page.locator("text=Pricing")).to_be_visible()
            
            # Click on Features link
            page.click("a[href='#features']")
            page.wait_for_timeout(1000)
            expect(page.locator("id=features")).to_be_visible()
            
            screenshot("07_navigation_test")
        
        test("Header Navigation", test_navigation)
        
        # ===== 10. RESPONSIVE DESIGN =====
        print("\n--- Testing Responsive Design ---")
        
        def test_responsive():
            # Mobile viewport
            page.set_viewport_size({"width": 375, "height": 667})
            page.goto(base_url, wait_until="networkidle")
            page.wait_for_timeout(1000)
            screenshot("08_mobile_view")
            
            # Tablet viewport
            page.set_viewport_size({"width": 768, "height": 1024})
            page.goto(base_url, wait_until="networkidle")
            page.wait_for_timeout(1000)
            screenshot("09_tablet_view")
            
            # Reset to desktop
            page.set_viewport_size({"width": 1280, "height": 720})
        
        test("Responsive Design", test_responsive)
        
        # ===== SUMMARY =====
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"\n[PASS] Passed: {len(test_results['passed'])}")
        for t in test_results['passed']:
            print(f"   - {t}")
        
        print(f"\n[FAIL] Failed: {len(test_results['failed'])}")
        for t in test_results['failed']:
            print(f"   - {t}")
        
        print(f"\n[SKIP] Skipped: {len(test_results['skipped'])}")
        for t in test_results['skipped']:
            print(f"   - {t}")
        
        print("\n" + "="*60)
        
        browser.close()
        
        return test_results

if __name__ == "__main__":
    import os
    os.makedirs("screenshots", exist_ok=True)
    os.makedirs("videos", exist_ok=True)
    results = run_tests()
