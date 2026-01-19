import { User, Cog, FileText, BarChart3 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reviews } from "@/components/dashboard/Reviews";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">
            User information and project details
          </p>
        </div>

        {/* User Info Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {user?.name || "Demo User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.email || "demo@ridewise.com"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Project Name</p>
                <p className="font-medium text-foreground">RideWise</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Full Title</p>
                <p className="font-medium text-foreground text-sm">
                  Predicting Bike-Sharing Demand Based on Weather and Urban Events
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Information Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cog className="h-5 w-5 text-primary" />
              Model Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Model Type</p>
                <p className="mt-1 font-semibold text-foreground">XGBoost & Gradient Boosting</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Gradient Boosting Ensembles with XGBoost for demand prediction
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Prediction Types</p>
                <p className="mt-1 font-semibold text-foreground">Hourly & Daily</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Real-time and aggregated demand forecasting
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Input Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                "Season",
                "Hour / Month",
                "Weather Condition",
                "Temperature",
                "Humidity",
                "Working Day",
                "Holiday",
                "Weekday",
              ].map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Reviews />
      </div>
    </AppLayout>
  );
}
