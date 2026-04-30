# AI Tools & Applications for PMs

Tools change. Workflows persist.

This module is about how to use AI across the PM job, not memorizing a directory of products.

---

## The Better Question

Not:

> "What AI tools should I use?"

But:

> "What PM job am I trying to do, and what kind of AI help would make it better?"

---

## A Note on This Module

AI tools change fast. Products launch, merge, pivot, and disappear every month.

The examples here are a **Spring 2026 snapshot**.

The categories and judgment calls will last longer than any specific tool.

---

## The PM AI Workflow

For any AI tool, ask:

1. **Input:** What context does it need?
2. **Output:** What artifact should it produce?
3. **Review:** How will I know if it's right?
4. **Decision:** What judgment is still mine?
5. **Integration:** Where does the output go next?

---

# Before You Paste Anything

AI is useful. It is also very easy to misuse.

Start with data boundaries before you start with prompts.

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

## How to Evaluate Any AI Tool

Before adopting anything, ask:

1. Does it solve a real workflow problem?
2. Does it produce evidence, or just confident text?
3. Where does the data go?
4. Does it fit your existing tools?
5. What happens when it is wrong?

---

# Research & Customer Intelligence

This is often where AI creates immediate PM leverage.

Not because it replaces research, but because it helps you process more signal.

---

## The Job

You are trying to turn messy customer input into product decisions.

**Common inputs:**
- Interview transcripts
- Sales calls
- Support tickets
- App reviews
- NPS comments
- In-product survey responses
- Session replays

---

## Research Workflow

1. Collect raw customer input
2. Transcribe and clean it
3. Cluster themes
4. Attach evidence: quotes, clips, accounts, segments
5. Translate themes into opportunities
6. Decide what to do next

AI can help with steps 2-5.

You still own step 6.

---

## Research Repository Tools

**Use when:** You have lots of qualitative data and need organizational memory.

**Tools to know:**
- [**Dovetail**](https://dovetail.com): research repository, transcripts, tagging, AI search, source-backed themes
- [**Looppanel**](https://looppanel.com): interview notes organized by discussion guide, AI-assisted synthesis and affinity mapping
- [**Grain**](https://grain.com): records calls and creates shareable clips

**Look for:** source traceability. If a tool gives you a theme, you should be able to inspect the quote or clip behind it.

---

## AI-Moderated Research

**Use when:** You need directional learning at scale and do not have enough researcher bandwidth.

**Tools to know:**
- [**Maze AI Moderator**](https://maze.co/features/ai-moderated-interviews/): AI-led interviews and follow-up questions
- [**Kraftful / Amplitude**](https://www.kraftful.com): feedback analysis and AI-assisted surveys
- [**Sprig**](https://sprig.com): in-product surveys and AI analysis

**Best for:** early discovery, problem validation, concept feedback.

**Be careful with:** sensitive topics, high-stakes research, and anything where moderation quality really matters.

---

## Voice of Customer at Scale

**Use when:** Customer feedback is everywhere and nobody has time to read it all.

**Tools to know:**
- [**Productboard AI**](https://www.productboard.com): links customer feedback to feature ideas, summarizes notes, finds themes
- [**Amplitude + Kraftful**](https://amplitude.com): combines behavioral analytics with voice-of-customer signals
- [**Dovetail Channels**](https://dovetail.com): classifies high-volume feedback like support tickets, reviews, and surveys

The goal is not "summarize everything."

The goal is to find the signal that should change the roadmap.

---

## Behavior Analytics + Session Evidence

**Use when:** You know what users did, but not why.

**Tools to know:**
- [**FullStory**](https://www.fullstory.com): session replay and friction detection
- [**Hotjar**](https://www.hotjar.com): heatmaps, recordings, and feedback summaries
- [**PostHog**](https://posthog.com): product analytics, replay, feature flags, experiments

Quant tells you where to look.

Qual tells you what it felt like.

---

## Research Guardrail

AI can summarize users.

It cannot be users.

If a finding matters, trace it back to real evidence:

- Who said it?
- In what context?
- How often does it appear?
- Which segment does it affect?
- What alternative explanation could be true?

---

# Thinking & Writing Partner

PMs write constantly.

AI helps you get from messy thinking to a useful artifact faster.

---

## The Writing Workflow

1. Dump rough context
2. Ask AI to structure it
3. Ask for critique
4. Revise with your judgment
5. Create audience-specific versions
6. Share the final artifact

The draft is not the work.

The thinking behind the draft is the work.

---

## General AI Assistants

**Use when:** You need flexible thinking, drafting, summarizing, or critique.

**Tools to know:**
- [**ChatGPT**](https://chatgpt.com): strong general assistant, deep research, data analysis, connectors, agents
- [**Claude**](https://claude.ai): long-context reading, nuanced writing, artifacts, code prototypes
- [**Gemini**](https://gemini.google.com): Google ecosystem, Deep Research, Canvas, Workspace integration
- [**NotebookLM**](https://notebooklm.google.com): source-grounded Q&A over uploaded docs

Pick based on context, not brand loyalty.

---

## PM-Specific Writing Tools

**Use when:** You want product-specific structure and coaching.

**Tools to know:**
- [**ChatPRD**](https://chatprd.ai): PRDs, user stories, CPO-style critique, team templates, integrations
- [**Notion AI**](https://www.notion.com/product/ai): writing, search, and research inside your workspace
- [**Confluence AI**](https://www.atlassian.com/software/confluence): useful if your company already lives in Atlassian

Specialized tools are best when they connect to your team's actual docs, issues, and templates.

---

## Meeting Capture

This category is becoming commodity.

**Tools to know:**
- [**Granola**](https://www.granola.ai): turns rough meeting notes into polished notes
- [**Otter.ai**](https://otter.ai): transcription, summaries, action items
- [**Fireflies.ai**](https://fireflies.ai): meeting transcription with CRM and workflow integrations

The real value is not the transcript.

The value is: decisions, open questions, owners, and follow-ups.

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

Then critique the PRD like a skeptical engineering,
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

---

## When to Use Deep Research

Use deep research when the question requires:

- Multiple sources
- Current information
- Citations
- Market or competitive synthesis
- Internal docs plus external web context
- A report you can share or verify

Do not use it for quick facts or simple brainstorming.

---

## Deep Research Tools

**Tools to know:**
- [**ChatGPT Deep Research**](https://openai.com/index/introducing-deep-research/): multi-source research with citations, uploaded files, connected apps
- [**ChatGPT Agent**](https://help.openai.com/en/articles/11752874-chatgpt-agent): can browse, use tools, work with files, and take actions with user control
- [**Gemini Deep Research**](https://support.google.com/gemini/answer/15719111): research reports with Google ecosystem integration
- [**Perplexity**](https://www.perplexity.ai): fast cited answers and market scans

Best use: first-pass synthesis, not final truth.

---

## Internal Knowledge Search

**Use when:** The answer exists somewhere in your company, but nobody knows where.

**Tools to know:**
- [**Notion Enterprise Search**](https://www.notion.com/product/enterprise-search): searches across Notion and connected apps with citations
- [**ChatGPT Connectors**](https://help.openai.com/en/articles/11487775-connectors-in-chatgpt): connects to tools like Drive, GitHub, SharePoint, and more
- [**NotebookLM**](https://notebooklm.google.com): useful for a bounded packet of docs, papers, or notes

The killer feature is permissions-aware search with sources.

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

But it also makes it easier to produce confident nonsense.

---

## Three Levels of AI Analytics

| Level | Use Case | Examples |
|---|---|---|
| Ad hoc data | CSV, spreadsheet, quick chart | ChatGPT, Claude, Excel Copilot, Google Sheets |
| Product analytics | Funnels, retention, cohorts | Mixpanel, Amplitude, PostHog |
| Data workspace | SQL, notebooks, deeper analysis | Hex, Mode, Looker, Metabase |

Use the right level for the decision.

---

## Ad Hoc Analysis

**Use when:** You have a CSV and need quick exploration.

**Tools to know:**
- [**ChatGPT Data Analysis**](https://openai.com/academy/data-analysis/): upload files, clean data, generate charts, explain findings
- [**Claude**](https://claude.ai): strong at reasoning through messy analysis and producing narrative summaries
- [**Excel Copilot**](https://www.microsoft.com/en-us/microsoft-365/copilot) / [**Google Sheets Gemini**](https://workspace.google.com/products/sheets): useful where the data already lives

Good for exploration.

Not enough for board-slide numbers without validation.

---

## Product Analytics

**Use when:** You need behavioral answers, not spreadsheet answers.

**Tools to know:**
- [**Mixpanel Spark / MCP**](https://mixpanel.com): natural-language analysis and AI tool connections to product data
- [**Amplitude Agents**](https://amplitude.com): AI-assisted product analytics and customer intelligence
- [**PostHog**](https://posthog.com): analytics, session replay, feature flags, experiments, and AI features in one stack

The hard part is not asking the question.

The hard part is trusting the metric definitions.

---

## Data Workflow

1. Start with the decision
2. Define the metric
3. Check the event taxonomy
4. Ask the AI for analysis
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

AI can accelerate analysis.

It does not eliminate statistical judgment.

---

# Design & Prototype Ladder

AI is collapsing the time between idea and artifact.

That does not mean every artifact is equally useful.

---

## The Prototype Ladder

| Question | Artifact | Examples |
|---|---|---|
| Can we explain the flow? | Wireframe or journey | Figma, Miro, Whimsical |
| Does it look real? | High-fidelity UI | Figma Make, Stitch, v0 |
| Can users click it? | Interactive prototype | Figma Make, Stitch, Uizard |
| Can it actually work? | Functional app | Lovable, Bolt, Replit |
| Can it fit our codebase? | Code change | Codex, Claude Code, Cursor |

Choose the lowest rung that answers the question.

---

## AI Design Tools

**Use when:** You need to explore directions quickly or communicate a concept visually.

**Tools to know:**
- [**Figma Make**](https://www.figma.com/make/): prompt-to-app and interactive prototypes inside Figma
- [**Google Stitch**](https://stitch.withgoogle.com): AI design canvas for high-fidelity UI, prototypes, and exports
- [**Uizard**](https://uizard.io): text, screenshots, or sketches to editable prototypes
- [**Whimsical**](https://whimsical.com): quick flows, diagrams, and wireframes

Great for exploration.

Not a substitute for product design craft.

---

## UI and Frontend Generation

**Use when:** You want something polished enough to react to.

**Tools to know:**
- [**v0**](https://v0.dev): AI-generated apps, landing pages, dashboards, components, Vercel deployment
- [**Figma Make**](https://www.figma.com/make/): strong when your team already works in Figma
- [**Builder.io**](https://www.builder.io): useful for design-to-code and visual CMS workflows

Best use: fast visual iteration before you spend engineering or design time.

---

## Working App Prototypes

**Use when:** You need users or stakeholders to experience the idea, not just see it.

**Tools to know:**
- [**Lovable**](https://lovable.dev): PM-friendly app builder from prompts, screenshots, and docs
- [**Bolt**](https://bolt.new): browser-based full-stack builder with fast deployment
- [**Replit Agent**](https://replit.com): app builder with hosting, databases, auth, and agentic development

Working prototypes are powerful because they reveal product questions you did not know to ask.

---

## Prototype Rules for PMs

- Know what you are testing
- Label what is real vs fake
- Do not confuse polish with validation
- Do not promise prototype code as production code
- Bring engineering in before the prototype becomes the plan

> A prototype is a learning artifact, not a contract.

---

## Existing Codebase Tools

**Use when:** You need to understand or modify real code.

**Tools to know:**
- [**Codex**](https://openai.com/codex): coding agent across app, IDE, terminal, and cloud tasks
- [**Claude Code**](https://docs.anthropic.com/en/docs/claude-code): terminal coding agent for reading, editing, testing
- [**Cursor**](https://www.cursor.com) / [**Windsurf**](https://windsurf.com): AI-native editors
- [**GitHub Copilot**](https://github.com/features/copilot): pair programming and code review inside GitHub/VS Code
- [**Jules**](https://jules.google.com): asynchronous coding agent for GitHub tasks

PMs do not need to become engineers.

But they do need to understand what is now feasible in hours.

---

## When PMs Should Code

**Good reasons:**
- Internal tools
- Prototype a workflow
- Test feasibility
- Automate your own repetitive work
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
- Output that is technically correct but unhelpful

That changes how you define quality.

---

## AI Product Metrics

For AI features, track:

- Task success rate
- Grounding / citation quality
- Hallucination or factual error rate
- Escalation or handoff rate
- User correction rate
- Latency
- Cost per successful task
- Retention after first successful use
- User trust and satisfaction

You need product metrics and model-quality metrics.

---

## Evaluation Workflow

1. Define what "good" means
2. Create a set of real or realistic test cases
3. Compare prompts, models, and workflows
4. Review failures with humans
5. Instrument production traces
6. Turn real failures into future test cases
7. Monitor cost, latency, and quality over time

This is the AI version of product quality.

---

## Eval and Observability Tools

**Use when:** Your product depends on LLM or agent behavior.

**Tools to know:**
- [**Braintrust**](https://www.braintrust.dev): evals, prompt/model comparison, production traces, human review
- [**Langfuse**](https://langfuse.com): open-source LLM observability, prompt management, evals, tracing
- [**LangSmith**](https://www.langchain.com/langsmith): agent observability, evals, monitoring, trace analysis
- [**Arize Phoenix**](https://phoenix.arize.com): open-source LLM tracing, evaluation, clustering, observability

If you cannot evaluate it, you cannot safely scale it.

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

# Communication & Stakeholder Output

AI can speed up communication.

It cannot decide what story needs to be told.

---

## Presentations

**Use when:** You need a polished first draft or a quick visual narrative.

**Tools to know:**
- [**Gamma**](https://gamma.app): AI-generated presentations and web-style docs
- [**Beautiful.ai**](https://www.beautiful.ai): smart templates and auto-formatting
- [**Canva**](https://www.canva.com): broad design suite with AI presentation features
- [**PowerPoint Copilot**](https://www.microsoft.com/en-us/microsoft-365/copilot): useful inside Microsoft-heavy organizations

Use these for structure and polish.

Do not outsource the argument.

---

## Status Updates

**Workflow:**

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

# Strategy & Planning

AI can accelerate strategic thinking.

It should not replace strategic thinking.

---

## Roadmap and Discovery Systems

**Use when:** You need to connect feedback, ideas, priorities, and execution.

**Tools to know:**
- [**Productboard AI**](https://www.productboard.com): insights, themes, specs, roadmap inputs
- [**Jira Product Discovery / Rovo**](https://www.atlassian.com/software/jira/product-discovery): idea capture, prioritization, Atlassian AI
- [**Aha!**](https://www.aha.io): roadmaps, strategy, feedback, AI features
- [**ProdPad**](https://prodpad.com): roadmap planning and AI-assisted product work
- [**Linear + Productlane**](https://linear.app/integrations/productlane): customer requests, roadmap, and changelog tied to Linear

Best when the AI is grounded in your real product system.

---

## Prioritization Assistance

You do not need a specialized tool for this.

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

## Competitive Analysis

**Tools to know:**
- [**Perplexity**](https://www.perplexity.ai): fast cited research and market scans
- [**ChatGPT Deep Research**](https://openai.com/index/introducing-deep-research/): more structured multi-source reports
- [**Claude**](https://claude.ai): strong synthesis and strategy memo drafting
- [**Crayon**](https://www.crayon.co) / [**Klue**](https://klue.com): competitive intelligence platforms

AI is good at synthesizing what is known.

It is weak at predicting what will happen next.

---

# What I Would Try First

Pick one workflow this week.

Do not adopt ten tools.

---

## Starter Workflows

**Research-heavy PM:**
Dovetail or Maze + ChatGPT/Claude + Notion

**B2B roadmap PM:**
Productboard or Jira Product Discovery + ChatPRD + Mixpanel/Amplitude

**Prototype-heavy PM:**
Figma Make or Stitch + v0/Lovable/Bolt + user feedback

**AI product PM:**
Braintrust or Langfuse + product analytics + human review loop

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
> They are the ones who use the right tools for the right workflow, and keep their judgment in the loop.
