// API utility for backend communication

const API_BASE_URL = 'http://127.0.0.1:5000';

export interface PredictionInputs {
  dteday?: string;
  season?: string;
  hour?: string;
  month?: string;
  weekday?: string;
  weather?: string;
  temperature?: string;
  humidity?: string;
  workingDay?: string;
  [key: string]: any;
}

export interface PredictionResponse {
  prediction?: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  day_model_loaded: boolean;
  day_feature_count: number;
  hour_model_loaded: boolean;
  hour_feature_count: number;
}

/**
 * Check if the backend server is healthy
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    console.log(`[Health] GET ${API_BASE_URL}/health`);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[Health] Response:`, data);
    return data;
  } catch (error) {
    console.error('[Health] Error:', error);
    throw error;
  }
}

/**
 * Get prediction from the backend ML model
 */
export async function getPrediction(
  inputs: PredictionInputs,
  isHourly: boolean
): Promise<PredictionResponse> {
  try {
    const endpoint = isHourly ? '/predict/hour' : '/predict/day';
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`[Predict] ${isHourly ? 'HOUR' : 'DAY'} endpoint: ${url}`);
    console.log(`[Predict] Request payload:`, inputs);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputs),
    });

    console.log(`[Predict] Response status: ${response.status}`);
    
    const data = await response.json();
    console.log(`[Predict] Response body:`, data);
    
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[Predict] Error:`, errorMessage);
    throw error;
  }
}
/**
 * Get dashboard summary (last prediction)
 */
export async function getDashboardSummary() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
    const data = await response.json();
    console.log('[Dashboard] Summary fetched:', data);
    return data;
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    throw error;
  }
}

/**
 * Submit user feedback
 */
export async function submitFeedback(rating: number, message: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating, message }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit feedback');
    }

    console.log('[Feedback] Submitted successfully');
    return data;
  } catch (error) {
    console.error('[Feedback] Error:', error);
    throw error;
  }
}

/**
 * Get recent feedback (last 5 entries)
 */
export async function getRecentFeedback() {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback/recent`);
    const data = await response.json();
    console.log('[Feedback] Recent feedback fetched:', data);
    return data;
  } catch (error) {
    console.error('[Feedback] Error:', error);
    throw error;
  }
}