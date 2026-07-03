import type { Seat } from "@/lib/types"

/**
 * Kiểm tra xem việc chọn ghế có tạo ra "orphan seat" (ghế trống đơn lẻ) hay không.
 * Logic tương tự như backend validateScreeningSeat trong BookingServiceImpl.java
 * 
 * Orphan seat là ghế trống nằm giữa:
 * - Hai ghế đã chọn
 * - Ghế đã chọn và ghế đã bán (occupied)
 * 
 * @param allSeats - Tất cả ghế trong phòng chiếu
 * @param selectedSeatIds - Danh sách ID ghế đang được chọn
 * @returns Object chứa isValid và message lỗi nếu có
 */
export function validateOrphanSeats(
  allSeats: Seat[],
  selectedSeatIds: string[]
): { isValid: boolean; message?: string } {
  if (selectedSeatIds.length === 0) {
    return { isValid: true }
  }

  // Nhóm ghế theo hàng
  const seatsByRow = allSeats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = []
    }
    acc[seat.row].push(seat)
    return acc
  }, {} as Record<string, Seat[]>)

  // Lấy danh sách các hàng có ghế được chọn
  const selectedSeats = allSeats.filter(s => selectedSeatIds.includes(s.id))
  const affectedRows = new Set(selectedSeats.map(s => s.row))

  // Kiểm tra từng hàng
  for (const row of affectedRows) {
    const rowSeats = seatsByRow[row]
    if (!rowSeats) continue

    const validationResult = checkOrphanSeatInRow(rowSeats, selectedSeatIds)
    if (!validationResult.isValid) {
      return validationResult
    }
  }

  return { isValid: true }
}

/**
 * Kiểm tra orphan seat trong một hàng ghế cụ thể
 */
function checkOrphanSeatInRow(
  rowSeats: Seat[],
  selectedSeatIds: string[]
): { isValid: boolean; message?: string } {
  // Sắp xếp ghế theo số ghế
  const sortedSeats = [...rowSeats].sort((a, b) => a.number - b.number)
  
  const size = sortedSeats.length
  const statusMap: number[] = new Array(size).fill(0)
  const selectedIndices: number[] = []

  // Tạo status map:
  // 0 = Available (có thể chọn)
  // 1 = Occupied/Out of range (đã bán hoặc không khả dụng)
  // 2 = Selected (đang chọn)
  for (let i = 0; i < size; i++) {
    const seat = sortedSeats[i]
    if (selectedSeatIds.includes(seat.id)) {
      statusMap[i] = 2
      selectedIndices.push(i)
    } else if (!seat.isAvailable) {
      statusMap[i] = 1
    } else {
      statusMap[i] = 0
    }
  }

  let checkCount = 0
  let checkLeft = 0
  let checkRight = 0
  let checkEmpty = 0

  for (const currentIndex of selectedIndices) {
    // Kiểm tra orphan giữa 2 ghế đã chọn
    // Pattern: [Selected] [Available] [Selected]
    if (getStatus(statusMap, currentIndex - 1) === 0 && getStatus(statusMap, currentIndex - 2) === 2) {
      return {
        isValid: false,
        message: `Không được để trống 1 ghế giữa 2 ghế đã chọn (Hàng ${sortedSeats[0].row})`
      }
    }
    if (getStatus(statusMap, currentIndex + 1) === 0 && getStatus(statusMap, currentIndex + 2) === 2) {
      return {
        isValid: false,
        message: `Không được để trống 1 ghế giữa 2 ghế đã chọn (Hàng ${sortedSeats[0].row})`
      }
    }

    // Kiểm tra orphan bên phải
    // Pattern: [Selected] [Available] [Occupied]
    if (getStatus(statusMap, currentIndex + 1) === 0 && getStatus(statusMap, currentIndex + 2) === 1) {
      checkCount++
      checkRight++
    }

    // Kiểm tra orphan bên trái
    // Pattern: [Occupied] [Available] [Selected]
    if (getStatus(statusMap, currentIndex - 1) === 0 && getStatus(statusMap, currentIndex - 2) === 1) {
      checkCount++
      checkLeft++
    }

    // Kiểm tra khoảng trống an toàn (Safe Gap)
    // Bên phải: [Selected] [Available] [Available]
    if (getStatus(statusMap, currentIndex + 1) === 0 && getStatus(statusMap, currentIndex + 2) === 0) {
      checkEmpty++
    }

    // Bên trái: [Available] [Available] [Selected]
    if (getStatus(statusMap, currentIndex - 1) === 0 && getStatus(statusMap, currentIndex - 2) === 0) {
      checkEmpty++
    }
  }

  // Nếu có ít nhất 2 orphan seats (ở cả 2 bên hoặc 1 bên có 2)
  if (checkCount >= 2) {
    return {
      isValid: false,
      message: `Cách chọn ghế tạo ra nhiều ghế trống đơn lẻ (Hàng ${sortedSeats[0].row})`
    }
  }

  // Nếu có khoảng trống an toàn nhưng vẫn có orphan
  if (checkEmpty > 0 && (checkLeft > 0 || checkRight > 0)) {
    return {
      isValid: false,
      message: `Không được để ghế trống đơn lẻ khi còn khoảng trống lớn hơn (Hàng ${sortedSeats[0].row})`
    }
  }

  return { isValid: true }
}

/**
 * Lấy trạng thái ghế tại index, trả về 1 nếu ngoài phạm vi (coi như occupied)
 */
function getStatus(statusMap: number[], index: number): number {
  if (index < 0 || index >= statusMap.length) {
    return 1 // Ngoài dãy ghế
  }
  return statusMap[index]
}
