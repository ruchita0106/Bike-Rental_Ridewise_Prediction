import { useState, useEffect } from "react";
import { Bike, Cloud, Clock, BarChart3 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { DemandLineChart } from "@/components/dashboard/DemandLineChart";
import { WeatherBarChart } from "@/components/dashboard/WeatherBarChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { AboutSection } from "@/components/dashboard/AboutSection";
import { RecentReviews } from "@/components/dashboard/RecentReviews";
import { summaryStats } from "@/lib/mockData";

interface DashboardSummary {
  predicted_demand: number | null;
  prediction_type: string | null;
  weather_impact: string | null;
  peak_status: string | null;
  timestamp: string | null;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary>({
    predicted_demand: summaryStats.predictedDemand,
    prediction_type: summaryStats.predictionType,
    weather_impact: summaryStats.weatherImpact,
    peak_status: summaryStats.peakStatus,
    timestamp: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard summary on component mount
  useEffect(() => {
    fetchDashboardSummary();
    // Refresh every 10 seconds
    const interval = setInterval(fetchDashboardSummary, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("http://127.0.0.1:5000/dashboard/summary");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: DashboardSummary = await response.json();
      
      // Only update if we have valid data
      if (data.predicted_demand !== null) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard summary:", error);
      setError(error instanceof Error ? error.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherBadge = (impact: string | null) => {
    switch (impact) {
      case "Low":
        return { text: "Low Impact", variant: "success" as const };
      case "Medium":
        return { text: "Medium Impact", variant: "warning" as const };
      case "High":
        return { text: "High Impact", variant: "destructive" as const };
      default:
        return { text: impact || "Unknown", variant: "default" as const };
    }
  };

  const getPeakBadge = (status: string | null) => {
    switch (status) {
      case "Peak":
        return { text: "Peak Hours", variant: "warning" as const };
      case "Normal":
        return { text: "Normal", variant: "default" as const };
      case "Off-Peak":
        return { text: "Off-Peak", variant: "success" as const };
      default:
        return { text: status || "Unknown", variant: "default" as const };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time bike-sharing demand analytics and insights
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Error loading dashboard: {error}</p>
            <button 
              onClick={fetchDashboardSummary}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Cards - Dynamic Data */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Predicted Demand"
            value={
              dashboardData.predicted_demand !== null
                ? dashboardData.predicted_demand.toLocaleString()
                : "No data"
            }
            icon={<Bike className="h-5 w-5" />}
            badge={{
              text: dashboardData.prediction_type === "Hourly" ? "bikes/hour" : "bikes/day",
              variant: "default",
            }}
          />
          <SummaryCard
            title="Weather Impact"
            value={dashboardData.weather_impact || "Unknown"}
            icon={<Cloud className="h-5 w-5" />}
            badge={getWeatherBadge(dashboardData.weather_impact)}
          />
          <SummaryCard
            title="Peak Status"
            value={dashboardData.peak_status || "Unknown"}
            icon={<Clock className="h-5 w-5" />}
            badge={getPeakBadge(dashboardData.peak_status)}
          />
          <SummaryCard
            title="Prediction Type"
            value={dashboardData.prediction_type || "None"}
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <DemandLineChart type="hourly" />
          <WeatherBarChart />
        </div>

        {/* Insights Panel */}
        <InsightsPanel />

        {/* Recent Reviews Section */}
        <RecentReviews />

        {/* About Section */}
        <AboutSection />
      </div>
    </AppLayout>
  );
}
