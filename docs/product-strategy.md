# Product Strategy & Architecture: Configuration-Driven GrowthFlow

**Document Status:** Approved Architecture (Refactored to Configuration-Driven)  
**Author:** APM Candidate  
**Date:** October 14, 2026  
**Audience:** Grexa AI APM Evaluation Team & Product Engineering  

---

## 1. Executive Summary & Architectural Shift

GrowthFlow is an AI-assisted **campaign preparation and offer-planning tool for arbitrary small businesses**, powered by a **reusable, configuration-driven architecture**.

### The Core Architectural Principle: No Hardcoded Industries
The product must not require application-code changes whenever a user belongs to a new industry.
Application code strictly avoids industry-specific conditional branching, such as:
* *Prohibited:* `if (business.type === 'cafe') renderBundleEconomics();`
* *Prohibited:* `if (business.type === 'salon') renderBookingOffers();`
* *Prohibited:* `if (business.type === 'contractor') renderLeadGen();`

Instead, GrowthFlow structures small business marketing around **orthogonal, composable concepts**:
1. **Business Profile & Operational Context:** Natural language description, products/services, target audience, reach, constraints.
2. **Standard Marketing Objectives:** Standard commercial growth jobs (e.g., `fill_capacity`, `acquire_new_customers`, `promote_bundle`, `reactivate_lapsed`, `clear_inventory`).
3. **Pluggable Feasibility Rules:** Composable deterministic verification modules (Unit Contribution, Capacity Limits, Budget Caps).
4. **Dynamic Output Formats:** Social posts, physical/counter signs, and direct outreach scripts.
5. **Configurable Execution Checklists:** Relative operational store/business launch milestones.

The local café scenario is retained as an **ordinary regression test fixture**, not an architectural special case.

---

## 2. Business Context & Natural Language Intake

Rather than forcing users into a predetermined industry dropdown, GrowthFlow allows users to describe their business in natural language:

```typescript
interface BusinessProfile {
  businessName: string;
  description: string;          // e.g., "Mobile auto detailing operating out of a custom van in North Austin"
  offerings: OfferingItem[];    // Products or services with baseline prices and variable costs
  targetAudience: string;       // e.g., "Tech professionals and families wanting vehicle care at home"
  reach: BusinessReach;         // 'local_foot_traffic' | 'service_area' | 'online_nationwide'
  preferredChannels: Channel[]; // 'social_post' | 'display_sign' | 'direct_message'
  constraints?: BusinessConstraints; // Capacity, budget, hours
}
```

### Progressive Disclosure
GrowthFlow avoids "giant universal form fatigue" by asking only for data relevant to the selected objective:
* If the user selects `fill_capacity` (e.g. slow hours or open appointments), the flow asks for timing and available capacity.
* If the user enters promotional pricing, the pluggable `unit_contribution` rule activates to model variable costs and margins.
* If costs are omitted, the engine flags a transparent missing-data advisory rather than hallucinating profits.

---

## 3. Marketing Objectives Taxonomy

Small business marketing objectives share common underlying economic and customer acquisition goals across all industries:

| Objective Key | Customer Growth Job | Example Scenario Applications | Applicable Feasibility Rules |
| :--- | :--- | :--- | :--- |
| `fill_capacity` | Monetize predictable off-peak hours, open slots, or idle capacity. | • Café: Tuesday 2–5 PM afternoon slump<br>• Auto Detailing: Wednesday morning driveway openings<br>• Yoga Studio: Midday reformer slot availability | `unit_contribution`<br>`capacity_constraint` |
| `acquire_new_customers` | Overcome first-time purchase hesitation with an introductory hook. | • Bookstore: "Blind Date with a Book" welcome pack<br>• Cleaning Service: First-time deep clean incentive | `unit_contribution`<br>`budget_constraint` |
| `promote_bundle` | Pair high-margin and complementary offerings to increase average order value. | • Café: Drink + pastry bundle<br>• Salon: Cut + conditioning package<br>• Detailing: Interior + exterior ceramic coat | `unit_contribution` |
| `reactivate_lapsed` | Win back customers who have not visited or booked in 60+ days. | • Fitness: Comeback class pass<br>• Dental / Wellness: Annual checkup reminder | `budget_constraint`<br>`unit_contribution` |
| `clear_inventory` | Accelerate movement of seasonal, perishable, or excess stock. | • Bakery: End-of-day pastry box<br>• Boutique: Seasonal apparel clearance | `unit_contribution` |

---

## 4. Extensible Feasibility Engine (Composable Rules)

GrowthFlow replaces industry-specific math with a registry of **reusable, deterministic feasibility rules**. The planning engine inspects the input parameters and executes all applicable rules.

```
       [ Business Profile + Selected Objective + Offer Parameters ]
                                     │
                                     ▼
                      Pluggable Rule Dispatcher
  ┌──────────────────────────────┬──────────────────────────────┐
  │                              │                              │
  ▼                              ▼                              ▼
Rule: unit_contribution      Rule: capacity_constraint      Rule: budget_constraint
• Baseline vs Promo Margins  • Available vs Target Units   • Maximum Promo Redemptions
• Breakeven Volume Multiplier• Utilization Rate %          • Total Promotional Discount Cap
• Negative Margin Guard      • Overcapacity Warning        • Budget Exhaustion Risk
  │                              │                              │
  └──────────────────────────────┴──────────────────────────────┘
                                 │
                                 ▼
              Aggregated Feasibility Report & Status
       [ Verified / Advisory / Critical Alert / Missing Inputs ]
```

### Supported Core Rules

#### Rule 1: `unit_contribution`
* Evaluates direct gross margin above variable unit costs:
  $$U_{\text{base}} = \sum P_{\text{reg}} - C_{\text{var}}$$
  $$U_{\text{promo}} = P_{\text{promo}} - (C_{\text{var}} + C_{\text{extra}})$$
  $$\text{Multiplier} = \frac{U_{\text{base}}}{U_{\text{promo}}}$$
* **Safety Guards:**
  * If $U_{\text{promo}} \le 0$: Hard Red Alert. Breakeven multiplier is `"non_viable"`.
  * If $C_{\text{var}}$ is omitted: Status is `'missing_inputs'`. No profit is invented.

#### Rule 2: `capacity_constraint`
* Evaluates whether the business has sufficient operational capacity (tables, staff, appointment slots) to fulfill expected promotional volume:
  $$\text{Utilization Rate} = \left(\frac{\text{Required Promotional Volume}}{\text{Total Available Slots}}\right) \times 100$$
* If Utilization $> 100\%$, triggers capacity overload advisory (*"Warning: Promotion requires more capacity than available; staff bottlenecks likely"*).

#### Rule 3: `budget_constraint`
* Evaluates total promotional discount exposure against an owner-defined marketing budget cap:
  $$\text{Max Allowed Redemptions} = \left\lfloor\frac{\text{Budget Cap}}{P_{\text{base}} - P_{\text{promo}}}\right\rfloor$$
* Prevents open-ended promotional exposure that could deplete business cash reserves.

---

## 5. Honest AI Boundaries

* **The Role of AI:** Natural language parsing of business context, creative angle suggestions, tone matching, and drafting multi-format copy.
* **The Role of Deterministic Code:** Mathematical calculations, margin checks, capacity boundaries, and date/time milestone offsets.
* **The Anti-Hallucination Invariant:** The LLM is strictly prohibited from inventing COGS, certifying profitability, or executing math.
* **Deterministic Fallback:** Retains structured, reliable offline generation templates. When offline, the system clearly states: `source: 'deterministic_fallback'`.

---

## 6. Regression Testing Fixture Architecture

To verify that the system is truly generic and configuration-driven:
1. **Fixture A (Local Food Service):** The Elena Café slump scenario (Regression test).
2. **Fixture B (Service Area Business):** Apex Mobile Auto Detailing (Driveway cleaning, capacity-limited, service package).
3. **Fixture C (Local Retail & Experiential):** Pages & Pours Indie Bookstore (Inventory clearance + evening reading event).

All three scenarios pass through the exact same planning pipeline and component renderers without a single industry conditional in UI or business logic code.
