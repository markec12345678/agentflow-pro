# KG v turistične entitete – Blok C #10

Podpora kontekstualnim odgovorom (razpoložljivost, zgodnja prijava ipd.).

## Entitete

| Entiteta | Opis | Vir |
|----------|------|-----|
| Property | Nastanitev | DB properties |
| Guest | Gost | DB guests |
| Reservation | Rezervacija | DB reservations |
| Amenity | Oprema/storitev | Implementirano (amenities tabela) |
| Policy | Pravila | Implementirano (property_policies tabela) |

## Relacije

| Relacija | Od | Do |
|----------|-----|-----|
| belongsTo | Property | User |
| hasGuest | Property | Guest |
| hasReservation | Property | Reservation |
| hasReservation | Guest | Reservation |

## Sinhronizacija

- **Vir:** [src/lib/tourism/tourism-kg-sync.ts](../src/lib/tourism/tourism-kg-sync.ts)
- Ob ustvarjanju property se kliče `syncPropertyToKg()`.
- `syncPropertyTreeToKg()` – sinhronizira property + amenities + policies + guests + reservations.

## Uporaba

Guest retrieval lahko opcijsko prejme `kgBackend` in vključi KG kontekst v odgovor.
FAQ multi-agent uporabi `getAppBackend()` za iskanje po KG.
