# Meiyalagu AI - Backend Server

High-performance AI-assisted skin health screening API built with FastAPI, PyTorch (MobileNetV2 with Dynamic Morphology CBAM), and MySQL Workbench integration.

---

## MySQL Workbench Integration

The backend is configured to connect to your local MySQL instance.

### 1. Configure MySQL Credentials in `.env`
Edit `backend/.env`:
```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=meiyalagu_db
```

### 2. Automatic Schema Creation
When the backend starts, it automatically:
1. Connects to your MySQL server at `127.0.0.1:3306`.
2. Creates the `meiyalagu_db` database if it does not already exist.
3. Creates all application tables:
   - `users`
   - `skin_analyses`
   - `risk_assessments`
   - `diseases`
   - `reports`
4. Automatically seeds the skin condition reference library and default workspace user.

You can then open **MySQL Workbench**, refresh schemas, and inspect all records and tables under `meiyalagu_db`.

---

## Running the Backend

### Start Server
```powershell
# From d:\Harini_Project\backend
D:\Python\python.exe run.py
```
Or with uvicorn:
```powershell
D:\Python\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Endpoints
- **Interactive API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Image Upload:** `POST /api/analysis/upload`
- **Model Prediction & Heatmap:** `POST /api/analysis/predict/{analysis_id}`
- **Analysis Detail:** `GET /api/analysis/{analysis_id}`
- **Risk Screening:** `POST /api/risk/assess`
- **Dashboard Stats:** `GET /api/dashboard`
- **PDF Report Download:** `GET /api/reports/download/{analysis_id}`
- **Diseases Library:** `GET /api/diseases`
