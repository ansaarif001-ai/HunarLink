import { LanguageCode, Transaction } from '../types';

export const OUR_FEE_RATE = 0.05;

export type EarningsPeriod = 'week' | 'month' | 'all';

export function normalizePkr(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

export function formatPkr(amount: number, lang: LanguageCode = 'en'): string {
  const safe = normalizePkr(amount);
  const numStr = safe.toLocaleString('en-PK');
  return lang === 'ur' ? `${numStr} روپے` : `Rs ${numStr}`;
}

export function formatPkrRange(
  minPkr: number,
  maxPkr: number,
  lang: LanguageCode = 'en'
): string {
  const min = normalizePkr(minPkr);
  const max = normalizePkr(maxPkr);
  if (min === max) return formatPkr(min, lang);
  return `${formatPkr(min, lang)} – ${formatPkr(max, lang)}`;
}

/**
 * Single source of truth for Our fee (5%):
 * fee = round(jobValue * 0.05), net = jobValue - fee
 * Cancelled/rejected/unfinished jobs create 0 fee and 0 transaction.
 */
export function calculateOurFee(agreedPricePkr: number, cancelled = false) {
  const gross = normalizePkr(agreedPricePkr);
  const fee = cancelled ? 0 : Math.round(gross * OUR_FEE_RATE);
  const workerGets = Math.max(0, gross - fee);
  return {
    jobValue: gross,
    fee,
    net: workerGets,
    grossPkr: gross,
    ourFeePkr: fee,
    workerGetsPkr: workerGets,
  };
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: EarningsPeriod,
  nowMs: number = Date.now()
): Transaction[] {
  if (period === 'all') return transactions;
  const maxAgeDays = period === 'week' ? 7 : 30;
  const cutoff = nowMs - maxAgeDays * 24 * 3600 * 1000;
  return transactions.filter((tx) => {
    const t = Date.parse(tx.createdAt);
    return Number.isFinite(t) && t >= cutoff;
  });
}

export function summarizeEarnings(transactions: Transaction[]) {
  return transactions.reduce(
    (acc, tx) => {
      acc.totalJobValue += normalizePkr(tx.jobValue ?? tx.grossPkr);
      acc.totalFee += normalizePkr(tx.fee ?? tx.ourFeePkr);
      acc.totalNet += normalizePkr(tx.net ?? tx.netPkr);
      acc.jobsCount += 1;
      return acc;
    },
    { totalJobValue: 0, totalFee: 0, totalNet: 0, jobsCount: 0 }
  );
}
