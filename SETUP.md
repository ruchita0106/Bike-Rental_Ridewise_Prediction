# Quick Setup Guide

## 🚀 Running the Application

### Windows (Easiest Method)

**Option 1: Double-click**
1. **Double-click `start-all.bat`** in the root directory
   - This will automatically start both backend and frontend servers

**Option 2: Command Prompt**
```cmd
start-all.bat
```

**Option 3: PowerShell**
```powershell
# If you get an execution policy error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run:
.\start-all.bat
# or use the PowerShell script:
.\start-all.ps1
```

2. Open your browser and go to: **http://localhost:3000**

### Manual Windows Setup

**Command Prompt:**

**Terminal 1 - Backend:**
```cmd
cd backend
start.bat
```

**Terminal 2 - Frontend:**
```cmd
start-frontend.bat
```

**PowerShell:**

**Terminal 1 - Backend:**
```powershell
cd backend
.\start.bat
# or use the PowerShell script:
.\start.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\start-frontend.bat
```

### Linux/Mac

**Terminal 1 - Backend:**
```bash
cd backend
chmod +x start.sh
./start.sh
```

**Terminal 2 - Frontend:**
```bash
chmod +x start-frontend.sh
./start-frontend.sh
```

Or run everything together:
```bash
chmod +x start-all.sh
./start-all.sh
```

## ✅ Verify Installation

### Check Backend
- Open: http://localhost:8000/api/health
- Should return: `{"status": "healthy", "hour_model_loaded": true, "day_model_loaded": true}`

### Check Frontend
- Open: http://localhost:3000
- Should see the login page

## 🔧 Troubleshooting

### Backend won't start?
1. Check Python is installed: `python --version`
2. Make sure `saved_models/` folder contains:
   - `best_hour_model.pkl`
   - `best_day_model.pkl`
3. Try manual installation:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or: source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   python app.py
   ```

### Frontend won't start?
1. Check Node.js is installed: `node --version`
2. Install dependencies: `npm install`
3. Try manual start: `npm run dev`

### Predictions not working?
1. Make sure backend is running on port 8000
2. Check browser console for errors
3. Verify backend health: http://localhost:8000/api/health

## 📝 Notes

- Backend runs on: **http://localhost:8000**
- Frontend runs on: **http://localhost:3000**
- Make sure both are running for predictions to work!

