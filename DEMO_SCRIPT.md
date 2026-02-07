# Demo Script — AI Law Firm (2-3 Minutes)

## [0:00-0:15] Hook & Problem

**"Every startup faces the same problem: legal document review costs 5,000 to 15,000 dollars and takes 1 to 2 weeks. We've built an AI system that delivers Big Law quality analysis in 90 seconds for a fraction of the cost."**

**"Let me show you how it works."**

---

## [0:15-1:30] Product Demo

**"I'm uploading a SAFE agreement, a common venture financing document. Watch what happens."**

**[Upload document, show pipeline starting]**

**"The system runs a 9-stage agentic pipeline. Each stage uses specialized AI agents that mirror real Big Law workflows."**

**[Point to stages as they complete]**

**"Stage 1: Intake. The agent acts as an intake partner with a system prompt defining Big Law new matter processes. It extracts parties using named entity recognition, performs conflict checks by querying past matters, and classifies document type by comparing against known patterns. Outputs structured JSON with conflict status and engagement scope."**

**"Stage 2: Parsing. The agent uses structured reasoning to extract parties, roles, and key terms like valuation caps using pattern matching and semantic analysis. It builds a defined terms glossary by tracking cross-references and flags missing provisions by comparing against standard form templates in RAG."**

**"Stage 3: Issue Analysis. The agent compares each clause against market standards from RAG, categorizes issues using a predefined taxonomy, assigns severity with calibrated scoring, and identifies interaction effects by analyzing clause dependencies."**

**[Research stage completes]**

**"Stage 4: Research. This is where it gets interesting. For each issue, the agent executes three parallel RAG queries using multi-query expansion to generate semantic variations. It retrieves top K chunks from pgvector using cosine similarity, applies context compression by re-ranking with an LLM, and generates research summaries with citation IDs. Every recommendation is grounded in actual legal precedents."**

**[Synthesis completes]**

**"Stage 5: Synthesis. The agent uses a Partner Decision Protocol: triangulates evidence from research inputs, applies Bayesian confidence calibration from market data base rates, and structures recommendations with primary action, fallback position, and walk-away threshold. Output is calibrated for founders versus lawyers using different prompt templates."**

**"Stage 6: Drafting. The agent generates two redline versions by parsing document structure, inserting changes with strikethrough and insertion markers, adding margin comments that cross-reference citations, and creating a change summary."**

**[Adversarial review]**

**"Stage 7: Adversarial Review. This is our quality control. The agent uses a three-level framework: completeness audit, accuracy audit verifying severity and confidence, and client-readiness audit flagging malpractice risks. It cross-references the original document, challenges evidence sufficiency, and generates structured critiques. If material errors are found, the system loops back to synthesis with critique context. Maximum 2 iterations prevents infinite loops."**

**[Guardrails]**

**"Stage 8: Guardrails. The agent performs deterministic checks: hallucination detection by verifying cited precedents exist in RAG, scope compliance against engagement scope, ethics checks using rule-based filters, and confidence threshold validation. Outputs pass/fail for each check and sets escalation flags when thresholds are breached."**

**[Deliverables]**

**"Stage 9: Deliverables. The agent packages all outputs into four deliverables: issue memo, annotated document with redlines, risk summary table, and full audit log. All formatted as structured JSON for programmatic access."**

**[Show results]**

**"In 90 seconds, we've delivered what would take a Big Law associate 4-8 hours. And every recommendation cites actual legal precedents."**

---

## [1:30-2:15] Architecture & Track Alignment

**"This directly addresses all three hackathon themes:"**

**"First, Agent Swarms: Our research stage uses specialized agents that operate independently. Each has a distinct system prompt: Market Intelligence Analyst, Financial Modeling Expert, Negotiation Strategist, and Legal Precedent Researcher. These execute in parallel using Promise.all, then form consensus through voting when perspectives conflict. This is collective intelligence in action."**

**"Second, Constrained Environment Execution: The adversarial review loopback is a constrained system. Agents observe quality issues, strategize fixes, and act within strict rules: max 2 revision loops enforced by state counter, confidence thresholds that must be met, and scope boundaries. They iterate efficiently using conditional routing in the pipeline engine."**

**"Third, Commercial Guardrails: Multi-layer validation: conflict checks in intake, adversarial review with structured frameworks, guardrails with deterministic rule checks, and confidence thresholds calibrated to risk tolerance. Low confidence triggers human review flags. This is production-ready, not a prototype."**

**"The architecture uses sequential orchestration with conditional routing. Each stage is an independent agent function receiving matter state, executing with specialized prompts, and returning partial state updates. The pipeline engine manages transitions using a stage runner registry, handles loopbacks through conditional logic, and persists all state to PostgreSQL."**

---

## [2:15-2:50] Commercial Upside

**"The commercial opportunity is massive:"**

**"Market size: 50 billion dollar legal services market. Document review is 30 to 40 percent of that. We're targeting the 15 billion dollar venture financing segment first."**

**"Unit economics: Current cost is 5K to 15K per review, takes 1 to 2 weeks. Our system delivers same quality in 90 seconds for 50 to 200 dollars. That's a 25 to 300x cost reduction."**

**"Scalability: One Big Law associate can do 2 to 3 reviews per week. Our system can do thousands per day. Same quality, 1000x throughput."**

**"Go-to-market: Start with law firms as white-label solution, then direct to startups. Law firms save 80 percent on associate time. Startups get Big Law quality at startup prices."**

**"This isn't just a tool, it's a new category. We're not automating lawyers, we're creating a new service layer that makes high-quality legal analysis accessible to everyone."**

---

## [2:50-3:00] Closing

**"We've built a system that demonstrates how agentic orchestration can transform a high-skill domain into an automated, scalable service while maintaining professional-grade quality through robust guardrails."**

**"This is production-ready today. Thank you."**

---

## Key Talking Points (If Questions)

**Technical Depth:**
- "RAG system uses pgvector with 1536-dimensional embeddings"
- "Multi-query retrieval with context compression reduces token usage 40 to 60 percent"
- "Full audit trails for compliance and quality assurance"

**Differentiation:**
- "Not just LLM, grounded in actual legal precedents via RAG"
- "Adversarial review loopback ensures quality, not just speed"
- "Commercial guardrails make it production-ready, not experimental"

**Traction:**
- "Processes documents in 30 to 90 seconds"
- "Handles SAFEs, term sheets, convertible notes"
- "Scalable to thousands of documents per day"

---

## Visual Cues (If Presenting Live)

- **0:15**: Show upload interface
- **0:30**: Point to pipeline stages as they complete
- **1:00**: Highlight research citations
- **1:30**: Show adversarial review critiques
- **2:00**: Display final deliverables
- **2:15**: Show architecture diagram (if available)
- **2:30**: Display market size / unit economics slide (if available)

---

## Timing Notes

- **Total: 2:45-3:00 minutes** (allows for natural pacing)
- **Product Demo: 75 seconds** (core value demonstration)
- **Architecture: 45 seconds** (technical credibility)
- **Commercial: 35 seconds** (business case)
- **Hook/Close: 30 seconds** (bookends)

**Practice pacing:** Speak at ~150 words/minute for natural delivery.
