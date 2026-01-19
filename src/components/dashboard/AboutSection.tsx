import { Zap, Cloud, Brain, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AboutSection() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl">About RideWise</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Description */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">RideWise – Bike Demand Prediction System</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            RideWise is a student-built data analytics application designed to predict
            bike-sharing demand using weather conditions and temporal patterns. It helps
            city planners, bike-sharing operators, and researchers understand usage trends
            and optimize resource allocation.
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground text-sm">Key Features</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <BarChart3 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Hourly & Daily Demand Prediction</span>
            </div>
            <div className="flex items-start gap-2">
              <Cloud className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Weather-aware Analytics</span>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Dynamic Dashboard Insights</span>
            </div>
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">AI-powered Chatbot (Gemini)</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">User Feedback & Reviews</span>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground text-sm">Technology Stack</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground font-medium">Frontend</p>
              <p className="text-sm font-semibold text-foreground mt-1">React + TypeScript</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground font-medium">Backend</p>
              <p className="text-sm font-semibold text-foreground mt-1">Flask + Python</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground font-medium">ML Models</p>
              <p className="text-sm font-semibold text-foreground mt-1">Gradient Boosting</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground font-medium">AI</p>
              <p className="text-sm font-semibold text-foreground mt-1">Google Gemini API</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            This project is part of academic coursework in data science and web development,
            demonstrating real-world application of machine learning and full-stack engineering.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
