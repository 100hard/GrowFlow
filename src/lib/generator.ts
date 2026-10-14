/**
 * GrowthFlow Campaign Brief Generator
 *
 * Generates structured campaign briefs across 2 local formats:
 * 1. Organic Instagram Post (Caption + Suggested Photo)
 * 2. Sidewalk Chalkboard Sign (Hook + Bullet Points + Timing)
 *
 * Features:
 * - Anti-cliché constraints (no "delve", "elevate", "revolutionize", "testament").
 * - High-quality deterministic templates for zero-latency, reliable offline mode.
 * - Deterministic fallback mode when LLM API keys are not supplied.
 */

import type { IntakeScenarioInput, CampaignBrief } from './types.ts';

export async function generateCampaignBrief(
  scenario: IntakeScenarioInput,
  apiKey?: string
): Promise<CampaignBrief> {
  const startTime = Date.now();

  // If API key is provided, attempt LLM call with strict constraints
  if (apiKey) {
    try {
      const brief = await callLlmGenerator(scenario, apiKey);
      return brief;
    } catch (err) {
      console.warn('LLM generation failed, falling back to deterministic template:', err);
      // Fall through to deterministic template
    }
  }

  // Deterministic fallback generator (100% reliable, zero external dependencies)
  return generateDeterministicBrief(scenario);
}

export function generateDeterministicBrief(scenario: IntakeScenarioInput): CampaignBrief {
  const { businessName, slumpDay, slumpStartTime, slumpEndTime, archetype, items, promoPrice } = scenario;
  const primaryItem = items[0]?.name || 'Specialty Coffee';
  const secondaryItem = items[1]?.name || 'Fresh Pastry';
  const timeWindow = `${formatDisplayTime(slumpStartTime)} - ${formatDisplayTime(slumpEndTime)}`;

  switch (archetype) {
    case 'bundle_hook':
      return {
        id: `brief-${Date.now()}`,
        createdAt: new Date().toISOString(),
        archetype: 'bundle_hook',
        strategicRationale: `Monetizes slow ${slumpDay} afternoons by pairing high-margin ${primaryItem} with fresh-baked ${secondaryItem} at a bundled price ($${promoPrice.toFixed(2)}). Preserves dollar contribution while clearing daily bakery inventory.`,
        customerHook: `The Midweek Recharge: ${primaryItem} + ${secondaryItem} for $${promoPrice.toFixed(2)} between ${timeWindow}.`,
        instagram: {
          headline: `Afternoon slump? We solved it. ☕🥐`,
          caption: `${slumpDay} afternoons just got a whole lot better at ${businessName}.\n\nBetween ${timeWindow}, pair your favorite ${primaryItem} with our fresh-baked ${secondaryItem} for just $${promoPrice.toFixed(2)}.\n\nTake a 20-minute breather, grab a table by the window, and recharge for the rest of your week. Baked fresh this morning, poured hot right now.\n\n📍 See you on the corner. Available dine-in or to-go.`,
          hashtags: ['#LocalCoffee', '#AfternoonPickMeUp', '#CoffeeAndPastry', '#MidweekTreat'],
          photoDirection: `Close-up shot of a steaming ${primaryItem} next to a fresh ${secondaryItem} on a wooden tabletop with natural afternoon window sunlight.`,
        },
        chalkboard: {
          headline: `AFTERNOON RESET ⚡`,
          bulletPoints: [
            `${primaryItem} + ${secondaryItem}`,
            `Just $${promoPrice.toFixed(2)}`,
            `Dine-in or Walk-in`,
          ],
          timeCallout: `${slumpDay} • ${timeWindow}`,
          drawingTip: `Draw a simple steaming cup icon next to a croissant sketch in white/yellow chalk.`,
        },
        operationalCaveats: [
          `Ensure front counter pastry display is stocked with at least 15-20 units before ${slumpStartTime}.`,
          `Instruct on-duty barista to suggest the bundle to any customer ordering a drink alone.`,
          `Limit to in-store counter orders to avoid 30% delivery commission loss.`,
        ],
        source: 'deterministic_fallback',
        status: 'draft',
      };

    case 'remote_work_perk':
      return {
        id: `brief-${Date.now()}`,
        createdAt: new Date().toISOString(),
        archetype: 'remote_work_perk',
        strategicRationale: `Attracts neighborhood remote workers and students during quiet ${slumpDay} afternoon hours. Fills otherwise empty café seats without adding kitchen preparation strain.`,
        customerHook: `The Co-Working Afternoon Pass: Grab a table, get your ${primaryItem} + refill perk for $${promoPrice.toFixed(2)}.`,
        instagram: {
          headline: `Upgrade your home office view this afternoon. 💻✨`,
          caption: `Tired of staring at your home office walls? Grab a quiet table at ${businessName} between ${timeWindow} on ${slumpDay}.\n\nOrder our ${primaryItem} + afternoon focus special for $${promoPrice.toFixed(2)}. Fast Wi-Fi, plenty of power outlets, and real background café vibes.\n\nNo rush, no awkward stares. Get into deep focus with us.`,
          hashtags: ['#WorkFromCafe', '#StudySpot', '#LocalCoffeeShop', '#DigitalNomad'],
          photoDirection: `Cozy café table with an open laptop, a full ${primaryItem}, and notebook in focus; soft blurred background showing comfortable seating.`,
        },
        chalkboard: {
          headline: `LAPTOP PARADISE ☕`,
          bulletPoints: [
            `Fast Wi-Fi & Quiet Vibes`,
            `${primaryItem} Special: $${promoPrice.toFixed(2)}`,
            `Power Outlets Ready`,
          ],
          timeCallout: `${slumpDay} • ${timeWindow}`,
          drawingTip: `Draw a simple minimalist laptop silhouette with steam curling out of a coffee cup icon.`,
        },
        operationalCaveats: [
          `Check that guest Wi-Fi router is operating without bandwidth throttling.`,
          `Keep background playlist at moderate conversational volume (55-60 dB).`,
          `Ensure corner power outlet tables are clear and clean by ${slumpStartTime}.`,
        ],
        source: 'deterministic_fallback',
        status: 'draft',
      };

    case 'neighbor_2pack':
    default:
      return {
        id: `brief-${Date.now()}`,
        createdAt: new Date().toISOString(),
        archetype: 'neighbor_2pack',
        strategicRationale: `Doubles afternoon customer group size by incentivizing customers to bring a colleague or neighbor. Generates higher total dollar ticket value during dead hours.`,
        customerHook: `The 2-For Afternoon Break: Bring a friend for two ${primaryItem}s + treats for $${promoPrice.toFixed(2)}.`,
        instagram: {
          headline: `Don't take your afternoon coffee break alone. 🤝☕`,
          caption: `Grab your favorite coworker or neighbor and head down to ${businessName} between ${timeWindow} on ${slumpDay}.\n\nOur Afternoon Duo deal: 2 of our signature ${primaryItem}s + fresh treats for just $${promoPrice.toFixed(2)} total.\n\nStep away from the screen, catch up in person, and beat the 3 PM slump together.\n\nTag the friend who owes you a coffee run!`,
          hashtags: ['#CoffeeBreak', '#BringAFriend', '#AfternoonCoffee', '#NeighborhoodSpot'],
          photoDirection: `Two cups of ${primaryItem} being toasted/held over a café table with two plates of treats.`,
        },
        chalkboard: {
          headline: `DUO COFFEE RUN 👥`,
          bulletPoints: [
            `2 ${primaryItem}s + Treats`,
            `Only $${promoPrice.toFixed(2)} Total`,
            `Bring A Coworker!`,
          ],
          timeCallout: `${slumpDay} • ${timeWindow}`,
          drawingTip: `Draw two clinking mugs with cheer lines in yellow chalk.`,
        },
        operationalCaveats: [
          `Brief baristas that both drinks must be served together on one order ticket.`,
          `Prepare quick-service cups and napkins in advance for rapid turnaround.`,
          `Suggested promo cutoff is strictly at ${slumpEndTime} to protect peak dinner/evening transition.`,
        ],
        source: 'deterministic_fallback',
        status: 'draft',
      };
  }
}

async function callLlmGenerator(scenario: IntakeScenarioInput, apiKey: string): Promise<CampaignBrief> {
  // Built-in lightweight LLM caller for OpenAI or compatible endpoints
  const systemPrompt = `You are an elite local hospitality product manager and copywriter for independent cafés.
Write a structured campaign brief for an off-peak weekday promotion.
STRICT RULES:
1. Do NOT use marketing buzzwords: "delve", "revolutionize", "elevate", "testament", "tapestry", "unleash", "bespoke".
2. Sound like a warm, genuine local business owner talking to neighborhood regulars.
3. Use the exact prices and items provided. Do NOT invent discounts or prices.
4. Return valid JSON only with keys: strategicRationale, customerHook, instagram {headline, caption, hashtags, photoDirection}, chalkboard {headline, bulletPoints (3 items), timeCallout, drawingTip}, operationalCaveats (3 items).`;

  const userPrompt = JSON.stringify({
    businessName: scenario.businessName,
    slumpWindow: `${scenario.slumpDay} ${scenario.slumpStartTime}-${scenario.slumpEndTime}`,
    archetype: scenario.archetype,
    items: scenario.items,
    promoPrice: scenario.promoPrice,
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API returned status ${response.status}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    id: `brief-${Date.now()}`,
    createdAt: new Date().toISOString(),
    archetype: scenario.archetype,
    strategicRationale: parsed.strategicRationale,
    customerHook: parsed.customerHook,
    instagram: parsed.instagram,
    chalkboard: parsed.chalkboard,
    operationalCaveats: parsed.operationalCaveats,
    source: 'llm',
    status: 'draft',
  };
}

function formatDisplayTime(timeStr: string): string {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}
