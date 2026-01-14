import { Transaction } from '../types';
import { normalizeString, jaroWinkler } from './stringUtils';
import { Decimal } from 'decimal.js';

// Weights defined in requirements
const WEIGHT_AMOUNT = 0.4;
const WEIGHT_TIME = 0.3;
const WEIGHT_MERCHANT = 0.2;
const WEIGHT_SUBSTRING = 0.1;

const SIGMA_HOURS = 12;

interface MatchingResult {
  transaction: Transaction | null;
  score: number;
  details: string;
}

export interface ReceiptCandidate {
  amount: number;
  date: Date;
  merchantName: string;
  currency?: string; 
  categoryId?: string; // Added field for category
}

/**
 * Intelligent Transaction Matching Algorithm
 * 1. 40% Amount: Gradient score (1.0 for exact, decaying for small differences)
 * 2. 30% Time: Gaussian decay (peak match at 0h diff, standard deviation 12h)
 * 3. 20% Merchant: Jaro-Winkler similarity on normalized names
 * 4. 10% Substring: Bonus if one name strictly contains the other
 */
export function findBestMatch(candidate: ReceiptCandidate, transactions: Transaction[]): MatchingResult {
  let bestMatch: Transaction | null = null;
  let bestScore = -1;
  let bestDetails = '';

  const candidateAmount = new Decimal(candidate.amount);

  for (const tx of transactions) {
    // We assume expense transactions are negative, receipts are positive.
    // Calculate difference based on absolute values to handle sign differences robustly.
    const txAmount = new Decimal(tx.amount);
    const amountDiff = txAmount.abs().minus(candidateAmount.abs()).abs();
    
    // 1. Amount Score (40%)
    // Exact match (within 0.01) gets 1.0. Otherwise decay based on % difference.
    let amountScore = 0;
    if (amountDiff.lt(0.01)) {
        amountScore = 1.0;
    } else {
        // Calculate percentage difference relative to total amount
        const diffRatio = amountDiff.div(candidateAmount.abs());
        // Linearly decay: 0 score if difference is > 20%
        amountScore = Decimal.max(0, new Decimal(1).minus(diffRatio.mul(5))).toNumber(); 
    }

    // 2. Time Score (30%) - Gaussian Decay
    const txTime = new Date(tx.date).getTime();
    const candidateTime = candidate.date.getTime();
    const diffHours = Math.abs(txTime - candidateTime) / (1000 * 60 * 60);
    // Gaussian: exp( - (x^2) / (2 * sigma^2) )
    // This allows for ~24-36h discrepancies (timezone shifts, delayed postings) while punishing weeks-old matches
    const timeScore = Math.exp(- (Math.pow(diffHours, 2)) / (2 * Math.pow(SIGMA_HOURS, 2)));

    // 3. Merchant Score (20%) - Jaro Winkler
    const txMerchant = normalizeString(tx.descriptionRaw || tx.descriptionEnriched || '');
    const candMerchant = normalizeString(candidate.merchantName);
    const merchantScore = jaroWinkler(txMerchant, candMerchant);

    // 4. Substring Score (10%)
    const substringScore = (txMerchant.includes(candMerchant) || candMerchant.includes(txMerchant)) && candMerchant.length > 2 ? 1.0 : 0.0;

    // Total Score
    const totalScore = 
      (amountScore * WEIGHT_AMOUNT) +
      (timeScore * WEIGHT_TIME) +
      (merchantScore * WEIGHT_MERCHANT) +
      (substringScore * WEIGHT_SUBSTRING);

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = tx;
      bestDetails = `
        Total: ${(totalScore * 100).toFixed(1)}% 
        [Amt: ${(amountScore*100).toFixed(0)}%, 
        Time: ${(timeScore*100).toFixed(0)}% (${diffHours.toFixed(1)}h), 
        Name: ${(merchantScore * 100).toFixed(0)}%]
      `.trim();
    }
  }

  return {
    transaction: bestScore >= 0.7 ? bestMatch : null, // Threshold logic: >= 0.9 auto, >= 0.7 suggest
    score: bestScore,
    details: bestDetails
  };
}