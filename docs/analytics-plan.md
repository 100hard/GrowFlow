# Analytics Plan: GrowthFlow Instrumentation & Metrics

**Document Status:** Complete (Phase 2 Specification)  
**Author:** APM Candidate  
**Date:** October 14, 2026  
**Audience:** Grexa AI APM Evaluation Team & Product Engineering  

---

## 1. Overview and Core Objective

The analytics plan defines the event telemetry, funnel structure, and metric calculations for GrowthFlow. Its primary objectives are:
1. Instrument the critical user path to track progress toward the core **activation event** (`campaign_approved`).
2. Measure workflow friction and time-to-value ($H_1: < 180\text{ seconds}$).
3. Safeguard users from economic risk (tracking the negative-margin alert trigger rate).
4. Strictly segregate live evaluator session telemetry from seeded benchmark cohort data.

---

## 2. Event Taxonomy & Payload Schema

All events share a common envelope structure:
```typescript
interface AnalyticsEvent {
  eventId: string;           // UUIDv4
  sessionId: string;         // Persistent browser session identifier
  timestamp: string;         // ISO-8601 UTC timestamp
  eventName: string;         // Standard event name from taxonomy below
  properties: Record<string, any>; // Event-specific payload
}
```

### Event Definitions

| Event Name | Trigger Point | Payload Properties | Product Question Answered |
| :--- | :--- | :--- | :--- |
| `onboarding_started` | User lands on intake screen and initiates planning. | `variant: 'single_form' \| 'progressive_wizard'`, `referrer: string` | How many visitors enter the campaign creation funnel? |
| `scenario_configured` | User enters café name, location vibe, and selects off-peak time window. | `businessName: string`, `dayOfWeek: string`, `timeWindow: string` | Do users complete basic store context? |
| `archetype_selected` | User chooses a campaign archetype. | `archetype: 'bundle_hook' \| 'remote_work_perk' \| 'neighbor_2pack'` | Which promotional mechanic is most popular? |
| `economics_calculated` | Feasibility engine evaluates the user's pricing and costs. | `isBundle: boolean`, `basePrice: number`, `promoPrice: number`, `totalVarCost: number \| null`, `promoContribution: number \| null`, `contributionRate: number \| null`, `breakevenMultiplier: number \| 'non_viable' \| 'unavailable'`, `hasNegativeMargin: boolean` | What proportion of users enter complete cost data? How often do proposed offers have negative margins? |
| `campaign_generation_started` | User clicks "Generate Campaign Brief". | `archetype: string`, `hasCostsProvided: boolean` | What percentage of configured scenarios attempt generation? |
| `campaign_generated` | Campaign brief is rendered in the review UI. | `generationLatencyMs: number`, `source: 'llm' \| 'deterministic_fallback'`, `tokenCount?: number` | How reliable and fast is the generation engine? Did it require fallback? |
| `campaign_generation_failed` | Generation failed due to API or network error. | `errorCode: string`, `errorMessage: string` | What is our technical generation failure rate? |
| `campaign_edited` *(Optional Action)* | User modifies copy in Instagram caption or Chalkboard spec. | `targetFormat: 'instagram' \| 'chalkboard'`, `fieldModified: string`, `characterCountDelta: number` | How often do users tweak AI drafts? Does editing correlate with higher retention? |
| `campaign_approved` **(Activation)** | User explicitly clicks "Mark as Approved". | `timeToActivateSeconds: number`, `wasEdited: boolean`, `source: 'llm' \| 'deterministic_fallback'` | Did the user successfully complete the value loop? |
| `materials_copied` | User clicks copy button on Instagram or Chalkboard spec. | `formatCopied: 'instagram' \| 'chalkboard'` | Did the user execute the handoff step to prepare for publishing? |
| `checklist_milestone_toggled` | User marks a task complete in the staff checklist. | `taskIndex: number`, `taskTitle: string`, `isCompleted: boolean` | Do users engage with operational preparation? |

---

## 3. Funnel Structure: Linear Progression vs. Optional Branches

### 3.1 Linear Funnel Stages
A key architectural principle: **The funnel must not require optional actions to advance.**
While editing is encouraged, a user who receives an outstanding initial draft and approves it immediately must be counted as activated, not dropped.

$$\text{onboarding\_started} \xrightarrow{(1)} \text{scenario\_configured} \xrightarrow{(2)} \text{economics\_calculated} \xrightarrow{(3)} \text{campaign\_generation\_started} \xrightarrow{(4)} \text{campaign\_generated} \xrightarrow{(5)} \text{campaign\_approved (Activation)}$$

### 3.2 Non-Linear / Ancillary Events
* `campaign_edited`: Recorded as an ancillary engagement action.
* `materials_copied`: Recorded as the post-activation handoff execution step.

---

## 4. Metric Formulas & Calculation Rules

### 4.1 Activation Rate (Primary Metric)
* **Numerator:** Distinct sessions with $\ge 1$ `campaign_approved` event.
* **Denominator:** Distinct sessions with $\ge 1$ `onboarding_started` event.
* **Formula:**
  $$\text{Activation Rate} = \frac{\text{Sessions with } campaign\_approved}{\text{Sessions with } onboarding\_started} \times 100$$
* **Treatment of Abandonment:** Any session that starts onboarding but closes the browser, encounters an error, or stops before clicking "Mark as Approved" is retained in the denominator as a dropped session.

### 4.2 Time to Activation ($T_{act}$)
* **Definition:** Elapsed duration (in seconds) between `onboarding_started.timestamp` and the first `campaign_approved.timestamp` within the same session.
* **Aggregation:** Median and 75th percentile across activated sessions.
* **Hypothesis Evaluation:** $H_1$ posits $\text{Median } T_{act} < 180\text{ seconds}$.

### 4.3 Generation Success Rate (System Reliability Guardrail)
* **Numerator:** Distinct sessions with `campaign_generated`.
* **Denominator:** Distinct sessions with `campaign_generation_started`.
* **Formula:**
  $$\text{Generation Success Rate} = \frac{\text{Sessions with } campaign\_generated}{\text{Sessions with } campaign\_generation\_started} \times 100$$
* **Target:** $> 98.0\%$.

### 4.4 Handoff Copy Rate
* **Numerator:** Distinct sessions with $\ge 1$ `materials_copied` event.
* **Denominator:** Distinct sessions with $\ge 1$ `campaign_approved` event.
* **Formula:**
  $$\text{Handoff Copy Rate} = \frac{\text{Sessions with } materials\_copied}{\text{Sessions with } campaign\_approved} \times 100$$
* **Hypothesis Target:** $> 75\%$.

### 4.5 Negative Margin Alert Trigger Rate (Guardrail)
* **Numerator:** Distinct sessions where `economics_calculated` had `hasNegativeMargin: true`.
* **Denominator:** Distinct sessions with `economics_calculated`.
* **Purpose:** Monitors how often café owners attempt commercially unsustainable promotions, validating the necessity of the feasibility engine.

---

## 5. Telemetry Architecture: Live Prototype vs. Benchmark Cohort

To preserve strict intellectual honesty, the application dashboard enforces a two-tier data architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GrowthFlow Analytics UI                      │
├────────────────────────────────┬────────────────────────────────┤
│    [● Live Session Telemetry]  │   [○ Simulated SMB Benchmark]  │
└────────────────────────────────┴────────────────────────────────┘
                 │                                │
                 ▼                                ▼
   ┌──────────────────────────┐     ┌──────────────────────────┐
   │ Real Session Event Log   │     │ Static Simulated Cohort  │
   │ (Captured from live      │     │ (N=250 realistic café    │
   │ browser interactions in  │     │ sessions used to display │
   │ prototype)               │     │ full funnel distributions│
   └──────────────────────────┘     │ & A/B variant demo)      │
                                    └──────────────────────────┘
```

1. **Live Session Telemetry:**
   * Persisted in browser `sessionStorage` / `localStorage` and sent to local API route.
   * Renders the evaluator's real-time action stream, exact timestamps, and actual session completion stats.
   * If the evaluator only ran 1 session, the dashboard displays $N = 1$ with exact timings and warns: *"Single-session prototype evaluation. Statistical metrics require multi-session sample."*
2. **Simulated Benchmark Cohort ($N = 250$):**
   * Prominently labeled with a visual badge: *"SIMULATED DATASET — DEMONSTRATION ONLY"*.
   * Used to illustrate how the funnel visualizer renders drop-off curves, A/B variant performance, and margin alert distributions across a statistically meaningful volume.

---

## 6. Experiment Design: Single-Form vs. Progressive-Wizard

### 6.1 Context & Hypothesis
* **Hypothesis:** A **Progressive 3-Step Wizard (Variant B)** reduces initial cognitive load, achieving a statistically higher activation rate than a **Single Long Form (Variant A)** without inflating drop-off across intermediate steps.

### 6.2 Experiment Parameters
* **Unit of Randomization:** Browser Session ID (deterministic SHA-256 hash modulo 2).
* **Control (Variant A):** Single scrollable form displaying all fields simultaneously.
* **Treatment (Variant B):** Progressive 3-step wizard with visual progress bar.
* **Primary Metric:** Activation Rate (`campaign_approved` / `onboarding_started`).
* **Secondary Metrics:** Form error rate, Median $T_{act}$, Handoff Copy Rate.

### 6.3 Power Analysis & Sample Size Math
* Baseline conversion $p_1 = 35\%$.
* Expected treatment conversion $p_2 = 40.25\%$ (15% relative lift, 5.25% absolute lift).
* Significance level $\alpha = 0.05$ (two-tailed), Power $1 - \beta = 0.80$.
* Standard sample size formula for two independent proportions:
  $$n = \frac{\left(Z_{\alpha/2}\sqrt{2\bar{p}(1-\bar{p})} + Z_{\beta}\sqrt{p_1(1-p_1) + p_2(1-p_2)}\right)^2}{(p_2 - p_1)^2}$$
  Where $\bar{p} = \frac{p_1 + p_2}{2} = 37.625\%$, $Z_{\alpha/2} = 1.96$, $Z_{\beta} = 0.84$.
* **Required Sample:** $\approx 670$ sessions per variant ($\mathbf{1,340\text{ total sessions}}$).

### 6.4 Epistemic Caveat for Prototype Evaluation
In a local portfolio environment where fewer than 50 sessions occur, **statistical significance cannot be claimed**. The evaluation report must state:
> *"The observed difference between Variant A and Variant B in this local prototype represents a small-sample directional usability test ($N < 50$), not a statistically powered clinical trial."*
