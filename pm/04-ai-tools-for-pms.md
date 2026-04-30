# AI Tools & Applications for PMs

Tools change. Workflows persist.

This module is not a directory of AI products.

It is a shortlist of the best tools for the PM jobs that matter most.

---

## The Better Question

Not:

> "What AI tools should I use?"

But:

> "What PM job am I trying to do, and what is the best tool for that job?"

---

## A Note on This Module

AI tools change fast. Products launch, merge, pivot, and disappear every month.

The examples here are a **Spring 2026 snapshot**.

The categories will last longer than the specific tools.

---

## The Rule for This Module

Each tool gets one primary home.

Some tools can do many things. That does not mean we should mention them everywhere.

For each workflow, we will pick:

- **Best default**
- **Best alternative when context changes**
- **What to watch out for**

---

# Before You Paste Anything

AI is useful.

It is also very easy to misuse.

Start with data boundaries before prompts.

---

## Data Safety Basics

**Usually okay:**
- Public market data
- Sanitized examples
- Generic workflows
- Your own rough drafts

**Ask first:**
- Customer interview transcripts
- Internal strategy docs
- Roadmaps
- Product analytics exports

**Do not paste into public tools:**
- PII
- Confidential financials
- Legal documents
- Source code you are not allowed to share
- Unreleased plans

---

## Safer Practices

- Use enterprise versions when working with company data
- Check whether customer data is used for model training
- Anonymize names, emails, companies, and account IDs
- Prefer tools that respect permissions and cite source material
- When in doubt, use synthetic or redacted examples

> AI speed is not worth a trust or compliance incident.

---

## The Shortlist

| PM job | Best default |
|---|---|
| Research repository | Dovetail |
| AI-moderated research | Maze |
| PRDs and product docs | ChatPRD |
| Long-form thinking and editing | Claude |
| Deep research | ChatGPT Deep Research |
| Bounded document Q&A | NotebookLM |
| CSV/data analysis | ChatGPT Data Analysis |
| Product analytics | Mixpanel or Amplitude |
| Design prototype | Figma Make |
| Frontend UI prototype | v0 |
| Working app prototype | Lovable |
| Real codebase changes | Codex |
| AI product evals | Braintrust |
| Roadmap system | Productboard Spark |
| Presentations | Gamma |

---

# Research & Customer Intelligence

AI is strongest here when it preserves evidence.

The goal is not prettier summaries.

The goal is better product decisions grounded in customer reality.

---

## Research Repository

**Best default: [Dovetail](https://dovetail.com/solutions/research-repository/)**

Use it when you have interviews, transcripts, notes, clips, and prior studies that need to become shared customer intelligence.

Why it wins:
- Built for research workflows
- Strong evidence traceability
- Turns prior research into organizational memory
- Better governance than dumping transcripts into a generic chatbot

---

## When Not to Use Dovetail

Dovetail is overkill if:

- You only have a few notes
- You are doing a one-off class exercise
- You do not need a shared research repository
- Your team already has strong research ops elsewhere

For a quick one-off, use a general assistant with sanitized notes.

For real research operations, use a real repository.

---

## AI-Moderated Research

**Best default: [Maze AI Moderator](https://maze.co/features/ai-moderated-interviews/)**

Use it when you need directional qualitative learning at scale.

Good for:
- Concept feedback
- Early problem discovery
- Usability follow-ups
- Learning across time zones

Watch out for:
- Sensitive topics
- High-stakes user groups
- Research where moderator nuance is critical

---

## Research Guardrail

AI can summarize users.

It cannot be users.

If a finding matters, trace it back:

- Who said it?
- In what context?
- How often does it appear?
- Which segment does it affect?
- What alternative explanation could be true?

---

# Writing & Product Docs

PMs write constantly.

AI helps you get from messy thinking to a useful artifact faster.

It does not remove the need to think.

---

## Product Docs

**Best default: [ChatPRD](https://chatprd.ai)**

Use it for:
- PRDs
- User stories
- Acceptance criteria
- Spec critique
- Product-doc templates

Why it wins:
- PM-specific workflows
- Better defaults than a blank chatbot
- Useful critique modes for product, engineering, and design review

---

## Long-Form Thinking

**Best default: [Claude](https://claude.ai)**

Use it when you need:
- Nuanced writing
- Long-context synthesis
- Strategy memos
- PRD rewrites
- Tone and audience adaptation

Claude is especially useful when you already know the substance and need help shaping it.

---

## Workspace Docs

**Best when your team already uses it: [Notion AI](https://www.notion.com/product/ai)**

Use it when the source material and final artifact already live in Notion.

Do not adopt Notion AI just because it has AI.

Adopt it if it reduces context switching for your team.

---

## PRD Prompt

```
Here is context for a feature:
[paste problem, user, research, constraints]

Draft a one-page PRD with:
- Problem statement
- Target user
- Goals and success metrics
- Core user stories
- V1 requirements
- Non-goals
- Risks
- Open questions

Then critique it like a skeptical engineering,
design, and business reviewer.
```

---

## The Edit Pass

After AI drafts, ask:

- What is vague?
- What assumption is unsupported?
- What requirement is too broad?
- What metric could be gamed?
- What would engineering push back on?
- What would a user not understand?

This is where the PM earns the artifact.

---

# Knowledge & Deep Research

PMs spend enormous time looking for context.

AI is turning search into synthesis.

But "synthesis" is only useful when you can inspect the sources.

---

## Deep Research

**Best default: [ChatGPT Deep Research](https://openai.com/index/introducing-deep-research/)**

Use it for:
- Market maps
- Competitive landscapes
- Vendor comparisons
- Strategic briefs
- Multi-source research with citations

Why it wins:
- Better fit for broad, cited research reports
- Can combine web sources with uploaded or connected context
- Produces an artifact you can verify and share

---

## Bounded Source Q&A

**Best default: [NotebookLM](https://notebooklm.google.com)**

Use it when you have a fixed packet of sources:

- Research reports
- PDFs
- Class readings
- Meeting notes
- Product docs

NotebookLM is not the best general chatbot.

It is excellent when you want answers grounded in a known set of sources.

---

## Fast Market Scan

**Best lightweight option: [Perplexity](https://www.perplexity.ai)**

Use it when:

- You need a quick cited overview
- You are early in exploration
- You want links to follow

Do not use it as the final source of truth for strategic decisions.

Use it to find where to look next.

---

## Source Discipline

For research outputs, require:

- Dates
- Links
- Source names
- Confidence levels
- What was not found
- Contradictions across sources

If the answer matters, click the sources.

---

# Data, Metrics & Analytics

AI can make PMs more self-sufficient with data.

It can also make bad analysis faster.

---

## Ad Hoc Data Analysis

**Best default: [ChatGPT Data Analysis](https://chatgpt.com)**

Use it for:
- CSV exploration
- Quick charts
- Data cleaning
- Segment comparisons
- Finding anomalies

Why it wins:
- Strong file handling
- Can run analysis code
- Good for follow-up questions

Validate before using numbers in a serious deck.

---

## Spreadsheet Work

**Best default: use the AI inside your existing spreadsheet**

If you live in Excel, use [Excel Copilot](https://www.microsoft.com/en-us/microsoft-365/copilot).

If you live in Google Sheets, use [Gemini in Sheets](https://workspace.google.com/products/sheets).

The best tool is the one closest to where the data already lives.

---

## Product Analytics

**Best default: your product analytics stack**

Choose based on where your event data already lives:

- [**Mixpanel**](https://mixpanel.com): strong for self-serve product analytics and natural-language exploration
- [**Amplitude**](https://amplitude.com): strong for enterprise product analytics and customer intelligence

Do not move analytics stacks for an AI feature.

Bad event taxonomy beats good AI every time.

---

## Data Workflow

1. Start with the decision
2. Define the metric
3. Check the event taxonomy
4. Ask AI for analysis
5. Inspect the query or method
6. Validate surprising findings
7. Translate the insight into a recommendation

AI can help with the middle.

You own the frame and the recommendation.

---

## Analytics Prompt

```
I am trying to decide whether to invest in
improving onboarding.

Analyze activation by acquisition channel,
new vs returning users, and signup cohort.

Before answering, list the metric definitions
you need and any ambiguity in the data.
```

---

## Analytics Failure Modes

- Wrong event definition
- Wrong grain of analysis
- Correlation treated as causation
- Small sample size ignored
- Seasonality ignored
- Internal/test users included
- Averages hiding segment differences

AI accelerates analysis.

It does not eliminate statistical judgment.

---

# Design & Prototype Ladder

AI is collapsing the time between idea and artifact.

That does not mean every artifact is equally useful.

---

## The Prototype Ladder

| Question | Best tool |
|---|---|
| Can we explain the flow? | Figma |
| Can it feel real? | Figma Make |
| Can we generate a polished frontend? | v0 |
| Can stakeholders use it? | Lovable |
| Can it fit our codebase? | Codex |

Choose the lowest rung that answers the question.

---

## Design Prototype

**Best default: [Figma Make](https://www.figma.com/make/)**

Use it when:
- Your team already works in Figma
- Visual fidelity matters
- You want to start from existing frames or design-system context
- You need an interactive prototype, not just a static mock

Why it wins:
- It keeps design work close to the design system
- It helps PMs and designers explore together

---

## Frontend UI Prototype

**Best default: [v0](https://v0.dev)**

Use it when:
- You want a polished React-style interface quickly
- You need a dashboard, landing page, app shell, or component
- You care about frontend structure, not just visuals

v0 is best when the question is:

> "What could this product experience look and feel like in code?"

---

## Working App Prototype

**Best default: [Lovable](https://lovable.dev)**

Use it when:
- You want a functional app from prompts, screenshots, or docs
- You need stakeholders to click through a real flow
- You want to validate the product idea, not the code architecture

Good alternative: [Bolt](https://bolt.new) when you want a browser-based builder with strong full-stack momentum.

---

## Prototype Rules for PMs

- Know what you are testing
- Label what is real vs fake
- Do not confuse polish with validation
- Do not promise prototype code as production code
- Bring engineering in before the prototype becomes the plan

> A prototype is a learning artifact, not a contract.

---

## Real Codebase Work

**Best default: [Codex](https://openai.com/codex)**

Use it when:
- You need to understand an existing codebase
- You want a small feature or bug fix explored
- You want tests run, files changed, and trade-offs explained

Good alternatives:
- [**Cursor**](https://www.cursor.com): best if you want AI inside your editor
- [**Claude Code**](https://docs.anthropic.com/en/docs/claude-code): strong terminal coding agent

PMs do not need to become engineers.

But they do need to understand what is now feasible in hours.

---

## When PMs Should Code

**Good reasons:**
- Internal tools
- Prototype a workflow
- Test feasibility
- Automate repetitive work
- Create a demo to improve discussion

**Bad reasons:**
- Avoiding engineering collaboration
- Sneaking work into production
- Treating generated code as automatically safe
- Building without understanding the user problem

---

# Building AI Products

Using AI tools is one skill.

Shipping AI inside your product is another.

PMs need to understand both.

---

## What Changes in AI Products

Traditional software usually fails visibly.

AI products often fail softly:

- Confident wrong answer
- Incomplete answer
- Unsafe answer
- Weird edge case
- Slow response
- Expensive response
- Technically correct but unhelpful output

That changes how you define quality.

---

## AI Product Metrics

For AI features, track:

- Task success rate
- Grounding / citation quality
- Factual error rate
- Escalation or handoff rate
- User correction rate
- Latency
- Cost per successful task
- Retention after first successful use
- User trust and satisfaction

You need product metrics and model-quality metrics.

---

## AI Evaluation

**Best default: [Braintrust](https://www.braintrust.dev)**

Use it when:
- AI quality determines product quality
- You need evals, traces, prompt/model comparisons, and human review
- You want production failures to become future test cases

Why it wins:
- Evals are central, not an afterthought
- Product and engineering can inspect the same failure evidence

---

## Open-Source Alternative

**Best default if self-hosting matters: [Langfuse](https://langfuse.com)**

Use it when:
- You need open-source LLM observability
- You want tracing, prompt management, evals, and cost/latency visibility
- Your team wants more control over deployment

Braintrust is the cleaner default for teams optimizing AI quality.

Langfuse is the stronger default when open source and self-hosting matter.

---

## PM Role in AI Evaluation

PMs should help define:

- Which user tasks matter
- What counts as a successful answer
- Which failures are unacceptable
- Where human review is required
- What trade-off is acceptable between quality, speed, and cost
- What to show the user when AI is uncertain

This is product judgment, not just ML engineering.

---

# Roadmaps & Product Systems

AI works best when it is grounded in the product system where decisions already happen.

Do not add another disconnected AI workspace unless it clearly improves the work.

---

## Roadmap System

**Best default: [Productboard Spark](https://www.productboard.com/product/spark/)**

Use it when:
- You need feedback analysis, product specs, and roadmap thinking in one PM-oriented system
- You want AI grounded in product context, customers, and strategy
- You need discovery signals to connect to roadmap decisions

This is the best fit when PM workflow is the center of gravity.

---

## Atlassian Organizations

**Best default: [Jira Product Discovery + Rovo](https://www.atlassian.com/software/jira/product-discovery)**

Use it when:
- Your company already runs on Jira and Confluence
- You need discovery work tied tightly to delivery work
- You want AI inside existing Atlassian workflows

The best tool is often the one your organization will actually adopt.

---

## Prioritization Assistance

You do not need a special tool for prioritization.

Use an LLM to structure the conversation:

1. List candidate opportunities
2. Add reach, impact, confidence, effort
3. Ask AI to apply RICE or ICE
4. Ask which inputs are weakest
5. Challenge the results with your team

Frameworks clarify trade-offs.

They do not make the decision.

---

## Prioritization Prompt

```
Here are 8 features we are considering for Q2.
For each, I included reach, impact, confidence,
effort, strategic fit, and risks.

Apply RICE scoring.

Then:
1. Identify the least reliable scores
2. Name the assumptions driving the ranking
3. Suggest what evidence would change the decision
```

---

# Communication & Stakeholder Output

AI can speed up communication.

It cannot decide what story needs to be told.

---

## Presentations

**Best default: [Gamma](https://gamma.app)**

Use it when:
- You need a polished first draft quickly
- You want to turn a memo or outline into a deck
- You care more about speed than custom formatting

Best alternative:
- [**PowerPoint Copilot**](https://www.microsoft.com/en-us/microsoft-365/copilot) if your org lives in Microsoft 365

Use these for structure and polish.

Do not outsource the argument.

---

## Status Updates

Use any strong writing assistant.

The workflow matters more than the tool:

1. Paste detailed notes
2. Ask for a 3-bullet exec version
3. Ask for an engineering version
4. Ask for risks, decisions, and asks
5. Edit to match reality

Same facts, different audience.

That is PM communication.

---

## Executive Summary Prompt

```
Summarize this update for executives.

Format:
- What changed
- Why it matters
- Decision or help needed
- Risks
- Next milestone

Use direct language. Do not hide bad news.
```

---

# What I Would Try First

Pick one workflow this week.

Do not adopt ten tools.

---

## Starter Stacks

**Research-heavy PM:**
Dovetail + Maze

**B2B roadmap PM:**
Productboard Spark + Mixpanel or Amplitude

**Prototype-heavy PM:**
Figma Make + v0 + Lovable

**AI product PM:**
Braintrust + product analytics + human review loop

**Individual PM leveling up:**
Claude + ChatGPT Deep Research + ChatPRD

---

## Adoption Rule

For any new AI tool, run a one-week experiment:

- What workflow did it improve?
- How much time did it save?
- What got better?
- What got worse?
- What risk did it introduce?
- Would you keep using it?

If you cannot answer these, you are collecting tools, not improving work.

---

# Closing

---

## The Tools Will Change

Six months from now, some tools on this list will have changed dramatically.

New ones will exist that we cannot imagine today.

That is fine.

---

## The Judgment Won't

What lasts is your ability to:

- Identify where AI genuinely helps
- Protect sensitive data
- Ask better questions
- Validate outputs
- Connect artifacts to decisions
- Know when human judgment matters most

---

> The PMs who get the most from AI are not the ones using the most tools.
>
> They are the ones who use the right tool for the right workflow, and keep their judgment in the loop.
