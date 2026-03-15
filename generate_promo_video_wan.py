"""
AgentFlow Pro Promotional Video Generator
Uses inference.sh Python SDK with Wan 2.5 (Image-to-Video)
Animates an existing screenshot of the AgentFlow Pro dashboard
"""

import os
from inferencesh import inference

# API key from environment
API_KEY = os.environ.get("INFERENCE_API_KEY")

if not API_KEY:
    print("❌ Error: INFERENCE_API_KEY not set")
    print("\nSet your API key:")
    print("  Windows PowerShell: $env:INFERENCE_API_KEY='inf_your_key'")
    print("\nGet your API key at: https://inference.sh/settings/api-keys")
    exit(1)

client = inference(api_key=API_KEY)

# Image-to-video prompt
PROMPT = "Smooth professional animation, dashboard elements gently moving, charts growing, subtle motion, corporate video style, high quality"

# You need to provide a screenshot of AgentFlow Pro dashboard
# Place it at: screenshots/dashboard.png
IMAGE_PATH = "screenshots/dashboard.png"

# Check if image exists
if not os.path.exists(IMAGE_PATH):
    print(f"❌ Error: Image not found at {IMAGE_PATH}")
    print("\nSteps:")
    print(f"  1. Take a screenshot of AgentFlow Pro dashboard")
    print(f"  2. Save it as: {IMAGE_PATH}")
    print(f"  3. Or use a public URL")
    print("\nAlternatively, run: npm run capture:login")
    exit(1)

print("=" * 60)
print("AgentFlow Pro - Image-to-Video Generation")
print("Model: Wan 2.5 (Image Animation)")
print("=" * 60)
print(f"\nImage: {IMAGE_PATH}")
print(f"Prompt: {PROMPT}\n")
print("Starting video generation...\n")

try:
    # For image-to-video, we need to upload the image first or use a public URL
    # This is a simplified example - in production you'd upload to a CDN
    
    # Option 1: If you have a public URL
    # image_url = "https://your-cdn.com/dashboard.png"
    
    # Option 2: Upload image (requires additional setup)
    # For now, we'll use the file path directly if supported
    
    print("Note: Wan 2.5 requires image upload or public URL")
    print("Please upload your dashboard screenshot to a CDN or use:")
    print("  infsh app run falai/wan-2-5 --input '{\"image_url\": \"https://your-image.png\"}'")
    print("\nAlternative: Use text-to-video instead:")
    print("  python generate_promo_video_veo.py")
    
except Exception as e:
    print(f"\n❌ Error during video generation: {e}")
