# Chatbot Setup Guide

The RideWise Assistant chatbot requires a Google Gemini API key to function.

## Quick Setup

1. **Get a Gemini API Key**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated API key

2. **Configure the API Key**

   **Option A: Create a `.env` file (Recommended)**
   
   Create a file named `.env` in the `backend` directory with:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   
   **Option B: Set as Environment Variable**
   
   **Windows (PowerShell):**
   ```powershell
   $env:GEMINI_API_KEY="your_actual_api_key_here"
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   set GEMINI_API_KEY=your_actual_api_key_here
   ```
   
   **Linux/Mac:**
   ```bash
   export GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Restart the Backend Server**
   - Stop the backend server (Ctrl+C)
   - Start it again using `start.bat` or `start.sh`

4. **Verify Setup**
   - Check the backend logs - you should see: "Gemini client initialized successfully."
   - Or visit: http://localhost:5000/chat/status
   - It should return: `{"available": true, "message": "Chatbot is ready"}`

## Troubleshooting

### Error: "Chatbot is unavailable. Please configure GEMINI_API_KEY"

- Make sure the `.env` file is in the `backend` directory (not the root)
- Verify the API key is correct (no extra spaces)
- Restart the backend server after adding the API key
- Check backend logs for error messages

### Error: "API key is invalid or missing"

- Verify your API key is correct
- Make sure you copied the entire key
- Check if the API key has expired or been revoked
- Generate a new API key if needed

### Still Not Working?

1. Check backend logs when starting the server
2. Test the status endpoint: `http://localhost:5000/chat/status`
3. Verify the `.env` file location and format
4. Make sure `python-dotenv` is installed: `pip install python-dotenv`

## Notes

- The API key is free for development use with reasonable rate limits
- Keep your API key secure and don't commit it to version control
- The `.env` file is automatically ignored by git
