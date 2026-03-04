use napi_derive::napi;
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use chrono::{NaiveDate, Datelike};
use serde::{Deserialize, Serialize};

// ============================================================================
// Data Structures
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct SeasonRange {
    pub from: String,
    pub to: String,
    pub rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct SeasonRates {
    pub high: Option<Vec<SeasonRange>>,
    pub mid: Option<Vec<SeasonRange>>,
    pub low: Option<Vec<SeasonRange>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct PricingOptions {
    pub competitor_avg: Option<f64>,
    pub season_rates: Option<SeasonRates>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct Adjustment {
    pub rule: String,
    pub amount: f64,
    pub percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct PricingResult {
    pub base_total: f64,
    pub adjustments: Vec<Adjustment>,
    pub final_price: f64,
    pub nights: i32,
}

// ============================================================================
// Pricing Strategies Configuration
// ============================================================================

struct PricingStrategy {
    length_of_stay: Vec<LOSRule>,
    early_bird: EarlyBirdRule,
    last_minute: LastMinuteRule,
    weekend_premium: f64,
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
        }
    }
}

// ============================================================================
// Main Pricing Function
// ============================================================================

#[napi]
pub fn calculate_price(
    base_rate: f64,
    check_in: String,
    check_out: String,
    options: Option<PricingOptions>,
) -> PricingResult {
    let strategy = PricingStrategy::default();
    let mut adjustments: Vec<Adjustment> = Vec::new();
    
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
    
    // Apply length_of_stay discount
    if let Some(los_rule) = strategy.length_of_stay.iter()
        .filter(|r| nights >= r.nights)
        .max_by_key(|r| r.nights)
    {
        let discount_amount = running_total * Decimal::from_f64_retain(los_rule.discount).unwrap_or(Decimal::ZERO);
        running_total = running_total - discount_amount;
        adjustments.push(Adjustment {
            rule: "length_of_stay".to_string(),
            amount: -(discount_amount.to_f64().unwrap_or(0.0)),
            percent: Some(los_rule.discount * 100.0),
        });
    }
    
    // Apply early_bird or last_minute (mutually exclusive)
    let today = chrono::Local::now().date_naive();
    let days_until_checkin = (check_in_date - today).num_days() as i32;
    
    if days_until_checkin >= strategy.early_bird.days_advance {
        let discount_amount = running_total * Decimal::from_f64_retain(strategy.early_bird.discount).unwrap_or(Decimal::ZERO);
        running_total = running_total - discount_amount;
        adjustments.push(Adjustment {
            rule: "early_bird".to_string(),
            amount: -(discount_amount.to_f64().unwrap_or(0.0)),
            percent: Some(strategy.early_bird.discount * 100.0),
        });
    } else if days_until_checkin <= strategy.last_minute.days_advance && days_until_checkin >= 0 {
        let discount_amount = running_total * Decimal::from_f64_retain(strategy.last_minute.discount).unwrap_or(Decimal::ZERO);
        running_total = running_total - discount_amount;
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
        adjustments.push(Adjustment {
            rule: "weekend_premium".to_string(),
            amount: premium_amount.to_f64().unwrap_or(0.0),
            percent: Some(strategy.weekend_premium * 100.0),
        });
    }
    
    // Apply competitor pricing if available
    if let Some(competitor_avg) = options.and_then(|o| o.competitor_avg) {
        let competitor_dec = Decimal::from_f64_retain(competitor_avg).unwrap_or(Decimal::ZERO);
        if competitor_dec > Decimal::ZERO && running_total > competitor_dec * Decimal::from_f64_retain(1.05).unwrap_or(Decimal::ZERO) {
            let adjustment = running_total - (competitor_dec * Decimal::from_f64_retain(1.05).unwrap_or(Decimal::ZERO));
            running_total = competitor_dec * Decimal::from_f64_retain(1.05).unwrap_or(Decimal::ZERO);
            adjustments.push(Adjustment {
                rule: "competitor_adjustment".to_string(),
                amount: -adjustment.to_f64().unwrap_or(0.0),
                percent: None,
            });
        }
    }
    
    PricingResult {
        base_total: (rate_per_night * nights_dec).to_f64().unwrap_or(0.0),
        adjustments,
        final_price: running_total.to_f64().unwrap_or(0.0),
        nights,
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
}
