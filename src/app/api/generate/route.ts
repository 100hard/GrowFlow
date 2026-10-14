import { NextRequest, NextResponse } from 'next/server.js';
import { generateCampaignBrief } from '../../../lib/generator';
import type { IntakeScenarioInput } from '../../../lib/types';

export async function POST(req: NextRequest) {
  try {
    const scenario: IntakeScenarioInput = await req.json();

    if (!scenario.businessName || !scenario.slumpStartTime || !scenario.promoPrice) {
      return NextResponse.json(
        { error: 'Missing required scenario parameters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    const brief = await generateCampaignBrief(scenario, apiKey);

    return NextResponse.json(brief);
  } catch (error: any) {
    console.error('Generation API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate campaign brief' },
      { status: 500 }
    );
  }
}
