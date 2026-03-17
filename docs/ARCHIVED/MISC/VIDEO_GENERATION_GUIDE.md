# AgentFlow Pro Promotional Video Generation Guide

## Overview
This guide explains how to generate a promotional video for AgentFlow Pro using the inference.sh platform with AI video generation models.

## Prerequisites

### 1. Get Your API Key
1. Visit: https://inference.sh/settings/api-keys
2. Click "Create API Key"
3. Copy your API key (starts with `inf_`)

### 2. Set Environment Variable

**Windows PowerShell:**
```powershell
$env:INFERENCE_API_KEY="inf_your_api_key_here"
```

**Windows Command Prompt:**
```cmd
set INFERENCE_API_KEY=inf_your_api_key_here
```

**Linux/Mac:**
```bash
export INFERENCE_API_KEY="inf_your_api_key_here"
```

**Permanent (Windows):**
Add to `.env.local`:
```
INFERENCE_API_KEY="inf_your_api_key_here"
```

## Installation

The Python SDK is already installed. If not:
```bash
pip install inferencesh
```

## Video Generation Options

### Option 1: Grok Video (Recommended for Promotional Content)

**Model:** `xai/grok-imagine-video`
- Duration: Up to 10 seconds
- Quality: High
- Best for: Corporate presentations, marketing videos

```bash
python generate_promo_video.py
```

### Option 2: Google Veo 3.1 (Highest Quality)

**Model:** `google/veo-3-1`
- Duration: 5-10 seconds
- Quality: Best available with frame interpolation
- Best for: Premium promotional content

```bash
python generate_promo_video_veo.py
```

### Option 3: Wan 2.5 (Image-to-Video)

If you have a screenshot of AgentFlow Pro dashboard:

**Model:** `falai/wan-2-5`
- Takes an image and animates it
- Duration: 5 seconds
- Best for: Bringing static screenshots to life

```bash
python generate_promo_video_wan.py
```

## The Promotional Video Prompt

The prompt used for AgentFlow Pro:

```
"Professional AI dashboard animation, smooth transitions showing analytics charts 
growing, calendar pages flipping, booking notifications appearing, task cards moving, 
revenue graphs rising, modern blue theme, corporate presentation style, 4k quality, 
smooth motion"
```

### Prompt Breakdown:
- **Subject**: AI dashboard animation
- **Elements**: Analytics charts, calendar, notifications, task cards, revenue graphs
- **Style**: Modern blue theme, corporate presentation
- **Quality**: 4K, smooth motion
- **Duration**: 5 seconds

## Expected Output

Upon successful generation, you'll receive:
- **Video URL**: Direct link to MP4 file
- **Task ID**: For tracking/retrieval
- **Status**: Completed

Example output:
```
✅ Video generation completed!

📹 Video URL: https://cdn.inference.sh/video/xxxxx.mp4
📊 Task ID: task_xxxxx
```

## Troubleshooting

### Error 401: Invalid Credentials
```
❌ Error during video generation: HTTP 401: invalid credentials
```
**Solution:** Set a valid `INFERENCE_API_KEY` environment variable

### Error: Model Not Found
**Solution:** Check model ID spelling, verify model is available in your region

### Error: Timeout
**Solution:** Video generation can take 2-5 minutes. Increase timeout or use async mode

## Alternative: Web Interface

If you prefer not to use the CLI/SDK:
1. Visit: https://inference.sh
2. Navigate to Apps → Video
3. Select your model (Grok, Veo, Wan)
4. Enter the prompt
5. Click "Run"

## Video Usage

Once generated, you can:
- Download the MP4 file
- Embed on your website
- Use in social media posts
- Include in presentations
- Share on YouTube/Vimeo

## Next Steps

After generating the video:
1. Download and save to `agentflow-pro/public/promo/`
2. Add to landing page
3. Share on social media
4. Include in investor deck

---

**Generated:** 2026-03-15
**Platform:** inference.sh
**Models:** Grok Video, Veo 3.1, Wan 2.5
