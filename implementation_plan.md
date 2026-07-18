# 🚀 VeriVision-AI — Implementation Plan

> **Project:** AI-Powered Manufacturing Inspection Platform  
> **Team Size:** 2 Developers  
> **Branch:** `dev`  
> **Duration:** 2 Days  
> **Tech Stack:** React + Tailwind CSS | FastAPI + SQLAlchemy | OpenCV + EasyOCR + scikit-image | LangGraph

---

## 👥 Team Assignment

| Role | Alias | Primary Responsibility |
|------|-------|----------------------|
| **Dev 1 (Backend + CV)** | Anil | FastAPI APIs, Database Models, Computer Vision Pipeline, LangGraph Agents, PDF Reporting |
| **Dev 2 (Frontend + UI)** | Team Member 2 | React Dashboard, All Pages, API Integration, Tailwind Styling, UX Polish |

---

## 📁 Complete Folder Structure

```
VeriVision-AI/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # [Dev 1] FastAPI app entry, CORS, router registration
│   │   ├── config.py                  # [Dev 1] Thresholds, paths, env variables
│   │   ├── database.py                # [Dev 1] SQLAlchemy engine, session, Base
│   │   ├── models.py                  # [Dev 1] All DB table models
│   │   ├── schemas.py                 # [Dev 1] Pydantic request/response schemas
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # [Dev 1] Login, Register, JWT token endpoints
│   │   │   ├── products.py            # [Dev 1] CRUD for products & golden references
│   │   │   ├── inspections.py         # [Dev 1] Create inspection, get results, list history
│   │   │   ├── reviews.py             # [Dev 1] Human review approve/reject/override endpoints
│   │   │   └── reports.py             # [Dev 1] Download PDF/CSV report endpoints
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ingestion.py           # [Dev 1] Blur detection, lighting check, image alignment
│   │   │   ├── vision.py              # [Dev 1] SSIM, OCR, Keypoint matching, ROI check
│   │   │   ├── decision.py            # [Dev 1] Fraud scoring, verdict, confidence calculation
│   │   │   ├── explainer.py           # [Dev 1] Natural language explanation generator
│   │   │   └── reporting.py           # [Dev 1] PDF generation (ReportLab), HTML (Jinja2)
│   │   │
│   │   └── agents/
│   │       ├── __init__.py
│   │       └── workflow.py            # [Dev 1] LangGraph multi-agent workflow orchestration
│   │
│   ├── data/
│   │   ├── golden/                    # Golden reference images storage
│   │   ├── cases/                     # Uploaded inspection images storage
│   │   └── reports/                   # Generated PDF/HTML reports storage
│   │
│   ├── templates/
│   │   └── report_template.html       # [Dev 1] Jinja2 HTML template for fraud report
│   │
│   ├── seed_data.py                   # [Dev 1] Populate DB with sample data & synthetic images
│   ├── requirements.txt               # [Dev 1] All Python dependencies
│   └── run.py                         # [Dev 1] Quick launch script (uvicorn)
│
├── frontend/
│
├── public/
│   └── vite.svg
│
├── src/
│   ├── assets/                        # [Dev 2] Static assets (logos, icons)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx            # [Dev 2] Left navigation sidebar
│   │   │   ├── Header.jsx             # [Dev 2] Top bar with user info
│   │   │   ├── Layout.jsx             # [Dev 2] Main layout wrapper
│   │   │   └── ProtectedRoute.jsx     #   CORE — blocks pages if not logged in
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatsCard.jsx          # [Dev 2] Reusable stat card component
│   │   │   ├── FraudChart.jsx         # [Dev 2] Recharts chart for fraud categories
│   │   │   └── RecentActivity.jsx     # [Dev 2] Recent inspections table
│   │   │
│   │   ├── inspection/
│   │   │   ├── ImageUploader.jsx      # [Dev 2] Drag-and-drop image upload
│   │   │   ├── ImageCompare.jsx       # [Dev 2] Side-by-side golden vs defective
│   │   │   ├── HeatmapOverlay.jsx     # [Dev 2] Heatmap overlay on defective image
│   │   │   ├── AnomalyList.jsx        # [Dev 2] Detected anomalies list
│   │   │   ├── VerdictBadge.jsx       # [Dev 2] Color-coded verdict badge
│   │   │   └── MetadataForm.jsx       #   CORE — part_id, commodity, angle, site form
│   │   │
│   │   ├── review/
│   │   │   ├── ReviewPanel.jsx        # [Dev 2] QA review with Approve/Reject
│   │   │   └── CommentBox.jsx         # [Dev 2] Reviewer comments textarea
│   │   │
│   │   ├── reports/                   #   IF TIME — only if Reports page gets built
│   │   │   ├── ReportCard.jsx         #   Single report preview card
│   │   │   └── ExportButton.jsx       #   CSV/PDF export button
│   │   │
│   │   └── common/
│   │       ├── Button.jsx             # [Dev 2] Reusable button component
│   │       ├── Modal.jsx              # [Dev 2] Modal dialog
│   │       ├── Loader.jsx             # [Dev 2] Loading spinner
│   │       ├── Badge.jsx              # [Dev 2] Generic status badge
│   │       ├── Table.jsx              #   IF TIME — shared table for History/Reports
│   │       ├── EmptyState.jsx         #   SKIP unless spare time — "no data" placeholder
│   │       └── ErrorMessage.jsx       #   SKIP unless spare time — reusable error display
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx              # [Dev 2] Login form with JWT auth
│   │   ├── DashboardPage.jsx          # [Dev 2] Main dashboard with stats & charts
│   │   ├── NewInspectionPage.jsx      # [Dev 2] Upload image + metadata form
│   │   ├── InspectionDetailPage.jsx   # [Dev 2] Full result view with evidence
│   │   ├── ReviewPage.jsx             # [Dev 2] QA review queue
│   │   ├── ReportsPage.jsx            # [Dev 2] Reports listing + PDF download
│   │   ├── HistoryPage.jsx            # [Dev 2] Inspection history with filters
│   │   ├── AdminPage.jsx              # [Dev 2] Admin panel
│   │   └── NotFoundPage.jsx           #   SKIP unless spare time — 404 page
│   │
│   ├── services/
│   │   ├── api.js                     # [Dev 2] Axios wrapper for all API calls (base instance)
│   │   ├── authService.js             #   CORE — login, logout, token calls
│   │   ├── inspectionService.js       #   CORE — upload, get inspections, get results
│   │   └── reportService.js           #   CORE — get reports, CSV/PDF export calls
│   │
│   ├── context/
│   │   └── AuthContext.jsx            # [Dev 2] JWT auth state management
│   │
│   ├── hooks/                         #   SKIP unless spare time
│   │   ├── useAuth.js                 #   Shortcut to read AuthContext
│   │   └── useFetch.js                #   Reusable data-fetching hook
│   │
│   ├── utils/
│   │   ├── formatDate.js              #   SKIP unless spare time — format timestamps
│   │   └── constants.js               #   CORE — fraud categories, actions, status colors
│   │
│   ├── App.jsx                        # [Dev 2] React Router setup
│   ├── main.jsx                       # [Dev 2] ReactDOM entry point
│   └── index.css                      # [Dev 2] Tailwind + global styles
│
├── tailwind.config.js                 # [Dev 2] Theme config (dark mode, colors)
├── postcss.config.js                  # [Dev 2] PostCSS for Tailwind
├── vite.config.js                     # [Dev 2] Vite config with API proxy
├── package.json
└── index.html
│
├── docs/
│   ├── architecture.md                # [Dev 1] System architecture documentation
│   └── api_contracts.md               # [Dev 1] API request/response contracts
│
├── implementation_plan.md             # This file
├── .gitignore
└── README.md
```

---

## 📅 Day 1 — Foundation & Core Logic

### 🔧 Dev 1 (Backend + CV) — Day 1

| # | File | Kya Karna Hai |
|---|------|---------------|
| 1 | `requirements.txt` | Saari dependencies: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `pydantic`, `python-multipart`, `python-jose[cryptography]`, `passlib[bcrypt]`, `opencv-python-headless`, `scikit-image`, `easyocr`, `reportlab`, `jinja2`, `matplotlib`, `langgraph`, `pillow` |
| 2 | `app/config.py` | Settings define kar: `DATABASE_URL`, `SECRET_KEY`, `SSIM_THRESHOLD=0.80`, `BLUR_THRESHOLD=100.0`, `BRIGHTNESS_MIN=40`, `BRIGHTNESS_MAX=220`, `KEYPOINT_MATCH_MIN=0.60`, upload/golden/reports directory paths |
| 3 | `app/database.py` | SQLAlchemy engine setup (`sqlite:///./verivision.db`), session factory, `Base = declarative_base()`, `get_db()` dependency |
| 4 | `app/models.py` | Tables: **User** (id, name, email, hashed_password, role, created_at), **Product** (id, part_number, name, commodity), **GoldenReference** (id, product_id FK, image_path, expected_serial, roi_config JSON, angle), **Inspection** (id, case_id UUID, product_id FK, user_id FK, captured_image_path, capture_site, capture_angle, status, created_at), **InspectionResult** (id, inspection_id FK, ssim_score, keypoint_match_rate, ocr_detected_text, ocr_expected_text, fraud_score 0-100, verdict, confidence, recommended_action, explanation, heatmap_path), **Report** (id, inspection_id FK, pdf_path, html_path), **AuditLog** (id, inspection_id FK, actor, action, comments, previous_verdict, new_verdict, timestamp) |
| 5 | `app/schemas.py` | Pydantic models: `UserCreate`, `UserLogin`, `TokenResponse`, `ProductCreate`, `ProductResponse`, `InspectionCreate`, `InspectionResponse`, `InspectionResultResponse`, `ReviewAction`, `ReportResponse` |
| 6 | `app/main.py` | FastAPI app, CORS (`origins=["http://localhost:5173"]`), include all routers, startup event → `Base.metadata.create_all()` |
| 7 | `routers/auth.py` | `POST /api/auth/register`, `POST /api/auth/login` (JWT), `GET /api/auth/me` |
| 8 | `routers/products.py` | `POST /api/products`, `GET /api/products`, `POST /api/products/{id}/golden` (image upload) |
| 9 | `routers/inspections.py` | `POST /api/inspections` (image + metadata → triggers CV pipeline), `GET /api/inspections`, `GET /api/inspections/{case_id}` |
| 10 | `services/ingestion.py` | `check_blur()` — Laplacian variance, `check_lighting()` — mean intensity, `align_images()` — ORB + RANSAC homography + warpPerspective, `validate_and_prepare()` — combined validation |
| 11 | `docs/api_contracts.md` | All endpoint JSON contracts for Dev 2 |

### 🎨 Dev 2 (Frontend) — Day 1

| # | File | Kya Karna Hai |
|---|------|---------------|
| 1 | Project Init | `npx create-vite@latest ./ --template react`, install Tailwind CSS, configure |
| 2 | `tailwind.config.js` | Dark mode: `'class'`. Colors: `primary: '#6366f1'`, `surface: '#0f172a'`, `card: '#1e293b'`, `accent: '#22d3ee'` |
| 3 | `index.css` | Tailwind directives, global dark background, custom scrollbar, Inter/Outfit font import |
| 4 | `services/api.js` | Axios instance (`baseURL: http://localhost:8000/api`), JWT interceptor, functions: `login()`, `register()`, `getInspections()`, `createInspection()`, `getInspectionDetail()`, `submitReview()`, `downloadReport()` |
| 5 | `context/AuthContext.jsx` | Auth context, `login()`, `logout()`, `user` state, JWT in localStorage, ProtectedRoute wrapper |
| 6 | `components/layout/Sidebar.jsx` | Navigation links (Dashboard, New Inspection, History, Reports, Admin), active highlight, Lucide icons, dark glassmorphism |
| 7 | `components/layout/Header.jsx` | App title "VeriVision AI", user avatar, notification bell, logout |
| 8 | `components/layout/Layout.jsx` | Sidebar + Header + `{children}` content wrapper |
| 9 | `App.jsx` | React Router v6: `/login`, `/`, `/inspect/new`, `/inspect/:caseId`, `/reviews`, `/reports`, `/history`, `/admin` |
| 10 | `pages/LoginPage.jsx` | Dark login page, email/password inputs, JWT auth, redirect to dashboard |
| 11 | `pages/DashboardPage.jsx` | Stats cards (Total, Pending, Approved, Rejected — mock data), chart placeholder, recent activity |
| 12 | `components/common/*` | Button (primary/secondary/danger), Modal, Loader (pulse), Badge (color variants) |

---

## 📅 Day 2 — CV Pipeline, Integration & Polish

### 🔧 Dev 1 (Backend + CV) — Day 2

| # | File | Kya Karna Hai |
|---|------|---------------|
| 1 | `services/vision.py` | `compute_ssim()` — structural similarity + diff image + anomaly heatmap. `run_ocr()` — ROI crop + EasyOCR text extract. `compare_text()` — Levenshtein distance + leet-speak check ('0'↔'O'). `match_keypoints()` — ORB + BFMatcher + match percentage |
| 2 | `services/decision.py` | `calculate_fraud_score()` — weighted: `w1*(1-ssim)*100 + w2*(1-ocr)*100 + w3*(1-keypoint)*100`. `assign_verdict()` — Tampered/Missing/Mismatched/Reused/Clean. `recommend_action()` — Quarantine/Retake/Vendor Verify/Accept. `build_decision()` — combine + save InspectionResult |
| 3 | `services/explainer.py` | Template-based explanation text. LLM (Gemini) fallback if API key available |
| 4 | `services/reporting.py` | `generate_pdf_report()` — ReportLab PDF with header, summary, side-by-side images, OCR diff, metrics, provenance. `generate_csv_export()` — CSV: case_id, part_number, site, verdict, score, action |
| 5 | `routers/reviews.py` | `GET /api/reviews/pending`, `POST /api/reviews/{case_id}` (approve/reject/override + AuditLog) |
| 6 | `routers/reports.py` | `GET /api/reports/{case_id}/pdf`, `GET /api/reports/export/csv` |
| 7 | `agents/workflow.py` | LangGraph StateGraph: `ingest` → `select_reference` → `detect_anomalies` → `make_decision` → `generate_report`. Compile + expose `run_inspection_pipeline()` |
| 8 | `seed_data.py` | Synthetic images (OpenCV draw): golden PCB + label + QC sticker. 4 defective variants: (1) Missing label, (2) Altered serial "98765O", (3) Burn marks, (4) Blurry. Seed DB with admin user, products, references |
| 9 | `templates/report_template.html` | Jinja2 dark-themed HTML report template |

### 🎨 Dev 2 (Frontend) — Day 2

| # | File | Kya Karna Hai |
|---|------|---------------|
| 1 | Dependencies | `npm install recharts react-dropzone lucide-react axios` |
| 2 | `pages/NewInspectionPage.jsx` | Drag-drop upload, product dropdown (API), site input, angle dropdown, submit → POST FormData, processing spinner, redirect to result |
| 3 | `pages/InspectionDetailPage.jsx` | Case info header, fraud score circle (color-coded), verdict badge, image comparison (golden vs defective), heatmap toggle, OCR diff highlights, SSIM/keypoint bars, explanation text, PDF download |
| 4 | `components/inspection/*` | ImageUploader, ImageCompare, HeatmapOverlay, AnomalyList, VerdictBadge — all styled components |
| 5 | `pages/ReviewPage.jsx` | Pending review cards, expand → evidence + Approve/Reject/Override + comments |
| 6 | `pages/ReportsPage.jsx` | Reports table, PDF download per row, CSV export button |
| 7 | `pages/HistoryPage.jsx` | Filterable inspection table (date, verdict, site), sort, click → detail |
| 8 | `pages/DashboardPage.jsx` | Connect to real API, live stats, Recharts with real data |
| 9 | Polish | Loading/error/empty states, responsive check, hover animations, dark theme consistency |

---

## 🔗 API Contracts Reference

```
POST   /api/auth/register         → { name, email, password, role }
POST   /api/auth/login             → { email, password } → { access_token }
GET    /api/auth/me                → { user info }

GET    /api/products               → [ { id, part_number, name, commodity } ]
POST   /api/products               → { part_number, name, commodity }
POST   /api/products/{id}/golden   → FormData { image, expected_serial, angle }

POST   /api/inspections            → FormData { image, product_id, site, angle }
GET    /api/inspections            → [ { case_id, product, status, created_at } ]
GET    /api/inspections/{case_id}  → { full inspection + result + evidence }

GET    /api/reviews/pending        → [ { low confidence inspections } ]
POST   /api/reviews/{case_id}      → { action: approve/reject/override, comments }

GET    /api/reports/{case_id}/pdf  → PDF file download
GET    /api/reports/export/csv     → CSV file download
```

---

## ✅ Day 2 End — Expected Deliverables

- [ ] FastAPI backend running on `http://localhost:8000` with Swagger docs
- [ ] SQLite database with all tables auto-created
- [ ] Image upload → CV pipeline → Fraud Score → Verdict → Report (end-to-end)
- [ ] Seed data script with 4 test scenarios
- [ ] React frontend running on `http://localhost:5173`
- [ ] Login, Dashboard, New Inspection, Detail, Review, Reports, History pages
- [ ] Dark premium UI with Tailwind
- [ ] PDF report generation & download
- [ ] Human review approve/reject/override working
- [ ] At least 4 test cases validated

---

## ⚠️ Important Notes

> **Dev 1** pehle `docs/api_contracts.md` likh kar Dev 2 ko share karega taaki dono parallel kaam kar sakein.

> Day 1 ke end tak dono devs verify karenge ki frontend ↔ backend connection (`/api/auth/login`) sahi kaam kar raha hai.

> Hackathon ke day par is base ke upar sirf fine-tuning, LLM integration polish, aur presentation preparation karni hogi.
