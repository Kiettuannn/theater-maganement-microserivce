"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import MovieSelectionStep from "@/components/booking/staff/MovieSelectionStep";
import ShowtimeSelectionStep from "@/components/booking/staff/ShowtimeSelectionStep";
import SeatSelectionStep from "@/components/booking/staff/SeatSelectionStep";
import MiniComboPanel from "@/components/booking/staff/MiniComboPanel";
import ConfirmationStep from "@/components/booking/staff/ConfirmationStep";
import PaymentStep from "@/components/booking/staff/PaymentStep";
import SuccessStep from "@/components/booking/staff/SuccessStep";
import { useAuthStore } from "@/stores/useAuthStore";
import httpClient from "@/configurations/httpClient";
import { getAllMovies } from "@/services/movieService";
import type { MovieSimple } from "@/types/MovieType/Movie";
import {
  getShowtimesByMovie,
  type ShowtimeResponse,
} from "@/services/showtimeService";
import {
  getScreeningSeatsByScreeningId,
  mapScreeningSeatToSeat,
  getCombos,
  mapComboForDisplay,
  getComboItemsByComboId,
  mapComboItemDetail,
} from "@/lib/api-movie";
import {
  createBooking,
  getBookingSummary,
  updateBookingCombos,
  cancelBooking,
  redeemBookingPoints,
} from "@/services/bookingService";
import { getCustomerLoyaltyPoints } from "@/services/customerService";
import type { Seat, ComboItem, Showtime } from "@/lib/types";
import { useNotificationStore } from "@/stores";
import { validateOrphanSeats } from "@/utils/seatValidation";
import { cn } from "@/lib/utils";

interface ExtendedShowtime extends Showtime {
  roomId: string;
  roomName: string;
  cinemaId: string;
  cinemaName: string;
}

export const TicketBookingPage = () => {
  const { cinemaId, userId: currentUserId } = useAuthStore();
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Data
  const [movies, setMovies] = useState<MovieSimple[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieSimple | null>(null);
  const [showtimes, setShowtimes] = useState<ShowtimeResponse[]>([]);
  const [selectedShowtime, setSelectedShowtime] =
    useState<ExtendedShowtime | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [combos, setCombos] = useState<ComboItem[]>([]);

  // Selection state
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [selectedCombos, setSelectedCombos] = useState<ComboItem[]>([]);

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [checkoutMode, setCheckoutMode] = useState<"guest" | "member">("guest");

  // Booking state
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [bookingExpiredAt, setBookingExpiredAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Loyalty points
  const [customerPoints, setCustomerPoints] = useState(0);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  // Loading & Error states
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [combosLoading, setCombosLoading] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isUpdatingCombos, setIsUpdatingCombos] = useState(false);
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
  const [seatsError, setSeatsError] = useState<string | null>(null);
  const skipCancelOnUnloadRef = useRef(false);
  const intentionallyCancelledRef = useRef(false);

  // VNPay return handling
  const [isVerifyingVnp, setIsVerifyingVnp] = useState(false);
  const [vnpReturnResult, setVnpReturnResult] = useState<{
    code?: string;
    message?: string;
    bookingId?: string;
    txnRef?: string;
    amount?: number;
    orderInfo?: string;
  } | null>(null);
  const [vnpReturnError, setVnpReturnError] = useState<string | null>(null);

  const isCancellingBooking = useRef(false);

  // Keep customer inputs blank when guest checkout is selected
  useEffect(() => {
    if (checkoutMode === "guest") {
      setCustomerName("");
      setCustomerEmail("");
    }
  }, [checkoutMode]);

  // Timer for booking expiration
  useEffect(() => {
    if (!bookingExpiredAt) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expireTime = new Date(bookingExpiredAt).getTime();
      const remaining = Math.max(0, expireTime - now);
      setTimeRemaining(Math.ceil(remaining / 1000));

      // If time has expired, reset to step 1
      if (remaining <= 0) {
        handleGoBackToMovies();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [bookingExpiredAt]);

  // Fetch movies on mount
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setMoviesLoading(true);
        const data = await getAllMovies();
        // Only show active titles (now showing or coming soon)
        const filtered = data.filter(
          (movie) =>
            movie.status === "now_showing" || movie.status === "coming_soon",
        );
        setMovies(filtered);
      } catch (error: any) {
        console.error("Error fetching movies:", error);
        addNotification({
          type: "error",
          title: "Error",
          message: "Failed to load movies",
        });
      } finally {
        setMoviesLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Detect VNPay return (when redirected back to admin with vnp_ params)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search || "";
    if (!search.includes("vnp_")) return;

    const queryString = search.startsWith("?") ? search.slice(1) : search;

    const verifyReturn = async () => {
      try {
        skipCancelOnUnloadRef.current = true;
        setIsVerifyingVnp(true);
        setVnpReturnError(null);

        const response = await httpClient.get(
          `/payment/vnpay-return?${queryString}`,
        );
        const data = response.data?.result || response.data || {};
        setVnpReturnResult(data);

        if (data?.code === "00") {
          setCurrentStep(7);
          setBookingExpiredAt(null); // Stop timer on successful payment
          // Set bookingId from response if available
          if (data.bookingId) {
            setBookingId(data.bookingId);
          }
        }

        // Clean URL params after verification (replace history)
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (error: any) {
        console.error("Error verifying VNPay return (admin):", error);
        setVnpReturnError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to verify payment",
        );
      } finally {
        setIsVerifyingVnp(false);
      }
    };

    verifyReturn();
  }, []);

  // Fetch combos on mount
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setCombosLoading(true);
        const data = await getCombos();
        const mapped = Array.isArray(data)
          ? data
              .map((combo) => mapComboForDisplay(combo))
              .filter(
                (combo): combo is ComboItem => combo !== null && !combo.deleted,
              )
          : [];

        const combosWithItems = await Promise.all(
          mapped.map(async (combo) => {
            try {
              const items = await getComboItemsByComboId(combo.id);
              const mappedItems = Array.isArray(items)
                ? items
                    .map((item) => mapComboItemDetail(item))
                    .filter(
                      (
                        item,
                      ): item is NonNullable<
                        ReturnType<typeof mapComboItemDetail>
                      > => item !== null,
                    )
                : [];
              return { ...combo, items: mappedItems };
            } catch (error) {
              console.error("Error fetching combo items:", error);
              return { ...combo, items: [] };
            }
          }),
        );

        setCombos(combosWithItems);
      } catch (error: any) {
        console.error("Error fetching combos:", error);
        setCombos([]);
      } finally {
        setCombosLoading(false);
      }
    };

    fetchCombos();
  }, []);

  // Fetch showtimes when movie is selected
  useEffect(() => {
    if (!selectedMovie) return;

    const fetchShowtimes = async () => {
      try {
        setShowtimesLoading(true);
        setSeatsError(null);
        const data = await getShowtimesByMovie(selectedMovie.id);

        // Filter by cinema if cinemaId exists
        let filtered = data;
        if (cinemaId) {
          filtered = data.filter((st) => st.cinemaId === cinemaId);
        }

        const now = new Date();
        filtered = filtered.filter(
          (st) => new Date(st.startTime).getTime() > now.getTime(),
        );

        // Sort by startTime
        filtered.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );
        setShowtimes(filtered);
      } catch (error: any) {
        console.error("Error fetching showtimes:", error);
        addNotification({
          type: "error",
          title: "Error",
          message: "Failed to load showtimes",
        });
        setShowtimes([]);
      } finally {
        setShowtimesLoading(false);
      }
    };

    fetchShowtimes();
  }, [selectedMovie, cinemaId]);

  // Fetch seats when showtime is selected
  useEffect(() => {
    if (!selectedShowtime) return;

    const fetchSeats = async () => {
      try {
        setSeatsLoading(true);
        setSeatsError(null);
        const seatData = await getScreeningSeatsByScreeningId(
          selectedShowtime.id,
        );

        if (seatData && Array.isArray(seatData)) {
          const mappedSeats = seatData
            .map((seat, idx) => mapScreeningSeatToSeat(seat, idx))
            .filter((seat): seat is Seat => seat !== null)
            .sort((a, b) => {
              if (a.row === b.row) {
                return a.number - b.number;
              }
              return a.row.localeCompare(b.row, undefined, {
                numeric: true,
                sensitivity: "base",
              });
            });
          setSeats(mappedSeats);
        } else {
          setSeatsError("Unable to load seats");
          setSeats([]);
        }
      } catch (error: any) {
        console.error("Error fetching seats:", error);
        setSeatsError(error?.response?.data?.message || "Failed to load seats");
        setSeats([]);
      } finally {
        setSeatsLoading(false);
      }
    };

    fetchSeats();
  }, [selectedShowtime]);

  // Fetch booking summary when entering confirmation step (step 4)
  useEffect(() => {
    if (currentStep === 4 && bookingId) {
      console.log("Fetching booking summary for booking ID:", bookingId);
      const fetchSummary = async () => {
        try {
          const summary = await getBookingSummary(bookingId);

          // Convert discount to points
          if (summary.discountAmount && summary.discountAmount > 0) {
            const points = Math.floor(summary.discountAmount / 1000);
            setPointsUsed(points);
            setPointsDiscount(summary.discountAmount);
          }
        } catch (error: any) {
          console.error("Error fetching booking summary:", error);
        }
      };

      fetchSummary();
    }
  }, [currentStep, bookingId]);

  // Fetch customer points when entering confirmation (step 4)
  useEffect(() => {
    if (currentStep === 4 && customerId) {
      console.log("Fetching loyalty points for customer ID:", customerId);
      const fetchPoints = async () => {
        try {
          const points = await getCustomerLoyaltyPoints(customerId);
          setCustomerPoints(points);
        } catch (error: any) {
          console.error("Error fetching loyalty points:", error);
        }
      };

      fetchPoints();
    }
  }, [currentStep, customerId]);

  const handleCancelBooking = async (id: string) => {
    if (isCancellingBooking.current) return;
    isCancellingBooking.current = true;
    intentionallyCancelledRef.current = true;

    try {
      await cancelBooking(id);
      setBookingExpiredAt(null);
      setTimeRemaining(0);
      console.log("Booking cancelled successfully:", id);
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
    } finally {
      isCancellingBooking.current = false;
    }
  };

  // Only cancel booking if user closes/refreshes the tab BEFORE reaching payment step.
  // Explicit Back button handlers (handleGoBackToShowtimes, handleGoBack) handle cancel on navigation.
  // IMPORTANT: Do NOT cancel in useEffect cleanup — it fires on every step change, causing race conditions.
  useEffect(() => {
    const handleUnload = () => {
      // Only auto-cancel on tab close if booking exists and NOT at payment/success step
      if (bookingId && !isCancellingBooking.current && !skipCancelOnUnloadRef.current && currentStep < 5) {
        void cancelBooking(bookingId);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [bookingId, currentStep]);

  const handleSelectMovie = (movie: MovieSimple) => {
    setSelectedMovie(movie);
    // Don't change step here - user must click "Select showtimes" button
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setSelectedCombos([]);
    setCustomerName("");
    setCustomerEmail("");
    setCheckoutMode("guest");
  };

  const handleSelectShowtime = (showtime: ShowtimeResponse) => {
    setSelectedShowtime({
      id: showtime.id,
      movieId: showtime.movieId,
      roomId: showtime.roomId,
      cinemaId: showtime.cinemaId,
      time: showtime.startTime,
      format: "2D",
      price: 0,
      duration: 120,
      roomName: showtime.roomName,
      cinemaName: showtime.cinemaName,
    } as ExtendedShowtime);
    setSelectedSeats([]);
    setSelectedCombos([]);
    setCheckoutMode("guest");
  };

  const handleGoBackToMovies = () => {
    setCurrentStep(1);
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setSelectedCombos([]);
    setBookingId(null);
    setCustomerId(null);
    setCustomerName("");
    setCustomerEmail("");
    setCheckoutMode("guest");
    setPointsUsed(0);
    setPointsDiscount(0);
    setCustomerPoints(0);
    // Clear VNPay return states
    setVnpReturnResult(null);
    setVnpReturnError(null);
    intentionallyCancelledRef.current = false;
  };

  const handleGoBackToShowtimes = async () => {
    // Cancel current booking if exists
    if (bookingId) {
      await handleCancelBooking(bookingId);
      setBookingId(null);
      setCustomerId(null);
    }

    setCurrentStep(2);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setSelectedCombos([]);
    setCustomerName("");
    setCustomerEmail("");
    setCheckoutMode("guest");
  };

  const handleBack = async () => {
    if (currentStep <= 1) return;

    if (currentStep === 2) {
      handleGoBackToMovies();
    } else if (currentStep === 3) {
      await handleGoBackToShowtimes();
    } else if (currentStep === 4) {
      // Back from Confirm to Seats+Combos: cancel booking, reset seats
      if (bookingId) {
        await handleCancelBooking(bookingId);
        setBookingId(null);
        setCustomerId(null);
      }
      setSelectedSeats([]);
      setCurrentStep(3);
      if (selectedShowtime) {
        try {
          setSeatsLoading(true);
          setSeatsError(null);
          const seatData = await getScreeningSeatsByScreeningId(
            selectedShowtime.id,
          );
          if (seatData && Array.isArray(seatData)) {
            const mappedSeats = seatData
              .map((seat, idx) => mapScreeningSeatToSeat(seat, idx))
              .filter((seat): seat is Seat => seat !== null)
              .sort((a, b) => {
                if (a.row === b.row) {
                  return a.number - b.number;
                }
                return a.row.localeCompare(b.row, undefined, {
                  numeric: true,
                  sensitivity: "base",
                });
              });
            setSeats(mappedSeats);
          } else {
            setSeatsError("Unable to load seats");
            setSeats([]);
          }
        } catch (error: any) {
          console.error("Error reloading seats:", error);
          setSeatsError(
            error?.response?.data?.message || "Failed to load seats",
          );
          setSeats([]);
        } finally {
          setSeatsLoading(false);
        }
      }
    } else {
      // step 5+ (payment/success): just go back, don't cancel paid bookings
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && !selectedMovie) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Please select a movie first",
      });
      return;
    }

    // Move to showtime selection step when movie is selected
    if (currentStep === 1 && selectedMovie) {
      setCurrentStep(2);
      setSelectedShowtime(null);
      setSelectedSeats([]);
      setSelectedCombos([]);
      return;
    }

    if (currentStep === 2 && !selectedShowtime) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Please select a showtime",
      });
      return;
    }

    // Move to seat selection step when showtime is selected
    if (currentStep === 2 && selectedShowtime) {
      setCurrentStep(3);
      setSelectedSeats([]);
      setSelectedCombos([]);
      setCheckoutMode("guest");
      return;
    }

    if (currentStep === 3 && selectedSeats.length === 0) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Please select at least one seat",
      });
      return;
    }

    if (
      currentStep === 3 &&
      checkoutMode === "member" &&
      (!customerName.trim() || !customerEmail.trim())
    ) {
      addNotification({
        type: "error",
        title: "Missing info",
        message: "Please enter customer name and email",
      });
      return;
    }

    // Step 3: Create booking (with seats) + update combos immediately → go to confirm (step 4)
    if (currentStep === 3 && !bookingId && selectedSeats.length > 0) {
      try {
        // Validate orphan seats before creating booking
        const validation = validateOrphanSeats(
          seats,
          selectedSeats.map((seat) => seat.id),
        );

        if (!validation.isValid) {
          addNotification({
            type: "error",
            title: "Invalid Seat Selection",
            message: validation.message || "Cách chọn ghế không hợp lệ",
          });
          return;
        }

        setIsCreatingBooking(true);

        const bookingRequest = {
          userId: currentUserId ?? undefined,
          showtimeId: selectedShowtime!.id,
          seatReservationIds: selectedSeats.map((seat) => seat.id),
          idempotencyKey: crypto.randomUUID(),
          currency: "VND",
        };

        const response = await createBooking(bookingRequest);
        setBookingId(response.id);
        setBookingExpiredAt(response.expiresAt || null);
        console.log("Booking created:", response.id, "expires:", response.expiresAt);

        // If combos selected, update them immediately
        if (selectedCombos.length > 0) {
          try {
            setIsUpdatingCombos(true);
            const combosPayload = selectedCombos.map((combo) => ({
              comboId: combo.id,
              quantity: combo.quantity && combo.quantity > 0 ? combo.quantity : 1,
            }));
            await updateBookingCombos(response.id, { combos: combosPayload });
          } catch (comboErr: any) {
            console.warn("Combo update failed (non-critical):", comboErr);
          } finally {
            setIsUpdatingCombos(false);
          }
        }

        setCurrentStep(4); // → Confirm step
      } catch (error: any) {
        console.error("Error creating booking:", error);
        addNotification({
          type: "error",
          title: "Error",
          message: error?.response?.data?.message || "Failed to create booking",
        });
      } finally {
        setIsCreatingBooking(false);
      }
    } else if (currentStep === 4 && bookingId) {
      // Step 4 Confirm → go to payment (step 5)
      if (customerId) {
        try {
          setIsRedeemingPoints(true);
          const summary = await redeemBookingPoints(bookingId, {
            pointsToRedeem: pointsUsed || 0,
          });
          const discount = summary.discountAmount || 0;
          setPointsDiscount(discount);
          setPointsUsed(discount > 0 ? Math.floor(discount / 1000) : 0);
        } catch (error: any) {
          console.error("Error redeeming points:", error);
          addNotification({
            type: "error",
            title: "Error",
            message:
              error?.response?.data?.message ||
              "Failed to apply loyalty points",
          });
        } finally {
          setIsRedeemingPoints(false);
        }
      }
      setCurrentStep(5); // → Payment step
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const getMaxRedeemablePoints = () => {
    const subtotal =
      selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0) +
      selectedCombos.reduce(
        (sum, combo) => sum + combo.price * (combo.quantity || 1),
        0,
      );
    const fiftyPercentCap = Math.floor(subtotal * 0.5);
    const maxPointsBySubtotal = Math.floor(subtotal / 1000);
    const maxPointsByFiftyCap = Math.floor(fiftyPercentCap / 1000);
    return Math.max(
      0,
      Math.min(customerPoints, maxPointsBySubtotal, maxPointsByFiftyCap),
    );
  };

  const handleApplyPoints = (points: number) => {
    const maxRedeem = getMaxRedeemablePoints();
    const safePoints = Math.min(points, maxRedeem);
    setPointsUsed(safePoints);
    setPointsDiscount(safePoints * 1000);
  };

  // Calculate totals
  const seatsTotal = selectedSeats.reduce(
    (sum, seat) => sum + (seat.price || 0),
    0,
  );
  const comboTotal = selectedCombos.reduce(
    (sum, combo) => sum + combo.price * (combo.quantity || 1),
    0,
  );
  const subtotal = seatsTotal + comboTotal;
  const discount = pointsDiscount > 0 ? pointsDiscount : 0;
  const total = Math.max(0, subtotal - discount);

  const visualSteps = [
    {
      id: 1,
      title: "Select Screening",
      description: "Choose movie & time",
      isDone: currentStep > 2,
      isActive: currentStep <= 2,
    },
    {
      id: 2,
      title: "Select Seats & Combos",
      description: "Pick seats & add combos",
      isDone: currentStep > 3,
      isActive: currentStep === 3,
    },
    {
      id: 3,
      title: "Confirm booking",
      description: "Review your order",
      isDone: currentStep > 4,
      isActive: currentStep === 4,
    },
    {
      id: 4,
      title: "Payment",
      description: "Complete booking",
      isDone: currentStep >= 6,
      isActive: currentStep === 5,
    },
  ];

  const primaryCtaLabel = (() => {
    switch (currentStep) {
      case 1:
        return "Select showtime";
      case 2:
        return "Select seats";
      case 3:
        return "Confirm booking";
      case 4:
        return "Continue to payment";
      case 5:
        return "Complete booking";
      default:
        return "Next";
    }
  })();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Ticket Booking"
        description="Book tickets for customers"
      />

      <Card className="shadow-sm">
        {/* Progress Steps */}
        <div className="px-6 py-5 border-b bg-gray-50">
          <div className="flex items-center gap-4 pb-2">
            {visualSteps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-4 flex-1">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    step.isDone
                      ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                      : step.isActive
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-300 text-gray-500"
                  }`}
                >
                  {step.isDone ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {idx < visualSteps.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 ${step.isDone ? "bg-emerald-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
          {isVerifyingVnp ||
          (vnpReturnResult && currentStep !== 7) ||
          (vnpReturnError && currentStep !== 7) ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="w-full max-w-md">
                {isVerifyingVnp ? (
                  <div className="flex flex-col items-center gap-3 text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <div className="text-lg font-semibold">
                      Verifying VNPay payment...
                    </div>
                    <div className="text-sm text-gray-600">
                      Please wait a moment
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            vnpReturnResult?.code === "00"
                              ? "default"
                              : "destructive"
                          }
                          className="uppercase"
                        >
                          {vnpReturnResult?.code === "00"
                            ? "Success"
                            : "Failed"}
                        </Badge>
                        <span className="text-sm text-gray-500">VNPay</span>
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      {vnpReturnResult?.code === "00" ? (
                        <>
                          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                          <div className="text-xl font-bold text-emerald-700">
                            Payment successful
                          </div>
                          <div className="text-gray-600 text-sm">
                            {vnpReturnResult?.message}
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-12 h-12 text-red-600 mx-auto" />
                          <div className="text-xl font-bold text-red-700">
                            Payment failed
                          </div>
                          <div className="text-gray-600 text-sm">
                            {vnpReturnError ||
                              vnpReturnResult?.message ||
                              "Transaction unsuccessful"}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid gap-2 text-sm text-left bg-gray-50 rounded-md p-3">
                      {vnpReturnResult?.txnRef && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Txn Ref</span>
                          <span className="font-semibold text-xs">
                            {vnpReturnResult.txnRef}
                          </span>
                        </div>
                      )}
                      {typeof vnpReturnResult?.amount === "number" && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount</span>
                          <span className="font-semibold">
                            {vnpReturnResult.amount.toLocaleString()} VND
                          </span>
                        </div>
                      )}
                      {vnpReturnResult?.orderInfo && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Info</span>
                          <span className="font-semibold text-xs">
                            {vnpReturnResult.orderInfo}
                          </span>
                        </div>
                      )}
                      {vnpReturnResult?.bookingId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Booking ID</span>
                          <span className="font-semibold text-xs">
                            {vnpReturnResult.bookingId}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                        onClick={() => {
                          if (vnpReturnResult?.code === "00") {
                            setCurrentStep(7);
                            if (vnpReturnResult.bookingId) {
                              setBookingId(vnpReturnResult.bookingId);
                            }
                          } else {
                            setCurrentStep(1);
                            handleGoBackToMovies();
                          }
                        }}
                      >
                        {vnpReturnResult?.code === "00"
                          ? "View Tickets"
                          : "Try Again"}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleGoBackToMovies()}
                      >
                        Back to booking
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {bookingId &&
                timeRemaining > 0 &&
                (!vnpReturnResult || vnpReturnResult?.code !== "00") && (
                  <div
                    className={cn(
                      "mb-4 p-4 rounded-lg border-2 flex items-center justify-between",
                      timeRemaining <= 60
                        ? "border-red-500 bg-red-50"
                        : "border-yellow-500 bg-yellow-50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Clock3
                        className={cn(
                          "w-5 h-5",
                          timeRemaining <= 60
                            ? "text-red-600"
                            : "text-yellow-600",
                        )}
                      />
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            timeRemaining <= 60
                              ? "text-red-700"
                              : "text-yellow-700",
                          )}
                        >
                          Booking expires in
                        </p>
                        <p
                          className={cn(
                            "text-lg font-bold",
                            timeRemaining <= 60
                              ? "text-red-900"
                              : "text-yellow-900",
                          )}
                        >
                          {Math.floor(timeRemaining / 60)}:
                          {String(timeRemaining % 60).padStart(2, "0")}
                        </p>
                      </div>
                    </div>
                    {timeRemaining <= 60 && (
                      <p className="text-xs text-red-600 font-semibold">
                        Hurry up!
                      </p>
                    )}
                  </div>
                )}

              {currentStep === 1 && (
                <MovieSelectionStep
                  movies={movies}
                  loading={moviesLoading}
                  onSelectMovie={handleSelectMovie}
                  selectedMovie={selectedMovie}
                />
              )}

              {currentStep === 2 && selectedMovie && (
                <ShowtimeSelectionStep
                  movie={selectedMovie}
                  showtimes={showtimes}
                  loading={showtimesLoading}
                  onSelectShowtime={handleSelectShowtime}
                />
              )}

              {currentStep === 3 && selectedShowtime && (
                <div className="flex gap-4">
                  {/* Left: Seat selection (wider) */}
                  <div className="flex-1 min-w-0">
                    <SeatSelectionStep
                      seats={seats}
                      selectedSeats={selectedSeats}
                      onSelectSeats={setSelectedSeats}
                      showtime={selectedShowtime}
                      loading={seatsLoading}
                      error={seatsError}
                      customerName={customerName}
                      customerEmail={customerEmail}
                      checkoutMode={checkoutMode}
                      onCustomerNameChange={setCustomerName}
                      onCustomerEmailChange={setCustomerEmail}
                      onCheckoutModeChange={setCheckoutMode}
                    />
                  </div>

                  {/* Right: Mini combo panel */}
                  <div className="w-64 shrink-0 border-l pl-4">
                    <MiniComboPanel
                      combos={combos}
                      selectedCombos={selectedCombos}
                      onSelectCombos={setSelectedCombos}
                      loading={combosLoading}
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && selectedShowtime && (
                <ConfirmationStep
                  selectedSeats={selectedSeats}
                  selectedCombos={selectedCombos}
                  showtime={selectedShowtime}
                  movie={selectedMovie!}
                  subtotal={subtotal}
                  customerPoints={customerPoints}
                  pointsUsed={pointsUsed}
                  pointsDiscount={pointsDiscount}
                  onApplyPoints={handleApplyPoints}
                />
              )}

              {currentStep === 5 &&
                bookingId &&
                selectedShowtime &&
                selectedMovie && (
                  <PaymentStep
                    bookingId={bookingId}
                    total={total}
                    subtotal={subtotal}
                    discount={discount}
                    showtime={selectedShowtime}
                    movie={selectedMovie}
                    selectedSeats={selectedSeats}
                    selectedCombos={selectedCombos}
                    onPaymentSuccess={() => {
                      // Mark as intentionally completed — prevent cleanup cancel
                      skipCancelOnUnloadRef.current = true;
                      intentionallyCancelledRef.current = true;
                      setBookingExpiredAt(null);
                      setCurrentStep(6);
                    }}
                    onExternalPaymentStart={() => {
                      skipCancelOnUnloadRef.current = true;
                    }}
                  />
                )}

              {currentStep === 6 && bookingId && (
                <SuccessStep
                  bookingId={bookingId}
                  selectedSeats={selectedSeats}
                  selectedCombos={selectedCombos}
                  total={total > 0 ? total : vnpReturnResult?.amount || 0}
                  movie={selectedMovie || undefined}
                  showtime={
                    selectedShowtime
                      ? {
                          time: selectedShowtime.time,
                          format: selectedShowtime.format,
                        }
                      : undefined
                  }
                  onNewBooking={() => {
                    handleGoBackToMovies();
                  }}
                />
              )}
            </>
          )}
        </div>
        {/* Navigation & Summary */}
        {currentStep !== 6 && (
          <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-right">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {total.toLocaleString()} VND
              </p>
            </div>

            <Button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !selectedMovie) ||
                (currentStep === 2 && !selectedShowtime) ||
                (currentStep === 3 && selectedSeats.length === 0) ||
                isCreatingBooking ||
                isUpdatingCombos ||
                isRedeemingPoints ||
                currentStep === 5 ||
                currentStep === 6
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === 6 ? "Done" : primaryCtaLabel}
              {currentStep !== 6 && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
