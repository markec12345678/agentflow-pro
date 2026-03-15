# 🚀 API Route Refactoring - Efficiency Guide

## Pattern za Hitro Refaktorizacijo

### Koraki (5-10 min na route):

1. **Identificiraj business logiko** (>100 vrstic)
2. **Ustvari use case** (če še ne obstaja)
3. **Premakni logiko** v use case
4. **Pusti tanek wrapper** v API route
5. **Dodaj middleware** za error handling

### Template za Use Case:

```typescript
export class [ActionName] {
  constructor(
    private repo: Repository,
    private service: Service
  ) {}

  async execute(input: Input): Promise<Output> {
    // 1. Validate
    // 2. Business logic
    // 3. Save/Update
    // 4. Return result
  }
}
```

### Template za API Route:

```typescript
export async function POST(request: NextRequest) {
  return withRequestLogging(
    request,
    async () => {
      // 1. Authenticate
      const userId = getUserId(session)
      
      // 2. Parse body
      const body = await request.json()
      
      // 3. Execute use case
      const useCase = new [ActionName]()
      const result = await useCase.execute({ ... })
      
      return NextResponse.json(result)
    },
    '/api/[route]'
  )
}
```

## Batch Refactoring Strategy

### Serija 1: Agent Routes (3 route-e)
- `/api/agents/evaluations` (127 vrstic)
- `/api/agents/approvals` (~100 vrstic)
- `/api/agents/status` (~80 vrstic)

**Use Case:** `EvaluateAgent`, `ApproveAgentAction`, `GetAgentStatus`

### Serija 2: Alerts Routes (5 route-ov)
- `/api/alerts/rules` (~150 vrstic)
- `/api/alerts/[id]` (~120 vrstic)
- `/api/alerts/preferences` (~100 vrstic)
- `/api/alerts/test` (~90 vrstic)
- `/api/alerts` (~200 vrstic)

**Use Case:** `CreateAlertRule`, `UpdateAlert`, `GetAlertPreferences`

### Serija 3: Auth Routes (8 route-ov)
- `/api/auth/login` (~180 vrstic)
- `/api/auth/register` (~200 vrstic)
- `/api/auth/password` (~150 vrstic)
- `/api/auth/verify-email` (~100 vrstic)
- ...

**Use Case:** Already created (`Authentication`)

### Serija 4: Tourism Routes (10 route-ov)
- `/api/tourism/properties/[id]/*`
- `/api/tourism/guests/*`
- `/api/tourism/notifications`

**Use Case:** `GetProperty`, `UpdateGuest`, `SendNotification`

## Time Estimates

| Serija | Route-ov | Čas/route | Skupaj |
|--------|----------|-----------|--------|
| Agents | 3 | 10 min | 30 min |
| Alerts | 5 | 10 min | 50 min |
| Auth | 8 | 8 min | 64 min |
| Tourism | 10 | 8 min | 80 min |
| **Total** | **26** | - | **224 min (~4 ure)** |

## Automation Tips

1. **Uporabi AI** za generiranje boilerplate code
2. **Copy-paste pattern** za podobne route-e
3. **Batch commit** vsakih 5-10 route-ov
4. **Testiraj batch** namesto posameznih route-ov

## Progress Tracker

```
Series 1 (Agents):     [██░░░░░░░░] 3/26 done
Series 2 (Alerts):     [█████░░░░░] 5/26 done
Series 3 (Auth):       [████████░░] 8/26 done
Series 4 (Tourism):    [██████████] 10/26 done
----------------------------------------
Total Progress:        26/311 (8.4%)
```
