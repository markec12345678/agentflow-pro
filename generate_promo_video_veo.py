"""
AgentFlow Pro Promotional Video Generator
Uses inference.sh Python SDK with Google Veo 3.1 (Highest Quality)
"""

import os
import time
from inferencesh import inference

# API key from environment
API_KEY = os.environ.get("INFERENCE_API_KEY")

if not API_KEY:
    print("❌ Error: INFERENCE_API_KEY not set")
    print("\nSet your API key:")
    print("  Windows PowerShell: $env:INFERENCE_API_KEY='inf_your_key'")
    print("  Linux/Mac: export INFERENCE_API_KEY='inf_your_key'")
    print("\nGet your API key at: https://inference.sh/settings/api-keys")
    exit(1)

client = inference(api_key=API_KEY)

# Professional promotional video prompt for AgentFlow Pro
PROMPT = "Professional AI dashboard animation, smooth transitions showing analytics charts growing, calendar pages flipping, booking notifications appearing, task cards moving, revenue graphs rising, modern blue theme, corporate presentation style, 4k quality, smooth motion, cinematic lighting"

print("=" * 60)
print("AgentFlow Pro - Promotional Video Generation")
print("Model: Google Veo 3.1 (Highest Quality)")
print("=" * 60)
print(f"\nPrompt: {PROMPT}\n")
print("Starting video generation (this may take 2-5 minutes)...\n")

try:
    # Run video generation with streaming progress
    for update in client.run({
        "app": "google/veo-3-1-fast",
        "input": {
            "prompt": PROMPT,
            "duration": 5
        }
    }, stream=True):
        status = update.get('status', 'unknown')
        
        if status == 'processing':
            print(f"⏳ Processing...")
        elif status == 'running':
            print(f"🎬 Generating video...")
        elif status == 'completed':
            print("\n✅ Video generation completed!")
            if 'output' in update:
                output = update['output']
                video_url = output.get('video_url', 'N/A')
                print(f"\n📹 Video URL: {video_url}")
                print(f"📊 Task ID: {update.get('id')}")
                print(f"\n💡 Tip: Download the video and save to: public/promo/agentflow-pro-promo.mp4")
            break
        else:
            print(f"Status: {status}")
        
        if update.get("logs"):
            latest_log = update["logs"][-1]
            if latest_log:
                print(f"  → {latest_log}")
    
    print("\n" + "=" * 60)
    print("Video generation process finished")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error during video generation: {e}")
    print("\nTroubleshooting:")
    print("  1. Check your API key is valid")
    print("  2. Ensure you have credits in your inference.sh account")
    print("  3. Try again in a few moments")
