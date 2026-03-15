# Napovedovalna analitika – Blok C #8

Diferenciator, višji pricing. Enostavna napoved na podlagi povprečij in trendov (brez ML).

## Implementacija

| Komponenta | Datoteka | Opis |
|------------|----------|------|
| Predictive logic | `src/lib/tourism/predictive-analytics.ts` | computePredictive(monthlyData, avgStay) |
| API | `src/app/api/tourism/analytics/route.ts` | Blok `predictive` v odzivu |
| Dashboard | `src/app/dashboard/tourism/analytics/page.tsx` | Kartica "Napoved (naslednjih 30 dni)" |

## Metrike

- **forecastNightsNext30d** – napovedana prenočišča
- **forecastBookingsNext30d** – napovedane rezervacije
- **forecastRevenueNext30d** – napovedani prihodki
- **trendDirection** – up / down / stable
- **trendPercent** – sprememba v %
- **confidence** – zaupanje (0.5–0.9 glede na število mesecev)

## Algoritem

Povprečje zadnjih 3 mesecev, trend factor (±5 %) glede na primerjavo zadnjega z predzadnjim mesecem.
