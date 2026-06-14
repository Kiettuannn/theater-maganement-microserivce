package theater_mgnt.microserivce.catalog.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR), // Code: 500
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST), // 404

    ROOM_EXISTED(2003, "Room existed", HttpStatus.BAD_REQUEST),
    ROOM_NOT_EXISTED(2004, "Room not existed", HttpStatus.NOT_FOUND),
    ROOM_NAME_INVALID(2038, "Room name must be at least {min} characters", HttpStatus.BAD_REQUEST),
    ROOM_HAS_SCHEDULED_SCREENINGS(2039, "Cannot modify room because it has upcoming scheduled screenings", HttpStatus.CONFLICT),
    SEATTYPE_EXISTED(2005, "Seat type existed", HttpStatus.BAD_REQUEST),
    SEATTYPE_NOT_EXISTED(2006, "Seat type not existed", HttpStatus.BAD_REQUEST),
    PRICECONFIG_NOT_EXISTED(2007, "Price config not existed", HttpStatus.BAD_REQUEST),
    PRICECONFIG_EXISTED(2008, "Price config existed", HttpStatus.BAD_REQUEST),
    SEAT_NOT_EXISTED(2009, "Seat not existed", HttpStatus.BAD_REQUEST),
    SEAT_EXISTED(2010, "Seat existed", HttpStatus.BAD_REQUEST),
    COMBO_EXISTED(2011, "Combo existed", HttpStatus.BAD_REQUEST),
    COMBO_NOT_EXISTED(2012, "Combo not existed", HttpStatus.BAD_REQUEST),
    COMBO_ITEM_EXISTED(2040, "Combo item existed", HttpStatus.BAD_REQUEST),
    COMBO_ITEM_NOT_EXISTED(2041, "Combo item not existed", HttpStatus.BAD_REQUEST),
    SCREENING_EXISTED(2013, "Screening existed", HttpStatus.BAD_REQUEST),
    SCREENING_NOT_EXISTED(2014, "Screening not existed", HttpStatus.BAD_REQUEST),
    SCREENING_SEAT_NOT_EXISTED(4001, "Screening seat not existed", HttpStatus.BAD_REQUEST),
    SCREENING_SEAT_EXISTED(4002, "Screening seat existed", HttpStatus.BAD_REQUEST),
    SCREENING_CANNOT_UPDATE(4003, "Screening's status must be scheduled before updating", HttpStatus.BAD_REQUEST),
    SCREENING_TIME_INVALID(4004, "Screening's time must be in the future", HttpStatus.BAD_REQUEST),
    SCREENING_TIME_OVERLAP(4005, "Already has the same screening's time", HttpStatus.BAD_REQUEST),
    SEAT_NOT_IN_ROOM(4006, "This seat is not in our rooms", HttpStatus.BAD_REQUEST),
    SCREENING_SEAT_INVALID_STATUS_CHANGE(4007, "Cannot change screening seat's status (SOLD)", HttpStatus.BAD_REQUEST),
    SCREENING_SEAT_CANNOT_DELETE(
            4008, "Only screening seats with AVAILABLE status can be deleted", HttpStatus.BAD_REQUEST),
    // AgeRating
    AGERATING_EXISTED(2015, "Age rating existed", HttpStatus.BAD_REQUEST),
    AGERATING_NOT_EXISTED(2016, "Age rating not existed", HttpStatus.NOT_FOUND),
    INVALID_AGERATING_ID(2017, "Age rating ID must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    INVALID_AGERATING_CODE(2018, "Age rating code must be between {min} and {max} characters", HttpStatus.BAD_REQUEST),
    INVALID_AGERATING_DESCRIPTION(
            2019, "Age rating description must not exceed {max} characters", HttpStatus.BAD_REQUEST),
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
    MOVIE_HAS_SCHEDULED_SCREENINGS(
            2042, "Cannot archive movie because it has scheduled screenings", HttpStatus.BAD_REQUEST),

    // Review
    REVIEW_NOT_EXISTED(5001, "Review not existed", HttpStatus.NOT_FOUND),
    REVIEW_ALREADY_EXISTS(5002, "Customer already reviewed this movie", HttpStatus.BAD_REQUEST),
    REVIEW_UNAUTHORIZED(5003, "You are not authorized to modify this review", HttpStatus.FORBIDDEN),
    CUSTOMER_ID_REQUIRED(5004, "Customer ID is required", HttpStatus.BAD_REQUEST),
    MOVIE_ID_REQUIRED(5005, "Movie ID is required", HttpStatus.BAD_REQUEST),
    RATING_REQUIRED(5006, "Rating is required", HttpStatus.BAD_REQUEST),
    RATING_MIN_0_5(5007, "Rating must be at least 0.5", HttpStatus.BAD_REQUEST),
    RATING_MAX_10(5008, "Rating must not exceed 10.0", HttpStatus.BAD_REQUEST),
    COMMENT_TOO_LONG(5009, "Comment must not exceed {max} characters", HttpStatus.BAD_REQUEST),
    CANNOT_VOTE_OWN_REVIEW(5010, "You cannot vote on your own review", HttpStatus.BAD_REQUEST),
    MOVIE_NOT_SHOWING(5011, "Reviews are only available for movies currently showing", HttpStatus.BAD_REQUEST);




    private int code;
    private String message;
    private HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.message = message;
        this.code = code;
        this.statusCode = statusCode;
    }
}
