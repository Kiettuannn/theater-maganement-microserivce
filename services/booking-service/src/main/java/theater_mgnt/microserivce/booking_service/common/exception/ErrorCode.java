package theater_mgnt.microserivce.booking_service.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    // ── System ────────────────────────────────────────────────────────────────
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error",         HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY            (1001, "Invalid message key",         HttpStatus.BAD_REQUEST),
    INVALID_REQUEST        (1002, "Invalid request data",        HttpStatus.BAD_REQUEST),

    // ── Booking ───────────────────────────────────────────────────────────────
    BOOKING_NOT_EXISTED        (3001, "Booking not found",                           HttpStatus.NOT_FOUND),
    BOOKING_CANNOT_CONFIRM     (3002, "Booking cannot be confirmed in current state", HttpStatus.BAD_REQUEST),
    BOOKING_CANNOT_CANCEL      (3003, "Booking cannot be cancelled in current state", HttpStatus.BAD_REQUEST),
    BOOKING_EXPIRED            (3004, "Booking has expired",                          HttpStatus.BAD_REQUEST),
    BOOKING_NOT_INITIATED      (3005, "Booking is not in INITIATED state",            HttpStatus.BAD_REQUEST),
    BOOKING_SEATS_REQUIRED     (3006, "At least one seat must be selected",           HttpStatus.BAD_REQUEST),
    BOOKING_EXCEED_SEAT_LIMIT  (3007, "Maximum 8 seats per booking",                  HttpStatus.BAD_REQUEST),
    BOOKING_ALREADY_EXISTS     (3008, "Booking already exists for this idempotency key", HttpStatus.CONFLICT),

    // ── Seat Reservation ──────────────────────────────────────────────────────
    SHOWTIME_SEATS_NOT_AVAILABLE(3010, "One or more seats are not available",         HttpStatus.CONFLICT),
    SEAT_RESERVATION_NOT_FOUND  (3011, "Seat reservation not found",                  HttpStatus.NOT_FOUND),
    SCREENING_SEAT_NOT_EXISTED  (3012, "Seat not found in this showtime",             HttpStatus.NOT_FOUND),
    SEAT_ALREADY_LOCKED         (3013, "Seat is currently held by another user",      HttpStatus.CONFLICT),
    ORPHAN_SEAT_VIOLATION       (3014, "Seat selection would leave an isolated seat",  HttpStatus.BAD_REQUEST),

    // ── Ticket ────────────────────────────────────────────────────────────────
    TICKET_NOT_EXISTED  (3020, "Ticket not found",             HttpStatus.NOT_FOUND),
    TICKET_NOT_ACTIVE   (3021, "Ticket is not active",         HttpStatus.BAD_REQUEST),
    TICKET_EXPIRED      (3022, "Ticket has expired",           HttpStatus.BAD_REQUEST),
    TICKET_ALREADY_USED (3023, "Ticket has already been used", HttpStatus.BAD_REQUEST),

    // ── Combo ─────────────────────────────────────────────────────────────────
    COMBO_NOT_EXISTED          (3030, "Combo not found or unavailable",         HttpStatus.NOT_FOUND),
    BOOKING_COMBO_NOT_EXISTED  (3033, "Booking combo not found",                HttpStatus.NOT_FOUND),
    INSUFFICIENT_COMBO_QUANTITY(3034, "Insufficient combo quantity at check-in", HttpStatus.BAD_REQUEST),

    // ── Loyalty Points ────────────────────────────────────────────────────────
    INSUFFICIENT_LOYALTY_POINTS(3040, "Insufficient loyalty points to redeem", HttpStatus.BAD_REQUEST),

    // ── Idempotency ───────────────────────────────────────────────────────────
    IDEMPOTENCY_KEY_CONFLICT(3050, "Same idempotency key reused with a different request payload", HttpStatus.CONFLICT),

    // ── Catalog Service (Feign / Kafka) ───────────────────────────────────────
    SHOWTIME_NOT_EXISTED         (4001, "Showtime not found",                          HttpStatus.NOT_FOUND),
    SHOWTIME_NOT_AVAILABLE       (4002, "Showtime is not available for booking",        HttpStatus.BAD_REQUEST),
    SHOWTIME_ALREADY_STARTED     (4003, "Showtime has already started",                 HttpStatus.BAD_REQUEST),
    CATALOG_SERVICE_UNAVAILABLE  (4004, "Catalog service is unavailable",               HttpStatus.SERVICE_UNAVAILABLE),

    // ── Auth ─────────────────────────────────────────────────────────────────
    UNAUTHORIZED(4030, "User does not own this ticket or booking", HttpStatus.FORBIDDEN);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
