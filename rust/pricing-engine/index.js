// STUB: Rust pricing engine not available in this environment
// This file exists to prevent build errors while allowing TypeScript fallback
// On Vercel, the TypeScript implementation in pricing-engine.ts is used instead

function createStubError() {
  return new Error(
    'Rust pricing engine not available. Using TypeScript fallback instead.'
  );
}

module.exports = {
  calculatePrice: () => { throw createStubError(); },
  calculatePriceBatch: () => { throw createStubError(); },
  __STUB__: true
};
