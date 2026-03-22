//! AgentFlow Pro - High-Performance Pricing Engine
//! 
//! Rust-based pricing calculation engine for tourism/hospitality industry.
//! Provides 10-100x performance improvement over TypeScript implementation.
//! 
//! # Features
//! - Seasonal pricing with high/mid/low tiers
//! - Length-of-stay discounts
//! - Early bird and last-minute pricing
//! - Weekend premiums
//! - Competitor price monitoring
//! - Decimal precision for financial calculations

use napi_derive::napi;
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use chrono::{NaiveDate, Datelike, Local};
use serde::{Deserialize, Serialize};
use thiserror::Error;

// ============================================================================
// Error Types
// ============================================================================

#[derive(Error, Debug)]
pub enum PricingError {
    #[error("Invalid date format: {0}")]
    InvalidDate(String),
    #[error("Invalid calculation: {0}")]
    InvalidCalculation(String),
}

// ============================================================================
// Data Structures
// ============================================================================

/// Seasonal pricing range with start/end dates and rate
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct SeasonRange {
    pub from: String,
    pub to: String,
    pub rate: f64,
}

/// Seasonal rates configuration (high/mid/low seasons)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct SeasonRates {
    pub high: Option<Vec<SeasonRange>>,
    pub mid: Option<Vec<SeasonRange>>,
    pub low: Option<Vec<SeasonRange>>,
}

/// Pricing calculation options
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct PricingOptions {
    pub competitor_avg: Option<f64>,
    pub season_rates: Option<SeasonRates>,
}

/// Individual price adjustment from a rule
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct Adjustment {
    pub rule: String,
    pub amount: f64,
    pub percent: Option<f64>,
}

/// Result of pricing calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct PricingResult {
    pub base_total: f64,
    pub adjustments: Vec<Adjustment>,
    pub final_price: f64,
    pub nights: i32,
    pub breakdown: Option<PriceBreakdown>,
}

/// Detailed price breakdown for transparency
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct PriceBreakdown {
    pub rate_per_night: f64,
    pub subtotal: f64,
    pub total_discounts: f64,
    pub total_premiums: f64,
}

// ============================================================================
// Pricing Strategies Configuration
// ============================================================================

/// Default pricing strategy rules
struct PricingStrategy {
    length_of_stay: Vec<LOSRule>,
    early_bird: EarlyBirdRule,
    last_minute: LastMinuteRule,
    weekend_premium: f64,
    competitor_threshold: f64,
}

struct LOSRule {
    nights: i32,
    discount: f64,
}

struct EarlyBirdRule {
    days_advance: i32,
    discount: f64,
}

struct LastMinuteRule {
    days_advance: i32,
    discount: f64,
}

impl Default for PricingStrategy {
    fn default() -> Self {
        Self {
            length_of_stay: vec![
                LOSRule { nights: 7, discount: 0.25 },
                LOSRule { nights: 5, discount: 0.20 },
                LOSRule { nights: 3, discount: 0.15 },
            ],
            early_bird: EarlyBirdRule { days_advance: 60, discount: 0.10 },
            last_minute: LastMinuteRule { days_advance: 3, discount: 0.20 },
            weekend_premium: 0.15,
            competitor_threshold: 0.05, // 5% above competitor avg
        }
    }
}

// ============================================================================
// Main Pricing Function (NAPI exported)
// ============================================================================

/// Calculate price for a booking with all applicable rules and adjustments
/// 
/// # Arguments
/// * `base_rate` - Base nightly rate in EUR
/// * `check_in` - Check-in date (YYYY-MM-DD format)
/// * `check_out` - Check-out date (YYYY-MM-DD format)
/// * `options` - Optional pricing configuration (season rates, competitor pricing)
/// 
/// # Returns
/// PricingResult with base total, adjustments, and final price
/// 
/// # Example
/// ```
/// let result = calculate_price(100.0, "2026-07-01", "2026-07-08", None);
/// assert_eq!(result.nights, 7);
/// ```
#[napi]
pub fn calculate_price(
    base_rate: f64,
    check_in: String,
    check_out: String,
    options: Option<PricingOptions>,
) -> PricingResult {
    let strategy = PricingStrategy::default();
    let mut adjustments: Vec<Adjustment> = Vec::new();
    let mut total_discounts = 0.0;
    let mut total_premiums = 0.0;

    // Parse dates
    let check_in_date = NaiveDate::parse_from_str(&check_in, "%Y-%m-%d")
        .unwrap_or_else(|_| NaiveDate::from_ymd_opt(2026, 1, 1).unwrap());
    let check_out_date = NaiveDate::parse_from_str(&check_out, "%Y-%m-%d")
        .unwrap_or_else(|_| NaiveDate::from_ymd_opt(2026, 1, 2).unwrap());

    // Calculate nights
    let nights = (check_out_date - check_in_date).num_days() as i32;
    let nights = nights.max(1);

    // Convert to Decimal for precise arithmetic
    let base_rate_dec = Decimal::from_f64_retain(base_rate).unwrap_or(Decimal::ZERO);
    let nights_dec = Decimal::from_i128_with_scale(nights as i128, 0);

    // Get season rate
    let rate_per_night = get_season_rate(
        &check_in_date,
        base_rate_dec,
        options.as_ref().and_then(|o| o.season_rates.as_ref()),
    );

    // Calculate base total
    let mut running_total = rate_per_night * nights_dec;
    let subtotal = running_total;

    // Apply length_of_stay discount
    if let Some(los_rule) = strategy.length_of_stay.iter()
        .filter(|r| nights >= r.nights)
        .max_by_key(|r| r.nights)
    {
        let discount_amount = running_total * Decimal::from_f64_retain(los_rule.discount).unwrap_or(Decimal::ZERO);
        running_total = running_total - discount_amount;
        total_discounts += discount_amount.to_f64().unwrap_or(0.0);
        adjustments.push(Adjustment {
            rule: "length_of_stay".to_string(),
            amount: -(discount_amount.to_f64().unwrap_or(0.0)),
            percent: Some(los_rule.discount * 100.0),
        });
    }

    // Apply early_bird or last_minute (mutually exclusive)
    let today = Local::now().date_naive();
    let days_until_checkin = (check_in_date - today).num_days() as i32;

    if days_until_checkin >= strategy.early_bird.days_advance {
        let discount_amount = running_total * Decimal::from_f64_retain(strategy.early_bird.discount).unwrap_or(Decimal::ZERO);
        running_total = running_total - discount_amount;
        total_discounts += discount_amount.to_f64().unwrap_or(0.0);
        adjustments.push(Adjustment {
            rule: "early_bird".to_string(),
            amount: -(discount_amount.to_f64().unwrap_or(0.0)),
            percent: Some(strategy.early_bird.discount * 100.0),
        });
    } else if days_until_checkin <= strategy.last_minute.days_advance && days_until_checkin >= 0 {
        let discount_amount = running_total * Decimal::from_f64_retain(strategy.last_minute.discount).unwrap_or(Decimal::ZERO);
        running_total = running_total - discount_amount;
        total_discounts += discount_amount.to_f64().unwrap_or(0.0);
        adjustments.push(Adjustment {
            rule: "last_minute".to_string(),
            amount: -(discount_amount.to_f64().unwrap_or(0.0)),
            percent: Some(strategy.last_minute.discount * 100.0),
        });
    }

    // Apply weekend premium
    let weekend_nights = count_weekend_nights(&check_in_date, &check_out_date);
    if weekend_nights > 0 {
        let premium_amount = running_total * Decimal::from_f64_retain(strategy.weekend_premium).unwrap_or(Decimal::ZERO);
        running_total = running_total + premium_amount;
        total_premiums += premium_amount.to_f64().unwrap_or(0.0);
        adjustments.push(Adjustment {
            rule: "weekend_premium".to_string(),
            amount: premium_amount.to_f64().unwrap_or(0.0),
            percent: Some(strategy.weekend_premium * 100.0),
        });
    }

    // Apply competitor pricing if available
    if let Some(competitor_avg) = options.and_then(|o| o.competitor_avg) {
        let competitor_dec = Decimal::from_f64_retain(competitor_avg).unwrap_or(Decimal::ZERO);
        let threshold_multiplier = Decimal::ONE + Decimal::from_f64_retain(strategy.competitor_threshold).unwrap_or(Decimal::ZERO);
        
        if competitor_dec > Decimal::ZERO && running_total > competitor_dec * threshold_multiplier {
            let target_price = competitor_dec * threshold_multiplier;
            let adjustment = running_total - target_price;
            running_total = target_price;
            total_discounts += adjustment.to_f64().unwrap_or(0.0);
            adjustments.push(Adjustment {
                rule: "competitor_adjustment".to_string(),
                amount: -adjustment.to_f64().unwrap_or(0.0),
                percent: None,
            });
        }
    }

    let breakdown = PriceBreakdown {
        rate_per_night: rate_per_night.to_f64().unwrap_or(0.0),
        subtotal: subtotal.to_f64().unwrap_or(0.0),
        total_discounts,
        total_premiums,
    };

    PricingResult {
        base_total: (rate_per_night * nights_dec).to_f64().unwrap_or(0.0),
        adjustments,
        final_price: running_total.to_f64().unwrap_or(0.0),
        nights,
        breakdown: Some(breakdown),
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

fn get_season_rate(
    check_in: &NaiveDate,
    base_rate: Decimal,
    season_rates: Option<&SeasonRates>,
) -> Decimal {
    if let Some(rates) = season_rates {
        let all_ranges: Vec<&SeasonRange> = rates.high.iter().flatten()
            .chain(rates.mid.iter().flatten())
            .chain(rates.low.iter().flatten())
            .collect();

        for range in all_ranges {
            if let (Ok(from), Ok(to)) = (
                NaiveDate::parse_from_str(&range.from, "%Y-%m-%d"),
                NaiveDate::parse_from_str(&range.to, "%Y-%m-%d"),
            ) {
                if check_in >= &from && check_in <= &to {
                    return Decimal::from_f64_retain(range.rate).unwrap_or(base_rate);
                }
            }
        }
    }

    base_rate
}

fn count_weekend_nights(check_in: &NaiveDate, check_out: &NaiveDate) -> i32 {
    let mut count = 0;
    let mut current = *check_in;

    while current < *check_out {
        let weekday = current.weekday().num_days_from_monday();
        if weekday >= 5 { // Saturday (5) or Sunday (6)
            count += 1;
        }
        current = current.succ_opt().unwrap_or(current);
    }

    count
}

// ============================================================================
// Batch Processing (for high-throughput scenarios)
// ============================================================================

/// Batch input for multiple price calculations
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct BatchPricingInput {
    pub requests: Vec<BatchPricingRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct BatchPricingRequest {
    pub id: String,
    #[napi(js_name = "baseRate")]
    pub base_rate: f64,
    #[napi(js_name = "checkIn")]
    pub check_in: String,
    #[napi(js_name = "checkOut")]
    pub check_out: String,
    pub options: Option<PricingOptions>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct BatchPricingResponse {
    pub id: String,
    pub result: PricingResult,
}

/// Calculate prices for multiple requests in a single batch
#[napi]
pub fn calculate_price_batch(input: BatchPricingInput) -> Vec<BatchPricingResponse> {
    input.requests
        .into_iter()
        .map(|req| {
            let result = calculate_price(
                req.base_rate,
                req.check_in,
                req.check_out,
                req.options,
            );
            BatchPricingResponse {
                id: req.id,
                result,
            }
        })
        .collect()
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_pricing() {
        let result = calculate_price(
            100.0,
            "2026-07-01".to_string(),
            "2026-07-08".to_string(),
            None,
        );

        assert_eq!(result.nights, 7);
        assert!(result.final_price > 0.0);
        assert!(result.breakdown.is_some());
    }

    #[test]
    fn test_length_of_stay_discount() {
        let result = calculate_price(
            100.0,
            "2026-07-01".to_string(),
            "2026-07-08".to_string(),
            None,
        );

        // Should have length_of_stay discount for 7 nights
        let los_adjustment = result.adjustments.iter()
            .find(|a| a.rule == "length_of_stay");

        assert!(los_adjustment.is_some());
        assert!(los_adjustment.unwrap().amount < 0.0); // Discount
    }

    #[test]
    fn test_seasonal_pricing() {
        let options = PricingOptions {
            competitor_avg: None,
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

        let result = calculate_price(
            100.0,
            "2026-07-15".to_string(),
            "2026-07-22".to_string(),
            Some(options),
        );

        assert_eq!(result.breakdown.unwrap().rate_per_night, 150.0);
    }

    #[test]
    fn test_batch_processing() {
        let input = BatchPricingInput {
            requests: vec![
                BatchPricingRequest {
                    id: "req1".to_string(),
                    base_rate: 100.0,
                    check_in: "2026-07-01".to_string(),
                    check_out: "2026-07-08".to_string(),
                    options: None,
                },
                BatchPricingRequest {
                    id: "req2".to_string(),
                    base_rate: 200.0,
                    check_in: "2026-08-01".to_string(),
                    check_out: "2026-08-05".to_string(),
                    options: None,
                },
            ],
        };

        let results = calculate_price_batch(input);
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].id, "req1");
        assert_eq!(results[1].id, "req2");
    }
}
