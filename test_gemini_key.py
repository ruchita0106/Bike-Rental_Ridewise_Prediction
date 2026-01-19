import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load .env
env_path = os.path.join('backend', '.env')
print(f"Loading .env from: {os.path.abspath(env_path)}")
load_dotenv(env_path)

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key loaded: {api_key[:10]}... (length: {len(api_key) if api_key else 0})")

if not api_key:
    print("No API key found in .env")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

try:
    response = model.generate_content("Hello, test message")
    print("API key is valid. Response:", response.text[:100] + "...")
except Exception as e:
    print("API key is invalid or error:", str(e))