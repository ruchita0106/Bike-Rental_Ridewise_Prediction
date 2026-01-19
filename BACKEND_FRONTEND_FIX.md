# Backend & Frontend Integration Fix

## ✅ Backend Changes (Flask on Port 5000)

### `backend/app.py` - Complete Rewrite
- **Port**: Changed from 8000 → **5000**
- **CORS**: Enabled for `http://localhost:3000` and `http://localhost:5000`
- **Models**: Loads both `best_day_model.pkl` (24 features) and `best_hour_model.pkl` (26 features)
- **Feature Extraction**: Uses `model.feature_names_in_` as single source of truth

### Endpoints
```
GET  /health                    - Health check
POST /predict/day               - Daily prediction
POST /predict/hour              - Hourly prediction
```

### Request Format
Both endpoints accept JSON with the required features. Date is passed as `dteday` in YYYY-MM-DD format.

**Daily Request Example:**
```json
{
  "dteday": "2024-01-15",
  "season": 1,
  "holiday": 0,
  "workingday": 1,
  "weathersit": 1,
  "temp": 25.5,
  "atemp": 23.0,
  "hum": 50
}
```

**Hourly Request Example:**
```json
{
  "dteday": "2024-01-15",
  "hr": 8,
  "season": 1,
  "holiday": 0,
  "workingday": 1,
  "weathersit": 1,
  "temp": 25.5,
  "atemp": 23.0,
  "hum": 50,
  "windspeed": 10
}
```

### Response Format
```json
{
  "prediction": 123.45
}
```

### Features Processing
1. **Date Feature Extraction**: `dteday` → `yr`, `mnth`, `weekday`, `quarter` (only if expected by model)
2. **Raw Date Removal**: `dteday` is removed before prediction
3. **DataFrame Reindexing**: Strict reindex to expected features with fill_value=0
4. **Optional Preprocessing**: Applies `scaler.pkl` and `pca.pkl` if available
5. **Error Logging**: All requests and errors are logged to console

---

## ✅ Frontend Changes

### `src/lib/api.ts` - API Configuration
- **Backend URL**: Changed to `http://127.0.0.1:5000`
- **Endpoints**: 
  - Daily: `POST /predict/day`
  - Hourly: `POST /predict/hour`
- **Console Logging**: All requests and responses logged for debugging
- **Error Handling**: Proper error messages from backend returned to user

### `src/pages/Prediction.tsx` - UI Updates

#### 1. Added DATE Input Field
- **Type**: HTML date input
- **Required**: Always visible (both hourly and daily)
- **Default**: Today's date
- **Format**: YYYY-MM-DD

#### 2. Added Wind Speed Field
- **Type**: Number input  
- **Visible**: Only for hourly predictions
- **Unit**: km/h
- **Default**: 10

#### 3. Updated Form State
```typescript
const [inputs, setInputs] = useState({
  dteday: today,           // NEW: Date field
  season: "",
  hour: "",
  month: "",
  weekday: "",
  weather: "",
  temperature: "20",
  humidity: "50",
  windspeed: "10",         // NEW: Wind speed
  workingDay: "yes",
});
```

#### 4. Updated Request Payload
Forms proper payload with:
- `dteday`: Date from input
- `season`: Season code
- `holiday`: 0 (hardcoded)
- `workingday`: 1 or 0 based on toggle
- `weathersit`: Weather code
- `temp`: Temperature
- `atemp`: Apparent temperature (90% of temp)
- `hum`: Humidity
- `hr`: Hour (hourly only)
- `windspeed`: Wind speed (hourly only)
- `mnth`: Month (daily only)
- `weekday`: Weekday (daily only)

#### 5. Enhanced Error Handling
- Validates all required fields including date
- Shows backend error messages to user
- Logs request/response for debugging
- Better connection error messages

#### 6. Console Logging
```
[Predict] HOURLY/DAILY request payload: {...}
[Predict] Response status: 200
[Predict] Success: 123.45
```

---

## Testing Checklist

### 1. Backend Health Check
```bash
curl http://127.0.0.1:5000/health
```
Expected: `{"status": "ok", "day_model_loaded": true, "hour_model_loaded": true, ...}`

### 2. Daily Prediction
```bash
curl -X POST http://127.0.0.1:5000/predict/day \
  -H "Content-Type: application/json" \
  -d '{
    "dteday": "2024-01-15",
    "season": 1,
    "holiday": 0,
    "workingday": 1,
    "weathersit": 1,
    "temp": 25.5,
    "atemp": 23.0,
    "hum": 50
  }'
```

### 3. Hourly Prediction
```bash
curl -X POST http://127.0.0.1:5000/predict/hour \
  -H "Content-Type: application/json" \
  -d '{
    "dteday": "2024-01-15",
    "hr": 8,
    "season": 1,
    "holiday": 0,
    "workingday": 1,
    "weathersit": 1,
    "temp": 25.5,
    "atemp": 23.0,
    "hum": 50,
    "windspeed": 10
  }'
```

---

## What Was Fixed

✅ **CORS Issue**: Backend now explicitly allows requests from React on localhost:3000
✅ **Port Mismatch**: Backend moved from 8000 → 5000, API calls updated
✅ **Missing DATE Field**: Added date input to both daily and hourly forms
✅ **Missing Wind Speed**: Added wind speed input for hourly predictions
✅ **API Endpoint Mismatch**: Updated to use correct endpoint paths
✅ **Silent Failures**: Added comprehensive console logging and error messages
✅ **Feature Mismatch**: Strict DataFrame reindexing ensures exact shape match
✅ **Login Removed**: No authentication—prediction page loads directly

---

## How to Run

### Terminal 1: Start Backend (Port 5000)
```bash
cd "c:\Users\harsh\Downloads\bike_ride-main (1)\bike_ride-main"
python backend/app.py
```

### Terminal 2: Start Frontend (Port 3000)
```bash
cd "c:\Users\harsh\Downloads\bike_ride-main (1)\bike_ride-main"
npm run dev
```

Visit `http://localhost:3000` in browser → Click "Prediction" → Fill form → Click "Predict Demand"

---

## Notes

- Backend logs all requests to console for debugging
- Frontend console shows all request/response details
- Models are validated at startup (day model must have 24 features)
- Both scaler and PCA artifacts are optional
- Raw date (`dteday`) is always removed before prediction
- All feature alignment is automatic based on `model.feature_names_in_`
