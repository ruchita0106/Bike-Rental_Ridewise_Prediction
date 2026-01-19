import { Link, useLocation } from "react-router-dom";
import { Bike, LayoutDashboard, TrendingUp, MessageCircle, User, Upload, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/prediction", label: "Prediction", icon: TrendingUp },
  { path: "/upload", label: "Upload File", icon: Upload },
  { path: "/chatbot", label: "Chatbot", icon: MessageCircle },
  { path: "/profile", label: "Profile", icon: User },
];

export function TopNav() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-card">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Bike className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-primary">RideWise</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
