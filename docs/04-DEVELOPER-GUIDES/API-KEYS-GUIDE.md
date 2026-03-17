# 🔑 API Keys Guide: Booking.com & Airbnb

## 📋 Pregled Potrebnih API Ključev

### 1. **Booking.com Connectivity API**

#### Kaj Potrebuješ:
- ✅ **Booking.com Partner Account**
- ✅ **Connectivity API Credentials**
- ✅ **Test Environment Access**
- ✅ **Production Approval**

#### Kako Dobiti:

**Korak 1: Registracija**
```
1. Odpri: https://partner.booking.com/
2. Klikni: "Become a Partner"
3. Izpolni podatke o property-ju
4. Počakaj na approval (1-3 dni)
```

**Korak 2: API Access**
```
1. Login v Booking.com Partner Hub
2. Settings → Integrations → API
3. Request API Access
4. Izberi: "Connectivity API"
5. Opis uporabe: "Channel manager for property management"
```

**Korak 3: Test Environment**
```
1. Po approval-u dobiš test credentials
2. Base URL: https://test-rates.booking.com/
3. API Key: xxxxxx-xxxx-xxxx-xxxx-xxxxxx
4. Secret: xxxxxxxxxxxxxxxxxxxxxxxx
```

**Korak 4: Production**
```
1. Testiraj v sandbox-u
2. Submit for production review
3. Booking.com team pregleda (3-5 dni)
4. Dobiš production credentials
```

#### Environment Variables:
```env
# Booking.com API
BOOKING_COM_API_KEY=xxxxxx-xxxx-xxxx-xxxx-xxxxxx
BOOKING_COM_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
BOOKING_COM_PROPERTY_ID=12345
BOOKING_COM_ENV=test  # ali production
```

---

### 2. **Airbnb API**

#### Kaj Potrebuješ:
- ✅ **Airbnb Partner Account**
- ✅ **API Credentials**
- ✅ **OAuth2 Setup**

#### Kako Dobiti:

**Korak 1: Registracija**
```
1. Odpri: https://www.airbnb.com/host
2. Klikni: "List your property"
3. Ustvari host account
4. Dodaj property
```

**Korak 2: API Access**
```
1. Odpri: https://dev.airbnb.com/
2. Klikni: "Apply for API Access"
3. Izpolni aplikacijo:
   - App Name: "AgentFlow Pro Channel Manager"
   - Description: "Property management and channel integration"
   - Website: https://yourdomain.com
   - Redirect URI: https://yourdomain.com/api/tourism/airbnb/oauth/callback
```

**Korak 3: OAuth2 Setup**
```
1. V Airbnb Developer Dashboard
2. Create New App
3. Client ID: xxxxxxxxxxxxxxxx
4. Client Secret: xxxxxxxxxxxxxxxxxxxxxxxx
5. Redirect URI: http://localhost:3002/api/tourism/airbnb/oauth/callback (test)
```

**Korak 4: iCal Integration** (Alternative)
```
Če ne dobiš API access-a:
1. Airbnb → Hosting → Calendar
2. Export Calendar: iCal URL
3. Import Calendar: iCal URL
4. Two-way sync
```

#### Environment Variables:
```env
# Airbnb API
AIRBNB_CLIENT_ID=xxxxxxxxxxxxxxxx
AIRBNB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
AIRBNB_REDIRECT_URI=http://localhost:3002/api/tourism/airbnb/oauth/callback
AIRBNB_ENV=test  # ali production
```

---

## 🔐 Varnostno Shranjevanje

### 1. **Lokalno (.env.local)**

```env
# Nikoli ne commitaj .env.local v Git!

# Booking.com
BOOKING_COM_API_KEY=test_key_xxxxx
BOOKING_COM_SECRET=test_secret_xxxxx
BOOKING_COM_PROPERTY_ID=12345
BOOKING_COM_ENV=test

# Airbnb
AIRBNB_CLIENT_ID=test_client_xxxxx
AIRBNB_CLIENT_SECRET=test_secret_xxxxx
AIRBNB_REDIRECT_URI=http://localhost:3002/api/tourism/airbnb/oauth/callback
AIRBNB_ENV=test
```

### 2. **Production (Vercel/Cloud)**

**Vercel:**
```
1. Project → Settings → Environment Variables
2. Add Variable: BOOKING_COM_API_KEY
3. Value: xxxxxx-xxxx-xxxx-xxxx-xxxxxx
4. Environment: Production
5. Repeat za vse spremenljivke
```

**Docker/Cloud:**
```bash
# .env.production (dodaj v .gitignore!)
BOOKING_COM_API_KEY=production_key_xxxxx
BOOKING_COM_SECRET=production_secret_xxxxx
AIRBNB_CLIENT_ID=production_client_xxxxx
AIRBNB_CLIENT_SECRET=production_secret_xxxxx
```

---

## 🧪 Testing

### 1. **Testiranje Booking.com**

```bash
# Test API call
curl -X GET "https://test-rates.booking.com/connectivity/v1/properties/12345" \
  -H "Authorization: Bearer $BOOKING_COM_API_KEY" \
  -H "X-Secret: $BOOKING_COM_SECRET"
```

**Pričakovan Response:**
```json
{
  "propertyId": "12345",
  "name": "Test Property",
  "status": "active"
}
```

### 2. **Testiranje Airbnb**

```bash
# Test OAuth Flow
1. Odpri: http://localhost:3002/api/tourism/airbnb/oauth
2. Preusmeri na Airbnb login
3. Authoriziraj app
4. Redirect back z code
5. Exchange code for token
```

**Pričakovan Response:**
```json
{
  "access_token": "xxxxxxxxxxxxx",
  "refresh_token": "xxxxxxxxxxxxx",
  "expires_in": 3600
}
```

---

## ⚠️ Pogoste Težave

### 1. **Booking.com API Approval**

**Problem:** "Application rejected"
**Rešitev:**
- Podrobneje opiši use case
- Dodaj screenshot-e UI-ja
- Pojasni kako boš uporabljal API
- Kontaktiraj Booking.com partner support

### 2. **Airbnb API Access**

**Problem:** "API access not granted"
**Rešitev:**
- Uporabi iCal sync kot alternative
- Airbnb ima zaprt API za nove apps
- iCal deluje za 90% use case-ov
- Za advanced features potrebuješ partner status

### 3. **OAuth Redirect Mismatch**

**Problem:** "Redirect URI mismatch"
**Rešitev:**
- Preveri da je redirect URI enak v:
  - .env.local (AIRBNB_REDIRECT_URI)
  - Airbnb Developer Dashboard
  - Koda (route.ts)
- Za localhost: `http://localhost:3002/api/tourism/airbnb/oauth/callback`
- Za production: `https://yourdomain.com/api/tourism/airbnb/oauth/callback`

---

## 📞 Kontakti

### Booking.com Partner Support:
- Email: connectivity@booking.com
- Phone: +31 20 702 6000
- Portal: https://partner.booking.com/support

### Airbnb Developer Support:
- Email: api@airbnb.com
- Portal: https://dev.airbnb.com/support
- Documentation: https://dev.airbnb.com/docs

---

## ✅ Checklist Pred Launch-em

- [ ] Booking.com test credentials pridobljeni
- [ ] Airbnb OAuth credentials pridobljeni
- [ ] .env.local nastavljen z test credentials
- [ ] API calls delujejo v test environment
- [ ] Webhook endpointi testirani
- [ ] Error handling implementiran
- [ ] Rate limiting implementiran
- [ ] Logging nastavljen
- [ ] Production credentials zahtevani
- [ ] Production approval prejet
- [ ] Production credentials nastavljeni
- [ ] Final testing v production

---

## 🚀 Next Steps

1. **Takoj:**
   - [ ] Registriraj Booking.com Partner account
   - [ ] Registriraj Airbnb Host account
   - [ ] Zahtevaj API access

2. **Ko dobiš credentials:**
   - [ ] Dodaj v .env.local
   - [ ] Testiraj API calls
   - [ ] Testiraj webhook-e
   - [ ] Testiraj end-to-end flow

3. **Pred production:**
   - [ ] Zahtevaj production approval
   - [ ] Testiraj v production sandbox
   - [ ] Nastavi production credentials
   - [ ] Deployaj

---

**Vsi API-ji so pripravljeni! Samo ključe še dodaš! 🔑**
