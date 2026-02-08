# AI Law Firm — Enterprise-Grade Legal Analysis Platform

A production-ready legal analysis system that mirrors Big Law workflows using a 9-stage agentic pipeline with PostgreSQL + pgvector RAG, adversarial review loops, and comprehensive quality controls.

---

## The 9-Stage Agentic Pipeline

Each stage uses **agentic reasoning** where GPT-4o acts as a specialized legal expert with specific tools, context, and validation criteria. Stages are **sequential** and **stateful** — each builds on prior outputs.

### **Stage 1: Intake & Scoping**
**Purpose**: Initial document validation and engagement scoping  
**Why It Exists**: Law firms must validate conflicts, define scope, and assess document quality before analysis begins  

**Agentic Architecture**:
- **Agent Role**: Intake Specialist
- **Tools/Context**: 
  - Document metadata (filename, size, type)
  - RAG retrieval of similar past matters
- **Reasoning Process**:
  1. Extract document type (e.g., SAFE, term sheet, NDA)
  2. Perform conflict check against past clients/matters
  3. Define engagement scope (review vs redraft vs negotiate)
  4. Flag any intake red flags (missing pages, corrupted text)
- **Output**: `IntakeResult` with conflict check status, engagement scope, document type classification

**File**: `lib/pipeline/stages/intake.ts`

---

### **Stage 2: Document Parsing**
**Purpose**: Extract structured data from unstructured legal text  
**Why It Exists**: Legal documents have implicit structure (parties, terms, conditions) that must be explicit for analysis  

**Agentic Architecture**:
- **Agent Role**: Document Parser
- **Tools/Context**: 
  - Full document text
  - RAG retrieval of standard clause patterns
- **Reasoning Process**:
  1. Identify all parties and their roles (Investor, Company, Founder)
  2. Extract key terms (valuation cap, discount rate, maturity date)
  3. Extract critical dates (closing, milestones, expirations)
  4. Build defined terms glossary (e.g., "Qualified Financing" = ...)
  5. Identify missing standard provisions (e.g., no "Most Favored Nation" clause)
- **Output**: `ParsingResult` with parties array, key terms object, dates array, defined terms, missing provisions

**File**: `lib/pipeline/stages/parsing.ts`

---

### **Stage 3: Issue Analysis**
**Purpose**: Detect and categorize all legal issues in the document  
**Why It Exists**: Issues must be identified before they can be researched — this is the diagnostic phase  

**Agentic Architecture**:
- **Agent Role**: Issue Spotter
- **Tools/Context**: 
  - Parsed document structure
  - RAG retrieval of market-standard terms for this document type
- **Reasoning Process**:
  1. Compare each clause to market standards (RAG lookup)
  2. Categorize issues by type (valuation, governance, liquidation, etc.)
  3. Assess severity (critical, high, medium, low)
  4. Identify interaction effects (e.g., "weak anti-dilution + high valuation cap = compounded risk")
  5. Note deviations from standard form agreements
- **Output**: `IssueAnalysisResult` with issues array, each containing title, category, severity, interaction effects, deviation notes

**File**: `lib/pipeline/stages/issueAnalysis.ts`

---

### **Stage 4: Legal Research**
**Purpose**: Research each issue using RAG retrieval of legal precedents and market data  
**Why It Exists**: Recommendations require evidence — this is the research phase  

**Agentic Architecture**:
- **Agent Role**: Research Attorney
- **Tools/Context**: 
  - All identified issues
  - Full RAG vector database (precedents, case law, market norms)
- **Reasoning Process**:
  1. **For each issue**, execute multi-query RAG retrieval:
     - Market norms query: "What is standard for [issue type] in [document type]?"
     - Risk analysis query: "What are the risks of [current clause] vs [market standard]?"
     - Negotiation leverage query: "What are common negotiation points for [issue]?"
  2. Retrieve and rank precedents by relevance (vector similarity)
  3. Apply context compression (LLM re-ranking to filter noise)
  4. Generate research summary with citations
- **Output**: `ResearchResult` with researched issues array, each containing market norms, risks, negotiation points, precedents (with citations)

**File**: `lib/pipeline/stages/research.ts`

---

### **Stage 5: Synthesis & Reasoning**
**Purpose**: Synthesize research into actionable recommendations  
**Why It Exists**: Research is raw data — synthesis converts it into strategic advice  

**Agentic Architecture**:
- **Agent Role**: Senior Associate / Of Counsel
- **Tools/Context**: 
  - All research results with citations
  - Client context (stage, leverage, risk tolerance)
- **Reasoning Process**:
  1. For each issue, synthesize research into:
     - **Recommendation**: Specific proposed action (accept, negotiate, reject)
     - **Rationale**: Why this recommendation (cites research)
     - **Primary Action**: Main negotiation strategy
     - **Fallback Position**: If primary fails, what's acceptable
     - **Walk-Away Threshold**: Red line that cannot be crossed
     - **Priority Rank**: Importance in negotiation sequence
  2. Assign confidence scores (0-100) based on research quality
  3. Cross-check for conflicts between recommendations
- **Output**: `SynthesisResult` with synthesized issues array, each containing recommendation, rationale, primary action, fallback, walk-away threshold, priority rank, confidence score

**File**: `lib/pipeline/stages/synthesis.ts`

---

### **Stage 6: Drafting**
**Purpose**: Generate redlines and explanatory memos  
**Why It Exists**: Clients need marked-up documents showing proposed changes  

**Agentic Architecture**:
- **Agent Role**: Drafting Attorney
- **Tools/Context**: 
  - Synthesis recommendations
  - Original document text
- **Reasoning Process**:
  1. Generate two redline versions:
     - **Plain English**: Simple explanation of each change ("Change X to Y because...")
     - **Lawyer View**: Technical markup with strikethrough/insertion formatting
  2. For each recommendation, draft:
     - Exact clause replacement text
     - Rationale in margin comment
     - Cross-reference to research citations
  3. Generate change summary (count of insertions, deletions, critical changes)
- **Output**: `DraftingResult` with plain English version, lawyer redline version, change summary

**File**: `lib/pipeline/stages/drafting.ts`

---

### **Stage 7: Adversarial Review**
**Purpose**: Internal quality control — challenge the analysis before client sees it  
**Why It Exists**: Law firms use peer review to catch errors and strengthen arguments  

**Agentic Architecture**:
- **Agent Role**: Devil's Advocate / Review Partner
- **Tools/Context**: 
  - All prior stage outputs (synthesis, drafting, research)
  - RAG retrieval of counterarguments and edge cases
- **Reasoning Process**:
  1. For each recommendation, generate critiques:
     - **Substantive critique**: Is the legal reasoning sound?
     - **Evidence challenge**: Are citations sufficient?
     - **Alternative interpretation**: Could the clause mean something else?
     - **Client risk**: What if the client's situation changes?
  2. Assign revision requests (must fix, should review, optional improvement)
  3. If critical issues found → trigger revision loop (max 2 iterations)
- **Output**: `AdversarialReviewResult` with critiques array, pass/fail status, revision requests

**Revision Loop**: If adversarial review fails, the pipeline returns to synthesis stage with the critiques as new context, then re-runs drafting and adversarial review. Max 2 loops to prevent infinite revision.

**File**: `lib/pipeline/stages/adversarialReview.ts`

---

### **Stage 8: Guardrails & Approval**
**Purpose**: Final safety checks before delivery  
**Why It Exists**: Catch hallucinations, scope creep, and ethical issues  

**Agentic Architecture**:
- **Agent Role**: Quality Assurance / Ethics Committee
- **Tools/Context**: 
  - Final draft
  - Original document
  - All citations
- **Reasoning Process**:
  1. **Hallucination Check**: Verify every cited precedent exists in RAG database
  2. **Scope Compliance**: Ensure recommendations match engagement scope from intake
  3. **Ethics Check**: Flag any recommendations that violate professional rules
  4. **Citation Audit**: Verify all claims are supported by research
- **Output**: `GuardrailResult` with pass/fail for each check, escalation flag (if partner review required)

**File**: `lib/pipeline/stages/guardrails.ts`

---

### **Stage 9: Final Deliverables**
**Purpose**: Package all outputs for client delivery  
**Why It Exists**: Clients receive structured, auditable work product  

**Agentic Architecture**:
- **Agent Role**: Deliverables Coordinator
- **Tools/Context**: All prior stage outputs
- **Reasoning Process**:
  1. Generate 4 deliverables:
     - **Issue Memo**: Executive summary of all issues and recommendations
     - **Annotated Document**: Redlined doc with margin comments
     - **Risk Summary**: Table of all risks ranked by severity
     - **Audit Log**: Full pipeline trace (timestamps, inputs, outputs, citations)
  2. Generate pipeline metadata (total processing time, stage durations, RAG queries executed)
- **Output**: `FinalizationResult` with 4 deliverable objects + metadata

**File**: `lib/pipeline/stages/finalize.ts`

---

## Pipeline Orchestration

The **Pipeline Engine** (`lib/pipeline/engine.ts`) manages state transitions:

```
┌─────────────────────────────────────────────────────────────┐
│  Intake → Parsing → Issue Analysis → Research → Synthesis  │
│                                                ↓             │
│                         Adversarial Review ←───┘             │
│                                 │                            │
│                          [Pass/Fail?]                        │
│                                 │                            │
│                   ┌─────────────┴─────────────┐              │
│                   │ Pass                       │ Fail        │
│                   ↓                            ↓             │
│              Drafting                   [Revision Loop]     │
│                   ↓                            │             │
│            Guardrails                          │             │
│                   ↓                            │             │
│          Final Deliverables  ←─────────────────┘             │
│                                (Max 2 loops)                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Adversarial Loopback**: If adversarial review fails, returns to synthesis with critique context
- **Max Loop Count**: Prevents infinite revision (hard limit of 2 loops)
- **State Persistence**: Each stage result saved to PostgreSQL `matters` table
- **Progress Tracking**: Real-time UI updates via optimistic state management

---

## Setup & Installation

### Prerequisites
- PostgreSQL 15+ with pgvector extension
- Node.js 18+
- OpenAI API key

### Installation

```bash
# 1. Install pgvector
brew install pgvector

# 2. Create database
createdb legalswarm
psql legalswarm -c "CREATE EXTENSION vector;"

# 3. Install dependencies
npm install

# 4. Configure environment
cat > .env.local << EOF
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://$(whoami)@localhost:5432/legalswarm
ELEVENLABS_API_KEY=your-elevenlabs-api-key
EOF

# 5. Initialize database
npm run db:init

# 6. Seed legal documents (optional)
npm run db:seed

# 7. Run dev server
npm run dev
```

---

## Usage Flow

1. **Upload Document**: Upload SAFE, term sheet, or other legal doc (supports PDF via server-side extraction)
2. **Pipeline Runs**: 9 stages execute sequentially (takes 30-90 seconds depending on document complexity)
3. **View Results**: Navigate through stages in the UI to see parsing, issues, research, recommendations
4. **Download Deliverables**: Issue memo, annotated doc, risk summary, audit log
