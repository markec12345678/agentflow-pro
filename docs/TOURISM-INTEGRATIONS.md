# Tourism Integrations – Produkcijska Dokumentacija

## 1. Google Search Console API

**Namen:** Avtomatsko sledenje rankinga ključnih besed v Google iskanju.

### Nastavitev

1. V `.env` dodaj `GOOGLE_CLIENT_ID` in `GOOGLE_CLIENT_SECRET` (ista vrednost kot za Google Sign-In).
2. V [Google Cloud Console](https://console.cloud.google.com/) v OAuth consent screen vključi scope: `https://www.googleapis.com/auth/webmasters.readonly`.
3. V OAuth client dodaj redirect URI: `https://tvoj-domain.com/api/auth/google-sc/callback`.

### Uporaba

- **Povezava:** Klik na „Poveži Google Search Console“ v SEO Dashboard (`/dashboard/tourism/seo`).
- **API:**
  - `GET /api/search-console/sites` – seznam spletnih mest iz GSC
  - `GET /api/search-console/analytics?siteUrl=https://example.com/` – podatki o rankingu (zadnjih 28 dni)

---

## 2. Meta Graph API (Instagram / Facebook)

**Namen:** Objava vsebine direktno na Instagram ali Facebook.

### Nastavitev

1. Ustvari aplikacijo na [developers.facebook.com](https://developers.facebook.com).
2. V `.env` dodaj `META_APP_ID` in `META_APP_SECRET`.
3. Nastavi redirect URI: `https://tvoj-domain.com/api/auth/meta/callback`.
4. Za Instagram vključi scopes: `instagram_basic`, `instagram_content_publish` in ustrezne page scopes.

### Uporaba

- **Povezava:** V Settings poveži Meta račun (`/api/auth/meta/connect`).
- **Objava API:** `POST /api/meta/publish` – body:
  - `caption` (obvezno)
  - `imageUrl` (obvezno za Instagram, slika mora biti javno dostopna)
  - `platform`: `"instagram"` | `"facebook"`
  - Za Instagram: `instagramAccountId` (ID Instagram Business računa)
  - Za Facebook: `pageId` (ID Facebook strani)

---

## 3. Booking.com Affiliate

**Namen:** Generiranje affiliate linkov z uporabnikovim ID.

### Nastavitev

- **Globalno (opcijsko):** `BOOKING_AFFILIATE_ID` v `.env` – privzet aid.
- **Po uporabniku:** v Settings shrani v `UserApiKey` provider `booking_affiliate`.

### Uporaba

- **Shranjevanje aid:** `POST /api/tourism/booking-link` – body: `{ "aid": "123456" }`.
- **Generiranje linka:** `GET /api/tourism/booking-link?destId=-12345&destType=city&checkin=2025-03-01&checkout=2025-03-05`
- Query parametri: `destId`, `destType`, `checkin`, `checkout`, `adults`, `children`, `rooms`.

---

## 4. AI Image Generation (Landing Page)

**Namen:** Generiranje predlogov fotografij za landing page z DALL-E 3.

### Uporaba

- V Landing Page Generator (`/dashboard/tourism/landing`) v koraku Preview so predlogi za hero, galerijo in „O nas“.
- Za vsak predlog lahko klikneš „Generiraj sliko“ – uporabi `/api/generate-image`.
- Zahteva OpenAI API ključ (globalni ali uporabnikov v Settings).
