"""
AgentFlow Pro - Professional Promotional Materials
Complete Package with 2025-2026 Design Trends

Generated Assets:
1. Promo Image (Electric Indigo Theme) - agentflow-pro-promo-2025.png
2. Promo Video (Seedance 1.5 Pro) - agentflow-pro-promo.mp4
3. Landing Page HTML Component

Based on research of: Monday.com, Notion AI, Airtable AI, Zapier, Make.com, n8n, Retool, Bubble
"""

import os

# Create landing page component
LANDING_PAGE_HTML = """
<!-- AgentFlow Pro - Hero Section with Video -->
<!-- Based on 2025-2026 Design Trends -->

<section class="hero-section" style="
  background: linear-gradient(135deg, #03012D 0%, #0A0A2E 100%);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
">
  <!-- Animated Background Elements -->
  <div style="position: absolute; top: -10%; right: -10%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(111,0,255,0.15) 0%, transparent 70%); border-radius: 50%;"></div>
  <div style="position: absolute; bottom: -10%; left: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%); border-radius: 50%;"></div>
  
  <div class="container" style="max-width: 1400px; margin: 0 auto; padding: 60px 20px; position: relative; z-index: 10;">
    <!-- Header with Logo & CTA -->
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 60px;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #6F00FF 0%, #22D3EE 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 20px;">AF</div>
        <div>
          <h1 style="color: white; margin: 0; font-size: 24px;">AgentFlow Pro</h1>
          <p style="color: #94A3B8; margin: 5px 0 0 0; font-size: 14px;">Multi-Agent AI Platform</p>
        </div>
      </div>
      
      <button style="
        background: linear-gradient(135deg, #6F00FF 0%, #8B3DFF 100%);
        color: white;
        border: none;
        padding: 15px 40px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(111,0,255,0.4);
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 30px rgba(111,0,255,0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(111,0,255,0.4)'">
        Start Free Trial
      </button>
    </header>
    
    <!-- Main Hero Content -->
    <div style="text-align: center; margin-bottom: 60px;">
      <h2 style="
        font-size: 56px;
        font-weight: 800;
        color: white;
        margin-bottom: 20px;
        line-height: 1.1;
        background: linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      ">
        Automate Your Business<br>with AI Agents
      </h2>
      <p style="
        font-size: 20px;
        color: #94A3B8;
        max-width: 700px;
        margin: 0 auto 40px auto;
        line-height: 1.6;
      ">
        Multi-agent AI platform for business automation with Research, Content, Code, and Deploy agents. Build workflows, manage knowledge, and scale your operations.
      </p>
      
      <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
        <button style="
          background: linear-gradient(135deg, #6F00FF 0%, #8B3DFF 100%);
          color: white;
          border: none;
          padding: 18px 50px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(111,0,255,0.4);
        ">
          Start Building Free
        </button>
        <button style="
          background: rgba(255,255,255,0.1);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 18px 50px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 18px;
          cursor: pointer;
          backdrop-filter: blur(10px);
        ">
          🎬 Watch Demo
        </button>
      </div>
    </div>
    
    <!-- Promo Video Section -->
    <div style="
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(111,0,255,0.2);
      border-radius: 20px;
      padding: 10px;
      margin-bottom: 60px;
      box-shadow: 0 20px 60px rgba(111,0,255,0.2);
    ">
      <video autoplay muted loop playsinline style="
        width: 100%;
        border-radius: 12px;
        display: block;
      ">
        <source src="screenshots/agentflow-pro-promo.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
    
    <!-- Social Proof -->
    <div style="text-align: center; margin-bottom: 60px;">
      <p style="color: #94A3B8; font-size: 14px; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px;">Trusted by 500+ innovative teams</p>
      <div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap; opacity: 0.6;">
        <!-- Company logo placeholders -->
        <div style="height: 40px; width: 120px; background: rgba(255,255,255,0.2); border-radius: 8px;"></div>
        <div style="height: 40px; width: 120px; background: rgba(255,255,255,0.2); border-radius: 8px;"></div>
        <div style="height: 40px; width: 120px; background: rgba(255,255,255,0.2); border-radius: 8px;"></div>
        <div style="height: 40px; width: 120px; background: rgba(255,255,255,0.2); border-radius: 8px;"></div>
        <div style="height: 40px; width: 120px; background: rgba(255,255,255,0.2); border-radius: 8px;"></div>
      </div>
    </div>
    
    <!-- Bento Grid Feature Showcase -->
    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 60px;
    ">
      <!-- Analytics Card -->
      <div style="
        background: rgba(13,13,58,0.8);
        border: 1px solid rgba(111,0,255,0.3);
        border-radius: 16px;
        padding: 30px;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='rgba(111,0,255,0.6)'; this.style.boxShadow='0 10px 40px rgba(111,0,255,0.3)'">
        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%); border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📊</div>
        <h3 style="color: white; font-size: 22px; margin-bottom: 10px;">Real-Time Analytics</h3>
        <p style="color: #94A3B8; line-height: 1.6;">Track occupancy rates, revenue metrics, and performance KPIs with beautiful visualizations.</p>
      </div>
      
      <!-- Calendar Card -->
      <div style="
        background: rgba(13,13,58,0.8);
        border: 1px solid rgba(111,0,255,0.3);
        border-radius: 16px;
        padding: 30px;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='rgba(111,0,255,0.6)'; this.style.boxShadow='0 10px 40px rgba(111,0,255,0.3)'">
        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #6F00FF 0%, #8B3DFF 100%); border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📅</div>
        <h3 style="color: white; font-size: 22px; margin-bottom: 10px;">Smart Calendar</h3>
        <p style="color: #94A3B8; line-height: 1.6;">Manage bookings, automate scheduling, and sync across all your channels seamlessly.</p>
      </div>
      
      <!-- Tasks Card -->
      <div style="
        background: rgba(13,13,58,0.8);
        border: 1px solid rgba(111,0,255,0.3);
        border-radius: 16px;
        padding: 30px;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='rgba(111,0,255,0.6)'; this.style.boxShadow='0 10px 40px rgba(111,0,255,0.3)'">
        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #39FF14 0%, #22C55E 100%); border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">✅</div>
        <h3 style="color: white; font-size: 22px; margin-bottom: 10px;">Task Automation</h3>
        <p style="color: #94A3B8; line-height: 1.6;">AI-powered task management with priority detection and automated assignments.</p>
      </div>
      
      <!-- Revenue Card -->
      <div style="
        background: rgba(13,13,58,0.8);
        border: 1px solid rgba(111,0,255,0.3);
        border-radius: 16px;
        padding: 30px;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='rgba(111,0,255,0.6)'; this.style.boxShadow='0 10px 40px rgba(111,0,255,0.3)'">
        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">💰</div>
        <h3 style="color: white; font-size: 22px; margin-bottom: 10px;">Revenue Tracking</h3>
        <p style="color: #94A3B8; line-height: 1.6;">Monitor income streams, forecast revenue, and optimize pricing with AI insights.</p>
      </div>
    </div>
    
    <!-- Feature Bullets -->
    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 60px;
    ">
      <div style="display: flex; align-items: center; gap: 10px; color: #94A3B8;">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#39FF14"/><path d="M6 10L9 13L14 7" stroke="#03012D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Multi-Agent AI System</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; color: #94A3B8;">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#39FF14"/><path d="M6 10L9 13L14 7" stroke="#03012D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Workflow Builder</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; color: #94A3B8;">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#39FF14"/><path d="M6 10L9 13L14 7" stroke="#03012D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Memory Knowledge Graph</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; color: #94A3B8;">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#39FF14"/><path d="M6 10L9 13L14 7" stroke="#03012D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Stripe Integration</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; color: #94A3B8;">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#39FF14"/><path d="M6 10L9 13L14 7" stroke="#03012D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Playwright E2E Tests</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; color: #94A3B8;">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="#39FF14"/><path d="M6 10L9 13L14 7" stroke="#03012D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Vercel Deploy Ready</span>
      </div>
    </div>
  </div>
</section>
"""

# Save landing page
with open("landing-page-hero.html", "w", encoding="utf-8") as f:
    f.write(LANDING_PAGE_HTML)

print("\n" + "=" * 70)
print("  AgentFlow Pro - Professional Promotional Package")
print("=" * 70)
print("\n✅ Generated Assets:")
print("\n1. 📸 Promo Image (2025 Design)")
print("   📁 agentflow-pro-promo-2025.png")
print("   📐 1920x1080 Full HD")
print("   🎨 Electric Indigo Theme")
print("   📊 Bento Grid Layout")
print("\n2. 🎬 Promo Video")
print("   📁 screenshots/agentflow-pro-promo.mp4")
print("   ⏱️  5 seconds")
print("   📦 6.6 MB")
print("   🎬 Seedance 1.5 Pro")
print("\n3. 🌐 Landing Page HTML")
print("   📁 landing-page-hero.html")
print("   ✨ Complete hero section")
print("   🎯 Conversion optimized")
print("   📱 Mobile responsive")
print("\n🎨 Design Trends Applied:")
print("   ✅ Electric Indigo + Deep Navy colors")
print("   ✅ Bento grid layout")
print("   ✅ Dark mode first")
print("   ✅ High contrast CTAs")
print("   ✅ Micro-interactions")
print("   ✅ Social proof section")
print("   ✅ Gradient backgrounds")
print("   ✅ Glassmorphism effects")
print("\n📊 Based on Research:")
print("   • Monday.com AI")
print("   • Notion AI")
print("   • Airtable AI")
print("   • Zapier AI")
print("   • Make.com")
print("   • n8n.io")
print("   • Retool")
print("   • Bubble.io")
print("\n" + "=" * 70)
print("\n🚀 Next Steps:")
print("   1. Open landing-page-hero.html in browser")
print("   2. Copy hero section to your landing page")
print("   3. Replace video path with actual location")
print("   4. Add real customer logos to social proof")
print("   5. Connect CTA buttons to signup flow")
print("\n" + "=" * 70 + "\n")
