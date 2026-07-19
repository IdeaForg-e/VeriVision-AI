import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.routers import auth, products, inspections, reviews, reports, triage

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

# Mount 'data' directory static files so frontend can fetch and show raw and heatmap images
data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
if os.path.exists(data_dir):
    app.mount("/data", StaticFiles(directory=data_dir), name="data")

# Mount 'dataset' directory so frontend can access golden/defect images for review pages
dataset_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "dataset"))
if os.path.exists(dataset_dir):
    app.mount("/dataset", StaticFiles(directory=dataset_dir), name="dataset")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "VeriVision-AI API Engine",
        "version": "1.0.0"
    }
