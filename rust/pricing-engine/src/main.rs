use std::io::{self, Read, Write};
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use chrono::{NaiveDate, Datelike};

// ============================================================================
// Data Structures (same as library)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SeasonRange {
    from: String,
    to: String,
    rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SeasonRates {
    high: Option<Vec<SeasonRange>>,
    mid: Option<Vec<SeasonRange>>,
    low: Option<Vec<SeasonRange>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PricingOptions {
    competitor_avg: Option<f64>,
    season_rates: Option<SeasonRates>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Adjustment {
    rule: String,
    amount: f64,
    percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PricingResult {
    base_total: f64,
    adjustments: Vec<Adjustment>,
    final_price: f64,
    nights: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PricingInput {
    base_rate: f64,
    check_in: String,
    check_out: String,
    options: Option<PricingOptions>,
}

// ============================================================================
// Main - Read from stdin, write to stdout
// ============================================================================

fn main() {
    let mut input_str = String::new();
    io::stdin().read_to_string(&mut input_str).expect("Failed to read stdin");
    
    let input: PricingInput = match serde_json::from_str(&input_str) {
        Ok(input) => input,
        Err(e) => {
            eprintln!("Failed to parse input: {}", e);
            std::process::exit(1);
        }
    };
    
    let result = calculate_price(
        input.base_rate,
        input.check_in,
        input.check_out,
        input.options,
    );
    
    let output = serde_json::to_string(&result).expect("Failed to serialize result");
    io::stdout().write_all(output.as_bytes()).expect("Failed to write stdout");
}

// ============================================================================
// Pricing Logic (same as library)
// ============================================================================

fn calculate_price(
    base_rate: f64,
    check_in: String,
    check_out: String,
    options: Option<PricingOptions>,
) -> PricingResult {
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
    let los_discounts = [(7, 0.25), (5, 0.20), (3, 0.15)];
    if let Some((nights, discount)) = los_discounts.iter()
        .filter(|(threshold, _)| nights >= *threshold)
        .max_by_key(|(threshold, _)| threshold)
    {
        let discount_amount = running_total * Decimal::from_f64_retain(*discount).unwrap_or(Decimal::ZERO);
        running_total = running_total - discount_amount;
        adjustments.push(Adjustment {
            rule: "length_of_stay".to_string(),
            amount: -(discount_amount.to_f64().unwrap_or(0.0)),
            percent: Some(discount * 100.0),
        });
    }
    
    // Apply early_bird or last_minute (mutually exclusive)
    let today = chrono::Local::now().date_naive();
    let days_until_checkin = (check_in_date - today).num_days() as i32;
    
    if days_until_checkin >= 60 {
        let discount_amount = running_total * Decimal::from_f64_retain(0.10).unwrap_or(Decimal::ZERO);
        running_total = running_total - discount_amount;
        adjustments.push(Adjustment {
            rule: "early_bird".to_string(),
            amount: -(discount_amount.to_f64().unwrap_or(0.0)),
            percent: Some(10.0),
        });
    } else if days_until_checkin <= 3 && days_until_checkin >= 0 {
        let discount_amount = running_total * Decimal::from_f64_retain(0.20).unwrap_or(Decimal::ZERO);
        running_total = running_total - discount_amount;
        adjustments.push(Adjustment {
            rule: "last_minute".to_string(),
            amount: -(discount_amount.to_f64().unwrap_or(0.0)),
            percent: Some(20.0),
        });
    }
    
    // Apply weekend premium
    let weekend_nights = count_weekend_nights(&check_in_date, &check_out_date);
    if weekend_nights > 0 {
        let premium_amount = running_total * Decimal::from_f64_retain(0.15).unwrap_or(Decimal::ZERO);
        running_total = running_total + premium_amount;
        adjustments.push(Adjustment {
            rule: "weekend_premium".to_string(),
            amount: premium_amount.to_f64().unwrap_or(0.0),
            percent: Some(15.0),
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
