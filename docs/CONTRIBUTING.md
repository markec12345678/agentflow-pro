# Contributing to AgentFlow Pro

## Development setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in values.

3. Run the dev server:

   ```bash
   npm run dev
   ```

## Code style and quality

- **Lint**: `npm run lint`
- **Test**: `npm run test` (Jest unit tests)
- **E2E**: `npm run test:e2e` (Playwright; run `npm run playwright:install` first)

## Pre-commit

Before committing, run:

```bash
./scripts/pre-commit.sh
```

Or use the npm script:

```bash
npm run precommit
```

This runs lint and unit tests.

## Pull request process

1. Create a branch from `main`.
2. Make changes; ensure lint and tests pass.
3. Open a PR. E2E tests run on PR.
4. Address review feedback.

## Branch naming

- `feature/` – New features
- `fix/` – Bug fixes
- `docs/` – Documentation
