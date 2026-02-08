/**
 * Seed legal documents into the vector database
 * Run with: npx tsx scripts/seed-legal-docs.ts
 */

import { storeLegalDocument } from '../lib/rag/vectorStore';
import { chunkLegalDocument } from '../lib/rag/chunking';

const YC_SAFE_TEMPLATE = `# YC Post-Money SAFE Template

## 1. Events

### 1.1 Equity Financing
If there is an Equity Financing before the expiration or termination of this instrument, the Company will automatically issue to the Investor a number of shares of Safe Preferred Stock equal to the Purchase Amount divided by the Conversion Price.

### 1.2 Liquidity Event
If there is a Liquidity Event before the expiration or termination of this instrument, the Investor will automatically receive (i) a cash payment equal to the Purchase Amount or (ii) a number of shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price.

### 1.3 Dissolution Event
If there is a Dissolution Event before this instrument expires or terminates, the Company will pay an amount equal to the Purchase Amount to the Investor.

## 2. Valuation Cap

The Valuation Cap for this SAFE is $10,000,000. This means the Investor's shares will convert at the lower of the Valuation Cap price or the price per share in the Equity Financing.

## 3. Discount Rate

The Discount Rate is 20%. This means the Investor receives shares at a 20% discount to the price per share in the Equity Financing.

## 4. Pro Rata Rights

The Investor has the right to participate in subsequent financing rounds on a pro rata basis, subject to a minimum investment threshold of $100,000.

## 5. Most Favored Nation

If the Company issues any Subsequent Convertible Securities with terms more favorable to the holder thereof than the terms of this SAFE, the Company shall promptly notify the Investor and this SAFE shall be automatically amended to reflect such more favorable terms.

## 6. Conversion Mechanics

Upon conversion, the Investor shall receive shares of Safe Preferred Stock with the same rights and preferences as the shares issued in the Equity Financing, except for liquidation preference and conversion rights.

## 7. Representations and Warranties

The Company represents that it is duly organized and validly existing under the laws of Delaware. The Company has full power and authority to execute this SAFE.

## 8. Governing Law

This SAFE shall be governed by the laws of the State of Delaware.`;

const MARKET_DATA_2024 = `# Startup Financing Market Data 2024

## Pre-Seed SAFE Market Benchmarks (Q3-Q4 2024)

### Valuation Caps
- Median: $10,000,000
- 25th percentile: $6,000,000
- 75th percentile: $15,000,000
- YC-backed companies: $12,000,000 - $15,000,000

### Discount Rates
- Standard: 20%
- Range: 15% - 25%
- Most common: 20%

### Investment Amounts
- Typical range: $100,000 - $2,000,000
- Median: $500,000

## Series A Term Sheet Benchmarks

### Liquidation Preference
- Standard: 1x non-participating preferred (75% of deals)
- Participating preferred: Less common, considered investor-aggressive

### Board Composition
- Standard: Founder-controlled (2-1 or 3-2 with founder majority)
- Investor-controlled at Series A: Non-standard, aggressive

### Anti-Dilution
- Standard: Broad-based weighted average (90%+ of deals)
- Full ratchet: Rare, considered punitive

### Protective Provisions
- Standard: Cover fundraising, M&A, charter changes
- Extended provisions (hiring, operations): Non-standard, restrictive

## Market Trends 2024

1. Valuation caps trending upward for pre-seed
2. Non-participating preferred remains standard
3. Weighted average anti-dilution is universal
4. Delaware jurisdiction standard (80%+ of deals)`;

async function main() {
  console.log('Seeding legal documents...');

  try {
    // Seed YC SAFE Template
    const safeChunks = chunkLegalDocument(YC_SAFE_TEMPLATE, {
      docType: 'safe_template',
    });
    
    await storeLegalDocument(
      'YC Post-Money SAFE Template',
      YC_SAFE_TEMPLATE,
      'safe_template',
      { source: 'Y Combinator', version: '2024' },
      safeChunks
    );
    console.log('Seeded YC SAFE Template');

    // Seed Market Data
    const marketChunks = chunkLegalDocument(MARKET_DATA_2024, {
      docType: 'market_data',
    });
    
    await storeLegalDocument(
      'Startup Financing Market Data 2024',
      MARKET_DATA_2024,
      'market_data',
      { source: 'Market Research', year: 2024, quarter: 'Q3-Q4' },
      marketChunks
    );
    console.log('Seeded Market Data 2024');

    console.log('All legal documents seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();
