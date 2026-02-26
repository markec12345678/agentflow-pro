# Primerjava vmesnika: lokalna koda vs Vercel produkcija

**Datum:** 2026-02-26  
**Produkcijski URL:** https://agentflow-pro-seven.vercel.app

---

## Kratek povzetek

| Aspekt | Lokalno (npm run dev) | Na Vercelu |
|--------|------------------------|------------|
| **Tailwind CSS** | Naložen pravilno | **Ne naloži** / ne deluje |
| **Layout** | Flex, grid, razmiki OK | Brez razmikov (WorkflowsPricingMemory) |
| **Barve** | Gradienti, teme, dark mode | Bel ozadje, privzeti fonti |
| **Navigacija** | Dropdowni, hover, animacije | Sploščena, linki združeni |
| **Hero sekcija** | Gradient ozadje, gradient tekst | Enostavno besedilo |

---

## 1. Kaj je v kodi (lokalni vmesnik)

### Layout (`src/app/layout.tsx`)

- Root layout z `globals.css`, font Inter
- Komponente: `Nav`, `ErrorBoundary`, `FloatingAssistant`
- Tailwind razredi na `<body>` (npr. `inter.className`)

### Domača stran (`src/app/page.tsx`)

- **Hero:** gradient `from-blue-900 via-blue-800 to-indigo-900`, velik naslov z gradient tekstom
- **Sekcije:** grid, kartice z `rounded-xl`, `shadow-lg`, `border-2`
- **Barve:** `text-blue-600`, `dark:text-blue-400`, `bg-gray-50 dark:bg-gray-800`
- **CTA gumbi:** gradient `from-blue-600 via-cyan-500 to-emerald-400`

### Navigacija (`LandingNav.tsx`)

- Fiksna navigacija s `backdrop-blur`, `shadow-lg`
- Dropdown meniji: Rešitve, Vir
- Linki: Cene, Demo, Prijava, Start Free Trial
- Tailwind: `flex`, `gap-*`, `rounded-xl`, `text-gray-700`, ipd.

### Styling setup

- `tailwind.config.ts`: content paths pokrivajo `src/app`, `src/web`, `src/components`
- `postcss.config.js`: tailwindcss + autoprefixer
- `globals.css`: `@tailwind base/components/utilities`, CSS spremenljivke

---

## 2. Kaj se prikaže na Vercelu

Glede na opise in produkcijske teste:

- **HTML struktura** je enaka (React/Next.js pravilno renderira)
- **Tailwind CSS se očitno ne naloži** ali ne uporabi pravilno
- Posledice:
  - belo ozadje namesto gradientov
  - privzeti sistemski fonti
  - linki brez razmikov (npr. "WorkflowsPricingMemory", "LoginRegister")
  - brez hover efektov, senč, zaobljenih robov
  - mobilni layout verjetno pokvarjen

---

## 3. Verjetni vzroki

### A) `output: "standalone"` v `next.config.ts`

```ts
output: "standalone",
```

- Standalone output je prilagojen Docker / self-hosted okolju
- Na Vercelu lahko spreminja, kako se strežejo statični viri (CSS, JS)
- Vercel v dokumentaciji navaja, da za Vercel deployment **standalone ni priporočljiv**

### B) Možni problemi s streženo CSS

- Standalone build lahko spremeni poti do `.css` datotek
- CDN / cache za asset paths lahko ne sovpada z dejanskim build outputom

### C) Tailwind content paths

- Trenutno: `./src/app/**/*`, `./src/web/**/*`, …
- Na produkciji bi moralo biti enako, vendar je smiselno preveriti, da build dejansko generira Tailwind razrede za vse komponente

---

## 4. Priporočeni koraki

1. **Odstrani `output: "standalone"`** za Vercel deployment  
   - V `next.config.ts` komentiraj ali odstrani vrstico `output: "standalone"`
   - Po ponovnem deployu preveri, ali se CSS naloži

2. **Pogojni standalone** (če ga potrebuješ za Docker)  
   - Uporabi `output: process.env.VERCEL ? undefined : "standalone"`
   - Na Vercelu se bo uporabil privzeti Next.js output

3. **Preveri Vercel build logs**  
   - Ali se `globals.css` in Tailwind pravilno procesira
   - Ali se ustvarijo pričakovani CSS bundle-i

4. **Preveri Network v DevTools**  
   - Na produkcijski strani: ali se `/_next/static/css/*.css` naloži in vrne 200
   - Ali so v odgovoru pričakovani Tailwind razredi

---

## 5. Rezime

| Lokalno | Vercel |
|---------|--------|
| Poln Tailwind styling | Brez Tailwind stylinga |
| Gradienti, grid, flex | Belo ozadje, default layout |
| Nav z dropdowni in spacing | Linki združeni brez razmikov |

Glavna razlika je, da **Tailwind CSS v produkciji na Vercelu ne deluje**. Verjeten vzrok je nastavitev `output: "standalone"` v `next.config.ts`.
