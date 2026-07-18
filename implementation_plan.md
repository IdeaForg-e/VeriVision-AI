# 🚀 VeriVision-AI — Implementation Plan (5 Developers × 24 Hours)

> **Project:** AI-Powered Manufacturing Parts Fraud Detection Platform  
> **Team Size:** 5 Developers (Dev-1 to Dev-5)  
> **Duration:** 24 Hour Hackathon  
> **Branch:** `dev`  
> **Tech Stack:** React + Tailwind CSS | FastAPI + SQLAlchemy | OpenCV + EasyOCR + scikit-image | LangGraph

---

## 📊 Current Codebase Status — Kya Already Ban Chuka Hai?

| Component | Status | Files | Notes |
|-----------|--------|-------|-------|
| FastAPI App Shell | ✅ Done | `main.py`, `config.py`, `database.py` | CORS, static mount, router registration complete |
| DB Models | ✅ Done | `models.py` | User, Product, GoldenReference, Inspection, InspectionResult, Report, AuditLog — sab hai |
| Pydantic Schemas | ✅ Done | `schemas.py` | Request/Response schemas ready |
| Auth (JWT) | ✅ Done | `routers/auth.py`, `utils.py` | Register, Login, /me, password hashing, token verify — all working |
| Products Router | ✅ Done | `routers/products.py` | CRUD + Golden Reference upload |
| Inspections Router | ✅ Done | `routers/inspections.py` | Upload → Triage → Vision → Decision → Explainer → DB Save — full pipeline |
| Reviews Router | ✅ Done | `routers/reviews.py` | Pending queue + approve/override + AuditLog |
| Reports Router | ✅ Done | `routers/reports.py` | PDF download + CSV bulk export |
| Ingestion Service | ✅ Done | `services/ingestion.py` | Blur check, Lighting check, ORB+RANSAC alignment |
| Vision Service | ✅ Done | `services/vision.py` | SSIM + heatmap, OCR (EasyOCR), string diff, keypoint ratio |
| Decision Service | ✅ Done | `services/decision.py` | Weighted scoring, verdict, confidence, recommended action |
| Explainer Service | ✅ Done | `services/explainer.py` | Template-based + Gemini API fallback |
| Reporting Service | ✅ Done | `services/reporting.py` | ReportLab PDF + CSV export |
| Seed Data | ✅ Done | `seed_data.py` | 2 products, 2 golden refs, 2 users |
| Dataset Images | ✅ Available | `dataset/` | 17 images (7 defective + 10 golden) |
| **Frontend** | ❌ Not Started | — | React app not initialized yet |
| **LangGraph Agents** | ❌ Not Started | `agents/workflow.py` | File missing — agent orchestration not built |
| **HTML Report Template** | ❌ Not Started | `templates/report_template.html` | Jinja2 template not created |
| **Documentation** | ❌ Not Started | `docs/` | Architecture doc + API contracts pending |

---

## 🚨 Gap Analysis — Problem Statement Ke Against Kya Missing Hai

### Critical Gaps (Must Fix)

| # | Gap | Problem Statement Requirement | Priority |
|---|-----|-------------------------------|----------|
| 1 | **LangGraph Workflow nahi bana** | "Agentic AI workflow banana hai" — multi-agent pipeline mandatory | 🔴 P0 |
| 2 | **Frontend bilkul nahi hai** | UI chahiye: Upload, Results, Review, Dashboard, Reports | 🔴 P0 |
| 3 | **Keypoint matching incomplete** | `vision.py` mein sirf keypoint count ratio hai, actual descriptor matching (BFMatcher) nahi hai | 🔴 P0 |
| 4 | **Template/ROI check nahi hai** | Challenge 2 mein 5 methods mein se 2 chahiye — Template matching missing | 🟡 P1 |
| 5 | **Color/Material cue check nahi** | Color histogram comparison not implemented | 🟡 P1 |
| 6 | **HTML Report template missing** | Jinja2 dark-themed report template chahiye | 🔴 P0 |
| 7 | **Image hashes for provenance** | Report mein file hashes, pipeline version chahiye | 🟡 P1 |
| 8 | **ROI annotation/editor UI nahi** | Reviewer ko screen par ROI adjust karne ka option chahiye | 🟡 P1 |
| 9 | **Feedback memory store nahi** | Reviewer ka feedback store hokar model thresholds improve kare | 🟡 P1 |
| 10 | **Test scenarios kam hain** | Minimum 4-6 test cases validated chahiye (retake wala mandatory) | 🔴 P0 |
| 11 | **CSV export mein image_hash nahi** | Provenance fields missing in export | 🟢 P2 |
| 12 | **models.py mein Report relationship galat** | Line 96: `back_populates="reports"` should reference `Inspection` not `Report` — **BUG** | 🔴 P0 |
| 13 | **Config Knobs UI nahi** | Tunable thresholds (SSIM tolerance etc.) ka UI/endpoint chahiye | 🟡 P1 |
| 14 | **Dashboard analytics nahi** | Fraud trends by site/vendor — at least mock data se | 🟡 P1 |

### Bonus Features (Agar Time Bache)

| # | Feature | Impact |
|---|---------|--------|
| B1 | Multi-angle fusion — 2-3 photos combine karke decision | Bonus Credit |
| B2 | Self-serve ROI editor — UI par box draw kar ke labels mark kare | Bonus Credit |
| B3 | Security hygiene — PII blur, image hashes, verdict change log | Bonus Credit |
| B4 | Phase II/III architecture hints — Analytics APIs, Mobile capture flow | Bonus Credit |

---

## 👥 Team Assignment — 5 Developers

| Dev | Alias | Primary Domain | Key Responsibilities |
|-----|-------|---------------|---------------------|
| **Dev-1** | Backend Lead | Backend Core + Agents | Models bug fix, LangGraph Agents, Config API, Dashboard API, Seed Data expansion, Backend polish |
| **Dev-2** | CV Engineer | Computer Vision + Detection | Keypoint matching fix, Template/ROI detection, Color histogram, Vision pipeline hardening, Threshold tuning |
| **Dev-3** | Frontend Lead | React UI Core | Vite+React+Tailwind setup, Layout, Login, Dashboard, New Inspection, Inspection Detail pages |
| **Dev-4** | Frontend + UX | React UI Pages + UX | Review page, Reports page, History page, Settings page, ROI Annotator, API integration, UX polish |
| **Dev-5** | Reports + Docs + QA | HTML Reports + Documentation + Testing | Jinja2 HTML template, HTML report generation, Architecture docs, API contracts doc, Test case execution & validation |

---

## 📁 Updated Folder Structure

```
VeriVision-AI/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # [DONE] FastAPI entry — Dev-1 minor tweaks
│   │   ├── config.py                  # [DONE] + [Dev-1] Add config API endpoint
│   │   ├── database.py                # [DONE] No changes needed
│   │   ├── models.py                  # [DONE] + [Dev-1] Fix Report relationship bug
│   │   ├── schemas.py                 # [DONE] + [Dev-1] Add ConfigSchema, DashboardStats
│   │   ├── utils.py                   # [DONE] No changes needed
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py            # [DONE]
│   │   │   ├── auth.py               # [DONE] No changes needed
│   │   │   ├── products.py           # [DONE] No changes needed
│   │   │   ├── inspections.py        # [DONE] + [Dev-1] Wire LangGraph workflow
│   │   │   ├── reviews.py            # [DONE] + [Dev-1] Add reject action support
│   │   │   ├── reports.py            # [DONE] + [Dev-5] Add HTML report endpoint
│   │   │   ├── config_knobs.py       # [NEW] [Dev-1] GET/PUT thresholds API
│   │   │   └── dashboard.py          # [NEW] [Dev-1] Dashboard stats + analytics API
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py            # [DONE]
│   │   │   ├── ingestion.py          # [DONE] No changes needed
│   │   │   ├── vision.py             # [DONE] + [Dev-2] Fix keypoints, add template match, color hist
│   │   │   ├── decision.py           # [DONE] + [Dev-2] Update weights for new detectors
│   │   │   ├── explainer.py          # [DONE] No changes needed
│   │   │   └── reporting.py          # [DONE] + [Dev-5] Add HTML report gen + provenance
│   │   │
│   │   └── agents/
│   │       ├── __init__.py            # [NEW] [Dev-1]
│   │       └── workflow.py            # [NEW] [Dev-1] LangGraph StateGraph multi-agent
│   │
│   ├── data/
│   │   ├── golden/                    # Golden reference images storage
│   │   ├── cases/                     # Uploaded inspection images storage
│   │   └── reports/                   # Generated PDF/HTML reports storage
│   │
│   ├── templates/
│   │   └── report_template.html       # [NEW] [Dev-5] Jinja2 dark-themed HTML report
│   │
│   ├── seed_data.py                   # [DONE] + [Dev-1] Expand to 6 test scenarios
│   ├── requirements.txt               # [DONE] + [Dev-1] Add requests, hashlib deps
│   └── run.py                         # [NEW] [Dev-1] Quick launch script
│
├frontend/
│
├── public/
│
├── src/
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── logos/
│
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Badge.jsx
│   │   ├── Loader.jsx
│   │   ├── Modal.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Table.jsx
│   │   ├── EmptyState.jsx
│   │   └── Pagination.jsx
│   │
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Layout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── TopNavigation.jsx
│   │
│   ├── triage/
│   │   ├── QueueTable.jsx
│   │   ├── StatsCards.jsx
│   │   ├── QueueFilters.jsx
│   │   ├── PipelineStatus.jsx
│   │   └── QueueRow.jsx
│   │
│   ├── case/
│   │   ├── ImageComparison.jsx
│   │   ├── HeatmapViewer.jsx
│   │   ├── MetadataCard.jsx
│   │   ├── DetectorMetrics.jsx
│   │   ├── OCRResults.jsx
│   │   ├── FraudScore.jsx
│   │   ├── RecommendationCard.jsx
│   │   └── EvidenceTimeline.jsx
│   │
│   ├── review/
│   │   ├── ReviewDecision.jsx
│   │   ├── ConfidenceCard.jsx
│   │   ├── ROIEditor.jsx
│   │   ├── ReviewerComment.jsx
│   │   └── EvidencePanel.jsx
│   │
│   ├── feedback/
│   │   ├── ThresholdSlider.jsx
│   │   ├── OCRThreshold.jsx
│   │   ├── SavePipelineButton.jsx
│   │   ├── PipelineMetrics.jsx
│   │   └── FeedbackHistory.jsx
│   │
│   └── auth/
│       └── LoginForm.jsx
│
├── pages/
│   ├── LoginPage.jsx
│   ├── DailyTriagePage.jsx
│   ├── CaseDetailPage.jsx
│   ├── HumanReviewPage.jsx
│   ├── FeedbackPanelPage.jsx
│   └── NotFoundPage.jsx
│
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── caseService.js
│   ├── reviewService.js
│   ├── feedbackService.js
│   └── triageService.js
│
├── context/
│   ├── AuthContext.jsx
│   └── CaseContext.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── useCases.js
│   └── useReview.js
│
├── utils/
│   ├── constants.js
│   ├── formatDate.js
│   ├── formatScore.js
│   └── statusColor.js
│
├── routes/
│   └── AppRoutes.jsx
│
├── App.jsx
├── main.jsx
└── index.css
│
├── docs/
│   ├── architecture.md                # [Dev-5] System architecture doc
│   └── api_contracts.md               # [Dev-5] API contracts for all endpoints
│
├── test_results/                      # [Dev-5] Validation outputs folder
│   ├── test_case_1_missing_label.md
│   ├── test_case_2_altered_serial.md
│   ├── test_case_3_reused_board.md
│   ├── test_case_4_false_alarm.md
│   ├── test_case_5_non_oem_label.md
│   └── test_case_6_swap_detection.md
│
├── implementation_plan.md             # This file
├── .gitignore
└── README.md
```

---

## ⏰ Phase-wise Execution Plan — 24 Hour Breakdown

---

### 🟢 Phase 1: Foundation & Bug Fixes (Hour 0–4)

> **Goal:** Backend bugs fix karo, LangGraph shell bana do, Frontend initialize karo, CV pipeline upgrade shuru karo.

---

#### Dev-1 (Backend Lead) — Phase 1

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **BUG FIX: Report model relationship** | `models.py` L96 | `back_populates="reports"` mein `Report` ki jagah `Inspection` reference hona chahiye. Fix: `inspection = relationship("Inspection", back_populates="reports")` |
| 2 | **Add run.py launch script** | `run.py` [NEW] | Simple `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` script |
| 3 | **Create agents/ package** | `agents/__init__.py` [NEW] | Empty init file |
| 4 | **Build LangGraph Workflow skeleton** | `agents/workflow.py` [NEW] | LangGraph `StateGraph` with 5 nodes: `ingest_node`, `select_reference_node`, `detect_anomalies_node`, `decision_node`, `report_node`. State schema: `InspectionState(TypedDict)` with `case_id`, `image_path`, `golden_path`, `roi_config`, `triage_result`, `ensemble_results`, `decision`, `explanation`, `report_path`. Conditional edge after ingest: if quality fail → retake. Compile graph with `workflow.compile()` |
| 5 | **Add dashboard stats endpoint** | `routers/dashboard.py` [NEW] | `GET /api/dashboard/stats` — total inspections, fraud counts by category, by site, pending reviews count. `GET /api/dashboard/trends` — last 7 days fraud count (mock-supported) |
| 6 | **Add config knobs endpoint** | `routers/config_knobs.py` [NEW] | `GET /api/config` — return current thresholds. `PUT /api/config` — update SSIM_THRESHOLD, BLUR_THRESHOLD, etc. at runtime |
| 7 | **Register new routers in main.py** | `main.py` | Add `dashboard` and `config_knobs` routers |
| 8 | **Update schemas for new endpoints** | `schemas.py` | Add `DashboardStatsResponse`, `ConfigResponse`, `ConfigUpdate` schemas |

---

#### Dev-2 (CV Engineer) — Phase 1

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Fix keypoint matching — proper BFMatcher** | `vision.py` | Current code sirf `orb.detect()` kar raha hai. Fix: `detectAndCompute()` + `BFMatcher(NORM_HAMMING)` + Lowe's ratio test. Return actual `match_percentage` based on good matches / total matches |
| 2 | **Add Template/ROI matching method** | `vision.py` [NEW function] | `check_template_presence(src_img, ref_img, roi_config)` — ROI crop from both images, `cv2.matchTemplate()` with `TM_CCOEFF_NORMED`, return `(is_present: bool, match_score: float)`. Isse sticker/label presence detect hoga |
| 3 | **Add Color Histogram comparison** | `vision.py` [NEW function] | `compare_color_histograms(src_img, ref_img, roi_config)` — HSV convert, `cv2.calcHist()` for both, `cv2.compareHist()` with `HISTCMP_CORREL`. Return `correlation_score`. Non-OEM label ka color mismatch pakadenge |
| 4 | **Update ensemble to include new detectors** | `vision.py` | `run_anomaly_ensemble()` mein naye 2 methods add karo. Return dict mein `template_match_score` aur `color_correlation` fields add karo |
| 5 | **Study dataset images** | `dataset/` | Saari 17 images dekho, ROI coordinates note karo for seed data |

---

#### Dev-3 (Frontend Lead) — Phase 1

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Initialize React + Vite project** | `frontend/` | `npx -y create-vite@latest ./ --template react`, install Tailwind CSS v3, configure postcss |
| 2 | **Setup Tailwind config** | `tailwind.config.js` | Dark mode: `'class'`. Colors: primary `#6366f1`, surface `#0f172a`, card `#1e293b`, accent `#22d3ee`, danger `#ef4444`, warning `#f59e0b`, success `#10b981` |
| 3 | **Create index.css** | `index.css` | Tailwind directives, dark body background, Inter/Outfit font import, custom scrollbar, glassmorphism utilities |
| 4 | **Build API service layer** | `services/api.js` | Axios instance with Vite proxy (`/api` → `localhost:8000/api`), JWT interceptor, all API functions |
| 5 | **Build AuthContext** | `context/AuthContext.jsx` | `AuthProvider`, `useAuth()` hook, login/logout, JWT localStorage, `ProtectedRoute` |
| 6 | **Build Layout components** | `layout/Sidebar.jsx`, `Header.jsx`, `Layout.jsx` | Dark glassmorphism sidebar with Lucide icons. Header: "VeriVision AI" title, user info, logout |
| 7 | **Build common components** | `common/Button.jsx`, `Loader.jsx`, `Badge.jsx` | Reusable button (primary/secondary/danger), animated pulse loader, color-coded badge |
| 8 | **Setup App.jsx routing** | `App.jsx`, `main.jsx` | React Router v6 with all routes |
| 9 | **Build LoginPage** | `pages/LoginPage.jsx` | Dark premium login page with glassmorphism card, email/password, JWT auth |

---

#### Dev-4 (Frontend + UX) — Phase 1

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Help Dev-3 with design system** | — | Pair on shared components, color decisions, spacing system |
| 2 | **Build Modal component** | `common/Modal.jsx` | Animated modal with backdrop blur, close button, content slot |
| 3 | **Start ReviewPanel component** | `review/ReviewPanel.jsx` | Case info card, evidence section, Approve/Reject/Override buttons layout |
| 4 | **Start ROI Annotator component** | `review/ROIAnnotator.jsx` | `<canvas>` overlay on image, mouse drag to draw bounding box, output `{x, y, width, height}` |
| 5 | **Build CommentBox component** | `review/CommentBox.jsx` | Textarea with character counter, submit button |

---

#### Dev-5 (Reports + Docs + QA) — Phase 1

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Create Jinja2 HTML report template** | `templates/report_template.html` [NEW] | Dark-themed HTML. Header: Case ID, Part Number, Commodity, Site, Time, Reviewer. Summary: Verdict badge, Fraud Score gauge, Action. Evidence: Golden vs Defective side-by-side with heatmap. OCR Diff: highlighted character mismatches. Metrics: SSIM, keypoint %, template flag, color correlation. Provenance: filenames, SHA-256 hashes, pipeline version, thresholds |
| 2 | **Add HTML report generation** | `services/reporting.py` | New function `generate_html_report(inspection_id, db)` — Jinja2 render, embed images as base64, save to `data/reports/` |
| 3 | **Add provenance fields** | `services/reporting.py` | SHA-256 hash of source + golden images, pipeline version string, thresholds used. Add to PDF and HTML |
| 4 | **Add HTML report endpoint** | `routers/reports.py` | `GET /api/reports/{case_id}/html` |
| 5 | **Write architecture.md** | `docs/architecture.md` [NEW] | Multi-agent pipeline diagram (mermaid), component descriptions, data flow |
| 6 | **Write api_contracts.md** | `docs/api_contracts.md` [NEW] | All endpoint contracts with JSON examples — enables Dev-3/Dev-4 to work independently |

---

### 🟡 Phase 2: Core Features & Integration (Hour 4–12)

> **Goal:** Full CV pipeline with all detectors, LangGraph wired, Frontend core pages done, reports complete.

---

#### Dev-1 (Backend Lead) — Phase 2

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Complete LangGraph workflow** | `agents/workflow.py` | Implement all 5 node functions with real service calls. Conditional edge: triage fail → `retake_node` returns guidance ("Please capture at top-right label close-up"). Error handling per node |
| 2 | **Wire LangGraph into inspections router** | `routers/inspections.py` | Replace inline pipeline with `workflow.invoke(initial_state)`. Handle return states: completed, retake_needed, error |
| 3 | **Add "reject" action to reviews** | `routers/reviews.py` | Currently only "approve" and "override". Add "reject" — sets status "rejected", logs AuditLog |
| 4 | **Expand seed_data.py to 6 scenarios** | `seed_data.py` | 4 more products + golden refs using dataset images. Each maps to test scenario. Include blurry image for retake |
| 5 | **Dashboard analytics real queries** | `routers/dashboard.py` | DB aggregation: COUNT by verdict, site, date. Return Recharts-ready data |
| 6 | **Schemas update** | `schemas.py` | `DashboardStatsResponse`, `ConfigResponse`, `ConfigUpdate` |

---

#### Dev-2 (CV Engineer) — Phase 2

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Update decision engine** | `decision.py` | Add `template_match_score` and `color_correlation`. New weights: SSIM 35%, OCR 25%, Keypoints 15%, Template 15%, Color 10%. Verdict: template < 0.5 → "missing"; color < 0.6 → "mismatched" |
| 2 | **Improve leet-speak detection** | `vision.py` | Expand substitution map: `0↔O`, `1↔I↔l`, `5↔S`, `8↔B`, `6↔G`. Flag each type |
| 3 | **Better heatmap overlays** | `vision.py` | `cv2.applyColorMap()` + `COLORMAP_JET` on SSIM diff, alpha-blend with source for gradient heatmap (presentation mein bahut achha dikhega) |
| 4 | **ROI-based missing label detection** | `vision.py` | `detect_missing_label(src_img, roi_config)` — crop ROI, check edge density + mean intensity vs golden ROI. Low edges = label missing |
| 5 | **Test all 6 scenarios locally** | — | Run each defective through ensemble, verify scores, tune thresholds |
| 6 | **Image hash computation** | `vision.py` | `compute_image_hash(image_path)` → SHA-256 hex digest for provenance |

---

#### Dev-3 (Frontend Lead) — Phase 2

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **DashboardPage** | `pages/DashboardPage.jsx` | Stats cards (Total, Fraud, Pending, Clean — icons + colors). Recharts BarChart fraud by category. PieChart verdict distribution. Recent activity table with verdict badges |
| 2 | **Dashboard components** | `dashboard/StatsCard.jsx`, `FraudChart.jsx`, `RecentActivity.jsx` | Glassmorphism cards with count-up animation. Charts with gradient fills. Clickable table rows |
| 3 | **NewInspectionPage** | `pages/NewInspectionPage.jsx` | Product dropdown (from API), site input, angle dropdown, drag-drop upload with preview, submit → processing spinner → redirect to result |
| 4 | **ImageUploader component** | `inspection/ImageUploader.jsx` | `react-dropzone`, image preview, file size validation, drag hover animation |
| 5 | **InspectionDetailPage** | `pages/InspectionDetailPage.jsx` | Case header, Fraud Score circular gauge (green<30, yellow<70, red>=70), Verdict badge, Side-by-side images, Heatmap toggle, OCR diff highlighted, Metrics bars, Explanation card, PDF download |
| 6 | **Inspection components** | `inspection/ImageCompare.jsx`, `HeatmapOverlay.jsx`, `VerdictBadge.jsx`, `AnomalyList.jsx` | Side-by-side viewer, heatmap overlay toggle, verdict with glow effect, anomaly list with severity |

---

#### Dev-4 (Frontend + UX) — Phase 2

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **ReviewPage** | `pages/ReviewPage.jsx` | Grid of pending review cards from API. Each: case_id, product, fraud_score, verdict badge. Click → expand ReviewPanel |
| 2 | **ReviewPanel full implementation** | `review/ReviewPanel.jsx` | Evidence view (golden vs defective + heatmap), anomaly list, explanation. Actions: Approve (green), Reject (red), Override (yellow + verdict dropdown). Comments required for override. Submit → POST API |
| 3 | **ReportsPage** | `pages/ReportsPage.jsx` | Table: case_id, product, verdict, score, date. Actions: Download PDF, View HTML. Bulk CSV Export button |
| 4 | **HistoryPage** | `pages/HistoryPage.jsx` | Filterable table: date range, verdict filter, site filter, search. Sort by date/score. Click → detail page |
| 5 | **SettingsPage (Config Knobs)** | `pages/SettingsPage.jsx` | Sliders: SSIM Threshold, Blur Threshold, Brightness Min/Max, Keypoint Min. Save → PUT `/api/config`. Visual threshold display |

---

#### Dev-5 (Reports + Docs + QA) — Phase 2

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Polish HTML report template** | `templates/report_template.html` | CSS refinements, responsive, dark theme with VeriVision branding. Lightbox zoom on images. OCR diff with red/green highlighting. Metric gauges |
| 2 | **Test Case 1: Missing QC Label** | `test_results/test_case_1_missing_label.md` | `defect_missing_label.png` vs `golden_03_label_close.png`. Document input/output/screenshots |
| 3 | **Test Case 2: Altered Serial** | `test_results/test_case_2_altered_serial.md` | `defect_tampered_label.png` vs `golden_03_label_close.png`. Verify OCR catches '0'→'O' |
| 4 | **Test Case 3: Reused Board** | `test_results/test_case_3_reused_board.md` | `defect_reused_board.png` vs `golden_motherboard_full_top_down.png` |
| 5 | **Test Case 4: False Alarm** | `test_results/test_case_4_false_alarm.md` | Well-lit variant triggers SSIM hotspot, should be Clean after retake. Document retake flow |
| 6 | **Test Case 5: Non-OEM Label** | `test_results/test_case_5_non_oem_label.md` | Serial correct but color/font different. Color histogram catches it |
| 7 | **Test Case 6: Swap Detection** | `test_results/test_case_6_swap_detection.md` | `defect_burn_marks.png` vs golden — keypoint mismatch reveals component swap |

---

### 🔴 Phase 3: Integration, Polish & Demo Prep (Hour 12–20)

> **Goal:** Frontend ↔ Backend fully connected, end-to-end demo working, UI polish, edge cases handled.

---

#### Dev-1 (Backend Lead) — Phase 3

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **End-to-end integration testing** | All backend | Full pipeline test: upload → triage → vision → decision → explain → report. Fix bugs |
| 2 | **Feedback Memory Store** | `models.py`, `routers/reviews.py` | New table `FeedbackLog` (id, case_id, reviewer_action, adjusted_thresholds JSON, timestamp). When reviewer overrides, calculate what thresholds would have caught it |
| 3 | **Auto-generate reports** | `routers/inspections.py` | After pipeline completes, auto-trigger PDF + HTML generation. Store paths in Report table |
| 4 | **Security: image hash logging** | `routers/inspections.py` | Log SHA-256 of uploaded image. Add `image_hash` column to Inspection model |
| 5 | **CORS + Static files polish** | `main.py` | Verify heatmap images, golden images served correctly via `/data/` mount |

---

#### Dev-2 (CV Engineer) — Phase 3

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Threshold tuning** | `config.py`, `decision.py` | Based on test results, tune thresholds for best accuracy across 6 scenarios |
| 2 | **Multi-angle fusion (BONUS)** | `vision.py` | `fuse_multi_angle_scores(results_list)` — average/max-pool fraud scores from multiple angles |
| 3 | **Edge case handling** | `vision.py`, `ingestion.py` | Handle: grayscale images, different aspect ratios, very small images, EXIF rotation |
| 4 | **Support Dev-5 with test debugging** | — | Analyze pass/fail cases, adjust detection logic |

---

#### Dev-3 (Frontend Lead) — Phase 3

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Connect Dashboard to real API** | `DashboardPage.jsx` | Replace mock data with live API calls |
| 2 | **Error handling & loading states** | All pages | Error toasts, empty states, loading skeletons |
| 3 | **Responsive design** | All pages | Test on tablet/mobile widths, adjust grids |
| 4 | **Micro-animations** | All components | Page transitions, hover effects, count-up stats, fade-in results |
| 5 | **Dark theme consistency** | `index.css`, all components | No white flashes, consistent palette |

---

#### Dev-4 (Frontend + UX) — Phase 3

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **ROI Annotator polish** | `review/ROIAnnotator.jsx` | Drag-to-draw, resize handles, delete box, save to API |
| 2 | **Full API integration** | All pages | Every page connected to live API, loading/error states |
| 3 | **PDF/HTML viewer inline** | `ReportsPage.jsx` | PDF in new tab, HTML in new window |
| 4 | **AnomalyList polish** | `inspection/AnomalyList.jsx` | Type icon, coordinates, severity color, description |
| 5 | **Toast notifications** | — | Success/error toast system for all actions |

---

#### Dev-5 (Reports + Docs + QA) — Phase 3

| # | Task | File(s) | Detail |
|---|------|---------|--------|
| 1 | **Run all 6 test cases via UI** | `test_results/*.md` | Upload through frontend, screenshot each step |
| 2 | **Verify retake scenario** | Test Case 4 | Blurry image → 422 → retake_needed. Document with screenshots |
| 3 | **Finalize documentation** | `docs/architecture.md`, `docs/api_contracts.md` | Mermaid diagrams, LangGraph state diagram, ER diagram |
| 4 | **Update README.md** | `README.md` | Setup instructions, demo screenshots, tech stack, team credits |
| 5 | **Verify provenance in reports** | Reports | Check PDF/HTML contain: file names, hashes, version, thresholds |

---

### 🏁 Phase 4: Final Polish & Presentation (Hour 20–24)

> **Goal:** Demo-ready product. Presentation slides. Bug squashing. README final.

---

#### All Developers — Phase 4

| Task | Owner | Detail |
|------|-------|--------|
| **Full demo dry-run** | Everyone | Upload 3 defective images, show pipeline, download reports |
| **Bug fix sweep** | Dev-1 + Dev-2 | Fix crashes, handle edge cases |
| **UI final polish** | Dev-3 + Dev-4 | Pixel-perfect dark theme, smooth animations |
| **Presentation slides** | Dev-5 | Problem statement → Architecture → Demo screenshots → Tech stack → Future roadmap |
| **README finalization** | Dev-5 | Complete setup guide (pip install, npm install, seed, run) |
| **Demo video (optional)** | Dev-3 | Screen record full flow |
| **Git cleanup** | Dev-1 | Clean commits, proper .gitignore, remove debug logs |

---

## 🗺️ LangGraph Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    InspectionState (TypedDict)                       │
│  case_id, image_path, golden_path, roi_config, product_info,        │
│  triage_result, ensemble_results, decision, explanation, report_path│
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   START          │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ 1. Ingest Node   │  validate_and_prepare()
                    │   (Triage Agent) │  blur + lighting check
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │  is_quality_ok?   │
                    └───┬──────────┬───┘
                   YES  │          │ NO
                        │   ┌──────▼──────┐
                        │   │ Retake Node  │ → return guidance
                        │   └─────────────┘   "Capture at top-right
                        │                      label close-up"
                   ┌────▼─────────────┐
                   │ 2. Reference     │  Pick best golden image
                   │    Selector Node │  by angle match
                   └────┬─────────────┘
                        │
                   ┌────▼─────────────┐
                   │ 3. Anomaly       │  SSIM + OCR + Keypoints
                   │    Detection     │  + Template + Color
                   │    Ensemble Node │  (all 5 detectors)
                   └────┬─────────────┘
                        │
                   ┌────▼─────────────┐
                   │ 4. Policy &      │  calculate_fraud_score()
                   │    Scoring Node  │  assign_verdict()
                   │   + Explainer    │  generate_explanation()
                   └────┬─────────────┘
                        │
                   ┌────▼─────────────┐
                   │ 5. Report        │  generate_pdf_report()
                   │    Generation    │  generate_html_report()
                   │    Node          │  generate_csv_line()
                   └────┬─────────────┘
                        │
                    ┌────▼─────────┐
                    │     END      │
                    └──────────────┘
```

---

## 📊 Test Scenarios Mapping

| # | Scenario | Defective Image | Golden Image | Category | Expected Action | Key Detector |
|---|----------|----------------|--------------|----------|----------------|--------------|
| 1 | Missing QC Label | `defect_missing_label.png` | `golden_03_label_close.png` | Missing | Quarantine & Escalate | Template ROI + SSIM |
| 2 | Altered Serial | `defect_tampered_label.png` | `golden_03_label_close.png` | Mismatched | Escalate with evidence | OCR + String Diff |
| 3 | Reused Board | `defect_reused_board.png` | `golden_motherboard_full_top_down.png` | Reused/Tampered | Request additional angle | SSIM + Keypoints |
| 4 | False Alarm (Lighting) | *(Create blurry variant)* | Any golden | Clean (after retake) | Triage → Retake | Blur check + Lighting |
| 5 | Non-OEM Label | `defect_tampered_label.png` | `golden_03_label_semi_detail.png` | Mismatched | Escalate to vendor | Color Histogram |
| 6 | Swap Detection | `defect_burn_marks.png` | `golden_motherboard_full_top_down.png` | Tampered | Quarantine & Escalate | Keypoint Mismatch |

---

## 🔗 API Contracts Reference

```
# Auth
POST   /api/auth/register         → { name, email, password, role }
POST   /api/auth/login             → { email, password } → { access_token, token_type, role, name }
GET    /api/auth/me                → { id, name, email, role, created_at }

# Products
GET    /api/products               → [ { id, part_number, name, commodity } ]
POST   /api/products               → { part_number, name, commodity }
POST   /api/products/{id}/golden   → FormData { image, expected_serial, roi_config, angle }

# Inspections
POST   /api/inspections            → FormData { image, product_id, site, angle }
GET    /api/inspections            → [ { case_id, product, status, result, created_at } ]
GET    /api/inspections/{case_id}  → { full inspection + result + evidence }

# Reviews
GET    /api/reviews/pending        → [ { low confidence inspections } ]
POST   /api/reviews/{case_id}      → { action: approve/reject/override, override_verdict?, comments }

# Reports
GET    /api/reports/{case_id}/pdf  → PDF file download
GET    /api/reports/{case_id}/html → HTML file download
GET    /api/reports/export/csv     → CSV bulk export

# Dashboard
GET    /api/dashboard/stats        → { total, fraud_count, pending_reviews, by_category, by_site }
GET    /api/dashboard/trends       → [ { date, fraud_count, clean_count } ]

# Config
GET    /api/config                 → { ssim_threshold, blur_threshold, brightness_min, ... }
PUT    /api/config                 → { ssim_threshold?, blur_threshold?, ... }
```

---

## ✅ Final Deliverables Checklist

- [ ] **Agentic Workflow Demo** — Photo upload → LangGraph pipeline → Score → Report (end-to-end)
- [ ] **Fraud Findings Reports** — PDF + HTML with overlays, heatmaps, OCR diffs
- [ ] **CSV Export** — case_id, part_number, site, category, fraud_score, action
- [ ] **Explainability** — Defective region coordinates + natural language explanation per case
- [ ] **Config Knobs** — Tunable SSIM, blur, brightness, keypoint thresholds (UI + API)
- [ ] **6 Test Cases Validated** — Including 1 "retake requested" scenario
- [ ] **Documentation** — Setup guide, architecture doc, API contracts, model choices & limitations
- [ ] **LangGraph Multi-Agent Pipeline** — 5 nodes, conditional edges, compiled workflow
- [ ] **Human-in-the-Loop Feedback** — Approve/Reject/Override UI + AuditLog storage
- [ ] **Dashboard Analytics** — Fraud trends by site, category, time (mock-supported)

---

## ⚠️ Coordination Rules

> **Rule 1:** Dev-5 pehle `docs/api_contracts.md` likh dega (Phase 1 mein), taaki Dev-3 aur Dev-4 independently frontend bana sakein.

> **Rule 2:** Dev-1 aur Dev-2 ko Phase 1 ke end tak verify karna hai ki `POST /api/inspections` full pipeline sahi chal raha hai seeded data ke sath.

> **Rule 3:** Dev-3 Phase 1 ke end tak working Login + Dashboard page dikhayega taaki frontend ↔ backend connection verify ho sake.

> **Rule 4:** Har 4 ghante par sab devs 5-minute sync call karenge: "Kya hua, kya stuck hai, kya merge karna hai."

> **Rule 5 (Git Strategy):** `main` → `dev` (base). Each dev: `dev-1/langgraph`, `dev-2/cv-upgrade`, `dev-3/frontend-core`, `dev-4/frontend-pages`, `dev-5/reports-docs`. Merge into `dev` after testing.

---

## 💡 Presentation Tips

1. **Live Demo Flow:** Login → Dashboard → New Inspection (upload defective) → Pipeline runs → Results (score, verdict, heatmap, OCR) → Download PDF → Review Queue → Override verdict → AuditLog → Config Knobs → CSV Export
2. **Architecture Slide:** LangGraph multi-agent diagram with all 5 nodes
3. **Explainability Slide:** Side-by-side golden vs defective with heatmap + OCR diff
4. **Future Roadmap Slide:** Phase II (Analytics APIs, partner dashboard) → Phase III (Mobile AI Capture, camera SDK, real-time guidance, offline mode)
