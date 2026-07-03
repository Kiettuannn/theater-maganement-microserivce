import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBookingSummary, cancelBooking } from "@/services/bookingService";
import type { BookingSummaryResponse } from "@/services/bookingService";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRM: "Confirmed",
  PAID: "Paid",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-600 bg-yellow-50",
  CONFIRM: "text-blue-600 bg-blue-50",
  PAID: "text-green-600 bg-green-50",
  EXPIRED: "text-gray-600 bg-gray-50",
  CANCELLED: "text-red-600 bg-red-50",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export const BookingDetail = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBookingSummary(bookingId);
        setBooking(data);
      } catch (err) {
        setError("Unable to load booking information. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleCancel = async () => {
    if (!bookingId || !confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      setCancelling(true);
      await cancelBooking(bookingId);
      alert("Booking cancelled successfully");
      navigate(-1);
    } catch (err) {
      alert("Unable to cancel booking. Please try again.");
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error || "Booking not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-600 mt-2">ID: {booking.bookingId}</p>
        </div>
        <span
          className={`px-4 py-2 rounded-lg font-medium ${STATUS_COLORS[booking.status] || ""}`}
        >
          {STATUS_LABELS[booking.status] || booking.status}
        </span>
      </div>

      {/* Movie Info */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Movie Information</h2>
        <div className="flex gap-6">
          {booking.movie.posterUrl && (
            <img
              src={booking.movie.posterUrl}
              alt={booking.movie.title}
              className="w-24 h-36 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <p className="text-lg font-semibold text-gray-900">
              {booking.movie.title}
            </p>
            {booking.movie.ageRating?.code && (
              <p className="text-gray-600">
                <span className="font-medium">Age Rating:</span>{" "}
                {booking.movie.ageRating.code}
              </p>
            )}
            <p className="text-gray-600 mt-2">
              <span className="font-medium">Screening Time:</span>{" "}
              {booking.startTime}
            </p>
          </div>
        </div>
      </div>

      {/* Seats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Tickets</h2>
        <div className="space-y-2">
          {booking.seats.map((seat) => (
            <div
              key={seat.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="font-medium text-gray-900">
                {seat.rowChair} - {seat.seatNumber}
              </span>
              <span className="text-gray-600 text-sm">{seat.seatName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Combos */}
      {booking.combos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Combos</h2>
          <div className="space-y-2">
            {booking.combos.map((combo) => (
              <div
                key={combo.comboId}
                className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="font-medium text-gray-900">{combo.comboName}</p>
                  <p className="text-sm text-gray-600">Qty: {combo.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(combo.subtotal)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(combo.unitPrice)} / each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow p-6 space-y-3">
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Seats Total</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(booking.seatSubtotal)}
          </span>
        </div>
        {booking.combos.length > 0 && (
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Combos Total</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(booking.comboSubtotal)}
            </span>
          </div>
        )}
        {booking.discountAmount && booking.discountAmount > 0 && (
          <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
            <span>Discount</span>
            <span className="font-medium">
              -{formatCurrency(booking.discountAmount)}
            </span>
          </div>
        )}
        <div className="flex justify-between py-3 text-lg font-bold bg-blue-50 p-3 rounded-lg">
          <span className="text-gray-900">Total</span>
          <span className="text-blue-600">
            {formatCurrency(booking.totalAmount)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {booking.status === "PENDING" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {cancelling ? "Cancelling..." : "Cancel Booking"}
          </button>
        )}
      </div>
    </div>
  );
};
