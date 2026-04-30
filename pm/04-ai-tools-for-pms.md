# AI Tools & Applications for PMs

Tools change. Workflows persist.

This is not a directory of AI products.

It's a map for choosing the right tool for the PM job in front of you.

---

## The Better Question

Not:

> "What AI tools should I use?"

But:

> "What PM workflow am I trying to improve?"

Tools are only useful when they make a real workflow faster, better, or newly possible.

---

## The Rule

Use the smallest tool that solves the job.

- Need a draft? Use a general assistant.
- Need source-grounded synthesis? Use a research tool.
- Need a prototype? Use a prototyping tool.
- Need AI quality at scale? Use eval tooling.

Do not collect tools. Improve workflows.

---

# Before You Paste Anything

AI speed is not worth a trust or compliance incident.

**Do not paste into public tools:**
- Customer PII
- Confidential financials
- Legal documents
- Proprietary source code
- Unreleased roadmaps

When in doubt, anonymize or use enterprise tools.

---

## The Shortlist

If you remember nothing else, remember this:

- **Research:** Dovetail, Maze
- **Writing:** ChatPRD, Claude
- **Deep research:** ChatGPT Deep Research, NotebookLM
- **Data:** ChatGPT Data Analysis, Mixpanel or Amplitude
- **Prototyping:** Figma Make, v0, Lovable
- **Code:** Codex
- **AI product quality:** Braintrust
- **Roadmaps:** Productboard Spark
- **Slides:** Gamma

---

## Research Repository

**Best default:** [Dovetail](https://dovetail.com/solutions/research-repository/)

Use it when you have interviews, notes, clips, transcripts, and prior studies that should become shared customer intelligence.

Why it wins:
- Built for research workflows
- Strong evidence traceability
- Useful as organizational memory

---

## AI-Moderated Research

**Best default:** [Maze AI Moderator](https://maze.co/features/ai-moderated-interviews/)

Use it for directional learning at scale:

- Concept feedback
- Problem discovery
- Usability follow-ups
- Learning across time zones

Avoid it for sensitive topics or research where moderator nuance is critical.

---

## Research Guardrail

AI can summarize users.

It cannot be users.

If a finding matters, trace it back:

- Who said it?
- In what context?
- Which segment?
- How often?
- What else could explain it?

---

## Product Docs

**Best default:** [ChatPRD](https://chatprd.ai)

Use it for:

- PRDs
- User stories
- Acceptance criteria
- Spec critique

Why it wins: it is built around PM workflows, not generic blank-page writing.

---

## Long-Form Thinking

**Best default:** [Claude](https://claude.ai)

Use it for:

- Strategy memos
- PRD rewrites
- Audience-specific updates
- Critique and editing

Claude is strongest when you know the substance and need help shaping the artifact.

---

## Workspace Docs

**Best when your team already uses it:** [Notion AI](https://www.notion.com/product/ai)

Use it when the source material and final artifact already live in Notion.

Don't adopt a workspace tool just because it has AI.

Adopt it when it reduces context switching.

---

## Deep Research

**Best default:** [ChatGPT Deep Research](https://openai.com/index/introducing-deep-research/)

Use it for:

- Market maps
- Competitive landscapes
- Vendor comparisons
- Strategic briefs

Best for broad research where citations and source review matter.

---

## Bounded Source Q&A

**Best default:** [NotebookLM](https://notebooklm.google.com)

Use it when you have a fixed packet of sources:

- PDFs
- Class readings
- Research reports
- Product docs

NotebookLM is not the best general chatbot.

It is excellent for grounded answers over known sources.

---

## Fast Market Scan

**Best lightweight option:** [Perplexity](https://www.perplexity.ai)

Use it when you need a quick cited overview and links to follow.

Good for early exploration.

Not enough for final strategic decisions.

---

## Source Discipline

For any research output, require:

- Dates
- Links
- Source names
- Confidence level
- What was not found

If the answer matters, click the sources.

---

## Ad Hoc Data

**Best default:** [ChatGPT Data Analysis](https://chatgpt.com)

Use it for:

- CSV exploration
- Quick charts
- Data cleaning
- Segment comparisons

Good for exploration.

Validate before using numbers in a serious deck.

---

## Product Analytics

**Best default:** your existing product analytics stack.

- [**Mixpanel**](https://mixpanel.com): strong for self-serve product analytics
- [**Amplitude**](https://amplitude.com): strong for enterprise analytics and customer intelligence

Do not move analytics stacks for an AI feature.

Bad event taxonomy beats good AI every time.

---

## Analytics Guardrails

Before trusting AI analysis, check:

- Metric definition
- Event taxonomy
- Sample size
- Segment differences
- Internal/test users
- Correlation vs causation

AI accelerates analysis.

It does not eliminate statistical judgment.

---

## Prototype Ladder

- **Explain the flow:** Figma
- **Make it feel real:** Figma Make
- **Generate frontend UI:** v0
- **Build a working app:** Lovable
- **Change a real codebase:** Codex

Choose the lowest rung that answers the question.

---

## Design Prototype

**Best default:** [Figma Make](https://www.figma.com/make/)

Use it when visual fidelity matters and your team already works in Figma.

Why it wins:
- Close to design-system context
- Easy for PMs and designers to explore together
- Better for product conversations than static screenshots

---

## Frontend Prototype

**Best default:** [v0](https://v0.dev)

Use it for:

- Dashboards
- Landing pages
- App shells
- React-style components

Best when the question is: "What could this experience feel like in code?"

---

## Working App Prototype

**Best default:** [Lovable](https://lovable.dev)

Use it when stakeholders need to click through a real flow.

Good alternative: [Bolt](https://bolt.new) when you want a browser-based full-stack builder.

Remember: prototype polish is not product validation.

---

## Real Codebase Work

**Best default:** [Codex](https://openai.com/codex)

Use it when you need to:

- Understand an existing codebase
- Explore a small feature
- Investigate a bug
- Run tests and inspect trade-offs

Good alternatives: Cursor for editor-native work, Claude Code for terminal workflows.

---

## Prototype Rules

- Know what you are testing
- Label what is real vs fake
- Do not confuse polish with validation
- Do not promise prototype code as production code
- Bring engineering in before the prototype becomes the plan

> A prototype is a learning artifact, not a contract.

---

## What Changes

Traditional software usually fails visibly.

AI products often fail softly:

- Confident wrong answer
- Incomplete answer
- Unsafe answer
- Slow or expensive answer
- Technically correct but unhelpful output

That changes how you define quality.

---

## AI Product Quality

For AI features, track:

- Task success
- Factual error rate
- User correction rate
- Escalation rate
- Latency
- Cost per successful task
- Trust and satisfaction

You need product metrics and model-quality metrics.

---

## Evals & Observability

**Best default:** [Braintrust](https://www.braintrust.dev)

Use it when AI quality determines product quality.

Good for:
- Evals
- Traces
- Prompt/model comparisons
- Human review

Open-source alternative: [Langfuse](https://langfuse.com).

---

## PM Role in Evals

PMs should help define:

- Which user tasks matter
- What success means
- Which failures are unacceptable
- Where human review is required
- What to show when AI is uncertain

This is product judgment, not just ML engineering.

---

## Roadmap Systems

**Best execution-native default:** [Linear](https://linear.app)

Use it when product, engineering, issues, projects, and customer requests should live in one fast workflow.

**Best discovery-heavy default:** [Productboard Spark](https://www.productboard.com/product/spark/)

Use it when feedback synthesis, product strategy, and roadmap decisions need to live together.

**Best Atlassian default:** [Jira Product Discovery + Rovo](https://www.atlassian.com/software/jira/product-discovery)

Use it when your company already runs on Jira and Confluence.

---

## Prioritization

You do not need a special AI tool for prioritization.

Use an LLM to structure the conversation:

1. List opportunities
2. Add reach, impact, confidence, effort
3. Ask which inputs are weakest
4. Challenge the result with your team

Frameworks clarify trade-offs. They do not make the decision.

---

## Presentations

**Best default:** [Gamma](https://gamma.app)

Use it when you need a polished first draft quickly.

Best alternative: PowerPoint Copilot if your org lives in Microsoft 365.

Use these for structure and polish.

Do not outsource the argument.

---

## Status Updates

Use any strong writing assistant.

The workflow matters more than the tool:

1. Paste detailed notes
2. Ask for an exec version
3. Ask for an engineering version
4. Ask for risks, decisions, and asks
5. Edit to match reality

Same facts, different audience.

---

## Starter Stacks

**Research-heavy PM:** Dovetail + Maze

**B2B roadmap PM:** Productboard Spark + Mixpanel or Amplitude

**Prototype-heavy PM:** Figma Make + v0 + Lovable

**AI product PM:** Braintrust + product analytics + human review loop

**Individual PM leveling up:** Claude + ChatGPT Deep Research + ChatPRD

---

## Adoption Rule

For any new AI tool, run a one-week experiment:

- What workflow improved?
- What got faster?
- What got better?
- What got worse?
- What risk did it introduce?

If you cannot answer these, you are collecting tools, not improving work.

---

## The Judgment Won't

Tools will change every few months.

What lasts is your ability to:

- Identify where AI genuinely helps
- Protect sensitive data
- Ask better questions
- Validate outputs
- Connect artifacts to decisions

---

> The PMs who get the most from AI are not the ones using the most tools.
>
> They use the right tool for the right workflow, and keep their judgment in the loop.
