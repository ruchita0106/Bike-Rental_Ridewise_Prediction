// Mock data for RideWise Dashboard

export const hourlyDemandData = [
  { hour: "6AM", demand: 120 },
  { hour: "7AM", demand: 380 },
  { hour: "8AM", demand: 520 },
  { hour: "9AM", demand: 410 },
  { hour: "10AM", demand: 280 },
  { hour: "11AM", demand: 220 },
  { hour: "12PM", demand: 340 },
  { hour: "1PM", demand: 360 },
  { hour: "2PM", demand: 290 },
  { hour: "3PM", demand: 320 },
  { hour: "4PM", demand: 450 },
  { hour: "5PM", demand: 580 },
  { hour: "6PM", demand: 520 },
  { hour: "7PM", demand: 380 },
  { hour: "8PM", demand: 260 },
  { hour: "9PM", demand: 180 },
];

export const dailyDemandData = [
  { day: "Mon", demand: 3200 },
  { day: "Tue", demand: 3450 },
  { day: "Wed", demand: 3380 },
  { day: "Thu", demand: 3520 },
  { day: "Fri", demand: 3680 },
  { day: "Sat", demand: 4120 },
  { day: "Sun", demand: 3890 },
];

export const weatherDemandData = [
  { weather: "Clear", demand: 4200, fill: "hsl(var(--chart-1))" },
  { weather: "Cloudy", demand: 3100, fill: "hsl(var(--chart-2))" },
  { weather: "Light Rain", demand: 1800, fill: "hsl(var(--chart-3))" },
  { weather: "Heavy Rain", demand: 650, fill: "hsl(var(--chart-4))" },
];

export const summaryStats = {
  predictedDemand: 2847,
  weatherImpact: "Medium" as const,
  peakStatus: "Peak" as const,
  predictionType: "Hourly" as const,
};

export const seasons = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
];

export const weatherConditions = [
  { value: "clear", label: "Clear / Sunny" },
  { value: "cloudy", label: "Cloudy / Misty" },
  { value: "light_rain", label: "Light Rain / Snow" },
  { value: "heavy_rain", label: "Heavy Rain / Storm" },
];

export const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, "0")}:00`,
}));

export const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const weekdays = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export const chatMessages = [
  {
    id: 1,
    type: "assistant" as const,
    message: "Hello! I'm the RideWise Assistant. I can help you understand bike-sharing demand patterns.",
  },
  {
    id: 2,
    type: "assistant" as const,
    message: "Demand is usually higher on weekends, especially during clear weather conditions.",
  },
  {
    id: 3,
    type: "assistant" as const,
    message: "Rainy weather typically reduces bike usage by 40-60% compared to clear days.",
  },
  {
    id: 4,
    type: "assistant" as const,
    message: "Peak hours are typically 7-9 AM and 5-7 PM on working days, coinciding with commute times.",
  },
];

export const generatePrediction = (inputs: Record<string, string>): number => {
  // Simple mock prediction based on inputs
  let base = 150;
  
  if (inputs.weather === "clear") base += 100;
  else if (inputs.weather === "cloudy") base += 50;
  else if (inputs.weather === "light_rain") base -= 30;
  else if (inputs.weather === "heavy_rain") base -= 80;
  
  if (inputs.season === "summer") base += 80;
  else if (inputs.season === "spring" || inputs.season === "fall") base += 40;
  
  if (inputs.workingDay === "yes") base += 60;
  
  const temp = parseFloat(inputs.temperature || "20");
  if (temp >= 15 && temp <= 28) base += 50;
  
  // Add some randomness
  return Math.max(50, Math.round(base + (Math.random() - 0.5) * 100));
};
