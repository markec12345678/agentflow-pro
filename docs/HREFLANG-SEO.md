# hreflang za SEO (Blok B #6)

Turizem = več jezikov; SEO brez hreflang slab.

## Implementirano

### Root layout

V [src/app/layout.tsx](../src/app/layout.tsx) je dodano:

- `metadataBase` – osnova za absolutne URL-je (NEXT_PUBLIC_APP_URL ali VERCEL_URL)
- `alternates.canonical` – kanonična stran `/`
- `alternates.languages` – `sl`, `en`, `x-default` → `/`

To naroči iskalnikom primarni jezik in privzeto različico.

### Priporočila za izvoz landing strani

Ko uporabnik izvozi večjezično landing stran (dashboard → tourism → landing), naj pri hostingu doda hreflang v `<head>`:

```html
<link rel="alternate" hreflang="sl" href="https://example.com/sl/" />
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/" />
```

## Izvoz landing strani

Ob Export HTML (multi-jezik) se v `<head>` avtomatsko vstavi hreflang za vse jezike. V koraku Predogled lahko uporabnik vnese **Base URL za hreflang** (npr. `https://moja-nastanitev.si`); ta URL se uporabi v vseh `<link rel="alternate" hreflang="..." href="..." />` povezavah. Privzeto: `NEXT_PUBLIC_APP_URL` ali `https://yoursite.com`.

## Načrtovano (post-MVP)

- Locale routing (`/sl`, `/en`, `/de`) za marketing strani – odloženo za post-MVP; trenutno izvoz landing strani z hreflang v `<head>` zadostuje.

## Blok B #6 – MVP scope

Za MVP: hreflang v root layout (metadataBase, alternates) in v izvozu landing strani (multi-jezik) je implementirano. Locale routing ni kritičen za beta.
