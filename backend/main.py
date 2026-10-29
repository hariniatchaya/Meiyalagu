import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure backend root and project root are on sys.path
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.database import Base, engine, DB_DIALECT
from app.config import UPLOADS_DIR, REPORTS_DIR
from app.ml import load_model
from app.seed_data import seed_initial_data

from app.routes.auth_routes import router as auth_router
from app.routes.analysis import router as analysis_router
from app.routes.risk_routes import router as risk_router
from app.routes.dashboard import router as dashboard_router
from app.routes.history import router as history_router
from app.routes.diseases import router as diseases_router
from app.routes.reports import router as reports_router
from app.routes.nearby import router as nearby_router

app = FastAPI(
    title="Meiyalagu AI API",
    description="Backend API for Meiyalagu AI Skin Health System with MySQL Workbench & PyTorch integration",
    version="2.0.0"
)

# CORS Middleware
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5184",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5184",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount Static Uploads & Reports Directories
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")

# Include Routers
app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(risk_router)
app.include_router(dashboard_router)
app.include_router(history_router)
app.include_router(diseases_router)
app.include_router(reports_router)
app.include_router(nearby_router)


@app.on_event("startup")
def startup_event():
    print(f"[Database] Initializing schema on {DB_DIALECT.upper()}...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[Database] Tables verified and created successfully.")
        seed_initial_data()
    except Exception as e:
        print(f"[Database Warning] Initialization notice: {e}")

    print("[AI Model] Preloading skin classification model into memory...")
    try:
        load_model()
        print("[AI Model] PyTorch model loaded successfully and ready for inference.")
    except Exception as e:
        print(f"[AI Model Warning] Preload notice: {e}")


@app.get("/")
def root():
    return {
        "service": "Meiyalagu AI Backend",
        "version": "2.0.0",
        "database": DB_DIALECT,
        "docs": "/docs",
        "health": "/api/health"
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "database": DB_DIALECT
    }
