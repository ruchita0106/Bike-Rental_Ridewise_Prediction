import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  badge?: {
    text: string;
    variant: "default" | "success" | "warning" | "destructive";
  };
}

const badgeStyles = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

export function SummaryCard({ title, value, icon, badge }: SummaryCardProps) {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
            {badge && (
              <span
                className={cn(
                  "mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium",
                  badgeStyles[badge.variant]
                )}
              >
                {badge.text}
              </span>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
