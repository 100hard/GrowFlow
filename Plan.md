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

## 3. Product concept: Configuration-Driven Small Business Marketing Architect

Working name: GrowthFlow

Concept: An AI-assisted campaign preparation and offer-planning tool for arbitrary small businesses through a reusable, configuration-driven architecture.

### Core Architectural Principle: No Hardcoded Industries
The product must not require application-code changes whenever a user belongs to a new industry.
Do not create industry-specific conditional branches such as:
- If café, show bundle economics.
- If salon, show booking offers.
- If tutor, show course promotions.
- If retailer, show product discounts.

Those can be examples used during testing and regression fixtures, but they must not define the architecture.

### Business Context:
Support arbitrary small businesses by allowing the user to describe or configure:
- Business name and description (custom natural language description, NO fixed dropdown).
- Products or services offered.
- Target customers.
- Geographic or online reach (local foot traffic, regional service area, online).
- Business goals & marketing objectives.
- Preferred marketing channels.
- Available budget and operational constraints.
- Relevant prices, variable costs, inventory, or capacity information when applicable.

Progressive disclosure: Do not require every field for every business. Collect information progressively according to the selected objective and the requirements of the proposed campaign.

### Campaign Planning Engine:
A reusable planning pipeline that:
1. Interprets the business context.
2. Identifies the selected marketing objective.
3. Determines what additional information is necessary.
4. Generates suitable campaign options.
5. Identifies assumptions and missing inputs.
6. Applies relevant deterministic checks.
7. Produces editable campaign materials.
8. Creates an execution checklist.

Separate business context, campaign objectives, campaign formats, feasibility rules, and output rendering into distinct modules.

### Extensible Feasibility Engine:
Replace café-only financial assumptions with reusable, composable checks:
- Price and variable-cost calculations (unit contribution, margin rate, breakeven volume).
- Bundle economics (multi-item / multi-service bundles).
- Capacity & slot constraints (e.g. available appointment slots or seat utilization).
- Budget limits & spend caps.
- Time and scheduling constraints.

The planning engine determines which checks are applicable based on explicit inputs and supported rule definitions.
Never allow the LLM to invent costs, certify profitability, or silently apply assumptions that materially affect financial calculations. When no applicable rule exists or inputs are missing, explain the limitation transparently.

### User Experience:
Progressive disclosure adapting to the user's business and objective without presenting a giant universal form:
- Describe an arbitrary business in natural language.
- Select or explain a marketing goal.
- Supply relevant constraints.
- Review proposed campaigns.
- Understand applicable checks and missing data.
- Edit and approve campaign materials.
- Copy materials and follow an execution checklist.

### Testing Strategy:
- Use the café scenario as a regression test fixture, not a hardcoded special case.
- Test scenarios with varied and previously unsupported business descriptions (e.g. mobile auto detailing, boutique fitness studio, indie bookstore).
- Verify that common workflow handles them through configuration and validated inputs.
- Document which capabilities are genuinely generic and which remain limited.