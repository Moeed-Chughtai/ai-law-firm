# Demo Script: AI Law Firm (2 to 3 Minutes)

## [0:00 to 0:15] Hook and Problem

**"Every startup faces the same problem. Legal document review costs 5,000 to 15,000 dollars and takes 1 to 2 weeks. We built an AI system that delivers Big Law quality analysis in 90 seconds for a fraction of the cost."**

**"Let me show you how it works."**

---

## [0:15 to 1:30] Product Demo

**"I'm uploading a SAFE agreement. Watch what happens."**

**[Upload document, show pipeline starting]**

**"The system runs a 9 stage agentic pipeline. Each stage is a specialized agent. Together they act as an agent swarm that mirrors Big Law workflows, with strict rules and guardrails so the output is commercially viable."**

**[Point to stages as they complete]**

**"Stage 1, Intake.** The first agent in the swarm acts as an intake partner. It runs in a constrained environment: conflict check rules, engagement scope boundaries, document type taxonomy. That is our first commercial guardrail. We do not analyze until we have validated scope and conflicts. Output is structured so the next agents get a clean handoff."

**"Stage 2, Parsing.** A dedicated parsing agent extracts parties, roles, and key terms. It is constrained by standard form templates in RAG and a fixed output schema so every downstream agent sees the same structure. No free form. That keeps the swarm aligned and prevents drift."

**"Stage 3, Issue Analysis.** The issue spotting agent compares clauses to market standards from RAG using a predefined taxonomy and severity rules. Constrained execution: it cannot invent categories or severities. It only chooses from allowed values and dependencies. This sets up the research stage with a clear, comparable set of issues."

**"Stage 4, Research.** Here the agent swarm idea is explicit. For each issue we run multiple RAG queries in parallel: market norms, risk, negotiation angles. The agent synthesizes those into one research summary with citation IDs. Execution is constrained: every claim must be grounded in retrieved chunks. That grounding is also a commercial guardrail. No unsupported recommendations."

**[Synthesis completes]**

**"Stage 5, Synthesis.** The synthesis agent is the decision maker in the swarm. It follows a Partner Decision Protocol: primary action, fallback, walk away threshold, confidence scores. Constrained by that protocol and only the research it can cite. Commercial guardrails kick in here: low confidence scores trigger human review flags later. So we get calibrated output, not overconfident advice."

**"Stage 6, Drafting.** The drafting agent produces redlines and margin comments. It is constrained to the synthesis recommendations and to cross referencing citation IDs. No new recommendations, no new legal judgment. That constraint is also a guardrail: we avoid scope creep and keep every change traceable back to research."

**[Adversarial review]**

**"Stage 7, Adversarial Review.** A separate agent acts as devil's advocate. Multiple agents in dialogue: synthesis and drafting versus the reviewer. Constrained environment: max 2 revision loops enforced by the pipeline, clear pass fail and revision request rules. If it fails we loop back to synthesis with critiques and iterate. Commercial guardrail: we do not ship until this agent is satisfied. So we do not ship weak analysis."**

**[Guardrails]**

**"Stage 8, Guardrails.** Dedicated commercial guardrails, all deterministic. Hallucination check: cited precedents must exist in RAG. Scope compliance: recommendations must match intake scope. Ethics checks. Confidence thresholds. Any breach sets escalation flags. The environment is fully constrained at this point so the system is derisked for real use."**

**[Deliverables]**

**"Stage 9, Deliverables.** The packaging agent outputs exactly four deliverables: issue memo, annotated doc, risk summary, audit log. Constrained to that set and to structured JSON. The audit log is the final guardrail: full traceability for compliance and so every recommendation can be audited back to source."**

**[Show results]**

**"In about 90 seconds we ran a swarm of specialized agents in a constrained pipeline with multiple guardrails. You get Big Law style analysis grounded in precedent and safe enough for commercial use."**

---

## [2:15 to 2:50] Commercial Upside

**"The commercial opportunity is massive."**

**"Market size: 50 billion dollar legal services market. Document review is 30 to 40 percent of that. We are targeting the 15 billion dollar venture financing segment first."**

**"Unit economics: Current cost is 5K to 15K per review, takes 1 to 2 weeks. Our system delivers same quality in 90 seconds for 50 to 200 dollars. That is a 25 to 300x cost reduction."**

**"Scalability: One Big Law associate can do 2 to 3 reviews per week. Our system can do thousands per day. Same quality, 1000x throughput."**

**"Go to market: Start with law firms as white label solution, then direct to startups. Law firms save 80 percent on associate time. Startups get Big Law quality at startup prices."**

**"This is not just a tool. It is a new category. We are not automating lawyers. We are creating a new service layer that makes high quality legal analysis accessible to everyone."**

---

## [2:50 to 3:00] Closing

**"We built a system that shows how agentic orchestration can turn a high skill domain into an automated, scalable service while keeping professional grade quality through robust guardrails."**

**"This is production ready today. Thank you."**

---

## Key Talking Points (If Questions)

**Technical Depth:**
• "RAG system uses pgvector with 1536 dimensional embeddings"
• "Multi query retrieval with context compression reduces token usage 40 to 60 percent"
• "Full audit trails for compliance and quality assurance"

**Differentiation:**
• "Not just LLM. Grounded in actual legal precedents via RAG"
• "Adversarial review loopback ensures quality, not just speed"
• "Commercial guardrails make it production ready, not experimental"

**Traction:**
• "Processes documents in 30 to 90 seconds"
• "Handles SAFEs, term sheets, convertible notes"
• "Scalable to thousands of documents per day"
