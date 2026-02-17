#!/usr/bin/env bash
set -e
echo "Running lint..."
npm run lint
echo "Running tests..."
npm run test
echo "Pre-commit checks passed."
