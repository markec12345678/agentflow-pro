// STUB: Rust workflow executor not available in this environment
// This file exists to prevent build errors while allowing TypeScript fallback
// On Vercel, TypeScript fallback is used instead

function createStubError() {
  return new Error(
    'Rust workflow executor not available. Using TypeScript fallback instead.'
  );
}

module.exports = {
  executeWorkflow: () => { throw createStubError(); },
  validateWorkflow: () => { throw createStubError(); },
  getExecutionPlan: () => { throw createStubError(); },
  __STUB__: true
};
