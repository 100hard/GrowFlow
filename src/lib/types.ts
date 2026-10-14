/**
 * Core type definitions for Configuration-Driven GrowthFlow
 *
 * Supports arbitrary small businesses through composable schemas
 * rather than hardcoded industry conditional branches.
 */

export type BusinessReach = 'local_foot_traffic' | 'service_area' | 'online_nationwide';

export interface OfferingItem {
  id: string;
  name: string;
  regularPrice: number;
  variableCost: number | null; // null if omitted by user
}

export interface BusinessProfile {
  businessName: string;
  description: string;          // Free-form description of business, offerings, and context
  reach: BusinessReach;
  targetAudience: string;
  offerings: OfferingItem[];
  preferredChannels: ('social_post' | 'display_sign' | 'direct_message')[];
}

export type MarketingObjectiveType =
  | 'fill_capacity'
  | 'acquire_new_customers'
  | 'promote_bundle'
  | 'reactivate_lapsed'
  | 'clear_inventory';

export interface CampaignObjectiveConfig {
  type: MarketingObjectiveType;
  label: string;
  description: string;
  targetWindow?: {
    days: string;
    startTime: string;
    endTime: string;
  };
  promoPrice: number;
  additionalCost?: number;         // e.g. packaging or special consumables
  availableCapacityUnits?: number; // e.g. appointment slots, tables, or labor hours
  targetRedemptions?: number;      // e.g. 10 promo sales
  budgetLimit?: number;            // e.g. $150 promo budget cap
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

export type FeasibilityRuleStatus = 'passed' | 'warning' | 'critical_alert' | 'missing_inputs';

export interface FeasibilityRuleResult {
  ruleId: 'unit_contribution' | 'capacity_constraint' | 'budget_constraint';
  name: string;
  status: FeasibilityRuleStatus;
  summary: string;
  details: Record<string, any>;
}

export interface AggregatedFeasibilityReport {
  overallStatus: FeasibilityRuleStatus;
  results: FeasibilityRuleResult[];
}

export interface SocialPostFormat {
  headline: string;
  caption: string;
  hashtags: string[];
  photoDirection: string;
}

export interface DisplaySignFormat {
  headline: string;
  bulletPoints: string[];
  timeCallout: string;
  displayTip: string;
}

export interface DirectMessageFormat {
  hook: string;
  messageBody: string;
  callToAction: string;
}

export interface CampaignBrief {
  id: string;
  createdAt: string;
  businessName: string;
  objectiveType: MarketingObjectiveType;
  strategicRationale: string;
  customerHook: string;
  formats: {
    socialPost: SocialPostFormat;
    displaySign: DisplaySignFormat;
    directMessage: DirectMessageFormat;
  };
  operationalCaveats: string[];
  feasibilityReport: AggregatedFeasibilityReport;
  source: 'llm' | 'deterministic_fallback';
  status: 'draft' | 'approved';

  // Backward compatibility accessors for existing test helpers
  instagram?: SocialPostFormat;
  chalkboard?: DisplaySignFormat;
  archetype?: string;
}

export interface ChecklistMilestone {
  id: string;
  offsetMinutes: number; // relative to campaign launch / slump start time
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

// Backward compatibility types for legacy intake and regression tests
export interface MenuItemInput {
  id: string;
  name: string;
  regularPrice: number;
  unitCost?: number | null;
  variableCost?: number | null;
}

export interface IntakeScenarioInput {
  businessName: string;
  neighborhoodVibe: string;
  slumpDay: string;
  slumpStartTime: string;
  slumpEndTime: string;
  archetype: 'bundle_hook' | 'remote_work_perk' | 'neighbor_2pack' | string;
  items: MenuItemInput[];
  packagingCost?: number;
  promoPrice: number;
  extraPromoCost?: number;
}

