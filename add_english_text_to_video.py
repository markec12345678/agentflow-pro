"""
AgentFlow Pro - Add English Text Overlays to Existing Video
Uses MoviePy to add English text to the existing promo video
"""

from moviepy import VideoFileClip, TextClip, CompositeVideoClip
import os

# Configuration
INPUT_VIDEO = "screenshots/agentflow-pro-promo.mp4"
OUTPUT_VIDEO = "screenshots/agentflow-pro-promo-en.mp4"

# English text overlays
TEXT_OVERLAYS = [
    {
        'text': 'Analytics Dashboard',
        'position': (100, 400),
        'fontsize': 32,
        'color': 'white',
        'start': 0.5,
        'end': 4.5,
    },
    {
        'text': 'Calendar & Booking',
        'position': (1000, 150),
        'fontsize': 32,
        'color': 'white',
        'start': 1.0,
        'end': 4.5,
    },
    {
        'text': 'Task Management',
        'position': (100, 700),
        'fontsize': 32,
        'color': 'white',
        'start': 1.5,
        'end': 4.5,
    },
    {
        'text': 'Revenue Tracking',
        'position': (1000, 700),
        'fontsize': 32,
        'color': 'white',
        'start': 2.0,
        'end': 4.5,
    },
    {
        'text': 'AgentFlow Pro',
        'position': ('center', 50),
        'fontsize': 64,
        'color': 'white',
        'font': 'Arial-Bold',
        'start': 0,
        'end': 5,
    },
    {
        'text': 'Multi-Agent AI Platform',
        'position': ('center', 120),
        'fontsize': 28,
        'color': '#94A3B8',
        'start': 0,
        'end': 5,
    },
]

def add_text_overlays():
    """Add English text overlays to video"""
    
    print("=" * 70)
    print("  AgentFlow Pro - Adding English Text Overlays")
    print("=" * 70)
    print()
    
    # Check if input video exists
    if not os.path.exists(INPUT_VIDEO):
        print(f"❌ Input video not found: {INPUT_VIDEO}")
        print("   Using existing video instead...")
        return
    
    print(f"📹 Loading video: {INPUT_VIDEO}")
    video = VideoFileClip(INPUT_VIDEO)
    print(f"✅ Video loaded: {video.duration}s, {video.w}x{video.h}")
    print()
    
    # Create text clips
    print("🔤 Adding English text overlays...")
    text_clips = []
    
    for overlay in TEXT_OVERLAYS:
        try:
            txt_clip = TextClip(
                overlay['text'],
                fontsize=overlay['fontsize'],
                color=overlay['color'],
                font=overlay.get('font', 'Arial'),
            )
            
            txt_clip = txt_clip.set_position(overlay['position'])
            txt_clip = txt_clip.set_start(overlay['start'])
            txt_clip = txt_clip.set_end(overlay['end'])
            
            text_clips.append(txt_clip)
            print(f"   ✅ Added: '{overlay['text']}'")
        except Exception as e:
            print(f"   ⚠️  Skipped '{overlay['text']}': {e}")
    
    print()
    print("🎬 Compositing video with text...")
    
    # Composite video with text
    final_video = CompositeVideoClip([video] + text_clips)
    
    print("💾 Writing output video...")
    final_video.write_videofile(
        OUTPUT_VIDEO,
        codec='libx264',
        audio_codec='aac',
        fps=video.fps,
        preset='medium',
    )
    
    print()
    print("=" * 70)
    print("✅ English video created successfully!")
    print("=" * 70)
    print(f"\n📹 Output: {OUTPUT_VIDEO}")
    print(f"⏱️  Duration: {final_video.duration}s")
    print(f"📐 Resolution: {final_video.w}x{final_video.h}")
    print()
    
    # Cleanup
    video.close()
    final_video.close()


def copy_to_promo_folder():
    """Copy English video to public/promo folder"""
    
    import shutil
    
    promo_path = "public/promo/agentflow-pro-promo-en.mp4"
    
    if os.path.exists(OUTPUT_VIDEO):
        os.makedirs("public/promo", exist_ok=True)
        shutil.copy2(OUTPUT_VIDEO, promo_path)
        print(f"✅ Video copied to: {promo_path}")


if __name__ == "__main__":
    add_text_overlays()
    copy_to_promo_folder()
