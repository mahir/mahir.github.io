# AI Tools & Applications for PMs

You understand what AI can do conceptually. Now let's talk about what you can actually use today.

---

## A Note on This Module

AI tools change fast. Products launch, merge, pivot, and die every month.

This module is a **snapshot**, not a permanent reference. The specific tools will evolve. The categories and evaluation criteria will last.

---

## How to Evaluate Any AI Tool

Before we dive into categories, here's what to look for:

1. **Does it solve a real workflow problem?** Not "is it cool?"
2. **What's the learning curve vs. the time saved?**
3. **Where does your data go?** (Privacy matters)
4. **Can you trust the output without heavy editing?**
5. **What happens when it's wrong?**

Keep these in mind as we go through each category.

---

# Research & User Insights

The first place most PMs feel AI's impact: making sense of qualitative data.

---

## Interview Transcription & Analysis

**The problem:** You have 10 hours of user interviews. Extracting themes takes days.

**Tools to know:**
- [**Dovetail**](https://dovetail.com). \1urpose-built for UX research. Tag, cluster, and surface themes across interviews. "Ask Dovetail" lets anyone query the research repository in natural language.
- [**Looppanel**](https://looppanel.com). \1uto-generates structured notes organized by discussion guide questions. Produces AI-powered affinity maps across participants.
- [**Grain**](https://grain.com). \1ecords, transcribes, and clips key moments. Shareable highlights.
- [**Otter.ai**](https://otter.ai). \1ast transcription with speaker identification. Good free tier.

---

## Survey & Feedback Analysis

**The problem:** Thousands of open-text survey responses. Nobody reads them all.

**Tools to know:**
- [**Notably**](https://notably.ai). \1I-powered qualitative analysis. Synthesizes notes, interviews, and survey data.
- [**Kraftful**](https://www.kraftful.com). \1ggregates feedback from 30+ sources (reviews, tickets, surveys). Extracts themes and top feature requests automatically.
- [**Maze**](https://maze.co). \1ontinuous product discovery with an AI Moderator that conducts user interviews autonomously, generating follow-up questions and bias-free reports.

---

## User Behavior Analytics

**The problem:** You have event data but not enough analysts to dig through it.

**Tools to know:**
- [**FullStory**](https://www.fullstory.com). \1ession replay with AI-powered insights. Finds friction automatically.
- [**Hotjar**](https://www.hotjar.com). \1eatmaps and recordings with AI summaries of user behavior patterns.
- [**Sprig**](https://sprig.com). \1n-product surveys triggered by specific user actions (e.g., cart abandonment). AI analyzes open-ended responses in real time.
- [**Amplitude**](https://amplitude.com). \1sk questions in plain English, get charts. Natural language analytics.

---

## Competitive Intelligence

**The problem:** Tracking competitors manually is tedious and always out of date.

**Tools to know:**
- [**Crayon**](https://www.crayon.co). \1racks competitor websites, pricing, messaging changes automatically.
- [**Klue**](https://klue.com). \1ompetitive intelligence platform. Surfaces battlecards and win/loss insights.

---

> **Start here if:** You spend more than 2 hours a week on research synthesis. The ROI is immediate.

---

# Writing & Documentation

PMs write more than almost anyone in the org. AI makes every piece of writing faster.

---

## AI Writing Assistants

**The problem:** Blank page syndrome. First drafts take forever.

**Tools to know:**
- [**Claude**](https://claude.ai). \1ong-context analysis, nuanced writing, strong at structured documents. Handles entire PRDs and strategy docs.
- [**Notion AI**](https://www.notion.com/product/ai). \1riting assistance inside your existing workspace. Summarize, improve, translate.
- [**Superwhisper**](https://superwhisper.com). \1I voice-to-text for any app. Press a shortcut, dictate, get polished text. Great for capturing ideas fast.

---

## PRD & Spec Generation

General-purpose LLMs work well here, but there are also purpose-built tools.

**Tools to know:**
- [**ChatPRD**](https://chatprd.ai). \1I copilot specifically for PRDs, user stories, and specs. Reviews your drafts like a Chief Product Officer.

**Or use any LLM with a good workflow:**
1. Start with your PRD template
2. Feed it context: problem statement, user research, constraints
3. Ask the AI to draft each section
4. Edit ruthlessly. The AI gives you structure; you add judgment

---

### Example Prompt for PRD Generation

```
Here's context for a new feature:
[paste problem, user, constraints]

Draft a PRD with these sections:
- Problem statement
- Target user
- Goals & success metrics
- Core user stories (3-5)
- Requirements (must-have vs nice-to-have)
- Open questions
- Risks

Be specific. Use metrics where possible.
```

---

## Meeting Notes & Summaries

**The problem:** You're in 6 meetings a day. Notes are inconsistent or nonexistent.

**Tools to know:**
- [**Otter.ai**](https://otter.ai). \1uto-joins meetings, transcribes, generates summaries and action items.
- [**Fireflies.ai**](https://fireflies.ai). \1imilar to Otter. Integrates with CRM and project management tools.
- [**Granola**](https://www.granola.ai). \1ightweight Mac app. Enhances your rough notes with meeting context.

---

## Knowledge Management

**The problem:** Information is scattered across docs, Slack, email, and people's heads.

**Tools to know:**
- [**Notion AI**](https://www.notion.com/product/ai). \1earch and Q&A across your workspace. Summarize pages, generate content.
- [**NotebookLM**](https://notebooklm.google.com). \1pload docs, papers, or notes. Ask questions across all of them. Generates audio overviews you can listen to.
- [**Confluence AI**](https://www.atlassian.com/software/confluence). \1imilar capabilities within the Atlassian ecosystem.

---

> **The real value** isn't generating text from scratch. It's going from rough notes to polished output in minutes instead of hours.

---

# Data Analysis & Metrics

This is where AI tools save PMs from dependency on data teams.

---

## Natural Language to SQL

**The problem:** You know what question to ask, but you can't write the query.

**Tools to know:**
- [**Mode**](https://mode.com). \1sk questions in English, get SQL and visualizations.
- [**Metabase**](https://www.metabase.com). \1pen-source BI tool with natural language querying. Ask "How many users signed up last week?" and get a chart.

---

## Dashboard & Insight Generation

**The problem:** Building dashboards takes analyst time. You need answers now.

**Tools to know:**
- [**Amplitude**](https://amplitude.com). \1atural language queries on your product analytics. Predictive audiences identify churn signals and conversion potential.
- [**Mixpanel**](https://mixpanel.com). \1I-assisted funnel analysis and user segmentation.
- [**PostHog**](https://posthog.com). \1pen-source all-in-one: analytics, session replay, feature flags, A/B testing. AI natural-language querying. Generous free tier (1M events/month).
- [**Looker**](https://cloud.google.com/looker). \1oogle's BI tool with AI features for exploration and anomaly detection.

---

## Spreadsheet AI

**The problem:** You live in spreadsheets but complex formulas slow you down.

**Tools to know:**
- [**Google Sheets**](https://workspace.google.com/products/sheets). \1enerate formulas, create charts, summarize data with Gemini.
- [**Excel Copilot**](https://www.microsoft.com/en-us/microsoft-365/copilot). \1ame concept in the Microsoft ecosystem.

---

## Experimentation & A/B Testing

**The problem:** You want to test hypotheses rigorously but setting up experiments is complex.

**Tools to know:**
- [**Statsig**](https://statsig.com). \1orn from Facebook's internal experimentation infrastructure. AI copilot helps design experiments and surfaces tradeoffs. Free tier includes unlimited feature flags and 2M events/month.
- [**PostHog**](https://posthog.com). \1lso covers experimentation alongside its analytics suite. Open-source with generous free tier.

---

## Ad-Hoc Analysis

**The problem:** You have a CSV and a question. You don't want to wait for an analyst.

**Tools to know:**
- [**Claude**](https://claude.ai). \1pload a CSV, ask questions. Handles complex analysis with reasoning.
- [**ChatGPT**](https://chatgpt.com). \1ode Interpreter runs Python on your data. Generates charts and statistical analysis.

---

### Ad-Hoc Analysis Workflow

1. Export your data as CSV
2. Upload to Claude or ChatGPT
3. Ask: "What are the key trends? Any anomalies?"
4. Follow up with specific questions
5. Validate surprising findings with your data team

---

> **Caution:** AI analysis is a starting point, not a final answer. Always sanity-check numbers before putting them in a deck.

---

# Design & Prototyping

AI is collapsing the time between idea and visual artifact.

---

## AI-Assisted Design

**The problem:** You need to communicate a design idea but don't have designer bandwidth.

**Tools to know:**
- [**Figma**](https://www.figma.com). \1enerate layouts, auto-populate designs, rename layers intelligently.
- [**Google Stitch**](https://stitch.withgoogle.com). \1ormerly Galileo AI (acquired by Google). Generates polished mockups from text, exports production-ready HTML/CSS and Figma files. Best free option (~350 generations/month).
- [**Uizard**](https://uizard.io). \1enerates multi-screen clickable prototypes from conversational prompts. Also converts screenshots and hand-drawn sketches into editable designs.

---

## UI Generation from Text

**The problem:** You want a visual mockup in minutes, not days.

**Tools to know:**
- [**v0.dev**](https://v0.dev). \1ercel's AI UI generator. Describe what you want, get a working React component. Iterate with natural language.
- [**Builder.io**](https://www.builder.io). \1onverts Figma designs into production code. Also generates UIs from prompts and serves as a visual CMS.

Great for quickly testing visual ideas before involving designers.

---

## Full App Prototyping

**The problem:** You want a clickable, functional prototype, not a static mockup.

**Tools to know:**
- [**Bolt**](https://bolt.new). \1enerate full-stack web apps from prompts. Deploy instantly.
- [**Lovable**](https://lovable.dev). \1imilar to Bolt. AI-generated apps with real functionality.
- [**Replit**](https://replit.com). \1I-assisted coding environment. Build and deploy from your browser.

---

## Wireframing

**The problem:** You need to sketch a flow quickly for a meeting in 20 minutes.

**Tools to know:**
- [**tldraw**](https://www.tldraw.com). \1nfinite canvas with AI features. Sketch rough UIs and let AI refine them.
- [**Whimsical**](https://whimsical.com). \1lowcharts and wireframes with AI generation from text descriptions.
- [**Visily**](https://visily.ai). \1uilt for non-designers. Converts text, screenshots, sketches, and flowcharts into high-fidelity designs. Free forever starter tier.

---

> **When to use these:** Early-stage exploration and stakeholder alignment. Not as a replacement for real design work.

---

# Coding & Technical Prototyping

The line between "PM who can prototype" and "PM who can build" is blurring.

---

## AI Code Editors

**The problem:** You want to build something yourself, but coding is slow.

**Tools to know:**
- [**Cursor**](https://www.cursor.com). \1S Code fork with deep AI integration. Tab-complete entire functions. Chat with your codebase.
- [**Windsurf**](https://windsurf.com). \1I-native editor. Multi-file editing with context awareness.
- [**GitHub Copilot**](https://github.com/features/copilot). \1I pair programmer inside VS Code. Autocompletes code as you type.

---

## AI Coding Assistants

**The problem:** You're stuck on a bug or need to understand unfamiliar code.

**Tools to know:**
- [**Claude Code**](https://docs.anthropic.com/en/docs/claude-code). \1ommand-line AI that reads your codebase, writes code, runs tests. Handles complex multi-file changes.
- [**Amp**](https://ampcode.com). \1I coding agent that works across terminal and editor. Multiple agent modes for different tasks.
- [**Copilot Chat**](https://github.com/features/copilot). \1onversational coding help inside your editor.

---

## No-Code / Low-Code with AI

**The problem:** You want a working app but don't want to write code at all.

**Tools to know:**
- [**Replit**](https://replit.com). \1escribe what you want in English, get a deployed app.
- [**Bolt**](https://bolt.new). \1rompt-to-app generation. Full-stack, deployable.
- [**Lovable**](https://lovable.dev). \1ame category. Generates polished web apps from descriptions.

---

## When PMs Should (and Shouldn't) Code

**Do code when:**
- Building internal tools or prototypes
- Testing feasibility before involving engineering
- Automating your own repetitive workflows
- Creating demos for stakeholder buy-in

**Don't code when:**
- It's going into production (leave that to engineers)
- You're avoiding a conversation with your eng team
- The prototype becomes the product (it shouldn't)

---

> **The goal isn't to become an engineer.** It's to close the gap between idea and artifact, so you can learn faster.

---

# Communication & Stakeholder Management

AI can help you communicate more effectively across the org.

---

## Presentation Generation

**The problem:** Making slides takes hours. The content matters; the formatting shouldn't.

**Tools to know:**
- [**Gamma**](https://gamma.app). \1enerate presentations from text. Paste your doc, get a polished deck.
- [**Beautiful.ai**](https://www.beautiful.ai). \1mart templates that auto-format as you add content.
- [**Tome**](https://tome.app). \1I-generated presentations with narrative structure.

---

## Executive Summaries & Status Updates

**The problem:** Translating detailed work into concise updates for different audiences.

**Workflow:**
1. Write your detailed notes or paste your doc
2. Ask AI: "Summarize this for an exec audience in 3 bullets. Focus on business impact and decisions needed."
3. Ask AI: "Now write a version for the engineering team. Focus on technical implications and timeline."

Same information, tailored delivery. Takes 2 minutes.

---

> **Remember:** AI-generated presentations still need your story. The tool handles layout; you handle narrative.

---

# Strategy & Planning

AI can accelerate strategic thinking, not replace it.

---

## Roadmap Tools with AI

**The problem:** Roadmap planning involves synthesizing feedback, business goals, and technical constraints. It's slow.

**Tools to know:**
- [**Productboard**](https://www.productboard.com). \1I-assisted feature prioritization. Clusters customer feedback into themes. Links features to demand weighted by customer revenue.
- [**ProdPad**](https://prodpad.com). \1I CoPilot included free on all paid plans. Uses RAG grounded in your product's actual data and history to generate OKRs, roadmap initiatives, and idea descriptions.
- [**Aha!**](https://www.aha.io). \1enerates roadmap suggestions based on your strategy and feedback data.

---

## Prioritization Assistance

You don't need a specialized tool. Use an LLM.

**Workflow:**
1. List your candidate features with context
2. Ask AI to apply RICE or ICE scoring
3. Challenge the scores. Where does the AI's logic break?
4. Adjust based on your judgment
5. Use the output as a starting point for team discussion

---

### Example Prompt for Prioritization

```
Here are 8 features we're considering for Q2.
For each, I've included reach, impact estimate,
confidence, and effort.

Apply RICE scoring. Then tell me which scores
you're least confident about and why.

[paste feature list with context]
```

---

## Competitive Analysis & Market Research

**The problem:** You need to understand a market quickly.

**Tools to know:**
- [**Perplexity**](https://www.perplexity.ai). \1I search with citations. Great for fast, sourced market research.
- [**Claude**](https://claude.ai). \1eep analysis of competitive landscapes with reasoning and web search.
- [**ChatGPT**](https://chatgpt.com). \1imilar capabilities for real-time market data with browsing.

---

> **AI is excellent at synthesizing** what's already known about a market. It's poor at predicting what will happen next. That's still your job.

---

## Security & Privacy

**Never put into public AI tools:** Customer PII, confidential financials, unreleased product plans, proprietary source code, legal documents, or employee data.

**Safer practices:** Anonymize data before uploading, check your company's AI policy, use enterprise tiers that don't train on your data.

> **When in doubt, don't paste it.**

---

## Evaluating New AI Tools

**Before adopting anything, ask:**

1. Can you name the specific workflow it improves?
2. Does the demo show your actual use case, or a cherry-picked example?
3. Where does your data go? Is it used for training?
4. Does it fit your existing tools, or is it another silo?

**Red flags:** "AI-powered" slapped on a basic feature, demo only works with pre-loaded data, no clear explanation of what the AI does, claims of replacing entire job functions.

---

# Closing

---

## The Tools Will Change

Six months from now, some tools on this list will have pivoted or been acquired. New ones will exist that we can't imagine today.

That's fine.

---

## The Judgment Won't

What lasts is your ability to:

- Identify where AI genuinely helps vs. where it's theater
- Evaluate new tools quickly and discard what doesn't work
- Protect sensitive data while staying productive
- Know when to trust AI output and when to verify

---

> The PMs who get the most from AI aren't the ones using the most tools.
>
> They're the ones who've mastered the right tools for their specific workflow.
