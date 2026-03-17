# Booking.com – Pričetek registracije (Blok A #2)

**Razlog:** 4–8 tednov čakanja; vsak dan zamude = zamujeno partnerstvo.

## Tip registracije

| Tip | URL | Uporaba |
|-----|-----|---------|
| Affiliate partner | [partnerships.booking.com](https://partnerships.booking.com/) | Promocija Booking.com linkov, provizije |
| Connectivity partner | [partner.booking.com](https://partner.booking.com/) | API integracija za PMS/PMS-ove |

Za AgentFlow Pro (turistični SaaS) sta relevantna predvsem **Connectivity partner** (API) ali **Affiliate** (če želimo v aplikaciji prikazovati Booking.com linke).

## Koraki – Connectivity partner (API)

1. **Obiski**
   - [ ] [partner.booking.com](https://partner.booking.com/) → Sign up / Get started
   - [ ] Preberi pogoje in zahteve za Connectivity Partner Programme

2. **Priprava podatkov** (uporabi `src/lib/booking-com-partnership.ts`)
   - [ ] Izpolni `BookingComPartnershipData` z dejanskimi podatki
   - [ ] `generatePartnershipApplication()` → ustvari besedilo aplikacije

3. **Zahtevani dokumenti / podatki**
   - [ ] Poslovna registracija (d.o.o. ali ustrezno)
   - [ ] GDPR / zasebnost: privacy policy, cookie policy
   - [ ] Tehnična specifikacija: API endpoints, avtentikacija
   - [ ] Poslovni model: na koga ciljamo (nastanitve, agencije)

4. **Pošlji aplikacijo**
   - [ ] Registracija na partner.booking.com
   - [ ] Izpolnjena prijava + priloge
   - [ ] Čas čakanja: običajno 4–8 tednov

## Koraki – Affiliate partner

1. **Obiski**
   - [ ] [partnerships.booking.com](https://partnerships.booking.com/)
   - [ ] Pridružitev brezplačno

2. **Zahtevi**
   - [ ] Registracija prek Awin ali CJ Affiliate (regija odvisna)
   - [ ] Veb stran / platforma za promocijo linkov
   - [ ] Dodajanje linkov, bannerjev, promocijskih elementov

## Status

- [ ] Odločitev: Connectivity ali Affiliate (ali oba)
- [ ] Datum začetka prijave: _______________
- [ ] Datum pošiljanja: _______________
- [ ] Status odziva: _________________

## Povezava z AgentFlow Pro

- `src/lib/booking-com-partnership.ts` – generator prijave in tehnična specifikacija
- Če izbereš Connectivity: priprava za prihodnjo API integracijo (rate limits, error handling, retry)
