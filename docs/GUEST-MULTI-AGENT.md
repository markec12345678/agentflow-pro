# Gostinski multi-agent (Retrieval + Copy) – Blok C #9

Boljša kakovost odgovorov gostom z Retrieval + Copy agentom.

## Komponente

| Komponenta | Datoteka | Opis |
|------------|----------|------|
| Retrieval | `src/lib/tourism/guest-retrieval.ts` | Pridobi Property, Guest, Reservation, brand iz DB |
| Copy | `src/lib/tourism/guest-copy-agent.ts` | Oblikuje odgovor v brand tonu z LLM |
| FAQ API | `src/app/api/tourism/faq/route.ts` | Integracija v chatbot |

## Uporaba

Za multi-agent flow pošlji v body:

```json
{
  "question": "Kdaj je check-in?",
  "propertyId": "prop_xxx",
  "useMultiAgent": true
}
```

Opcijsko: `guestId`, `userId` (za brand brez property).

## Flow

1. **Retrieval** – `retrieveGuestContext()` naloži nastanitev, gosta, rezervacije, brand voice
2. **Copy** – `runGuestCopyAgent()` uporabi kontekst + vprašanje → LLM odgovor
3. Fallback – če LLM ni na voljo, uporabi keyword matching

## Zahteve

- `OPENAI_API_KEY` (ali `ALIBABA_QWEN_API_KEY`) za Copy agent
- `propertyId` ali `userId` za kontekst
