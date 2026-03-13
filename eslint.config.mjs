import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "*.config.js",
    "next-env.d.ts",
    "prisma/seed.ts",
    "load-tests/**",
    "scripts/**", // Documentation scripts moved to scripts/
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@next/next/no-img-element": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      "@typescript-eslint/no-unsafe-declaration-merging": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }], // Allow console.warn and console.error for error handling
    },
  },
  {
    files: ["**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx", "src/page-builder/**/*.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_req" }],
    },
  },
  // ============================================================================
  // 🏗️ ARCHITECTURAL PROTECTION RULES (DDD Layer Enforcement)
  // ============================================================================
  {
    // Domain Layer - Pure business logic, no dependencies on UI or infrastructure
    files: ["src/core/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/components/*", "@/web/*", "@/features/*"],
              message:
                "❌ Domain layer CANNOT depend on UI, features, or infrastructure. Use ports/interfaces instead.",
            },
            {
              group: ["@/infrastructure/*"],
              message:
                "❌ Domain layer CANNOT import infrastructure. Define interfaces in ports/ instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // Use Cases - Can depend on domain and ports, but not on UI or infrastructure implementations
    files: ["src/core/use-cases/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/components/*", "@/web/*", "@/features/*"],
              message:
                "❌ Use cases CANNOT depend on UI or features. Use repository interfaces from ports/.",
            },
            {
              group: ["@/infrastructure/database/*", "@/infrastructure/messaging/*"],
              message:
                "❌ Use cases CANNOT import infrastructure implementations. Use interfaces from core/ports/.",
            },
          ],
        },
      ],
    },
  },
  {
    // Infrastructure Layer - Can depend on core, but core cannot depend on it
    files: ["src/infrastructure/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/components/*", "@/web/*", "@/features/*"],
              message:
                "❌ Infrastructure CANNOT depend on UI or features. Keep infrastructure isolated.",
            },
          ],
        },
      ],
    },
  },
  {
    // API Routes - Should use use cases, not direct domain manipulation
    files: ["src/app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/core/domain/*"],
              message:
                "⚠️ API routes should use USE CASES, not domain entities directly. Import from core/use-cases/.",
            },
          ],
        },
      ],
    },
  },
  {
    // Features - Should not import from other features directly
    files: ["src/features/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@/features/*"],
              message:
                "⚠️ Features should be isolated. Consider using shared/ or core/ for cross-feature dependencies.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
