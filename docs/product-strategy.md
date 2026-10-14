# Product Strategy & Decision Record: GrowthFlow

**Document Status:** Approved with Phase 2 Rigor Refinements  
**Author:** APM Candidate  
**Date:** October 14, 2026  
**Audience:** Grexa AI APM Evaluation Team & Product Engineering  

---

## 1. Executive Summary & Strategy Formulation

GrowthFlow is an opinionated, AI-assisted **campaign preparation and offer-planning tool** specifically designed to address the **off-peak foot-traffic slump** for independent local cafés and bakeries.

Rather than providing another blank prompt box (like ChatGPT) or a graphical canvas (like Canva), GrowthFlow guides the business owner through a structured 3-step intake, runs a **deterministic unit contribution feasibility check** on their proposed offer to safeguard margins, and generates a structured campaign brief across **two high-impact local formats** (Organic Instagram Post and Sidewalk Chalkboard Sign) with a 1-click clipboard handoff and an editable, time-relative staff execution checklist.

---

## 2. Target User & Core Job-To-Be-Done (JTBD)

### Primary Target User Persona
* **Name:** Elena, Owner-Operator of an independent neighborhood café & bakery.
* **Context:** Employs 2–4 staff. Manages daily inventory, barista shifts, and customer service. Operates within typical independent restaurant/café economics (industry benchmarks show limited-service café EBITDA averages 6–12%, with high-performing shops reaching 10–14% [Source: National Restaurant Association Operations Report / Toast Restaurant Benchmarks]).
* **Constraints:** Extremely limited marketing bandwidth (under 15 minutes a week); zero formal digital marketing training; high fear of losing money on unvetted discounts or burning cash on complex ad managers.

### Core Job-to-be-Done
> **When** my café is consistently empty during predictable weekday afternoon hours (e.g., Tuesday–Thursday between 2:00 PM and 5:00 PM) while fixed payroll and overhead continue to run,  
> **I want to** quickly plan a margin-safe, compelling promotional offer and get ready-to-use marketing copy,  
> **So that I can** drive incremental neighborhood foot traffic to monetize idle seats without spending hours writing copy, guessing discounts, or burning cash on complex ads.

### Usability Speed Hypothesis (Explicitly Unverified)
* **Hypothesis ($H_1$):** *"A guided, progressive 3-step intake flow will enable a non-technical café owner to formulate, economically verify, and approve an off-peak campaign in under 3 minutes ($<180$ seconds)."*
* **Epistemic Note:** This 3-minute completion metric is treated strictly as an **unverified usability hypothesis** to be instrumented via prototype telemetry (`time_to_activate`), not as a proven baseline fact.

---

## 3. Product Scope Boundaries: Primary Scenario & Deliberate Tradeoffs

### The Primary Scenario (Narrow MVP Focus)
To avoid the failure mode of building a shallow, bloated "all-in-one" marketing platform, the MVP is constrained to a single high-frequency business scenario:
* **Scenario:** **"Weekday Afternoon Slump Campaign"** (targeting the 2:00 PM – 5:00 PM off-peak window for an independent café or bakery).

### Campaign Archetypes (Limited to 3 High-Probability Plays)
1. **The Beverage + Fresh Pastry Bundle:**
   * *Mechanism:* Pair a high-margin beverage (latte, drip, iced tea: 15–22% ingredient cost) with a fresh-baked perishable pastry (croissant, muffin, cookie: 28–35% ingredient cost) to protect profitability while incentivizing afternoon indulgence.
2. **The "Remote Work / Midweek Focus" Perk:**
   * *Mechanism:* Offer a refill perk or afternoon bundle geared at remote workers taking laptops out of home offices (e.g., "Free drip refill with any specialty sandwich/toast between 2–5 PM").
3. **The "Bring a Neighbor / Colleague" 2-Pack:**
   * *Mechanism:* A localized social offer (e.g., "Two lattes + two sweet treats for a flat \$12") designed to induce a customer to bring a co-worker during afternoon coffee runs.

---

## 4. Deterministic Unit Contribution Engine (Non-LLM)

### The Anti-Hallucination Guardrail
A core finding from Phase 1 is that generic LLMs hallucinate discounts and invent ungrounded business metrics, risking catastrophic margin loss for local businesses.

**Core Product Principle:** *The LLM writes copy; deterministic code calculates math. The LLM must NEVER calculate profit, certify economic feasibility, or invent prices/costs.*

### Modeling Complete Bundle Costs & Transactions
In restaurant marketing, discounting without modeling total variable costs is hazardous. GrowthFlow models transactions explicitly:

1. **Baseline Transaction:**
   * If an offer is an individual item, Baseline Price ($P_{base}$) is the item's regular menu price.
   * If an offer is a bundle (e.g., Specialty Latte + Croissant), Baseline Price ($P_{base}$) is the combined regular menu price ($P_{item1} + P_{item2}$).
   * Total Baseline Variable Cost ($C_{var}$) is the sum of component costs plus consumables:
     $$C_{var} = C_{item1} + C_{item2} + C_{packaging}$$
   * Baseline Unit Contribution ($U_{base}$):
     $$U_{base} = P_{base} - C_{var}$$

2. **Promotional Transaction:**
   * Promotional Price ($P_{promo}$) is the bundled deal price (or discounted single price).
   * Total Promotional Variable Cost ($C_{var, promo}$) equals $C_{var}$ plus any extra promotion-specific variable cost (e.g., special packaging, default \$0).
   * Promotional Unit Contribution ($U_{promo}$):
     $$U_{promo} = P_{promo} - C_{var, promo}$$
   * Promotional Contribution Rate ($CR_{\%}$):
     $$CR_{\%} = \left(\frac{U_{promo}}{P_{promo}}\right) \times 100$$

3. **Breakeven Volume Multiplier & Edge-Case Safety:**
   * How many promotional units must Elena sell during the slump to yield the same total dollar contribution as 10 baseline regular-price sales?
     $$\text{Multiplier} = \frac{U_{base}}{U_{promo}}$$
     $$\text{Breakeven Volume for 10 Baseline Sales} = 10 \times \left(\frac{U_{base}}{U_{promo}}\right)$$
   * **Zero or Negative Contribution Handling ($U_{promo} \le 0$):**
     * If $U_{promo} = 0$: Breakeven multiplier is mathematically infinite ($\infty$). The engine flags: *"Zero Unit Contribution: You generate \$0 gross contribution per unit sold. Selling more units cannot break even."*
     * If $U_{promo} < 0$: Breakeven multiplier is strictly non-viable. The engine flags a **Hard Red Alert**: *"Negative Unit Contribution (-\$X.XX per unit). Every sale increases cash loss. Revise promotional price or bundle components immediately."*
   * In both cases, the multiplier is rendered as `"Non-viable"` rather than causing a `NaN` or `Infinity` software crash.

4. **Contribution Economics vs. Net Profit:**
   * The calculation is explicitly labeled as **Unit Contribution Economics**, not "Net Profit" or "Campaign Profitability".
   * *Rationale:* Net store profit depends on fixed overhead (rent, baseline shift wages, depreciation, insurance) and overall store traffic lift, which a unit calculator cannot know. Presenting unit contribution as net profit would be deceptive.

### Missing Data States
* If the user omits Unit Cost ($C_{var}$):
  * The calculation card displays a visible missing-data state: *"Unit cost not provided. Contribution economics cannot be calculated. Industry food/beverage COGS typically ranges 25%–35% of menu price. Verify your unit costs before discounting."*
  * The LLM is explicitly forbidden from generating a numerical profit or margin claim.

---

## 5. Audit of Stated Assumptions & Sources

To ensure analytical integrity, all assumptions, benchmark claims, and system thresholds are audited and classified:

| Claim / Metric | Value | Classification | Underlying Source / Justification |
| :--- | :--- | :--- | :--- |
| **Independent Café Operating Margin** | 6–12% (up to 14% high performers) | **Empirical Benchmark** | National Restaurant Association Operations Report (2024); Toast Restaurant Benchmarks (Q2 2024). Limited-service cafés average 6–9% net EBITDA; highly optimized specialty coffee/bakery shops reach 10–14%. |
| **Food & Beverage COGS** | 25–35% average | **Empirical Benchmark** | Specialty Coffee Association (SCA) Cost of Goods Analysis; Cornell Hospitality Reports. Espresso drinks typically incur 15–22% ingredient cost; scratch-baked goods incur 28–35% ingredient cost. |
| **Low-Margin Advisory Threshold** | 35% contribution rate | **Configurable Default Heuristic** | Product default set to prevent cafés from cutting into operating overhead. Can be adjusted by user in settings. |
| **Generation Latency Target** | $< 4.0$ seconds | **Technical Target Hypothesis** | System SLA target based on LLM completion token speed and deterministic fallback execution. |
| **Handoff Copy-Rate Target** | $> 75\%$ of activated sessions | **Unvalidated Product Hypothesis** | Target threshold to validate that the manual clipboard handoff is usable; subject to prototype telemetry measurement. |

---

## 6. Selection of Output Formats & Tradeoff Analysis

The first release limits output to **exactly two actionable formats**:

### Format 1: Organic Instagram / Social Post (Caption + Photo Direction)
* **Rationale:** Instagram is the primary digital discovery surface for neighborhood food and café culture. Organic posting costs \$0 in ad spend and reaches local followers immediately.
* **Content:** Catchy hook, clear hours (e.g., 2–5 PM), explicit offer terms, community call-to-action, and suggested photo angle (e.g., *"Photo of steaming latte next to a fresh croissant with afternoon light"*).

### Format 2: Sidewalk Chalkboard / Counter Sign Spec
* **Rationale:** Direct physical conversion of foot traffic already walking past the storefront. Chalkboards have 100% local relevance, zero tech overhead, and immediate impact during afternoon pedestrian flows.
* **Content:** High-visibility headline (3–5 words max), bulleted offer, clear time window, and friendly visual icon/drawing recommendation.

### Explicitly Rejected Formats for MVP
| Rejected Format | Tradeoff Reason for Rejection |
| :--- | :--- |
| **Email Newsletter Blast** | Most independent cafés have disorganized or non-existent email lists; setting up Mailchimp templates introduces massive setup friction. |
| **SMS / WhatsApp Blast** | Requires compliance (TCPA / GDPR), customer phone number opt-in lists, and paid messaging gateways. |
| **Paid Meta / Google Ads** | Requires ad account setup, pixel integration, payment methods, and risk of burning cash ($50–$150) on untrained ad targeting. |

---

## 7. Deliberate Handoff & Time-Relative Checklist

To solve the "Handoff Chasm" without taking on brittle external API dependencies (Meta Graph API, Instagram Basic Display, Square POS), the MVP implements a deliberate, structured physical handoff:

1. **Individual 1-Click Copy Buttons:**
   * One-click copy for the Instagram Caption (with toast confirmation).
   * One-click copy for the Sidewalk Chalkboard layout.
2. **Configurable, Time-Relative Staff Checklist ("Next Actions"):**
   * The owner defines the **Campaign Slump Start Time** ($T_0$, e.g., `14:00` / 2:00 PM).
   * System deterministically calculates recommended operational milestones relative to $T_0$:
     * **$T_0 - 30\text{ min}$ (1:30 PM):** Update and place the sidewalk chalkboard outside the entrance.
     * **$T_0 - 15\text{ min}$ (1:45 PM):** Publish the Instagram post/story with the copied caption and fresh photo.
     * **$T_0$ (2:00 PM):** Brief the on-duty barista on the promotional bundle code/price.
   * **Full In-Line Editability:** The owner can edit milestone text, change scheduled offset times, and toggle checkboxes.
3. **Approval State:** Explicit user toggle: *"Mark Campaign as Approved & Ready to Run"*.

---

## 8. Strategic Risks & Unresolved Assumptions

### Top 3 Strategic Risks
1. **The "Execution Drop-Off" Risk:** Owners approve the campaign in GrowthFlow, but never actually post on Instagram or write on the chalkboard due to operational store fires.
2. **The "Commoditized Prompting" Risk:** Advancements in general consumer LLMs (e.g., Apple Intelligence, Gemini, ChatGPT) might make custom web intake flows feel redundant if users can simply speak into their phones.
3. **The "Attribution Invisibility" Risk:** Because GrowthFlow does not process POS transactions, the owner cannot definitively prove that a 15% increase in Tuesday afternoon customers was caused by the GrowthFlow campaign.

### Key Assumptions & Falsification Criteria (What Would Change Our Direction)
* **Assumption A (Intake Completion):** Café owners will spend 90–180 seconds filling out 4 structured fields.
  * *Falsification Trigger:* If user testing reveals an onboarding abandonment rate $>50\%$ before the offer details are completed, we will pivot to an ultra-condensed "1-click smart preset" flow.
* **Assumption B (Value of Deterministic Feasibility Check):** Owners care about seeing their unit contribution before generating copy.
  * *Falsification Trigger:* If $>80\%$ of prototype users leave the cost field blank or express that they find unit math patronizing, we will demote it to an optional "Advanced Margin Check" toggle.
* **Assumption C (Sufficiency of Manual Handoff):** Users are satisfied with 1-click clipboard copy and staff checklists.
  * *Falsification Trigger:* If usability testing indicates users refuse to launch campaigns because they expected automated publishing, we must reprioritize native webhook or direct social scheduling integrations.
