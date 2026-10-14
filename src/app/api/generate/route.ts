import { NextRequest, NextResponse } from 'next/server.js';
import { generateCampaignBrief } from '../../../lib/generator';
import type { BusinessProfile, CampaignObjectiveConfig, OfferingItem } from '../../../lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let business: BusinessProfile;
    let objective: CampaignObjectiveConfig;

    if (body.profile && body.objective) {
      business = body.profile;
      objective = body.objective;
    } else {
      // Legacy mapping for backward compatibility
      const offerings: OfferingItem[] = (body.items || []).map((i: any) => ({
        id: i.id || String(Math.random()),
        name: i.name,
        regularPrice: Number(i.regularPrice) || 0,
        variableCost: i.unitCost !== undefined ? i.unitCost : i.variableCost,
      }));

      business = {
        businessName: body.businessName || 'Local Business',
        description: body.neighborhoodVibe || 'Local independent business serving our community',
        reach: body.reach || 'local_foot_traffic',
        targetAudience: body.targetAudience || 'Local neighborhood customers',
        offerings,
        preferredChannels: ['social_post', 'display_sign'],
      };

      objective = {
        type: body.archetype === 'bundle_hook' ? 'fill_capacity' : body.archetype || 'fill_capacity',
        label: 'Promotional Campaign',
        description: 'Drive customer volume during key business hours',
        targetWindow: {
          days: body.slumpDay || 'Weekday',
          startTime: body.slumpStartTime || '14:00',
          endTime: body.slumpEndTime || '17:00',
        },
        promoPrice: Number(body.promoPrice) || 0,
        additionalCost: Number(body.packagingCost) || 0.25,
      };
    }

    if (!business.businessName || !objective.promoPrice) {
      return NextResponse.json(
        { error: 'Missing required business name or promotional price' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    const brief = await generateCampaignBrief(business, objective, apiKey);

    return NextResponse.json(brief);
  } catch (error: any) {
    console.error('Generation API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate campaign brief' },
      { status: 500 }
    );
  }
}
