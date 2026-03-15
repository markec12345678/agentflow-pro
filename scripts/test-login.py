"""
Test Login Flow - AgentFlow Pro
"""

from playwright.sync_api import sync_playwright
import time

def test_login():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f'🌐 Console [{msg.type}]: {msg.text}'))
        page.on('pageerror', lambda err: print(f'❌ Page Error: {err}'))
        page.on('response', lambda res: print(f'📡 {res.status} {res.request.method} {res.request.url}'))
        
        print('\n🔍 Testing Login Flow...\n')
        
        # Step 1: Go to login page
        print('1️⃣ Navigating to login page...')
        page.goto('http://localhost:3000/login', wait_until='networkidle')
        time.sleep(2)
        
        # Take screenshot
        page.screenshot(path='f:\\ffff\\agentflow-pro\\debug-screenshots\\01-login-page.png', full_page=True)
        print('✅ Login page loaded\n')
        
        # Step 2: Check if form exists
        print('2️⃣ Checking login form...')
        email_input = page.locator('input[type="email"]')
        password_input = page.locator('input[type="password"]')
        submit_button = page.locator('button[type="submit"]')
        
        print(f'   Email input found: {email_input.count() > 0}')
        print(f'   Password input found: {password_input.count() > 0}')
        print(f'   Submit button found: {submit_button.count() > 0}\n')
        
        # Step 3: Fill in credentials
        print('3️⃣ Filling credentials...')
        email_input.fill('admin@admin.com')
        password_input.fill('admin123')
        print('   ✅ Credentials filled\n')
        
        # Take screenshot before submit
        page.screenshot(path='f:\\ffff\\agentflow-pro\\debug-screenshots\\02-form-filled.png', full_page=True)
        
        # Step 4: Submit form
        print('4️⃣ Submitting form...')
        submit_button.click()
        
        # Wait for navigation or error
        try:
            page.wait_for_url('**/dashboard', timeout=10000)
            print('✅ Redirected to dashboard!\n')
            
            # Take dashboard screenshot
            page.screenshot(path='f:\\ffff\\agentflow-pro\\debug-screenshots\\03-dashboard.png', full_page=True)
            
            # Check dashboard content
            print('5️⃣ Checking dashboard content...')
            dashboard_url = page.url
            print(f'   Current URL: {dashboard_url}')
            
            # Check for stats
            stats = page.locator('[data-testid="stats"]')
            print(f'   Stats component found: {stats.count() > 0}')
            
        except Exception as e:
            print(f'❌ Navigation failed: {e}\n')
            
            # Take screenshot of error state
            page.screenshot(path='f:\\ffff\\agentflow-pro\\debug-screenshots\\03-error.png', full_page=True)
            
            # Check current URL
            current_url = page.url
            print(f'   Current URL: {current_url}')
            
            # Check for error messages
            error_msg = page.locator('[class*="error"], [class*="alert"], text=Invalid, text=Error')
            if error_msg.count() > 0:
                print(f'   Error message found: {error_msg.inner_text()}\n')
        
        browser.close()
        print('\n✅ Test completed!\n')

if __name__ == '__main__':
    test_login()
