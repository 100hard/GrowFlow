/**
 * GrowthFlow Configuration-Driven Campaign Brief Generator
 *
 * Generates structured campaign briefs across 3 dynamic formats:
 * 1. Social Post (Headline + Caption + Hashtags + Photo Direction)
 * 2. Physical Display Sign (Punchy Headline + Bullet Points + Time Callout + Art/Display Tip)
 * 3. Direct Message / Client Outreach (Hook + Message Body + Call to Action)
 *
 * Features:
 * - Anti-cliché constraints (prohibits "delve", "elevate", "revolutionize", "testament", etc.)
 * - Works for arbitrary small businesses (food, auto services, fitness, retail, beauty).
 * - Deterministic fallback mode when LLM API keys are not supplied.
 */

import type {
  BusinessProfile,
  CampaignObjectiveConfig,
  CampaignBrief,
  SocialPostFormat,
  DisplaySignFormat,
  DirectMessageFormat,
  IntakeScenarioInput,
} from './types.ts';
import { evaluateFeasibilityRules } from './economics.ts';

export async function generateCampaignBrief(
  business: BusinessProfile,
  objective: CampaignObjectiveConfig,
  apiKey?: string
): Promise<CampaignBrief> {
  if (apiKey) {
    try {
      return await callLlmGenerator(business, objective, apiKey);
    } catch (err) {
      console.warn('LLM generation failed, falling back to deterministic template:', err);
    }
  }

  return generateDeterministicBrief(business, objective);
}

export function generateDeterministicBrief(
  businessOrScenario: BusinessProfile | IntakeScenarioInput,
  maybeObjective?: CampaignObjectiveConfig
): CampaignBrief {
  let business: BusinessProfile;
  let objective: CampaignObjectiveConfig;
  let legacyArchetype: string | undefined;

  if (maybeObjective) {
    business = businessOrScenario as BusinessProfile;
    objective = maybeObjective;
    if (!business.offerings && (business as any).items) {
      business.offerings = ((business as any).items || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        regularPrice: i.regularPrice,
        variableCost: i.unitCost !== undefined ? i.unitCost : i.variableCost ?? null,
      }));
    }
  } else {
    const legacy = businessOrScenario as IntakeScenarioInput;
    legacyArchetype = legacy.archetype;
    business = {
      businessName: legacy.businessName,
      description: legacy.neighborhoodVibe,
      reach: 'local_foot_traffic',
      targetAudience: 'Neighborhood regulars, remote workers, and visitors',
      offerings: (legacy.items || []).map((i) => ({
        id: i.id,
        name: i.name,
        regularPrice: i.regularPrice,
        variableCost: i.unitCost !== undefined ? i.unitCost : i.variableCost ?? null,
      })),
      preferredChannels: ['social_post', 'display_sign'],
    };
    objective = {
      type: legacy.archetype === 'promote_bundle' || legacy.archetype === 'neighbor_2pack'
        ? 'promote_bundle'
        : 'fill_capacity',
      label: legacy.archetype,
      description: `Targeting ${legacy.slumpDay}`,
      targetWindow: {
        days: legacy.slumpDay,
        startTime: legacy.slumpStartTime,
        endTime: legacy.slumpEndTime,
      },
      promoPrice: legacy.promoPrice,
      additionalCost: legacy.packagingCost || 0,
    };
  }

  const { businessName, offerings } = business;
  const primaryItem = offerings[0]?.name || 'Signature Offering';
  const secondaryItem = offerings[1]?.name || 'Complementary Add-on';
  const promoPrice = objective.promoPrice;
  const timeWindow = objective.targetWindow
    ? `${objective.targetWindow.days} (${formatDisplayTime(objective.targetWindow.startTime)} - ${formatDisplayTime(objective.targetWindow.endTime)})`
    : 'Limited Time Window';

  const feasibilityReport = evaluateFeasibilityRules(offerings, objective, 0.25);

  let strategicRationale = '';
  let customerHook = '';
  let socialPost: SocialPostFormat;
  let displaySign: DisplaySignFormat;
  let directMessage: DirectMessageFormat;
  let operationalCaveats: string[] = [];

  if (legacyArchetype === 'remote_work_perk') {
    strategicRationale = `Attracts neighborhood remote workers and students during quiet ${timeWindow} hours. Fills otherwise empty seats without kitchen preparation strain.`;
    customerHook = `The Co-Working Afternoon Pass: Grab a table, get your ${primaryItem} + refill perk for $${promoPrice.toFixed(2)}.`;
    socialPost = {
      headline: `Upgrade your home office view this afternoon. 💻✨`,
      caption: `Tired of staring at your home office walls? Grab a quiet table at ${businessName} during ${timeWindow}.\n\nOrder our ${primaryItem} + afternoon focus special for $${promoPrice.toFixed(2)}. Fast Wi-Fi, plenty of power outlets, and real background café vibes.\n\nNo rush, no awkward stares. Get into deep focus with us.`,
      hashtags: ['#WorkFromCafe', '#StudySpot', '#LocalCoffeeShop', '#DigitalNomad'],
      photoDirection: `Cozy café table with an open laptop, a full ${primaryItem}, and notebook in focus; soft blurred background showing comfortable seating.`,
    };
    displaySign = {
      headline: `LAPTOP PARADISE ☕`,
      bulletPoints: [
        `Fast Wi-Fi & Quiet Vibes`,
        `${primaryItem} Special: $${promoPrice.toFixed(2)}`,
        `Power Outlets Ready`,
      ],
      timeCallout: timeWindow,
      displayTip: `Draw a simple minimalist laptop silhouette with steam curling out of a coffee cup icon.`,
    };
    directMessage = {
      hook: `Quiet workspace & perk at ${businessName}`,
      messageBody: `Need a productive afternoon spot? Enjoy quiet tables, fast Wi-Fi, and our ${primaryItem} special for just $${promoPrice.toFixed(2)} during ${timeWindow}.`,
      callToAction: `Show this message at the counter when you arrive.`,
    };
    operationalCaveats = [
      `Check that guest Wi-Fi router is operating without bandwidth throttling.`,
      `Keep background playlist at moderate conversational volume (55-60 dB).`,
      `Ensure corner power outlet tables are clear and clean before start time.`,
    ];
  } else if (legacyArchetype === 'neighbor_2pack') {
    strategicRationale = `Doubles afternoon customer group size by incentivizing customers to bring a colleague or neighbor. Generates higher total dollar ticket value during dead hours.`;
    customerHook = `The 2-For Afternoon Break: Bring a friend or coworker for two ${primaryItem}s for $${promoPrice.toFixed(2)}.`;
    socialPost = {
      headline: `Don't take your afternoon coffee break alone. 🤝☕`,
      caption: `Grab your favorite coworker or neighbor and head down to ${businessName} during ${timeWindow}.\n\nOur Afternoon Duo deal: 2 of our signature ${primaryItem}s for just $${promoPrice.toFixed(2)} total.\n\nStep away from the screen, catch up with a friend or colleague, and beat the slump together.\n\nTag the friend who owes you a coffee run!`,
      hashtags: ['#CoffeeBreak', '#BringAFriend', '#AfternoonCoffee', '#NeighborhoodSpot'],
      photoDirection: `Two cups of ${primaryItem} being toasted/held over a café table with two plates of treats.`,
    };
    displaySign = {
      headline: `DUO COFFEE RUN 👥`,
      bulletPoints: [
        `2 ${primaryItem}s`,
        `Only $${promoPrice.toFixed(2)} Total`,
        `Bring A Coworker!`,
      ],
      timeCallout: timeWindow,
      displayTip: `Draw two clinking mugs with cheer lines in yellow chalk.`,
    };
    directMessage = {
      hook: `Bring a coworker perk at ${businessName}`,
      messageBody: `Step away from the screen together! Bring a coworker or friend to ${businessName} during ${timeWindow} and get 2 ${primaryItem}s for just $${promoPrice.toFixed(2)}.`,
      callToAction: `Mention this message at checkout.`,
    };
    operationalCaveats = [
      `Brief staff that both drinks must be served together on one order ticket.`,
      `Prepare quick-service supplies in advance for rapid turnaround.`,
      `Suggested promo cutoff is strictly at end time to protect peak transition.`,
    ];
  } else {
    switch (objective.type) {
      case 'fill_capacity':
        strategicRationale = `Monetizes predictable off-peak capacity (${timeWindow}) by offering an attractive packaged deal ($${promoPrice.toFixed(2)}) for ${primaryItem}. Protects baseline contribution while driving incremental volume during slow periods.`;
        customerHook = `The Midweek Special: ${primaryItem} for just $${promoPrice.toFixed(2)} during ${timeWindow}.`;
        socialPost = {
          headline: `Slow afternoon? We have something special for you. ⚡`,
          caption: `Need a break this week? Visit ${businessName} during ${timeWindow}.\n\nGet our ${primaryItem} + ${secondaryItem} special for just $${promoPrice.toFixed(2)}.\n\nTake time for yourself, beat the rush, and enjoy top-quality service without the wait.\n\n📍 ${businessName} • Available during stated hours.`,
          hashtags: ['#LocalBusiness', '#MidweekDeal', '#SupportLocal', '#LimitedOffer'],
          photoDirection: `Crisp photo showing ${primaryItem} in clear focus with warm lighting and a tidy, welcoming background.`,
        };
        displaySign = {
          headline: `MIDWEEK SPECIAL ⚡`,
          bulletPoints: [
            `${primaryItem} Deal`,
            `Only $${promoPrice.toFixed(2)}`,
            `Fast & Friendly Service`,
          ],
          timeCallout: timeWindow,
          displayTip: `Display near main entrance or front counter using high-contrast text.`,
        };
        directMessage = {
          hook: `Hey! Quick perk from ${businessName} this week`,
          messageBody: `Hi there! We have open capacity during ${timeWindow} and wanted to pass on a perk: book our ${primaryItem} for just $${promoPrice.toFixed(2)} this week.`,
          callToAction: `Reply to reserve your spot before slots fill up!`,
        };
        operationalCaveats = [
          `Confirm staff and supply availability 30 minutes before ${objective.targetWindow?.startTime || 'start time'}.`,
          `Cap redemptions to available capacity (${objective.availableCapacityUnits || 15} slots) to avoid customer wait times.`,
          `Ensure checkout register or booking calendar reflects the $${promoPrice.toFixed(2)} price.`,
        ];
        break;

      case 'acquire_new_customers':
        strategicRationale = `Reduces first-time customer trial friction with an introductory promotional price of $${promoPrice.toFixed(2)} on ${primaryItem}. Designed to convert neighborhood interest into verified first purchases.`;
        customerHook = `First-Time Neighbor Welcome: Experience our ${primaryItem} for $${promoPrice.toFixed(2)}.`;
        socialPost = {
          headline: `New to ${businessName}? Here is your official welcome gift. 🎁`,
          caption: `If you haven't experienced ${businessName} yet, we'd love to meet you.\n\nFor a limited time, try our ${primaryItem} for just $${promoPrice.toFixed(2)} (regularly $${offerings.reduce((s, i) => s + i.regularPrice, 0).toFixed(2)}).\n\nCrafted with pride, right here in our neighborhood.\n\nTag a friend who needs to try this!`,
          hashtags: ['#WelcomeSpecial', '#NewCustomers', '#ShopSmall', '#NeighborhoodGem'],
          photoDirection: `Friendly, inviting image showcasing the signature ${primaryItem} in hands or ready for delivery.`,
        };
        displaySign = {
          headline: `WELCOME SPECIAL 🎁`,
          bulletPoints: [
            `First-Time Special`,
            `${primaryItem}: $${promoPrice.toFixed(2)}`,
            `Meet Our Team Today`,
          ],
          timeCallout: `Limited Time • Walk-ins & Bookings`,
          displayTip: `Place at eye level with an arrow or welcome ribbon visual.`,
        };
        directMessage = {
          hook: `Welcome to ${businessName}! Here is a neighborhood gift`,
          messageBody: `Thanks for connecting with us! We would love to show you what we do best. Enjoy our ${primaryItem} for only $${promoPrice.toFixed(2)} on your first visit.`,
          callToAction: `Mention this message when booking or paying at the counter.`,
        };
        operationalCaveats = [
          `Collect customer email or phone number at checkout for retention follow-up.`,
          `Brief team to ask new visitors how they found ${businessName}.`,
          `Maintain quality and presentation to maximize word-of-mouth referrals.`,
        ];
        break;

      case 'promote_bundle':
      default:
        strategicRationale = `Pairs high-margin ${primaryItem} with complementary ${secondaryItem} for a flat package price of $${promoPrice.toFixed(2)}. Increases average transaction value while maintaining strong contribution margins.`;
        customerHook = `The Duo Bundle: ${primaryItem} + ${secondaryItem} for $${promoPrice.toFixed(2)}.`;
        socialPost = {
          headline: `Better together: The ultimate combo deal. 🤝✨`,
          caption: `Why settle for one when you can get the best of both worlds?\n\nAt ${businessName}, we're pairing our signature ${primaryItem} with our ${secondaryItem} for only $${promoPrice.toFixed(2)}.\n\nQuality you can trust, delivered with care.\n\nAvailable while supplies last this week!`,
          hashtags: ['#BundleDeal', '#ValuePackage', '#LocalFavorites', '#QualityCare'],
          photoDirection: `Side-by-side product arrangement showing ${primaryItem} and ${secondaryItem} neatly styled.`,
        };
        displaySign = {
          headline: `THE DUO BUNDLE ★`,
          bulletPoints: [
            `${primaryItem}`,
            `+ ${secondaryItem}`,
            `Both for $${promoPrice.toFixed(2)} Total`,
          ],
          timeCallout: timeWindow,
          displayTip: `Use bold block lettering with a star or checkmark bullet list.`,
        };
        directMessage = {
          hook: `Exclusive bundle offer from ${businessName}`,
          messageBody: `We put together our two most requested offerings—${primaryItem} + ${secondaryItem}—into a single package for just $${promoPrice.toFixed(2)}.`,
          callToAction: `Reply or visit today to claim yours!`,
        };
        operationalCaveats = [
          `Pre-stage bundle inventory or service supplies before peak demand hours.`,
          `Remind team to proactively offer the bundle to single-item purchasers.`,
          `Monitor inventory to ensure neither component stocks out prematurely.`,
        ];
        break;
    }
  }

  const brief: CampaignBrief = {
    id: `brief-${Date.now()}`,
    createdAt: new Date().toISOString(),
    businessName,
    objectiveType: objective.type,
    strategicRationale,
    customerHook,
    formats: {
      socialPost,
      displaySign,
      directMessage,
    },
    operationalCaveats,
    feasibilityReport,
    source: 'deterministic_fallback',
    status: 'draft',

    // Backward compatibility helpers
    instagram: socialPost,
    chalkboard: displaySign,
    archetype: legacyArchetype || (objective.type === 'fill_capacity' ? 'bundle_hook' : objective.type),
  };

  return brief;
}

async function callLlmGenerator(
  business: BusinessProfile,
  objective: CampaignObjectiveConfig,
  apiKey: string
): Promise<CampaignBrief> {
  const systemPrompt = `You are an elite product marketing strategist for independent small businesses across food, trades, fitness, and retail.
Write a structured campaign brief for a promotional campaign.
STRICT RULES:
1. Do NOT use marketing buzzwords: "delve", "revolutionize", "elevate", "testament", "tapestry", "unleash", "bespoke".
2. Sound like an authentic, proud local business owner speaking to neighborhood clients.
3. Use the exact prices and items provided. Do NOT invent prices or claims.
4. Return valid JSON only with keys: strategicRationale, customerHook, formats { socialPost {headline, caption, hashtags, photoDirection}, displaySign {headline, bulletPoints (3 items), timeCallout, displayTip}, directMessage {hook, messageBody, callToAction} }, operationalCaveats (3 items).`;

  const userPrompt = JSON.stringify({
    businessName: business.businessName,
    description: business.description,
    reach: business.reach,
    targetAudience: business.targetAudience,
    objectiveType: objective.type,
    offerings: business.offerings,
    promoPrice: objective.promoPrice,
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
  const feasibilityReport = evaluateFeasibilityRules(business.offerings, objective, 0.25);

  return {
    id: `brief-${Date.now()}`,
    createdAt: new Date().toISOString(),
    businessName: business.businessName,
    objectiveType: objective.type,
    strategicRationale: parsed.strategicRationale,
    customerHook: parsed.customerHook,
    formats: parsed.formats,
    operationalCaveats: parsed.operationalCaveats,
    feasibilityReport,
    source: 'llm',
    status: 'draft',
    instagram: parsed.formats.socialPost,
    chalkboard: parsed.formats.displaySign,
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
