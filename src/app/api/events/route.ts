import { NextRequest, NextResponse } from 'next/server.js';
import {
  logEvent,
  getLiveEvents,
  clearLiveEvents,
  calculateFunnelMetrics,
  generateSimulatedBenchmarkCohort,
} from '../../../lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, eventName, properties } = await req.json();
    if (!sessionId || !eventName) {
      return NextResponse.json({ error: 'Missing sessionId or eventName' }, { status: 400 });
    }

    const event = logEvent(sessionId, eventName, properties || {});
    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cohort = url.searchParams.get('cohort') || 'live';
  const action = url.searchParams.get('action');

  if (action === 'clear') {
    clearLiveEvents();
    return NextResponse.json({ success: true, message: 'Live events cleared' });
  }

  if (cohort === 'simulated') {
    const simulatedEvents = generateSimulatedBenchmarkCohort();
    const metrics = calculateFunnelMetrics(simulatedEvents);
    return NextResponse.json({
      cohort: 'simulated',
      isSimulated: true,
      events: simulatedEvents,
      metrics,
    });
  }

  const live = getLiveEvents();
  const metrics = calculateFunnelMetrics(live);
  return NextResponse.json({
    cohort: 'live',
    isSimulated: false,
    events: live,
    metrics,
  });
}
