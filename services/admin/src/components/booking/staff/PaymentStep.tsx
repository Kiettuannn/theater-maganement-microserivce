import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Smartphone, Wallet } from "lucide-react";
import { format } from "date-fns";
import { ROUTES } from "@/constants/routes";
import type { Seat, ComboItem, Showtime } from "../../../lib/types";
import type { MovieSimple } from "@/services/movieService";
import httpClient from "@/configurations/httpClient";

interface PaymentStepProps {
  bookingId: string;
  total: number;
  subtotal: number;
  discount: number;
  showtime: Showtime & { roomName: string; cinemaName: string };
  movie: MovieSimple;
  selectedSeats: Seat[];
  selectedCombos: ComboItem[];
  onPaymentSuccess: () => void;
  onExternalPaymentStart?: () => void;
}

export default function PaymentStep({
  bookingId,
  total,
  subtotal,
  discount,
  showtime,
  movie,
  selectedSeats,
  selectedCombos,
  onPaymentSuccess,
  onExternalPaymentStart,
}: PaymentStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "vnpay">(
    "vnpay",
  );
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isVerifyingReturn, setIsVerifyingReturn] = useState(false);
  const [returnResult, setReturnResult] = useState<{
    code?: string;
    message?: string;
    txnRef?: string;
    amount?: number;
    orderInfo?: string;
  } | null>(null);

  // Detect VNPay callback parameters once when the page loads after redirect
  const vnpQueryString = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.search.startsWith("?")
      ? window.location.search.slice(1)
      : "";
  }, []);

  useEffect(() => {
    const hasVnpParams = vnpQueryString.includes("vnp_");
    if (!hasVnpParams) return;

    const verifyPayment = async () => {
      try {
        setIsVerifyingReturn(true);
        const response = await httpClient.get(
          `/payment/vnpay-return?${vnpQueryString}`,
        );
        const data = response.data?.result || {};
        setReturnResult(data);

        // Auto-complete booking when VNPay reports success
        if (data?.code === "00") {
          onPaymentSuccess();
        } else {
          setPaymentError(data?.message || "Payment was not successful");
        }
      } catch (error: any) {
        console.error("Error verifying VNPay return:", error);
        setPaymentError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to verify VNPay payment",
        );
      } finally {
        setIsVerifyingReturn(false);
      }
    };

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vnpQueryString]);

  const seatTotal = selectedSeats.reduce(
    (sum, seat) => sum + (seat.price || 0),
    0,
  );
  const comboTotal = selectedCombos.reduce(
    (sum, combo) => sum + combo.price * (combo.quantity || 1),
    0,
  );

  const methods = [
    {
      id: "vnpay",
      label: "VNPay",
      description: "Redirect to VNPay sandbox",
      icon: Smartphone,
    },
    {
      id: "cash",
      label: "Cash",
      description: "Collect cash at counter",
      icon: Wallet,
    },
  ] as const;

  const handleVnpayPayment = async () => {
    if (isPaying) return;
    setPaymentError(null);
    setIsPaying(true);
    onExternalPaymentStart?.();

    try {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${ROUTES.TICKET_BOOKING}`
          : undefined;

      // Lấy invoice đã tạo sẵn từ booking
      const invoiceRes = await httpClient.get(`/payment/invoices/booking/${bookingId}`);
      const invoiceId = invoiceRes.data?.result?.id;

      if (!invoiceId) {
        throw new Error("Không tìm thấy hóa đơn cho booking này");
      }

      const url = returnUrl
        ? `/payment/payment/vnpay/${invoiceId}?returnUrl=${encodeURIComponent(returnUrl)}`
        : `/payment/payment/vnpay/${invoiceId}`;
      const paymentResponse = await httpClient.post(url);
      const paymentUrl = paymentResponse.data?.result?.paymentUrl;

      if (!paymentUrl || typeof paymentUrl !== "string") {
        throw new Error("Không nhận được đường dẫn thanh toán VNPay");
      }

      window.location.replace(paymentUrl);
    } catch (error: any) {
      console.error("Error initiating VNPay payment:", error);
      setPaymentError(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể khởi tạo thanh toán VNPay",
      );
    } finally {
      setIsPaying(false);
    }
  };

  const handleCashPayment = async () => {
    if (isPaying) return;
    setPaymentError(null);
    setIsPaying(true);

    try {
      // Lấy invoice đã tạo sẵn từ booking (auto-created qua Kafka)
      const invoiceRes = await httpClient.get(`/payment/invoices/booking/${bookingId}`);
      const invoiceId = invoiceRes.data?.result?.id;

      if (!invoiceId) {
        throw new Error("Không tìm thấy hóa đơn cho booking này");
      }

      // Confirm thanh toán tiền mặt
      await httpClient.post(`/payment/payment/cash/${invoiceId}`);

      onPaymentSuccess();
    } catch (error: any) {
      console.error("Error processing cash payment:", error);
      setPaymentError(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể xử lý thanh toán tiền mặt",
      );
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">Payment</p>
          <h2 className="text-2xl font-bold text-gray-900">
            Complete your booking
          </h2>
          <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Secure checkout
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Method
            </h3>
            <p className="text-sm text-gray-500">Choose how you want to pay</p>
          </div>

          <div className="space-y-3">
            {methods.map((method) => {
              const Icon = method.icon;
              const isActive = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  className={`w-full border rounded-lg px-4 py-3 text-left transition flex items-center gap-3 ${
                    isActive
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-400"
                  }`}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    setPaymentError(null);
                  }}
                >
                  <span
                    className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                      isActive
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isActive && (
                      <span className="h-2.5 w-2.5 bg-white rounded-full" />
                    )}
                  </span>
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {method.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {method.description}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {paymentError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {paymentError}
            </div>
          )}

          {returnResult && (
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <div className="font-semibold">VNPay response</div>
              <div>Code: {returnResult.code || "--"}</div>
              {returnResult.message && (
                <div>Message: {returnResult.message}</div>
              )}
              {returnResult.txnRef && (
                <div>Transaction: {returnResult.txnRef}</div>
              )}
              {typeof returnResult.amount === "number" && (
                <div>Amount: {returnResult.amount.toLocaleString()} VND</div>
              )}
              {returnResult.orderInfo && (
                <div>Info: {returnResult.orderInfo}</div>
              )}
            </div>
          )}

          <div className="pt-4 grid gap-3 sm:flex sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600 space-y-1">
              {selectedMethod === "vnpay" ? (
                <>
                  <p>
                    The system will create an invoice and redirect to VNPay
                    sandbox.
                  </p>
                  <p className="text-gray-500">
                    Keep this tab open after payment to update status.
                  </p>
                </>
              ) : (
                <p>Collect cash and confirm the booking.</p>
              )}
            </div>

            {selectedMethod === "vnpay" ? (
              <Button
                onClick={handleVnpayPayment}
                disabled={isPaying || isVerifyingReturn}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPaying ? "Redirecting..." : "Pay with VNPay"}
              </Button>
            ) : (
              <Button
                onClick={handleCashPayment}
                disabled={isPaying || isVerifyingReturn}
                variant="outline"
              >
                {isPaying ? "Confirming..." : "Confirm cash payment"}
              </Button>
            )}

            {isVerifyingReturn && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying VNPay response...
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order Summary
            </h3>
            <p className="text-sm text-gray-500">
              Review your selection before paying
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{movie.title}</p>
                <p className="text-gray-500">
                  {format(new Date(showtime.time), "PPpp")}
                </p>
                <p className="text-gray-500">
                  {showtime.cinemaName} • {showtime.roomName}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
                Seats ({selectedSeats.length})
              </span>
              <span className="font-semibold text-gray-900">
                {seatTotal.toLocaleString()} VND
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-gray-700">
              {selectedSeats
                .slice()
                .sort((a, b) => {
                  if (a.row === b.row) return a.number - b.number;
                  return a.row.localeCompare(b.row);
                })
                .map((seat) => (
                  <span
                    key={seat.id}
                    className="px-2 py-1 rounded bg-gray-100 font-semibold text-xs"
                  >
                    {seat.row}
                    {seat.number}
                  </span>
                ))}
            </div>

            {selectedCombos.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Combos</span>
                  <span className="font-semibold text-gray-900">
                    {comboTotal.toLocaleString()} VND
                  </span>
                </div>
                <div className="space-y-1 text-gray-700">
                  {selectedCombos.map((combo) => (
                    <div
                      key={combo.id}
                      className="flex justify-between text-xs"
                    >
                      <span>
                        {combo.name} × {combo.quantity || 1}
                      </span>
                      <span className="font-semibold">
                        {(combo.price * (combo.quantity || 1)).toLocaleString()}{" "}
                        VND
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                {subtotal.toLocaleString()} VND
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-{discount.toLocaleString()} VND</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t pt-3 text-base font-bold text-blue-700">
              <span>Total</span>
              <span className="text-2xl">{total.toLocaleString()} VND</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
