import httpClient from "@/configurations/httpClient"
import type { ApiResponse } from "@/utils/apiResponse"
import type { Seat, Showtime, ComboItem } from "./types"

// Re-export types
export type { Seat, Showtime, ComboItem }

// Map showtime (from catalog /showtimes/{id}) to internal Showtime type
export function mapScreeningToShowtime(showtime: any): Showtime {
  return {
    id: showtime.id,
    movieId: showtime.movieId,
    roomId: showtime.roomId,
    cinemaId: showtime.cinemaId,
    time: showtime.startTime,
    format: "2D",
    price: 100000,
    duration: 120,
  }
}

// Map seat from booking seat-reservation response
export function mapScreeningSeatToSeat(seat: any, _index: number): Seat | null {
  if (!seat) return null

  const row = seat.rowLabel || "A"
  const seatNumber = seat.seatNumber || 1

  const seatTypeUpper = (seat.seatType || "").toUpperCase()
  let type: "standard" | "vip" | "couple" = "standard"
  if (seatTypeUpper === "VIP") {
    type = "vip"
  } else if (seatTypeUpper === "COUPLE") {
    type = "couple"
  }

  // AVAILABLE means not yet booked
  const isAvailable = seat.status === "AVAILABLE"
  const price = seat.price ? Number(seat.price) : undefined

  return {
    // Use seatReservationId as the seat id — this is what createBooking needs as screeningSeatIds
    id: seat.seatReservationId || seat.seatId || `${row}-${seatNumber}`,
    row,
    number: seatNumber,
    type,
    isAvailable,
    price,
  }
}

/**
 * GET /booking/seat-reservations/{showtimeId}
 * Returns seat map (all seats with availability status) for a showtime.
 */
export async function getScreeningSeatsByScreeningId(showtimeId: string): Promise<any[]> {
  try {
    const response = await httpClient.get<ApiResponse<any[]>>(
      `/booking/seat-reservations/${showtimeId}`
    )
    return response.data.result || []
  } catch (error) {
    console.error("Error fetching seat reservations:", error)
    throw error
  }
}

/**
 * GET /catalog/showtimes/{showtimeId}
 * Get showtime detail by ID.
 */
export async function getScreeningById(showtimeId: string): Promise<any> {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      `/catalog/showtimes/${showtimeId}`
    )
    return response.data.result
  } catch (error) {
    console.error("Error fetching showtime:", error)
    throw error
  }
}

/**
 * GET /catalog/combos
 */
export async function getCombos(): Promise<ComboItem[]> {
  try {
    const response = await httpClient.get<ApiResponse<any[]>>("/catalog/combos")
    const combos = response.data.result || []
    return combos.map((combo: any) => ({
      id: combo.id,
      name: combo.name,
      description: combo.description,
      price: combo.price,
      deleted: combo.deleted,
    }))
  } catch (error) {
    console.error("Error fetching combos:", error)
    throw error
  }
}

/**
 * GET /catalog/comboItems/combo/{comboId}
 */
export async function getComboItemsByComboId(comboId: string): Promise<any[]> {
  try {
    const response = await httpClient.get<ApiResponse<any[]>>(
      `/catalog/comboItems/combo/${comboId}`
    )
    return response.data.result || []
  } catch (error) {
    console.error("Error fetching combo items:", error)
    return []
  }
}

// Map combo for display
export function mapComboForDisplay(combo: any): ComboItem {
  return {
    id: combo.id,
    name: combo.name,
    description: combo.description || "",
    price: combo.price || 0,
    imageUrl: combo.imageUrl || combo.image || "",
    deleted: combo.deleted || false,
  }
}

// Map combo item detail
export function mapComboItemDetail(item: any): any {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
  }
}
