"""
AgentFlow Pro Promotional Video Generator
Uses inference.sh Python SDK with Grok Video or Wan 2.5
"""

import os
import time
from inferencesh import inference

# API key from environment or use default
API_KEY = os.environ.get("INFERENCE_API_KEY", "inf_test_key")

client = inference(api_key=API_KEY)

# Professional promotional video prompt for AgentFlow Pro
PROMPT = "Professional AI dashboard animation, smooth transitions showing analytics charts growing, calendar pages flipping, booking notifications appearing, task cards moving, revenue graphs rising, modern blue theme, corporate presentation style, 4k quality, smooth motion"

print("=" * 60)
print("AgentFlow Pro - Promotional Video Generation")
print("=" * 60)
print(f"\nPrompt: {PROMPT}")
print(f"\nStarting video generation with Grok Video (5 seconds)...\n")

try:
    # Run video generation with streaming progress
    for update in client.run({
        "app": "xai/grok-imagine-video",
        "input": {
            "prompt": PROMPT,
            "duration": 5
        }
    }, stream=True):
        status = update.get('status', 'unknown')
        print(f"Status: {status}")
        
        if update.get("logs"):
            latest_log = update["logs"][-1]
            print(f"  → {latest_log}")
        
        if status == 'completed':
            print("\n✅ Video generation completed!")
            if 'output' in update:
                output = update['output']
                print(f"\n📹 Video URL: {output.get('video_url', 'N/A')}")
                print(f"📊 Task ID: {update.get('id')}")
                break
    
    print("\n" + "=" * 60)
    print("Video generation process finished")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error during video generation: {e}")
    print("\nNote: Make sure you have a valid INFERENCE_API_KEY set")
    print("Get your API key at: https://inference.sh/settings/api-keys")
