import sys
from pathlib import Path
import uvicorn

# Add backend directory and project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.config import APP_HOST, APP_PORT

if __name__ == "__main__":
    print(f" Starting Meiyalagu AI Server at http://{APP_HOST}:{APP_PORT}")
    print(f" Interactive API Docs available at http://{APP_HOST}:{APP_PORT}/docs")
    uvicorn.run("main:app", host=APP_HOST, port=APP_PORT, reload=False)
