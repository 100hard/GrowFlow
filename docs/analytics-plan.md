# Analytics Plan: Configuration-Driven Telemetry & Funnel Specification

**Document Status:** Approved Specification (Configuration-Driven)  
**Author:** APM Candidate  
**Date:** October 14, 2026  
**Audience:** Grexa AI APM Evaluation Team & Product Engineering  

---

## 1. Overview and Core Objective

The analytics engine measures user progression through the configuration-driven campaign preparation workflow.
Key objectives:
1. Instrument the critical user path toward the core **activation event** (`campaign_approved`).
2. Track usage of marketing objectives (`fill_capacity`, `acquire_new_customers`, `promote_bundle`, etc.) and business reach categories without hardcoding industry silos.
3. Monitor the trigger rates of composable feasibility rules (e.g. negative margin alerts, capacity overload warnings).
4. Strictly segregate live evaluator session telemetry from seeded benchmark cohort data.

---

## 2. Event Taxonomy & Payload Schema

All events share the standard envelope:
```typescript
interface AnalyticsEvent {
  eventId: string;
  sessionId: string;
  timestamp: string;
  eventName: string;
  properties: Record<string, any>;
}
```

### Event Definitions

| Event Name | Trigger Point | Payload Properties | Product Question Answered |
| :--- | :--- | :--- | :--- |
| `onboarding_started` | User lands on intake screen. | `variant: 'single_form' \| 'progressive_wizard'`, `referrer: string` | How many visitors enter the campaign creation funnel? |
| `profile_configured` | User inputs business name, free-form description, and reach. | `businessName: string`, `reach: string`, `channels: string[]` | Do users complete basic business context? |
| `objective_selected` | User chooses an objective. | `objective: string` (`fill_capacity`, `acquire_new_customers`, etc.) | What growth job is most common among SMBs? |
| `feasibility_evaluated` | Feasibility engine evaluates composable rules. | `rulesEvaluated: string[]`, `overallStatus: string`, `hasNegativeMargin: boolean`, `hasCapacityOverload?: boolean` | How often do proposed promotions fail economic or capacity feasibility? |
| `campaign_generation_started` | User clicks "Generate Campaign Brief". | `objective: string`, `rulesEvaluated: string[]` | What percentage of configured scenarios attempt generation? |
| `campaign_generated` | Campaign brief is rendered. | `generationLatencyMs: number`, `source: 'llm' \| 'deterministic_fallback'` | How reliable and fast is the generation engine? Did it require fallback? |
| `campaign_generation_failed` | Generation failed due to API or network error. | `errorCode: string`, `errorMessage: string` | What is our technical generation failure rate? |
| `campaign_edited` *(Optional Action)* | User modifies copy in any format tab. | `targetFormat: string`, `fieldModified: string` | How often do users tweak AI drafts? Does editing correlate with retention? |
| `campaign_approved` **(Activation)** | User explicitly clicks "Mark as Approved". | `timeToActivateSeconds: number`, `wasEdited: boolean`, `source: string` | Did the user successfully complete the value loop? |
| `materials_copied` | User clicks copy button on any format card. | `formatCopied: string` (`social_post`, `display_sign`, `direct_message`) | Did the user execute the handoff step? |
| `checklist_milestone_toggled` | User marks a task complete in the checklist. | `taskId: string`, `isCompleted: boolean` | Do users engage with operational preparation? |

---

## 3. Linear Funnel Progression vs. Optional Branches

### 3.1 Linear Funnel Stages
$$\text{onboarding\_started} \longrightarrow \text{profile\_configured} \longrightarrow \text{feasibility\_evaluated} \longrightarrow \text{campaign\_generation\_started} \longrightarrow \text{campaign\_generated} \longrightarrow \text{campaign\_approved (Activation)}$$

* `campaign_edited` is an optional engagement action. Unedited sessions proceed directly to approval without penalty.
* `materials_copied` is recorded as the post-activation handoff execution step.

---

## 4. Metric Formulas & Calculation Rules

### 4.1 Activation Rate (Primary Metric)
$$\text{Activation Rate} = \frac{\text{Sessions with } campaign\_approved}{\text{Sessions with } onboarding\_started} \times 100$$
* Failed or abandoned sessions before approval are retained in the denominator as drop-offs.

### 4.2 Time to Activation ($T_{act}$)
* Elapsed duration (in seconds) between `onboarding_started.timestamp` and `campaign_approved.timestamp`.
* Evaluates $H_1: \text{Median } T_{act} < 180\text{ seconds}$.

### 4.3 Composable Guardrail Rates
* **Negative Margin Alert Rate:** % of evaluated sessions that triggered a critical negative margin warning.
* **Capacity Overload Rate:** % of evaluated sessions where promotional volume exceeded available operational slots.

---

## 5. Live Telemetry vs. Simulated Benchmark Separation

* **Live Session Telemetry:** Persisted in `sessionStorage` and local state; shows only the evaluator's real actions.
* **Simulated Benchmark Cohort ($N = 250$):** Clearly labeled with an amber warning badge (*"SIMULATED DATASET — DEMONSTRATION ONLY"*); illustrates drop-off curves and A/B variant performance across varied small businesses.
