"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import QRCode from "qrcode";
import type { Seat, ComboItem } from "../../../lib/types";
import { ticketService, type TicketResponse } from "@/services/ticketService";
import jsPDF from "jspdf";

interface SuccessStepProps {
  bookingId: string;
  selectedSeats: Seat[];
  selectedCombos: ComboItem[];
  total: number;
  onNewBooking: () => void;
  movie?: {
    title: string;
  };
  showtime?: {
    time: string;
    format: string;
  };
}

export default function SuccessStep({
  bookingId,
  selectedSeats,
  selectedCombos,
  total,
  onNewBooking,
  movie,
  showtime,
}: SuccessStepProps) {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [qrCodeUrls, setQrCodeUrls] = useState<string[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [viewMode, setViewMode] = useState<"payment" | "tickets">("payment");
  const [hasLoadedTickets, setHasLoadedTickets] = useState(false);

  // Fetch tickets only when user clicks "View Tickets"
  const handleViewTickets = async () => {
    if (hasLoadedTickets) {
      // Already loaded, just switch view
      setViewMode("tickets");
      return;
    }

    try {
      setIsLoadingTickets(true);
      setViewMode("tickets");
      const fetchedTickets = await ticketService.getTicketsByBooking(bookingId);
      setTickets(fetchedTickets);

      // Generate QR codes for all tickets
      const qrPromises = fetchedTickets.map((ticket) =>
        QRCode.toDataURL(ticket.qrContent || ticket.ticketCode, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        }),
      );
      const qrUrls = await Promise.all(qrPromises);
      setQrCodeUrls(qrUrls);
      setHasLoadedTickets(true);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handlePrevTicket = () => {
    setCurrentTicketIndex((prev) => (prev > 0 ? prev - 1 : tickets.length - 1));
  };

  const handleNextTicket = () => {
    setCurrentTicketIndex((prev) => (prev < tickets.length - 1 ? prev + 1 : 0));
  };

  const generateTicketPage = (
    pdf: jsPDF,
    ticket: TicketResponse,
    qrCodeUrl: string | null,
    pageIndex: number,
  ) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // Add new page if not the first ticket
    if (pageIndex > 0) {
      pdf.addPage();
      yPosition = margin;
    }

    // Background color - White
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, yPosition, contentWidth, pageHeight - margin * 2, "F");

    // Top border - Purple (matching seat-selection purple-600)
    pdf.setDrawColor(147, 51, 234);
    pdf.setLineWidth(3);
    pdf.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3);
    yPosition += 8;

    // Company Name - cifastar (top left)
    pdf.setFontSize(14);
    pdf.setFont("", "bold");
    pdf.setTextColor(147, 51, 234);
    pdf.text("Cifastar", margin + 5, yPosition + 3);
    yPosition += 10;

    // Header - Movie Title (centered)
    pdf.setFontSize(18);
    pdf.setFont("", "bold");
    pdf.setTextColor(147, 51, 234);
    const movieTitle = movie?.title || "MOVIE TICKET";
    pdf.text(movieTitle, pageWidth / 2, yPosition, {
      align: "center",
      maxWidth: contentWidth - 4,
    });
    yPosition += 12;

    // Divider line
    pdf.setDrawColor(168, 85, 247);
    pdf.setLineWidth(0.5);
    pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
    yPosition += 6;

    // QR Code Section
    if (qrCodeUrl) {
      const qrSize = 45;
      const qrX = pageWidth / 2 - qrSize / 2;

      // QR Code background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(qrX - 3, yPosition - 2, qrSize + 6, qrSize + 6, "F");

      // QR Code border - Purple
      pdf.setDrawColor(147, 51, 234);
      pdf.setLineWidth(0.5);
      pdf.rect(qrX - 3, yPosition - 2, qrSize + 6, qrSize + 6);

      pdf.addImage(qrCodeUrl, "PNG", qrX, yPosition, qrSize, qrSize);
      yPosition += qrSize + 8;
    }

    // Divider line
    pdf.setDrawColor(168, 85, 247);
    pdf.setLineWidth(0.5);
    pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
    yPosition += 6;

    // Ticket Details Section
    pdf.setFontSize(11);
    pdf.setFont("", "normal");
    pdf.setTextColor(0, 0, 0);

    const labelX = margin + 6;
    const valueX = margin + 60;
    const lineHeight = 8;
    const boxPadding = 3;

    // Seat Info Box - Purple background
    pdf.setFillColor(240, 230, 255);
    pdf.rect(
      margin + 3,
      yPosition - 1,
      contentWidth - 6,
      lineHeight + boxPadding * 2,
      "F",
    );

    pdf.setFont("", "bold");
    pdf.setTextColor(147, 51, 234);
    pdf.setFontSize(12);
    pdf.text("SEAT", labelX, yPosition + boxPadding + 3);
    pdf.setFontSize(14);
    pdf.text(ticket.seatName, valueX, yPosition + boxPadding + 3);
    yPosition += lineHeight + boxPadding * 2 + 2;

    // Details rows
    const details = [
      { label: "Ticket Code:", value: ticket.ticketCode },
      { label: "Showtime:", value: showtime?.time || "N/A" },
      { label: "Format:", value: showtime?.format || "N/A" },
      { label: "Price:", value: `${ticket.price.toLocaleString()} VND` },
    ];

    pdf.setFontSize(10);
    details.forEach((detail, index) => {
      // Alternating background - Light purple
      if (index % 2 === 0) {
        pdf.setFillColor(248, 243, 255);
        pdf.rect(
          margin + 3,
          yPosition - 2,
          contentWidth - 6,
          lineHeight + 2,
          "F",
        );
      }

      pdf.setFont("", "bold");
      pdf.setTextColor(147, 51, 234);
      pdf.text(detail.label, labelX, yPosition + 2);

      pdf.setFont("", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text(detail.value, valueX, yPosition + 2, { maxWidth: 60 });

      yPosition += lineHeight + 3;
    });

    // Divider line
    yPosition += 2;
    pdf.setDrawColor(168, 85, 247);
    pdf.setLineWidth(0.5);
    pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
    yPosition += 6;

    // Bottom Notice Box - Purple theme
    pdf.setFillColor(245, 235, 255);
    pdf.setDrawColor(147, 51, 234);
    pdf.setLineWidth(1);
    pdf.rect(margin + 3, yPosition, contentWidth - 6, 16, "FD");

    pdf.setFontSize(9);
    pdf.setFont("", "bold");
    pdf.setTextColor(147, 51, 234);
    pdf.text("IMPORTANT:", margin + 6, yPosition + 4);

    pdf.setFont("", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(110, 40, 180);
    pdf.text(
      "Please show this QR code at the entrance",
      margin + 6,
      yPosition + 9,
    );

    yPosition += 18;

    // Footer - Purple accent
    pdf.setFontSize(7);
    pdf.setFont("", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Booking ID: ${bookingId}`,
      pageWidth / 2,
      pageHeight - margin - 3,
      { align: "center" },
    );
    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth / 2,
      pageHeight - margin,
      { align: "center" },
    );

    // Bottom border - Purple
    pdf.setDrawColor(147, 51, 234);
    pdf.setLineWidth(1);
    pdf.line(
      margin,
      pageHeight - margin + 1,
      pageWidth - margin,
      pageHeight - margin + 1,
    );
  };

  const handleDownloadTicketPdf = async () => {
    if (!currentTicket) return;

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      generateTicketPage(
        pdf,
        currentTicket,
        qrCodeUrls[currentTicketIndex] || null,
        0,
      );
      pdf.save(`ticket-${currentTicket.ticketCode}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleDownloadAllTicketsPdf = async () => {
    if (tickets.length === 0) return;

    try {
      // Generate a separate PDF file for each ticket
      tickets.forEach((ticket, index) => {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        generateTicketPage(pdf, ticket, qrCodeUrls[index] || null, 0);
        pdf.save(`ticket-${ticket.ticketCode}.pdf`);
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const currentTicket = tickets[currentTicketIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-600" />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Booking Successful!</h2>
        <p className="text-gray-600">Your ticket booking has been completed</p>
      </div>

      <Card className="p-8 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-md mx-auto space-y-6">
          {/* Booking ID */}
          <div className="bg-white rounded-lg p-4 border-2 border-green-200">
            <p className="text-sm text-gray-600 mb-2">Booking ID</p>
            <p className="font-mono text-xl font-bold text-green-700">
              {bookingId}
            </p>
          </div>

          {/* View Mode Toggle */}
          {viewMode === "payment" ? (
            // Payment Confirmation View (Default)
            <div className="space-y-4">
              <h3 className="font-bold text-xl mb-4 text-center">
                Payment Details
              </h3>

              {/* Payment Summary */}
              <div className="bg-white rounded-lg p-4 space-y-3">
                {movie && (
                  <div className="pb-3 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Movie</p>
                    <p className="text-lg font-semibold">{movie.title}</p>
                  </div>
                )}

                {showtime && (
                  <div className="pb-3 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Showtime</p>
                    <p className="text-lg font-semibold">{showtime.time}</p>
                    <p className="text-sm text-gray-600">{showtime.format}</p>
                  </div>
                )}

                {selectedSeats.length > 0 && (
                  <div className="pb-3 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">
                      Seats ({selectedSeats.length})
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedSeats
                        .sort((a, b) => {
                          if (a.row === b.row) {
                            return a.number - b.number;
                          }
                          return a.row.localeCompare(b.row);
                        })
                        .map((seat) => (
                          <span
                            key={seat.id}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold"
                          >
                            {seat.row}
                            {seat.number}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {selectedCombos.length > 0 && (
                  <div className="pb-3 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Combos</p>
                    <div className="space-y-1">
                      {selectedCombos.map((combo) => (
                        <div
                          key={combo.id}
                          className="text-sm flex justify-between"
                        >
                          <span>
                            {combo.name} × {combo.quantity}
                          </span>
                          <span className="font-semibold">
                            {(
                              combo.price * (combo.quantity || 1)
                            ).toLocaleString()}{" "}
                            VND
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Total Paid</span>
                    <span className="text-2xl font-bold text-green-600">
                      {total.toLocaleString()} VND
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleViewTickets}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 flex items-center justify-center gap-2"
                  disabled={isLoadingTickets}
                >
                  <Eye className="w-5 h-5" />
                  {isLoadingTickets ? "Loading Tickets..." : "View Tickets"}
                </Button>
              </div>
            </div>
          ) : (
            // Ticket View
            <div>
              <div className="text-center mb-4">
                <h3 className="font-bold text-xl">Tickets</h3>
              </div>

              {isLoadingTickets ? (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 mt-4">Loading tickets...</p>
                  </div>
                </div>
              ) : tickets.length > 0 ? (
                <div className="relative">
                  {/* Ticket Counter */}
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-3">
                      <button
                        onClick={handlePrevTicket}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={tickets.length <= 1}
                        aria-label="Previous ticket"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <span className="text-lg font-semibold min-w-[100px]">
                        Ticket {currentTicketIndex + 1} / {tickets.length}
                      </span>
                      <button
                        onClick={handleNextTicket}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={tickets.length <= 1}
                        aria-label="Next ticket"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>

                  {/* Ticket Card */}
                  {currentTicket && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
                      {/* QR Code */}
                      <div className="bg-white rounded-xl p-4 mb-4 flex justify-center">
                        {qrCodeUrls[currentTicketIndex] ? (
                          <img
                            src={qrCodeUrls[currentTicketIndex]}
                            alt="Ticket QR Code"
                            className="w-48 h-48"
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                            Loading QR...
                          </div>
                        )}
                      </div>

                      {/* Ticket Details */}
                      <div className="space-y-3 text-center">
                        <div className="pb-3 border-b border-blue-200">
                          <p className="text-sm text-gray-600 mb-1">Seat</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {currentTicket.seatName}
                          </p>
                        </div>

                        {movie && (
                          <div className="pb-3 border-b border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">Movie</p>
                            <p className="text-lg font-semibold">
                              {movie.title}
                            </p>
                          </div>
                        )}

                        {showtime && (
                          <div className="pb-3 border-b border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">
                              Showtime
                            </p>
                            <p className="text-lg font-semibold">
                              {showtime.time}
                            </p>
                            <p className="text-sm text-gray-600">
                              {showtime.format}
                            </p>
                          </div>
                        )}

                        <div className="pb-3 border-b border-blue-200">
                          <p className="text-sm text-gray-600 mb-1">
                            Ticket Code
                          </p>
                          <p className="text-lg font-mono font-bold text-blue-600">
                            {currentTicket.ticketCode}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Price</p>
                          <p className="text-lg font-semibold">
                            {currentTicket.price.toLocaleString()} VND
                          </p>
                        </div>
                      </div>

                      {/* Show at entrance notice */}
                      <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <p className="text-sm text-center font-semibold text-yellow-800">
                          Show this QR code at the entrance
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons below ticket */}
                  <div className="space-y-2 mt-6">
                    <button
                      onClick={handleDownloadTicketPdf}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      Download Current Ticket
                    </button>
                    <button
                      onClick={handleDownloadAllTicketsPdf}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      Download All Tickets ({tickets.length})
                    </button>
                    <Button
                      onClick={() => setViewMode("payment")}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to payment
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p>No tickets found. Please contact support.</p>
                </div>
              )}
            </div>
          )}

          {/* New Booking Button */}
          <Button
            onClick={onNewBooking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
          >
            Create New Booking
          </Button>
        </div>
      </Card>

      <div className="text-center text-sm text-gray-600">
        <p>Booking reference has been sent to the customer email</p>
      </div>
    </div>
  );
}
