# Product Requirements Document (PRD): Configuration-Driven GrowthFlow

**Product Name:** GrowthFlow  
**Document Version:** 2.0 (Configuration-Driven Architecture)  
**Author:** APM Candidate  
**Date:** October 14, 2026  
**Status:** Implementation Specification  

---

## 1. Problem and Objective

### 1.1 Problem Statement
Small business owners across diverse industries (local food & hospitality, home services, automotive, health & wellness, retail) struggle to translate operational marketing goals (filling slow hours, launching service packages, acquiring first-time customers) into concrete, margin-safe promotional campaigns.

Existing tools fail them:
* **Generic LLMs (ChatGPT):** Act as unguided prompt boxes, producing generic corporate buzzwords and hallucinating discounts without awareness of operational capacity, labor margins, or variable costs.
* **Vertical-Specific SaaS Platforms:** Suffer from brittle hardcoding or complex setup wizards that force owners into predefined industry buckets with rigid, uneditable workflows.

### 1.2 Product Objective
Deliver an extensible, configuration-driven campaign preparation and offer-planning tool that:
1. Accepts natural-language business context and arbitrary operational constraints without fixed industry branches.
2. Selects from standard growth objectives (`fill_capacity`, `acquire_new_customers`, `promote_bundle`, `reactivate_lapsed`, `clear_inventory`).
3. Executes a composable registry of deterministic feasibility rules (`unit_contribution`, `capacity_constraint`, `budget_constraint`) with transparent missing-data handling.
4. Generates structured, authentic multi-format campaign materials (Social Post, Physical/Display Sign, Direct Message/Outreach).
5. Produces an editable, time-relative operational launch checklist.

---

## 2. Core Schemas & Domain Architecture

### 2.1 Business Profile Schema
```typescript
export type BusinessReach = 'local_foot_traffic' | 'service_area' | 'online_nationwide';

export interface OfferingItem {
  id: string;
  name: string;
  regularPrice: number;
  variableCost: number | null; // null if omitted by user
}

export interface BusinessProfile {
  businessName: string;
  description: string;          // Free-form description of business & offerings
  reach: BusinessReach;
  targetAudience: string;
  offerings: OfferingItem[];
  preferredChannels: ('social_post' | 'display_sign' | 'direct_message')[];
}
```

### 2.2 Marketing Objective Schema
```typescript
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
  additionalCost?: number;
  availableCapacityUnits?: number; // e.g. appointment slots or table seats
  targetRedemptions?: number;
  budgetLimit?: number;
}
```

### 2.3 Composable Feasibility Results Schema
```typescript
export interface FeasibilityRuleResult {
  ruleId: 'unit_contribution' | 'capacity_constraint' | 'budget_constraint';
  name: string;
  status: 'passed' | 'warning' | 'critical_alert' | 'missing_inputs';
  summary: string;
  details: Record<string, any>;
}

export interface AggregatedFeasibilityReport {
  overallStatus: 'passed' | 'warning' | 'critical_alert' | 'missing_inputs';
  results: FeasibilityRuleResult[];
}
```

---

## 3. Pluggable Feasibility Rules Specification

### Rule 1: `unit_contribution`
* **Trigger:** Activated whenever promotional pricing and offering items are configured.
* **Math:**
  $$C_{\text{var}} = \sum C_{\text{item}} + C_{\text{packaging}}$$
  $$U_{\text{base}} = \sum P_{\text{reg}} - C_{\text{var}}$$
  $$U_{\text{promo}} = P_{\text{promo}} - (C_{\text{var}} + C_{\text{extra}})$$
  $$\text{Multiplier} = \frac{U_{\text{base}}}{U_{\text{promo}}}$$
* **Thresholds & Invariants:**
  * If $U_{\text{promo}} < 0$: Status `'critical_alert'`. Multiplier rendered as `'non_viable'`.
  * If $U_{\text{promo}} = 0$: Status `'critical_alert'`. Multiplier rendered as `'non_viable'`.
  * If any offering cost is null: Status `'missing_inputs'`. No profit claim fabricated.
  * If Contribution Rate $< 35\%$: Status `'warning'` (low margin advisory).

### Rule 2: `capacity_constraint`
* **Trigger:** Activated when `availableCapacityUnits` is provided (e.g. 10 driveway slots, 15 tables).
* **Math:**
  $$\text{Utilization Rate} = \left(\frac{\text{Target Redemptions}}{\text{Available Capacity}}\right) \times 100$$
* **Thresholds & Invariants:**
  * If Utilization $> 100\%$: Status `'warning'`. Triggers operational overload flag.
  * If Utilization $\le 100\%$: Status `'passed'`.

### Rule 3: `budget_constraint`
* **Trigger:** Activated when `budgetLimit` is provided.
* **Math:**
  $$\text{Promotional Discount Per Unit} = P_{\text{base}} - P_{\text{promo}}$$
  $$\text{Max Safe Redemptions} = \left\lfloor\frac{\text{Budget Limit}}{\text{Discount Per Unit}}\right\rfloor$$
* **Thresholds & Invariants:**
  * If $\text{Target Redemptions} \times \text{Discount Per Unit} > \text{Budget Limit}$: Status `'warning'`. Triggers budget exhaustion flag.

---

## 4. Testable Acceptance Criteria

### Feasibility Engine
* **AC-1.1 (Generic Unit Economics):** Given an auto detailing service with Wash (\$60 reg, \$10 cost) + Interior Detail (\$80 reg, \$15 cost), consumables \$5, and Promo Package \$110:
  * Total Variable Cost = \$30.00
  * Baseline Price = \$140.00; Baseline Contribution = \$110.00
  * Promo Price = \$110.00; Promo Contribution = \$80.00
  * Contribution Rate = 72.7%
  * Breakeven Multiplier = $\frac{110}{80} = 1.38\times$. Status = `'passed'`.
* **AC-1.2 (Negative Margin Guard):** Given Promo Price of \$25.00 with \$30.00 variable cost, Promo Contribution must equal -\$5.00, triggering a `'critical_alert'` with Multiplier `'non_viable'`.
* **AC-1.3 (Capacity Overload Guard):** Given Available Capacity of 6 detailing slots and Target Redemptions of 10, the engine must return a `'warning'` with utilization rate $166.7\%$.
* **AC-1.4 (Missing Inputs Transparent State):** When costs are omitted, `unit_contribution` must return `'missing_inputs'` and refrain from calculating numerical profit percentages.

### Generic Campaign Generation
* **AC-2.1:** Generated brief must contain distinct sections: Rationale, Social Post format, Physical Display/Chalkboard format, Direct Message format, and Operational Caveats.
* **AC-2.2:** Anti-cliché filter must reject all forbidden marketing buzzwords (*delve*, *revolutionize*, *elevate*, *testament*, *tapestry*, *unleash*, *bespoke*).
* **AC-2.3:** System must provide a verified deterministic offline fallback for any arbitrary business description.

### Dynamic Handoff & Checklist
* **AC-3.1:** Checklist must dynamically adjust milestone offsets relative to the configured launch or slump start time ($T_0 - 30\text{m}$, $T_0 - 15\text{m}$, $T_0$).
* **AC-3.2:** Checklist descriptions and scheduled times must be fully editable by the user.
* **AC-3.3:** Dedicated 1-click clipboard copy buttons for Social Post, Display Sign, and Direct Message with visual toast feedback.

---

## 5. Regression Testing Strategy

The test suite must verify that the same planning engine, schema validators, and component renderers execute without modification across 3 distinct business profiles:
1. **Regression Fixture A:** Elena's Café & Bakery (Local food/perishable off-peak).
2. **Regression Fixture B:** Apex Mobile Auto Detailing (Service area business, appointment capacity constraint).
3. **Regression Fixture C:** Pages & Pours Indie Bookstore (Retail inventory & evening community event).
