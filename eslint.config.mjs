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
    "src/lib/alert-thresholds-implementation.ts",
    "src/lib/api-partnership-production-readiness.ts",
    "src/lib/ai-agent-production-best-practices.ts",
    "src/lib/beta-launch-production-readiness.ts",
    "src/lib/kpis-implementation.ts",
    "src/lib/payment-system-production-readiness.ts",
    "src/lib/production-testing-readiness.ts",
    "src/lib/realistic-production-timeline.ts",
    "src/lib/revised-production-readiness.ts",
    "src/lib/sentry.ts",
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
]);

export default eslintConfig;
