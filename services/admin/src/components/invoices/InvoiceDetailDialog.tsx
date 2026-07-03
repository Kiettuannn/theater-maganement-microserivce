import type { InvoiceDetailResponse } from "@/types/InvoiceType/invoice";
import { InvoiceStatus } from "@/types/InvoiceType/invoice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle2, XCircle, RefreshCcw, Calendar, Film } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { updateInvoiceStatus } from "@/services/invoiceService";
import { useNotificationStore } from "@/stores";

interface InvoiceDetailDialogProps {
  invoice: InvoiceDetailResponse | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const getStatusBadge = (status: InvoiceStatus) => {
  const config = {
    [InvoiceStatus.PENDING]: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800",
      icon: Clock,
    },
    [InvoiceStatus.PAID]: {
      label: "Paid",
      className: "bg-green-100 text-green-800",
      icon: CheckCircle2,
    },
    [InvoiceStatus.FAILED]: {
      label: "Failed",
      className: "bg-red-100 text-red-800",
      icon: XCircle,
    },
    [InvoiceStatus.REFUNDED]: {
      label: "Refunded",
      className: "bg-purple-100 text-purple-800",
      icon: RefreshCcw,
    },
  };

  const statusConfig = config[status];
  const Icon = statusConfig.icon;

  return (
    <Badge className={statusConfig.className}>
      <Icon className="h-3 w-3 mr-1" />
      {statusConfig.label}
    </Badge>
  );
};

export const InvoiceDetailDialog = ({
  invoice,
  open,
  onClose,
  onUpdate,
}: InvoiceDetailDialogProps) => {
  const [updating, setUpdating] = useState(false);
  const addNotification = useNotificationStore((state) => state.addNotification);

  if (!invoice) return null;

  const handleUpdateStatus = async (newStatus: InvoiceStatus) => {
    try {
      setUpdating(true);
      await updateInvoiceStatus(invoice.id, newStatus);
      addNotification({
        title: "Success",
        type: "success",
        message: "Invoice status updated successfully",
      });
      onUpdate?.();
      onClose();
    } catch (error) {
      addNotification({
        title: "Error",
        type: "error",
        message: "Failed to update invoice status",
      });
    } finally {
      setUpdating(false);
    }
  };

  const booking = invoice.bookingDetails;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice Details</span>
            {getStatusBadge(invoice.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice ID</p>
              <p className="font-mono text-sm">{invoice.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-mono text-sm">{invoice.bookingId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created Date</p>
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(invoice.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            {invoice.paidAt && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Paid Date</p>
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {format(new Date(invoice.paidAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Movie & Showtime Info */}
          <div>
            <h3 className="font-semibold mb-3">Booking Details</h3>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Film className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.movie?.title || 'N/A'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(new Date(booking.startTime), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Seats */}
          <div>
            <h3 className="font-semibold mb-3">Seats ({booking.seats.length})</h3>
            <div className="grid grid-cols-2 gap-2">
              {booking.seats.map((seat) => (
                <div
                  key={seat.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm">
                    {seat.seatName || `${seat.rowChair}${seat.seatNumber}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Subtotal: {booking.seatSubtotal.toLocaleString()} VND
            </div>
          </div>

          {/* Combos */}
          {booking.combos && booking.combos.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">
                  Combos ({booking.combos.length})
                </h3>
                <div className="space-y-2">
                  {booking.combos.map((combo) => (
                    <div
                      key={combo.comboId}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm">
                        {combo.comboName} x{combo.quantity}
                      </span>
                      <span className="text-sm font-medium">
                        {combo.subtotal.toLocaleString()} VND
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Subtotal: {booking.comboSubtotal.toLocaleString()} VND
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Total */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{booking.subTotal.toLocaleString()} VND</span>
            </div>
            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{booking.discountAmount.toLocaleString()} VND</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-blue-600">
                {invoice.totalAmount.toLocaleString()} VND
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {invoice.status === InvoiceStatus.PAID && (
            <Button
              variant="outline"
              onClick={() => handleUpdateStatus(InvoiceStatus.REFUNDED)}
              disabled={updating}
              className="text-purple-600 hover:text-purple-700"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refund
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
