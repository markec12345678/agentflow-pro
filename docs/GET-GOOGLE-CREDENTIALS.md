# 🔐 GOOGLE CREDENTIALS - HITRA NAVODILA

**Čas:** 5 minut

---

## 📋 KORAKI:

### **1. Odpri Google Cloud Console:**
```
https://console.cloud.google.com/
```

### **2. Create New Project:**
- Click "SELECT A PROJECT" → "NEW PROJECT"
- Project name: `AgentFlow Pro`
- Click "CREATE"

### **3. Enable Google+ API:**
- Search "Google+ API" v search bar
- Click "ENABLE"

### **4. Create OAuth Credentials:**
- Go to "APIs & Services" → "Credentials"
- Click "CREATE CREDENTIALS" → "OAuth client ID"
- Application type: **Web application**
- Name: `AgentFlow Pro Localhost`

### **5. Add Redirect URI:**
Pod "Authorized redirect URIs":
```
http://localhost:3000/api/auth/callback/google
```

### **6. Kopiraj Credentials:**

Dobiš dve vrednosti:
- **Client ID:** `123456789-xxxxx.apps.googleusercontent.com`
- **Client Secret:** `GOCSPX-xxxxx`

---

## 📝 DODAJ V .ENV.LOCAL:

Odpri `.env.local` in dodaj:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

**Zamenjaj `xxxxx` s tvojimi credentials!**

---

## ✅ TEST:

```bash
# Restartaj server (CTRL+C, potem npm run dev)
npm run dev

# Odpri http://localhost:3000
# Klikni Login → Google → Izberi account
# Success! 🎉
```

---

**Ko imaš credentials, mi povej in bom dodal v .env.local!**
