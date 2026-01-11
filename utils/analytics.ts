import { Transaction } from '../types';
import { Decimal } from 'decimal.js';

/**
 * Calculates simple linear regression for spending trends.
 * Returns slope (trend direction) and intercept.
 */
export function calculateTrend(data: { x: number; y: number }[]) {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const sumX = data.reduce((acc, p) => acc + p.x, 0);
  const sumY = data.reduce((acc, p) => acc + p.y, 0);
  const sumXY = data.reduce((acc, p) => acc + (p.x * p.y), 0);
  const sumX2 = data.reduce((acc, p) => acc + (p.x * p.x), 0);

  const denominator = (n * sumX2) - (sumX * sumX);
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
  const intercept = (sumY - (slope * sumX)) / n;

  return { slope, intercept };
}

/**
 * Simple Exponential Smoothing for Forecasting
 * Forecasts the next period based on weighted past observations.
 * @param alpha Smoothing factor (0 < alpha < 1). Higher alpha = more weight to recent data.
 */
export function exponentialSmoothing(series: number[], alpha: number = 0.3): number[] {
  if (series.length === 0) return [];
  
  const forecast = [series[0]]; // Initialize with first actual value
  for (let i = 1; i < series.length; i++) {
    // F_t = alpha * A_{t-1} + (1 - alpha) * F_{t-1}
    const nextVal = (alpha * series[i - 1]) + ((1 - alpha) * forecast[i - 1]);
    forecast.push(nextVal);
  }
  
  // Forecast for the *next* unseen period
  const nextPeriod = (alpha * series[series.length - 1]) + ((1 - alpha) * forecast[forecast.length - 1]);
  forecast.push(nextPeriod);

  return forecast;
}

/**
 * Calculates Net Worth using precise Decimal arithmetic
 */
export function calculateNetWorth(accounts: { balance: number }[]): string {
    const total = accounts.reduce((acc, curr) => {
        return acc.plus(new Decimal(curr.balance));
    }, new Decimal(0));
    return total.toFixed(2);
}