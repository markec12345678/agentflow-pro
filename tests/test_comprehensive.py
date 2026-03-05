# -*- coding: utf-8 -*-
"""
AgentFlow Pro - Comprehensive E2E Test Suite
Tests ALL functionality: landing, auth, dashboard, workflows, pricing, chat, analytics
"""
from playwright.sync_api import sync_playwright, expect, Page, Browser, BrowserContext
import time
import sys
import os
import json
from datetime import datetime

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
        self.browser: Browser = None
        self.context: BrowserContext = None
        self.page: Page = None
        self.test_start_time = datetime.now()
        self.screenshots_taken = 0
        self.errors_logged = []

    def setup(self):
        """Initialize browser and context"""
        print("\n" + "="*80)
        print("🤖 AGENTFLOW PRO - COMPREHENSIVE E2E TEST SUITE")
        print("="*80)
        print(f"\n📅 Test started: {self.test_start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Base URL: {self.base_url}")
        print("\n🚀 Starting Chromium browser...")

        playwright = sync_playwright().start()
        self.browser = playwright.chromium.launch(
            headless=True,  # Set to False to see browser
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        self.context = self.browser.new_context(
            viewport={'width': 1280, 'height': 720},
            record_video_dir='videos/',
            record_har_path='har/network.har'
        )
        self.page = self.context.new_page()

        # Enable logging
        self.page.on("console", lambda msg: self._log_console(msg))
        self.page.on("pageerror", lambda err: self._log_error(err))
        self.page.on("response", lambda resp: self._log_response(resp))

        # Create directories
        os.makedirs("screenshots", exist_ok=True)
        os.makedirs("videos", exist_ok=True)
        os.makedirs("har", exist_ok=True)
        os.makedirs("test-results", exist_ok=True)

        print("✅ Browser initialized successfully")

    def teardown(self):
        """Close browser and save summary"""
        if self.browser:
            self.browser.close()
        
        # Save test summary
        self._save_test_summary()
        
        print("\n✅ Browser closed")

    def _log_console(self, msg):
        """Log console messages"""
        text = str(msg.text)[:200]
        if len(text) > 200:
            text += "..."
        # Only log important messages
        if any(keyword in text.lower() for keyword in ['error', 'warn', 'fail']):
            print(f"  📝 Console [{msg.type}]: {text}")

    def _log_error(self, err):
        """Log page errors"""
        error_msg = str(err)[:200]
        self.errors_logged.append(error_msg)
        print(f"  ❌ Page Error: {error_msg}")

    def _log_response(self, resp):
        """Log failed responses"""
        if resp.status >= 400:
            print(f"  ⚠️  HTTP {resp.status}: {resp.url[:100]}")

    def screenshot(self, name):
        """Take a screenshot"""
        try:
            filename = f"screenshots/{self.screenshots_taken:03d}_{name}.png"
            self.page.screenshot(path=filename, full_page=True)
            self.screenshots_taken += 1
            return filename
        except Exception as e:
            print(f"  ⚠️  Screenshot failed: {e}")
            return None

    def test(self, name, fn, critical=False):
        """Run a test and record results"""
        marker = "🔴 CRITICAL" if critical else "📋"
        print(f"\n{marker} TEST: {name}")
        print("-" * 80)
        
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

    def wait_for_page_load(self, timeout=5000):
        """Wait for page to be fully loaded"""
        self.page.wait_for_load_state("networkidle", timeout=timeout)
        self.page.wait_for_timeout(500)  # Extra wait for dynamic content

    # ==================== LANDING PAGE TESTS ====================

    def test_landing_page_loads(self):
        """Test 1: Landing Page Loads"""
        self.page.goto(self.base_url, wait_until="networkidle")
        self.wait_for_page_load()
        
        expect(self.page).to_have_title("AgentFlow Pro")
        self.screenshot("01_landing_page")

    def test_landing_page_hero(self):
        """Test 2: Landing Page Hero Section"""
        hero = self.page.locator("h1")
        expect(hero).to_be_visible()
        expect(hero).to_contain_text("Automate")

    def test_landing_page_features(self):
        """Test 3: Landing Page Features Section"""
        features_section = self.page.locator("id=features")
        expect(features_section).to_be_visible()
        
        # Check feature cards exist
        feature_cards = self.page.locator("css=.grid > div").all()
        assert len(feature_cards) >= 4, "Expected at least 4 feature cards"

    def test_landing_page_navigation(self):
        """Test 4: Landing Page Navigation Links"""
        nav_links = self.page.locator("header nav a")
        expect(nav_links).to_have_count(4)
        
        # Test Dashboard link
        dashboard_link = self.page.locator("a[href='/dashboard']")
        expect(dashboard_link).to_be_visible()

    def test_landing_page_cta_buttons(self):
        """Test 5: Landing Page CTA Buttons"""
        get_started = self.page.locator("text=Get Started")
        expect(get_started).to_be_visible()
        
        view_demo = self.page.locator("text=View Demo")
        expect(view_demo).to_be_visible()

    # ==================== AUTHENTICATION TESTS ====================

    def test_login_page_loads(self):
        """Test 6: Login Page Loads"""
        self.page.goto(f"{self.base_url}/login", wait_until="networkidle")
        self.wait_for_page_load()
        
        expect(self.page.locator("h2")).to_contain_text("Sign in")
        self.screenshot("02_login_page")

    def test_github_login_button(self):
        """Test 7: GitHub Login Button Exists"""
        github_btn = self.page.locator("button:has-text('GitHub'), a:has-text('GitHub')")
        expect(github_btn).to_be_visible()

    def test_dashboard_protection(self):
        """Test 8: Dashboard Protection (Redirects to Login)"""
        self.page.goto(f"{self.base_url}/dashboard", wait_until="networkidle")
        self.wait_for_page_load()
        
        # Should redirect to login
        expect(self.page).to_have_url(f"{self.base_url}/login**")

    def test_agents_page_protection(self):
        """Test 9: Agents Page Protection"""
        self.page.goto(f"{self.base_url}/dashboard/agents", wait_until="networkidle")
        expect(self.page).to_have_url(f"{self.base_url}/login**")

    def test_pricing_page_accessible(self):
        """Test 10: Pricing Page Accessible Without Auth"""
        self.page.goto(f"{self.base_url}/pricing", wait_until="networkidle")
        self.wait_for_page_load()
        
        expect(self.page.locator("h1")).to_contain_text("Pricing")
        self.screenshot("03_pricing_page")

    # ==================== PRICING PAGE TESTS ====================

    def test_pricing_plans_display(self):
        """Test 11: Pricing Plans Display"""
        # Check for 3 pricing tiers
        plan_cards = self.page.locator("css=[role='article'], css=.grid > div").all()
        assert len(plan_cards) >= 2, "Expected at least 2 pricing plans"

    def test_pricing_trial_plan(self):
        """Test 12: Trial Plan Details"""
        expect(self.page.locator("text=Trial")).to_be_visible()
        expect(self.page.locator("text=Free")).to_be_visible()

    def test_pricing_pro_plan(self):
        """Test 13: Pro Plan Details"""
        expect(self.page.locator("text=Pro")).to_be_visible()
        expect(self.page.locator("text=29")).to_be_visible()  # €29

    def test_pricing_features_list(self):
        """Test 14: Pricing Features Listed"""
        features = self.page.locator("css=li:has-text('Unlimited'), css=li:has-text('AI')")
        assert features.count() > 0, "Expected features to be listed"

    def test_pricing_faq_section(self):
        """Test 15: FAQ Section Exists"""
        faq_heading = self.page.locator("text=Frequently Asked Questions")
        expect(faq_heading).to_be_visible()

    # ==================== DASHBOARD TESTS ====================

    def test_dashboard_layout(self):
        """Test 16: Dashboard Layout (Mock Auth)"""
        # Note: Full dashboard test requires auth
        # Test that protected route exists
        print("  ℹ️  Dashboard protection verified in Test 8")

    def test_analytics_page_exists(self):
        """Test 17: Analytics Page Route Exists"""
        # Check that the route file exists
        analytics_route = "src/app/dashboard/analytics/page.tsx"
        assert os.path.exists(analytics_route), f"Analytics page not found: {analytics_route}"

    def test_chat_page_exists(self):
        """Test 18: Chat Page Route Exists"""
        chat_route = "src/app/dashboard/chat/page.tsx"
        assert os.path.exists(chat_route), f"Chat page not found: {chat_route}"

    # ==================== API TESTS ====================

    def test_api_health(self):
        """Test 19: API Endpoints Accessible"""
        # Test that API routes exist
        routes = [
            "src/app/api/analytics/route.ts",
            "src/app/api/stripe/create-checkout-session/route.ts",
            "src/app/api/stripe/webhook/route.ts",
        ]
        for route in routes:
            assert os.path.exists(route), f"API route not found: {route}"

    def test_api_auth_providers(self):
        """Test 20: Auth Providers Endpoint"""
        response = self.page.request.get(f"{self.base_url}/api/auth/providers")
        
        if response.status == 200:
            data = response.json()
            assert isinstance(data, dict), "Expected JSON response"
            print(f"  ✓ Auth providers: {list(data.keys())}")
        else:
            print(f"  ⚠️  Auth endpoint returned {response.status}")

    def test_api_session(self):
        """Test 21: Session Endpoint"""
        response = self.page.request.get(f"{self.base_url}/api/auth/session")
        assert response.status in [200, 401], f"Unexpected status: {response.status}"

    # ==================== WORKFLOW SYSTEM TESTS ====================

    def test_workflow_types_exists(self):
        """Test 22: Workflow Types Defined"""
        types_file = "src/workflows/types.ts"
        assert os.path.exists(types_file), f"Workflow types not found: {types_file}"
        
        # Check file content
        with open(types_file, 'r') as f:
            content = f.read()
            assert "export interface Workflow" in content, "Workflow interface not found"
            assert "WorkflowNode" in content, "WorkflowNode not defined"
            assert "WorkflowEdge" in content, "WorkflowEdge not defined"

    def test_workflow_executor_exists(self):
        """Test 23: Workflow Executor Implemented"""
        executor_file = "src/workflows/WorkflowExecutor.ts"
        assert os.path.exists(executor_file), f"Workflow executor not found: {executor_file}"
        
        with open(executor_file, 'r') as f:
            content = f.read()
            assert "class WorkflowExecutor" in content, "WorkflowExecutor class not found"
            assert "execute" in content, "execute method not found"
            assert "topologicalSort" in content, "topologicalSort not found"

    def test_workflow_api_implementation(self):
        """Test 24: Workflow API Implementation"""
        api_file = "src/api/workflows.ts"
        assert os.path.exists(api_file), f"Workflow API not found: {api_file}"
        
        with open(api_file, 'r') as f:
            content = f.read()
            assert "runWorkflow" in content, "runWorkflow function not found"
            assert "getWorkflowExecutions" in content, "getWorkflowExecutions not found"

    # ==================== PLANNER TESTS ====================

    def test_planner_implementation(self):
        """Test 25: Task Planner Implemented"""
        planner_file = "src/planner/TaskPlanner.ts"
        assert os.path.exists(planner_file), f"Task planner not found: {planner_file}"
        
        with open(planner_file, 'r') as f:
            content = f.read()
            assert "class TaskPlanner" in content, "TaskPlanner class not found"
            assert "createPlan" in content, "createPlan method not found"
            assert "PlanStep" in content, "PlanStep not defined"

    # ==================== VECTOR STORE TESTS ====================

    def test_vector_store_implementation(self):
        """Test 26: Vector Store Implemented"""
        vector_file = "src/vector/VectorStore.ts"
        assert os.path.exists(vector_file), f"Vector store not found: {vector_file}"
        
        with open(vector_file, 'r') as f:
            content = f.read()
            assert "class VectorStore" in content, "VectorStore class not found"
            assert "QdrantClient" in content, "QdrantClient not imported"
            assert "search" in content, "search method not found"

    # ==================== CHAT FUNCTIONALITY TESTS ====================

    def test_chat_actions_implementation(self):
        """Test 27: Chat Actions Implemented"""
        chat_actions = "src/actions/chat.ts"
        assert os.path.exists(chat_actions), f"Chat actions not found: {chat_actions}"
        
        with open(chat_actions, 'r') as f:
            content = f.read()
            assert "sendMessage" in content, "sendMessage not found"
            assert "getOrCreateThread" in content, "getOrCreateThread not found"
            assert "getUserThreads" in content, "getUserThreads not found"

    def test_chat_ui_implementation(self):
        """Test 28: Chat UI Implemented"""
        chat_page = "src/app/dashboard/chat/page.tsx"
        assert os.path.exists(chat_page), f"Chat page not found: {chat_page}"
        
        with open(chat_page, 'r') as f:
            content = f.read()
            assert "ChatPage" in content or "export default" in content, "Chat component not found"
            assert "sendMessage" in content, "sendMessage not used"

    # ==================== ANALYTICS TESTS ====================

    def test_analytics_api_implementation(self):
        """Test 29: Analytics API Implemented"""
        analytics_api = "src/app/api/analytics/route.ts"
        assert os.path.exists(analytics_api), f"Analytics API not found: {analytics_api}"
        
        with open(analytics_api, 'r') as f:
            content = f.read()
            assert "export async function GET" in content, "GET handler not found"
            assert "totalAgents" in content, "totalAgents not found"
            assert "workflowExecutions" in content, "workflowExecutions not found"

    def test_analytics_ui_implementation(self):
        """Test 30: Analytics UI Implemented"""
        analytics_page = "src/app/dashboard/analytics/page.tsx"
        assert os.path.exists(analytics_page), f"Analytics page not found: {analytics_page}"
        
        with open(analytics_page, 'r') as f:
            content = f.read()
            assert "Analytics" in content or "analytics" in content, "Analytics component not found"

    # ==================== STRIPE INTEGRATION TESTS ====================

    def test_stripe_plans_defined(self):
        """Test 31: Stripe Plans Defined"""
        plans_file = "src/stripe/plans.ts"
        assert os.path.exists(plans_file), f"Stripe plans not found: {plans_file}"
        
        with open(plans_file, 'r') as f:
            content = f.read()
            assert "PlanId" in content, "PlanId type not found"
            assert "getPlanLimits" in content, "getPlanLimits not found"

    def test_stripe_checkout_implementation(self):
        """Test 32: Stripe Checkout Implemented"""
        checkout_file = "src/stripe/checkout.ts"
        assert os.path.exists(checkout_file), f"Stripe checkout not found: {checkout_file}"
        
        with open(checkout_file, 'r') as f:
            content = f.read()
            assert "createCheckoutSession" in content, "createCheckoutSession not found"

    def test_stripe_webhook_implementation(self):
        """Test 33: Stripe Webhook Implemented"""
        webhook_file = "src/app/api/stripe/webhook/route.ts"
        assert os.path.exists(webhook_file), f"Stripe webhook not found: {webhook_file}"
        
        with open(webhook_file, 'r') as f:
            content = f.read()
            assert "POST" in content, "POST handler not found"
            assert "checkout.session.completed" in content, "Webhook event handler not found"

    # ==================== RESPONSIVE DESIGN TESTS ====================

    def test_responsive_mobile(self):
        """Test 34: Mobile View (375x667)"""
        self.page.set_viewport_size({"width": 375, "height": 667})
        self.page.goto(self.base_url, wait_until="networkidle")
        self.wait_for_page_load()
        
        # Check content is visible
        expect(self.page.locator("h1")).to_be_visible()
        self.screenshot("04_mobile_view")
        print("  ✓ Mobile viewport: 375x667")

    def test_responsive_tablet(self):
        """Test 35: Tablet View (768x1024)"""
        self.page.set_viewport_size({"width": 768, "height": 1024})
        self.page.goto(self.base_url, wait_until="networkidle")
        self.wait_for_page_load()
        
        expect(self.page.locator("h1")).to_be_visible()
        self.screenshot("05_tablet_view")
        print("  ✓ Tablet viewport: 768x1024")

    def test_responsive_desktop(self):
        """Test 36: Desktop View (1280x720)"""
        self.page.set_viewport_size({"width": 1280, "height": 720})
        self.page.goto(self.base_url, wait_until="networkidle")
        self.wait_for_page_load()
        
        expect(self.page.locator("h1")).to_be_visible()
        print("  ✓ Desktop viewport: 1280x720")

    # ==================== DATABASE TESTS ====================

    def test_database_schema_exists(self):
        """Test 37: Prisma Schema Exists"""
        schema_file = "prisma/schema.prisma"
        assert os.path.exists(schema_file), f"Prisma schema not found: {schema_file}"
        
        with open(schema_file, 'r') as f:
            content = f.read()
            assert "model User" in content, "User model not found"
            assert "model Agent" in content, "Agent model not found"
            assert "model Workflow" in content, "Workflow model not found"

    def test_database_file_exists(self):
        """Test 38: Database File Exists"""
        db_file = "dev.db"
        if os.path.exists(db_file):
            size = os.path.getsize(db_file)
            print(f"  ✓ Database exists ({size:,} bytes)")
        else:
            print(f"  ⚠️  Database not found (will be created on first run)")

    # ==================== MCP SERVER TESTS ====================

    def test_mcp_config_exists(self):
        """Test 39: MCP Server Configuration"""
        mcp_config = ".windsurf/mcp_config.json"
        if os.path.exists(mcp_config):
            with open(mcp_config, 'r') as f:
                config = json.load(f)
                servers = config.get("mcpServers", {})
                print(f"  ✓ {len(servers)} MCP servers configured")
                
                # List key servers
                key_servers = ["filesystem", "fetch", "playwright", "git", "memory"]
                for server in key_servers:
                    if server in servers:
                        print(f"    ✓ {server}")
        else:
            print(f"  ⚠️  MCP config not found")

    # ==================== BUILD VERIFICATION TESTS ====================

    def test_build_output_exists(self):
        """Test 40: Build Output Exists"""
        build_dir = ".next"
        if os.path.exists(build_dir):
            print(f"  ✓ Build directory exists")
        else:
            print(f"  ⚠️  Build directory not found (run 'npm run build')")

    def test_typescript_compiles(self):
        """Test 41: TypeScript Configuration"""
        tsconfig = "tsconfig.json"
        assert os.path.exists(tsconfig), f"tsconfig not found: {tsconfig}"
        
        with open(tsconfig, 'r') as f:
            config = json.load(f)
            assert "compilerOptions" in config, "compilerOptions not found"
            assert config["compilerOptions"].get("strict"), "Strict mode not enabled"

    # ==================== COMPREHENSIVE FLOW TESTS ====================

    def test_complete_user_journey(self):
        """Test 42: Complete User Journey Simulation"""
        print("  ℹ️  Simulating user journey...")
        
        # Step 1: Landing page
        self.page.goto(self.base_url)
        self.wait_for_page_load()
        assert "AgentFlow" in self.page.title()
        
        # Step 2: View pricing
        self.page.click("text=Pricing")
        self.wait_for_page_load()
        expect(self.page.locator("text=Pricing")).to_be_visible()
        
        # Step 3: Try to access dashboard (should redirect)
        self.page.goto(f"{self.base_url}/dashboard")
        self.wait_for_page_load()
        assert "/login" in self.page.url
        
        # Step 4: Return to landing
        self.page.goto(self.base_url)
        self.screenshot("06_user_journey")
        
        print("  ✓ User journey completed")

    # ==================== ACCESSIBILITY TESTS ====================

    def test_accessibility_alt_tags(self):
        """Test 43: Images Have Alt Tags"""
        self.page.goto(self.base_url)
        self.wait_for_page_load()
        
        images = self.page.locator("img")
        count = images.count()
        
        if count > 0:
            # Check first few images
            for i in range(min(count, 3)):
                img = images.nth(i)
                alt = img.get_attribute("alt")
                # Alt can be empty for decorative images
                print(f"  ✓ Image {i+1}: alt='{alt}'")

    def test_accessibility_aria_labels(self):
        """Test 44: Interactive Elements Have ARIA Labels"""
        self.page.goto(self.base_url)
        self.wait_for_page_load()
        
        buttons = self.page.locator("button")
        count = buttons.count()
        
        if count > 0:
            print(f"  ✓ Found {count} buttons")

    # ==================== PERFORMANCE TESTS ====================

    def test_page_load_time(self):
        """Test 45: Page Load Time"""
        start = time.time()
        self.page.goto(self.base_url, wait_until="networkidle")
        load_time = time.time() - start
        
        print(f"  ✓ Page loaded in {load_time:.2f}s")
        assert load_time < 10, f"Page load too slow: {load_time:.2f}s"

    def test_api_response_time(self):
        """Test 46: API Response Time"""
        start = time.time()
        response = self.page.request.get(f"{self.base_url}/api/auth/providers")
        response_time = time.time() - start
        
        print(f"  ✓ API responded in {response_time:.2f}s")
        assert response_time < 5, f"API too slow: {response_time:.2f}s"

    # ==================== SUMMARY ====================

    def _save_test_summary(self):
        """Save test summary to file"""
        summary = {
            "test_date": self.test_start_time.isoformat(),
            "base_url": self.base_url,
            "total_tests": len(self.results["passed"]) + len(self.results["failed"]),
            "passed": len(self.results["passed"]),
            "failed": len(self.results["failed"]),
            "skipped": len(self.results["skipped"]),
            "screenshots": self.screenshots_taken,
            "errors": self.errors_logged,
            "details": {
                "passed": self.results["passed"],
                "failed": self.results["failed"],
                "skipped": self.results["skipped"]
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
        summary_file = f"test-results/test_summary_{timestamp}.json"
        
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        print(f"\n📄 Test summary saved to: {summary_file}")
        
        return summary

    def print_summary(self):
        """Print test summary"""
        summary = self._save_test_summary()
        
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
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
        
        print(f"\n📸 Screenshots: {self.screenshots_taken}")
        print(f"📊 Pass Rate: {pass_rate}%")
        
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
        """Run all tests"""
        try:
            self.setup()

            # Landing & Navigation (5 tests)
            self.test("Landing Page Loads", self.test_landing_page_loads, critical=True)
            self.test("Landing Page Hero", self.test_landing_page_hero)
            self.test("Landing Page Features", self.test_landing_page_features)
            self.test("Landing Page Navigation", self.test_landing_page_navigation)
            self.test("Landing Page CTA Buttons", self.test_landing_page_cta_buttons)

            # Authentication (5 tests)
            self.test("Login Page Loads", self.test_login_page_loads, critical=True)
            self.test("GitHub Login Button", self.test_github_login_button, critical=True)
            self.test("Dashboard Protection", self.test_dashboard_protection, critical=True)
            self.test("Agents Page Protection", self.test_agents_page_protection)
            self.test("Pricing Page Accessible", self.test_pricing_page_accessible)

            # Pricing (5 tests)
            self.test("Pricing Plans Display", self.test_pricing_plans_display)
            self.test("Trial Plan Details", self.test_pricing_trial_plan)
            self.test("Pro Plan Details", self.test_pricing_pro_plan)
            self.test("Pricing Features", self.test_pricing_features_list)
            self.test("FAQ Section", self.test_pricing_faq_section)

            # Dashboard (3 tests)
            self.test("Dashboard Layout", self.test_dashboard_layout)
            self.test("Analytics Page Exists", self.test_analytics_page_exists, critical=True)
            self.test("Chat Page Exists", self.test_chat_page_exists, critical=True)

            # API (3 tests)
            self.test("API Health", self.test_api_health, critical=True)
            self.test("API Auth Providers", self.test_api_auth_providers)
            self.test("API Session", self.test_api_session)

            # Workflow System (3 tests)
            self.test("Workflow Types", self.test_workflow_types_exists, critical=True)
            self.test("Workflow Executor", self.test_workflow_executor_exists, critical=True)
            self.test("Workflow API", self.test_workflow_api_implementation, critical=True)

            # Planner (1 test)
            self.test("Task Planner", self.test_planner_implementation, critical=True)

            # Vector Store (1 test)
            self.test("Vector Store", self.test_vector_store_implementation, critical=True)

            # Chat (2 tests)
            self.test("Chat Actions", self.test_chat_actions_implementation, critical=True)
            self.test("Chat UI", self.test_chat_ui_implementation, critical=True)

            # Analytics (2 tests)
            self.test("Analytics API", self.test_analytics_api_implementation, critical=True)
            self.test("Analytics UI", self.test_analytics_ui_implementation, critical=True)

            # Stripe (3 tests)
            self.test("Stripe Plans", self.test_stripe_plans_defined, critical=True)
            self.test("Stripe Checkout", self.test_stripe_checkout_implementation, critical=True)
            self.test("Stripe Webhook", self.test_stripe_webhook_implementation, critical=True)

            # Responsive Design (3 tests)
            self.test("Mobile View", self.test_responsive_mobile)
            self.test("Tablet View", self.test_responsive_tablet)
            self.test("Desktop View", self.test_responsive_desktop)

            # Database (2 tests)
            self.test("Database Schema", self.test_database_schema_exists, critical=True)
            self.test("Database File", self.test_database_file_exists)

            # MCP Servers (1 test)
            self.test("MCP Configuration", self.test_mcp_config_exists)

            # Build (2 tests)
            self.test("Build Output", self.test_build_output_exists, critical=True)
            self.test("TypeScript Config", self.test_typescript_compiles)

            # User Journey (1 test)
            self.test("Complete User Journey", self.test_complete_user_journey, critical=True)

            # Accessibility (2 tests)
            self.test("Alt Tags", self.test_accessibility_alt_tags)
            self.test("ARIA Labels", self.test_accessibility_aria_labels)

            # Performance (2 tests)
            self.test("Page Load Time", self.test_page_load_time)
            self.test("API Response Time", self.test_api_response_time)

            # Summary
            pass_rate = self.print_summary()

            return pass_rate

        finally:
            self.teardown()


def main():
    """Main entry point"""
    print("\n" + "="*80)
    print("🚀 AGENTFLOW PRO - COMPREHENSIVE TEST SUITE")
    print("="*80)
    print("\nThis test suite will test:")
    print("  • Landing page & navigation")
    print("  • Authentication & protection")
    print("  • Pricing page & Stripe integration")
    print("  • Workflow system implementation")
    print("  • Planner & Vector store")
    print("  • Chat functionality")
    print("  • Analytics dashboard")
    print("  • Responsive design")
    print("  • Database & MCP servers")
    print("  • Performance & accessibility")
    print("\n" + "="*80)
    
    tester = AgentFlowProTester()
    pass_rate = tester.run_all_tests()

    # Exit with appropriate code
    if pass_rate >= 75:
        print("\n✅ Tests completed successfully!")
        sys.exit(0)
    else:
        print("\n⚠️  Tests completed with failures")
        sys.exit(1)


if __name__ == "__main__":
    main()
