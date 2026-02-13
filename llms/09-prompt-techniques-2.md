# Prompt Techniques: Refinement

Constitutional AI, Few-Shot Learning, Multi-Modal Reasoning

---

## Constitutional AI (CAI) Self-Critique

**Definition:** A technique where the LLM critiques and revises its own responses based on a set of principles or "constitution," leading to more aligned and thoughtful outputs.

### Strengths & Limitations
- ✅ Improves response quality and safety without external oversight
- ✅ Teaches the model to identify its own weaknesses
- ❌ May be overly conservative, removing acceptable content
- ❌ Self-critique quality varies with model capability

### Best Practices
- Provide specific criteria for critique (bias, accuracy, completeness)
- Use a two-step process: critique, then revise
- Balance thoroughness with practical constraints
- **Pitfall to avoid:** Don't make the constitutional principles too vague or contradictory

---

## Constitutional AI: Example

```
Write a blog post about the benefits of remote work for
productivity.

[After receiving initial response]

Now critique your blog post using these constitutional
principles:

1. Factual accuracy: Are all claims supported by evidence?
   Flag unsupported assertions.
2. Balanced perspective: Does this present potential drawbacks
   alongside benefits?
3. Inclusivity: Does this consider different work styles,
   industries, and accessibility needs?
4. Practical value: Are the insights actionable for readers?

Based on your critique, provide a revised version that
addresses these issues while maintaining engagement and
readability.
```

---

## Few-Shot Learning with Semantic Exemplars

**Definition:** Strategic selection of examples that are semantically similar to the target task, optimizing the few-shot learning performance through careful exemplar curation.

### Strengths & Limitations
- ✅ Dramatically improves task performance with minimal training data
- ✅ Allows rapid adaptation to new domains
- ❌ Requires careful selection of high-quality exemplars
- ❌ Performance ceiling limited by example quality and diversity

### Best Practices
- Choose examples that span the complexity range of your task
- Ensure examples are from the same domain/style as target task
- Use 3-5 examples for optimal performance (more isn't always better)
- **Pitfall to avoid:** Don't use examples that are too similar to each other (reduces diversity) or too different from target task

---

## Few-Shot Learning: Example

```
Classify these customer emails as: URGENT, COMPLAINT, INQUIRY,
or SPAM.

Examples:
- "Your service has been down for 3 hours and I'm losing money
  every minute!" → URGENT
- "I've tried calling support 5 times about my billing error
  with no response." → COMPLAINT
- "What are your hours of operation for the downtown location?"
  → INQUIRY
- "Congratulations! You've won $1000! Click here to claim your
  prize!" → SPAM

Now classify: "I signed up yesterday but can't access my
account. The password reset isn't working and I have a
presentation tomorrow morning that requires your platform.
Please help ASAP."

Classification: ___
Confidence level (1-5): ___
Key indicators that led to this classification: ___
```

---

## Multi-Modal Chain Reasoning

**Definition:** Integrating visual, textual, and other modalities in reasoning chains, allowing LLMs to process and reason across different types of information simultaneously.

### Strengths & Limitations
- ✅ Leverages complementary information from different modalities
- ✅ More comprehensive understanding than single-modal approaches
- ❌ Requires multimodal model capabilities
- ❌ Complex integration can introduce new error modes

### Best Practices
- Explicitly reference what information comes from which modality
- Use cross-modal verification (text confirms visual observations)
- Structure reasoning to show modal contributions clearly
- **Pitfall to avoid:** Don't assume the model can perfectly integrate all modalities — verify critical cross-modal inferences

---

## Multi-Modal Reasoning: Example

```
Examine this company's latest stock chart and earnings report:

Multi-modal analysis:
1. VISUAL patterns: What trends do you see in the data? Any
   unusual spikes or dips?
2. TEXT-VISUAL alignment: Do the narrative explanations match
   what the chart shows?
3. ANALYTICAL insights: What does combining both sources reveal
   about business performance?
4. RED FLAGS: Any discrepancies between the chart data and
   written explanations?

Provide a comprehensive assessment using both information
sources, noting when they reinforce or contradict each other.
```
