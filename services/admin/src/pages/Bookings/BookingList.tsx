import { useState, useEffect } from "react"
import { Search, Filter, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { getBookingList } from "@/services/bookingService"
import type { BookingListItem } from "@/services/bookingService"

const BOOKING_STATUSES = [
  { value: "", label: "All" },
  { value: "INITIATED", label: "Initiated" },
  { value: "PAYMENT_PENDING", label: "Payment Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed" },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  INITIATED:       { bg: "bg-yellow-100", text: "text-yellow-700" },
  PAYMENT_PENDING: { bg: "bg-blue-100",   text: "text-blue-700" },
  CONFIRMED:       { bg: "bg-green-100",  text: "text-green-700" },
  COMPLETED:       { bg: "bg-emerald-100",text: "text-emerald-700" },
  CANCELLED:       { bg: "bg-red-100",    text: "text-red-700" },
  FAILED:          { bg: "bg-gray-100",   text: "text-gray-600" },
}

export const BookingList = () => {
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [emailSearch, setEmailSearch] = useState("")
  const [movieSearch, setMovieSearch] = useState("")
  const [status, setStatus] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Fetch bookings
  const fetchBookings = async () => {
    setLoading(true)
    try {
      const data = await getBookingList(
        status || undefined,
        customerSearch || undefined,
        emailSearch || undefined,
        movieSearch || undefined,
        currentPage,
        pageSize
      )
      setBookings(data.bookings)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch when filters change
  useEffect(() => {
    setCurrentPage(0)
    fetchBookings()
  }, [customerSearch, emailSearch, movieSearch, status, pageSize])

  // Fetch when page changes
  useEffect(() => {
    fetchBookings()
  }, [currentPage])

  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearch(e.target.value)
  }

  const handleEmailSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailSearch(e.target.value)
  }

  const handleMovieSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMovieSearch(e.target.value)
  }

  const handleStatusFilter = (value: string) => {
    setStatus(value)
  }

  const getStatusLabel = (status: string) => {
    return BOOKING_STATUSES.find(s => s.value === status)?.label || status
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "—"
    try {
      // BE trả về "2026-06-26 15:38:00" (space), cần đổi thành ISO "2026-06-26T15:38:00"
      const normalized = dateString.replace(" ", "T")
      const date = new Date(normalized)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-gray-600 mt-2">Track and manage customer bookings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Search Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={customerSearch}
              onChange={handleCustomerSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by email..."
              value={emailSearch}
              onChange={handleEmailSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by movie title..."
              value={movieSearch}
              onChange={handleMovieSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="text-gray-600 w-5 h-5" />
          <span className="text-gray-700 font-medium">Status:</span>
          <div className="flex flex-wrap gap-2">
            {BOOKING_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusFilter(s.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === s.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 text-lg">No bookings found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Booking Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Showtime ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Seats</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Expires At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.bookingCode}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">{booking.userId || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">{booking.showtimeId || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center">{booking.seatCount}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(booking.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            STATUS_COLORS[booking.status]?.bg || "bg-gray-100"
                          } ${STATUS_COLORS[booking.status]?.text || "text-gray-800"}`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(booking.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{booking.expiresAt ? formatDate(booking.expiresAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {bookings.length} / {totalElements} results
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = []
                    const maxPages = 5
                    let startPage = Math.max(0, currentPage - Math.floor(maxPages / 2))
                    let endPage = Math.min(totalPages, startPage + maxPages)
                    
                    // Adjust startPage if we're near the end
                    if (endPage - startPage < maxPages) {
                      startPage = Math.max(0, endPage - maxPages)
                    }

                    // Add first page button if not visible
                    if (startPage > 0) {
                      pages.push(
                        <button
                          key={0}
                          onClick={() => setCurrentPage(0)}
                          className="px-3 py-1 rounded text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          1
                        </button>
                      )
                      if (startPage > 1) {
                        pages.push(
                          <span key="dots-start" className="px-2 text-gray-500">
                            ...
                          </span>
                        )
                      }
                    }

                    // Add visible page buttons
                    for (let i = startPage; i < endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            currentPage === i
                              ? "bg-blue-500 text-white"
                              : "hover:bg-gray-200 text-gray-700"
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    }

                    // Add last page button if not visible
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="dots-end" className="px-2 text-gray-500">
                            ...
                          </span>
                        )
                      }
                      pages.push(
                        <button
                          key={totalPages - 1}
                          onClick={() => setCurrentPage(totalPages - 1)}
                          className="px-3 py-1 rounded text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          {totalPages}
                        </button>
                      )
                    }

                    return pages
                  })()}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="5">5 items</option>
                <option value="10">10 items</option>
                <option value="20">20 items</option>
                <option value="50">50 items</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

