"""
RideWise Flask Backend - Bike Demand Prediction
- Dual endpoints: /predict/hour and /predict/day
- Models loaded from saved_models/
- Features extracted from model.feature_names_in_
- CORS enabled for React frontend on http://localhost:3000
- No login/authentication (demo mode)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from joblib import load
import pandas as pd
import numpy as np
import os
import traceback
import logging
from dotenv import load_dotenv

# Google Generative AI SDK
try:
    import google.generativeai as genai
except ImportError:
    genai = None

app = Flask(__name__)

# Enable CORS for local dev origins (adjust in production)
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]}})

# Configure logging to stdout for easier debugging in terminals and containers
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Configuration and model loading
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MODEL_DIR = os.path.join(PROJECT_ROOT, 'saved_models')

# Load .env from project root (if present) so GEMINI_API_KEY is available.
# This will not override environment variables already set in the OS.
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))
load_dotenv(os.path.join(BASE_DIR, '.env'))

# Configure GEMINI API key
# Prefer the environment variable (backend/.env or OS env); fall back to the provided key.
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or 'AIzaSyAzMOWptJJm5aUV5LNvSz8hZx6F-L8E50M'
if genai is None:
    logger.warning("google-genai SDK is not installed. Install it with 'pip install google-genai'.")
else:
    if GEMINI_API_KEY:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            # Use gemini-2.5-flash which is available and supports generateContent
            model = genai.GenerativeModel('models/gemini-2.5-flash')
            logger.info("Gemini client initialized successfully with model: gemini-2.5-flash")
        except Exception as e:
            logger.exception("Failed to initialize Gemini client: %s", e)
            # Try fallback models
            try:
                logger.info("Trying fallback model: gemini-2.0-flash")
                model = genai.GenerativeModel('models/gemini-2.0-flash')
                logger.info("Gemini client initialized with fallback model: gemini-2.0-flash")
            except Exception as e2:
                logger.exception("Fallback model also failed: %s", e2)
                model = None
    else:
        model = None
        logger.warning("GEMINI_API_KEY not found in environment. Set it in backend/.env or system environment variables.")

# System prompt used for all chatbot requests
SYSTEM_PROMPT = """You are RideWise Assistant, a friendly and helpful AI assistant for the RideWise bike-sharing demand prediction application.

ABOUT RIDEWISE:
- RideWise is a bike-sharing demand prediction system that uses ML models to forecast bike rental demand
- The app has multiple pages: Login, Signup, Dashboard, Prediction, Upload, Chatbot, and Profile
- You have COMPLETE ACCESS to all application information, pages, features, processes, and current state
- Users can make predictions based on weather conditions (temperature, humidity, weather situation), temporal factors (hour, day, season), and other features
- The application includes authentication, real-time dashboard, prediction forms, file upload, and an AI chatbot assistant

YOUR BEHAVIOR:
- Keep responses CONVERSATIONAL and NATURAL (1-3 sentences for greetings, 2-5 sentences for explanations)
- For greetings like "hello", "hi", "hey" - respond warmly and briefly, then ask how you can help
- Be helpful, friendly, and enthusiastic
- You have COMPLETE KNOWLEDGE of all pages, features, processes, and current application state
- You can answer questions about ANY page, feature, or process in the application
- When asked about features, pages, or how things work, provide detailed information from the context
- If asked about predictions or dashboard, provide accurate information based on the context provided
- When asked about prediction history, use the prediction history data provided in the context
- You can answer questions like "how does the dashboard work?", "what is the prediction page?", "how do I upload a file?", "what pages are available?"
- Reference specific predictions by ID, date, or details when available in the history
- Explain step-by-step processes for using features (e.g., "how do I make a prediction?")
- Use simple, clear language - avoid overly technical jargon unless asked

GRAMMAR AND SENTENCE STRUCTURE:
- ALWAYS use proper grammatical sentences with correct subject-verb agreement
- Write complete sentences with proper capitalization and punctuation
- Each sentence must be grammatically correct and well-structured
- Use appropriate tenses (present, past, future) correctly
- Avoid sentence fragments - every point should be a complete, grammatical sentence
- Use proper punctuation: periods, commas, question marks, exclamation marks as needed
- Start each sentence with a capital letter

RESPONSE FORMATTING:
- Use emojis SPARINGLY and APPROPRIATELY (1-2 emojis per response, max 3 for longer responses)
  * Use 🚴 for bike-related topics
  * Use 📊 for dashboard/analytics
  * Use 🌦️ for weather
  * Use ✅ or 👍 for confirmations
  * Use 💡 for tips/insights
  * Use 😊 or 👋 for greetings
- Use proper punctuation: periods, commas, exclamation marks when appropriate
- Break into paragraphs when explaining multiple points (use line breaks)

POINT-WISE ANSWERS:
- ALWAYS use bullet points (• or -) or numbered lists when:
  * Listing multiple features, options, or steps
  * Explaining how to do something with multiple steps
  * Describing benefits, factors, or characteristics
  * Answering "what are" or "how to" questions
  * Providing tips, suggestions, or recommendations
  * Comparing different options or modes
  * Answering questions about prediction history or multiple predictions
- Format point-wise answers clearly with proper spacing between points
- Use emojis at the start of point-wise lists or key points when appropriate
- CRITICAL: Each point MUST be a complete, grammatical sentence with proper punctuation
- Keep each point concise (1-2 sentences max per point) but ensure they are complete sentences
- Use numbered lists (1., 2., 3.) for sequential steps - each step must be a full sentence
- Use bullet points (• or -) for non-sequential lists - each bullet must be a full sentence
- Start each point with a capital letter and end with proper punctuation (period, exclamation, etc.)
- Example format:
  • First point is a complete sentence with proper grammar and punctuation.
  • Second point is also a full sentence that explains another aspect clearly.
  • Each point should stand alone as a grammatical sentence while contributing to the overall answer.

RESPONSE STYLE EXAMPLES:
- Greetings: "Hi! 👋 How can I help you with RideWise today?"
- Features (point-wise with proper sentences): 
  "RideWise has several key features: 
  • 📊 Dashboard allows you to view real-time analytics and insights about bike demand patterns.
  • 🎯 Prediction feature enables you to forecast demand for both hourly and daily time periods.
  • 📁 Upload lets you make predictions from uploaded CSV or TXT files.
  • 💬 Chatbot provides instant help and answers to your questions anytime!"

- How-to (numbered with proper sentences):
  "To make a prediction, follow these steps:
  1. Navigate to the Prediction page from the main menu.
  2. Choose between hourly or daily prediction mode using the toggle.
  3. Enter weather conditions, temperature, humidity, and time details in the form.
  4. Click the 'Predict Demand' button to generate your forecast."

- Prediction history (point-wise with proper sentences):
  "Based on your prediction history:
  • Your last prediction was made on [date] for a [type] forecast, showing [demand] bikes.
  • You have made a total of [X] predictions, with [Y] hourly and [Z] daily predictions.
  • The average predicted demand across all your predictions is [value] bikes."

- Page/Feature questions (point-wise with proper sentences):
  "The Dashboard page includes several components:
  • Summary Cards display your latest prediction results including demand, weather impact, and peak status.
  • Demand Line Chart visualizes bike demand trends over time with interactive data points.
  • Weather Bar Chart shows the distribution of bike demand across different weather conditions.
  • Insights Panel provides analytical insights about bike-sharing usage patterns and trends.
  • The dashboard automatically refreshes every 10 seconds to show the latest data."

- How-to questions (point-wise with proper sentences):
  "To make a prediction from a file:
  1. Navigate to the Upload page from the main navigation menu.
  2. Click the file input and select a .txt file with key-value pairs (e.g., temp:25, hum:60).
  3. Choose the prediction mode: Auto-detect, Hourly, or Daily.
  4. Click the Upload and Predict button to process your file.
  5. The result will automatically redirect you to the Prediction page with the forecast displayed."

- IMPORTANT: Always ensure each point is a complete, grammatical sentence with proper punctuation.
- IMPORTANT: Use the comprehensive application context provided to answer ANY question about pages, features, or processes."""

# In-memory chat history
chat_history = []


def _get_fallback_response(user_msg_lower, context_info):
    """Generate fallback response when API quota is exceeded."""
    # Common greetings
    if any(greeting in user_msg_lower for greeting in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
        return "Hi! 👋 I'm RideWise Assistant. Unfortunately, I'm experiencing high demand right now, but I can still help you with basic information about RideWise!"
    
    # Questions about pages
    if 'dashboard' in user_msg_lower:
        return """The Dashboard page 📊 shows real-time bike-sharing demand analytics and insights.

• Summary Cards display your latest prediction results including predicted demand, weather impact, and peak status.
• Demand Line Chart visualizes bike demand trends over time with interactive data points.
• Weather Bar Chart shows the distribution of bike demand across different weather conditions.
• Insights Panel provides analytical insights about bike-sharing usage patterns and trends.
• The dashboard automatically refreshes every 10 seconds to show the latest data.

You can access it from the navigation menu or by going to /dashboard."""
    
    if 'prediction' in user_msg_lower and 'page' in user_msg_lower or 'how' in user_msg_lower and 'predict' in user_msg_lower:
        return """The Prediction page 🎯 allows you to make bike demand forecasts.

To make a prediction:
1. Navigate to the Prediction page from the main menu.
2. Choose between hourly or daily prediction mode using the toggle switch.
3. Fill in the required fields: date, season, hour (for hourly mode), weather, temperature, humidity, and working day status.
4. Click the 'Predict Demand' button to generate your forecast.
5. The predicted bike demand will be displayed below the form.

The page supports both hourly and daily prediction modes with different input requirements."""
    
    if 'upload' in user_msg_lower or 'file' in user_msg_lower:
        return """The Upload page 📁 enables file-based predictions.

To upload and predict:
1. Go to the Upload page from the navigation menu.
2. Click the file input and select a .txt file.
3. Your file should contain key-value pairs like 'temp:25', 'hum:60', 'weather:1'.
4. Choose the prediction mode: Auto-detect, Hourly, or Daily.
5. Click 'Upload and Predict' to process your file.
6. The result will redirect you to the Prediction page with the forecast displayed.

Accepted file format: .txt files with key:value pairs."""
    
    if 'chatbot' in user_msg_lower or 'chat' in user_msg_lower:
        return """The Chatbot page 💬 provides AI assistance for RideWise.

• You can ask questions about any page, feature, or process in the application.
• The chatbot has access to your prediction history and current application state.
• Simply type your question in the input field and click send or press Enter.
• The chatbot can help with navigation, feature explanations, and prediction information.

You're currently using the Chatbot page right now!"""
    
    if 'profile' in user_msg_lower:
        return """The Profile page 👤 displays your user information and project details.

• User Information section shows your name, email, and avatar.
• Project Details section provides information about the RideWise project.
• Reviews section displays user reviews and feedback.

You can access it from the navigation menu or by going to /profile."""
    
    if 'feature' in user_msg_lower or 'what can' in user_msg_lower:
        return """RideWise has several key features:

• 📊 Dashboard: Real-time analytics and insights visualization with charts and summary cards.
• 🎯 Prediction: Make hourly or daily bike demand forecasts using weather and temporal data.
• 📁 Upload: Predict bike demand from uploaded CSV or TXT files.
• 💬 Chatbot: Get instant help and answers about the application (you're using it now!).
• 👤 Profile: View your user information and project details.

All features are accessible from the main navigation menu."""
    
    if 'history' in user_msg_lower or 'past prediction' in user_msg_lower:
        # Try to get actual history from context
        if 'prediction history' in context_info.lower() or 'total of' in context_info.lower():
            # Extract history info from context
            lines = context_info.split('\n')
            history_lines = [l for l in lines if 'prediction history' in l.lower() or 'total of' in l.lower() or 'ID' in l]
            if history_lines:
                return f"Based on your prediction history:\n\n" + "\n".join(history_lines[:5])
        return "Your prediction history stores all predictions you've made. You can view it by asking about specific predictions or checking the dashboard for recent results."
    
    # Default fallback
    return """I'm currently experiencing high API demand, but I can still help!

Here's what I can tell you about RideWise:
• The app has Dashboard, Prediction, Upload, Chatbot, and Profile pages.
• You can make predictions using weather and time data.
• The Dashboard shows analytics and insights.
• File uploads are supported for batch predictions.

For more detailed answers, please try again in a few minutes when the API quota resets, or check the application pages directly."""


def _get_application_context():
    """Get comprehensive application state and information for chatbot context."""
    context_parts = []
    
    # ============================================================================
    # APPLICATION STRUCTURE AND PAGES
    # ============================================================================
    context_parts.append("=== RIDEWISE APPLICATION STRUCTURE ===")
    context_parts.append("\nPAGES AND NAVIGATION:")
    context_parts.append("• Login Page (/login): User authentication page where users log in with email and password.")
    context_parts.append("• Signup Page (/signup): Registration page for new users to create an account.")
    context_parts.append("• Dashboard (/dashboard): Main analytics page showing real-time bike-sharing demand insights.")
    context_parts.append("• Prediction Page (/prediction): Interactive form to make hourly or daily bike demand predictions.")
    context_parts.append("• Upload Page (/upload): File upload interface for making predictions from CSV or TXT files.")
    context_parts.append("• Chatbot Page (/chatbot): AI assistant page where users can ask questions about the application.")
    context_parts.append("• Profile Page (/profile): User profile page showing user information and project details.")
    context_parts.append("• Root (/): Automatically redirects to dashboard if authenticated, otherwise to login.")
    
    context_parts.append("\n=== DASHBOARD PAGE DETAILS ===")
    context_parts.append("The Dashboard page displays the following components:")
    context_parts.append("• Summary Cards: Show predicted demand, prediction type, weather impact, and peak status.")
    context_parts.append("• Demand Line Chart: Visualizes bike demand trends over time.")
    context_parts.append("• Weather Bar Chart: Shows distribution of bike demand by weather conditions.")
    context_parts.append("• Insights Panel: Provides analytical insights about bike-sharing patterns.")
    context_parts.append("• About Section: Explains what RideWise is and its features.")
    context_parts.append("• Recent Reviews: Displays recent user reviews and feedback.")
    context_parts.append("• Auto-refresh: Dashboard data refreshes every 10 seconds automatically.")
    context_parts.append("• Data Source: Fetches from /dashboard/summary API endpoint.")
    
    context_parts.append("\n=== PREDICTION PAGE DETAILS ===")
    context_parts.append("The Prediction page allows users to make bike demand forecasts:")
    context_parts.append("• Mode Toggle: Switch between Hourly and Daily prediction modes.")
    context_parts.append("• Input Fields: Date (dteday), Season (spring/summer/fall/winter), Hour (0-23 for hourly mode).")
    context_parts.append("• Weather Options: Clear, Cloudy, Light Rain, Heavy Rain.")
    context_parts.append("• Temperature: Input field for temperature value.")
    context_parts.append("• Humidity: Input field for humidity percentage.")
    context_parts.append("• Working Day: Yes/No toggle for working day status.")
    context_parts.append("• Predict Button: Submits form data to /predict/hour or /predict/day endpoint.")
    context_parts.append("• Result Display: Shows predicted bike demand value after successful prediction.")
    context_parts.append("• Validation: Form validates all required fields before submission.")
    context_parts.append("• Auto-fill: Can auto-populate from uploaded prediction data.")
    
    context_parts.append("\n=== UPLOAD PAGE DETAILS ===")
    context_parts.append("The Upload page enables file-based predictions:")
    context_parts.append("• File Selection: Accepts .txt files with key-value pair format.")
    context_parts.append("• Mode Selection: Auto-detect, Hourly, or Daily prediction mode.")
    context_parts.append("• File Format: TXT files with format 'key:value' pairs (e.g., 'temp:25', 'hum:60').")
    context_parts.append("• Accepted Keys: hour (or hr), humidity (or hum), weather (or weathersit), working_day, temperature, season, holiday.")
    context_parts.append("• Processing: File is sent to /upload-predict endpoint for processing.")
    context_parts.append("• Result: Prediction result is stored in localStorage and redirected to Prediction page.")
    context_parts.append("• Error Handling: Validates file type and provides error messages for invalid formats.")
    
    context_parts.append("\n=== CHATBOT PAGE DETAILS ===")
    context_parts.append("The Chatbot page provides AI assistance:")
    context_parts.append("• Chat Interface: Interactive chat window for user questions.")
    context_parts.append("• Message Input: Text input field with send button.")
    context_parts.append("• Message History: Displays conversation history with user and assistant messages.")
    context_parts.append("• API Endpoint: Communicates with /chat endpoint for responses.")
    context_parts.append("• Context Awareness: Chatbot has access to application state and prediction history.")
    
    context_parts.append("\n=== PROFILE PAGE DETAILS ===")
    context_parts.append("The Profile page shows user information:")
    context_parts.append("• User Information: Displays user name, email, and avatar.")
    context_parts.append("• Project Details: Shows information about the RideWise project.")
    context_parts.append("• Reviews Section: Displays user reviews and feedback.")
    
    context_parts.append("\n=== AUTHENTICATION SYSTEM ===")
    context_parts.append("• Protected Routes: Dashboard, Prediction, Upload, Chatbot, and Profile require authentication.")
    context_parts.append("• Authentication Context: Uses AuthContext for managing user session state.")
    context_parts.append("• Auto-redirect: Unauthenticated users are redirected to login page.")
    context_parts.append("• Session Management: User authentication state persists across page navigation.")
    
    # ============================================================================
    # CURRENT APPLICATION STATE
    # ============================================================================
    context_parts.append("\n=== CURRENT APPLICATION STATE ===")
    
    # Get last prediction data
    global last_prediction, prediction_history
    if last_prediction and last_prediction.get("predicted_demand") is not None:
        pred_type = last_prediction.get("prediction_type", "Unknown")
        demand = last_prediction.get("predicted_demand", "N/A")
        weather = last_prediction.get("weather_impact", "N/A")
        peak = last_prediction.get("peak_status", "N/A")
        timestamp = last_prediction.get("timestamp", "")
        
        context_parts.append(f"• Last Prediction: {pred_type} mode, predicted demand: {demand} bikes.")
        context_parts.append(f"• Weather Impact: {weather}, Peak Status: {peak}.")
        if timestamp:
            context_parts.append(f"• Prediction Timestamp: {timestamp}.")
    else:
        context_parts.append("• No predictions made yet.")
    
    # Prediction history (last 10 predictions for context)
    if prediction_history:
        context_parts.append(f"\n• Prediction History: Total of {len(prediction_history)} predictions made.")
        hourly_count = sum(1 for p in prediction_history if p.get('prediction_type') == 'Hourly')
        daily_count = sum(1 for p in prediction_history if p.get('prediction_type') == 'Daily')
        context_parts.append(f"• Breakdown: {hourly_count} hourly predictions, {daily_count} daily predictions.")
        
        if prediction_history:
            avg_demand = sum(p.get('predicted_demand', 0) for p in prediction_history) / len(prediction_history)
            context_parts.append(f"• Average Predicted Demand: {round(avg_demand, 2)} bikes.")
        
        context_parts.append("\nRecent Predictions (Last 10):")
        recent_predictions = prediction_history[-10:]  # Last 10 predictions
        for pred in recent_predictions:
            pred_str = f"  - ID {pred['id']}: {pred['prediction_type']} prediction"
            if pred['prediction_type'] == 'Hourly':
                pred_str += f" for hour {pred.get('hour', 'N/A')}"
            pred_str += f" on {pred.get('date', 'N/A')}"
            pred_str += f" - Predicted {pred['predicted_demand']} bikes"
            pred_str += f" (Weather: {pred.get('weather_impact', 'N/A')}, Peak: {pred.get('peak_status', 'N/A')})"
            context_parts.append(pred_str)
    else:
        context_parts.append("\n• No prediction history available yet.")
    
    # ============================================================================
    # TECHNICAL DETAILS
    # ============================================================================
    context_parts.append("\n=== TECHNICAL INFORMATION ===")
    context_parts.append(f"• Models Status: Day model {'loaded' if day_model else 'not loaded'}, Hour model {'loaded' if hour_model else 'not loaded'}.")
    context_parts.append(f"• Day Model Features: {len(day_expected_features)} expected features.")
    context_parts.append(f"• Hour Model Features: {len(hour_expected_features)} expected features.")
    
    context_parts.append("\n=== API ENDPOINTS AVAILABLE ===")
    context_parts.append("• GET /health: Health check and model status.")
    context_parts.append("• POST /predict/day: Make daily bike demand prediction.")
    context_parts.append("• POST /predict/hour: Make hourly bike demand prediction.")
    context_parts.append("• POST /upload-predict: Upload file for prediction.")
    context_parts.append("• GET /dashboard/summary: Get dashboard summary data.")
    context_parts.append("• POST /chat: Send message to chatbot.")
    context_parts.append("• GET /chat/status: Check chatbot availability.")
    context_parts.append("• POST /chat/reset: Reset chat history.")
    context_parts.append("• GET /predictions/history: Get prediction history.")
    context_parts.append("• POST /feedback: Submit user feedback.")
    context_parts.append("• GET /feedback: Get all feedback.")
    context_parts.append("• POST /api/reviews: Submit user review.")
    context_parts.append("• GET /api/reviews: Get user reviews.")
    
    context_parts.append("\n=== FEATURES SUMMARY ===")
    context_parts.append("• Real-time Dashboard: Analytics and insights visualization.")
    context_parts.append("• ML-Powered Predictions: Uses trained models for accurate forecasting.")
    context_parts.append("• Dual Prediction Modes: Hourly and daily prediction options.")
    context_parts.append("• Weather Integration: Considers temperature, humidity, and weather conditions.")
    context_parts.append("• File Upload: Support for CSV and TXT file predictions.")
    context_parts.append("• Prediction History: Stores and tracks all predictions made.")
    context_parts.append("• AI Chatbot: Interactive assistant with context awareness.")
    context_parts.append("• User Authentication: Secure login and session management.")
    context_parts.append("• Feedback System: Users can submit reviews and feedback.")
    
    return "\n".join(context_parts)

# Day model path
DAY_MODEL_FILE = os.path.join(MODEL_DIR, 'best_day_model.pkl')

# Hour model path
HOUR_MODEL_FILE = os.path.join(MODEL_DIR, 'best_hour_model.pkl')


def _safe_load_model(path):
    if not os.path.exists(path):
        return None
    try:
        return load(path)
    except Exception:
        traceback.print_exc()
        return None


def _load_day_model_and_features(path):
    model = _safe_load_model(path)
    if model is None:
        print(f"Warning: Model not found at {path}, skipping.")
        return None, []
    if not hasattr(model, 'feature_names_in_'):
        print(f"Warning: Model does not expose `feature_names_in_`, skipping.")
        return None, []
    features = list(model.feature_names_in_)
    return model, features


# Load day model at startup (source of truth: feature_names_in_)
print("Loading day model from:", DAY_MODEL_FILE)
day_model, day_expected_features = _load_day_model_and_features(DAY_MODEL_FILE)
if day_model:
    print(f"Day model loaded - expects {len(day_expected_features)} features")
else:
    print("Day model not loaded")

# Load hour model at startup
print("Loading hour model from:", HOUR_MODEL_FILE)
hour_model, hour_expected_features = _load_day_model_and_features(HOUR_MODEL_FILE)
if hour_model:
    print(f"Hour model loaded - expects {len(hour_expected_features)} features")
else:
    print("Hour model not loaded")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint - test backend connectivity."""
    return jsonify({
        'status': 'ok',
        'day_model_loaded': day_model is not None,
        'day_feature_count': len(day_expected_features),
        'hour_model_loaded': hour_model is not None,
        'hour_feature_count': len(hour_expected_features),
        'chatbot_available': model is not None
    }), 200


@app.route('/chat/status', methods=['GET'])
def chat_status():
    """Check if chatbot is available."""
    return jsonify({
        "available": model is not None,
        "message": "Chatbot is ready" if model is not None else "Chatbot is unavailable. Please configure GEMINI_API_KEY in backend/.env file."
    }), 200


@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Check if model is available
        if model is None:
            logger.error("Gemini model is not initialized. Check GEMINI_API_KEY.")
            return jsonify({
                "error": "Chatbot is unavailable. Please configure GEMINI_API_KEY in backend/.env file. Get your API key from: https://makersuite.google.com/app/apikey"
            }), 503

        user_msg = request.json.get("message")

        if not user_msg or not user_msg.strip():
            return jsonify({"error": "Message required"}), 400

        user_msg = user_msg.strip()
        user_msg_lower = user_msg.lower()

        # Get current application context for dynamic responses
        context_info = _get_application_context()
        
        # Build chat history for Gemini API
        # Gemini expects a list of message dicts with 'role' and 'parts'
        contents = []
        
        # Add previous chat history
        for msg in chat_history:
            contents.append(msg)
        
        # Build context-aware prompt
        context_prompt = ""
        if not chat_history:
            # First message - include full system prompt
            context_prompt = f"{SYSTEM_PROMPT}\n\n"
        
        # Include comprehensive context for ANY question about the application
        # This ensures chatbot can answer questions about any page, feature, or process
        application_keywords = [
            'dashboard', 'prediction', 'predict', 'upload', 'file', 'chatbot', 'profile', 'login', 'signup',
            'page', 'pages', 'feature', 'features', 'how', 'what', 'where', 'when', 'which', 'why',
            'data', 'statistics', 'analytics', 'current', 'latest', 'recent', 'show', 'tell', 'explain',
            'history', 'past', 'previous', 'list', 'all', 'navigation', 'menu', 'route', 'endpoint',
            'form', 'input', 'button', 'chart', 'graph', 'summary', 'insight', 'review', 'feedback',
            'authenticate', 'login', 'logout', 'session', 'user', 'account', 'mode', 'hourly', 'daily',
            'weather', 'temperature', 'humidity', 'season', 'working', 'holiday', 'step', 'process',
            'work', 'does', 'function', 'help', 'guide', 'tutorial', 'instruction', 'available'
        ]
        
        # Always include context for questions - gives chatbot full application knowledge
        # Only skip on simple greetings to save tokens
        if not any(greeting in user_msg_lower for greeting in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
            context_prompt += f"\nCOMPREHENSIVE APPLICATION INFORMATION:\n{context_info}\n\n"
        elif any(keyword in user_msg_lower for keyword in application_keywords):
            context_prompt += f"\nCOMPREHENSIVE APPLICATION INFORMATION:\n{context_info}\n\n"
        
        # Add current user message
        if context_prompt:
            contents.append({"role": "user", "parts": [f"{context_prompt}User: {user_msg}"]})
        else:
            contents.append({"role": "user", "parts": [user_msg]})

        # Call Gemini API
        try:
            response = model.generate_content(contents)
            
            # Extract text from response
            if hasattr(response, 'text'):
                bot_reply = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                if hasattr(response.candidates[0].content, 'parts'):
                    bot_reply = response.candidates[0].content.parts[0].text
                else:
                    bot_reply = str(response.candidates[0].content)
            else:
                bot_reply = "Sorry, I couldn't generate a response. Please try again."
            
            # Save to history (only save the actual user message and response, not system prompt)
            # Use original user message (not lowercase version)
            chat_history.append({"role": "user", "parts": [user_msg]})
            chat_history.append({"role": "model", "parts": [bot_reply]})
            
            logger.info("Chat response generated successfully")
            return jsonify({"reply": bot_reply})
            
        except Exception as api_error:
            logger.exception(f"Gemini API call failed: {api_error}")
            error_msg = str(api_error)
            # Provide more helpful error messages
            if "API_KEY" in error_msg or "api key" in error_msg.lower():
                return jsonify({
                    "error": "API key is invalid or missing. Please check your configuration."
                }), 503
            elif "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
                # Try fallback response for common questions
                try:
                    fallback_response = _get_fallback_response(user_msg_lower, context_info)
                    logger.info("Using fallback response due to API quota exceeded")
                    # Save fallback response to history
                    chat_history.append({"role": "user", "parts": [user_msg]})
                    chat_history.append({"role": "model", "parts": [fallback_response]})
                    return jsonify({"reply": fallback_response})
                except Exception as fallback_error:
                    logger.exception(f"Fallback response failed: {fallback_error}")
                    return jsonify({
                        "error": "API quota exceeded. The chatbot is experiencing high demand. Please try again in a few minutes. In the meantime, you can explore the Dashboard, Prediction, and Upload pages directly."
                    }), 429
            else:
                return jsonify({
                    "error": f"Failed to get response: {error_msg}"
                }), 500

    except Exception as e:
        logger.exception(f"Chat endpoint error: {e}")
        return jsonify({
            "error": "Chatbot is temporarily unavailable. Please try again later."
        }), 500


@app.route('/chat/reset', methods=['POST'])
def reset_chat():
    """Reset chat history endpoint."""
    try:
        global chat_history
        chat_history = []
        logger.info("Chat history reset")
        return jsonify({"status": "success", "message": "Chat history cleared"}), 200
    except Exception as e:
        logger.exception(f"Reset chat error: {e}")
        return jsonify({"error": "Failed to reset chat history"}), 500


@app.route('/predictions/history', methods=['GET'])
def get_prediction_history():
    """Get prediction history endpoint."""
    try:
        global prediction_history
        # Get query parameters for filtering
        limit = request.args.get('limit', type=int)
        pred_type = request.args.get('type')  # 'Hourly' or 'Daily'
        
        history = prediction_history.copy()
        
        # Filter by type if specified
        if pred_type:
            history = [p for p in history if p.get('prediction_type') == pred_type]
        
        # Reverse to show most recent first
        history.reverse()
        
        # Apply limit if specified
        if limit and limit > 0:
            history = history[:limit]
        
        return jsonify({
            "total": len(prediction_history),
            "returned": len(history),
            "predictions": history
        }), 200
    except Exception as e:
        logger.exception(f"Get prediction history error: {e}")
        return jsonify({"error": "Failed to retrieve prediction history"}), 500


# Allowed UI inputs (exactly these 8)
DAY_UI_FIELDS = ['dteday', 'season', 'holiday', 'workingday', 'weathersit', 'temp', 'atemp', 'hum']


@app.route('/predict/day', methods=['POST', 'OPTIONS'])
def predict_day():
    """
    Day-level prediction endpoint.

    Strict behavior:
    - Accept only the 8 UI inputs listed in `DAY_UI_FIELDS`.
    - Compute date-derived features (yr, mnth, weekday, quarter, is_weekend).
    - Compute cyclical features for month and weekday.
    - Compute derived features: is_peak_season, temp_humidity, temp_windspeed (0), weather_severity.
    - Remove raw `dteday` and reindex strictly to `day_expected_features`.
    - Return JSON: { "prediction": value }
    """
    if request.method == 'OPTIONS':
        return '', 204

    try:
        payload = request.get_json(force=True)
        print("\n[/predict/day] Received payload:", payload)

        if not payload:
            return jsonify({'error': 'No JSON body provided'}), 400

        # Enforce UI inputs only
        inputs = {k: payload.get(k) for k in DAY_UI_FIELDS}

        # Verify required fields present (treat empty string as missing)
        missing = [k for k, v in inputs.items() if v is None or (isinstance(v, str) and v.strip() == "")] 
        if missing:
            return jsonify({'error': f'Missing required inputs: {missing}'}), 400

        # Store values needed for dashboard update
        weathersit_val = inputs.get('weathersit', '1')
        
        # Build DataFrame from inputs
        df = pd.DataFrame([inputs])

        # Parse and derive date features
        try:
            dt = pd.to_datetime(df.at[0, 'dteday'])
        except Exception as e:
            return jsonify({'error': f'Invalid dteday format: {e}'}), 400

        # Mandatory date-derived features
        df['yr'] = dt.year
        df['mnth'] = dt.month
        df['weekday'] = dt.weekday()
        df['quarter'] = (dt.month - 1) // 3 + 1
        df['is_weekend'] = 1 if df.at[0, 'weekday'] >= 5 else 0

        # Cyclical encodings (day model expects these if present in feature list)
        df['mnth_sin'] = np.sin(2 * np.pi * df['mnth'] / 12)
        df['mnth_cos'] = np.cos(2 * np.pi * df['mnth'] / 12)
        df['weekday_sin'] = np.sin(2 * np.pi * df['weekday'] / 7)
        df['weekday_cos'] = np.cos(2 * np.pi * df['weekday'] / 7)

        # Derived features
        df['is_peak_season'] = 1 if int(df.at[0, 'mnth']) in (6, 7, 8) else 0
        # temp_humidity (temp * hum)
        df['temp_humidity'] = pd.to_numeric(df['temp'], errors='coerce') * pd.to_numeric(df['hum'], errors='coerce')
        # temp_windspeed: not provided in day UI, set to 0 as required
        df['temp_windspeed'] = 0
        # weather_severity mirrors weathersit
        df['weather_severity'] = df['weathersit']

        # Remove raw dteday before prediction
        df = df.drop(columns=['dteday'])

        # Ensure numeric columns are properly typed
        numeric_cols = ['season', 'holiday', 'workingday', 'weathersit', 'temp', 'atemp', 'hum',
                        'yr', 'mnth', 'weekday', 'quarter', 'is_weekend',
                        'mnth_sin', 'mnth_cos', 'weekday_sin', 'weekday_cos',
                        'is_peak_season', 'temp_humidity', 'temp_windspeed', 'weather_severity']
        for c in numeric_cols:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)

        # Reindex strictly to expected features (only source of truth)
        df_reindexed = df.reindex(columns=day_expected_features, fill_value=0)

        if len(df_reindexed.columns) != len(day_expected_features):
            return jsonify({'error': f'Feature alignment error: prepared {len(df_reindexed.columns)} features, expected {len(day_expected_features)}'}), 500

        # Prediction
        try:
            X = df_reindexed.values
            preds = day_model.predict(X)
            pred_value = float(preds[0])
            pred_value = max(0.0, pred_value)
            print(f"[/predict/day] Prediction: {pred_value}")
            
            # Update dashboard summary (in-memory)
            from datetime import datetime
            global last_prediction, prediction_history
            
            timestamp = datetime.now()
            prediction_entry = {
                "id": len(prediction_history) + 1,
                "predicted_demand": round(pred_value, 2),
                "prediction_type": "Daily",
                "date": inputs.get('dteday', 'N/A'),
                "season": inputs.get('season', 'N/A'),
                "weathersit": weathersit_val,
                "weather_impact": _calculate_weather_impact(weathersit_val),
                "temp": inputs.get('temp', 'N/A'),
                "hum": inputs.get('hum', 'N/A'),
                "workingday": inputs.get('workingday', 'N/A'),
                "holiday": inputs.get('holiday', 'N/A'),
                "peak_status": _calculate_peak_status(demand=int(pred_value)),
                "timestamp": timestamp.isoformat(),
                "date_readable": timestamp.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            last_prediction = {
                "predicted_demand": round(pred_value, 2),
                "prediction_type": "Daily",
                "weather_impact": prediction_entry["weather_impact"],
                "peak_status": prediction_entry["peak_status"],
                "timestamp": timestamp.isoformat()
            }
            
            # Add to prediction history
            prediction_history.append(prediction_entry)
            # Keep only last 100 predictions to avoid memory issues
            if len(prediction_history) > 100:
                prediction_history.pop(0)
            
            return jsonify({'prediction': round(pred_value, 2)}), 200
        except Exception as e:
            print(f"[/predict/day] Model prediction error: {e}")
            traceback.print_exc()
            return jsonify({'error': f'Prediction failed: {e}'}), 500

    except Exception as e:
        print(f"[/predict/day] Unexpected error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500



# Allowed UI inputs for HOUR model (no windspeed - derived by backend)
HOUR_UI_FIELDS = ['dteday', 'hr', 'season', 'holiday', 'workingday', 'weathersit', 'temp', 'atemp', 'hum']


@app.route('/predict/hour', methods=['POST', 'OPTIONS'])
def predict_hour():
    """
    Hour-level prediction endpoint.

    Strict behavior:
    - Accept only the 10 UI inputs listed in `HOUR_UI_FIELDS`.
    - Compute date-derived features (yr, mnth, weekday, quarter, is_weekend) from dteday.
    - Compute cyclical features for month, weekday, and hour if expected by model.
    - Compute derived features: is_peak_season, temp_humidity, temp_windspeed, weather_severity.
    - Remove raw `dteday` and reindex strictly to `hour_expected_features`.
    - Return JSON: { "prediction": value }
    """
    if request.method == 'OPTIONS':
        return '', 204

    try:
        payload = request.get_json(force=True)
        print("\n[/predict/hour] Received payload:", payload)

        if not payload:
            return jsonify({'error': 'No JSON body provided'}), 400

        # Enforce UI inputs only
        inputs = {k: payload.get(k) for k in HOUR_UI_FIELDS}

        # Verify required fields present (treat empty string as missing)
        missing = [k for k, v in inputs.items() if v is None or (isinstance(v, str) and v.strip() == "")] 
        if missing:
            return jsonify({'error': f'Missing required inputs: {missing}'}), 400

        # Store values needed for dashboard update
        weathersit_val = inputs.get('weathersit', '1')
        hr_val = int(inputs.get('hr', 0))
        
        # Build DataFrame from inputs
        df = pd.DataFrame([inputs])

        # Parse and derive date features
        try:
            dt = pd.to_datetime(df.at[0, 'dteday'])
        except Exception as e:
            return jsonify({'error': f'Invalid dteday format: {e}'}), 400

        # Mandatory date-derived features
        df['yr'] = dt.year
        df['mnth'] = dt.month
        df['weekday'] = dt.weekday()
        df['quarter'] = (dt.month - 1) // 3 + 1
        df['is_weekend'] = 1 if df.at[0, 'weekday'] >= 5 else 0

        # Cyclical encodings for hour model
        df['mnth_sin'] = np.sin(2 * np.pi * df['mnth'] / 12)
        df['mnth_cos'] = np.cos(2 * np.pi * df['mnth'] / 12)
        df['weekday_sin'] = np.sin(2 * np.pi * df['weekday'] / 7)
        df['weekday_cos'] = np.cos(2 * np.pi * df['weekday'] / 7)
        
        # Hour cyclical encoding (if expected by model)
        hr_numeric = pd.to_numeric(df['hr'], errors='coerce').fillna(0).astype(int)
        df['hr_sin'] = np.sin(2 * np.pi * hr_numeric / 24)
        df['hr_cos'] = np.cos(2 * np.pi * hr_numeric / 24)

        # Derived features
        df['is_peak_season'] = 1 if int(df.at[0, 'mnth']) in (6, 7, 8) else 0
        # temp_humidity (temp * hum)
        df['temp_humidity'] = pd.to_numeric(df['temp'], errors='coerce') * pd.to_numeric(df['hum'], errors='coerce')
        # temp_windspeed: not provided in hour UI, set to 0 as required
        df['windspeed'] = 0
        df['temp_windspeed'] = pd.to_numeric(df['temp'], errors='coerce') * 0
        # weather_severity mirrors weathersit
        df['weather_severity'] = df['weathersit']

        # Remove raw dteday before prediction
        df = df.drop(columns=['dteday'])

        # Ensure numeric columns are properly typed
        numeric_cols = ['season', 'holiday', 'workingday', 'weathersit', 'temp', 'atemp', 'hum', 'windspeed', 'hr',
                        'yr', 'mnth', 'weekday', 'quarter', 'is_weekend',
                        'mnth_sin', 'mnth_cos', 'weekday_sin', 'weekday_cos', 'hr_sin', 'hr_cos',
                        'is_peak_season', 'temp_humidity', 'temp_windspeed', 'weather_severity']
        for c in numeric_cols:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)

        # Reindex strictly to expected features (only source of truth)
        df_reindexed = df.reindex(columns=hour_expected_features, fill_value=0)

        if len(df_reindexed.columns) != len(hour_expected_features):
            return jsonify({'error': f'Feature alignment error: prepared {len(df_reindexed.columns)} features, expected {len(hour_expected_features)}'}), 500

        # Prediction
        try:
            X = df_reindexed.values
            preds = hour_model.predict(X)
            pred_value = float(preds[0])
            pred_value = max(0.0, pred_value)
            print(f"[/predict/hour] Prediction: {pred_value}")
            
            # Update dashboard summary (in-memory)
            from datetime import datetime
            global last_prediction, prediction_history
            
            timestamp = datetime.now()
            prediction_entry = {
                "id": len(prediction_history) + 1,
                "predicted_demand": round(pred_value, 2),
                "prediction_type": "Hourly",
                "date": inputs.get('dteday', 'N/A'),
                "hour": hr_val,
                "season": inputs.get('season', 'N/A'),
                "weathersit": weathersit_val,
                "weather_impact": _calculate_weather_impact(weathersit_val),
                "temp": inputs.get('temp', 'N/A'),
                "hum": inputs.get('hum', 'N/A'),
                "workingday": inputs.get('workingday', 'N/A'),
                "holiday": inputs.get('holiday', 'N/A'),
                "peak_status": _calculate_peak_status(hour=hr_val, demand=int(pred_value)),
                "timestamp": timestamp.isoformat(),
                "date_readable": timestamp.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            last_prediction = {
                "predicted_demand": round(pred_value, 2),
                "prediction_type": "Hourly",
                "weather_impact": prediction_entry["weather_impact"],
                "peak_status": prediction_entry["peak_status"],
                "timestamp": timestamp.isoformat()
            }
            
            # Add to prediction history
            prediction_history.append(prediction_entry)
            # Keep only last 100 predictions to avoid memory issues
            if len(prediction_history) > 100:
                prediction_history.pop(0)
            
            return jsonify({'prediction': round(pred_value, 2)}), 200
        except Exception as e:
            print(f"[/predict/hour] Model prediction error: {e}")
            traceback.print_exc()
            return jsonify({'error': f'Prediction failed: {e}'}), 500

    except Exception as e:
        print(f"[/predict/hour] Unexpected error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/predict/upload', methods=['POST'])
def predict_upload():
    """
    POST endpoint for file upload prediction.
    
    Accepts multipart/form-data with 'file' field.
    Supports .csv files with weather data.
    Uses first row for prediction.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension
        if not file.filename.lower().endswith(('.csv', '.txt')):
            return jsonify({'error': 'Invalid file type. Only .csv and .txt files are supported'}), 400
        
        if file.filename.lower().endswith('.txt'):
            return jsonify({'error': 'TXT format supported only for structured key:value data'}), 400
        
        # Read CSV file
        try:
            df = pd.read_csv(file)
            if df.empty:
                return jsonify({'error': 'CSV file is empty'}), 400
            
            # Use only first row
            row = df.iloc[0]
            
            # Extract required columns
            required_cols = ['temp', 'hum', 'weathersit', 'workingday']
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                return jsonify({'error': f'Missing required columns: {missing_cols}'}), 400
            
            # Build inputs dict
            inputs = {
                'dteday': '2024-01-01',  # Dummy date
                'season': 1,  # Default season
                'holiday': 0,  # Default
                'workingday': int(row['workingday']),
                'weathersit': int(row['weathersit']),
                'temp': float(row['temp']),
                'atemp': float(row['temp']),  # Use temp if atemp not available
                'hum': float(row['hum'])
            }
            
            # Optional windspeed
            if 'windspeed' in df.columns:
                inputs['windspeed'] = float(row['windspeed'])
            
        except Exception as e:
            return jsonify({'error': f'Error parsing CSV file: {str(e)}'}), 400
        
        # Build DataFrame from inputs
        df_pred = pd.DataFrame([inputs])
        
        # Parse and derive date features
        try:
            dt = pd.to_datetime(df_pred.at[0, 'dteday'])
        except Exception as e:
            return jsonify({'error': f'Invalid dteday format: {e}'}), 400
        
        # Mandatory date-derived features
        df_pred['yr'] = dt.year
        df_pred['mnth'] = dt.month
        df_pred['weekday'] = dt.weekday()
        df_pred['quarter'] = (dt.month - 1) // 3 + 1
        df_pred['is_weekend'] = 1 if df_pred.at[0, 'weekday'] >= 5 else 0
        
        # Cyclical encodings
        df_pred['mnth_sin'] = np.sin(2 * np.pi * df_pred['mnth'] / 12)
        df_pred['mnth_cos'] = np.cos(2 * np.pi * df_pred['mnth'] / 12)
        df_pred['weekday_sin'] = np.sin(2 * np.pi * df_pred['weekday'] / 7)
        df_pred['weekday_cos'] = np.cos(2 * np.pi * df_pred['weekday'] / 7)
        
        # Derived features
        df_pred['is_peak_season'] = 1 if int(df_pred.at[0, 'mnth']) in (6, 7, 8) else 0
        df_pred['temp_humidity'] = pd.to_numeric(df_pred['temp'], errors='coerce') * pd.to_numeric(df_pred['hum'], errors='coerce')
        df_pred['temp_windspeed'] = 0  # Set to 0 as per day model requirements
        df_pred['weather_severity'] = df_pred['weathersit']
        
        # Remove raw dteday before prediction
        df_pred = df_pred.drop(columns=['dteday'])
        
        # Ensure numeric columns are properly typed
        numeric_cols = ['season', 'holiday', 'workingday', 'weathersit', 'temp', 'atemp', 'hum',
                        'yr', 'mnth', 'weekday', 'quarter', 'is_weekend',
                        'mnth_sin', 'mnth_cos', 'weekday_sin', 'weekday_cos',
                        'is_peak_season', 'temp_humidity', 'temp_windspeed', 'weather_severity']
        for c in numeric_cols:
            if c in df_pred.columns:
                df_pred[c] = pd.to_numeric(df_pred[c], errors='coerce').fillna(0)
        
        # Reindex strictly to expected features
        df_reindexed = df_pred.reindex(columns=day_expected_features, fill_value=0)
        
        if len(df_reindexed.columns) != len(day_expected_features):
            return jsonify({'error': f'Feature alignment error: prepared {len(df_reindexed.columns)} features, expected {len(day_expected_features)}'}), 500
        
        # Prediction
        try:
            X = df_reindexed.values
            preds = day_model.predict(X)
            pred_value = float(preds[0])
            pred_value = max(0.0, pred_value)
            
            return jsonify({
                'predicted_demand': round(pred_value, 2),
                'source': 'file_upload'
            }), 200
        except Exception as e:
            print(f"[/predict/upload] Model prediction error: {e}")
            traceback.print_exc()
            return jsonify({'error': f'Prediction failed: {e}'}), 500
    
    except Exception as e:
        print(f"[/predict/upload] Unexpected error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/upload-predict', methods=['POST'])
def predict_from_file():
    if request.method == 'OPTIONS':
        return '', 204
    """
    POST endpoint for TXT file upload prediction with mode selection.
    
    Accepts multipart/form-data with 'file' (TXT only) and 'mode' ("hour" or "day").
    Parses key:value pairs from TXT file.
    Auto-fills missing features with 0.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension (TXT only)
        if not file.filename.lower().endswith('.txt'):
            return jsonify({'error': 'Invalid file type. Only .txt files are supported'}), 400
        
        # Get mode from form data, default to auto
        mode_param = request.form.get('mode', 'auto')
        if mode_param not in ['auto', 'hour', 'day']:
            return jsonify({'error': 'Invalid mode. Must be auto, hour, or day'}), 400
        
        # Parse TXT file
        try:
            content = file.read().decode('utf-8')
            lines = content.strip().split('\n')
            
            # Key mapping for user-friendly names to model feature names
            key_mapping = {
                'hour': 'hr',
                'humidity': 'hum',
                'weather': 'weathersit',
                'working_day': 'workingday',
                'temperature': 'temp',
                'season': 'season',
                'holiday': 'holiday',
                'workingday': 'workingday',
                'windspeed': 'windspeed',
                'atemp': 'atemp'
            }
            
            parsed_inputs = {}
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if ':' not in line:
                    return jsonify({'error': 'Invalid TXT format. Use key:value pairs only.'}), 400
                key, value = line.split(':', 1)
                key = key.strip().lower()  # Normalize to lowercase
                value = value.strip()
                
                # Map user-friendly keys to model keys
                key = key_mapping.get(key, key)
                
                try:
                    # Try to convert to float, then int if it's a whole number
                    num_value = float(value)
                    if num_value == int(num_value):
                        num_value = int(num_value)
                    parsed_inputs[key] = num_value
                except ValueError:
                    return jsonify({'error': 'Invalid TXT format. Values must be numeric.'}), 400
            
            if not parsed_inputs:
                return jsonify({'error': 'TXT file is empty or contains no valid key:value pairs'}), 400
            
            # Determine mode
            if mode_param == 'auto':
                mode = 'hour' if 'hr' in parsed_inputs else 'day'
            else:
                mode = mode_param
                if mode == 'hour' and 'hr' not in parsed_inputs:
                    return jsonify({'error': 'Hourly mode selected but no hour (hr) provided in file'}), 400
                if mode == 'day' and 'hr' in parsed_inputs:
                    # Remove hr if present for day mode
                    parsed_inputs.pop('hr', None)
            
            # Validate required features based on mode
            required_keys = ['temp', 'hum', 'weathersit']
            if mode == 'hour':
                required_keys.append('hr')
            
            missing_keys = [k for k in required_keys if k not in parsed_inputs]
            if missing_keys:
                return jsonify({'error': f'Missing required features for {mode} prediction: {missing_keys}'}), 400
                
        except Exception as e:
            return jsonify({'error': f'Error parsing TXT file: {str(e)}'}), 400
        
        # Select model and features based on mode
        if mode == 'hour':
            model = hour_model
            expected_features = hour_expected_features
        else:  # day
            model = day_model
            expected_features = day_expected_features
        
        if model is None:
            return jsonify({'error': f'{mode.capitalize()} model not loaded'}), 500
        
        # Create DataFrame with parsed inputs
        df = pd.DataFrame([parsed_inputs])
        
        # Assume default date for derived features (summer day)
        dt = pd.to_datetime('2024-06-15')  # June 15, 2024 (Saturday)
        
        # Mandatory date-derived features
        df['yr'] = dt.year
        df['mnth'] = dt.month
        df['weekday'] = dt.weekday()
        df['quarter'] = (dt.month - 1) // 3 + 1
        df['is_weekend'] = 1 if df.at[0, 'weekday'] >= 5 else 0
        
        # Cyclical encodings
        df['mnth_sin'] = np.sin(2 * np.pi * df['mnth'] / 12)
        df['mnth_cos'] = np.cos(2 * np.pi * df['mnth'] / 12)
        df['weekday_sin'] = np.sin(2 * np.pi * df['weekday'] / 7)
        df['weekday_cos'] = np.cos(2 * np.pi * df['weekday'] / 7)
        
        # Derived features
        df['is_peak_season'] = 1 if int(df.at[0, 'mnth']) in (6, 7, 8) else 0
        df['temp_humidity'] = pd.to_numeric(df['temp'], errors='coerce') * pd.to_numeric(df['hum'], errors='coerce')
        df['weather_severity'] = df['weathersit']
        
        if mode == 'hour':
            # Hour cyclical encoding
            hr_numeric = pd.to_numeric(df['hr'], errors='coerce').fillna(12)
            df['hr_sin'] = np.sin(2 * np.pi * hr_numeric / 24)
            df['hr_cos'] = np.cos(2 * np.pi * hr_numeric / 24)
            df['windspeed'] = 0
            df['temp_windspeed'] = pd.to_numeric(df['temp'], errors='coerce') * 0
        else:
            # For day mode, remove 'hr' if present
            if 'hr' in df.columns:
                df = df.drop(columns=['hr'])
            df['temp_windspeed'] = 0
        
        # Ensure numeric columns are properly typed
        numeric_cols = [col for col in df.columns if col in expected_features]
        for c in numeric_cols:
            df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0)
        
        # Reindex to expected features, fill missing with 0
        df_reindexed = df.reindex(columns=expected_features, fill_value=0)
        
        if len(df_reindexed.columns) != len(expected_features):
            return jsonify({'error': 'Feature alignment error'}), 500
        
        # Prediction
        try:
            X = df_reindexed.values
            preds = model.predict(X)
            pred_value = float(preds[0])
            pred_value = max(0.0, pred_value)
            
            return jsonify({
                'mode': mode,
                'parsed_inputs': parsed_inputs,
                'prediction': round(pred_value, 2)
            }), 200
        except Exception as e:
            print(f"[/predict/from-file] Model prediction error: {e}")
            traceback.print_exc()
            return jsonify({'error': f'Prediction failed: {e}'}), 500
    
    except Exception as e:
        print(f"[/predict/from-file] Unexpected error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================================
# IN-MEMORY STORAGE: Dashboard Summary & Feedback
# ============================================================================

# Track last prediction for dynamic dashboard
last_prediction = {
    "predicted_demand": None,
    "prediction_type": None,
    "weather_impact": None,
    "peak_status": None,
    "timestamp": None
}

# Store prediction history with full details
prediction_history = []

# Store user feedback (in-memory list)
feedback_list = []

# Store user reviews (in-memory dict: user_email -> list of reviews)
reviews_db = {}


def _calculate_weather_impact(weathersit: str) -> str:
    """Calculate weather impact level based on weather situation code."""
    try:
        code = int(weathersit)
        if code == 1:
            return "Low"      # Clear / Sunny
        elif code == 2:
            return "Medium"   # Cloudy / Misty
        elif code == 3:
            return "High"     # Light Rain / Snow
        else:
            return "High"     # Heavy Rain / Storm
    except:
        return "Medium"


def _calculate_peak_status(hour: int = None, demand: int = None) -> str:
    """Calculate peak status based on hour and demand level."""
    if demand is None:
        return "Normal"
    
    # Peak hours: 7-9 AM, 4-7 PM (high demand typical)
    peak_hours = [7, 8, 9, 16, 17, 18, 19]
    
    if demand > 400:
        return "Peak"
    elif demand > 200:
        return "Normal"
    else:
        return "Off-Peak"


@app.route('/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    """
    GET endpoint to retrieve the last prediction summary for dashboard.
    
    Returns:
    {
        "predicted_demand": number or null,
        "prediction_type": "Hourly" or "Daily" or null,
        "weather_impact": "Low" | "Medium" | "High" or null,
        "peak_status": "Peak" | "Normal" | "Off-Peak" or null,
        "timestamp": ISO string or null
    }
    """
    return jsonify(last_prediction), 200


@app.route('/feedback', methods=['POST', 'OPTIONS'])
def submit_feedback():
    """
    POST endpoint to submit user feedback.
    
    Request body:
    {
        "rating": 1-5,
        "comment": "feedback text"
    }
    
    Returns:
    {
        "status": "success"
    }
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        payload = request.get_json(force=True)
        
        if not payload:
            return jsonify({'error': 'No JSON body provided'}), 400
        
        # Validate required fields
        rating = payload.get('rating')
        comment = payload.get('comment', '').strip()
        
        if rating is None or not comment:
            return jsonify({'error': 'Missing rating or comment'}), 400
        
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Rating must be an integer'}), 400
        
        # Store feedback with timestamp
        from datetime import datetime
        feedback_entry = {
            'rating': rating,
            'comment': comment,
            'timestamp': datetime.now().isoformat()
        }
        
        feedback_list.append(feedback_entry)
        print(f"[Feedback] Received: {rating}★ - {comment[:50]}...")
        
        return jsonify({'status': 'success'}), 201
    
    except Exception as e:
        print(f"[Feedback] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/feedback', methods=['GET'])
def get_feedback():
    """
    GET endpoint to retrieve all feedback entries.
    
    Returns:
    {
        "feedback": [
            { "rating": 5, "comment": "...", "timestamp": "..." },
            ...
        ]
    }
    """
    return jsonify({'feedback': feedback_list}), 200


@app.route('/api/reviews', methods=['POST', 'OPTIONS'])
def submit_review():
    """
    POST endpoint to submit user review.
    
    Request body:
    {
        "user_email": "user@example.com",
        "rating": 1-5,
        "comment": "review text"
    }
    
    Returns:
    {
        "status": "success",
        "review_id": 123
    }
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        payload = request.get_json(force=True)
        
        if not payload:
            return jsonify({'error': 'No JSON body provided'}), 400
        
        # Validate required fields
        user_email = payload.get('user_email', '').strip()
        rating = payload.get('rating')
        comment = payload.get('comment', '').strip()
        
        if not user_email or rating is None or not comment:
            return jsonify({'error': 'Missing user_email, rating, or comment'}), 400
        
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Rating must be an integer'}), 400
        
        # Initialize user reviews if not exists
        if user_email not in reviews_db:
            reviews_db[user_email] = []
        
        # Generate review ID
        review_id = len(reviews_db[user_email]) + 1
        
        # Store review with timestamp
        from datetime import datetime
        review_entry = {
            'id': review_id,
            'rating': rating,
            'comment': comment,
            'timestamp': datetime.now().isoformat()
        }
        
        reviews_db[user_email].append(review_entry)
        print(f"[Review] Received from {user_email}: {rating}★ - {comment[:50]}...")
        
        return jsonify({'status': 'success', 'review_id': review_id}), 201
    
    except Exception as e:
        print(f"[Review] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    """
    GET endpoint to retrieve user reviews.
    
    Query params:
    - user_email: string
    
    Returns:
    {
        "reviews": [
            { "id": 1, "rating": 5, "comment": "...", "timestamp": "..." },
            ...
        ]
    }
    """
    try:
        user_email = request.args.get('user_email', '').strip()
        if not user_email:
            return jsonify({'error': 'user_email query parameter required'}), 400
        
        user_reviews = reviews_db.get(user_email, [])
        return jsonify({'reviews': user_reviews}), 200
    
    except Exception as e:
        print(f"[Review] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/reviews/all', methods=['GET'])
def get_all_reviews():
    """
    GET endpoint to retrieve all reviews from all users.
    
    Returns:
    {
        "reviews": [
            { "user_email": "...", "id": 1, "rating": 5, "comment": "...", "timestamp": "..." },
            ...
        ]
    }
    """
    try:
        all_reviews = []
        for user_email, user_reviews in reviews_db.items():
            for review in user_reviews:
                all_reviews.append({
                    "user_email": user_email,
                    "id": review["id"],
                    "rating": review["rating"],
                    "comment": review["comment"],
                    "timestamp": review["timestamp"]
                })
        
        # Sort by timestamp descending (latest first)
        all_reviews.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return jsonify({'reviews': all_reviews}), 200
    
    except Exception as e:
        print(f"[Review] Error: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n{'='*60}")
    print("RideWise Backend Server Starting")
    print(f"{'='*60}")
    print(f"Server: http://0.0.0.0:{port}")
    print(f"Health: GET http://localhost:{port}/health")
    print(f"Daily Predict: POST http://localhost:{port}/predict/day")
    print(f"Hour Predict: POST http://localhost:{port}/predict/hour")
    print(f"Dashboard: GET http://localhost:{port}/dashboard/summary")
    print(f"Chatbot: POST http://localhost:{port}/chat")
    print(f"Chatbot Status: GET http://localhost:{port}/chat/status")
    print(f"Feedback: POST http://localhost:{port}/feedback")
    print(f"Reviews: POST/GET http://localhost:{port}/api/reviews")
    print(f"All Reviews: GET http://localhost:{port}/api/reviews/all")
    if model is None:
        print(f"\n⚠️  WARNING: Chatbot is unavailable - GEMINI_API_KEY not configured")
        print(f"   See CHATBOT_SETUP.md for setup instructions")
    else:
        print(f"\n✅ Chatbot: Ready")
    print(f"CORS: Enabled for http://localhost:3000")
    print(f"{'='*60}\n")
    app.run(host='0.0.0.0', port=port, debug=True)
