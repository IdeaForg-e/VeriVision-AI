import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.config import settings
from app.database import engine, Base
from app.routers import auth, products, inspections, reviews, reports, triage, analytics

# Setup basic logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("app.main")
logger.info("Initializing VeriVision-AI Engine...")

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

def ensure_sqlite_schema_compatibility():
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    inspector = inspect(engine)
    if "inspection_results" not in inspector.get_table_names():
        return
    existing = {col["name"] for col in inspector.get_columns("inspection_results")}
    additions = {
        "diagnostic_path": "VARCHAR",
        "evidence_json": "JSON",
    }
    with engine.begin() as conn:
        for column_name, column_type in additions.items():
            if column_name not in existing:
                conn.execute(text(f"ALTER TABLE inspection_results ADD COLUMN {column_name} {column_type}"))


ensure_sqlite_schema_compatibility()

app = FastAPI(
    title="VeriVision-AI Platform",
    description="Enterprise AI visual inspection system for parts fraud detection.",
    version="1.0.0"
)

# CORS middleware config to allow React dev server at localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(inspections.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(triage.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

# Mount 'data' directory static files so frontend can fetch and show raw and heatmap images
data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
if os.path.exists(data_dir):
    app.mount("/data", StaticFiles(directory=data_dir), name="data")

# Mount 'dataset' directory so frontend can access golden/defect images for review pages
dataset_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "dataset"))
if os.path.exists(dataset_dir):
    app.mount("/dataset", StaticFiles(directory=dataset_dir), name="dataset")

@app.on_event("startup")
def warmup_ml_models():
    """
    Pre-warm all PyTorch-backed ML models on the main thread at server startup.

    EasyOCR and open_clip both import torchvision internally. Python's module
    import system serializes imports via _ModuleLock. When these models are
    lazy-initialized for the first time inside a ThreadPoolExecutor worker thread,
    it races against other threads also trying to import the same module — resulting
    in a deadlock on '_ModuleLock(torchvision.ops.misc)'.

    Loading them here on the main thread guarantees all modules are fully initialized
    before any background threads are spawned by the pipeline ensemble.
    """
    logger.info("[Startup] Pre-warming ML models on main thread to prevent thread deadlocks...")
    try:
        from app.services.agent_3_detector import get_ocr_reader
        get_ocr_reader()
        logger.info("[Startup] EasyOCR reader pre-warmed successfully.")
    except Exception as e:
        logger.warning(f"[Startup] EasyOCR pre-warm failed (OCR will degrade gracefully): {e}")

    try:
        from app.services.embedding_service import _load_clip
        _load_clip()
        logger.info("[Startup] CLIP embedding model pre-warmed successfully.")
    except Exception as e:
        logger.warning(f"[Startup] CLIP pre-warm failed (will use OpenCV fallback): {e}")


@app.on_event("startup")
def auto_sync_golden_catalog():
    try:
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from seed_db import seed
        logger.info("[AutoSync] Syncing Golden_Images folder catalog with database on startup...")
        seed()
    except Exception as err:
        logger.warning(f"[AutoSync] Startup catalog sync notice: {err}")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "VeriVision-AI API Engine",
        "version": "1.0.0"
    }
