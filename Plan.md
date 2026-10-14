# GrowthFlow: Product Initiative and Build Brief

## 1. Your role

Act as a senior product manager, product designer, full-stack engineer, and product analytics specialist working with me to create a high-quality product-management portfolio project.

Do not behave like a coding assistant that blindly implements whatever is requested. Challenge weak assumptions, identify missing information, recommend simpler alternatives, and explain important product tradeoffs.

Your task is to help me develop a coherent product initiative: research, problem definition, product requirements, working prototype, analytics, experimentation plan, and a final case study.

Make reasonable assumptions when necessary, document them, and keep moving. Ask me questions only when a decision genuinely blocks progress.

## 2. Why we are building this

I am an engineering student applying for the Associate Product Manager role at Grexa AI.

The role involves:
- Identifying user problems and defining product opportunities.
- Writing PRDs and translating ambiguous problems into requirements.
- Working with engineering, design, and data teams.
- Defining product metrics and understanding user behavior.
- Designing experiments and validating features.
- Prioritizing work, planning releases, and making tradeoffs.
- Working on AI-driven features, internal tools, and user workflows.

My existing resume already demonstrates substantial technical ability through an AI engineering internship and an AI research platform called SciNets. This project should add evidence of product-management ability rather than simply demonstrate that I can build another AI application.

The intended reviewer should be able to understand:
1. What user problem I identified.
2. What evidence supports that problem.
3. Why I chose this solution over alternatives.
4. How I translated the problem into a product.
5. How I would measure success.
6. What I learned, what remains uncertain, and what I would do next.

The project cannot guarantee selection. Its purpose is to provide credible, interview-defensible evidence of my product thinking.

## 3. Product concept

Working name: GrowthFlow

Concept: An AI-assisted marketing onboarding and campaign preparation tool for small businesses.

Illustrative target user: An owner of a small local business who wants to promote their business but struggles to turn a marketing goal into a concrete, usable campaign.

Possible initial example: A café owner who wants to attract more weekday customers but does not know what offer to create or what promotional message to write.

This is an initial hypothesis, not a validated customer insight.

Potential user journey:
1. The user provides basic business information.
2. The user chooses a marketing objective.
3. The product collects only the information necessary to generate a relevant campaign.
4. AI generates a structured campaign brief and promotional draft.
5. The user reviews, edits, and approves the draft.
6. The product records meaningful interaction events.
7. An analytics view shows the onboarding and campaign funnel.
8. The product suggests a sensible next action based on available information.

The initial product should help prepare and approve a campaign. Do not build real social-media publishing, ad buying, payment processing, CRM integrations, or a complex marketing automation platform.

Do not assume that AI-generated campaigns will improve business outcomes. That is a hypothesis to investigate, not a claim to make.

## 4. Research before building

Begin with a focused research phase.

Investigate:
- Existing tools that help small businesses create marketing campaigns.
- Public reviews and discussions describing friction in campaign creation, onboarding, and marketing workflows.
- How comparable products structure onboarding, collect information, generate recommendations, and help users take action.
- Which user segment and initial use case would make the smallest, most defensible product.
- What alternative problems or solutions we considered and why we rejected them.

Use accessible public sources, official product documentation, product pages, public reviews, and relevant discussions. Prefer primary sources when possible.

Create these documents:

`docs/research.md`
- Research questions.
- Sources, URLs, and access dates.
- Specific observations supported by each source.
- Recurring themes and counterexamples.
- Limitations and potential biases.
- Which findings are facts and which are interpretations.

`docs/competitive-analysis.md`
- Relevant existing products.
- Their target users and primary workflows.
- Strengths and limitations supported by evidence.
- Potential unmet needs.
- What GrowthFlow could differentiate on.
- Why this differentiation might still be wrong.

`docs/problem-definition.md`
- Candidate user segments.
- Candidate problems.
- Evidence supporting each problem.
- Severity, frequency, and current workarounds where evidence is available.
- The selected initial problem.
- Why it was selected over alternatives.
- Key assumptions that remain unvalidated.

Do not fabricate research findings, quotations, user pain points, statistics, competitor features, or market sizes.

If a source cannot be accessed or a claim cannot be verified, state that clearly. Do not present a hypothesis as a finding merely because it makes the product story more convincing.

No in-person business-owner interviews are available for this project. Do not make interviews a prerequisite for progress.

## 5. Make a real product decision

Before implementing the main workflow, write down the product decision.

Define:
- Primary user.
- User's job to be done.
- The specific problem being addressed.
- Current alternatives and their limitations.
- Proposed value proposition.
- Why this problem is worth addressing.
- The smallest useful product.
- What is explicitly out of scope.
- The three most important product risks.
- The riskiest assumptions and how we could test them.
- Why we are choosing this approach instead of at least two plausible alternatives.

Use a lightweight prioritization method. Explain the criteria and reasoning rather than assigning arbitrary scores that appear scientific.

If research suggests that the original concept is weak, narrow or revise the concept. Do not force the evidence to support GrowthFlow merely because the name has already been chosen.

Document the final decision in `docs/product-strategy.md`.

## 6. Product requirements

Create `docs/PRD.md` before implementing the main workflow.

The PRD should include:

### Problem and objective
Define the problem, target user, desired outcome, and product objective.

### User stories
Write clear user stories for the primary workflow.

### Requirements
Separate:
- Must-have requirements.
- Should-have requirements.
- Future possibilities.

### User journey
Document the steps from first visit to campaign approval, including loading, error, empty, and recovery states.

### Acceptance criteria
Write testable acceptance criteria for each must-have feature.

### Product constraints
Explain what the product will not do and why.

### Success metrics
Define the activation metric, funnel events, guardrails, and what constitutes meaningful progress.

### Risks and assumptions
List the assumptions that could invalidate the product direction.

### Release plan
Define a small MVP release, known limitations, and the next iteration.

Keep the PRD concise and useful. Avoid generating a long generic document filled with product-management terminology that does not influence implementation.

## 7. Build the application

First inspect the current workspace and its existing files. Preserve useful existing work. If the workspace is empty, choose a maintainable, fast-to-build stack and document the decision.

Preferred approach:
- TypeScript and React/Next.js for the application.
- Tailwind CSS and a consistent component system for the interface.
- A reliable LLM API if available, with secrets stored in environment variables.
- A deterministic mock or fallback mode when the API is unavailable.
- Persistent storage only where it provides genuine value.
- Simple, reproducible local setup.

Do not introduce unnecessary infrastructure, microservices, Kubernetes, elaborate agent frameworks, or a complex backend for a small portfolio prototype.

The application must work end to end.

### Required user experience

A. Landing or entry screen
- Communicate the product's purpose clearly.
- Make the primary action obvious.
- Avoid generic AI buzzwords.

B. Business setup
- Collect only information relevant to the chosen campaign.
- Use sensible defaults and helpful guidance.
- Validate inputs.
- Minimize unnecessary friction.
- If progressive onboarding is chosen, explain the reasoning in the case study.

C. Campaign creation
- Let the user choose a specific marketing objective.
- Collect the minimum context necessary to generate a useful draft.
- Generate structured output containing the campaign idea, target audience, offer or message, suggested channel, rationale, and any relevant caveats.
- Do not invent business facts, discounts, inventory, prices, or guarantees.
- Make uncertain assumptions visible.

D. Review and editing
- Allow the user to edit the generated content.
- Let the user regenerate or revise a draft.
- Make approval an explicit action.
- Clearly communicate whether the content is a draft or approved.

E. Completion
- Show the user what has been completed.
- Offer a meaningful next step.
- Do not imply that a campaign was published or customers were acquired when neither occurred.

F. Analytics
- Show a readable onboarding and campaign funnel.
- Explain each metric.
- Distinguish real events from seeded or simulated examples.
- Include empty states when actual data is unavailable.

G. Usability and reliability
- Support loading, error, retry, validation, and empty states.
- Ensure navigation and core actions work.
- Make the application usable at desktop and mobile widths.
- Include realistic demo data without misrepresenting it as real customer activity.

## 8. Product analytics and instrumentation

Create `docs/analytics-plan.md`.

Instrument meaningful events, such as:
- `onboarding_started`
- `business_profile_completed`
- `campaign_generation_started`
- `campaign_generated`
- `campaign_generation_failed`
- `campaign_edited`
- `campaign_approved`

Define each event, when it fires, its relevant properties, and what product question it helps answer.

Avoid collecting unnecessary personal information.

Use event instrumentation that actually works in the prototype. Persist or inspect the events sufficiently to demonstrate that the funnel is not merely a decorative dashboard.

### Activation hypothesis

A candidate activation event is `campaign_approved`: the user has successfully created and approved a campaign draft.

Assess whether this is the right activation definition for the selected user and problem. Explain the choice and its limitations.

Define:
- Funnel entry.
- Completion and drop-off.
- Activation rate and its denominator.
- Time to activation.
- Campaign-generation failure rate.
- Relevant quality or usability guardrails.

Do not report conversion rates as real-world product results when there is no real user dataset.

If example data is necessary to demonstrate analytics, label it prominently as simulated and keep it separate from actual prototype events.

## 9. Experiment design

Create `docs/experiment-plan.md`.

Consider a focused experiment comparing two onboarding approaches:

Variant A: A single form collects all necessary information upfront.

Variant B: A progressive flow collects information in smaller steps and reveals only what is needed.

Do not assume Variant B is better.

Document:
- The user problem the experiment addresses.
- The hypothesis.
- The independent variable.
- The primary metric.
- Guardrail metrics.
- How participants or sessions would be assigned.
- The intended audience.
- What data would be collected.
- The decision rule.
- What we would do if results are positive, negative, or inconclusive.
- Limitations and possible confounding factors.

Implement a simple prototype-level comparison only if it can be done without distracting from the core product.

If we have not collected sufficient real observations, describe the experiment as proposed rather than completed. If we conduct a small usability test, report its actual method, sample, observations, and limitations. Do not claim statistical significance or generalizable findings from an inadequate sample.

## 10. AI quality and product trust

Create `docs/ai-quality-plan.md`.

Define a practical evaluation rubric for generated campaigns. Consider:
- Relevance to the user's objective.
- Completeness.
- Clarity and usefulness.
- Consistency with supplied business information.
- Unsupported factual claims.
- Unrealistic offers or promises.
- Ease of editing.
- Appropriateness for the selected channel.

Create a small, documented evaluation dataset containing diverse business scenarios and difficult cases.

Run the evaluation against actual outputs if technically feasible. Record the evaluation method and observed results.

Clearly distinguish human judgments, automated checks, illustrative examples, and actual measured outcomes.

Do not invent an evaluation score or claim that AI output quality is high merely because the sample outputs look convincing.

## 11. Design quality

The interface should look like a credible early-stage SaaS product, not a hackathon template.

Prioritize:
- A clear visual hierarchy.
- Consistent spacing and typography.
- A restrained color palette.
- Strong form design.
- Helpful empty and error states.
- Clear primary and secondary actions.
- Readable analytics.
- Realistic content.
- Accessibility and responsive behavior.

Avoid:
- Excessive gradients and decorative animations.
- Unnecessary glassmorphism.
- Fake testimonials.
- Unsupported business-impact claims.
- Decorative charts without meaningful data.
- Too many features or screens.
- A landing page that looks better than the actual product.

Spend more effort on the main workflow than on marketing-site decoration.

## 12. Testing and quality assurance

Create `docs/QA-checklist.md`.

Verify:
- The application starts from a clean setup.
- The complete primary workflow works.
- Input validation works.
- Generation success and failure paths work.
- The deterministic fallback works when the LLM is unavailable.
- Editing and approval work.
- Events fire at the correct moments.
- Analytics distinguish actual and simulated data.
- Refreshing does not unexpectedly destroy important state.
- No API keys or secrets are exposed.
- Responsive layouts work.
- The browser console has no important errors.
- The repository contains no unnecessary files or dependencies.

Add automated tests for the critical business logic and important user flows where practical.

Run the checks yourself and document failures. Do not state that something has been tested unless you actually ran the relevant test.

## 13. Portfolio and case-study deliverables

Create the following:

`README.md`
A concise project overview, setup instructions, architecture, features, testing instructions, and known limitations.

`docs/product-strategy.md`
The product decision and its rationale.

`docs/research.md`
Evidence, source links, observations, and limitations.

`docs/competitive-analysis.md`
Comparison of relevant alternatives.

`docs/problem-definition.md`
User segment, problem, evidence, and assumptions.

`docs/PRD.md`
Requirements, user stories, acceptance criteria, metrics, and release scope.

`docs/analytics-plan.md`
Event definitions and metric calculations.

`docs/experiment-plan.md`
A reproducible experiment proposal and decision rules.

`docs/ai-quality-plan.md`
The evaluation rubric, scenarios, methodology, and results if actually evaluated.

`docs/QA-checklist.md`
Actual verification results and remaining issues.

`docs/case-study.md`
A concise portfolio case study covering:
1. Context and problem.
2. Research and evidence.
3. User and problem selection.
4. Alternatives considered.
5. Product decision and tradeoffs.
6. User journey and key design choices.
7. PRD and implementation.
8. Metrics and experiment design.
9. What was actually tested and learned.
10. Limitations and next steps.

Capture genuine screenshots of the running application where possible.

The case study must make the reasoning behind the work visible. It should not merely narrate the features we implemented.

## 14. Resume evidence

The final project should give me enough real evidence to write a concise resume entry.

Potential evidence includes:
- A documented product opportunity and its supporting research.
- A clear PRD and prioritized feature scope.
- An end-to-end working prototype.
- Working event instrumentation and metric definitions.
- A documented experiment with explicit decision criteria.
- Actual evaluation results, if collected.
- Defensible product tradeoffs and limitations.

Do not write invented resume metrics. Do not claim customer interviews, customer adoption, revenue, retention improvements, conversion lifts, or business impact unless they have genuinely been observed and documented.

At the end, propose two or three resume bullets using only verified accomplishments. Mark any placeholders or unfinished work clearly.

## 15. Execution strategy

Work in small, verifiable phases.

Phase 1: Inspect workspace, define assumptions, research the problem, and evaluate alternatives.

Phase 2: Select the problem and document product strategy.

Phase 3: Write the PRD, user journey, event schema, and acceptance criteria.

Phase 4: Build the smallest complete product workflow.

Phase 5: Add instrumentation, analytics, and AI quality checks.

Phase 6: Test the product, fix issues, and capture screenshots.

Phase 7: Complete the case study and derive resume-ready evidence.

At the end of each phase:
- Summarize what was completed.
- List files created or changed.
- State important decisions and why they were made.
- Report tests actually run and their results.
- Identify unresolved questions and risks.
- Recommend the next phase.

Do not stop after producing a plan or static mockup. Continue into implementation unless blocked by a genuine dependency.

Do not spend excessive time researching or documenting before a useful prototype exists. Keep the work focused on the smallest credible product initiative.

## 16. Constraints and definition of done

Time is limited. The goal is a strong, focused portfolio project, not a production-grade startup.

Optimize for:
- Credibility over inflated claims.
- Product reasoning over feature count.
- Evidence over assumptions.
- A complete workflow over many incomplete features.
- Clear metrics over decorative dashboards.
- Maintainability over unnecessary architecture.
- Interview defensibility over impressive-sounding terminology.

The project is complete when:
1. A reviewer can understand the user problem and why it was selected.
2. The main product workflow works end to end.
3. The PRD and implementation are consistent.
4. The analytics instrumentation is functional.
5. Real and simulated evidence are clearly separated.
6. The experiment plan has measurable decision criteria.
7. The research and product decisions have traceable reasoning.
8. The application has been tested and its limitations documented.
9. The case study and screenshots accurately represent the finished work.
10. I can explain and defend every important product decision in an interview.

Start by inspecting the workspace, then execute Phase 1. Do not build the entire product before examining the problem and choosing a defensible initial scope.