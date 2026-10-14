/**
 * Core type definitions for GrowthFlow
 */

export type CampaignArchetype = 'bundle_hook' | 'remote_work_perk' | 'neighbor_2pack';

export interface MenuItemInput {
  id: string;
  name: string;
  regularPrice: number;
  unitCost: number | null; // null if omitted by user
}

export interface IntakeScenarioInput {
  businessName: string;
  neighborhoodVibe: string; // e.g. "Warm community neighborhood café near campus/offices"
  slumpDay: string;         // e.g. "Tuesday & Wednesday"
  slumpStartTime: string;   // e.g. "14:00"
  slumpEndTime: string;     // e.g. "17:00"
  archetype: CampaignArchetype;
  items: MenuItemInput[];
  packagingCost: number;    // default 0.25
  promoPrice: number;
  extraPromoCost: number;   // default 0.00
  notes?: string;
}

export type MultiplierValue = number | 'non_viable' | 'unavailable';

export interface ContributionEconomicsResult {
  baselinePrice: number;
  totalVariableCost: number | null;
  baselineContribution: number | null;
  baselineContributionRate: number | null;
  promoPrice: number;
  promoContribution: number | null;
  promoContributionRate: number | null;
  breakevenMultiplier: MultiplierValue;
  breakeven10SalesVolume: MultiplierValue;
  hasNegativeContribution: boolean;
  hasZeroContribution: boolean;
  hasThinMarginWarning: boolean;
  hasMissingCost: boolean;
  validationError?: string;
}

export interface InstagramFormat {
  headline: string;
  caption: string;
  hashtags: string[];
  photoDirection: string;
}

export interface ChalkboardFormat {
  headline: string;
  bulletPoints: string[];
  timeCallout: string;
  drawingTip: string;
}

export interface CampaignBrief {
  id: string;
  createdAt: string;
  archetype: CampaignArchetype;
  strategicRationale: string;
  customerHook: string;
  instagram: InstagramFormat;
  chalkboard: ChalkboardFormat;
  operationalCaveats: string[];
  source: 'llm' | 'deterministic_fallback';
  status: 'draft' | 'approved';
}

export interface ChecklistMilestone {
  id: string;
  offsetMinutes: number; // relative to slumpStartTime, e.g. -30, -15, 0
  timeString: string;    // e.g. "13:30"
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface AnalyticsEvent {
  eventId: string;
  sessionId: string;
  timestamp: string;
  eventName: string;
  properties: Record<string, any>;
}

export interface FunnelMetric {
  stage: string;
  label: string;
  count: number;
  conversionFromPrevious: number; // percentage (0-100)
  dropOffCount: number;
  dropOffRate: number;            // percentage (0-100)
}

export interface FunnelAnalysisResult {
  funnelStages: FunnelMetric[];
  activationRate: number;        // percentage (0-100)
  handoffCopyRate: number;       // percentage (0-100)
  totalSessions: number;
  activatedSessions: number;
  medianTimeToActivateSeconds: number | null;
  p75TimeToActivateSeconds: number | null;
  negativeMarginAlertRate: number; // percentage
  optionalEditRate: number;       // percentage
}

