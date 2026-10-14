/**
 * GrowthFlow Analytics & Telemetry Engine
 *
 * Instruments client/server session events, computes funnel metrics,
 * and maintains strict epistemic separation between live session telemetry
 * and simulated benchmark cohort datasets.
 */

import type { AnalyticsEvent, FunnelMetric, FunnelAnalysisResult } from './types.ts';

// In-memory event bus for active session
let liveEvents: AnalyticsEvent[] = [];

export function logEvent(
  sessionId: string,
  eventName: string,
  properties: Record<string, any> = {}
): AnalyticsEvent {
  const event: AnalyticsEvent = {
    eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    sessionId,
    timestamp: new Date().toISOString(),
    eventName,
    properties,
  };

  liveEvents.push(event);

  // Synchronize to localStorage in browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('growflow_events');
      const all = stored ? JSON.parse(stored) : [];
      all.push(event);
      window.localStorage.setItem('growflow_events', JSON.stringify(all));
    } catch {
      // storage error ignored
    }
  }

  return event;
}

export function getLiveEvents(sessionId?: string): AnalyticsEvent[] {
  let events = [...liveEvents];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('growflow_events');
      if (stored) {
        events = JSON.parse(stored);
      }
    } catch {
      // fallback to in-memory
    }
  }

  if (sessionId) {
    return events.filter((e) => e.sessionId === sessionId);
  }
  return events;
}

export function clearLiveEvents(): void {
  liveEvents = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem('growflow_events');
    } catch {
      // ignored
    }
  }
}


export function calculateFunnelMetrics(events: AnalyticsEvent[]): FunnelAnalysisResult {
  // Group events by session
  const sessions = new Map<string, AnalyticsEvent[]>();
  for (const evt of events) {
    if (!sessions.has(evt.sessionId)) {
      sessions.set(evt.sessionId, []);
    }
    sessions.get(evt.sessionId)!.push(evt);
  }

  const totalSessions = sessions.size;
  if (totalSessions === 0) {
    return createEmptyFunnelResult();
  }

  // Linear Funnel Stages:
  // 1. onboarding_started
  // 2. scenario_configured
  // 3. economics_calculated
  // 4. campaign_generation_started
  // 5. campaign_generated
  // 6. campaign_approved (Activation)
  const linearStages = [
    { eventName: 'onboarding_started', label: '1. Onboarding Started' },
    { eventName: 'scenario_configured', label: '2. Scenario Configured' },
    { eventName: 'economics_calculated', label: '3. Economics Inspected' },
    { eventName: 'campaign_generation_started', label: '4. Generation Started' },
    { eventName: 'campaign_generated', label: '5. Draft Generated' },
    { eventName: 'campaign_approved', label: '6. Campaign Approved (Activation)' },
  ];

  const stageCounts: number[] = linearStages.map((stage) => {
    let count = 0;
    for (const [, evts] of sessions) {
      if (evts.some((e) => e.eventName === stage.eventName)) {
        count++;
      }
    }
    return count;
  });

  const funnelStages: FunnelMetric[] = linearStages.map((stage, idx) => {
    const count = stageCounts[idx];
    const prevCount = idx === 0 ? count : stageCounts[idx - 1];
    const conversionFromPrevious = prevCount > 0 ? (count / prevCount) * 100 : 0;
    const dropOffCount = idx === 0 ? 0 : Math.max(0, prevCount - count);
    const dropOffRate = prevCount > 0 ? (dropOffCount / prevCount) * 100 : 0;

    return {
      stage: stage.eventName,
      label: stage.label,
      count,
      conversionFromPrevious: roundOneDecimal(conversionFromPrevious),
      dropOffCount,
      dropOffRate: roundOneDecimal(dropOffRate),
    };
  });

  // Calculate Activation Rate
  const startedCount = stageCounts[0] || 0;
  const activatedCount = stageCounts[5] || 0;
  const activationRate = startedCount > 0 ? roundOneDecimal((activatedCount / startedCount) * 100) : 0;

  // Calculate Handoff Copy Rate
  let copiedSessions = 0;
  for (const [, evts] of sessions) {
    const hasApproved = evts.some((e) => e.eventName === 'campaign_approved');
    const hasCopied = evts.some((e) => e.eventName === 'materials_copied');
    if (hasApproved && hasCopied) {
      copiedSessions++;
    }
  }
  const handoffCopyRate = activatedCount > 0 ? roundOneDecimal((copiedSessions / activatedCount) * 100) : 0;

  // Calculate Optional Edit Rate
  let editedSessions = 0;
  const generatedCount = stageCounts[4] || 0;
  for (const [, evts] of sessions) {
    if (evts.some((e) => e.eventName === 'campaign_edited')) {
      editedSessions++;
    }
  }
  const optionalEditRate = generatedCount > 0 ? roundOneDecimal((editedSessions / generatedCount) * 100) : 0;

  // Calculate Negative Margin Alert Rate
  let economicsSessions = 0;
  let negativeMarginSessions = 0;
  for (const [, evts] of sessions) {
    const ecoEvt = evts.find((e) => e.eventName === 'economics_calculated');
    if (ecoEvt) {
      economicsSessions++;
      if (ecoEvt.properties?.hasNegativeMargin) {
        negativeMarginSessions++;
      }
    }
  }
  const negativeMarginAlertRate = economicsSessions > 0 ? roundOneDecimal((negativeMarginSessions / economicsSessions) * 100) : 0;

  // Time to activation calculation
  const activationDurations: number[] = [];
  for (const [, evts] of sessions) {
    const startEvt = evts.find((e) => e.eventName === 'onboarding_started');
    const appEvt = evts.find((e) => e.eventName === 'campaign_approved');
    if (startEvt && appEvt) {
      const startMs = new Date(startEvt.timestamp).getTime();
      const appMs = new Date(appEvt.timestamp).getTime();
      const diffSec = Math.max(1, Math.round((appMs - startMs) / 1000));
      activationDurations.push(diffSec);
    }
  }

  activationDurations.sort((a, b) => a - b);
  const medianTimeToActivateSeconds = getPercentile(activationDurations, 50);
  const p75TimeToActivateSeconds = getPercentile(activationDurations, 75);

  return {
    funnelStages,
    activationRate,
    handoffCopyRate,
    totalSessions,
    activatedSessions: activatedCount,
    medianTimeToActivateSeconds,
    p75TimeToActivateSeconds,
    negativeMarginAlertRate,
    optionalEditRate,
  };
}

function createEmptyFunnelResult(): FunnelAnalysisResult {
  return {
    funnelStages: [],
    activationRate: 0,
    handoffCopyRate: 0,
    totalSessions: 0,
    activatedSessions: 0,
    medianTimeToActivateSeconds: null,
    p75TimeToActivateSeconds: null,
    negativeMarginAlertRate: 0,
    optionalEditRate: 0,
  };
}

function getPercentile(sortedArr: number[], percentile: number): number | null {
  if (sortedArr.length === 0) return null;
  const index = Math.floor((percentile / 100) * (sortedArr.length - 1));
  return sortedArr[index];
}

function roundOneDecimal(val: number): number {
  return Math.round((val + Number.EPSILON) * 10) / 10;
}

/**
 * Seeded Comparative Benchmark Cohort (N = 250 simulated café sessions)
 * Strictly labeled as simulated for demonstration and A/B comparison.
 */
export function generateSimulatedBenchmarkCohort(): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  const baseTimestamp = new Date('2026-10-10T12:00:00Z').getTime();

  for (let i = 1; i <= 250; i++) {
    const sessionId = `sim-session-${i}`;
    const isVariantB = i % 2 === 0; // 50% single form, 50% progressive wizard
    const sessionStart = baseTimestamp + i * 360000;
    let t = sessionStart;

    // Stage 1: Onboarding Started
    events.push({
      eventId: `sim-evt-${i}-1`,
      sessionId,
      timestamp: new Date(t).toISOString(),
      eventName: 'onboarding_started',
      properties: { variant: isVariantB ? 'progressive_wizard' : 'single_form' },
    });

    // Stage 2: Scenario Configured (92% pass rate for Variant B, 84% for Variant A)
    const passScenario = isVariantB ? Math.random() < 0.92 : Math.random() < 0.84;
    if (!passScenario) continue;
    t += 35000;
    events.push({
      eventId: `sim-evt-${i}-2`,
      sessionId,
      timestamp: new Date(t).toISOString(),
      eventName: 'scenario_configured',
      properties: { slumpDay: 'Tuesday & Wednesday', slumpWindow: '14:00-17:00' },
    });

    // Stage 3: Economics Calculated (88% pass rate)
    const passEconomics = Math.random() < 0.88;
    if (!passEconomics) continue;
    t += 40000;
    const hasNegative = Math.random() < 0.12; // 12% negative margin attempts
    events.push({
      eventId: `sim-evt-${i}-3`,
      sessionId,
      timestamp: new Date(t).toISOString(),
      eventName: 'economics_calculated',
      properties: { hasNegativeMargin: hasNegative, contributionRate: hasNegative ? -5.0 : 48.5 },
    });

    // Stage 4: Generation Started (95% pass rate)
    if (Math.random() > 0.95) continue;
    t += 15000;
    events.push({
      eventId: `sim-evt-${i}-4`,
      sessionId,
      timestamp: new Date(t).toISOString(),
      eventName: 'campaign_generation_started',
      properties: { archetype: 'bundle_hook' },
    });

    // Stage 5: Campaign Generated (99% success rate)
    t += 2800; // 2.8s generation
    events.push({
      eventId: `sim-evt-${i}-5`,
      sessionId,
      timestamp: new Date(t).toISOString(),
      eventName: 'campaign_generated',
      properties: { source: 'deterministic_fallback', generationLatencyMs: 2800 },
    });

    // Optional Action: Campaign Edited (38% of users edit)
    if (Math.random() < 0.38) {
      t += 25000;
      events.push({
        eventId: `sim-evt-${i}-6a`,
        sessionId,
        timestamp: new Date(t).toISOString(),
        eventName: 'campaign_edited',
        properties: { targetFormat: 'instagram', fieldModified: 'caption' },
      });
    }

    // Stage 6: Campaign Approved (Activation) (78% of generated campaigns get approved)
    if (Math.random() < 0.78) {
      t += 18000;
      const totalDurationSec = Math.round((t - sessionStart) / 1000);
      events.push({
        eventId: `sim-evt-${i}-6`,
        sessionId,
        timestamp: new Date(t).toISOString(),
        eventName: 'campaign_approved',
        properties: { timeToActivateSeconds: totalDurationSec },
      });

      // Post-Activation Handoff: Materials Copied (82% of approved campaigns copy materials)
      if (Math.random() < 0.82) {
        t += 8000;
        events.push({
          eventId: `sim-evt-${i}-7`,
          sessionId,
          timestamp: new Date(t).toISOString(),
          eventName: 'materials_copied',
          properties: { formatCopied: 'instagram' },
        });
      }
    }
  }

  return events;
}
