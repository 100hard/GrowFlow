import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateContributionEconomics } from '../src/lib/economics.ts';
import type { MenuItemInput } from '../src/lib/types.ts';

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
