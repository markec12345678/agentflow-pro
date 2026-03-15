"""
AgentFlow Pro Promotional Video Generator
Uses Seedance 2.0 API via XSkill AI

Seedance 2.0 is ByteDance's cinema-quality AI video generation model.
Get your API key at: https://www.xskill.ai
"""

import requests
import time
import os
import json
from typing import Optional

# Configuration - API Key from XSkill AI
API_KEY = os.environ.get("XSKILL_API_KEY", "sk-13e8999a5be6c5427603c6b514b469873fc0d643e8755b32")
BASE_URL = "https://api.xskill.ai/api/v3"

# AgentFlow Pro promotional video prompt
PROMPT = "@图片 1 Professional AI dashboard animation, smooth transitions showing analytics charts growing, calendar pages flipping, booking notifications appearing, task cards moving, revenue graphs rising, modern blue theme, corporate presentation style, 4k quality, smooth motion, cinematic lighting, clean UI/UX, SaaS platform demo"

class XSkillVideoGenerator:
    def __init__(self, api_key: str = API_KEY):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })
    
    def create_task(self, prompt: str, image_url: Optional[str] = None) -> Optional[str]:
        """
        Create a video generation task.
        
        Args:
            prompt: Video description (can include @图片 1 for image reference)
            image_url: Optional image URL for image-to-video
            
        Returns:
            task_id if successful
        """
        url = f"{BASE_URL}/tasks/create"
        
        # Prepare media files if image provided
        media_files = []
        if image_url:
            media_files.append(image_url)
            prompt = prompt.replace("@图片 1", "@图片 1")
        
        payload = {
            "model": "st-ai/super-seed2",
            "params": {
                "prompt": prompt,
                "media_files": media_files if media_files else [],
                "aspect_ratio": "16:9",
                "duration": "5",
                "model": "Fast"
            }
        }
        
        print("=" * 70)
        print("AgentFlow Pro - Promotional Video Generation")
        print("Model: Seedance 2.0 (ByteDance) via XSkill AI")
        print("=" * 70)
        print(f"\n📝 Prompt: {prompt[:100]}...")
        print(f"⏱️  Duration: 5 seconds")
        print(f"📐 Resolution: 1920x1080 (16:9)")
        print(f"\n🎬 Starting video generation (this may take 2-3 minutes)...\n")
        
        try:
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == 200:
                task_id = data["data"]["task_id"]
                price = data["data"]["price"]
                print(f"✅ Task created successfully!")
                print(f"💰 Price: {price} credits")
                print(f"📋 Task ID: {task_id}")
                return task_id
            else:
                print(f"❌ Task creation failed: {data}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ API request failed: {e}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return None
    
    def query_task(self, task_id: str) -> Optional[str]:
        """
        Query task status and get result.
        
        Args:
            task_id: Task ID to query
            
        Returns:
            Video URL if complete
        """
        url = f"{BASE_URL}/tasks/query"
        
        payload = {
            "task_id": task_id
        }
        
        try:
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == 200:
                status = data["data"]["status"]
                
                if status == "completed":
                    result = data["data"]["result"]
                    if "output" in result and "images" in result["output"]:
                        video_url = result["output"]["images"][0]
                        return video_url
                    elif "output" in result and "video" in result["output"]:
                        video_url = result["output"]["video"]
                        return video_url
                    else:
                        print(f"⚠️  No video URL in result: {result}")
                        return None
                elif status == "failed":
                    print(f"❌ Task failed: {data}")
                    return None
                else:
                    return None  # Still processing
            else:
                print(f"❌ Query failed: {data}")
                return None
                
        except Exception as e:
            print(f"❌ Query error: {e}")
            return None
    
    def generate_video(self, prompt: str = PROMPT, image_url: Optional[str] = None, poll_interval: int = 10, max_retries: int = 30) -> Optional[str]:
        """
        Complete video generation workflow.
        
        Args:
            prompt: Video description
            image_url: Optional image for image-to-video
            poll_interval: Seconds between status checks
            max_retries: Maximum polling attempts
            
        Returns:
            Video URL when complete
        """
        # Create task
        task_id = self.create_task(prompt, image_url)
        if not task_id:
            return None
        
        # Poll for results
        print("\n⏳ Polling for results...")
        
        for attempt in range(max_retries):
            try:
                time.sleep(poll_interval)
                
                video_url = self.query_task(task_id)
                
                if video_url:
                    print(f"\n{'=' * 70}")
                    print("✅ Video generation completed successfully!")
                    print(f"{'=' * 70}")
                    print(f"\n📹 Video URL: {video_url}")
                    print(f"\n💡 Tip: Download and save to: public/promo/agentflow-pro-promo.mp4")
                    print(f"\n🎉 You can now use this video in:")
                    print(f"   • Landing page hero section")
                    print(f"   • Social media posts (LinkedIn, Twitter)")
                    print(f"   • Investor pitch deck")
                    print(f"   • Product demo presentations")
                    return video_url
                
                progress = (attempt + 1) * 10
                print(f"  → Still processing... (attempt {attempt + 1}/{max_retries}, ~{progress}s)")
                
            except Exception as e:
                print(f"  → Error: {e}")
                continue
        
        print(f"\n⚠️  Video generation timed out after {max_retries * poll_interval} seconds")
        print(f"   Task ID: {task_id}")
        print(f"   You can check status later using: python check_task_status.py {task_id}")
        return None


def main():
    """Main entry point for video generation."""
    print("\n" + "=" * 70)
    print("  AgentFlow Pro Promotional Video Generator")
    print("  Powered by Seedance 2.0 (ByteDance) via XSkill AI")
    print("=" * 70 + "\n")
    
    # Check API key
    api_key = os.environ.get("XSKILL_API_KEY", "sk-13e8999a5be6c5427603c6b514b469873fc0d643e8755b32")
    print(f"🔑 Using API Key: {api_key[:20]}...{api_key[-10:]}")
    
    # Create generator
    generator = XSkillVideoGenerator(api_key)
    
    # Generate the promotional video
    video_url = generator.generate_video(
        prompt=PROMPT,
        poll_interval=10,
        max_retries=30
    )
    
    if video_url:
        print("\n" + "=" * 70)
        print("SUCCESS!")
        print("=" * 70)
        print(f"\nYour promotional video is ready:")
        print(f"📹 {video_url}")
        print("\nNext steps:")
        print("1. Download the video")
        print("2. Save to: public/promo/agentflow-pro-promo.mp4")
        print("3. Add to your landing page")
        print("4. Share on social media")
        print("=" * 70 + "\n")
        
        # Save video URL to file
        with open("video_url.txt", "w") as f:
            f.write(video_url)
        print("💾 Video URL saved to: video_url.txt")
    else:
        print("\n" + "=" * 70)
        print("Video generation did not complete.")
        print("Please check your API key and try again.")
        print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
