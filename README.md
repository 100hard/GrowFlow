# GrowthFlow: Off-Peak Campaign Architect for Independent Cafés

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-16%20Passing-emerald.svg)](tests/)

> An AI-assisted campaign preparation and offer-planning tool designed to help independent cafés and bakeries turn predictable weekday afternoon slumps into margin-safe, localized promotional campaigns in under 3 minutes.

Developed as a rigorous **Associate Product Manager (APM)** portfolio project demonstrating evidence-driven discovery, unit contribution economics, deterministic guardrails, structured user journeys, and telemetry-backed experimentation.

---

## 📌 Problem & Product Strategy

Independent café and bakery owner-operators suffer recurring revenue slumps during weekday afternoons (e.g., Tuesday–Thursday between 2:00 PM and 5:00 PM). While standing costs (rent, barista shifts, espresso power) continue to run, owners lack marketing expertise, prompt engineering skills, and operational bandwidth to formulate margin-safe promotions.

Existing solutions present critical friction:
* **Generic LLMs (ChatGPT):** Act as unguided "vending machines" requiring prompt engineering, frequently outputting corporate marketing buzzwords (*"delve"*, *"elevate your experience"*) and hallucinating discounts without assessing restaurant unit margins.
* **Complex SaaS / Ad Suites (Mailchimp, Meta Ads):** Feature-bloated, jargon-heavy, and require pre-existing email contact lists or cash ad budgets.
* **Visual Suites (Canva):** Solve graphic styling, but assume the promotional strategy and offer mechanics are already determined.

### The GrowthFlow Approach
1. **Guided 3-Step Intake:** Extracts store context, slump timing, and bundle parameters in minutes.
2. **Deterministic Contribution Engine:** A non-LLM calculation layer evaluates Baseline Margin, Promo Margin, Contribution Rate (%), and Breakeven Volume Multipliers. Halts margin-negative proposals with a Red Alert.
3. **Multi-Format Campaign Briefs:** Generates localized copy across two high-impact local formats:
   * **Format A (Organic Instagram Post):** Free neighborhood discovery, caption, photo angle direction.
   * **Format B (Sidewalk Chalkboard Sign):** 4-word punchy header, bulleted deal, time callout, chalk art tip.
4. **Deliberate Physical Handoff:** 1-click clipboard copy buttons and a time-relative staff operational checklist ($T_0 - 30\text{m}$, $T_0 - 15\text{m}$, $T_0$).
5. **Strict Telemetry Segregation:** A dedicated analytics view tracking linear funnel conversion, separating active session events from simulated benchmark cohorts.

---

## 📂 Project Architecture & PM Documentation

```
GrowFlow/
├── docs/                         # Complete APM Product Management Documentation
│   ├── research.md               # Secondary desk research, source citations, facts vs hypotheses
│   ├── competitive-analysis.md   # Breakdown of ChatGPT, Canva, Mailchimp, Square, Meta Ads
│   ├── problem-definition.md     # Segment evaluation matrix & primary scenario selection
│   ├── product-strategy.md       # Core JTBD, contribution economics, rejected alternatives, risks
│   ├── PRD.md                    # Requirements, user stories, acceptance criteria, release scope
│   ├── analytics-plan.md         # Event taxonomy, linear funnel, A/B test power analysis
│   └── QA-checklist.md           # Automated test results & manual verification matrix
├── src/
│   ├── app/                      # Next.js 14 App Router UI & API Routes
│   │   ├── page.tsx              # Main studio flow, A/B wizard toggle, analytics dashboard
│   │   ├── layout.tsx            # Global app layout & metadata
│   │   ├── globals.css           # Tailwind base styles
│   │   └── api/
│   │       ├── generate/route.ts # Campaign brief generation endpoint
│   │       └── events/route.ts   # Session telemetry & metrics endpoint
│   └── lib/                      # Core Domain & Pure Business Logic Modules
│       ├── types.ts              # TypeScript domain schemas
│       ├── economics.ts          # Deterministic contribution economics calculation engine
│       ├── checklist.ts          # Time-relative store operational checklist engine
│       ├── generator.ts          # Template generator with anti-cliché quality guardrails
│       └── analytics.ts          # Funnel metrics aggregator & benchmark cohort generator
└── tests/                        # Automated Unit & Integration Tests (100% Pass Rate)
    ├── economics.test.ts         # Multi-item bundle math, negative/zero contribution guards
    ├── checklist.test.ts         # Time offset calculation & reschedule re-computation
    ├── analytics.test.ts         # Linear funnel progression & optional edit branch verification
    └── generator.test.ts         # Anti-cliché assertions & archetype completeness
```

---

## ⚡ Quickstart & Local Setup

### Prerequisites
* Node.js v18+ (tested on Node v24)
* pnpm (or npm / yarn)

### Installation
```bash
# Clone the repository
git clone https://github.com/100hard/GrowFlow.git
cd GrowFlow

# Install dependencies
pnpm install

# Run automated test suite
pnpm test

# Start local development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Test Suite

GrowthFlow maintains a 100% pass rate across 16 automated tests covering financial invariants, checklist calculations, telemetry schemas, and anti-cliché guardrails:

```bash
$ pnpm test

▶ GrowthFlow Analytics & Funnel Unit Tests
  ✔ Calculates complete linear funnel progression accurately (0.87ms)
  ✔ Verifies that optional campaign_edited does NOT drop unedited sessions (0.17ms)
  ✔ Handles empty event log safely without crashing (0.13ms)

▶ GrowthFlow Time-Relative Checklist Unit Tests
  ✔ AC-3.1: Calculates relative operational milestone times for 14:00 start (0.52ms)
  ✔ AC-3.2: Automatically recalculates checklist times when Elena updates start time (0.15ms)
  ✔ Calculates time offsets across hour boundaries correctly (0.10ms)

▶ GrowthFlow Economics Engine Unit Tests
  ✔ AC-1.1: Multi-item bundle calculation with packaging cost (1.04ms)
  ✔ AC-1.2: Negative promotional contribution guard (0.22ms)
  ✔ AC-1.3: Zero promotional contribution guard (0.15ms)
  ✔ AC-1.4: Missing cost handling (null / omitted inputs) (0.13ms)
  ✔ Rejects invalid prices (zero or negative) (0.24ms)
  ✔ Triggers thin margin advisory when contribution rate < 35% (0.14ms)

▶ GrowthFlow Generator & Quality Guardrail Tests
  ✔ Generates complete structured brief for The Bundle Hook (1.03ms)
  ✔ Anti-Cliche Guardrail: Generated copy strictly avoids AI marketing buzzwords (0.23ms)
  ✔ Generates localized Remote Work Pass brief with Wi-Fi and quiet vibe hooks (0.14ms)
  ✔ Generates Bring a Colleague 2-pack deal with social sharing cues (0.11ms)

Total: 16 passed, 0 failed
```

---

## 📊 Analytics & Experimentation Specifications

* **Primary Activation Metric:** `campaign_approved` (distinct sessions completing intake, inspecting feasibility, and approving the draft).
* **Speed Hypothesis ($H_1$):** Median time to activation $T_{act} < 180\text{ seconds}$ (tracked via live telemetry).
* **A/B Experiment:** Single Scrollable Form (Variant A) vs. Progressive 3-Step Wizard (Variant B).
* **Sample Size Requirement:** Calculated via standard two-proportion power analysis ($\alpha = 0.05, 1-\beta = 0.80$, MDE 15% relative lift) $\implies \mathbf{1,340\text{ total sessions}}$.

---

## ⚖️ License
MIT License. Created by Sauhard Dubey.
