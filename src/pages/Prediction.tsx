import { useState, useEffect } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { seasons, weatherConditions, hours, months, weekdays } from "@/lib/mockData";
import { getPrediction } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Prediction() {
  const [isHourly, setIsHourly] = useState(true);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Mappings for backend numeric values to frontend string values
  const seasonMap = { 1: "spring", 2: "summer", 3: "fall", 4: "winter" };
  const weatherMap = { 1: "clear", 2: "cloudy", 3: "light_rain", 4: "heavy_rain" };
  const reverseSeasonMap = { "spring": "1", "summer": "2", "fall": "3", "winter": "4" };
  const reverseWeatherMap = { "clear": "1", "cloudy": "2", "light_rain": "3", "heavy_rain": "4" };
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  const [inputs, setInputs] = useState({
    dteday: today,
    season: "",
    hour: "",
    weather: "",
    temperature: "20",
    humidity: "50",
    workingDay: "yes",
  });

  // Check for uploaded prediction data on mount
  useEffect(() => {
    const uploadedData = localStorage.getItem('uploadedPrediction');
    if (uploadedData) {
      try {
        const data = JSON.parse(uploadedData);
        console.log('Loaded uploaded prediction data:', data);
        // Populate form fields from parsed_inputs with defaults for missing values
        setInputs(prev => ({
          ...prev,
          season: seasonMap[data.parsed_inputs.season] || "spring",
          hour: data.mode === 'hour' ? (data.parsed_inputs.hr?.toString() || "12") : "",
          weather: weatherMap[data.parsed_inputs.weathersit] || "clear",
          temperature: data.parsed_inputs.temp?.toString() || "20",
          humidity: data.parsed_inputs.hum?.toString() || "50",
          workingDay: data.parsed_inputs.workingday === 1 ? "yes" : (data.parsed_inputs.workingday === 0 ? "no" : "yes"),
        }));
        // Set mode
        setIsHourly(data.mode === 'hour');
        // Set prediction
        setPrediction(data.prediction);
        console.log('Auto-filled prediction:', data.prediction);
        // Clear localStorage
        localStorage.removeItem('uploadedPrediction');
      } catch (err) {
        console.error('Error parsing uploaded prediction data:', err);
      }
    }
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setPrediction(null);
    setError(null);
    // Clear stored prediction data when user changes inputs
    localStorage.removeItem('ridewise_prediction_data');
  };

  const validateInputs = (): boolean => {
    if (!inputs.dteday) {
      console.error("[Validation] Missing date");
      return false;
    }
    if (!inputs.season || !inputs.weather) {
      console.error("[Validation] Missing season or weather");
      return false;
    }
    if (!inputs.temperature || !inputs.humidity) {
      console.error("[Validation] Missing temperature or humidity");
      return false;
    }
    if (isHourly && !inputs.hour) {
      console.error("[Validation] Missing hour for hourly prediction");
      return false;
    }
    return true;
  };

  const handlePredict = async () => {
    console.log("[Predict] Starting prediction...");
    
    if (!validateInputs()) {
      const msg = "Please fill in all required fields.";
      console.error(`[Predict] ${msg}`);
      toast({
        title: "Missing Information",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Build request payload
      const payload = {
        dteday: inputs.dteday,
        season: reverseSeasonMap[inputs.season] || inputs.season,
        holiday: "0",
        workingday: inputs.workingDay === "yes" ? "1" : "0",
        weathersit: reverseWeatherMap[inputs.weather] || inputs.weather,
        temp: parseFloat(inputs.temperature),
        atemp: parseFloat(inputs.temperature) * 0.9, // Approximation
        hum: parseFloat(inputs.humidity),
      };

      // Add fields based on prediction type
      if (isHourly) {
        (payload as any).hr = parseInt(inputs.hour);
      }

      console.log(`[Predict] ${isHourly ? 'HOURLY' : 'DAILY'} request payload:`, payload);

      const result = await getPrediction(payload, isHourly);
      
      if (result.prediction !== undefined && result.prediction !== null) {
        setPrediction(result.prediction);
        console.log(`[Predict] Success: ${result.prediction}`);
        
        // Store prediction data in localStorage for persistence
        const predictionData = {
          prediction: result.prediction,
          predictionType: isHourly ? 'Hourly' : 'Daily',
          inputs: payload,
          timestamp: new Date().toISOString(),
          dateReadable: new Date().toLocaleString(),
        };
        localStorage.setItem('ridewise_prediction_data', JSON.stringify(predictionData));
        console.log('Prediction data saved to localStorage');
        
        toast({
          title: "Prediction Generated",
          description: `Predicted ${isHourly ? 'hourly' : 'daily'} demand: ${Math.round(result.prediction)} bikes`,
        });
      } else if (result.error) {
        const errorMsg = result.error;
        setError(errorMsg);
        console.error(`[Predict] Failed: ${errorMsg}`);
        toast({
          title: "Prediction Failed",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        const errorMsg = "Unknown error occurred";
        setError(errorMsg);
        console.error(`[Predict] ${errorMsg}`);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to backend";
      setError(errorMessage);
      console.error(`[Predict] Exception: ${errorMessage}`);
      toast({
        title: "Connection Error",
        description: "Could not reach the prediction server. Ensure Flask backend is running on http://127.0.0.1:5000",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Demand Prediction</h1>
          <p className="text-muted-foreground mt-1">
            Predict bike-sharing demand based on weather and temporal factors
          </p>
        </div>

        {/* Toggle Switch */}
        <Card className="shadow-card">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isHourly ? "text-muted-foreground" : "text-foreground"}`}>
                Hourly Prediction
              </span>
              <Switch
                checked={!isHourly}
                onCheckedChange={(checked) => {
                  setIsHourly(!checked);
                  setPrediction(null);
                  setError(null);
                  // Clear stored prediction data when mode changes
                  localStorage.removeItem('ridewise_prediction_data');
                }}
              />
              <span className={`text-sm font-medium ${isHourly ? "text-muted-foreground" : "text-foreground"}`}>
                Daily Prediction
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Input Form */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">
              {isHourly ? "Hourly" : "Daily"} Prediction Inputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* DATE FIELD - ALWAYS PRESENT */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={inputs.dteday}
                  onChange={(e) => handleInputChange("dteday", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Season</Label>
                <Select value={inputs.season} onValueChange={(v) => handleInputChange("season", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isHourly ? (
                <div className="space-y-2">
                  <Label>Hour</Label>
                  <Select value={inputs.hour} onValueChange={(v) => handleInputChange("hour", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h.value} value={h.value}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Weather Situation</Label>
                <Select value={inputs.weather} onValueChange={(v) => handleInputChange("weather", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select weather" />
                  </SelectTrigger>
                  <SelectContent>
                    {weatherConditions.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temperature (°C)</Label>
                <Input
                  type="number"
                  value={inputs.temperature}
                  onChange={(e) => handleInputChange("temperature", e.target.value)}
                  placeholder="Enter temperature"
                />
              </div>

              <div className="space-y-2">
                <Label>Humidity (%)</Label>
                <Input
                  type="number"
                  value={inputs.humidity}
                  onChange={(e) => handleInputChange("humidity", e.target.value)}
                  placeholder="Enter humidity"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Working Day</Label>
                <Select value={inputs.workingDay} onValueChange={(v) => handleInputChange("workingDay", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No (Weekend/Holiday)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handlePredict} 
              className="mt-6 w-full sm:w-auto"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Predict Demand
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Prediction Result */}
        {prediction !== null && !error && (
          <Card className="shadow-card border-l-4 border-l-accent">
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground font-medium">
                  Predicted Bike Rentals
                </p>
                <p className="mt-2 text-4xl font-bold text-primary">
                  {Math.round(prediction).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isHourly ? "bikes/hour" : "bikes/day"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
