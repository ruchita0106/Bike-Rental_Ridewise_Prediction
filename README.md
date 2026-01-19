# RideWise Insights - Bike-Sharing Demand Prediction

A full-stack application for predicting bike-sharing demand using machine learning models. The application consists of a React frontend and a Python Flask backend that serves ML models for hourly and daily demand predictions.

## Features

- 🤖 **ML-Powered Predictions**: Uses trained models (`best_hour_model.pkl` and `best_day_model.pkl`) for accurate demand forecasting
- 📊 **Interactive Dashboard**: Real-time analytics and insights visualization
- 🎯 **Hourly & Daily Predictions**: Switch between hourly and daily prediction modes
- 🌦️ **Weather Integration**: Consider weather conditions, temperature, and humidity
- 📱 **Responsive Design**: Modern UI built with React, TypeScript, and Tailwind CSS

## Project Structure

```
ridewise-insights-main/
├── backend/           # Python Flask backend server
│   ├── app.py        # Main Flask application
│   ├── requirements.txt
│   ├── start.bat     # Windows startup script
│   └── start.sh      # Linux/Mac startup script
├── saved_models/     # Trained ML models
│   ├── best_hour_model.pkl
│   └── best_day_model.pkl
├── src/              # React frontend
│   ├── components/   # UI components
│   ├── pages/        # Page components
│   ├── lib/          # Utilities and API client
│   └── ...
└── package.json      # Frontend dependencies
```

## Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **npm** (comes with Node.js)

## Quick Start

### Option 1: Run Everything Together (Recommended)

**Windows (Command Prompt):**
```cmd
start-all.bat
```

**Windows (PowerShell):**
```powershell
# If you get an execution policy error, run this first:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

.\start-all.bat
# or use the PowerShell script:
.\start-all.ps1
```

**Linux/Mac:**
```bash
chmod +x start-all.sh
./start-all.sh
```

### Option 2: Run Separately

#### Step 1: Start the Backend Server

**Windows (Command Prompt):**
```cmd
cd backend
start.bat
```

**Windows (PowerShell):**
```powershell
cd backend
.\start.bat
# or use the PowerShell script:
.\start.ps1
```

**Linux/Mac:**
```bash
cd backend
chmod +x start.sh
./start.sh
```

The backend will start on `http://localhost:8000`

#### Step 2: Start the Frontend

**Windows (Command Prompt):**
```cmd
start-frontend.bat
```

**Windows (PowerShell):**
```powershell
.\start-frontend.bat
```

**Linux/Mac:**
```bash
chmod +x start-frontend.sh
./start-frontend.sh
```

The frontend will start on `http://localhost:3000`

## Manual Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - **Windows:** `venv\Scripts\activate`
   - **Linux/Mac:** `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the server:
```bash
python app.py
```

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory (optional):

```env
VITE_API_URL=http://localhost:8000
```

If not set, the frontend defaults to `http://localhost:8000`

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if the backend is running and models are loaded

### Prediction
- **POST** `/api/predict` - Get demand prediction
  - Body:
    ```json
    {
      "isHourly": true,
      "inputs": {
        "season": "summer",
        "hour": "8",
        "weather": "clear",
        "temperature": "25",
        "humidity": "60",
        "workingDay": "yes"
      }
    }
    ```

## Using the Application

1. **Login/Register**: Create an account or login to access the dashboard
2. **Dashboard**: View analytics and insights about bike-sharing demand
3. **Prediction**: 
   - Navigate to the Prediction page
   - Choose between Hourly or Daily prediction
   - Fill in the required fields (season, weather, temperature, etc.)
   - Click "Predict Demand" to get the forecast

## Troubleshooting

### Backend Issues

- **Models not loading**: Ensure the `saved_models` directory contains both `.pkl` files
- **Port already in use**: Change the port in `backend/app.py` (default: 8000)
- **Python dependencies error**: Make sure you're using Python 3.8+

### Frontend Issues

- **Cannot connect to backend**: 
  - Verify the backend is running on port 8000
  - Check if CORS is enabled (it should be by default)
  - Verify the `VITE_API_URL` environment variable if set

### Common Fixes

- Clear browser cache if UI doesn't update
- Restart both servers if predictions fail
- Check console for error messages

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
