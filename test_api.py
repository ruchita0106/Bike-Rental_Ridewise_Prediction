import requests
import json

API_URL = "http://127.0.0.1:5000"

# Test day prediction
day_data = {
    "dteday": "2026-01-11",
    "season": "summer",
    "holiday": "0",
    "workingday": "1",
    "weathersit": "cloudy",
    "temp": 20,
    "atemp": 18,
    "hum": 50
}

print("=" * 60)
print("Testing /predict/day endpoint...")
print("=" * 60)
try:
    response = requests.post(f"{API_URL}/predict/day", json=day_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 60)
print("Testing /predict/hour endpoint...")
print("=" * 60)

# Test hour prediction
hour_data = {
    "dteday": "2026-01-11",
    "hr": 10,
    "season": "summer",
    "holiday": "0",
    "workingday": "1",
    "weathersit": "cloudy",
    "temp": 20,
    "atemp": 18,
    "hum": 50,
    "windspeed": 5
}

try:
    response = requests.post(f"{API_URL}/predict/hour", json=hour_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 60)
print("Testing /health endpoint...")
print("=" * 60)
try:
    response = requests.get(f"{API_URL}/health")
    print(f"Status: {response.status_code}")
    health = response.json()
    print(f"Day Model: {health.get('day_model_loaded')} ({health.get('day_feature_count')} features)")
    print(f"Hour Model: {health.get('hour_model_loaded')} ({health.get('hour_feature_count')} features)")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 60)
print("Testing /chat endpoint...")
print("=" * 60)
chat_data = {"message": "What affects bike demand?"}
try:
    response = requests.post(f"{API_URL}/chat", json=chat_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
