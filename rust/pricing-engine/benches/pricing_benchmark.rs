//! Pricing Engine Benchmarks
//! 
//! Performance benchmarks comparing Rust pricing calculations
//! Run with: cargo bench

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use pricing_engine::{calculate_price, calculate_price_batch, PricingOptions, SeasonRates, SeasonRange, BatchPricingInput, BatchPricingRequest};

fn criterion_benchmark(c: &mut Criterion) {
    // Basic pricing benchmark
    c.bench_function("pricing_basic_7_nights", |b| {
        b.iter(|| {
            calculate_price(
                black_box(100.0),
                black_box(String::from("2026-07-01")),
                black_box(String::from("2026-07-08")),
                black_box(None),
            )
        })
    });

    // Pricing with seasonal rates
    c.bench_function("pricing_with_seasonal_rates", |b| {
        let options = PricingOptions {
            competitor_avg: None,
            season_rates: Some(SeasonRates {
                high: Some(vec![SeasonRange {
                    from: String::from("2026-07-01"),
                    to: String::from("2026-08-31"),
                    rate: 150.0,
                }]),
                mid: Some(vec![SeasonRange {
                    from: String::from("2026-05-01"),
                    to: String::from("2026-06-30"),
                    rate: 120.0,
                }]),
                low: Some(vec![SeasonRange {
                    from: String::from("2026-01-01"),
                    to: String::from("2026-04-30"),
                    rate: 80.0,
                }]),
            }),
        };

        b.iter(|| {
            calculate_price(
                black_box(100.0),
                black_box(String::from("2026-07-15")),
                black_box(String::from("2026-07-22")),
                black_box(Some(options.clone())),
            )
        })
    });

    // Pricing with all options
    c.bench_function("pricing_with_all_options", |b| {
        let options = PricingOptions {
            competitor_avg: Some(90.0),
            season_rates: Some(SeasonRates {
                high: Some(vec![SeasonRange {
                    from: "2026-07-01".to_string(),
                    to: "2026-08-31".to_string(),
                    rate: 150.0,
                }]),
                mid: None,
                low: None,
            }),
        };

        b.iter(|| {
            calculate_price(
                black_box(100.0),
                black_box(String::from("2026-07-01")),
                black_box(String::from("2026-07-08")),
                black_box(Some(options.clone())),
            )
        })
    });

    // Batch processing benchmarks
    for batch_size in [10, 100, 1000].iter() {
        c.bench_with_input(
            BenchmarkId::new("pricing_batch", batch_size),
            batch_size,
            |b, &size| {
                let requests: Vec<BatchPricingRequest> = (0..size)
                    .map(|i| BatchPricingRequest {
                        id: format!("req_{}", i),
                        base_rate: 100.0 + (i as f64 * 0.1),
                        check_in: format!("2026-07-{:02}", (i % 28) + 1),
                        check_out: format!("2026-07-{:02}", (i % 28) + 8),
                        options: None,
                    })
                    .collect();

                let input = BatchPricingInput { requests };

                b.iter(|| {
                    calculate_price_batch(input.clone())
                })
            },
        );
    }

    // Weekend detection benchmark
    c.bench_function("pricing_weekend_nights", |b| {
        b.iter(|| {
            calculate_price(
                black_box(100.0),
                black_box(String::from("2026-07-03")), // Friday
                black_box(String::from("2026-07-10")), // Friday (includes 2 weekends)
                black_box(None),
            )
        })
    });

    // Last-minute booking benchmark
    c.bench_function("pricing_last_minute", |b| {
        b.iter(|| {
            calculate_price(
                black_box(100.0),
                black_box(String::from("2026-03-07")), // 3 days from now
                black_box(String::from("2026-03-10")),
                black_box(None),
            )
        })
    });
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
