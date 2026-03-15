"""
AgentFlow Pro Promotional Video Generator
Uses Seedance 2.0 API via ModelsLab (XSkill AI platform)

Seedance 2.0 is ByteDance's cinema-quality AI video generation model.
Get your API key at: https://modelslab.com or https://www.xskill.ai
"""

import requests
import time
import os
from typing import Optional

# Configuration
API_KEY = os.environ.get("MODELSLAB_API_KEY", "sk-13e8999a5be6c5427603c6b514b469873fc0d643e8755b32")
BASE_URL = "https://api.xskill.ai/api/v6/video"

# AgentFlow Pro promotional video prompt
PROMPT = """Professional AI dashboard animation, smooth transitions showing analytics charts growing, 
calendar pages flipping, booking notifications appearing, task cards moving, revenue graphs rising, 
modern blue theme, corporate presentation style, 4k quality, smooth motion, cinematic lighting, 
clean UI/UX, SaaS platform demo"""

NEGATIVE_PROMPT = "low quality, blurry, distorted, artifacts, watermark, text overlay, ugly, deformed"


def generate_seedance_video(
    prompt: str = PROMPT,
    duration: int = 5,
    width: int = 1920,
    height: int = 1080,
    negative_prompt: str = NEGATIVE_PROMPT
) -> Optional[str]:
    """
    Generate a video using Seedance 2.0 text-to-video.
    
    Args:
        prompt: Video description
        duration: Duration in seconds (recommended: 5-10)
        width: Output width (1920 for 1080p, 1280 for 720p)
        height: Output height (1080 for 1080p, 720 for 720p)
        negative_prompt: What to avoid in the video
    
    Returns:
        Video URL when complete
    """
    if not API_KEY:
        print("❌ Error: MODELSLAB_API_KEY not set")
        print("\nSet your API key:")
        print("  Windows PowerShell: $env:MODELSLAB_API_KEY='your_key'")
        print("  Linux/Mac: export MODELSLAB_API_KEY='your_key'")
        print("\nGet your API key at: https://modelslab.com or https://www.xskill.ai")
        return None
    
    url = f"{BASE_URL}/text2video"
    
    payload = {
        "key": API_KEY,
        "model_id": "seedance-t2v",
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "height": height,
        "width": width,
        "num_frames": duration * 24,  # 24fps
        "num_inference_steps": 30,
        "guidance_scale": 7.5,
        "output_type": "mp4",
        "webhook": None,
        "track_id": "agentflow-pro-promo"
    }
    
    print("=" * 70)
    print("AgentFlow Pro - Promotional Video Generation")
    print("Model: Seedance 2.0 (ByteDance) via ModelsLab/XSkill AI")
    print("=" * 70)
    print(f"\n📝 Prompt: {prompt[:100]}...")
    print(f"⏱️  Duration: {duration} seconds")
    print(f"📐 Resolution: {width}x{height}")
    print(f"\n🎬 Starting video generation (this may take 2-3 minutes)...\n")
    
    try:
        # Submit generation request
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "success":
            video_url = data["output"][0]
            print("\n✅ Video generation completed instantly!")
            print(f"\n📹 Video URL: {video_url}")
            return video_url
            
        elif data.get("status") == "processing":
            fetch_url = data.get("fetch_result")
            print(f"⏳ Video is processing...")
            print(f"Task ID: {data.get('id', 'N/A')}")
            return poll_for_result(fetch_url)
            
        else:
            print(f"\n❌ Generation failed: {data}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ API request failed: {e}")
        return None
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return None


def poll_for_result(fetch_url: str, max_retries: int = 30) -> Optional[str]:
    """
    Poll the fetch URL until video is ready.
    
    Args:
        fetch_url: URL to check for results
        max_retries: Maximum number of polling attempts
    
    Returns:
        Video URL when complete
    """
    print("\n⏳ Polling for results...")
    
    for attempt in range(max_retries):
        try:
            time.sleep(10)  # Wait 10 seconds between polls
            
            response = requests.post(fetch_url, json={"key": API_KEY}, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            status = data.get("status", "unknown")
            
            if status == "success":
                video_url = data["output"][0]
                print(f"\n{'=' * 70}")
                print("✅ Video generation completed successfully!")
                print(f"{'=' * 70}")
                print(f"\n📹 Video URL: {video_url}")
                print(f"💡 Tip: Download and save to: public/promo/agentflow-pro-promo.mp4")
                print(f"\n🎉 You can now use this video in:")
                print(f"   • Landing page hero section")
                print(f"   • Social media posts (LinkedIn, Twitter)")
                print(f"   • Investor pitch deck")
                print(f"   • Product demo presentations")
                return video_url
                
            elif status == "error":
                print(f"\n❌ Error: {data.get('message', 'Unknown error')}")
                return None
                
            elif status == "processing":
                progress = data.get("progress", "unknown")
                print(f"  → Still processing... (attempt {attempt + 1}/{max_retries})")
                if progress != "unknown":
                    print(f"     Progress: {progress}%")
            
            else:
                print(f"  → Status: {status} (attempt {attempt + 1}/{max_retries})")
                
        except requests.exceptions.RequestException as e:
            print(f"  → Network error: {e}")
            continue
        except Exception as e:
            print(f"  → Error: {e}")
            continue
    
    print(f"\n⚠️  Video generation timed out after {max_retries * 10} seconds")
    print(f"   You can check the status later using the task ID")
    return None


def main():
    """Main entry point for video generation."""
    print("\n" + "=" * 70)
    print("  AgentFlow Pro Promotional Video Generator")
    print("  Powered by Seedance 2.0 (ByteDance) via XSkill AI")
    print("=" * 70 + "\n")
    
    # Generate the promotional video
    video_url = generate_seedance_video(
        prompt=PROMPT,
        duration=5,
        width=1920,
        height=1080
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
    else:
        print("\n" + "=" * 70)
        print("Video generation did not complete.")
        print("Please check your API key and try again.")
        print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
