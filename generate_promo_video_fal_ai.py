"""
AgentFlow Pro Premium Promotional Video Generator
Uses fal.ai API with ByteDance Seedance v1.5 Pro model

Model: fal-ai/bytedance/seedance/v1.5/pro/text-to-video
Get API key at: https://fal.ai/dashboard/keys
"""

import requests
import time
import os
import json
from typing import Optional, Dict, Any

# Configuration - API Key from fal.ai
FAL_KEY = os.environ.get("FAL_KEY", "your_fal_api_key_here")

# Premium promotional video prompt based on 2025 design trends
PROMPT = """Cinematic AI dashboard animation, electric indigo and deep navy color scheme, modern bento grid layout with 4 sections showing: analytics line chart with glowing cyan points being drawn step-by-step, calendar grid with purple booking blocks appearing smoothly, task management list with high priority red indicators and progress bars filling, revenue bar chart with purple gradient bars growing upward, dark mode interface, subtle micro-interactions, glowing accents, professional SaaS demo, 4K quality, smooth 60fps motion, corporate presentation style"""


class FalAIVideoGenerator:
    """
    Premium video generator using fal.ai API with Seedance v1.5 Pro.
    """

    def __init__(self, fal_key: str = FAL_KEY):
        self.fal_key = fal_key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Key {fal_key}",
            "Content-Type": "application/json"
        })

    def generate_video(
        self,
        prompt: str = PROMPT,
        aspect_ratio: str = "16:9",
        duration: str = "5",
        model: str = "fast",
        poll_interval: int = 10,
        max_retries: int = 60
    ) -> Optional[str]:
        """
        Generate a premium promotional video using Seedance v1.5 Pro via fal.ai.

        Args:
            prompt: Video description prompt
            aspect_ratio: Output aspect ratio (default: "16:9")
            duration: Video duration in seconds (default: "5")
            model: Model speed - "fast" or "standard" (default: "fast")
            poll_interval: Seconds between status checks
            max_retries: Maximum polling attempts

        Returns:
            Video URL when complete
        """
        print("\n" + "=" * 80)
        print("  AgentFlow Pro - PREMIUM Promotional Video Generation")
        print("  Model: fal-ai/bytedance/seedance/v1.5/pro/text-to-video")
        print("  Platform: fal.ai")
        print("=" * 80)

        # Determine the model path based on speed
        if model.lower() == "fast":
            model_path = "fal-ai/bytedance/seedance/v1.5/pro/fast/text-to-video"
        else:
            model_path = "fal-ai/bytedance/seedance/v1.5/pro/text-to-video"

        # Display parameters
        print(f"\n📝 Prompt: {prompt[:150]}...")
        print(f"📐 Aspect Ratio: {aspect_ratio}")
        print(f"⏱️  Duration: {duration} seconds")
        print(f"⚡ Model: {model} ({model_path})")
        print(f"\n🎬 Starting premium video generation (this may take 2-5 minutes)...\n")

        # Submit the task
        task_id = self._submit_task(prompt, aspect_ratio, duration, model_path)
        if not task_id:
            print("\n❌ Failed to submit task")
            return None

        print(f"✅ Task submitted: {task_id}")

        # Poll for results
        print("\n⏳ Polling for results...")
        video_url = self._poll_for_results(task_id, poll_interval, max_retries)

        if video_url:
            self._print_success_message(video_url)

        return video_url

    def _submit_task(
        self,
        prompt: str,
        aspect_ratio: str,
        duration: str,
        model_path: str
    ) -> Optional[str]:
        """
        Submit a video generation task to fal.ai.

        Args:
            prompt: Video description
            aspect_ratio: Output aspect ratio
            duration: Video duration
            model_path: Full model path

        Returns:
            request_id if successful
        """
        url = f"https://fal.run/{model_path}"

        payload = {
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "duration": duration,
            "image_size": "1920x1080" if aspect_ratio == "16:9" else "1080x1920",
            "fps": 24,
            "cfg_scale": 0.5
        }

        print(f"\n📋 API Endpoint: {url}")
        print(f"📊 Resolution: 1920x1080")
        print(f"🎬 Model: {model_path}")

        try:
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()

            # fal.ai returns request_id for async or video url for sync
            request_id = data.get("request_id")
            video_url = data.get("video", {}).get("url") if "video" in data else None

            if video_url:
                print(f"✅ Instant generation successful!")
                return video_url
            elif request_id:
                print(f"✅ Task submitted successfully!")
                print(f"📋 Request ID: {request_id}")
                return request_id
            else:
                print(f"❌ No request_id or video in response: {data}")
                return None

        except requests.exceptions.RequestException as e:
            print(f"❌ API request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Response: {e.response.text}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return None

    def _poll_for_results(
        self,
        request_id: str,
        poll_interval: int,
        max_retries: int
    ) -> Optional[str]:
        """
        Poll task status until video is ready.

        Args:
            request_id: Request ID to poll
            poll_interval: Seconds between polls
            max_retries: Maximum attempts

        Returns:
            Video URL if complete
        """
        # Use fal.ai status endpoint
        status_url = f"https://fal.run/requests/{request_id}"

        print(f"\n🔗 Status URL: {status_url}")

        for attempt in range(max_retries):
            try:
                time.sleep(poll_interval)

                response = self.session.get(status_url, timeout=30)
                response.raise_for_status()
                data = response.json()

                status = data.get("status", "unknown")
                print(f"  → Status: {status} (attempt {attempt + 1}/{max_retries})")

                if status == "COMPLETED":
                    # Extract video URL from response
                    result = data.get("response", {})
                    if "video" in result and "url" in result["video"]:
                        video_url = result["video"]["url"]
                        return video_url
                    else:
                        print(f"⚠️  No video URL in result: {result}")
                        return None

                elif status == "FAILED":
                    error = data.get("error", "Unknown error")
                    print(f"❌ Task failed: {error}")
                    return None

                elif status == "IN_QUEUE":
                    position = data.get("queue_position", "unknown")
                    print(f"     Queue position: {position}")

                elif status == "IN_PROGRESS":
                    # Task is processing
                    pass

                # Still processing, continue polling

            except requests.exceptions.RequestException as e:
                print(f"  → Network error: {e}")
                continue
            except Exception as e:
                print(f"  → Error: {e}")
                continue

        print(f"\n⚠️  Video generation timed out after {max_retries * poll_interval} seconds")
        print(f"   Request ID: {request_id}")
        return None

    def _print_success_message(self, video_url: str):
        """Print success message with video URL."""
        print("\n" + "=" * 80)
        print("  ✅ PREMIUM VIDEO GENERATION COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        print(f"\n📹 Video URL: {video_url}")
        print(f"\n💡 Next Steps:")
        print(f"   1. Download the video:")
        print(f"      curl -o public/promo/agentflow-pro-promo-premium.mp4 \"{video_url}\"")
        print(f"\n   2. Add to landing page hero section")
        print(f"   3. Share on social media (LinkedIn, Twitter/X)")
        print(f"   4. Include in investor pitch deck")
        print(f"   5. Use in product demo presentations")
        print("=" * 80)


def download_video(video_url: str, output_path: str = "public/promo/agentflow-pro-promo-premium.mp4"):
    """
    Download the video to local storage.

    Args:
        video_url: URL of the video
        output_path: Local path to save the video
    """
    print(f"\n⬇️  Downloading video to: {output_path}")

    try:
        response = requests.get(video_url, stream=True)
        response.raise_for_status()

        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print(f"✅ Video downloaded successfully!")
        return output_path

    except Exception as e:
        print(f"❌ Download failed: {e}")
        return None


def main():
    """Main entry point for premium video generation."""
    print("\n" + "=" * 80)
    print("  AgentFlow Pro - Premium Promotional Video Generator")
    print("  Powered by ByteDance Seedance v1.5 Pro via fal.ai")
    print("=" * 80 + "\n")

    # Check API key
    fal_key = os.environ.get("FAL_KEY", "your_fal_api_key_here")
    if fal_key == "your_fal_api_key_here":
        print("⚠️  WARNING: FAL_KEY not set or using default placeholder")
        print("\n📋 To set your FAL_KEY:")
        print("   1. Visit: https://fal.ai/dashboard/keys")
        print("   2. Create a new API key")
        print("   3. Set environment variable:")
        print("      Windows PowerShell: $env:FAL_KEY='your_key_here'")
        print("      Windows CMD: set FAL_KEY=your_key_here")
        print("      Linux/Mac: export FAL_KEY='your_key_here'")
        print("\n  Exiting... (cannot generate video without valid API key)")
        return

    print(f"🔑 Using API Key: {fal_key[:20]}...{fal_key[-10:]}")

    # Create generator
    generator = FalAIVideoGenerator(fal_key)

    # Generate the premium promotional video with specified parameters
    video_url = generator.generate_video(
        prompt=PROMPT,
        aspect_ratio="16:9",
        duration="5",
        model="fast",  # or "standard" for higher quality
        poll_interval=10,
        max_retries=60
    )

    if video_url:
        # Save video URL to file
        with open("video_url_premium.txt", "w") as f:
            f.write(video_url)
        print("\n💾 Video URL saved to: video_url_premium.txt")

        # Auto-download
        download_video(video_url)
    else:
        print("\n" + "=" * 80)
        print("  ❌ Video generation did not complete.")
        print("  Please check your API key and try again.")
        print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
