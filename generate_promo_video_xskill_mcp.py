"""
AgentFlow Pro Premium Promotional Video Generator
Uses XSkill AI MCP with ByteDance Seedance v1.5 Pro model

Model: fal-ai/bytedance/seedance/v1.5/pro/text-to-video
Get API key at: https://www.xskill.ai
"""

import requests
import time
import os
import json
from typing import Optional, Dict, Any

# Configuration - API Key from XSkill AI (ModelsLab)
API_KEY = os.environ.get("MODELSLAB_API_KEY", "sk-13e8999a5be6c5427603c6b514b469873fc0d643e8755b32")
BASE_URL = "https://modelslab.com/api/v7"

# Premium promotional video prompt based on 2025 design trends
PROMPT = """Cinematic AI dashboard animation, electric indigo and deep navy color scheme, modern bento grid layout with 4 sections showing: analytics line chart with glowing cyan points being drawn step-by-step, calendar grid with purple booking blocks appearing smoothly, task management list with high priority red indicators and progress bars filling, revenue bar chart with purple gradient bars growing upward, dark mode interface, subtle micro-interactions, glowing accents, professional SaaS demo, 4K quality, smooth 60fps motion, corporate presentation style"""


class XSkillMCPVideoGenerator:
    """
    Premium video generator using XSkill AI MCP with Seedance v1.5 Pro.
    """

    def __init__(self, api_key: str = API_KEY):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })

    def generate_video(
        self,
        prompt: str = PROMPT,
        aspect_ratio: str = "16:9",
        duration: str = "5",
        model: str = "Fast",
        poll_interval: int = 10,
        max_retries: int = 30
    ) -> Optional[str]:
        """
        Generate a premium promotional video using Seedance v1.5 Pro.

        Args:
            prompt: Video description prompt
            aspect_ratio: Output aspect ratio (default: "16:9")
            duration: Video duration in seconds (default: "5")
            model: Model speed - "Fast" or "Standard" (default: "Fast")
            poll_interval: Seconds between status checks
            max_retries: Maximum polling attempts

        Returns:
            Video URL when complete
        """
        print("\n" + "=" * 80)
        print("  AgentFlow Pro - PREMIUM Promotional Video Generation")
        print("  Model: fal-ai/bytedance/seedance/v1.5/pro/text-to-video")
        print("  Platform: XSkill AI MCP")
        print("=" * 80)

        # Display parameters
        print(f"\n📝 Prompt: {prompt[:150]}...")
        print(f"📐 Aspect Ratio: {aspect_ratio}")
        print(f"⏱️  Duration: {duration} seconds")
        print(f"⚡ Model: {model}")
        print(f"\n🎬 Starting premium video generation (this may take 2-3 minutes)...\n")

        # Create the task
        task_id = self._create_task(prompt, aspect_ratio, duration, model)
        if not task_id:
            print("\n❌ Failed to create task")
            return None

        print(f"✅ Task created: {task_id}")

        # Poll for results
        print("\n⏳ Polling for results...")
        video_url = self._poll_for_results(task_id, poll_interval, max_retries)

        if video_url:
            self._print_success_message(video_url)

        return video_url

    def _create_task(
        self,
        prompt: str,
        aspect_ratio: str,
        duration: str,
        model: str
    ) -> Optional[str]:
        """
        Create a video generation task using ModelsLab v7 API.

        Args:
            prompt: Video description
            aspect_ratio: Output aspect ratio
            duration: Video duration
            model: Model speed

        Returns:
            Video URL if successful (can be instant or needs polling)
        """
        url = f"{BASE_URL}/text-to-video"

        # Parse aspect ratio to get resolution
        resolution = "1080p"  # Default for 16:9
        if aspect_ratio == "16:9":
            resolution = "1080p"
        elif aspect_ratio == "9:16":
            resolution = "1080p"  # Vertical
        elif aspect_ratio == "1:1":
            resolution = "720p"  # Square

        payload = {
            "prompt": prompt,
            "model": "seedance-t2v",
            "negative_prompt": "low quality, blurry, distorted, artifacts, watermark, text overlay, ugly, deformed",
            "duration": int(duration),
            "resolution": resolution,
            "fps": 24
        }

        print(f"\n📋 API Endpoint: {url}")
        print(f"📊 Resolution: {resolution}")
        print(f"🎬 Model: seedance-t2v")

        try:
            # API v7 uses GET request with Bearer token auth
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            response = requests.get(f"{url}", params=payload, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()

            print(f"\n📡 Response Status Code: {response.status_code}")
            print(f"📄 Full Response: {data}")

            if data.get("status") == "success":
                # Video generated instantly
                video_url = data.get("video_url")
                if video_url:
                    print(f"✅ Instant generation successful!")
                    return video_url
                else:
                    print(f"⚠️  No video_url in response: {data}")
                    return None

            elif data.get("status") == "processing":
                # Need to poll for results using generation_id
                generation_id = data.get("generation_id")
                print(f"⏳ Processing... Generation ID: {generation_id}")
                # Store for polling
                self.generation_id = generation_id
                return generation_id

            else:
                print(f"❌ Task creation failed: {data}")
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
        task_id: str,
        poll_interval: int,
        max_retries: int
    ) -> Optional[str]:
        """
        Poll task status until video is ready using v7 API.

        Args:
            task_id: Generation ID to poll
            poll_interval: Seconds between polls
            max_retries: Maximum attempts

        Returns:
            Video URL if complete
        """
        # Use generation_id for polling
        generation_id = getattr(self, 'generation_id', task_id)

        url = f"{BASE_URL}/status"

        print(f"\n🔗 Polling Generation ID: {generation_id}")

        for attempt in range(max_retries):
            try:
                time.sleep(poll_interval)

                payload = {"generation_id": generation_id}
                headers = {
                    "Authorization": f"Bearer {self.api_key}"
                }
                response = requests.get(f"{url}", params=payload, headers=headers, timeout=30)
                response.raise_for_status()
                data = response.json()

                status = data.get("status", "unknown")
                progress = data.get("progress", "unknown")

                print(f"  → Status: {status} (attempt {attempt + 1}/{max_retries})")
                if progress != "unknown":
                    print(f"     Progress: {progress}%")

                if status == "success":
                    # Extract video URL
                    video_url = data.get("video_url")
                    if video_url:
                        return video_url
                    else:
                        print(f"⚠️  No video_url in result: {data}")
                        return None

                elif status == "failed":
                    print(f"❌ Error: {data.get('message', 'Unknown error')}")
                    return None

                # Still processing, continue polling

            except requests.exceptions.RequestException as e:
                print(f"  → Network error: {e}")
                continue
            except Exception as e:
                print(f"  → Error: {e}")
                continue

        print(f"\n⚠️  Video generation timed out after {max_retries * poll_interval} seconds")
        return None

    def _extract_video_url(self, result: Dict[str, Any]) -> Optional[str]:
        """
        Extract video URL from result dictionary.

        Args:
            result: Result dictionary from API

        Returns:
            Video URL if found
        """
        # Try different possible locations for video URL
        if "output" in result:
            output = result["output"]

            # Check for 'video' key
            if "video" in output:
                return output["video"]

            # Check for 'images' array
            if "images" in output and isinstance(output["images"], list):
                return output["images"][0]

            # Check for 'url' key
            if "url" in output:
                return output["url"]

        # Check for 'video_url' at top level
        if "video_url" in result:
            return result["video_url"]

        # Check for 'url' at top level
        if "url" in result:
            return result["url"]

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
    print("  Powered by ByteDance Seedance v1.5 Pro via XSkill AI MCP")
    print("=" * 80 + "\n")

    # Check API key
    api_key = os.environ.get("XSKILL_API_KEY", "sk-13e8999a5be6c5427603c6b514b469873fc0d643e8755b32")
    print(f"🔑 Using API Key: {api_key[:20]}...{api_key[-10:]}")

    # Create generator
    generator = XSkillMCPVideoGenerator(api_key)

    # Generate the premium promotional video with specified parameters
    video_url = generator.generate_video(
        prompt=PROMPT,
        aspect_ratio="16:9",
        duration="5",
        model="Fast",  # or "Standard" for higher quality
        poll_interval=10,
        max_retries=30
    )

    if video_url:
        # Save video URL to file
        with open("video_url_premium.txt", "w") as f:
            f.write(video_url)
        print("\n💾 Video URL saved to: video_url_premium.txt")

        # Ask if user wants to download
        print("\n🤔 Would you like to download the video now? (y/n)")
        # Auto-download for automation
        download_video(video_url)
    else:
        print("\n" + "=" * 80)
        print("  ❌ Video generation did not complete.")
        print("  Please check your API key and try again.")
        print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
