import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";

interface PredictionResult {
  mode: string;
  parsed_inputs: Record<string, any>;
  prediction: number;
}

export default function UploadPrediction() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<string>("auto");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['text/plain'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a .txt file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (mode !== "auto") {
      formData.append('mode', mode);
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/upload-predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Prediction failed');
      }

      // Store prediction data in localStorage
      localStorage.setItem('uploadedPrediction', JSON.stringify(data));
      
      // Redirect to prediction page
      navigate('/prediction');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload File for Prediction</h1>
          <p className="text-muted-foreground mt-1">
            Upload a TXT file with key:value pairs to get bike demand prediction
          </p>
        </div>

        {/* Upload Form */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload
            </CardTitle>
            <CardDescription>
              Select a TXT file with key:value pairs (e.g., temp: 24, hour: 10). Mode is auto-detected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label htmlFor="file">Choose TXT File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {file && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </p>
                )}
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <Label>Prediction Mode</Label>
                <RadioGroup value={mode} onValueChange={setMode}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto">Auto-detect (recommended)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hour" id="hour" />
                    <Label htmlFor="hour">Hourly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="day" id="day" />
                    <Label htmlFor="day">Daily</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                type="submit"
                disabled={!file || isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Upload & Predict'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading Indicator */}
        {isLoading && (
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                <span className="text-muted-foreground">Analyzing file and generating prediction...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </AppLayout>
  );
}