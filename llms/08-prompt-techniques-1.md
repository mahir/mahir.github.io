# Prompt Techniques: Reasoning

Chain-of-Thought, Tree of Thoughts, RAG Prompting

---

## Chain-of-Thought (CoT) with Self-Consistency

**Definition:** A reasoning technique that combines step-by-step thinking with multiple solution paths, selecting the most consistent answer across diverse reasoning chains.

### Strengths & Limitations
- ✅ Significantly improves accuracy on reasoning tasks (up to 70% improvement on math problems)
- ❌ Computationally expensive due to multiple inference calls
- ❌ May amplify consistent biases across all reasoning paths

### Best Practices
- Use 3-5 different reasoning approaches for optimal cost-accuracy balance
- Explicitly request "show your work" to ensure transparent reasoning
- **Pitfall to avoid:** Don't use for simple factual queries where reasoning isn't needed

---

## CoT with Self-Consistency: Example

```
I need to decide whether to invest $50,000 in Tesla stock.
Please analyze this decision using three different reasoning
approaches:

Approach 1: Technical analysis - examine recent price trends,
volume, and market indicators

Approach 2: Fundamental analysis - evaluate Tesla's financials,
growth prospects, and competitive position

Approach 3: Risk assessment - consider market volatility,
regulatory changes, and company-specific risks

For each approach, show your step-by-step reasoning, then
compare all three conclusions. Which factors appear most
consistently across approaches? What's your final
recommendation?
```

---

## Tree of Thoughts (ToT) Planning

**Definition:** A systematic exploration technique that treats problem-solving as a search through a tree of intermediate thoughts, allowing backtracking and alternative path exploration.

### Strengths & Limitations
- ✅ Excellent for creative and strategic tasks requiring exploration
- ✅ Allows recovery from poor initial choices
- ❌ Can become computationally explosive with deep trees
- ❌ Requires careful pruning strategies

### Best Practices
- Limit tree depth to 3-4 levels for practical applications
- Use explicit evaluation criteria at each node
- **Pitfall to avoid:** Don't let the tree grow too wide (>3 branches per node) or you'll lose focus

---

## Tree of Thoughts: Example

```
I'm a marketing manager considering a career change to data
science. Map out my transition using Tree of Thoughts:

Level 1: Explore 3 transition approaches
- Full-time bootcamp (6 months)
- Part-time online degree (2 years)
- Self-study + portfolio projects (1 year)

Level 2: For each approach, consider 2 specialization paths
- Machine learning engineering
- Business intelligence/analytics

Level 3: For viable combinations, explore 2 entry strategies
- Target startups for faster growth
```

---

## Retrieval-Augmented Generation (RAG) Prompting

**Definition:** Enhancing prompts with dynamically retrieved, relevant context from external knowledge bases to ground responses in current and accurate information.

### Strengths & Limitations
- ✅ Provides access to current information beyond training cutoff
- ✅ Reduces hallucination by grounding in factual sources
- ❌ Quality depends heavily on retrieval system accuracy
- ❌ Can introduce noise if retrieved context is irrelevant

### Best Practices
- Ensure retrieved context is directly relevant and recent
- Use semantic similarity scoring for retrieval ranking
- Include source attribution in responses
- **Pitfall to avoid:** Don't overwhelm the prompt with too much retrieved context (>2000 tokens optimal)

---

## RAG Prompting: Example

```
I need to analyze this software licensing agreement for
compliance risks. Use the following retrieved legal precedents
and recent case law:

[RETRIEVED CONTEXT]
- DataTech v. CloudCorp (2024): Court ruled that automatic
  renewal clauses require explicit 60-day notice
- Software Licensing Act Amendment (Jan 2025): New requirements
  for data portability rights
- Industry Standard Practice Guide (Dec 2024): Updated
  guidelines on liability limitations
[END RETRIEVED CONTEXT]

Based on these recent developments, analyze the attached
contract focusing on:
1. Renewal and termination clauses - do they comply with
   DataTech v. CloudCorp?
2. Data handling provisions - are they aligned with 2025 Act
   requirements?
3. Liability limitations - do they follow current industry
   standards?
```
