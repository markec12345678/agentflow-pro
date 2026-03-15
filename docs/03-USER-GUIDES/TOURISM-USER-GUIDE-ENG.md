# Tourism Hub – User Guide

Guide for hoteliers, DMOs, and tourism operators. How to use AgentFlow Pro Tourism Hub for content generation, emails, landing pages, and multi-language translations.

---

## Getting Started

1. **Login** – Create an account or log in to AgentFlow Pro.
2. **Onboarding** – Select industry **Tourism** or **Travel Agency** to see **Tourism Hub** in the sidebar.
3. **Tourism Hub** – Open the dropdown in the sidebar. You'll see: Overview, Generate, Templates, Accommodations, Landing Page, Email, SEO, Multi-Language.

---

## Content Generator

One generator with platform-specific prompts (Booking.com, Airbnb, landing, SEO) – not separate agents. Generate accommodation descriptions, destination guides, or social media content.

1. Go to **Generate** (or Overview → Quick Start).
2. Select prompt:
   - **Booking.com Accommodation Description** – sales description for Booking.com
   - **Airbnb Storytelling Description** – warm, personal description for Airbnb
   - **Destination Guide** – SEO guide for blog
   - **Seasonal Campaign** – email + social post
   - **Instagram Travel Caption** – caption for travel photo
3. Fill variables (Location, Type, Language, Tone, etc.). Tone (professional, friendly, luxurious, family) is available for all prompts.
4. Click **Generate**.
5. After generation:
   - **Copy for Booking.com** – format without HTML/markdown (limit ~4900 characters)
   - **Copy for Airbnb** – limit of 2 consecutive line breaks
   - **Copy hashtags** – generates hashtags from location and type (e.g., #BelaKrajina, #apartma, #Slovenia)
6. Optionally: **Save as Template** – enter name and use later with pre-filled values.

---

## Landing Page Generator

Create accommodation landing pages in multiple languages.

1. Go to **Landing Page**.
2. **Step 1:** Select template (Standard, Luxury, Family).
3. **Step 2:** Enter Property Name, Location, Type, Capacity, Amenities, Price from, etc. Select languages (SL, EN, DE, IT, HR).
4. Click **Generate Now**.
5. **Step 3:** Review content. Use:
   - **Export JSON** – downloads content in JSON format
   - **Export Markdown** – downloads in MD format
   - **Export HTML** – downloads HTML template
   - **Save** – saves to database for later loading
6. **Load saved** – click to display list of saved pages and select for loading.

---

## Email Workflow

Create professional emails for guests (Welcome, Follow-up, Seasonal).

1. Go to **Email**.
2. Select type:
   - **Welcome Email** – before guest arrival, check-in instructions, recommendations
   - **Follow-up Email** – after departure, thank you, review request, discount for next stay
   - **Seasonal Offer** – for past guests, news, special offer
3. Fill data: Property Name, Location, Language, Check-in/out. For Seasonal, add Season/Event and Special Offer.
4. Click **Generate Email**.
5. **Copy** – copy content to clipboard.
6. **Send via Gmail** – opens mailto: with pre-filled body.

---

## Accommodations (Properties)

Manage accommodations for filtering templates and landing pages.

1. Go to **Accommodations** (Tourism Hub → Accommodations).
2. **Add** – enter Name, Location, Type (apartment, house, hotel...), Capacity. Click Add.
3. **Edit** – click Edit on accommodation, modify data, click Save.
4. **Delete** – click Delete and confirm.
5. Selected active accommodation (PropertySelector in header) filters templates and landing pages by accommodation.

---

## Multi-Language Translator

Translate content into multiple languages simultaneously.

1. Go to **Multi-Language**.
2. Paste text (e.g., apartment description in Slovenian).
3. Select source language (sl) and target languages (EN, DE, IT, HR).
4. Click **Translate to selected languages**.
5. Content is translated – click **Copy** for each language.

**Note:** Requires OPENAI_API_KEY in Settings. Without key: mock translations for testing.

---

## SEO Dashboard

Monitor keywords and optimize with AI.

1. Go to **SEO**.
2. Table shows keywords with: Position, Volume, Difficulty.
3. **Priority** – High (1–10), Medium (11–20), Low (21+).
4. Filter/Sort – by priority, position, volume, difficulty.
5. Graph – Volume by Keyword (Recharts).
6. **Optimize** – click on keyword for suggestions on meta title, description, headings, GEO/AEO. **Copy Meta** copies to clipboard.

---

## Publish Helpers – When to Use

| Button | When to Use |
|------|----------------|
| Copy for Booking.com | When publishing on Booking.com – no HTML, no markdown, limit ~4900 characters |
| Copy for Airbnb | When publishing on Airbnb – up to 2 consecutive line breaks |
| Copy hashtags | For Instagram – hashtags from location + type (e.g., #BelaKrajina #apartma #Slovenia) |

---

## Documentation

- [TOURISM-API](TOURISM-API.md) – API documentation for developers
- [TOURISM-LOCAL-TESTING](TOURISM-LOCAL-TESTING.md) – local testing
