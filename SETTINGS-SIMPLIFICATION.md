# Settings Stran - Poenostavitev

## 🎯 Problem

Trenutna Settings stran je **preveč tehnična** za navadne uporabnike:
- 10+ API key polj
- Tehnični izrazi (Firecrawl, Context7, SerpAPI)
- Nejasno kaj je obvezno in kaj ne

## ✅ Rešitev (Kot Profesionalne Platforme)

### Option A: Skrij Settings (Najboljše)
```
- Navadni uporabniki: NE vidijo Settings strani
- Admini: Vidijo polno verzijo
- Redirect: /settings → /dashboard (za ne-admin)
```

### Option B: Dve Verziji (Priporočam)
```
1. Simple Mode (za vse)
   - Samo OpenAI key (opcijsko)
   - Preprosta razlaga
   - "Preskoči" gumb

2. Advanced Mode (za admin)
   - Vsi API keys
   - Vse nastavitve
   - Toggle: "I am a developer"
```

## 📋 Implementacija

### 1. Preprosta Verzija (Default)

```tsx
// /settings/page.tsx
export default function SettingsPage() {
  const [isAdvanced, setIsAdvanced] = useState(false);
  
  if (!isAdvanced) {
    return <SimpleSettings onSwitchToAdvanced={() => setIsAdvanced(true)} />;
  }
  
  return <FullSettings onSwitchToSimple={() => setIsAdvanced(false)} />;
}
```

### 2. Simple Settings Komponenta

```tsx
function SimpleSettings({ onSwitchToAdvanced }) {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Nastavitve
      </h1>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          🤖 AI Funkcije (Opcijsko)
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Za avtomatsko generiranje vsebine potrebujete OpenAI ključ.
          <br />
          <strong>Sistem deluje tudi brez AI funkcij!</strong>
        </p>
        
        <form>
          <label className="block text-sm font-medium mb-2">
            OpenAI API Key
          </label>
          <input
            type="password"
            placeholder="sk-..."
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-2">
            <a href="..." className="text-blue-600 hover:underline">
              Pridobi brezplačen ključ →
            </a>
          </p>
          <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">
            Shrani
          </button>
        </form>
      </div>
      
      <div className="border-t pt-6">
        <button
          onClick={onSwitchToAdvanced}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ⚙️ Napredne nastavitve (za developere)
        </button>
      </div>
    </div>
  );
}
```

### 3. Full Settings (Obstoječa + Toggle)

```tsx
function FullSettings({ onSwitchToSimple }) {
  return (
    <div>
      <button
        onClick={onSwitchToSimple}
        className="mb-6 text-sm text-blue-600 hover:underline"
      >
        ← Poenostavljen pogled
      </button>
      
      {/* Obstoječa Settings stran */}
      {/* ... vse API keys, integracije, itd ... */}
    </div>
  );
}
```

## 🎨 UI Primeri

### Simple Mode:
```
┌─────────────────────────────────────┐
│  Nastavitve                         │
│                                     │
│  🤖 AI Funkcije (Opcijsko)         │
│                                     │
│  Za avtomatsko generiranje         │
│  vsebine potrebujete OpenAI ključ. │
│  Sistem deluje tudi brez!          │
│                                     │
│  OpenAI API Key                    │
│  [sk-...                       ]   │
│                                     │
│  [Shrani]                           │
│                                     │
│  ⚙️ Napredne nastavitve            │
└─────────────────────────────────────┘
```

### Advanced Mode:
```
┌─────────────────────────────────────┐
│  ← Poenostavljen pogled            │
│                                     │
│  Vsi API Keys                       │
│  ├─ Firecrawl                      │
│  ├─ Context7                       │
│  ├─ SerpAPI                        │
│  ├─ OpenAI                         │
│  ├─ GitHub                         │
│  └─ ...                            │
│                                     │
│  Integracije                        │
│  ├─ LinkedIn                       │
│  ├─ Twitter                        │
│  └─ ...                            │
└─────────────────────────────────────┘
```

## 📊 Drugi Primeri iz Industrije

### Airbnb:
```
✅ "Postani gostitelj" → preprost obrazec
❌ Nobenih tehničnih nastavitev
```

### Shopify:
```
✅ "Dodaj produkt" → enostavno
✅ "App Store" → 1-klik integracije
❌ API keys skriti v "Developer Settings"
```

### Vercel:
```
✅ Default: Preprosto
✅ Toggle: "Developer Mode"
```

## ✅ Predlogi

1. **Takoj:** Naredi Simple Mode (zgoraj)
2. **Kasneje:** Dodaj user roles (admin vs user)
3. **Nikoli:** Ne prisiljuj API keys

## 🎯 Zaključek

**Cilj:** Navadni uporabnik ne sme videti tehničnih nastavitev!

- Simple Mode: 95% uporabnikov
- Advanced Mode: 5% adminov/developerjev
