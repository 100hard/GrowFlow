/**
 * GrowthFlow Industry Regression Test Fixtures
 *
 * Demonstrates that the configuration-driven architecture handles arbitrary small
 * businesses without code changes or conditional industry branching.
 */

import type { BusinessProfile, CampaignObjectiveConfig } from './types.ts';

export interface BusinessScenarioFixture {
  id: string;
  label: string;
  industryCategory: string;
  profile: BusinessProfile;
  objective: CampaignObjectiveConfig;
}

export const CAFE_REGRESSION_FIXTURE: BusinessScenarioFixture = {
  id: 'cafe_slump',
  label: 'Neighborhood Café & Bakery (Regression Test)',
  industryCategory: 'Food & Beverage / Hospitality',
  profile: {
    businessName: 'The Daily Grind Café & Bakehouse',
    description: 'Independent specialty espresso bar and scratch bakery serving neighbors and remote workers.',
    reach: 'local_foot_traffic',
    targetAudience: 'Neighborhood regulars, students, and remote workers looking for an afternoon recharge.',
    preferredChannels: ['social_post', 'display_sign'],
    offerings: [
      { id: 'item-1', name: 'Oat Milk Honey Latte', regularPrice: 5.5, variableCost: 1.2 },
      { id: 'item-2', name: 'Fresh Cardamom Bun', regularPrice: 4.5, variableCost: 1.8 },
    ],
  },
  objective: {
    type: 'fill_capacity',
    label: 'Weekday Afternoon Slump',
    description: 'Attract 15 customers during slow Tuesday & Wednesday 2-5 PM hours.',
    targetWindow: {
      days: 'Tuesday & Wednesday',
      startTime: '14:00',
      endTime: '17:00',
    },
    promoPrice: 7.5,
    additionalCost: 0.25, // packaging
    availableCapacityUnits: 20, // café table seats
    targetRedemptions: 12,
  },
};

export const AUTO_DETAILING_FIXTURE: BusinessScenarioFixture = {
  id: 'auto_detailing',
  label: 'Apex Mobile Auto Detailing',
  industryCategory: 'Mobile Automotive / Trade Services',
  profile: {
    businessName: 'Apex Mobile Auto Detailing',
    description: 'On-demand mobile vehicle detailing van serving homeowners and professionals in their driveways.',
    reach: 'service_area',
    targetAudience: 'Busy homeowners and professionals who want premium vehicle cleaning without leaving their house.',
    preferredChannels: ['direct_message', 'social_post'],
    offerings: [
      { id: 'det-1', name: 'Foam Hand Wash & Decontamination', regularPrice: 65.0, variableCost: 12.0 },
      { id: 'det-2', name: 'Interior Steam Clean & Conditioning', regularPrice: 85.0, variableCost: 18.0 },
    ],
  },
  objective: {
    type: 'promote_bundle',
    label: 'Driveway Refresh Duo Package',
    description: 'Promote full exterior foam wash + interior steam package to boost ticket value.',
    targetWindow: {
      days: 'Wednesday & Thursday',
      startTime: '09:00',
      endTime: '14:00',
    },
    promoPrice: 119.0,
    additionalCost: 4.0, // chemicals & microfiber wear
    availableCapacityUnits: 6, // max 6 detailing appointments per day
    targetRedemptions: 5,
    budgetLimit: 200.0,
  },
};

export const BOOKSTORE_FIXTURE: BusinessScenarioFixture = {
  id: 'bookstore_retail',
  label: 'Pages & Pours Indie Bookstore',
  industryCategory: 'Independent Retail & Community Lounge',
  profile: {
    businessName: 'Pages & Pours Indie Books',
    description: 'Curated independent bookstore featuring new fiction, local press, artisan loose-leaf teas, and reading nooks.',
    reach: 'local_foot_traffic',
    targetAudience: 'Local book club members, weekend shoppers, and avid readers in the historic district.',
    preferredChannels: ['display_sign', 'social_post'],
    offerings: [
      { id: 'bk-1', name: 'Staff Pick Paperback Novel', regularPrice: 18.0, variableCost: 9.0 },
      { id: 'bk-2', name: 'Pot of Artisan Herbal Tea', regularPrice: 6.0, variableCost: 1.0 },
    ],
  },
  objective: {
    type: 'acquire_new_customers',
    label: 'New Reader Welcome Pack',
    description: 'Welcome first-time readers with a novel + loose-leaf tea tasting combo.',
    targetWindow: {
      days: 'Thursday Evening',
      startTime: '17:00',
      endTime: '20:00',
    },
    promoPrice: 19.5,
    additionalCost: 0.5,
    availableCapacityUnits: 30,
    targetRedemptions: 15,
    budgetLimit: 100.0,
  },
};

export const ALL_FIXTURES: BusinessScenarioFixture[] = [
  CAFE_REGRESSION_FIXTURE,
  AUTO_DETAILING_FIXTURE,
  BOOKSTORE_FIXTURE,
];
