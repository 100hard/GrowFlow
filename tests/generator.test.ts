import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateDeterministicBrief } from '../src/lib/generator.ts';
import type { IntakeScenarioInput } from '../src/lib/types.ts';

describe('GrowthFlow Generator & Quality Guardrail Tests', () => {
  const baseScenario: IntakeScenarioInput = {
    businessName: 'The Roasted Bean Café',
    neighborhoodVibe: 'Warm neighborhood coffeehouse near campus',
    slumpDay: 'Tuesday & Wednesday',
    slumpStartTime: '14:00',
    slumpEndTime: '17:00',
    archetype: 'bundle_hook',
    items: [
      { id: '1', name: 'Specialty Pour-Over', regularPrice: 5.0, unitCost: 1.1 },
      { id: '2', name: 'Warm Cinnamon Roll', regularPrice: 4.5, unitCost: 1.5 },
    ],
    packagingCost: 0.25,
    promoPrice: 7.0,
    extraPromoCost: 0,
  };

  it('Generates complete structured brief for The Bundle Hook', () => {
    const brief = generateDeterministicBrief(baseScenario);

    assert.equal(brief.archetype, 'bundle_hook');
    assert.ok(brief.strategicRationale.length > 20);
    assert.ok(brief.customerHook.includes('$7.00'));

    // Check Instagram format
    assert.ok(brief.instagram.headline.length > 5);
    assert.ok(brief.instagram.caption.includes('The Roasted Bean Café'));
    assert.ok(brief.instagram.hashtags.length >= 3);
    assert.ok(brief.instagram.photoDirection.length > 10);

    // Check Chalkboard format
    assert.ok(brief.chalkboard.headline.length <= 25); // punchy
    assert.equal(brief.chalkboard.bulletPoints.length, 3);
    assert.ok(brief.chalkboard.timeCallout.includes('Tuesday & Wednesday'));

    // Check Operational caveats
    assert.ok(brief.operationalCaveats.length >= 3);
    assert.equal(brief.source, 'deterministic_fallback');
    assert.equal(brief.status, 'draft');
  });

  it('Anti-Cliche Guardrail: Generated copy strictly avoids AI marketing buzzwords', () => {
    const archetypes = ['bundle_hook', 'remote_work_perk', 'neighbor_2pack'] as const;
    const forbiddenBuzzwords = ['delve', 'revolutionize', 'elevate', 'testament', 'tapestry', 'unleash', 'bespoke'];

    for (const arch of archetypes) {
      const brief = generateDeterministicBrief({ ...baseScenario, archetype: arch });
      const fullText = (
        brief.strategicRationale +
        ' ' +
        brief.customerHook +
        ' ' +
        brief.instagram.headline +
        ' ' +
        brief.instagram.caption +
        ' ' +
        brief.chalkboard.headline
      ).toLowerCase();

      for (const word of forbiddenBuzzwords) {
        assert.equal(
          fullText.includes(word),
          false,
          `Forbidden AI cliché "${word}" was found in ${arch} output.`
        );
      }
    }
  });

  it('Generates localized Remote Work Pass brief with Wi-Fi and quiet vibe hooks', () => {
    const brief = generateDeterministicBrief({
      ...baseScenario,
      archetype: 'remote_work_perk',
    });

    assert.equal(brief.archetype, 'remote_work_perk');
    assert.ok(brief.chalkboard.headline.includes('LAPTOP'));
    assert.ok(brief.operationalCaveats.some((c) => c.toLowerCase().includes('wi-fi')));
  });

  it('Generates Bring a Colleague 2-pack deal with social sharing cues', () => {
    const brief = generateDeterministicBrief({
      ...baseScenario,
      archetype: 'neighbor_2pack',
    });

    assert.equal(brief.archetype, 'neighbor_2pack');
    assert.ok(brief.instagram.caption.toLowerCase().includes('coworker') || brief.instagram.caption.toLowerCase().includes('friend'));
  });
});
