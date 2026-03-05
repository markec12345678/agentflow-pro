# Guest Multi-Agent (Retrieval + Copy) – Block C #9

Better quality responses to guests with Retrieval + Copy agents.

## Components

| Component | File | Description |
|------------|----------|------|
| Retrieval | `src/lib/tourism/guest-retrieval.ts` | Retrieves Property, Guest, Reservation, brand from DB |
| Copy | `src/lib/tourism/guest-copy-agent.ts` | Shapes response in brand tone using LLM |
| FAQ API | `src/app/api/tourism/faq/route.ts` | Integration with chatbot |

## Usage

For multi-agent flow send in body:

```json
{
  "question": "What time is check-in?",
  "propertyId": "prop_xxx",
  "useMultiAgent": true
}
```

Optional: `guestId`, `userId` (for brand without property).

## Flow

1. **Retrieval** – `retrieveGuestContext()` loads accommodation, guest, reservations, brand voice
2. **Copy** – `runGuestCopyAgent()` uses context + question → LLM response
3. Fallback – if LLM is unavailable, use keyword matching

## Requirements

- `OPENAI_API_KEY` (or `ALIBABA_QWEN_API_KEY`) for Copy agent
- `propertyId` or `userId` for context
