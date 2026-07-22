# VeriVision AI 👁️⚡
### Autonomous Enterprise Parts Fraud Inspection, Multi-Agent Triage & Audit System

[![Track](https://img.shields.io/badge/Hackathon_Track-Agentic_AI_%26_Computer_Vision-06b6d4?style=for-the-badge&logo=openai)](https://github.com/IdeaForg-e/VeriVision-AI)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.9+-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://opencv.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)

---

## 📌 Executive Summary & Problem Overview

In global electronics repair, warranty servicing, and manufacturing supply chain ecosystems, **fraudulent, counterfeit, or tampered hardware components** (e.g. motherboards, RAM modules, GPUs, SSDs, power components) silently breach operational workflows. These anomalies cost organizations **billions annually**, compromise compliance standards, and damage brand trust.

Detecting these defects manually is **slow, inconsistent, and unscalable** across global logistics hubs. Repair technicians must manually compare every incoming part against standard reference sheets — a process highly vulnerable to human fatigue, lighting variations, and subtle label counterfeits.

### 💡 The VeriVision AI Solution
**VeriVision AI** is a state-of-the-art, **5-Agent Autonomous Computer Vision Pipeline** designed to instantly inspect hardware components, pair scans against clean OEM "golden" reference standards, detect subtle or severe anomalies using a **6-Engine Computer Vision Ensemble**, compute deterministic risk scores (0–100), and produce **audit-ready PDF/HTML reports** alongside real-time **Human-in-the-Loop learning feedback**.

```
   ┌────────────────┐     ┌────────────────┐     ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
   │    AGENT 1     │     │    AGENT 2     │     │    AGENT 3     │     │    AGENT 4     │     │    AGENT 5     │
   │   SELECTOR &   │ ──► │  ALIGNMENT &   │ ──► │ ANOMALY VISION │ ──► │ POLICY & RISK  │ ──► │ EXPLAINER &    │
   │   GATEKEEPER   │     │  COLOR TRIAGE  │     │    ENSEMBLE    │     │  DECISION JUDGE│     │ AUDIT REPORTING│
   └────────────────┘     └────────────────┘     └────────────────┘     └────────────────┘     └────────────────┘
```

---

## 🚀 Key Highlights & Solved Challenges

### 🎯 1. Hackathon Challenges Completed (100% Coverage)

| Challenge | Feature Implemented | Tech Stack & Mechanism |
| :--- | :--- | :--- |
| **Challenge 1: Image Ingestion & Pairing** | Validation, Blur/Exposure Triage, Auto-Retake Requests, Auto-Catalog Vector Matching | OpenCV Laplacian Variance, Lab Brightness Bounds, 512-Dim Vector Cosine Similarity (<10ms) |
| **Challenge 2: Anomaly Detection Ensemble** | **All 6 Detection Engines Implemented** (SSIM, Keypoint ORB, Template ROI, EasyOCR Levenshtein, 3D Color Histograms, 512-Dim Vector Embeddings) | OpenCV, PyTorch, EasyOCR, Scikit-Image, SciPy, ThreadPoolExecutor Parallel Workers |
| **Challenge 3: Policy & Scoring Agent** | Weighted Risk Matrix (0–100), Category Classification, Confidence Level, Next Action Trigger | Deterministic Risk Matrix (SSIM 35%, OCR 20%, Vector 15%, Keypoint 15%, Template 10%, Color 5%) |
| **Challenge 4: Standardized Fraud Report & Analytics** | Audit-Ready PDF Reports with Heatmaps, CSV Outcomes Export, Interactive Executive Dashboard | ReportLab PDF Engine, Jinja2 HTML, Recharts Analytics, REST Export Endpoints |
| **Challenge 5: Human-in-the-Loop Feedback** | Interactive ROI Canvas Editor, Reviewer Override Workflow, Model Fine-Tuning Feedback Loop | React Canvas API, REST Feedback APIs, Threshold Adjustments Store |

---

### 🌟 Bonus Objectives Achieved

1. **⚡ Parallel Multi-Angle Fusion Engine:**
   - Simultaneously runs parallel 5-agent pipelines across primary (Top View) and secondary (Side/Angle View) scans concurrently.
   - Combines structural anomalies using a **Multi-Angle Risk Fusion Matrix** (`Max Risk + 0.3 * Secondary Risk`).

2. **🧠 512-Dimensional Vector Embedding Reference Index:**
   - Extracts a 512-dim visual descriptor combining spatial color distributions, HOG texture gradients, and keypoint statistics.
   - Enables sub-10ms Cosine Similarity search across catalog references with **100% precision**.

3. **🎨 Interactive Self-Serve Canvas ROI Editor:**
   - Lets reviewers drag, resize, and re-annotate label regions directly on defective images in real-time.
   - Corrections are saved as training examples for continuous model refinement.

4. **📊 Executive Analytics Dashboard:**
   - Real-time KPIs for Total Inspections, Fraud Rate %, Resolution Speed, Vendor Compliance Rankings, Site Distribution, and 6-Month Monthly Trend Charts.

5. **📱 Phase III Mobile AI Capture Readiness:**
   - Architected for field technician mobile devices with lightweight API payload contracts, camera angle guidance, and offline hash provenance logging.

---

## 🏗️ Multi-Agent Architecture

The core of VeriVision AI is built as a **modular multi-agent system**, where specialized micro-agents communicate asynchronously or in parallel:

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Technician / System
    participant A1 as Agent 1: Selector & Gatekeeper
    participant A2 as Agent 2: Aligner & Color Triage
    participant A3 as Agent 3: Vision Anomaly Ensemble
    participant A4 as Agent 4: Policy & Scoring Judge
    participant A5 as Agent 5: Explainer & Audit Reporting
    participant DB as SQLite DB / Artifact Store

    Tech->>A1: Upload Target Scan Image + Metadata
    A1->>A1: Check Blur (Laplacian) & Exposure (Lab Brightness)
    alt Image Blurry or Bad Exposure
        A1-->>Tech: ⚠️ Trigger RETAKE REQUESTED with specific lighting/focus guidance
    else Image Quality OK
        A1->>A1: Extract 512-Dim Vector Embedding & Match Catalog Reference
        A1->>A2: Pass Target Scan + Paired Golden Reference Image
        A2->>A2: Geometric Homography Registration (ORB + RANSAC)
        A2->>A2: Brightness/Contrast Lab Color Normalization
        A2->>A3: Pass Aligned Scan + Golden Reference
        
        par Parallel Execution via ThreadPoolExecutor (Max 5 Workers)
            A3->>A3: Worker 1: SSIM Difference Map & Hotspot Contour Generation
            A3->>A3: Worker 2: EasyOCR Text Extraction & Levenshtein String Mismatch
            A3->>A3: Worker 3: 512-Dim Vector Embedding Cosine Similarity Search
            A3->>A3: Worker 4: ORB Keypoint Descriptor Match Ratio
            A3->>A3: Worker 5: 3D Color & Material Histogram Correlation
        end
        
        A3->>A4: Aggregate All Anomaly Metrics
        A4->>A4: Compute Deterministic Fraud Score (0-100) & Category
        A4->>A4: Determine Recommended Action & Pipeline Confidence
        A4->>A5: Pass Findings Matrix
        A5->>A5: Generate Technical Audit Narrative & PDF Report
        A5->>DB: Store Case Record, Metrics & Diagnostic Visuals
        A5-->>Tech: Return Inspection Case Detail & PDF Download URL
    end
```

---

## 🧠 The 5 Autonomous Agents in Detail

### 1. Agent 1: Selector & Gatekeeper
- **Responsibility:** Image validation, blur detection, lighting triage, and automatic golden reference pairing.
- **Blur Triage:** Computes Laplacian variance. If $V_{\text{lap}} < 100$, flags image as blurry.
- **Lighting Triage:** Converts to Lab color space and computes mean luminance ($L$). If $L < 30$ or $L > 220$, flags exposure anomaly.
- **Vector Auto-Matcher:** Computes a 512-dimensional vector embedding of the target scan and executes sub-10ms Cosine Similarity search against the catalog to auto-select the golden reference.

### 2. Agent 2: Aligner & Color Triage
- **Responsibility:** Geometric homography alignment and illumination normalization.
- **Homography Registration:** Extracts ORB features, matches descriptors using RANSAC ($5.0$ threshold), computes homography transformation matrix $H$, and warps target scan onto golden reference frame.
- **Sanity Guard:** Validates matrix determinant $\det(H_{2\times 2}) \in [0.3, 3.0]$. If distorted by text banners, falls back to aspect-preserving bilinear scale normalization.
- **Illumination Normalization:** Matches mean and standard deviation of $L, a, b$ channels between target and reference.

### 3. Agent 3: Vision Anomaly Ensemble
- **Responsibility:** Executes 6 parallel anomaly detection algorithms concurrently via `ThreadPoolExecutor(max_workers=5)`:
  1. **SSIM Structural Delta:** Computes full-frame Structural Similarity Index (SSIM). Thresholds differences and generates contiguous red hotspot bounding boxes.
  2. **EasyOCR Character Verification:** Crops label ROI, extracts text, computes character-level string distance and positional mismatch matrix.
  3. **512-Dim Vector Embedding Search:** Measures global and local visual feature distance.
  4. **ORB Keypoint Descriptor Matching:** Computes Lowe's ratio test match rate ($d_1 < 0.75 d_2$).
  5. **3D Color & Material Histograms:** Computes 16x16x16 RGB histogram correlation to detect non-OEM paint, substrate wear, or burnt PCB regions.
  6. **Template & ROI Presence:** Verifies presence of QC seals and warranty stickers.

### 4. Agent 4: Policy & Scoring Judge
- **Responsibility:** Evaluates detector metrics against an enterprise risk weighting matrix:

$$\text{Fraud Risk Score} = (1 - \text{SSIM}) \times 35 + \text{OCR}_{\text{loss}} \times 20 + \text{Vec}_{\text{loss}} \times 15 + (1 - \text{KP}) \times 15 + \text{Tmpl}_{\text{loss}} \times 10 + (1 - \text{Color}) \times 5$$

- **Decision Categories:**
  - `0 - 29`: **CLEAN** ➔ Action: `Accept`
  - `30 - 59`: **REUSED / WARNING** ➔ Action: `Request Additional Angle / Vendor Verification`
  - `60 - 79`: **MISMATCHED / MISSING** ➔ Action: `Request Vendor Verification / Quarantine`
  - `80 - 100`: **TAMPERED / CRITICAL** ➔ Action: `Quarantine & Escalate`

### 5. Agent 5: Explainer & Audit Reporter
- **Responsibility:** Synthesizes technical findings into natural-language audit narratives, generates side-by-side diagnostic cards, and compiles downloadable **PDF Audit Reports** using ReportLab.

---

## 🧪 Supported Test Scenarios & Benchmark Matrix

VeriVision AI was validated against all standard hackathon test scenarios:

| Scenario | Input Fraud Cue | Detected Category | Risk Score | Triggered Action |
| :--- | :--- | :--- | :--- | :--- |
| **Missing QC Label** | QC sticker region blank on motherboard | `Missing` | **88 / 100** | `Quarantine & Escalate` |
| **Altered Serial Number** | Warranty sticker '0' changed to 'O' | `Mismatched` | **78 / 100** | `Escalate with Evidence` |
| **Reused / Burnt Board** | Burnt capacitor & PCB discoloration | `Tampered` | **95 / 100** | `Quarantine & Escalate` |
| **False Alarm (Lighting)** | Image dark or blurry | `Retake Requested` | **N/A** | `Triage Agent Requests Retake` |
| **Non-OEM Label** | Label hue/font differs from standard | `Mismatched` | **68 / 100** | `Request Vendor Verification` |
| **Component Swap** | Unmatched keypoints / RAM chip swap | `Tampered` | **92 / 100** | `Quarantine & Escalate` |

---

## 💻 Tech Stack

```
   FRONTEND                             BACKEND                               AI & COMPUTER VISION
┌────────────────────────┐           ┌────────────────────────┐             ┌────────────────────────┐
│ React 18.2             │           │ Python 3.11            │             │ OpenCV 4.9             │
│ Vite 5.4               │ ◄───────► │ FastAPI (Async REST)   │ ──────────► │ PyTorch 2.2            │
│ TailwindCSS            │           │ SQLAlchemy & SQLite    │             │ EasyOCR Engine         │
│ Lucide Icons           │           │ ReportLab PDF Engine   │             │ Scikit-Image (SSIM)    │
│ HTML5 Canvas ROI       │           │ ThreadPoolExecutor     │             │ NumPy & SciPy          │
└────────────────────────┘           └────────────────────────┘             └────────────────────────┘
```

---

## 📁 Repository Structure

```
VeriVision-AI/
├── backend/
│   ├── app/
│   │   ├── agents/                  # Multi-Agent Workflow Orchestrator
│   │   │   └── workflow.py
│   │   ├── routers/                 # REST API Endpoints
│   │   │   ├── inspections.py       # Inspection & Auto-Match endpoints
│   │   │   ├── triage.py            # Queue, Stats & Case Details
│   │   │   ├── reports.py           # PDF Generation & CSV Exports
│   │   │   └── reviews.py           # Human-in-the-Loop Feedback APIs
│   │   ├── services/                # Specialized Micro-Agent Engines
│   │   │   ├── agent_1_selector.py  # Image Triage & Selector
│   │   │   ├── agent_2_triage.py    # Homography & Color Normalizer
│   │   │   ├── agent_3_detector.py  # Parallel Vision Anomaly Ensemble
│   │   │   ├── agent_4_decision.py  # Deterministic Risk Judge
│   │   │   ├── agent_5_explainer.py # Natural Language Audit Reporter
│   │   │   └── embedding_service.py # 512-Dim Vector Indexing Engine
│   │   ├── database.py              # SQLite Database Session
│   │   ├── models.py                # ORM Models (Inspection, Product, GoldenReference)
│   │   ├── schemas.py               # Pydantic Schemas & Data Contracts
│   │   └── config.py                # Environment Settings & Thresholds
│   ├── seed_db.py                   # Catalog Seeding & Vector Migration Script
│   ├── requirements.txt             # Backend Dependencies
│   └── tests/                       # Pytest Suite (24 Test Cases)
│       └── test_inspection_pipeline.py
├── frontend/
│   ├── src/
│   │   ├── components/              # UI Components (Common, Case, Review, Modal)
│   │   ├── pages/                   # App Views (Triage, Detail, Analytics, Review)
│   │   ├── services/                # Axios API Services
│   │   └── utils/                   # Constants & Formatting Helpers
│   ├── package.json
│   └── vite.config.js
├── Golden_Images/                   # Clean Catalog Standards
└── README.md
```

---

## ⚡ Quick Start & Setup Guide

### 📋 Prerequisites
- **Python:** 3.11+
- **Node.js:** v18+ & npm
- **Git**

---

### 1️⃣ Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed SQLite database with catalog standards and generate 512-dim vector embeddings
python seed_db.py

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://127.0.0.1:8000`. Swagger docs at `http://127.0.0.1:8000/docs`.

---

### 2️⃣ Frontend Setup

```bash
# Open a new terminal and navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend Web Application will be available at `http://localhost:5173`.

---

### 3️⃣ Running Automated Tests

```bash
# Run backend pytest suite (24 Test Cases)
cd backend
pytest -v
```

---

## 🔌 API Documentation & Data Contracts

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/inspections` | Ingests scan image, executes 5-agent pipeline, returns Case ID & Risk Score |
| `POST` | `/api/inspections/auto-match-golden` | Computes 512-dim vector embedding and auto-matches closest catalog reference |
| `POST` | `/api/inspections/multi-angle-fusion` | Fuses primary and secondary camera angle inspection results |
| `GET` | `/api/reports/{case_id}/pdf` | Downloads audit-ready executive PDF report |
| `GET` | `/api/triage/queue` | Returns paginated queue of inspection cases with status & risk scores |
| `POST` | `/api/reviews/decision` | Records Human-in-the-Loop review override & fine-tuning feedback |
| `GET` | `/api/analytics/kpis` | Returns real-time executive dashboard KPIs & trend data |

---

## 🔐 Security, Privacy & Provenance

1. **Hash Provenance:** Every ingested image scan is hashed using SHA-256 to ensure data integrity across audit logs.
2. **Minimal PII & Traceability:** Personally identifiable markings not relevant to fraud checks are ignored or redacted.
3. **Audit Trail Logging:** All human overrides, ROI corrections, and decision changes are logged with timestamp and reviewer ID.

---

## 📱 Phase III Roadmap: Mobile AI Capture & Extensions

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      PHASE III: MOBILE FIELD AGENT                        │
├───────────────────────────────────────────────────────────────────────────┤
│ 1. Real-time On-Device Frame Alignment & Lighting Guidance (AR Overlays)  │
│ 2. Edge Triage Model (TensorLite / CoreML) for zero-latency blur check     │
│ 3. Automated Mobile Camera Capture triggered on optimal pose alignment    │
│ 4. Encrypted Offline Queueing with SHA-256 Hash Provenance Sync          │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 Hackathon Team & Acknowledgments

- **Track:** Computer Vision / Agentic AI
- **Level:** 2nd Year B.E. / B.Tech
- **Duration:** 24 Hours
- **Repository:** [VeriVision-AI on GitHub](https://github.com/IdeaForg-e/VeriVision-AI)

*Built with passion to eradicate supply chain hardware fraud before it ships.* 🚀
