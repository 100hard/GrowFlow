import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFunnelMetrics } from '../src/lib/analytics.ts';
import type { AnalyticsEvent } from '../src/lib/types.ts';

describe('GrowthFlow Analytics & Funnel Unit Tests', () => {
  it('Calculates complete linear funnel progression accurately', () => {
    const events: AnalyticsEvent[] = [
      // Session 1: Completed end-to-end without edit, copied materials
      { eventId: '1', sessionId: 's1', timestamp: '2026-10-14T10:00:00Z', eventName: 'onboarding_started', properties: {} },
      { eventId: '2', sessionId: 's1', timestamp: '2026-10-14T10:00:30Z', eventName: 'scenario_configured', properties: {} },
      { eventId: '3', sessionId: 's1', timestamp: '2026-10-14T10:01:00Z', eventName: 'economics_calculated', properties: { hasNegativeMargin: false } },
      { eventId: '4', sessionId: 's1', timestamp: '2026-10-14T10:01:30Z', eventName: 'campaign_generation_started', properties: {} },
      { eventId: '5', sessionId: 's1', timestamp: '2026-10-14T10:01:33Z', eventName: 'campaign_generated', properties: {} },
      { eventId: '6', sessionId: 's1', timestamp: '2026-10-14T10:02:00Z', eventName: 'campaign_approved', properties: {} },
      { eventId: '7', sessionId: 's1', timestamp: '2026-10-14T10:02:15Z', eventName: 'materials_copied', properties: {} },

      // Session 2: Dropped off after economics_calculated (did not generate)
      { eventId: '8', sessionId: 's2', timestamp: '2026-10-14T11:00:00Z', eventName: 'onboarding_started', properties: {} },
      { eventId: '9', sessionId: 's2', timestamp: '2026-10-14T11:00:20Z', eventName: 'scenario_configured', properties: {} },
      { eventId: '10', sessionId: 's2', timestamp: '2026-10-14T11:00:50Z', eventName: 'economics_calculated', properties: { hasNegativeMargin: true } },

      // Session 3: Completed with optional edit, but did not copy materials
      { eventId: '11', sessionId: 's3', timestamp: '2026-10-14T12:00:00Z', eventName: 'onboarding_started', properties: {} },
      { eventId: '12', sessionId: 's3', timestamp: '2026-10-14T12:00:25Z', eventName: 'scenario_configured', properties: {} },
      { eventId: '13', sessionId: 's3', timestamp: '2026-10-14T12:00:55Z', eventName: 'economics_calculated', properties: { hasNegativeMargin: false } },
      { eventId: '14', sessionId: 's3', timestamp: '2026-10-14T12:01:10Z', eventName: 'campaign_generation_started', properties: {} },
      { eventId: '15', sessionId: 's3', timestamp: '2026-10-14T12:01:13Z', eventName: 'campaign_generated', properties: {} },
      { eventId: '16', sessionId: 's3', timestamp: '2026-10-14T12:01:40Z', eventName: 'campaign_edited', properties: {} }, // optional edit
      { eventId: '17', sessionId: 's3', timestamp: '2026-10-14T12:02:30Z', eventName: 'campaign_approved', properties: {} },
    ];

    const result = calculateFunnelMetrics(events);

    assert.equal(result.totalSessions, 3);
    assert.equal(result.activatedSessions, 2); // s1 and s3
    assert.equal(result.activationRate, 66.7); // 2 / 3 = 66.7%

    // Check linear stages
    assert.equal(result.funnelStages[0].count, 3); // onboarding_started
    assert.equal(result.funnelStages[1].count, 3); // scenario_configured
    assert.equal(result.funnelStages[2].count, 3); // economics_calculated
    assert.equal(result.funnelStages[3].count, 2); // campaign_generation_started (s2 dropped)
    assert.equal(result.funnelStages[4].count, 2); // campaign_generated
    assert.equal(result.funnelStages[5].count, 2); // campaign_approved

    // Handoff copy rate: 1 session out of 2 activated sessions copied
    assert.equal(result.handoffCopyRate, 50.0);

    // Negative margin alert rate: 1 out of 3 economics sessions had negative margin
    assert.equal(result.negativeMarginAlertRate, 33.3);

    // Optional edit rate: 1 out of 2 generated campaigns were edited
    assert.equal(result.optionalEditRate, 50.0);

    // Time to activate:
    // s1: 10:00:00 -> 10:02:00 = 120s
    // s3: 12:00:00 -> 12:02:30 = 150s
    // Median: 120s (or average depending on percentile formula)
    assert.ok(result.medianTimeToActivateSeconds !== null);
    assert.ok(result.medianTimeToActivateSeconds <= 150);
  });

  it('Verifies that optional campaign_edited does NOT drop unedited sessions from the linear funnel', () => {
    const events: AnalyticsEvent[] = [
      // Session A approved WITHOUT editing
      { eventId: 'a1', sessionId: 'sa', timestamp: '2026-10-14T10:00:00Z', eventName: 'onboarding_started', properties: {} },
      { eventId: 'a2', sessionId: 'sa', timestamp: '2026-10-14T10:00:10Z', eventName: 'scenario_configured', properties: {} },
      { eventId: 'a3', sessionId: 'sa', timestamp: '2026-10-14T10:00:20Z', eventName: 'economics_calculated', properties: {} },
      { eventId: 'a4', sessionId: 'sa', timestamp: '2026-10-14T10:00:30Z', eventName: 'campaign_generation_started', properties: {} },
      { eventId: 'a5', sessionId: 'sa', timestamp: '2026-10-14T10:00:33Z', eventName: 'campaign_generated', properties: {} },
      { eventId: 'a6', sessionId: 'sa', timestamp: '2026-10-14T10:00:50Z', eventName: 'campaign_approved', properties: {} },
    ];

    const result = calculateFunnelMetrics(events);
    assert.equal(result.activationRate, 100.0);
    assert.equal(result.optionalEditRate, 0.0);
    assert.equal(result.funnelStages[5].conversionFromPrevious, 100.0);
  });

  it('Handles empty event log safely without crashing', () => {
    const result = calculateFunnelMetrics([]);
    assert.equal(result.totalSessions, 0);
    assert.equal(result.activationRate, 0);
    assert.equal(result.medianTimeToActivateSeconds, null);
  });
});
