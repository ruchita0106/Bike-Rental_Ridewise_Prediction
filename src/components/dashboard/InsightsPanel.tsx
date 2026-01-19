import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function InsightsPanel() {
  return (
    <Card className="shadow-card border-l-4 border-l-accent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Lightbulb className="h-5 w-5 text-accent" />
          Demand Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bike demand increases significantly during clear weather and peak commuting hours 
          (7-9 AM and 5-7 PM). Weekends typically show 15-20% higher usage compared to weekdays.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Temperature between 15-28°C combined with low humidity creates optimal conditions 
          for bike rentals. Rainy conditions can reduce demand by up to 60%.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            Weather-sensitive
          </span>
          <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            Time-dependent
          </span>
          <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            Seasonal patterns
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
