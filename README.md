# 🛡️ Credo AI — The Explainable Trust Engine

## 📌 Executive Summary & Core Mission

**Credo AI** is an enterprise-grade, explainable multi-agent discovery and financial trust-verification platform engineered for students, researchers, and academic scholarship seekers.

In the current global educational ecosystem, students seeking financial aid regularly fall victim to **fraudulent application fee traps**, **malicious phishing domains**, and **conflicting deadline aggregators**. Traditional tools merely wrap basic web search queries and blindly index unverified listings without auditing domain safety or data veracity.

**Credo AI fundamentally changes this dynamic.** Instead of acting as a passive search engine, Credo AI deploys an autonomous **4-Agent Orchestration Loop** running on top of the **Meterless Nightshift** execution proxy, **Zetaris Federated CSV Data Layer**, and **NVIDIA Nemotron** inference engine. Every single opportunity is rigorously audited, reconciled against authoritative ground-truth databases, and delivered alongside a real-time, step-by-step **Auditable Reasoning Trace Log**.

> 💡 **Core Value Proposition:** *"Other platforms help students find scholarships. Credo AI helps them TRUST what they find. We prefer Quality over Quantity."*

## 🛑 Real-World Problem Statement

Financial-aid seeking applicants contend with three critical systemic failures:

1. 📂 **Fragmented & Unstructured Data Silos:** Scholarship listings are scattered across disparate government portals, NGO blogs, unstructured PDF handbooks, and dynamic CSV feeds.

2. ⚠️ **Conflicting Multi-Source Information:** Third-party aggregators routinely state contradictory application deadlines, eligibility criteria, and income tier requirements.

3. 🚨 **Rampant Phishing & Fee Scams:** Malicious actors deploy deceptive domain extensions (e.g., `.xyz`, `.top`, unverified subdomains) that demand illegitimate "application processing fees" from vulnerable applicants.

## 🏗️ Multi-Agent Architecture & System Workflow

Credo AI implements a decoupled, event-driven 4-Agent Orchestration Loop designed specifically for complete auditability, low-latency SSE progress streaming, and zero-false-positive verification.

```
                  ┌───────────────────────────────────────────┐
                  │           Student Profile Input           |
                  │(Major,CGPA,Domicile,Need, Degree, etc)    |
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │               PLANNER AGENT               |                 
                  │Parses profile criteria & builds search    |      
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │             RECONCILER AGENT              |                              
                  │Queries Zetaris Data(Official/Aggregator)  │            
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │            TRUST CRITIC AGENT             │
                  │Flags scams, checks fees & badge scoring   │
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │              REPORTER AGENT               │
                  │Produces final JSON & SSE payload logs     │
                  └───────────────────────────────────────────┘

```

🧠 Autonomous Agent Breakdown (`src/agents/`)

| Agent File | Operational Role | Technical Execution |
| :---- | :---- | :---- |
| **`planner.py`** | **Planner Agent:** Normalizes raw applicant profile inputs into standardized query vectors and eligibility constraints. | NVIDIA Nemotron Inference |
| **`reconciler.py`** | **Reconciler Agent:** Interrogates `ZetarisClient.query_scholarships()` to fetch and merge data across 3 distinct CSV layers (`Official_Providers.csv`, `Aggregator_Listings.csv`, `Unverified_Scams.csv`). | Zetaris Multi-Source RAG |
| **`trust_critic.py`** | **Trust Critic Agent (Core Differentiator):** Evaluates domain signatures (`.xyz`, unverified subdomains), audits fee demands, resolves conflicting dates against official ground truth, and drafts auditable reasoning proofs. | Meterless Nightshift / Trust Logic |
| **`reporter.py`** | **Reporter Agent:** Compiles final structured JSON results, badge assignments, and agent reasoning logs for API payload delivery. | FastAPI Payload Formatter |
| **`pipeline.py`** | **Orchestrator:** Executes the 4-agent flow asynchronously and yields real-time streaming events (`PLANNER`, `RECONCILER`, `TRUST_CRITIC`, `REPORTER`, `COMPLETE`). | Asynchronous Event Generator |

## 🧰 Technology Stack & Integration Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND PRESENTATION LAYER                      |     
│React  •Tailwind CSS  • Next.js  • Live SSE Stream Components • Figma│
└────────────────────────────────┬────────────────────────────────────┘
                                 │ Async HTTP / SSE Event Source
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                            BACKEND ORCHESTRATION                 |
│       Python 3.12  •  FastAPI  •  Uvicorn  •  Pydantic Schemas   |      
└────────────────┬───────────────────────────────┬─────────────────┘
                 │                               │
                 ▼                               ▼
┌────────────────────────────────────┐   ┌───────────────────────────────────┐            
│  AGENT & MODEL MIDDLEWARE          |   │           DATA ENGINE             │
|Meterless Nightshift Execution Proxy│   │      Zetaris Data Platform        │
│ NVIDIA Nemotron Inference Engine   │   │ Multi-Layered CSV Ground Truth    │
└────────────────────────────────────┘   └───────────────────────────────────┘ 

```

Frontend Application: React, Tailwind CSS, Next.js, Server-Sent Events (SSE) Client UI.

* **Backend Infrastructure:** Python 3.10+ / 3.12, FastAPI Asynchronous Web Framework, Uvicorn, Pydantic v2 schemas.

* **Agent Orchestration:** Meterless Nightshift Runtime Execution Proxy & Custom Python Pipelines (`src/pipeline.py`).

* **LLM Inference Engine:** NVIDIA Nemotron (`build.nvidia.com`).

* **Data Engine & RAG Layer:** Zetaris Cloud Data Platform (`cloud.enterprise.zetaris.com`) with local CSV sample fallback capability (`data/`).

* **Testing & Quality Assurance:** Pytest test suite (`tests/test_backend.py`).

## ✨ Key Features & User Experience

### 📊 1\. Dual-Panel Executive Dashboard

* **Left Panel (Match Opportunities):** Displays candidate scholarships sorted by eligibility match percentage, featuring instant visual **Trust Badges**:

  * 🟢 **VERIFIED:** Authoritative match verified against official institutional ground truth records.

  * 🟡 **RECONCILED CONFLICT:** Deadline/requirement discrepancy detected between aggregator and official records, resolved to official source.

  * 🔴 **REJECTED SCAM:** Fraudulent link, malicious domain extension, or illegitimate fee request flagged and blocked.

* **Right Panel (Live Agent Reasoning Log):** Real-time streaming feed rendering the exact step-by-step logic of the Trust Critic Agent, providing total institutional transparency.

### 🔍 2\. Automated Scam & Fee Audit Engine

* **Domain Signature Analysis:** Identifies and flags suspicious top-level domains (`.xyz`, `.top`, unverified subdomains).

* **Fee Trap Detection:** Flags any platform attempting to charge non-standard application fees for free public/governmental grants.

* **Audit Explanation Boxes:** Generates precise, human-readable justification cards for every rejected or modified listing.

## 🔌 Backend API Specification & Streaming Architecture

The backend provides both synchronous verification endpoints and managed background execution runs streaming progress via Server-Sent Events (SSE).

### 1\. Health Check

* **GET** `/health`

```
{
  "status": "ok",
  "app": "Credo AI Verification API",
  "sample_mode": true
}

```

### 2\. Synchronous Verification Request

* **POST** `/api/v1/verify`

* **Request Body (JSON):**

```
{
  "major": "Computer Science",
  "cgpa": 3.8,
  "domicile": "Islamabad",
  "target_degree": "Master",
  "financial_need": 0.6,
  "target_country": "Pakistan / Global"
}

```

* **Response (JSON):**

```
{
  "run_id": "b3e94a82-1234-4567-89ab-cdef01234567",
  "status": "success",
  "message": "Verification completed.",
  "result": {
    "status": "success",
    "search_summary": {
      "major": "COMPUTER SCIENCE",
      "min_cgpa": 3.8,
      "target_country": "Pakistan / Global",
      "filter_scams": true
    },
    "total_opportunities_found": 1,
    "results": [
      {
        "title": "Chevening UK Scholarship",
        "scholarship_id": "SCH_003",
        "domain": "chevening.org",
        "badge": "VERIFIED",
        "trust_score": 100,
        "deadline": "2026-11-05",
        "application_fee": 0,
        "audit_proof": "Domain chevening.org verified against official database. Fee verified as $0."
      }
    ],
    "agent_reasoning_trace": [
      "[PLANNER] Parsed profile criteria -> Major: COMPUTER SCIENCE, CGPA: 3.8",
      "[RECONCILER] Interrogating Zetaris multi-source datasets...",
      "[TRUST CRITIC] Domain chevening.org verified against official database. Fee verified as $0.",
      "[REPORTER] Verification complete."
    ]
  }
}

```

### 3\. Managed Run & SSE Live Streaming Protocol

#### Step A: Initiate Run

* **POST** `/api/v1/verify/runs`

* Returns **HTTP 202 Accepted** immediately with run tracking details:

```
{
  "run_id": "9f82d1c4-5678-90ab-cdef-1234567890ab",
  "status": "pending",
  "stream_url": "/api/v1/stream-logs?run_id=9f82d1c4-5678-90ab-cdef-1234567890ab",
  "status_url": "/api/v1/verify/runs/9f82d1c4-5678-90ab-cdef-1234567890ab"
}

```

#### Step B: Connect SSE Event Stream

* **GET** `/api/v1/stream-logs?run_id=<run-id>` (`Content-Type: text/event-stream`)

* **Live SSE Frames Emitted:**

```
id: 1
event: PLANNER
data: {"stage":"PLANNER","message":"Parsing student profile criteria...","run_id":"9f82d1c4-5678-90ab-cdef-1234567890ab"}

id: 2
event: PLANNER
data: {"stage":"PLANNER","message":"[PLANNER] Parsed profile criteria -> Major: COMPUTER SCIENCE, CGPA: 3.8","run_id":"9f82d1c4-5678-90ab-cdef-1234567890ab"}

id: 3
event: RECONCILER
data: {"stage":"RECONCILER","message":"[RECONCILER] Interrogating Zetaris CSV data layers...","run_id":"9f82d1c4-5678-90ab-cdef-1234567890ab"}

id: 4
event: TRUST_CRITIC
data: {"stage":"TRUST_CRITIC","message":"[TRUST CRITIC] Evaluated trust badges and flagged suspicious domains.","run_id":"9f82d1c4-5678-90ab-cdef-1234567890ab"}

id: 5
event: COMPLETE
data: {"stage":"COMPLETE","message":"Pipeline execution complete.","final_data":{"status":"success","search_summary":{"major":"COMPUTER SCIENCE","min_cgpa":3.8,"target_country":"Pakistan / Global","filter_scams":true},"total_opportunities_found":1,"results":[{"title":"Chevening UK Scholarship","scholarship_id":"SCH_003","domain":"chevening.org","badge":"VERIFIED","trust_score":100,"deadline":"2026-11-05","application_fee":0,"audit_proof":"Domain chevening.org verified against official database. Fee verified as $0."}],"agent_reasoning_trace":["..."]},"run_id":"9f82d1c4-5678-90ab-cdef-1234567890ab"}

```

## 🎨 Interactive Design & Prototype

The UI/UX architecture and agent interaction flows were fully prototyped in Figma prior to production deployment:

* 🎨 **Figma Interactive Prototype:** [View Interactive Figma Prototype](https://www.figma.com) *(Update with your production share link)*

* 🖼️ **Design Mockups:** Stored under `docs/assets/` or `assets/figma/` in this repository.

## 🚀 Local Setup & Developer Guide

### Prerequisites

* **Python:** 3.10+ (Python 3.12 recommended)

* **Node.js:** v18.0.0+

* **PowerShell / Terminal**

### 1\. Repository Clone & Environment Setup

```
# Navigate to working directory
cd C:\Users\mahak\Desktop\Credo-AI

# Clone repository
git clone https://github.com/Fozia-Nawaz/Credo-AI.git
cd Credo-AI

```

### 2\. Backend Setup (PowerShell / Windows)

```
# Create Python 3.12 virtual environment
py -3.12 -m venv .venv312

# Activate virtual environment
.\.venv312\Scripts\Activate.ps1

# Upgrade pip and install requirements
python -m pip install -r requirements.txt

```

#### Environment Variables Setup (`.env`)

Copy `.env.example` to `.env` in the root directory:

```
# Credo AI - Environment Settings

# Enable local sample CSV fallback execution mode
SAMPLE_MODE=true

# Frontend CORS Origin
FRONTEND_ORIGIN=http://localhost:3000

# Meterless Nightshift Proxy Configuration
NIGHTSHIFT_PROXY_URL=http://localhost:8000

# NVIDIA Nemotron LLM Inference API Key
NVIDIA_NEMOTRON_API_KEY=your_nvidia_api_key_here

# Zetaris Cloud Credentials (Optional for Cloud Mode)
ZETARIS_CLOUD_URL=https://cloud.enterprise.zetaris.com
ZETARIS_API_KEY=your_zetaris_api_key_here

# FastAPI Server Settings
PORT=8000
ENVIRONMENT=development

```

#### Run FastAPI Application Server

```
# Set sample mode flag in environment
$env:SAMPLE_MODE = "true"

# Start uvicorn server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

```

*The backend API server will run live at `http://127.0.0.1:8000`.*

### 3\. Frontend Setup

Open a second PowerShell window:

```
cd Credo-AI\frontend
npm install
npm run dev

```

*The frontend user interface will be live at `http://localhost:3000`.*

## 🧪 Testing & Verification

Run the automated backend test suite using Pytest to verify route handlers, SSE stream manager, Pydantic schemas, and sample mode fallback integrity:

```
# Run backend test suite
.\.venv312\Scripts\python.exe -m pytest -q

```

*The test suite validates health endpoints, input schema transformation, synchronous verification endpoint compatibility, managed run lifecycle state transitions, SSE event replaying, and exception safety.*

## 📁 Repository Directory Structure

```
Credo-AI/
├── app/                      # FastAPI Backend Adapter & Services
│   ├── routes/               # API routes (verify.py for synchronous & SSE runs)
│   ├── services/             # Run manager (run_manager.py), pipeline bridge & services
│   ├── config.py             # App environment configuration loader
│   └── schemas.py            # Pydantic validation models & schemas
├── src/                      # Core AI Agent & Data Engine Pipeline
│   ├── agents/               # 4-Agent Orchestration (planner, reconciler, trust_critic, reporter)
│   ├── pipeline.py           # MultiAgent Pipeline stream generator & execution loop
│   ├── zetaris_client.py     # Zetaris client with local CSV fallback reader
│   └── nightshift_client.py  # Meterless Nightshift proxy client
├── data/                     # Zetaris Ground-Truth CSV Data Feeds
│   ├── Official_Providers.csv# Authoritative provider records
│   ├── Aggregator_Listings.csv# Multi-source community listings
│   └── Unverified_Scams.csv  # Blacklists & suspicious domain patterns
├── tests/                    # Automated Pytest Suite (`test_backend.py`)
├── .env.example              # Environment variable template
├── main.py                   # FastAPI Application Entry Point
├── requirements.txt          # Python Dependencies
└── README.md                 # System Documentation

```

## 👥 Team Dynasty AI & Role Allocation

**Credo AI** was conceptualized, designed, and engineered by **Team Dynasty AI**:

* 👤 (Team lead) **Member 1** — *Project Management, Integration Lead,*

* 👤 **Member 2** — *Data Lead, Zetaris RAG Platform  & AI Agent Lead*

* 👤 **Member 3** — *UI/UX Design Lead*

* 👤 **Member 4** — *Front-End Development Lead & AI Agent Pipeline*

* 👤 **Member 5** — *Backend Architecture, FastAPI Services & Agent Orchestration Lead*

## Hackathon Success Metrics & Alignment

* **Track 02 Explainability:** **100%** of recommendations include step-by-step auditable evidence logs detailing accepted, modified, or rejected statuses.

* **Scam Detection Accuracy:** **100%** detection rate on pre-seeded scam/fee test cases with **zero** false positives on official verified links.

* **Latency Performance:** Sub-2-second streaming latency for live agent reasoning logs via FastAPI SSE and Meterless Nightshift proxy.

## 📜 License & Acknowledgments

Distributed under the **MIT License**. See `LICENSE` for details.

*Special thanks to the organizers of Hackathon Track 02, Zetaris Data Platform, NVIDIA Nemotron, and Meterless Nightshift for providing the infrastructure powering CREDO AI.*