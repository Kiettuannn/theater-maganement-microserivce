package theater_mgnt.microserivce.catalog.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),

    // Cinema
    CINEMA_EXISTED(2001, "Cinema existed", HttpStatus.BAD_REQUEST),
    CINEMA_NOT_EXISTED(2002, "Cinema not existed", HttpStatus.BAD_REQUEST),
    CINEMA_HAS_ROOMS(2039, "Cannot delete cinema. Please delete all rooms in this cinema first", HttpStatus.BAD_REQUEST),

    // Room
    ROOM_EXISTED(2003, "Room existed", HttpStatus.BAD_REQUEST),
    ROOM_NOT_EXISTED(2004, "Room not existed", HttpStatus.NOT_FOUND),
    ROOM_NAME_INVALID(2053, "Room name must be at least {min} characters", HttpStatus.BAD_REQUEST),
    ROOM_HAS_SCHEDULED_SHOWTIMES(2054, "Cannot modify room because it has upcoming scheduled showtimes", HttpStatus.CONFLICT),

    // SeatType
    SEATTYPE_EXISTED(2005, "Seat type existed", HttpStatus.BAD_REQUEST),
    SEATTYPE_NOT_EXISTED(2006, "Seat type not existed", HttpStatus.BAD_REQUEST),

    // PriceConfig
    PRICECONFIG_NOT_EXISTED(2007, "Price config not existed", HttpStatus.BAD_REQUEST),
    PRICECONFIG_EXISTED(2008, "Price config existed", HttpStatus.BAD_REQUEST),

    // Seat
    SEAT_NOT_EXISTED(2009, "Seat not existed", HttpStatus.BAD_REQUEST),
    SEAT_EXISTED(2010, "Seat existed", HttpStatus.BAD_REQUEST),
    SEAT_NOT_IN_ROOM(2011, "This seat is not in our rooms", HttpStatus.BAD_REQUEST),

    // Combo
    COMBO_EXISTED(2057, "Combo existed", HttpStatus.BAD_REQUEST),
    COMBO_NOT_EXISTED(2058, "Combo not existed", HttpStatus.BAD_REQUEST),
    COMBO_ITEM_EXISTED(2055, "Combo item existed", HttpStatus.BAD_REQUEST),
    COMBO_ITEM_NOT_EXISTED(2056, "Combo item not existed", HttpStatus.BAD_REQUEST),

    // Showtime (renamed from Screening)
    SHOWTIME_EXISTED(2013, "Showtime existed", HttpStatus.BAD_REQUEST),
    SHOWTIME_NOT_EXISTED(2014, "Showtime not existed", HttpStatus.BAD_REQUEST),
    SHOWTIME_CANNOT_UPDATE(2040, "Showtime's status must be scheduled before updating", HttpStatus.BAD_REQUEST),
    SHOWTIME_TIME_INVALID(2041, "Showtime's time must be in the future", HttpStatus.BAD_REQUEST),
    SHOWTIME_TIME_OVERLAP(2042, "Already has the same showtime's time", HttpStatus.BAD_REQUEST),
    SHOWTIME_SEAT_NOT_EXISTED(2043, "Showtime seat not existed", HttpStatus.BAD_REQUEST),
    SHOWTIME_SEAT_EXISTED(2044, "Showtime seat existed", HttpStatus.BAD_REQUEST),
    SHOWTIME_SEAT_CANNOT_DELETE(2045, "Only showtime seats with AVAILABLE status can be deleted", HttpStatus.BAD_REQUEST),
    SHOWTIME_SEAT_INVALID_STATUS_CHANGE(2046, "Cannot change showtime seat's status (SOLD)", HttpStatus.BAD_REQUEST),

    // AgeRating
    AGERATING_EXISTED(2015, "Age rating existed", HttpStatus.BAD_REQUEST),
    AGERATING_NOT_EXISTED(2016, "Age rating not existed", HttpStatus.NOT_FOUND),
    INVALID_AGERATING_ID(2017, "Age rating ID must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    INVALID_AGERATING_CODE(2018, "Age rating code must be between {min} and {max} characters", HttpStatus.BAD_REQUEST),
    INVALID_AGERATING_DESCRIPTION(2019, "Age rating description must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    AGERATING_CODE_EXISTED(2036, "Age rating code existed", HttpStatus.BAD_REQUEST),

    // Genre
    GENRE_EXISTED(2020, "Genre existed", HttpStatus.BAD_REQUEST),
    GENRE_NOT_EXISTED(2021, "Genre not existed", HttpStatus.NOT_FOUND),
    GENRE_ID_REQUIRED(2022, "Genre ID is required", HttpStatus.BAD_REQUEST),
    INVALID_GENRE_ID(2023, "Genre ID must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    GENRE_NAME_REQUIRED(2024, "Genre name is required", HttpStatus.BAD_REQUEST),
    INVALID_GENRE_NAME(2025, "Genre name must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    GENRE_NAME_EXISTED(2037, "Genre name existed", HttpStatus.BAD_REQUEST),

    // Movie
    MOVIE_EXISTED(2026, "Movie existed", HttpStatus.BAD_REQUEST),
    MOVIE_NOT_EXISTED(2027, "Movie not existed", HttpStatus.NOT_FOUND),
    INVALID_MOVIE_TITLE(2028, "Movie title must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    INVALID_MOVIE_DESCRIPTION(2029, "Movie description must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    INVALID_MOVIE_DURATION(2030, "Movie duration must be between {min} and {max} minutes", HttpStatus.BAD_REQUEST),
    INVALID_MOVIE_DIRECTOR(2031, "Movie director must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    INVALID_MOVIE_CAST(2032, "Movie cast must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    INVALID_POSTER_URL(2033, "Poster URL must be a valid URL", HttpStatus.BAD_REQUEST),
    INVALID_TRAILER_URL(2034, "Trailer URL must be a valid URL", HttpStatus.BAD_REQUEST),
    INVALID_MOVIE_GENRES(2035, "Movie must have between {min} and {max} genres", HttpStatus.BAD_REQUEST),
    MOVIE_HAS_SCHEDULED_SCREENINGS(2038, "Cannot archive movie because it has scheduled screenings", HttpStatus.BAD_REQUEST),

    // Staff / Auth cross-check
    STAFF_NOT_FOUND(2047, "Staff not found", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED_CINEMA_STAFF(2048, "Unauthorized cinema staff", HttpStatus.BAD_REQUEST),

    // Generic
    NOTHING_TO_UPDATE(2050, "Nothing to update", HttpStatus.BAD_REQUEST);

    private int code;
    private String message;
    private HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.message = message;
        this.code = code;
        this.statusCode = statusCode;
    }
}
