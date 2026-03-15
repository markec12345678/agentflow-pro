"""
AgentFlow Pro - English Promotional Video Generator
Using XSkill AI with English text overlays

This creates a video with ALL English text:
- "Analytics Dashboard"
- "Calendar & Booking" 
- "Task Management"
- "Revenue Tracking"
- "AgentFlow Pro"
- "Multi-Agent AI Platform"
"""

import requests
import time

# Configuration
API_KEY = "sk-13e8999a5be6c5427603c6b514b469873fc0d643e8755b32"
BASE_URL = "https://api.xskill.ai/api/v3"

# ENGLISH PROMPT - All text will be in English
PROMPT = """Professional AI dashboard animation with English text overlays, electric indigo #6F00FF and deep navy #03012D color scheme, modern bento grid layout with 4 sections: 

Section 1 - Analytics Dashboard: Line chart with glowing cyan points being drawn step-by-step, text label "Analytics Dashboard" in white sans-serif font appearing smoothly

Section 2 - Calendar & Booking: Calendar grid with purple booking blocks appearing, text label "Calendar & Booking" in white, dates and numbers in English

Section 3 - Task Management: Task list with priority indicators (red for high, orange for medium, green for low), progress bars filling, text labels "Task Management" and task names in English like "Clean Room 201", "Check-in: John Smith"

Section 4 - Revenue Tracking: Bar chart with purple gradient bars growing upward, dollar signs and numbers, text label "Revenue Tracking" in white

Header: "AgentFlow Pro" in large white bold font, subtitle "Multi-Agent AI Platform" in smaller gray font

Dark mode interface, smooth micro-interactions, glowing accents, professional SaaS demo, 4K quality, smooth 60fps motion, corporate presentation style, ALL TEXT IN ENGLISH"""


class EnglishVideoGenerator:
    def __init__(self, api_key):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })
    
    def create_task(self, prompt: str):
        """Create video generation task"""
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
        print("  AgentFlow Pro - ENGLISH Video Generation")
        print("  Model: Seedance 1.5 Pro (ByteDance) via XSkill AI")
        print("  Language: ALL TEXT IN ENGLISH")
        print("=" * 70)
        print(f"\n📝 Prompt: {prompt[:200]}...")
        print(f"⏱️  Duration: 5 seconds")
        print(f"📐 Resolution: 1920x1080 (16:9)")
        print(f"🔤 Language: English text overlays")
        print(f"\n🎬 Starting video generation (2-3 minutes)...\n")
        
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
        
        print("\n⏳ Generating English video...")
        
        for attempt in range(30):
            time.sleep(10)
            
            video_url = self.query_task(task_id)
            
            if video_url:
                print(f"\n{'=' * 70}")
                print("✅ ENGLISH VIDEO GENERATED!")
                print(f"{'=' * 70}")
                print(f"\n📹 Video URL: {video_url}")
                print(f"\n🔤 English Text Elements:")
                print(f"   • Analytics Dashboard")
                print(f"   • Calendar & Booking")
                print(f"   • Task Management")
                print(f"   • Revenue Tracking")
                print(f"   • AgentFlow Pro")
                print(f"   • Multi-Agent AI Platform")
                print(f"   • All numbers and dates in English")
                return video_url
            
            print(f"  → Processing... ({attempt + 1}/30, ~{(attempt + 1) * 10}s)")
        
        return None


def main():
    print("\n" + "=" * 70)
    print("  AgentFlow Pro - English Promotional Video")
    print("  Powered by XSkill AI + Seedance 1.5 Pro")
    print("  ALL TEXT IN ENGLISH")
    print("=" * 70 + "\n")
    
    generator = EnglishVideoGenerator(API_KEY)
    video_url = generator.generate()
    
    if video_url:
        print("\n" + "=" * 70)
        print("SUCCESS!")
        print("=" * 70)
        print(f"\n📹 Download: {video_url}")
        print("\n💾 Save to: public/promo/agentflow-pro-promo-en.mp4")
        print("\n🚀 Use in:")
        print("   • Landing page hero section")
        print("   • LinkedIn/Twitter posts")
        print("   • Investor pitch deck")
        print("   • Product demos")
        print("=" * 70 + "\n")
        
        # Save URL
        with open("english_video_url.txt", "w", encoding="utf-8") as f:
            f.write(video_url)
        print("💾 URL saved to: english_video_url.txt")


if __name__ == "__main__":
    main()
