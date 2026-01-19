import { useState, useEffect } from "react";
import { Star, Send, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Review {
  id: number;
  rating: number;
  comment: string;
  timestamp: string;
}

export function Reviews() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await fetch(`http://127.0.0.1:5000/api/reviews?user_email=${encodeURIComponent(user!.email)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting review:', { rating, comment });

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a review.",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (rating === 0) {
      toast({
        title: "Missing Rating",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (comment.trim().length < 5) {
      toast({
        title: "Comment Too Short",
        description: "Please write at least 5 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_email: user.email,
          rating,
          comment: comment.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
      }

      // Success state
      setIsSuccess(true);
      setRating(0);
      setComment("");

      toast({
        title: "Thank You!",
        description: "Your review has been submitted successfully.",
      });

      // Refresh reviews
      fetchReviews();

      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Review submission error:", error);
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error ? error.message : "Could not submit review",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (fillCount: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            onMouseEnter={() => setHoverRating(i + 1)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
            aria-label={`Rate ${i + 1} star${i + 1 > 1 ? 's' : ''}`}
          >
            <Star
              className={`h-6 w-6 ${
                i < (hoverRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      return date.toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  const renderStarsDisplay = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < rating
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg">My Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSuccess ? (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3" role="alert" aria-live="polite">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Review Submitted</p>
                <p className="text-sm text-green-700">
                  Thank you for your valuable review!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Rating Section */}
              <div className="space-y-3">
                <label htmlFor="rating" className="block">
                  <span className="text-sm font-medium text-foreground">
                    How would you rate your experience? <span className="text-red-500">*</span>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  {renderStars(rating)}
                  {rating > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {rating} out of 5
                    </span>
                  )}
                </div>
              </div>

              {/* Comment Section */}
              <div className="space-y-3">
                <label htmlFor="comment" className="block">
                  <span className="text-sm font-medium text-foreground">
                    Your Review <span className="text-red-500">*</span>
                  </span>
                </label>
                <Textarea
                  id="comment"
                  placeholder="Tell us what you think about RideWise... (minimum 5 characters)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-24 resize-none"
                  maxLength={500}
                  aria-describedby="comment-help"
                />
                <p id="comment-help" className="text-xs text-muted-foreground">
                  {comment.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
                aria-describedby="submit-status"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⚙️</span> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
              <div id="submit-status" className="sr-only" aria-live="polite">
                {isLoading ? "Submitting review..." : ""}
              </div>
            </>
          )}
        </form>

        {/* Reviews List */}
        <div className="space-y-4">
          <h3 className="text-md font-medium">Your Reviews</h3>
          {loadingReviews ? (
            <p className="text-sm text-muted-foreground">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reviews yet. Be the first to share your thoughts!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    {renderStarsDisplay(review.rating)}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(review.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}