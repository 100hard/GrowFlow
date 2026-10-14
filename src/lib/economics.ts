/**
 * GrowthFlow Deterministic Contribution Economics & Feasibility Engine
 *
 * Models unit contribution economics and composable feasibility checks
 * for arbitrary small businesses with zero LLM dependence.
 *
 * Rules:
 * 1. unit_contribution: Evaluates unit gross margin, contribution rate, and breakeven volume.
 * 2. capacity_constraint: Evaluates required redemptions against operational capacity/slots.
 * 3. budget_constraint: Evaluates discount exposure against an owner's promotional budget cap.
 */

import type {
  OfferingItem,
  ContributionEconomicsResult,
  MultiplierValue,
  FeasibilityRuleResult,
  AggregatedFeasibilityReport,
  CampaignObjectiveConfig,
} from './types.ts';

export const DEFAULT_LOW_MARGIN_THRESHOLD_PERCENT = 35; // Configurable heuristic default

export interface EconomicsInput {
  items: Array<{
    id?: string;
    name: string;
    regularPrice: number;
    unitCost?: number | null;
    variableCost?: number | null;
  }>;
  packagingCost?: number;
  promoPrice: number;
  extraPromoCost?: number;
}

export function calculateContributionEconomics(
  input: EconomicsInput,
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
  const hasMissingCost = items.some((item) => {
    const cost = item.unitCost !== undefined ? item.unitCost : item.variableCost;
    return cost === null || cost === undefined || isNaN(Number(cost));
  });

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
  const itemsVariableCost = items.reduce((sum, item) => {
    const cost = item.unitCost !== undefined ? item.unitCost : item.variableCost;
    return sum + (Number(cost) || 0);
  }, 0);

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
    // If promotional contribution is zero or negative, Elena or any owner can NEVER break even by selling more units.
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

/**
 * Extensible Feasibility Rule Dispatcher
 *
 * Runs all applicable deterministic feasibility rules against the scenario inputs.
 */
export function evaluateFeasibilityRules(
  offerings: OfferingItem[],
  config: CampaignObjectiveConfig,
  packagingCost: number = 0
): AggregatedFeasibilityReport {
  const results: FeasibilityRuleResult[] = [];

  // 1. Rule: Unit Contribution
  const economics = calculateContributionEconomics({
    items: offerings,
    packagingCost,
    promoPrice: config.promoPrice,
    extraPromoCost: config.additionalCost || 0,
  });

  if (economics.hasMissingCost) {
    results.push({
      ruleId: 'unit_contribution',
      name: 'Unit Contribution Economics',
      status: 'missing_inputs',
      summary: 'Unit cost not provided. Contribution economics cannot be certified.',
      details: { ...economics },
    });
  } else if (economics.hasNegativeContribution) {
    results.push({
      ruleId: 'unit_contribution',
      name: 'Unit Contribution Economics',
      status: 'critical_alert',
      summary: `Negative unit contribution (-$${Math.abs(economics.promoContribution ?? 0).toFixed(2)}). Every redemption loses cash.`,
      details: { ...economics },
    });
  } else if (economics.hasZeroContribution) {
    results.push({
      ruleId: 'unit_contribution',
      name: 'Unit Contribution Economics',
      status: 'critical_alert',
      summary: 'Zero unit contribution ($0.00). Selling more units cannot recover operating costs.',
      details: { ...economics },
    });
  } else if (economics.hasThinMarginWarning) {
    results.push({
      ruleId: 'unit_contribution',
      name: 'Unit Contribution Economics',
      status: 'warning',
      summary: `Low contribution rate (${economics.promoContributionRate}%). Ensure volume covers baseline labor.`,
      details: { ...economics },
    });
  } else {
    results.push({
      ruleId: 'unit_contribution',
      name: 'Unit Contribution Economics',
      status: 'passed',
      summary: `Healthy contribution rate (${economics.promoContributionRate}%). Breakeven multiplier: ${economics.breakevenMultiplier}x.`,
      details: { ...economics },
    });
  }

  // 2. Rule: Capacity Constraint (if capacity is specified)
  if (config.availableCapacityUnits !== undefined && config.availableCapacityUnits > 0) {
    const target = config.targetRedemptions || 10;
    const utilizationRate = roundPercentage((target / config.availableCapacityUnits) * 100);

    if (utilizationRate > 100) {
      results.push({
        ruleId: 'capacity_constraint',
        name: 'Operational Capacity Check',
        status: 'warning',
        summary: `Overcapacity risk: Target volume (${target}) exceeds available capacity (${config.availableCapacityUnits} slots, ${utilizationRate}% utilization).`,
        details: { target, available: config.availableCapacityUnits, utilizationRate },
      });
    } else {
      results.push({
        ruleId: 'capacity_constraint',
        name: 'Operational Capacity Check',
        status: 'passed',
        summary: `Capacity viable: ${target} target redemptions fit within ${config.availableCapacityUnits} available capacity slots (${utilizationRate}% utilization).`,
        details: { target, available: config.availableCapacityUnits, utilizationRate },
      });
    }
  }

  // 3. Rule: Budget Constraint (if budget limit is specified)
  if (config.budgetLimit !== undefined && config.budgetLimit > 0) {
    const discountPerUnit = Math.max(0, economics.baselinePrice - config.promoPrice);
    const target = config.targetRedemptions || 10;
    const totalDiscountExposure = roundCurrency(discountPerUnit * target);

    if (totalDiscountExposure > config.budgetLimit) {
      results.push({
        ruleId: 'budget_constraint',
        name: 'Promotional Budget Cap',
        status: 'warning',
        summary: `Budget exceeded: Expected discount exposure ($${totalDiscountExposure.toFixed(2)}) exceeds allocated budget cap ($${config.budgetLimit.toFixed(2)}).`,
        details: { totalDiscountExposure, budgetLimit: config.budgetLimit, discountPerUnit },
      });
    } else {
      const maxRedemptions = discountPerUnit > 0 ? Math.floor(config.budgetLimit / discountPerUnit) : target;
      results.push({
        ruleId: 'budget_constraint',
        name: 'Promotional Budget Cap',
        status: 'passed',
        summary: `Budget safe: Maximum exposure is $${totalDiscountExposure.toFixed(2)} within the $${config.budgetLimit.toFixed(2)} cap (up to ${maxRedemptions} safe redemptions).`,
        details: { totalDiscountExposure, budgetLimit: config.budgetLimit, maxRedemptions },
      });
    }
  }

  // Determine overall status
  let overallStatus: AggregatedFeasibilityReport['overallStatus'] = 'passed';
  if (results.some((r) => r.status === 'critical_alert')) {
    overallStatus = 'critical_alert';
  } else if (results.some((r) => r.status === 'warning')) {
    overallStatus = 'warning';
  } else if (results.some((r) => r.status === 'missing_inputs')) {
    overallStatus = 'missing_inputs';
  }

  return { overallStatus, results };
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
