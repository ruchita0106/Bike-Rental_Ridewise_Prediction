import { useState, useEffect } from "react";
import { Star, MessageSquare, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Review {
  user_email: string;
  id: number;
  rating: number;
  comment: string;
  timestamp: string;
}

export function RecentReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentReviews();
  }, []);

  const fetchRecentReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("http://127.0.0.1:5000/api/reviews/all");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Show only last 5 reviews
      setReviews((data.reviews || []).slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch recent reviews:", error);
      setError(error instanceof Error ? error.message : "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getUserDisplayName = (email: string) => {
    // Extract name from email or use "Anonymous"
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error loading reviews: {error}</p>
          <button
            onClick={fetchRecentReviews}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Recent Reviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={`${review.user_email}-${review.id}`} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {getUserDisplayName(review.user_email)}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                </div>
                <p className="text-foreground text-sm mb-2">{review.comment}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.timestamp).toLocaleDateString()} at {new Date(review.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}