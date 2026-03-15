"""
AgentFlow Pro - Premium Promotional Video Generator
Using XSkill AI MCP Server with Premium Prompt

Based on 2025-2026 Design Trends Research:
- Electric Indigo + Deep Navy color scheme
- Bento grid layout
- Micro-interactions
- Dark mode first
- High contrast CTAs
"""

import requests
import time
import os

# Configuration
API_KEY = "sk-13e8999a5be6c5427603c6b514b469873fc0d643e8755b32"
BASE_URL = "https://api.xskill.ai/api/v3"

# Premium prompt based on research
PROMPT = """Cinematic AI dashboard animation, electric indigo #6F00FF and deep navy #03012D color scheme, modern bento grid layout with 4 sections: analytics line chart with glowing cyan #22D3EE points being drawn step-by-step, calendar grid with purple booking blocks appearing smoothly, task management list with high priority red indicators and progress bars filling, revenue bar chart with purple gradient bars growing upward, dark mode interface, subtle micro-interactions, glowing accents, professional SaaS demo, 4K quality, smooth 60fps motion, corporate presentation style"""

class XSkillPremiumGenerator:
    def __init__(self, api_key):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })
    
    def create_task(self, prompt: str):
        """Create video generation task using XSkill AI"""
        url = f"{BASE_URL}/tasks/create"
        
        payload = {
            "model": "fal-ai/bytedance/seedance/v1.5/pro/text-to-video",
            "params": {
                "prompt": prompt,
                "aspect_ratio": "16:9",
                "duration": "5",
                "model": "Fast"
            }
        }
        
        print("=" * 70)
        print("  AgentFlow Pro - PREMIUM Video Generation")
        print("  Model: Seedance 1.5 Pro (ByteDance) via XSkill AI")
        print("  Style: 2025-2026 Design Trends")
        print("=" * 70)
        print(f"\n📝 Prompt: {prompt[:150]}...")
        print(f"⏱️  Duration: 5 seconds")
        print(f"📐 Resolution: 1920x1080 (16:9)")
        print(f"🎨 Style: Electric Indigo Dark Theme")
        print(f"\n🎬 Starting premium video generation...\n")
        
        try:
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == 200:
                task_id = data["data"]["task_id"]
                price = data["data"]["price"]
                print(f"✅ Task created!")
                print(f"💰 Price: {price} credits")
                print(f"📋 Task ID: {task_id}")
                return task_id
            else:
                print(f"❌ Failed: {data}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def query_task(self, task_id: str):
        """Query task status"""
        url = f"{BASE_URL}/tasks/query"
        
        payload = {"task_id": task_id}
        
        try:
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == 200:
                status = data["data"]["status"]
                
                if status == "completed":
                    result = data["data"]["result"]
                    if "output" in result:
                        if "video" in result["output"]:
                            return result["output"]["video"]
                        elif "images" in result["output"]:
                            return result["output"]["images"][0]
                
                return None
            else:
                return None
                
        except:
            return None
    
    def generate(self, prompt: str = PROMPT):
        """Complete generation workflow"""
        task_id = self.create_task(prompt)
        if not task_id:
            return None
        
        print("\n⏳ Generating premium video...")
        
        for attempt in range(30):
            time.sleep(10)
            
            video_url = self.query_task(task_id)
            
            if video_url:
                print(f"\n{'=' * 70}")
                print("✅ PREMIUM VIDEO GENERATED!")
                print(f"{'=' * 70}")
                print(f"\n📹 Video URL: {video_url}")
                print(f"\n🎨 Features:")
                print(f"   • Electric Indigo color scheme")
                print(f"   • Bento grid layout")
                print(f"   • Micro-interactions")
                print(f"   • Dark mode design")
                print(f"   • Glowing accents")
                print(f"   • Professional SaaS style")
                return video_url
            
            print(f"  → Processing... ({attempt + 1}/30, ~{(attempt + 1) * 10}s)")
        
        return None


def main():
    print("\n" + "=" * 70)
    print("  AgentFlow Pro - Premium Promotional Video")
    print("  Powered by XSkill AI + Seedance 1.5 Pro")
    print("  Based on 2025-2026 Design Trends Research")
    print("=" * 70 + "\n")
    
    generator = XSkillPremiumGenerator(API_KEY)
    video_url = generator.generate()
    
    if video_url:
        print("\n" + "=" * 70)
        print("SUCCESS!")
        print("=" * 70)
        print(f"\n📹 Download: {video_url}")
        print("\n💾 Save to: public/promo/agentflow-pro-premium.mp4")
        print("\n🚀 Use in:")
        print("   • Landing page hero section")
        print("   • LinkedIn/Twitter posts")
        print("   • Investor pitch deck")
        print("   • Product demos")
        print("=" * 70 + "\n")
        
        # Save URL
        with open("premium_video_url.txt", "w") as f:
            f.write(video_url)
        print("💾 URL saved to: premium_video_url.txt")


if __name__ == "__main__":
    main()
