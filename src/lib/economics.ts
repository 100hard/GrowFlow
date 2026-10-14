/**
 * GrowthFlow Deterministic Contribution Economics Engine
 *
 * Models unit contribution economics for individual items and multi-item bundles.
 * This engine operates deterministically with zero LLM dependence.
 *
 * Terminology: "Unit Contribution Economics" is strictly maintained.
 * This represents gross margin above direct variable item costs and does NOT
 * assert overall business net profit (which depends on fixed labor, rent, and overhead).
 */

import type { IntakeScenarioInput, ContributionEconomicsResult, MultiplierValue } from './types.ts';

export const DEFAULT_LOW_MARGIN_THRESHOLD_PERCENT = 35; // Configurable heuristic default

export function calculateContributionEconomics(
  input: Pick<IntakeScenarioInput, 'items' | 'packagingCost' | 'promoPrice' | 'extraPromoCost'>,
  lowMarginThreshold: number = DEFAULT_LOW_MARGIN_THRESHOLD_PERCENT
): ContributionEconomicsResult {
  const { items, packagingCost = 0, promoPrice, extraPromoCost = 0 } = input;

  // Validation: Check for invalid prices
  if (promoPrice <= 0) {
    return createInvalidResult('Promotional price must be greater than zero.');
  }

  const baselinePrice = items.reduce((sum, item) => sum + (Number(item.regularPrice) || 0), 0);
  if (baselinePrice <= 0) {
    return createInvalidResult('Baseline regular price must be greater than zero.');
  }

  // Check if any item has missing cost
  const hasMissingCost = items.some((item) => item.unitCost === null || item.unitCost === undefined || isNaN(Number(item.unitCost)));

  if (hasMissingCost) {
    return {
      baselinePrice: roundCurrency(baselinePrice),
      totalVariableCost: null,
      baselineContribution: null,
      baselineContributionRate: null,
      promoPrice: roundCurrency(promoPrice),
      promoContribution: null,
      promoContributionRate: null,
      breakevenMultiplier: 'unavailable',
      breakeven10SalesVolume: 'unavailable',
      hasNegativeContribution: false,
      hasZeroContribution: false,
      hasThinMarginWarning: false,
      hasMissingCost: true,
    };
  }

  // Calculate total variable cost for complete offer
  const itemsVariableCost = items.reduce((sum, item) => sum + (Number(item.unitCost) || 0), 0);
  const totalVariableCost = roundCurrency(itemsVariableCost + (Number(packagingCost) || 0));
  const totalPromoVariableCost = roundCurrency(totalVariableCost + (Number(extraPromoCost) || 0));

  // Baseline contribution
  const baselineContribution = roundCurrency(baselinePrice - totalVariableCost);
  const baselineContributionRate = roundPercentage((baselineContribution / baselinePrice) * 100);

  // Promotional contribution
  const promoContribution = roundCurrency(promoPrice - totalPromoVariableCost);
  const promoContributionRate = roundPercentage((promoContribution / promoPrice) * 100);

  // Zero or Negative Contribution checks
  const hasNegativeContribution = promoContribution < 0;
  const hasZeroContribution = promoContribution === 0;

  let breakevenMultiplier: MultiplierValue;
  let breakeven10SalesVolume: MultiplierValue;

  if (hasNegativeContribution || hasZeroContribution) {
    // If promotional contribution is zero or negative, Elena can NEVER break even by selling more units.
    breakevenMultiplier = 'non_viable';
    breakeven10SalesVolume = 'non_viable';
  } else {
    // Normal breakeven multiplier: how many promo sales equal 1 baseline sale
    const multiplier = baselineContribution / promoContribution;
    breakevenMultiplier = roundNumber(multiplier, 2);
    breakeven10SalesVolume = Math.ceil(10 * multiplier);
  }

  const hasThinMarginWarning = !hasNegativeContribution && !hasZeroContribution && promoContributionRate < lowMarginThreshold;

  return {
    baselinePrice: roundCurrency(baselinePrice),
    totalVariableCost,
    baselineContribution,
    baselineContributionRate,
    promoPrice: roundCurrency(promoPrice),
    promoContribution,
    promoContributionRate,
    breakevenMultiplier,
    breakeven10SalesVolume,
    hasNegativeContribution,
    hasZeroContribution,
    hasThinMarginWarning,
    hasMissingCost: false,
  };
}

function createInvalidResult(errorMessage: string): ContributionEconomicsResult {
  return {
    baselinePrice: 0,
    totalVariableCost: null,
    baselineContribution: null,
    baselineContributionRate: null,
    promoPrice: 0,
    promoContribution: null,
    promoContributionRate: null,
    breakevenMultiplier: 'unavailable',
    breakeven10SalesVolume: 'unavailable',
    hasNegativeContribution: false,
    hasZeroContribution: false,
    hasThinMarginWarning: false,
    hasMissingCost: false,
    validationError: errorMessage,
  };
}

function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function roundPercentage(val: number): number {
  return Math.round((val + Number.EPSILON) * 10) / 10;
}

function roundNumber(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}
