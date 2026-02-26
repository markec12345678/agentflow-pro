import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@next/next/no-img-element": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      "@typescript-eslint/no-unsafe-declaration-merging": "warn",
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
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "*.config.js",
      "next-env.d.ts",
      "prisma/seed.js",
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
    ],
  },
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx", "src/page-builder/**/*.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_req" }],
    },
  },
];

export default eslintConfig;
