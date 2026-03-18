# 🐛 FIX: PGVECTOR MIGRATION ERROR

**Problem:** Migration `add_pgvector_semantic_memory` fails with:
```
ERROR: operator class "vector_cosine_ops" does not exist for access method "btree"
```

**Root Cause:** `pgvector` extension is not enabled in your Neon database.

---

## ✅ SOLUTION 1: Enable pgvector in Neon Dashboard (Recommended)

1. **Go to Neon Dashboard:**
   - https://console.neon.tech/

2. **Navigate to your project:**
   - Select your project (`ep-snowy-sun-aia7r9c2`)

3. **Enable pgvector extension:**
   - Go to **Settings** → **Extensions**
   - Find `vector` in the list
   - Click **Enable**

4. **Retry migration:**
   ```bash
   npx prisma migrate dev --name add_housekeeping_and_billing
   ```

---

## ✅ SOLUTION 2: Use Direct Connection URL (No Pooler)

Neon's pooler (`-pooler` URL) sometimes has issues with extensions.

1. **Get direct connection URL:**
   - Neon Dashboard → **Connection Details**
   - Copy **Direct connection** URL (not pooled)

2. **Update `.env.local`:**
   ```bash
   # Replace pooled URL with direct URL
   DATABASE_URL=postgresql://user:password@ep-snowy-sun-aia7r9c2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

3. **Run migration:**
   ```bash
   npx prisma migrate dev --name add_housekeeping_and_billing
   ```

4. **Switch back to pooled URL for runtime:**
   ```bash
   # After migration, switch back for better performance
   DATABASE_URL=postgresql://user:password@ep-snowy-sun-aia7r9c2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## ✅ SOLUTION 3: Manual SQL Execution

If above fail, run the SQL manually:

1. **Open Neon SQL Editor:**
   - Neon Dashboard → **SQL Editor**

2. **Run this SQL:**
   ```sql
   -- Enable pgvector extension
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- Verify it's enabled
   \dx
   ```

3. **Then run migration:**
   ```bash
   npx prisma migrate dev --name add_housekeeping_and_billing
   ```

---

## ✅ SOLUTION 4: Skip pgvector for Now (Quick Fix)

If you don't need semantic search immediately:

1. **Comment out the migration in schema.prisma:**
   ```prisma
   // Remove or comment out pgvector-related models
   ```

2. **Run migration:**
   ```bash
   npx prisma migrate dev --name add_housekeeping_and_billing
   ```

3. **Add pgvector later when ready**

---

## 🔍 VERIFICATION

After enabling pgvector, verify:

```sql
-- Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Test vector type
CREATE TABLE test_vector (embedding vector(3));
INSERT INTO test_vector VALUES ('[1,2,3]');
SELECT * FROM test_vector;
```

---

## 📝 RECOMMENDED APPROACH

**For Development:**
1. Use **Solution 1** (Enable in Dashboard) - Takes 2 minutes
2. Then run migration normally

**For Production:**
1. Use **Solution 2** (Direct connection for migrations)
2. Use pooled connection for runtime (better performance)

---

## ⚠️ IMPORTANT NOTES

1. **Neon + pgvector compatibility:**
   - pgvector is supported on Neon
   - Must be enabled via Dashboard or SQL

2. **Pooler vs Direct:**
   - Pooler: Better for runtime (connection pooling)
   - Direct: Required for some migrations/extensions

3. **After migration:**
   - Switch back to pooled URL for best performance
   - Test that everything works

---

**Next Steps:**
1. Try Solution 1 first (easiest)
2. If that fails, try Solution 2
3. Report back if you need help!
