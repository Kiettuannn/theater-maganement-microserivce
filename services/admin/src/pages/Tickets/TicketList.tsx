import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Ticket, Search, CheckCircle2, XCircle, Clock, Calendar, MapPin, DollarSign, ShoppingCart, Plus, Minus } from "lucide-react";
import { ticketService, TicketStatus } from "@/services/ticketService";
import type { TicketResponse, ComboCheckInResponse } from "@/services/ticketService";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function TicketList() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [combos, setCombos] = useState<ComboCheckInResponse[]>([]);
  // key = selectionKey (bookingComboId or bookingComboId-index), value = { bookingComboId, quantity }
  const [selectedCombos, setSelectedCombos] = useState<Map<string, { bookingComboId: string; quantity: number }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const { addNotification } = useNotificationStore();

  const handleSearchTicket = async () => {
    if (!ticketCode.trim()) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Please enter a ticket code",
      });
      return;
    }

    setLoading(true);
    setSelectedCombos(new Map());
    setCombos([]);
    try {
      // Call combined API to get ticket and combos
      const checkInView = await ticketService.getTicketCheckInView(ticketCode);
      console.log("=== Check-in view data received ===");
      console.log("Full data:", JSON.stringify(checkInView, null, 2));
      
      setTicket(checkInView.ticket);
      setCombos(checkInView.comboCheckIn || []);
      
      console.log("Ticket set:", checkInView.ticket);
      console.log("Combos set:", checkInView.comboCheckIn);
      console.log("Number of combos:", checkInView.comboCheckIn?.length || 0);
      
      if (checkInView.comboCheckIn && checkInView.comboCheckIn.length > 0) {
        addNotification({
          type: "info",
          title: "Combos Found",
          message: `Found ${checkInView.comboCheckIn.length} combo(s) for this booking`,
        });
      }
      
      addNotification({
        type: "success",
        title: "Success",
        message: "Ticket found successfully",
      });
    } catch (error: any) {
      console.error("=== Error fetching check-in view ===");
      console.error("Error:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Ticket not found",
      });
      setTicket(null);
      setCombos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!ticket) return;

    setCheckingIn(true);
    try {
      // Prepare combo use list
      const comboUseList = Array.from(selectedCombos.values()).map(({ bookingComboId, quantity }) => ({
        comboId: bookingComboId,
        quantity,
      }));

      await ticketService.checkInTicket(ticket.ticketCode, comboUseList);
      addNotification({
        type: "success",
        title: "Success",
        message: "Ticket checked in successfully",
      });
      // Refresh ticket data with combos
      const updatedCheckInView = await ticketService.getTicketCheckInView(ticket.ticketCode);
      setTicket(updatedCheckInView.ticket);
      setCombos(updatedCheckInView.comboCheckIn || []);
      setSelectedCombos(new Map());
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to check in ticket",
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const toggleComboSelection = (
    selectionKey: string,
    bookingComboId: string,
    available: number
  ) => {
    const newSelection = new Map(selectedCombos);
    const current = newSelection.get(selectionKey)?.quantity || 0;
    
    if (current === 0) {
      newSelection.set(selectionKey, { bookingComboId, quantity: 1 });
    } else if (current < available) {
      newSelection.set(selectionKey, { bookingComboId, quantity: current + 1 });
    } else {
      newSelection.delete(selectionKey);
    }
    
    setSelectedCombos(newSelection);
  };

  const updateComboQuantity = (
    selectionKey: string,
    bookingComboId: string,
    quantity: number,
    maxQuantity: number
  ) => {
    const newSelection = new Map(selectedCombos);
    
    if (quantity <= 0) {
      newSelection.delete(selectionKey);
    } else if (quantity <= maxQuantity) {
      newSelection.set(selectionKey, { bookingComboId, quantity });
    }
    
    setSelectedCombos(newSelection);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.ACTIVE:
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case TicketStatus.USED:
        return <Badge className="bg-blue-500 hover:bg-blue-600">Checked In</Badge>;
      case TicketStatus.EXPIRED:
        return <Badge variant="destructive">Expired</Badge>;
      case TicketStatus.CANCELLED:
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const qrImageUrl = ticket?.qrContent
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(ticket.qrContent)}`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Management"
        description="Search and check-in customer tickets"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Ticket Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="ticketCode">Ticket Code</Label>
              <Input
                id="ticketCode"
                placeholder="Enter ticket code"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchTicket();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearchTicket} disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" fullScreen={false} message="" />
                    <span className="ml-2">Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {ticket ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ticket Details</CardTitle>
              {getStatusBadge(ticket.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Ticket className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ticket Code</p>
                    <p className="text-lg font-semibold">{ticket.ticketCode}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Movie</p>
                    <p className="text-lg font-semibold">{ticket.movieTitle}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Showtime</p>
                    <p className="text-base">{formatDate(ticket.startTime)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Seat</p>
                    <p className="text-base font-medium">{ticket.seatName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Price</p>
                    <p className="text-base font-medium">{formatPrice(ticket.price)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expires At</p>
                    <p className="text-base">{formatDate(ticket.expiresAt)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p className="text-base">{formatDate(ticket.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {ticket.qrContent && (
              <>
                <Separator />
                <div className="grid gap-4 md:grid-cols-[240px,1fr] items-start">
                  <div className="flex justify-center">
                    <img
                      src={qrImageUrl}
                      alt="Ticket QR"
                      className="h-60 w-60 rounded-lg border bg-white p-3 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">QR Code Content</p>
                    <div className="rounded-md bg-muted p-3">
                      <code className="text-sm break-all">{ticket.qrContent}</code>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {combos.length > 0 && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Available Combos</h3>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    {combos.map((bookingCombo, index) => {
                      const combo = bookingCombo.combo;
                      // Create a selection key; if backend sends duplicate bookingComboId, include index to keep it unique in UI state
                      const selectionKey = `${bookingCombo.bookingComboId}-${index}`;
                      const selectedEntry = selectedCombos.get(selectionKey);
                      const selectedQty = selectedEntry?.quantity || 0;
                      const maxAvailable = bookingCombo.remain;
                      const uniqueKey = selectionKey;
                      
                      return (
                        <div
                          key={uniqueKey}
                          className={`border rounded-lg p-4 transition-all ${
                            selectedQty > 0
                              ? "border-green-500 bg-green-50"
                              : "border-border hover:border-primary hover:bg-accent/50"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-semibold">{combo.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{combo.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">Available: {maxAvailable}</p>
                              </div>
                              {combo.imageUrl && (
                                <img
                                  src={combo.imageUrl}
                                  alt={combo.name}
                                  className="w-16 h-16 rounded object-cover"
                                />
                              )}
                            </div>
                            
                            {bookingCombo.comboItemResponseList.length > 0 && (
                              <div className="space-y-1 text-sm">
                                <p className="font-medium text-muted-foreground">Items:</p>
                                <ul className="ml-4 space-y-0.5">
                                  {bookingCombo.comboItemResponseList.map((item) => (
                                    <li key={item.id} className="text-muted-foreground">
                                      • {item.name} x{item.quantity}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-2 border-t">
                              <p className="font-semibold text-green-600">{formatPrice(combo.price)}</p>
                              
                              <div className="flex items-center gap-2">
                                {selectedQty > 0 ? (
                                  <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => updateComboQuantity(selectionKey, bookingCombo.bookingComboId, selectedQty - 1, maxAvailable)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center font-semibold text-sm">
                                      {selectedQty}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => updateComboQuantity(selectionKey, bookingCombo.bookingComboId, selectedQty + 1, maxAvailable)}
                                      className="h-6 w-6 p-0"
                                      disabled={selectedQty >= maxAvailable}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleComboSelection(selectionKey, bookingCombo.bookingComboId, maxAvailable)}
                                    className="gap-1"
                                    disabled={maxAvailable === 0}
                                  >
                                    <Plus className="h-3 w-3" />
                                    Select
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Separator />
              </>
            )}

            <div className="flex justify-end gap-4">
              {ticket.status === TicketStatus.ACTIVE ? (
                <Button
                  size="lg"
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {checkingIn ? (
                    <>
                      <LoadingSpinner size="sm" fullScreen={false} message="" />
                      <span className="ml-2">Checking In...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Check In Ticket
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  {ticket.status === TicketStatus.USED ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                      <span>This ticket has already been checked in</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span>This ticket cannot be checked in ({ticket.status.toLowerCase()})</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-orange-100 p-6">
              <Search className="h-12 w-12 text-orange-600" />
            </div>
            <h3 className="text-2xl font-semibold">Please Enter Ticket Information</h3>
            <p className="text-muted-foreground max-w-md">
              Enter a ticket code in the search box above to view ticket details and perform check-in
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
