# Prompt Techniques: Advanced

Iterative Refinement, Persona Switching, Meta-Cognitive

---

## Iterative Refinement with Feedback Loops

**Definition:** A dynamic prompting approach where initial responses are systematically improved through multiple rounds of targeted feedback and refinement.

### Strengths & Limitations
- ✅ Produces higher quality outputs through iterative improvement
- ✅ Allows for complex task decomposition
- ❌ Requires multiple model calls (increased cost/latency)
- ❌ May converge on local optima rather than global solutions

### Best Practices
- Provide specific, actionable feedback at each iteration
- Limit to 3-4 iterations to balance quality and efficiency
- Track what's improved/maintained between iterations
- **Pitfall to avoid:** Don't provide vague feedback like "make it better" — be specific about what needs improvement

---

## Iterative Refinement: Example

```
DRAFT 1 PROMPT: "Develop a go-to-market strategy for our new
AI-powered project management tool targeting small businesses."

FEEDBACK FOR ITERATION 2: "Your initial strategy is too
generic. Please refine it to: 1) Include specific pricing tiers
with justification, 2) Identify our top 3 competitor
differentiators, 3) Add concrete marketing channel
recommendations with budget allocation."

ITERATION 2 PROMPT: "Revise the strategy addressing the
feedback above. Focus on actionable specifics rather than
general principles."

FEEDBACK FOR ITERATION 3: "Good improvements on specificity.
Now enhance by: 1) Adding a 90-day launch timeline with key
milestones, 2) Including risk mitigation strategies for each
phase, 3) Defining success metrics and KPIs."

FINAL ITERATION PROMPT: "Incorporate the timeline, risk
management, and metrics requirements. Ensure the final strategy
is implementation-ready."
```

---

## Contextual Persona Switching

**Definition:** Dynamically shifting between different expert personas or perspectives within a single conversation to leverage specialized knowledge and viewpoints.

### Strengths & Limitations
- ✅ Accesses specialized knowledge domains effectively
- ✅ Provides comprehensive multi-perspective analysis
- ❌ May create inconsistent recommendations across personas
- ❌ Persona authenticity varies with model training

### Best Practices
- Clearly signal persona transitions with explicit cues
- Choose complementary rather than conflicting perspectives
- Synthesize insights across personas for final recommendations
- **Pitfall to avoid:** Don't switch personas too frequently within a single reasoning chain — it creates confusion

---

## Persona Switching: Example

```
Evaluate whether our company should invest $2M in blockchain
infrastructure:

CHIEF TECHNOLOGY OFFICER PERSONA: "Assess this from a technical
architecture standpoint. Consider scalability, security,
integration complexity with existing systems, and long-term
maintainability. What are the technical risks and benefits?"

CHIEF FINANCIAL OFFICER PERSONA: "Switch to financial analysis
perspective. Evaluate ROI projections, operational cost changes,
capital requirements, and impact on cash flow. How does this
investment compete with other priorities?"

CUSTOMER SUCCESS DIRECTOR PERSONA: "Now analyze from a customer
impact angle. How will blockchain features affect user
experience, solve current pain points, and potentially create
new value propositions?"

STRATEGIC SYNTHESIS: "Combine all perspectives into a balanced
recommendation. Where do the analyses align, and what are the
key trade-offs to consider?"
```

---

## Meta-Cognitive Prompting

**Definition:** Prompting techniques that make the LLM aware of and reflective about its own reasoning processes, limitations, and confidence levels.

### Strengths & Limitations
- ✅ Improves calibration between confidence and accuracy
- ✅ Helps identify when additional information is needed
- ❌ Meta-cognitive accuracy varies significantly across models
- ❌ May overthink simple problems

### Best Practices
- Ask for explicit confidence ratings on key claims
- Request identification of knowledge gaps or uncertainties
- Use meta-cognitive insights to guide follow-up questions
- **Pitfall to avoid:** Don't rely solely on model self-assessment — validate critical claims independently

---

## Meta-Cognitive Prompting: Example

```
Analyze the effectiveness of remote work on employee
productivity based on available research.

META-COGNITIVE REQUIREMENTS:
1. For each claim you make, provide a confidence rating (1-10)
2. Identify what evidence supports vs. contradicts each point
3. Highlight areas where your knowledge might be incomplete
4. Suggest what additional information would strengthen your
   analysis

RESPONSE FORMAT:
"Based on research, remote work increases productivity by
13-50% (Confidence: 7/10). This is supported by Stanford and
Microsoft studies, but I'm less certain about industry
variations."

KNOWLEDGE GAPS I've identified:
- Limited data on long-term effects beyond 2 years
  (Confidence: 3/10)
- Unclear how results vary by employee seniority levels
  (Confidence: 4/10)
- Insufficient research on hybrid vs. fully remote models
  (Confidence: 5/10)

TO INCREASE CONFIDENCE, I would need:
- More recent post-2023 longitudinal studies
```
