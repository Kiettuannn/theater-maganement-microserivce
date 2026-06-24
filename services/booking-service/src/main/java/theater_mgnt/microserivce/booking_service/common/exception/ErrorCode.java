package theater_mgnt.microserivce.booking_service.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    // System
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(1002, "Invalid request data", HttpStatus.BAD_REQUEST),

    // Booking
    BOOKING_NOT_EXISTED(3001, "Booking not found", HttpStatus.NOT_FOUND),
    BOOKING_CANNOT_CONFIRM(3002, "Only PENDING bookings can be confirmed", HttpStatus.BAD_REQUEST),
    BOOKING_CANNOT_CANCEL(3003, "Booking cannot be cancelled in current state", HttpStatus.BAD_REQUEST),
    BOOKING_EXPIRED(3004, "Booking has expired", HttpStatus.BAD_REQUEST),
    BOOKING_NOT_PENDING(3005, "Booking is not in PENDING state", HttpStatus.BAD_REQUEST),
    BOOKING_SEATS_REQUIRED(3006, "At least one seat must be selected", HttpStatus.BAD_REQUEST),
    BOOKING_EXCEED_SEAT_LIMIT(3007, "Maximum 8 seats per booking", HttpStatus.BAD_REQUEST),
    BOOKING_ALREADY_EXISTS(3008, "Booking already exists for this session", HttpStatus.CONFLICT),

    // Seat reservation
    SCREENING_SEATS_NOT_AVAILABLE(3010, "One or more seats are not available", HttpStatus.CONFLICT),
    SEAT_RESERVATION_NOT_FOUND(3011, "Seat reservation not found", HttpStatus.NOT_FOUND),
    SCREENING_SEAT_NOT_EXISTED(3012, "Seat not found in this showtime", HttpStatus.NOT_FOUND),

    // Ticket
    TICKET_NOT_EXISTED(3020, "Ticket not found", HttpStatus.NOT_FOUND),
    TICKET_NOT_ACTIVE(3021, "Ticket is not active", HttpStatus.BAD_REQUEST),
    TICKET_EXPIRED(3022, "Ticket has expired", HttpStatus.BAD_REQUEST),
    TICKET_ALREADY_USED(3023, "Ticket has already been used", HttpStatus.BAD_REQUEST),

    // Combo
    COMBO_NOT_EXISTED(3030, "Combo not found", HttpStatus.NOT_FOUND),
    COMBO_NAME_EXISTED(3031, "Combo name already exists", HttpStatus.CONFLICT),
    COMBO_EXISTED(3031, "Combo already exists", HttpStatus.CONFLICT),
    COMBO_ITEM_NOT_EXISTED(3032, "Combo item not found", HttpStatus.NOT_FOUND),
    COMBO_ITEM_EXISTED(3034, "Combo item already exists", HttpStatus.CONFLICT),
    BOOKING_COMBO_NOT_EXISTED(3033, "Booking combo not found", HttpStatus.NOT_FOUND),

    // Catalog service (OpenFeign / Kafka events)
    SCREENING_NOT_EXISTED(4001, "Showtime not found", HttpStatus.NOT_FOUND),
    SCREENING_NOT_AVAILABLE(4002, "Showtime is not available for booking", HttpStatus.BAD_REQUEST),
    SCREENING_ALREADY_STARTED(4003, "Showtime has already started", HttpStatus.BAD_REQUEST),
    CATALOG_SERVICE_UNAVAILABLE(4004, "Catalog service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),
    PRICE_CONFIG_NOT_FOUND(4005, "Price configuration not found for this seat type", HttpStatus.NOT_FOUND);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
