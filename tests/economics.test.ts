import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateContributionEconomics, evaluateFeasibilityRules } from '../src/lib/economics.ts';
import type { MenuItemInput, OfferingItem, CampaignObjectiveConfig } from '../src/lib/types.ts';

describe('GrowthFlow Economics Engine Unit Tests', () => {
  it('AC-1.1: Multi-item bundle calculation with packaging cost', () => {
    const items: MenuItemInput[] = [
      { id: '1', name: 'Specialty Latte', regularPrice: 5.5, unitCost: 1.2 },
      { id: '2', name: 'Almond Croissant', regularPrice: 4.5, unitCost: 1.8 },
    ];
    const packagingCost = 0.3;
    const promoPrice = 7.5;
    const extraPromoCost = 0.0;

    const result = calculateContributionEconomics({
      items,
      packagingCost,
      promoPrice,
      extraPromoCost,
    });

    assert.equal(result.baselinePrice, 10.0);
    assert.equal(result.totalVariableCost, 3.3); // 1.2 + 1.8 + 0.3
    assert.equal(result.baselineContribution, 6.7); // 10.0 - 3.3
    assert.equal(result.baselineContributionRate, 67.0);
    assert.equal(result.promoPrice, 7.5);
    assert.equal(result.promoContribution, 4.2); // 7.5 - 3.3
    assert.equal(result.promoContributionRate, 56.0);
    assert.equal(result.breakevenMultiplier, 1.6); // 6.7 / 4.2 = 1.595 -> 1.6
    assert.equal(result.breakeven10SalesVolume, 16); // Math.ceil(10 * 1.595) = 16
    assert.equal(result.hasNegativeContribution, false);
    assert.equal(result.hasZeroContribution, false);
    assert.equal(result.hasThinMarginWarning, false);
    assert.equal(result.hasMissingCost, false);
  });

  it('AC-1.2: Negative promotional contribution guard', () => {
    const items: MenuItemInput[] = [
      { id: '1', name: 'Espresso Flight', regularPrice: 8.0, unitCost: 3.5 },
    ];
    const promoPrice = 3.0; // below unit cost 3.5

    const result = calculateContributionEconomics({
      items,
      packagingCost: 0,
      promoPrice,
      extraPromoCost: 0,
    });

    assert.equal(result.promoContribution, -0.5);
    assert.equal(result.hasNegativeContribution, true);
    assert.equal(result.breakevenMultiplier, 'non_viable');
    assert.equal(result.breakeven10SalesVolume, 'non_viable');
  });

  it('AC-1.3: Zero promotional contribution guard', () => {
    const items: MenuItemInput[] = [
      { id: '1', name: 'Drip Coffee', regularPrice: 4.0, unitCost: 2.0 },
    ];
    const promoPrice = 2.0; // equals unit cost 2.0

    const result = calculateContributionEconomics({
      items,
      packagingCost: 0,
      promoPrice,
      extraPromoCost: 0,
    });

    assert.equal(result.promoContribution, 0.0);
    assert.equal(result.hasZeroContribution, true);
    assert.equal(result.breakevenMultiplier, 'non_viable');
    assert.equal(result.breakeven10SalesVolume, 'non_viable');
  });

  it('AC-1.4: Missing cost handling (null / omitted inputs)', () => {
    const items: MenuItemInput[] = [
      { id: '1', name: 'Artisan Sourdough Toast', regularPrice: 7.0, unitCost: null },
    ];
    const promoPrice = 5.0;

    const result = calculateContributionEconomics({
      items,
      packagingCost: 0,
      promoPrice,
      extraPromoCost: 0,
    });

    assert.equal(result.hasMissingCost, true);
    assert.equal(result.totalVariableCost, null);
    assert.equal(result.promoContribution, null);
    assert.equal(result.breakevenMultiplier, 'unavailable');
    assert.equal(result.breakeven10SalesVolume, 'unavailable');
  });

  it('Rejects invalid prices (zero or negative)', () => {
    const items: MenuItemInput[] = [
      { id: '1', name: 'Latte', regularPrice: 0, unitCost: 1.0 },
    ];
    const result = calculateContributionEconomics({
      items,
      packagingCost: 0,
      promoPrice: 5.0,
      extraPromoCost: 0,
    });

    assert.ok(result.validationError);
  });

  it('Triggers thin margin advisory when contribution rate < 35%', () => {
    const items: MenuItemInput[] = [
      { id: '1', name: 'Sandwich', regularPrice: 10.0, unitCost: 6.0 },
    ];
    const promoPrice = 7.5; // promo contribution: 1.5, rate: 20% (< 35%)

    const result = calculateContributionEconomics({
      items,
      packagingCost: 0,
      promoPrice,
      extraPromoCost: 0,
    });

    assert.equal(result.hasNegativeContribution, false);
    assert.equal(result.hasThinMarginWarning, true);
    assert.equal(result.promoContributionRate, 20.0);
  });
});

describe('GrowthFlow Composable Feasibility Engine Tests', () => {
  const baseOfferings: OfferingItem[] = [
    { id: 's1', name: 'Service A', regularPrice: 50.0, variableCost: 10.0 },
    { id: 's2', name: 'Service B', regularPrice: 30.0, variableCost: 5.0 },
  ];

  it('Evaluates fully passing feasibility report across unit margin, capacity, and budget', () => {
    const config: CampaignObjectiveConfig = {
      type: 'fill_capacity',
      label: 'Off-Peak Booking Promo',
      description: 'Fill mid-day slots',
      promoPrice: 65.0, // baseline is 80.0, variable cost is 15.0 -> unit contribution 50.0 (76.9%)
      availableCapacityUnits: 20,
      targetRedemptions: 10, // 50% capacity
      budgetLimit: 200.0, // discount is 15.0 * 10 = $150 <= $200
    };

    const report = evaluateFeasibilityRules(baseOfferings, config);

    assert.equal(report.overallStatus, 'passed');
    assert.equal(report.results.length, 3);

    const unitRule = report.results.find((r) => r.ruleId === 'unit_contribution');
    assert.equal(unitRule?.status, 'passed');

    const capacityRule = report.results.find((r) => r.ruleId === 'capacity_constraint');
    assert.equal(capacityRule?.status, 'passed');
    assert.equal(capacityRule?.details.utilizationRate, 50.0);

    const budgetRule = report.results.find((r) => r.ruleId === 'budget_constraint');
    assert.equal(budgetRule?.status, 'passed');
    assert.equal(budgetRule?.details.totalDiscountExposure, 150.0);
  });

  it('Triggers warning when target volume exceeds available operational capacity', () => {
    const config: CampaignObjectiveConfig = {
      type: 'fill_capacity',
      label: 'Rush Sale',
      description: 'Drive high volume',
      promoPrice: 65.0,
      availableCapacityUnits: 10,
      targetRedemptions: 15, // 150% capacity overutilization!
    };

    const report = evaluateFeasibilityRules(baseOfferings, config);

    assert.equal(report.overallStatus, 'warning');
    const capacityRule = report.results.find((r) => r.ruleId === 'capacity_constraint');
    assert.equal(capacityRule?.status, 'warning');
    assert.ok(capacityRule?.summary.includes('Overcapacity risk'));
    assert.equal(capacityRule?.details.utilizationRate, 150.0);
  });

  it('Triggers warning when total discount exposure exceeds promotional budget cap', () => {
    const config: CampaignObjectiveConfig = {
      type: 'promote_bundle',
      label: 'Deep Discount Bundle',
      description: 'Promote bundle',
      promoPrice: 50.0, // $30 discount per bundle ($80 - $50)
      targetRedemptions: 10, // 10 * $30 = $300 discount
      budgetLimit: 150.0, // budget is only $150
    };

    const report = evaluateFeasibilityRules(baseOfferings, config);

    assert.equal(report.overallStatus, 'warning');
    const budgetRule = report.results.find((r) => r.ruleId === 'budget_constraint');
    assert.equal(budgetRule?.status, 'warning');
    assert.ok(budgetRule?.summary.includes('Budget exceeded'));
  });

  it('Triggers critical alert when promo price is below variable cost', () => {
    const config: CampaignObjectiveConfig = {
      type: 'clear_inventory',
      label: 'Fire Sale',
      description: 'Clear stock',
      promoPrice: 10.0, // variable cost is $15 ($10 + $5) -> -$5 loss per sale!
    };

    const report = evaluateFeasibilityRules(baseOfferings, config);

    assert.equal(report.overallStatus, 'critical_alert');
    const unitRule = report.results.find((r) => r.ruleId === 'unit_contribution');
    assert.equal(unitRule?.status, 'critical_alert');
    assert.ok(unitRule?.summary.includes('Negative unit contribution'));
  });

  it('Handles missing cost data honestly without fabricating figures', () => {
    const missingCostOfferings: OfferingItem[] = [
      { id: 's1', name: 'Mystery Service', regularPrice: 50.0, variableCost: null },
    ];
    const config: CampaignObjectiveConfig = {
      type: 'acquire_new_customers',
      label: 'New Customer Welcome',
      description: 'Welcome perk',
      promoPrice: 40.0,
    };

    const report = evaluateFeasibilityRules(missingCostOfferings, config);

    assert.equal(report.overallStatus, 'missing_inputs');
    const unitRule = report.results.find((r) => r.ruleId === 'unit_contribution');
    assert.equal(unitRule?.status, 'missing_inputs');
    assert.ok(unitRule?.summary.includes('Unit cost not provided') || unitRule?.summary.includes('cannot be certified'));
  });
});

