/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@/lib/user-keys$": "<rootDir>/tests/__mocks__/user-keys.ts",
    "^@/config/env$": "<rootDir>/tests/__mocks__/config-env.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    ".*prisma/generated/prisma/client.*": "<rootDir>/tests/__mocks__/prisma-client.ts",
  },
  transform: { "^.+\\.tsx?$": "ts-jest" },
};
