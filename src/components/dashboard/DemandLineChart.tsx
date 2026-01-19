import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { hourlyDemandData, dailyDemandData } from "@/lib/mockData";

interface DemandLineChartProps {
  type: "hourly" | "daily";
}

export function DemandLineChart({ type }: DemandLineChartProps) {
  const data = type === "hourly" ? hourlyDemandData : dailyDemandData;
  const xKey = type === "hourly" ? "hour" : "day";

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {type === "hourly" ? "Hourly" : "Daily"} Demand Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                axisLine={{ className: "stroke-border" }}
                tickLine={{ className: "stroke-border" }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                axisLine={{ className: "stroke-border" }}
                tickLine={{ className: "stroke-border" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="demand"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "hsl(var(--accent))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
