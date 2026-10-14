# Quality Assurance (QA) Checklist & Verification Results

**Document Status:** Complete (Phase 4 MVP Verification)  
**Author:** APM Candidate  
**Date:** October 14, 2026  
**Audience:** Grexa AI APM Evaluation Team & Product Engineering  

---

## 1. Automated Test Execution Summary

Automated tests were executed locally using Node.js native test runner (`node --experimental-strip-types --test tests/*.test.ts`).  
**Result:** **24 passed / 24 total (100% pass rate) in 137ms across 6 test suites.**

### Test Suite Breakdown

| Suite | File | Tests Run | Result | Key Invariants Verified |
| :--- | :--- | :--- | :--- | :--- |
| **Economics Engine** | [`tests/economics.test.ts`](file:///home/sauhard/code/GrowFlow/tests/economics.test.ts) | 6 | **PASS (6/6)** | • Multi-item bundle cost aggregation ($C_{item1} + C_{item2} + C_{packaging}$)<br>• Baseline vs. Promotional Unit Contribution<br>• Negative contribution guard ($U_{promo} < 0 \to$ `non_viable`)<br>• Zero contribution guard ($U_{promo} = 0 \to$ `non_viable`)<br>• Missing/omitted unit costs handling (`unavailable`)<br>• Invalid price rejection ($P \le 0$)<br>• Thin margin advisory ($CR_{\%} < 35\%$) |
| **Composable Feasibility Engine** | [`tests/economics.test.ts`](file:///home/sauhard/code/GrowFlow/tests/economics.test.ts) | 5 | **PASS (5/5)** | • Full multi-rule evaluation across margin, capacity, and budget<br>• Operational capacity check (detects overutilization when $V_{target} > C_{available}$)<br>• Promotional budget cap check (detects exposure breach when $E_{discount} > B_{limit}$)<br>• Negative contribution critical alert propagation<br>• Honest missing-cost handling without fabricated estimates |
| **Time-Relative Checklist** | [`tests/checklist.test.ts`](file:///home/sauhard/code/GrowFlow/tests/checklist.test.ts) | 4 | **PASS (4/4)** | • Initial milestone offset calculation ($T_0-30\text{m}$, $T_0-15\text{m}$, $T_0$)<br>• Dynamic time recalculation when start time shifts (e.g. 14:00 $\to$ 15:30)<br>• Preservation of completion checkbox status on reschedule<br>• Hour boundary offset math (e.g., 13:10 - 30m $\to$ 12:40)<br>• **Service-Area Adaptation:** Shifts timeline to $T_0-60\text{m}$ for direct outreach & equipment prep |
| **Telemetry & Funnel Engine** | [`tests/analytics.test.ts`](file:///home/sauhard/code/GrowFlow/tests/analytics.test.ts) | 3 | **PASS (3/3)** | • Full 6-stage linear conversion funnel computation<br>• Optional action non-linear handling: verifying that sessions that approve without editing are **not** dropped from the linear funnel<br>• Accurate Activation Rate and Handoff Copy Rate calculations<br>• Empty event array safe handling without crashing |
| **Generator & Quality Guardrails** | [`tests/generator.test.ts`](file:///home/sauhard/code/GrowFlow/tests/generator.test.ts) | 4 | **PASS (4/4)** | • Structured generation across archetypes (`bundle_hook`, `remote_work_perk`, `neighbor_2pack`)<br>• **Anti-Cliché Guardrail:** Strict assertion that forbidden AI marketing buzzwords (*delve*, *elevate*, *revolutionize*, *testament*, *tapestry*, *unleash*, *bespoke*) are completely absent from generated copy<br>• Format completeness (Instagram caption, photo direction, Chalkboard punchy layout, operational caveats)<br>• Deterministic offline fallback functionality |
| **Multi-Industry Regression Suite** | [`tests/generator.test.ts`](file:///home/sauhard/code/GrowFlow/tests/generator.test.ts) | 2 | **PASS (2/2)** | • **Configuration-Driven Invariant:** Arbitrary small business profiles (Café, Auto Detailing, Bookstore) verified without code changes or industry branching<br>• Dynamic multi-format output validation across Social Post, Display Sign, and Direct Outreach<br>• Trade service capacity and budget constraints evaluated deterministically |

---

## 2. Production Build Verification

* **Command:** `pnpm build`
* **Next.js Version:** `14.2.35`
* **Build Result:** **Successful (Exit Code 0).**
* **Output Routes:**
  * `○ /` (Static prerendered: 14 kB, First Load JS: 101 kB)
  * `ƒ /api/generate` (Dynamic server-side route)
  * `ƒ /api/events` (Dynamic server-side route)
* **TypeScript Check:** Strict type validation passed with 0 errors (`tsc` 5.5.4).

---

## 3. Manual Functional Verification Matrix

| Area | Verification Scenario | Expected Behavior | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Clean Setup** | Fresh repository clone & dependency install | Application boots with `pnpm dev` or `pnpm start` without missing dependencies | Verified. Wrapper script sets required XDG paths; builds cleanly. | **PASS** |
| **2. Multi-Item Bundle Inputs** | Add 3 items to bundle; adjust packaging cost | System sums regular prices and variable costs dynamically | Verified. Real-time updates reflect in baseline price and COGS. | **PASS** |
| **3. Negative Margin Protection** | Enter promo price \$3.00 for bundle with \$3.30 COGS | Prominent Red Alert banner triggers; Breakeven Multiplier renders `"Non-viable"` | Verified. Red banner alerts user: *"Every unit sold loses cash (-\$0.30)"*. Multiplier does not crash with negative numbers. | **PASS** |
| **4. Missing Cost State** | Leave Unit Cost field empty | Grey advisory banner appears; Multiplier renders `"Unavailable"`; LLM is blocked from inventing profit | Verified. Safe missing-data fallback prevents hallucinated margin percentages. | **PASS** |
| **5. Offline Fallback Mode** | Trigger generation without `OPENAI_API_KEY` | System seamlessly renders deterministic verified template with zero user error | Verified. Generation succeeds in $< 100\text{ms}$; brief flagged with `source: 'deterministic_fallback'`. | **PASS** |
| **6. In-Line Copy Editing** | User edits generated Instagram caption | Textarea updates in real-time; fires `campaign_edited` event; persists to handoff | Verified. User changes persist; does not distort linear funnel. | **PASS** |
| **7. Handoff Clipboard** | Click "Copy Caption" or "Copy Chalkboard Spec" | Copies clean text to OS clipboard; renders visual confirmation toast for 3s | Verified. Toast displays and auto-dismisses; `materials_copied` event logged. | **PASS** |
| **8. Time-Relative Checklist** | User changes slump start time from 14:00 to 15:30 | Milestones automatically re-compute to 15:00, 15:15, and 15:30; task descriptions editable | Verified. Dynamic offset recalculation works; task completion toggle works. | **PASS** |
| **9. Telemetry Separation** | Switch between "Live Telemetry" and "Simulated SMB Benchmark" | Clear visual distinction; Live shows actual session events; Benchmark shows N=250 with amber warning badge | Verified. Strict epistemic separation maintained; no mixing of real and fake data. | **PASS** |
| **10. Responsive Layout** | View at mobile (375px) and desktop (1280px) widths | Clean grid layout collapses into single-column cards on mobile | Verified. Tailwind responsive breakpoints (`md:`, `lg:`) adjust cleanly. | **PASS** |

---

## 4. Known Limitations & Edge Cases

1. **Clipboard API in Headless / Non-HTTPS Environments:**
   * In non-secure contexts (plain HTTP without localhost), modern browsers restrict `navigator.clipboard.writeText`. The code handles this gracefully, but standard production deployment requires HTTPS.
2. **Session Persistence Scope:**
   * Live session events are stored in `sessionStorage` and local state. Hard refreshing a browser tab clears in-memory state, though `sessionStorage` preserves the active `sessionId`.
3. **No Direct Social Publishing:**
   * By deliberate design (documented in Phase 2 scope decisions), the MVP does not integrate Meta/Instagram Graph APIs. Handoff relies on clipboard copy and physical staff checklists.
