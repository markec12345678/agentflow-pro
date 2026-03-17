# 🎬 AgentFlow Pro - Promotional Video Generation

This directory contains tools and scripts for generating promotional videos for AgentFlow Pro using AI video generation platforms.

---

## 📋 Overview

Three video generation options are available:

| Method | Model | Quality | Duration | Best For |
|--------|-------|---------|----------|----------|
| **Seedance 2.0** | ByteDance | Cinema 2K | 5-10s | ⭐ **Recommended** - Professional promos |
| **Grok Video** | xAI | High | 5-10s | Corporate presentations |
| **Veo 3.1** | Google | Highest | 5-10s | Premium quality content |

---

## 🚀 Quick Start

### Option 1: Seedance 2.0 (Recommended)

**Best for:** Professional promotional videos with cinema-quality output

```bash
# Set API key
$env:MODELSLAB_API_KEY="your_modelslab_api_key"  # PowerShell
# or
set MODELSLAB_API_KEY=your_modelslab_api_key  # CMD

# Generate video
python generate_promo_video_seedance.py
```

**Get API Key:** https://modelslab.com or https://www.xskill.ai

**Features:**
- ✅ Cinema-quality 2K resolution
- ✅ Native lip-sync support
- ✅ Multi-shot narrative
- ✅ Physics-based motion
- 💰 Free tier: 100 credits on signup
- 💰 Cost: $0.05-0.15 per video

---

### Option 2: Grok Video (xAI)

**Best for:** Corporate presentations and marketing videos

```bash
# Set API key
$env:INFERENCE_API_KEY="inf_your_inference_key"  # PowerShell

# Generate video
python generate_promo_video.py
```

**Get API Key:** https://inference.sh/settings/api-keys

**Features:**
- Configurable duration (up to 10s)
- High quality output
- Fast generation
- Corporate style

---

### Option 3: Google Veo 3.1

**Best for:** Highest quality promotional content

```bash
# Set API key
$env:INFERENCE_API_KEY="inf_your_inference_key"  # PowerShell

# Generate video
python generate_promo_video_veo.py
```

**Get API Key:** https://inference.sh/settings/api-keys

**Features:**
- 🏆 Best available quality
- Frame interpolation
- Audio support (optional)
- 4K output capability

---

## 📝 Promotional Video Prompt

The default prompt used for AgentFlow Pro:

```
Professional AI dashboard animation, smooth transitions showing analytics charts growing, 
calendar pages flipping, booking notifications appearing, task cards moving, revenue graphs rising, 
modern blue theme, corporate presentation style, 4k quality, smooth motion, cinematic lighting, 
clean UI/UX, SaaS platform demo
```

### Prompt Engineering Tips

**Effective patterns:**
- **Camera movement:** "slow pan left", "tracking shot", "aerial drone view"
- **Physics specifics:** "water splashing", "leaves falling", "fabric rippling"
- **Lighting cues:** "golden hour light", "neon reflections", "volumetric fog"
- **Style qualifiers:** "cinematic", "8K", "film grain", "studio lighting"

**Template:**
```
[scene], [time of day], [weather], [camera movement], cinematic, 4K, film grain
```

---

## 📁 Generated Files

| File | Description |
|------|-------------|
| `generate_promo_video_seedance.py` | Seedance 2.0 generator (recommended) |
| `generate_promo_video.py` | Grok Video generator |
| `generate_promo_video_veo.py` | Google Veo 3.1 generator |
| `generate_promo_video_wan.py` | Wan 2.5 image-to-video (requires screenshot) |
| `VIDEO_GENERATION_GUIDE.md` | Detailed setup guide |

---

## 🔧 Setup Instructions

### Step 1: Choose Your Platform

**Seedance 2.0 (Recommended):**
1. Visit: https://modelslab.com
2. Sign up for free account
3. Get API key from dashboard
4. 100 free credits on signup

**inference.sh (Grok/Veo):**
1. Visit: https://inference.sh
2. Create account
3. Go to Settings → API Keys
4. Create new API key

### Step 2: Set Environment Variable

**Windows PowerShell:**
```powershell
$env:MODELSLAB_API_KEY="your_api_key_here"
```

**Windows Command Prompt:**
```cmd
set MODELSLAB_API_KEY=your_api_key_here
```

**Linux/Mac:**
```bash
export MODELSLAB_API_KEY="your_api_key_here"
```

**Permanent (add to .env.local):**
```
MODELSLAB_API_KEY="your_api_key_here"
```

### Step 3: Install Dependencies

Python SDK is already installed. If not:

```bash
pip install inferencesh requests
```

### Step 4: Run Generator

```bash
python generate_promo_video_seedance.py
```

---

## ⏱️ Expected Timeline

| Phase | Duration |
|-------|----------|
| API Setup | 2-5 minutes |
| Video Generation | 2-3 minutes |
| Download & Save | 1 minute |
| **Total** | **~5-10 minutes** |

---

## 📹 Video Usage

Once generated, you can:

1. **Download the MP4 file**
   ```bash
   curl -o public/promo/agentflow-pro-promo.mp4 "VIDEO_URL"
   ```

2. **Add to landing page**
   ```html
   <video autoplay loop muted playsinline class="w-full">
     <source src="/promo/agentflow-pro-promo.mp4" type="video/mp4">
   </video>
   ```

3. **Share on social media**
   - LinkedIn: Upload directly
   - Twitter/X: Attach video file
   - YouTube: Upload as short or regular video
   - Instagram: Use for Reels

4. **Include in presentations**
   - Investor pitch deck
   - Product demos
   - Trade show displays

---

## 🐛 Troubleshooting

### Error 401: Invalid Credentials
```
❌ Error: HTTP 401: invalid credentials
```
**Solution:** Verify your API key is correct and active

### Error: Insufficient Credits
```
❌ Error: Insufficient credits
```
**Solution:** Top up your account balance

### Error: Content Policy Violation
```
❌ Error: Content policy violation
```
**Solution:** Adjust prompt to remove potentially problematic terms

### Error: Timeout
```
⚠️ Video generation timed out
```
**Solution:** Wait a few minutes and try again, or check using task ID

---

## 💰 Pricing Comparison

| Platform | Free Tier | Per Video | Best Value |
|----------|-----------|-----------|------------|
| **ModelsLab (Seedance)** | 100 credits | ~$0.10 | ⭐⭐⭐⭐⭐ |
| **inference.sh (Grok)** | Trial | ~$0.15 | ⭐⭐⭐⭐ |
| **inference.sh (Veo)** | Trial | ~$0.20 | ⭐⭐⭐⭐ |

---

## 📊 Video Specifications

| Parameter | Value |
|-----------|-------|
| **Resolution** | 1920x1080 (Full HD) |
| **Aspect Ratio** | 16:9 |
| **Frame Rate** | 24 fps |
| **Duration** | 5 seconds (default) |
| **Format** | MP4 (H.264) |
| **File Size** | ~5-15 MB |

---

## 🎯 Next Steps

After generating your video:

1. ✅ **Download and save** to `public/promo/`
2. ✅ **Test on landing page** - add to hero section
3. ✅ **Optimize file size** - compress if needed
4. ✅ **Add captions** - for accessibility
5. ✅ **Create variations** - different lengths/styles
6. ✅ **Share widely** - social media, email, presentations

---

## 📞 Support

- **Seedance 2.0:** https://modelslab.com/support
- **inference.sh:** https://inference.sh/docs
- **XSkill AI:** https://www.xskill.ai/contact

---

**Generated:** 2026-03-15  
**Platform:** AgentFlow Pro  
**Video Models:** Seedance 2.0, Grok Video, Veo 3.1
