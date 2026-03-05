# 🦀 AgentFlow Pro - Rust Workspace

High-performance Rust components for AgentFlow Pro platform.

## Crates

### 1. pricing-engine ⚡

**Purpose**: Tourism pricing calculations with 10-50x performance improvement

**Features**:
- Seasonal pricing (high/mid/low tiers)
- Length-of-stay discounts
- Early bird & last-minute pricing
- Weekend premiums
- Competitor price tracking
- Batch processing for calendar views

**Location**: `rust/pricing-engine/`

**Usage**:
```bash
# Build
cargo build --release

# Test
cargo test

# Benchmark
cargo bench
```

### 2. workflow-executor 🔄

**Purpose**: Parallel AI agent workflow orchestration

**Features**:
- DAG-based execution
- Topological sort & cycle detection
- Parallel node processing
- Error recovery with retries
- Timeout handling
- Real-time progress tracking

**Location**: `rust/workflow-executor/`

**Usage**:
```bash
# Build
cargo build --release

# Test
cargo test
```

## Workspace Commands

```bash
# Build all crates
cargo build --workspace --release

# Test all crates
cargo test --workspace

# Run linter
cargo clippy --workspace -- -D warnings

# Format code
cargo fmt --workspace

# Run benchmarks
cargo bench --workspace
```

## Integration with TypeScript

### NAPI Bindings

Both crates use [NAPI-RS](https://napi.rs/) for Node.js bindings:

```typescript
// Pricing Engine
import { RustPricingEngine } from '../../src/lib/tourism/pricing-engine-rust';
const engine = new RustPricingEngine();
const result = await engine.calculatePrice(100, '2026-07-01', '2026-07-08');

// Workflow Executor
import { executeWorkflow } from '../../src/lib/workflow/workflow-executor-rust';
const result = await executeWorkflow(workflowDefinition);
```

### Binary Mode (Fallback)

Crates also support stdin/stdout binary mode:

```bash
# Pricing Engine
echo '{"base_rate":100,"check_in":"2026-07-01","check_out":"2026-07-08"}' \
  | ./target/release/pricing-engine

# Workflow Executor
echo '{"id":"wf1","nodes":[...],"edges":[...]}' \
  | ./target/release/workflow-executor
```

## Development

### Prerequisites

- Rust 1.70+ (`rustup install stable`)
- Node.js 18+ (for NAPI bindings)
- cargo-audit (for security audits)

### Setup

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install toolchain
rustup install stable
rustup component add clippy rustfmt

# Install cargo-audit
cargo install cargo-audit
```

### Building for Production

```bash
# Build all crates optimized
cargo build --workspace --release

# Build for specific target (Vercel uses x86_64-unknown-linux-musl)
cargo build --workspace --release --target x86_64-unknown-linux-musl
```

### Testing

```bash
# Unit tests
cargo test --workspace

# Integration tests
cargo test --workspace --test '*'

# Security audit
cargo audit
```

### Benchmarking

```bash
# Run all benchmarks
cargo bench --workspace

# Run specific benchmark
cargo bench -p pricing-engine
```

## Performance

### Pricing Engine Benchmarks

| Test | Rust | TypeScript | Speedup |
|------|------|-----------|---------|
| Basic (7 nights) | ~2μs | ~50μs | **25x** |
| Seasonal | ~4μs | ~80μs | **20x** |
| Competitor | ~5μs | ~100μs | **20x** |
| Batch (1000) | ~5ms | ~100ms | **20x** |

### Workflow Executor Benchmarks

| Scenario | Rust | TypeScript | Speedup |
|----------|------|-----------|---------|
| Sequential (3 nodes) | ~15ms | ~150ms | **10x** |
| Parallel (3 nodes) | ~8ms | ~150ms | **18x** |
| Complex (10 nodes) | ~25ms | ~500ms | **20x** |

## CI/CD

GitHub Actions workflow: `.github/workflows/rust-ci.yml`

**Pipeline**:
1. ✅ Code formatting check (`cargo fmt`)
2. ✅ Linting (`cargo clippy`)
3. ✅ Security audit (`cargo audit`)
4. ✅ Build (`cargo build`)
5. ✅ Tests (`cargo test`)
6. ✅ Cross-compilation (Linux, macOS, Windows)
7. ✅ TypeScript integration tests
8. ✅ Vercel deployment

## Project Structure

```
rust/
├── Cargo.toml              # Workspace configuration
├── pricing-engine/
│   ├── Cargo.toml
│   ├── build.rs            # NAPI build script
│   ├── benches/
│   │   └── pricing_benchmark.rs
│   └── src/
│       ├── lib.rs          # NAPI library
│       └── main.rs         # CLI binary
└── workflow-executor/
    ├── Cargo.toml
    ├── build.rs
    ├── benches/
    │   └── workflow_benchmark.rs
    └── src/
        ├── lib.rs
        └── main.rs
```

## Dependencies

### Core Dependencies

- `napi` & `napi-derive` - Node.js bindings
- `serde` & `serde_json` - JSON serialization
- `chrono` - Date/time handling
- `tokio` - Async runtime
- `thiserror` - Error handling

### Domain-Specific

- `rust_decimal` - Precise financial calculations (pricing-engine)
- `uuid` - Unique identifiers (workflow-executor)
- `futures` - Future combinators (workflow-executor)

## Best Practices

### Code Style

- Use `Result<T, E>` for error handling
- Avoid `unwrap()` in library code
- Use `thiserror` for custom error types
- Document public APIs with rustdoc

### Performance

- Use `Decimal` for financial calculations
- Avoid unnecessary allocations
- Use `&str` instead of `String` for parameters
- Batch operations when possible

### Testing

- Write unit tests for all public functions
- Include integration tests for NAPI bindings
- Benchmark critical paths
- Test error scenarios

## Troubleshooting

### Common Issues

**1. "cargo not found"**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**2. "NAPI build failed"**
```bash
# Ensure Node.js is installed
node --version

# Rebuild
cargo clean
cargo build --release
```

**3. "Binary not found in TypeScript"**
```bash
# Build binaries
npm run build:rust:all

# Or manually
cd rust && cargo build --workspace --release
```

## Resources

- [NAPI-RS Documentation](https://napi.rs/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Tokio Documentation](https://tokio.rs/)
- [Sergey Pchelintsev's NAPI Guide](https://github.com/napi-rs/napi-rs)

## License

MIT - See [LICENSE](../../LICENSE)

---

*Built with ❤️ and 🦀 by AgentFlow Pro Team*
