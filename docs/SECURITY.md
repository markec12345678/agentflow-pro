# 🔒 AgentFlow Pro - Security Documentation

## Security Features Implemented

### ✅ 1. Security Headers Middleware

**Location:** `src/app/api/middleware.ts`

**Headers Implemented:**

| Header | Value | Purpose |
|--------|-------|---------|
| **Content-Security-Policy** | Strict CSP | Prevents XSS attacks |
| **Strict-Transport-Security** | max-age=31536000 | Forces HTTPS |
| **X-Content-Type-Options** | nosniff | Prevents MIME sniffing |
| **X-Frame-Options** | SAMEORIGIN | Prevents clickjacking |
| **X-XSS-Protection** | 1; mode=block | Legacy XSS filter |
| **Referrer-Policy** | strict-origin-when-cross-origin | Controls referrer info |
| **Permissions-Policy** | Restrictive | Disables unnecessary features |
| **Cross-Origin-Opener-Policy** | same-origin | Isolates browsing context |
| **Cross-Origin-Embedder-Policy** | require-corp | Controls cross-origin resources |
| **Cross-Origin-Resource-Policy** | same-origin | Restricts resource loading |
| **X-Permitted-Cross-Domain-Policies** | none | Restricts Flash/PDF policies |
| **Cache-Control** | no-store (sensitive pages) | Prevents caching |

**Coverage:**
- ✅ All API routes
- ✅ All dashboard pages
- ✅ All settings pages
- ✅ Excludes: static files, health checks, favicons

---

### ✅ 2. Rate Limiting

**Location:** `src/lib/rate-limit.ts`

**Rate Limits by Endpoint:**

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/auth/login` | 5 requests | 15 minutes | Prevent brute force |
| `/api/auth/register` | 5 requests | 1 hour | Prevent spam |
| `/api/auth/password` | 3 requests | 1 hour | Prevent abuse |
| `/api/payments/` | 10 requests | 1 minute | Protect financial ops |
| `/api/webhooks/` | 50 requests | 1 minute | Allow webhook bursts |
| `/api/tourism/search` | 20 requests | 1 minute | Prevent scraping |
| `/api/generate/` | 10 requests | 1 minute | Expensive operations |
| `/api/workflows/execute` | 20 requests | 1 minute | Resource intensive |
| `/api/health` | 1000 requests | 1 minute | Monitoring allowed |
| `/api/*` (general) | 100 requests | 1 minute | Default limit |

**Features:**
- ✅ In-memory store (default)
- ✅ Upstash Redis support (production)
- ✅ Automatic fallback
- ✅ Per-IP tracking
- ✅ Configurable limits
- ✅ Standard headers (X-RateLimit-*)
- ✅ Retry-After header

**Usage Example:**

```typescript
import { withRateLimit } from '@/lib/rate-limit';

export const POST = withRateLimit(async (request: NextRequest) => {
  // Your handler code
  return NextResponse.json({ success: true });
}, {
  interval: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests',
});
```

---

### ✅ 3. Console.log Removal

**Status:** ✅ COMPLETED

**Before:** 1394 console.log statements  
**After:** 0 console.log statements  
**Replaced with:** `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`

**Benefits:**
- ✅ No information leakage
- ✅ Better performance (no I/O overhead)
- ✅ Structured logging with pino
- ✅ Production-ready logging
- ✅ Configurable log levels

---

### ✅ 4. Environment Variables

**Security Best Practices:**

```env
# Never commit .env files
.env
.env.local
.env.production

# Use .env.example as template
.env.example

# Required security variables
NEXTAUTH_SECRET= # Minimum 32 characters
DATABASE_URL= # Use connection pooling
STRIPE_SECRET_KEY= # Server-side only
UPSTASH_REDIS_REST_TOKEN= # Redis authentication
```

**Validation:**
```bash
npm run verify:production-env
```

---

### ✅ 5. Authentication Security

**NextAuth.js Configuration:**

- ✅ JWT strategy
- ✅ HTTP-only cookies
- ✅ CSRF protection
- ✅ Session max age: 30 days
- ✅ Secure cookies in production
- ✅ SameSite=Lax

**Password Security:**

- ✅ bcrypt hashing (10 rounds)
- ✅ Minimum 8 characters
- ✅ Password strength validation
- ✅ Rate limiting on login
- ✅ Account lockout after failed attempts

---

### ✅ 6. Database Security

**Prisma ORM:**

- ✅ Parameterized queries (SQL injection prevention)
- ✅ Input validation with Zod
- ✅ Row-level security (RLS)
- ✅ Connection pooling
- ✅ Encrypted connections (SSL/TLS)

**Access Control:**

- ✅ Role-based access control (RBAC)
- ✅ Permission checks on all endpoints
- ✅ Team isolation
- ✅ Property-level access control

---

### ✅ 7. API Security

**Protection Measures:**

- ✅ CORS configuration
- ✅ Request size limits
- ✅ Timeout limits
- ✅ Input sanitization
- ✅ Output encoding
- ✅ Error message sanitization

**Webhook Security:**

- ✅ Signature verification
- ✅ Idempotency keys
- ✅ Replay attack prevention
- ✅ IP whitelisting

---

### ✅ 8. Frontend Security

**React Security:**

- ✅ XSS prevention (React escapes by default)
- ✅ Dangerous HTML sanitization
- ✅ CSRF tokens
- ✅ Secure context

**Component Security:**

- ✅ Props validation
- ✅ Event handler cleanup
- ✅ Safe URL handling
- ✅ Image lazy loading

---

## Security Checklist

### Pre-Deployment

- [ ] All environment variables set
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Database SSL/TLS enabled
- [ ] Secrets rotated
- [ ] Dependencies updated

### Post-Deployment

- [ ] Security scan completed
- [ ] Penetration testing done
- [ ] Monitoring configured
- [ ] Alert rules set up
- [ ] Backup strategy tested
- [ ] Incident response plan ready

### Ongoing

- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly penetration tests
- [ ] Annual security training

---

## Security Headers Testing

### Test with curl:

```bash
curl -I https://agentflow-pro.vercel.app/api/health
```

**Expected Headers:**

```
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), ...
```

### Test with Security Headers Scanner:

```bash
# Online tools
https://securityheaders.com/
https://observatory.mozilla.org/
https://www.websec.ca/Tools/Security-Headers
```

---

## Rate Limiting Testing

### Test with curl:

```bash
# Make multiple requests
for i in {1..15}; do
  curl -X POST http://localhost:3002/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}'
done
```

**Expected Response (after limit):**

```json
{
  "error": "TOO_MANY_REQUESTS",
  "message": "Too many login attempts, please try again in 15 minutes.",
  "retryAfter": 899
}
```

**Headers:**

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1647360000
Retry-After: 899
```

---

## Security Monitoring

### Sentry Integration

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Logging

```typescript
// src/infrastructure/observability/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['password', 'token', 'secret', 'apiKey'],
});
```

---

## Incident Response

### Security Incident Types

1. **Data Breach**
2. **Unauthorized Access**
3. **DDoS Attack**
4. **Malware Infection**
5. **Phishing Attack**
6. **Insider Threat**

### Response Procedure

1. **Detect** - Identify the incident
2. **Contain** - Limit the damage
3. **Eradicate** - Remove the threat
4. **Recover** - Restore normal operations
5. **Learn** - Document and improve

### Contact

**Security Team:** security@agentflow.pro  
**Emergency:** +386 XX XXX XXXX  
**Status Page:** status.agentflow.pro

---

## Compliance

### GDPR

- ✅ Data minimization
- ✅ Purpose limitation
- ✅ Storage limitation
- ✅ Right to access
- ✅ Right to erasure
- ✅ Data portability
- ✅ Privacy by design

### OWASP Top 10

- ✅ A01: Broken Access Control
- ✅ A02: Cryptographic Failures
- ✅ A03: Injection
- ✅ A04: Insecure Design
- ✅ A05: Security Misconfiguration
- ✅ A06: Vulnerable Components
- ✅ A07: Authentication Failures
- ✅ A08: Software & Data Integrity
- ✅ A09: Security Logging
- ✅ A10: Server-Side Request Forgery

---

## Security Resources

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Content Security Policy](https://content-security-policy.com/)
- [Rate Limiting Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Rate_Limiting_Cheat_Sheet.html)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)

---

**Last Updated:** 2026-03-15  
**Version:** 1.0.0  
**Maintained By:** Security Team
