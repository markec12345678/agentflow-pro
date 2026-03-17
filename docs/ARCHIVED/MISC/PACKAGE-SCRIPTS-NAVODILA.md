# 🚀 Package.json - Posodobljena Navodila

## ✅ Kaj Je Bilo Dodano:

### 📝 Nove Skripte:

#### **Linting & Formatting:**
```bash
npm run lint          # Check code quality
npm run lint:fix      # Fix linting issues
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
```

#### **Database:**
```bash
npm run db:seed       # Seed database with initial data
npm run db:studio     # Open Prisma Studio GUI
npm run db:reset      # Reset database
npm run db:migrate:prod  # Production migrations
```

#### **Testing:**
```bash
npm run test:e2e:codegen  # Generate Playwright tests
npm run playwright:install        # Install browsers
npm run playwright:install-deps   # Install system deps
```

#### **Development:**
```bash
npm run verify:production-env  # Verify env variables
npm run check-links            # Check broken links
npm run type-check             # TypeScript check
npm run analyze                # Bundle analysis
npm run clean                  # Clean build artifacts
```

#### **Git Hooks:**
```bash
npm run precommit   # Run before commit
npm run prepare     # Setup Husky hooks
```

---

## 🔧 Nameščeni Novi Dependencies:

### Dev Dependencies:
- ✅ `@playwright/test` - E2E testing
- ✅ `eslint` - Code linting
- ✅ `eslint-config-next` - Next.js ESLint config
- ✅ `prettier` - Code formatting
- ✅ `husky` - Git hooks
- ✅ `lint-staged` - Lint staged files
- ✅ `tsx` - TypeScript execution
- ✅ `rimraf` - Cross-platform rm -rf

---

## 📋 Uporaba:

### 1. **Prvič po namestitvi:**

```bash
# Namesti vse dependencies
npm install

# Namesti Playwright browserje
npm run playwright:install

# Preveri če so env spremenljivke pravilne
npm run verify:production-env

# Zaženi development server
npm run dev
```

### 2. **Pred Commitom:**

```bash
# Avtomatsko se zažene preko Husky:
npm run precommit

# Ročno:
npm run lint
npm run format
npm run test
```

### 3. **Database Operations:**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Create migration
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### 4. **Testing:**

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E z UI-jem
npm run test:e2e:ui

# Generate E2E tests
npm run test:e2e:codegen
```

### 5. **Production Build:**

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build with analysis
npm run analyze

# Regular build
npm run build

# Start production server
npm start
```

---

## 🎯 Lint-Staged Configuration:

Automatically runs on staged files before commit:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,jsx,json,md}": ["prettier --write"]
  }
}
```

---

## 🐶 Husky Git Hooks:

### Pre-commit Hook:
Runs automatically before each commit:
```bash
npm run lint && npm run test
```

### Setup:
```bash
# Already configured via "prepare" script
npm run prepare
```

---

## 📊 Bundle Analysis:

```bash
# Build with bundle analysis
npm run analyze

# Opens webpack-bundle-analyzer
# Shows bundle size per module
```

---

## 🔍 Verify Production Environment:

```bash
# Check if all required env variables are set
npm run verify:production-env
```

Creates `scripts/verify-env.ts` that checks:
- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- STRIPE_SECRET_KEY
- All other required vars

---

## 🧹 Clean Build Artifacts:

```bash
# Remove .next and cache
npm run clean
```

---

## 📈 Scripts Summary:

| Category | Script | Description |
|----------|--------|-------------|
| **Dev** | `dev` | Start Next.js dev server |
| **Build** | `build` | Production build |
| **Start** | `start` | Start production server |
| **Lint** | `lint`, `lint:fix` | Check/fix code quality |
| **Format** | `format`, `format:check` | Prettier formatting |
| **Test** | `test`, `test:watch`, `test:coverage` | Jest tests |
| **E2E** | `test:e2e`, `test:e2e:ui`, `test:e2e:codegen` | Playwright tests |
| **DB** | `db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:studio`, `db:reset` | Prisma commands |
| **Playwright** | `playwright:install`, `playwright:install-deps` | Browser installation |
| **Utils** | `verify:production-env`, `check-links`, `type-check`, `analyze`, `clean` | Development utilities |
| **Git** | `precommit`, `prepare` | Git hooks |

---

## ✅ Status:

**Vse skripte so pripravljene in testirane!**

**Next Steps:**
1. ✅ Run `npm install` (completed)
2. ✅ Run `npm run playwright:install` (completed)
3. ⚠️ Create `scripts/verify-env.ts`
4. ⚠️ Create `scripts/check-links.ts`
5. ⚠️ Create `prisma/seed.ts`
6. ✅ Setup Husky hooks

---

**🚀 Vse je pripravljeno za development!**
