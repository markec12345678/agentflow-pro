# ✅ Sentry Monitoring - Setup Complete

**Datum:** 2026-03-10  
**Status:** ✅ KONFIGURIRANO

---

## 📊 Sentry Configuration

### **DSN:**
```
https://70dcdcf086eeda255201a5a5916da782@o4511022029733888.ingest.de.sentry.io/4511022031896656
```

### **Organization:**
```
agentflow-pro
```

### **Project:**
```
agentflow-pro
```

### **Region:**
```
EU (Germany) - ingest.de.sentry.io
```

---

## 🔧 Konfiguracijske Datoteke

### **1. Environment Variables**
**`.env.local` in `.env`:**
```bash
SENTRY_DSN="https://70dcdcf086eeda255201a5a5916da782@o4511022029733888.ingest.de.sentry.io/4511022031896656"
SENTRY_ORG="agentflow-pro"
SENTRY_PROJECT="agentflow-pro"
```

### **2. Server Config**
**`sentry.server.config.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://70dcdcf086eeda255201a5a5916da782@o4511022029733888.ingest.de.sentry.io/4511022031896656",
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  skipOpenTelemetrySetup: process.env.NODE_ENV === "development",
  environment: process.env.NODE_ENV || "development",
});
```

### **3. Edge Config**
**`sentry.edge.config.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://70dcdcf086eeda255201a5a5916da782@o4511022029733888.ingest.de.sentry.io/4511022031896656",
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  environment: process.env.NODE_ENV || "development",
});
```

### **4. Client Config**
**`instrumentation-client.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || "https://70dcdcf086eeda255201a5a5916da782@o4511022029733888.ingest.de.sentry.io/4511022031896656",
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV || "development",
  integrations: [Sentry.replayIntegration()],
});
```

### **5. Custom Service**
**`src/lib/sentry.ts`:**
- ✅ SentryService class
- ✅ Error tracking hooks
- ✅ Performance monitoring
- ✅ Custom breadcrumbs
- ✅ Agent-specific tracking
- ✅ Workflow error tracking
- ✅ Tourism-specific errors

---

## 📈 Features

### **Error Tracking:**
- ✅ Automatic error capture
- ✅ Custom error boundaries
- ✅ Agent error tracking
- ✅ Workflow error tracking
- ✅ API error tracking
- ✅ Database error tracking

### **Performance Monitoring:**
- ✅ Transaction tracing
- ✅ Performance metrics
- ✅ Database performance
- ✅ Agent performance
- ✅ Workflow performance
- ✅ Rate limiting tracking

### **Session Replay:**
- ✅ 10% sample rate
- ✅ Error-based replay (100%)
- ✅ User action tracking
- ✅ Component mount/unmount tracking

### **Environment Tracking:**
- ✅ Development: 100% trace rate
- ✅ Production: 10% trace rate
- ✅ Environment tagging
- ✅ Release versioning

---

## 🎯 Usage Examples

### **Manual Error Tracking:**
```typescript
import { sentryService } from "@/lib/sentry";

// Capture custom error
try {
  // some code
} catch (error) {
  sentryService.captureException(error, {
    contexts: { custom: { userId: "123" } }
  });
}
```

### **Performance Tracking:**
```typescript
import { usePerformanceMetric } from "@/lib/sentry";

const trackMetric = usePerformanceMetric();

// Track operation duration
trackMetric("database.query", 150, { table: "users" });
```

### **Agent Error Tracking:**
```typescript
sentryService.captureAgentError("research", error, {
  query: "tourism trends",
  source: "firecrawl"
});
```

### **Workflow Error Tracking:**
```typescript
sentryService.captureWorkflowError("workflow-123", error, {
  nodeId: "node-456",
  step: "content-generation"
});
```

---

## 🚀 Vercel Setup

### **Environment Variables for Vercel:**

1. **Vercel Dashboard → agentflow-pro → Settings → Environment Variables**
2. **Add Variable:**
   - Name: `SENTRY_DSN`
   - Value: `https://70dcdcf086eeda255201a5a5916da782@o4511022029733888.ingest.de.sentry.io/4511022031896656`
   - Environment: ✅ Production
3. **Add Variable:**
   - Name: `SENTRY_ORG`
   - Value: `agentflow-pro`
   - Environment: ✅ Production
4. **Add Variable:**
   - Name: `SENTRY_PROJECT`
   - Value: `agentflow-pro`
   - Environment: ✅ Production
5. **Save & Redeploy**

---

## 📊 Sentry Dashboard

### **Access:**
1. Login: https://sentry.io
2. Organization: `agentflow-pro`
3. Project: `agentflow-pro`

### **Key Metrics:**
- **Error Rate**: Should be <1%
- **Performance**: Average response time <2s
- **Session Replay**: Check user sessions
- **Crash-Free Sessions**: Target >99%

### **Alerts Setup:**
1. **Settings → Alerts → Create Alert**
2. **Recommended:**
   - Error spike: >10 errors in 5 minutes
   - Performance degradation: P95 >3s
   - Crash rate: >1%

---

## ✅ Verification Checklist

### **Local Development:**
- [x] `.env.local` has SENTRY_DSN
- [x] `sentry.server.config.ts` configured
- [x] `sentry.edge.config.ts` configured
- [x] `instrumentation-client.ts` configured
- [x] `src/lib/sentry.ts` available

### **Production (Vercel):**
- [ ] Vercel env vars set (glej zgoraj)
- [ ] Redeploy after setting env vars
- [ ] Check Sentry dashboard for events
- [ ] Verify error tracking works
- [ ] Test performance monitoring

### **Testing:**
```bash
# Test Sentry initialization
npm run dev

# Trigger test error (v development mode)
# Check Sentry dashboard for event
```

---

## 🔒 Privacy & Compliance

### **PII Settings:**
- ✅ `sendDefaultPii: false` (default)
- ✅ No user emails sent by default
- ✅ No IP addresses stored
- ✅ GDPR compliant configuration

### **Data Retention:**
- **Error Events:** 90 days (free tier)
- **Performance Data:** 7 days (free tier)
- **Session Replay:** 30 days (free tier)

---

## 📞 Support

### **Sentry Documentation:**
- https://docs.sentry.io
- https://docs.sentry.io/platforms/javascript/guides/nextjs/

### **Internal:**
- Custom service: `src/lib/sentry.ts`
- Hooks: Available in `src/lib/sentry.ts`

---

**Status:** ✅ Sentry je popolnoma konfiguriran in pripravljen za uporabo!

**Next Step:** Dodaj environment variables v Vercel in redeployaj.
