import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";
import { Star } from "lucide-react";
import { api } from "../lib/api";

interface Review {
  id: number;
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  avgRating: number;
  count: number;
}

function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} className={s <= value ? "text-gold-400 fill-gold-400" : "text-stone-600"} />
      ))}
    </div>
  );
}

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function ReviewSection({ productId }: { productId: number }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery<ReviewsData>({
    queryKey: ["reviews", productId],
    queryFn: () => api.get(`/products/${productId}/reviews`).then((r) => r.data),
  });

  const alreadyReviewed = isSignedIn && !!data?.reviews.some((r) => r.userId === user?.id);

  const handleSubmit = async () => {
    if (rating === 0) { alert("Please select a star rating"); return; }
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, {
        rating,
        comment: comment.trim(),
        userName: user?.fullName || user?.emailAddresses?.[0]?.emailAddress || "Anonymous",
        userEmail: user?.emailAddresses?.[0]?.emailAddress || "",
      });
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["reviews-summary"] });
      setRating(0);
      setComment("");
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-10 border-t border-stone-800 pt-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-xl font-serif text-gold-400">Customer Reviews</h2>
        {data && data.count > 0 && (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <StarRow value={Math.round(data.avgRating)} />
            <span>{data.avgRating.toFixed(1)} · {data.count} review{data.count !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {isSignedIn && !alreadyReviewed && (
        <div className="card p-5 mb-6">
          <p className="text-stone-300 text-sm font-medium mb-3">Write a Review</p>
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="focus:outline-none"
              >
                <Star size={28} className={(hovered || rating) >= star ? "text-gold-400 fill-gold-400" : "text-stone-600"} />
              </button>
            ))}
            {rating > 0 && <span className="text-stone-400 text-sm ml-1">{LABELS[rating]}</span>}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)"
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-stone-200 text-sm focus:outline-none focus:border-gold-500 resize-none placeholder-stone-500"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="btn-gold mt-3 text-sm py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {!isSignedIn && (
        <div className="card p-4 mb-6 flex items-center gap-3 text-sm text-stone-400">
          <span>Sign in to leave a review</span>
          <SignInButton mode="modal"><button className="text-gold-400 hover:underline">Sign In</button></SignInButton>
        </div>
      )}

      {alreadyReviewed && (
        <div className="card p-3 mb-6 text-sm text-stone-500">✓ You have already reviewed this product.</div>
      )}

      {isLoading && <p className="text-stone-500 text-sm">Loading reviews...</p>}

      {!isLoading && data?.reviews.length === 0 && (
        <p className="text-stone-500 text-sm">No reviews yet — be the first!</p>
      )}

      <div className="space-y-4">
        {data?.reviews.map((review) => (
          <div key={review.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-200 text-sm font-medium">{review.userName}</span>
              <span className="text-xs text-stone-500">{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
            <StarRow value={review.rating} />
            {review.comment && <p className="text-stone-400 text-sm mt-2 leading-relaxed">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
