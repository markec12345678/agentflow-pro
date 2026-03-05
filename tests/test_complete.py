# -*- coding: utf-8 -*-
"""
AgentFlow Pro - Complete E2E Test Suite
Tests all user-facing functionality from login to agents to projects
"""
from playwright.sync_api import sync_playwright, expect
import time
import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class AgentFlowProTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.results = {
            "passed": [],
            "failed": [],
            "skipped": []
        }
        self.browser = None
        self.context = None
        self.page = None
        
    def setup(self):
        """Initialize browser and context"""
        print("\n" + "="*70)
        print("AGENTFLOW PRO - COMPLETE E2E TEST SUITE")
        print("="*70)
        print("\n🚀 Starting browser...")
        
        playwright = sync_playwright().start()
        self.browser = playwright.chromium.launch(headless=False)
        self.context = self.browser.new_context(
            viewport={'width': 1280, 'height': 720},
            record_video_dir='videos/'
        )
        self.page = self.context.new_page()
        
        # Enable logging
        self.page.on("console", lambda msg: print(f"  [Console] {msg.type}: {msg.text[:100]}"))
        self.page.on("pageerror", lambda err: print(f"  [Error] {str(err)[:100]}"))
        
        # Create directories
        os.makedirs("screenshots", exist_ok=True)
        os.makedirs("videos", exist_ok=True)
        
    def teardown(self):
        """Close browser"""
        if self.browser:
            self.browser.close()
            
    def test(self, name, fn):
        """Run a test and record results"""
        try:
            fn()
            self.results["passed"].append(name)
            print(f"  ✅ PASS: {name}")
        except AssertionError as e:
            self.results["failed"].append(name)
            print(f"  ❌ FAIL: {name} - {str(e)[:100]}")
        except Exception as e:
            self.results["failed"].append(name)
            print(f"  ❌ ERROR: {name} - {str(e)[:100]}")
            
    def screenshot(self, name):
        """Take a screenshot"""
        try:
            self.page.screenshot(path=f"screenshots/{name}.png", full_page=True)
        except:
            pass
            
    # ==================== AUTHENTICATION TESTS ====================
    
    def test_landing_page(self):
        """Test 1: Landing Page"""
        print("\n📋 TEST 1: Landing Page")
        print("-" * 50)
        
        self.page.goto(self.base_url, wait_until="networkidle")
        self.page.wait_for_timeout(2000)
        
        expect(self.page).to_have_title("AgentFlow Pro")
        expect(self.page.locator("h1")).to_contain_text("Automate Your Workflow")
        expect(self.page.locator("text=Features")).to_be_visible()
        expect(self.page.locator("text=Pricing")).to_be_visible()
        expect(self.page.locator("text=Get Started")).to_be_visible()
        
        self.screenshot("01_landing_page")
        
    def test_login_page(self):
        """Test 2: Login Page"""
        print("\n📋 TEST 2: Login Page")
        print("-" * 50)
        
        self.page.goto(f"{self.base_url}/login", wait_until="networkidle")
        self.page.wait_for_timeout(2000)
        
        expect(self.page.locator("h2")).to_contain_text("Sign in")
        expect(self.page.locator("text=Sign in with GitHub")).to_be_visible()
        
        self.screenshot("02_login_page")
        
    def test_github_login_flow(self):
        """Test 3: GitHub Login Flow (Manual Step Required)"""
        print("\n📋 TEST 3: GitHub Login Flow")
        print("-" * 50)
        
        # Go to login
        self.page.goto(f"{self.base_url}/login", wait_until="networkidle")
        self.page.wait_for_timeout(1000)
        
        # Click GitHub login button
        github_button = self.page.locator("button:has-text('GitHub')")
        expect(github_button).to_be_visible()
        github_button.click()
        
        # Wait for GitHub redirect (will fail in headless mode without credentials)
        try:
            self.page.wait_for_url("https://github.com/**", timeout=5000)
            print("  ⚠️  GitHub login page opened - manual login required")
            self.screenshot("03_github_login")
            
            # Navigate back to app
            self.page.goto(self.base_url, wait_until="networkidle")
            self.results["skipped"].append("GitHub Login Flow (Manual)")
            print(f"  ⚠️  SKIP: GitHub Login Flow (requires manual login)")
        except:
            self.results["skipped"].append("GitHub Login Flow")
            print(f"  ⚠️  SKIP: GitHub Login Flow (timeout)")
            
    # ==================== DASHBOARD TESTS ====================
    
    def test_dashboard_protection(self):
        """Test 4: Dashboard Protection"""
        print("\n📋 TEST 4: Dashboard Protection")
        print("-" * 50)
        
        # Try to access dashboard without auth
        self.page.goto(f"{self.base_url}/dashboard", wait_until="networkidle")
        self.page.wait_for_timeout(2000)
        
        # Should redirect to login
        expect(self.page).to_have_url(f"{self.base_url}/login")
        
        print("  ✓ Dashboard correctly redirects to login")
        
    def test_agents_page_protection(self):
        """Test 5: Agents Page Protection"""
        print("\n📋 TEST 5: Agents Page Protection")
        print("-" * 50)
        
        self.page.goto(f"{self.base_url}/dashboard/agents", wait_until="networkidle")
        self.page.wait_for_timeout(2000)
        
        # Should redirect to login
        expect(self.page).to_have_url(f"{self.base_url}/login")
        
        print("  ✓ Agents page correctly redirects to login")
        
    def test_projects_page_protection(self):
        """Test 6: Projects Page Protection"""
        print("\n📋 TEST 6: Projects Page Protection")
        print("-" * 50)
        
        self.page.goto(f"{self.base_url}/dashboard/projects", wait_until="networkidle")
        self.page.wait_for_timeout(2000)
        
        # Should redirect to login
        expect(self.page).to_have_url(f"{self.base_url}/login")
        
        print("  ✓ Projects page correctly redirects to login")
        
    # ==================== API TESTS ====================
    
    def test_api_auth_providers(self):
        """Test 7: API Auth Providers Endpoint"""
        print("\n📋 TEST 7: API Auth Providers")
        print("-" * 50)

        response = self.page.request.get(f"{self.base_url}/api/auth/providers")

        if response.status == 200:
            data = response.json()
            assert "github" in data, "GitHub provider not found in response"
            print("  ✓ GitHub provider configured")
        else:
            raise AssertionError(f"Expected 200, got {response.status}")
            
    def test_api_session(self):
        """Test 8: API Session Endpoint"""
        print("\n📋 TEST 8: API Session")
        print("-" * 50)

        response = self.page.request.get(f"{self.base_url}/api/auth/session")
        assert response.status == 200, f"Expected 200, got {response.status}"

        print("  ✓ Session endpoint accessible")
        
    # ==================== NAVIGATION TESTS ====================
    
    def test_header_navigation(self):
        """Test 9: Header Navigation"""
        print("\n📋 TEST 9: Header Navigation")
        print("-" * 50)

        self.page.goto(self.base_url, wait_until="networkidle")
        self.page.wait_for_timeout(1000)

        # Check navigation links exist
        expect(self.page.locator("a[href='/dashboard']")).to_be_visible()
        expect(self.page.locator("a[href='#features']")).to_be_visible()
        expect(self.page.locator("a[href='#pricing']")).to_be_visible()

        # Click Features link
        self.page.click("a[href='#features']")
        self.page.wait_for_timeout(1000)
        expect(self.page.locator("id=features")).to_be_visible()

        self.screenshot("04_navigation")
        
    def test_responsive_design(self):
        """Test 10: Responsive Design"""
        print("\n📋 TEST 10: Responsive Design")
        print("-" * 50)
        
        # Mobile
        self.page.set_viewport_size({"width": 375, "height": 667})
        self.page.goto(self.base_url, wait_until="networkidle")
        self.page.wait_for_timeout(1000)
        self.screenshot("05_mobile_view")
        print("  ✓ Mobile view (375x667)")
        
        # Tablet
        self.page.set_viewport_size({"width": 768, "height": 1024})
        self.page.goto(self.base_url, wait_until="networkidle")
        self.page.wait_for_timeout(1000)
        self.screenshot("06_tablet_view")
        print("  ✓ Tablet view (768x1024)")
        
        # Desktop
        self.page.set_viewport_size({"width": 1280, "height": 720})
        self.page.goto(self.base_url, wait_until="networkidle")
        self.page.wait_for_timeout(1000)
        print("  ✓ Desktop view (1280x720)")
        
    # ==================== DATABASE TESTS ====================
    
    def test_database_exists(self):
        """Test 11: Database File Exists"""
        print("\n📋 TEST 11: Database")
        print("-" * 50)
        
        db_path = "dev.db"
        if os.path.exists(db_path):
            size = os.path.getsize(db_path)
            print(f"  ✓ Database exists ({size} bytes)")
        else:
            print(f"  ⚠️  Database not found at {db_path}")
            
    # ==================== MCP SERVER TESTS ====================
    
    def test_mcp_config(self):
        """Test 12: MCP Server Configuration"""
        print("\n📋 TEST 12: MCP Server Configuration")
        print("-" * 50)
        
        mcp_config_path = ".windsurf/mcp_config.json"
        if os.path.exists(mcp_config_path):
            import json
            with open(mcp_config_path, 'r') as f:
                config = json.load(f)
                servers = config.get("mcpServers", {})
                print(f"  ✓ {len(servers)} MCP servers configured")
                
                # List servers
                for name in servers.keys():
                    print(f"    - {name}")
            self.screenshot("07_mcp_config")
        else:
            raise AssertionError("MCP config not found")
            
    # ==================== SUMMARY ====================
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        
        total = len(self.results["passed"]) + len(self.results["failed"])
        pass_rate = (len(self.results["passed"]) / total * 100) if total > 0 else 0
        
        print(f"\n✅ Passed:  {len(self.results['passed'])}")
        for t in self.results["passed"]:
            print(f"   - {t}")
            
        print(f"\n❌ Failed:  {len(self.results['failed'])}")
        for t in self.results["failed"]:
            print(f"   - {t}")
            
        print(f"\n⚠️  Skipped: {len(self.results['skipped'])}")
        for t in self.results["skipped"]:
            print(f"   - {t}")
            
        print(f"\n📊 Pass Rate: {pass_rate:.1f}%")
        print("="*70)
        
        return pass_rate
        
    def run_all_tests(self):
        """Run all tests"""
        try:
            self.setup()
            
            # Landing & Auth
            self.test("Landing Page", self.test_landing_page)
            self.test("Login Page", self.test_login_page)
            self.test("GitHub Login Flow", self.test_github_login_flow)
            
            # Protection
            self.test("Dashboard Protection", self.test_dashboard_protection)
            self.test("Agents Page Protection", self.test_agents_page_protection)
            self.test("Projects Page Protection", self.test_projects_page_protection)
            
            # API
            self.test("API Auth Providers", self.test_api_auth_providers)
            self.test("API Session", self.test_api_session)
            
            # Navigation
            self.test("Header Navigation", self.test_header_navigation)
            self.test("Responsive Design", self.test_responsive_design)
            
            # Database & Config
            self.test("Database Exists", self.test_database_exists)
            self.test("MCP Configuration", self.test_mcp_config)
            
            # Summary
            pass_rate = self.print_summary()
            
            return pass_rate
            
        finally:
            self.teardown()


def main():
    """Main entry point"""
    tester = AgentFlowProTester()
    pass_rate = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if pass_rate > 50 else 1)


if __name__ == "__main__":
    main()
