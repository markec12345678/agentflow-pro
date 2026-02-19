# UI/UX Checklist – Tourism Dashboard

Preverjanje implementacije UI/UX polish za tourism strani.

## Implementirano

### 1. Loading States
- **Generate**: Skeleton ob nalaganju template (templateId), skeleton med generiranjem
- **Email**: Skeleton v rezultatnem bloku med `loading`

### 2. Toast Notifications
- **Generate**: `toast.success("Vsebina uspešno generirana")` ob uspešni generaciji
- Obstaja toast za copy, save, error

### 3. Error Handling
- **Generate**: Inline sporočilo "Template ni mogoče naložiti" z gumbom "Poskusi znova" ob napaki fetch template
- **Overview**: Inline sporočilo "Prišlo je do napake. Poskusi znova." ob napaki fetch stats/templates
- User-friendly sporočila: "Vsebina ni bila generirana. Preveri internetno povezavo in poskusi znova."

### 4. Accessibility
- `aria-label` na copy, delete, close gumbih (Generate, Email, Translate, Properties, Templates)
- Form labels z `htmlFor` v VariableForm
- Escape za zapiranje modala (save template)

### 5. Animations
- `transition-colors` / `transition-all` na gumbih in karticah
- `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` na interaktivnih elementih

### 6. Mobile Responsive
- `min-h-[44px]` za tap targets
- `min-w-0` za flex-wrap bloke (overflow)
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4` na Overview in Email

### 7. Dark Mode
- Skeleton, ErrorBoundary podpirata dark
- Vsi tourism inputi, selecti, modali z `dark:` razredi
- Properties edit forma – dodani dark razredi

## Lighthouse Audit (Ročno)

Zaženite:

```bash
npm run build
npm run start
```

Chrome DevTools → Lighthouse → Run audit (Performance, Accessibility, Best Practices).

Beležite rezultate pred/po spremembah.

| Stran           | Performance | Accessibility | Best Practices |
|-----------------|-------------|---------------|----------------|
| /dashboard/tourism | _todo_    | _todo_        | _todo_         |
| /dashboard/tourism/generate | _todo_ | _todo_   | _todo_         |
| /dashboard/tourism/email | _todo_    | _todo_        | _todo_         |
| /dashboard/tourism/landing | _todo_ | _todo_ | _todo_         |
| /dashboard/tourism/properties | _todo_ | _todo_ | _todo_         |
| /dashboard/tourism/templates | _todo_ | _todo_ | _todo_         |
| /dashboard/tourism/seo | _todo_ | _todo_ | _todo_         |
| /dashboard/tourism/translate | _todo_ | _todo_ | _todo_         |

## Mobile Audit (Day 5)

| Stran | 375px | 390px | 768px | 1024px |
|-------|-------|-------|-------|--------|
| Overview | _todo_ | _todo_ | _todo_ | _todo_ |
| Generate | _todo_ | _todo_ | _todo_ | _todo_ |
| Landing | _todo_ | _todo_ | _todo_ | _todo_ |
| Properties | Pass (edit form dark mode + responsive) | _todo_ | _todo_ | _todo_ |
