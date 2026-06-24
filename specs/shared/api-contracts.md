# API Contracts

> **Source**: Extracted from actual code — `GlobalExceptionHandler`, `ApiResponse`, all controllers, and validation DTOs.
> All field names, status codes, and error codes are taken verbatim from the source.

---

## 1. Standard API Response Wrapper

**Class**: `com.theatermgnt.theatermgnt.common.dto.response.ApiResponse<T>`

`ApiResponse<T>` is the **universal envelope** used by virtually all endpoints. It uses `@JsonInclude(NON_NULL)`, so `null` fields are **omitted** from the JSON output.

### Success Response

```json
{
  "code": 1000,
  "message": null,
  "result": { "...": "actual payload — any type T" }
}
```

> `code` defaults to `1000` (built via `@Builder.Default int code = 1000`).
> `message` is omitted (null) on success because of `@JsonInclude(NON_NULL)`.
> `result` holds the actual response payload — a single object, a list, or a Spring `Page<T>`.

**Example — creating a booking:**

```json
{
  "code": 1000,
  "result": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "PENDING",
    "totalAmount": 240000
  }
}
```

### Error Response

On error, `result` is omitted and `message` is set:

```json
{
  "code": 2060,
  "message": "Booking not existed"
}
```

> `result` is absent (omitted by `@JsonInclude(NON_NULL)`).
> `code` is the custom `ErrorCode` integer (not an HTTP status code).
> `message` is the human-readable error description from `ErrorCode`.

### Special Cases — Endpoints NOT Using `ApiResponse<T>`

Two groups of endpoints bypass the `ApiResponse` wrapper:

| Endpoint | Returns |
|----------|---------|
| `GET /payment/vnpay-return` | Raw `Map<String, Object>` with `200 OK` |
| `GET /payment/vnpay-ipn` | Raw `Map<String, Object>` with `200 OK` |
| `DELETE /equipments/{id}` | `204 No Content` (empty body) |
| `DELETE /equipment-categories/{id}` | `204 No Content` (empty body) |

> The VNPay callback endpoints return raw maps because VNPay server-to-server IPN has its own required response format (`RspCode`, `Message`).

---

## 2. Pagination

The codebase uses **two different pagination patterns** depending on the endpoint.

### Pattern A — Custom Pagination DTO (Booking)

Used by: `GET /bookings`

**Request query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `int` | `0` | Zero-indexed page number |
| `size` | `int` | `10` | Items per page |
| `status` | `BookingStatus` | *(none)* | Filter by booking status |
| `customerSearch` | `String` | *(none)* | Search by customer name |
| `emailSearch` | `String` | *(none)* | Search by customer email |
| `movieSearch` | `String` | *(none)* | Search by movie title |
| `cinemaId` | `String` | *(none)* | Filter by cinema |

**Response** (inside `ApiResponse.result`):

```json
{
  "bookings": [ { "...": "BookingListItemResponse" } ],
  "totalElements": 100,
  "totalPages": 10,
  "currentPage": 0,
  "pageSize": 10
}
```

Field names from `BookingListResponse.java`:

| Field | Type | Source |
|-------|------|--------|
| `bookings` | `List<BookingListItemResponse>` | The data items |
| `totalElements` | `long` | `Page.getTotalElements()` |
| `totalPages` | `int` | `Page.getTotalPages()` |
| `currentPage` | `int` | `Page.getNumber()` (0-indexed) |
| `pageSize` | `int` | `Page.getSize()` |

---

### Pattern B — Spring `Page<T>` Serialized Directly (Invoice, Notification, Review)

Used by: `GET /invoices`, `GET /notifications`, `GET /reviews/.../paginated`, `GET /reviews/.../most-helpful`, `GET /reviews/.../recent`

**Request query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `int` | `0` | Zero-indexed page number |
| `size` | `int` | `10` (invoices, reviews) / `20` (notifications, user) / `50` (admin notifications) | Items per page |

**Response** (Spring's built-in `Page<T>` serialization inside `ApiResponse.result`):

```json
{
  "content": [ { "...": "item DTO" } ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": { "empty": true, "sorted": false, "unsorted": true },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalPages": 5,
  "totalElements": 50,
  "last": false,
  "size": 10,
  "number": 0,
  "sort": { "empty": true, "sorted": false, "unsorted": true },
  "numberOfElements": 10,
  "first": true,
  "empty": false
}
```

> **Key fields for clients**: `content`, `totalElements`, `totalPages`, `number` (current page, 0-indexed), `size`.
> The full Spring `Pageable` metadata block is always present in the response.

---

## 3. Error Code Catalog

### Exception Classes

| Exception Class | Package | Behavior |
|----------------|---------|----------|
| `AppException` | `common.exception` | The only custom exception. Wraps an `ErrorCode` enum value. Thrown explicitly by service methods. |

> There is exactly **one** custom exception class in the entire codebase: `AppException`. All business errors are represented by different `ErrorCode` values passed to `AppException(errorCode)`.

---

### Error Code Numeric Ranges

Each microservice owns a non-overlapping range to avoid cross-service conflicts. These are the **target ranges for the microservice architecture**. The monolith's existing codes do not all respect these boundaries yet — migration notes are in the catalog below.

| Service | Microservice Range | Notes |
|---------|-------------------|-------|
| **Common / Infrastructure** | `1000–1099` | Shared: `UNCATEGORIZED_EXCEPTION (9999)`, `UNAUTHENTICATED`, `UNAUTHORIZED`, `INVALID_KEY` |
| **Identity Service** | `1100–1999` | Accounts, Customer, Staff, Role, Permission, OTP |
| **Catalog Service** | `2000–2499` | Movie, Genre, AgeRating, Cinema, Room, Seat, SeatType, PriceConfig, Screening |
| **Booking Service** | `2500–2999` | Booking, SeatReservation, Ticket, Combo, LoyaltyPoints |
| **Payment Service** | `3000–3499` | Invoice, Payment, PaymentMethod |
| **Notification Service** | `3500–3999` | Notification, Template, Channel, Preference |
| **Analytics Service** | `4000–4499` | Revenue, Report |
| **Identity Service** | `4500–4999` | (reserved expansion) |

> ⚠️ **Monolith → Microservice migration note**: The monolith uses a single shared `ErrorCode` enum with codes that do not follow these ranges. The table below documents codes as they exist in the monolith. During microservice implementation, each service should adopt a new enum that maps to its own range. The old numeric codes on existing clients should be updated in a versioned API release.

---

### `@ExceptionHandler` Mapping in `GlobalExceptionHandler`

| Caught Exception | HTTP Status | `code` in Response | `message` in Response | Notes |
|-----------------|-------------|-------------------|----------------------|-------|
| `AppException` | Per `ErrorCode.statusCode` | `ErrorCode.code` | `ErrorCode.message` | The primary error path |
| `MethodArgumentNotValidException` | `400 Bad Request` | `ErrorCode.code` of the matched key | Template message (with `{min}`, `{max}` substituted) | Bean validation failure — see Section 4 |
| `AccessDeniedException` | `403 Forbidden` | `1002` | `"You do not have permissions"` | Spring Security access denial |
| `Exception` (catch-all) | `400 Bad Request` | `9999` | `"Uncategorized error"` | **Bug**: returns 400, not 500 — see fix note below |

> 🐛 **Bug in monolith — must fix in microservice**: The catch-all `Exception` handler uses `ResponseEntity.badRequest()` which returns **HTTP 400**, but `ErrorCode.UNCATEGORIZED_EXCEPTION.statusCode` is `500`. This means any unhandled `NullPointerException`, `IllegalStateException`, etc. returns `400 Bad Request` instead of `500 Internal Server Error`, making it impossible for clients to distinguish validation errors from server crashes.
>
> **Required fix** — in every microservice's `GlobalExceptionHandler`:
> ```java
> @ExceptionHandler(Exception.class)
> public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception e) {
>     log.error("Unexpected error", e);
>     return ResponseEntity
>         .internalServerError()   // HTTP 500, not badRequest() / 400
>         .body(ApiResponse.<Void>builder()
>             .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())      // 9999
>             .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage()) // "Uncategorized error"
>             .build());
> }
> ```

### Full `ErrorCode` Catalog

> **Legend**: Codes marked **[EXCLUDED]** belong to modules removed from the microservice scope (ShiftType/WorkSchedule, Review/ReviewVote, File/Cloudinary, Chatbot, Equipment). Their numeric codes are **reserved** but not implemented in the microservice. A note is included at the end of this section.


| Code | Name | HTTP Status | Message | Owner (Monolith) | Microservice Owner |
|------|------|-------------|---------|-----------------|-------------------|
| **Common / Infrastructure** |
| `9999` | `UNCATEGORIZED_EXCEPTION` | 500 (handler sends 400 — see fix note) | "Uncategorized error" | All | All (fix to 500) |
| `1001` | `INVALID_KEY` | 400 | "Invalid message key" | All | Common |
| `1002` | `UNAUTHORIZED` | 403 | "You do not have permissions" | All | Common |
| `1006` | `UNAUTHENTICATED` | 401 | "Unauthenticated" | All | Common |
| `1008` | `INVALID_TYPING` | 400 | "WRONG IN YOUR CODE" | All | Common (internal dev error) |
| **Identity Service** (monolith: 1003–1026; microservice target: 1100–1999) |
| `1003` | `USER_EXISTED` | 400 | "User existed" | Identity | Identity |
| `1004` | `USER_NOT_EXISTED` | 404 | "User not existed" | Identity | Identity |
| `1005` | `PHONE_NUMBER_EXISTED` | 400 | "Phone number has existed" | Identity | Identity |
| `1007` | `ROLE_NOT_FOUND` | 404 | "Role not found" | Identity | Identity |
| `1009` | `INVALID_USERNAME` | 400 | "Username must be at least {min} characters" | Identity | Identity |
| `1010` | `INVALID_PASSWORD` | 400 | "Password must be at least {min} characters" | Identity | Identity |
| `1011` | `UNAUTHORIZE` | 403 | "You do not have permission" | Identity | Identity (deduplicate with 1002 — see note) |
| `1012` | `INVALID_DOB` | 400 | "Your age must be at least {min}" | Identity | Identity |
| `1013` | `EMAIL_IS_REQUIRED` | 400 | "Email is required" | Identity | Identity |
| `1014` | `INVALID_EMAIL` | 400 | "Invalid email address" | Identity | Identity |
| `1015` | `PHONE_NUMBER_REQUIRED` | 400 | "Phone number is required" | Identity | Identity |
| `1016` | `INVALID_PHONE_NUMBER_FORMAT` | 400 | "Invalid phone number format" | Identity | Identity |
| `1017` | `EMAIL_EXISTED` | 400 | "Email has existed" | Identity | Identity |
| `1018` | `OTP_EXPIRED` | 400 | "OTP has expired" | Identity | Identity |
| `1019` | `INVALID_OTP` | 400 | "Invalid OTP" | Identity | Identity |
| `1020` | `FAILED_TO_REGISTER_USER` | 400 | "Failed to register customer by Google" | Identity | Identity |
| `1021` | `PASSWORD_EXISTED` | 400 | "Password has existed" | Identity | Identity |
| `1022` | `ACCOUNT_NOT_FOUND` | 404 | "Account not found" | Identity | Identity |
| `1023` | `PASSWORDS_DO_NOT_MATCH` | 400 | "Password and Confirm password do not match" | Identity | Identity |
| `1024` | `CONFIRM_PASSWORD_REQUIRED` | 400 | "Confirm password is required" | Identity | Identity |
| `1025` | `WRONG_ACCOUNT_TYPE` | 401 | "This account type is not allowed to login here" | Identity | Identity |
| `1026` | `ROLE_IN_USE` | 400 | "Cannot delete role. This role is currently assigned to one or more staff members" | Identity | Identity |
| **Catalog Service — Cinema / Room / Seat** (monolith: 2001–2010; microservice target: 2000–2499) |
| `2001` | `CINEMA_EXISTED` | 400 | "Cinema existed" | Catalog | Catalog |
| `2002` | `CINEMA_NOT_EXISTED` | 400 | "Cinema not existed" | Catalog | Catalog |
| `2003` | `ROOM_EXISTED` | 400 | "Room existed" | Catalog | Catalog |
| `2004` | `ROOM_NOT_EXISTED` | 400 | "Room not existed" | Catalog | Catalog |
| `2005` | `SEATTYPE_EXISTED` | 400 | "Seat type existed" | Catalog | Catalog |
| `2006` | `SEATTYPE_NOT_EXISTED` | 400 | "Seat type not existed" | Catalog | Catalog |
| `2007` | `PRICECONFIG_NOT_EXISTED` | 400 | "Price config not existed" | Catalog | Catalog |
| `2008` | `PRICECONFIG_EXISTED` | 400 | "Price config existed" | Catalog | Catalog |
| `2009` | `SEAT_NOT_EXISTED` | 400 | "Seat not existed" | Catalog | Catalog |
| `2010` | `SEAT_EXISTED` | 400 | "Seat existed" | Catalog | Catalog |
| **Catalog Service — Screening / Combo** |
| `2013` | `SCREENING_EXISTED` | 400 | "Screening existed" | Catalog | Catalog |
| `2014` | `SCREENING_NOT_EXISTED` | 400 | "Screening not existed" | Catalog | Catalog |
| `2015` | `AGERATING_EXISTED` | 400 | "Age rating existed" | Catalog | Catalog |
| `2016` | `AGERATING_NOT_EXISTED` | 404 | "Age rating not existed" | Catalog | Catalog |
| `2017` | `INVALID_AGERATING_ID` | 400 | "Age rating ID must not exceed {max} characters" | Catalog | Catalog |
| `2018` | `INVALID_AGERATING_CODE` | 400 | "Age rating code must be between {min} and {max} characters" | Catalog | Catalog |
| `2019` | `INVALID_AGERATING_DESCRIPTION` | 400 | "Age rating description must not exceed {max} characters" | Catalog | Catalog |
| `2020` | `GENRE_EXISTED` | 400 | "Genre existed" | Catalog | Catalog |
| `2021` | `GENRE_NOT_EXISTED` | 404 | "Genre not existed" | Catalog | Catalog |
| `2022` | `GENRE_ID_REQUIRED` | 400 | "Genre ID is required" | Catalog | Catalog |
| `2023` | `INVALID_GENRE_ID` | 400 | "Genre ID must not exceed {max} characters" | Catalog | Catalog |
| `2024` | `GENRE_NAME_REQUIRED` | 400 | "Genre name is required" | Catalog | Catalog |
| `2025` | `INVALID_GENRE_NAME` | 400 | "Genre name must not exceed {max} characters" | Catalog | Catalog |
| `2026` | `MOVIE_EXISTED` | 400 | "Movie existed" | Catalog | Catalog |
| `2027` | `MOVIE_NOT_EXISTED` | 404 | "Movie not existed" | Catalog | Catalog |
| `2028` | `INVALID_MOVIE_TITLE` | 400 | "Movie title must not exceed {max} characters" | Catalog | Catalog |
| `2029` | `INVALID_MOVIE_DESCRIPTION` | 400 | "Movie description must not exceed {max} characters" | Catalog | Catalog |
| `2030` | `INVALID_MOVIE_DURATION` | 400 | "Movie duration must be between {min} and {max} minutes" | Catalog | Catalog |
| `2031` | `INVALID_MOVIE_DIRECTOR` | 400 | "Movie director must not exceed {max} characters" | Catalog | Catalog |
| `2032` | `INVALID_MOVIE_CAST` | 400 | "Movie cast must not exceed {max} characters" | Catalog | Catalog |
| `2033` | `INVALID_POSTER_URL` | 400 | "Poster URL must be a valid URL" | Catalog | Catalog |
| `2034` | `INVALID_TRAILER_URL` | 400 | "Trailer URL must be a valid URL" | Catalog | Catalog |
| `2035` | `INVALID_MOVIE_GENRES` | 400 | "Movie must have between {min} and {max} genres" | Catalog | Catalog |
| `2036` | `AGERATING_CODE_EXISTED` | 400 | "Age rating code existed" | Catalog | Catalog |
| `2037` | `GENRE_NAME_EXISTED` | 400 | "Genre name existed" | Catalog | Catalog |
| `2038` | `MOVIE_HAS_SCHEDULED_SCREENINGS` | 400 | "Cannot archive movie because it has scheduled screenings" | Catalog | Catalog |
| `2039` | `CINEMA_HAS_ROOMS` | 400 | "Cannot delete cinema. Please delete all rooms in this cinema first" | Catalog | Catalog |
| `2043` | `STAFF_NOT_FOUND` | 400 | "Staff not found" | Catalog | Catalog (cinema–staff association check) |
| `2044` | `UNAUTHORIZED_CINEMA_STAFF` | 400 | "Unauthorized cinema staff" | Catalog | Catalog |
| `2050` | `NOTHING_TO_UPDATE` | 400 | "Nothing to update" | Catalog | Catalog (generic) |
| **Catalog Service — Screening Seat / Seat Validation** |
| `4001` | `SCREENING_SEAT_NOT_EXISTED` | 400 | "Screening seat not existed" | Catalog | Catalog |
| `4002` | `SCREENING_SEAT_EXISTED` | 400 | "Screening seat existed" | Catalog | Catalog |
| `4003` | `SCREENING_CANNOT_UPDATE` | 400 | "Screening's status must be scheduled before updating" | Catalog | Catalog |
| `4004` | `SCREENING_TIME_INVALID` | 400 | "Screening's time must be in the future" | Catalog | Catalog |
| `4005` | `SCREENING_TIME_OVERLAP` | 400 | "Already has the same screening's time" | Catalog | Catalog |
| `4006` | `SEAT_NOT_IN_ROOM` | 400 | "This seat is not in our rooms" | Catalog | Catalog |
| `4007` | `SCREENING_SEAT_INVALID_STATUS_CHANGE` | 400 | "Cannot change screening seat's status (SOLD)" | Catalog | Catalog |
| `4008` | `SCREENING_SEAT_CANNOT_DELETE` | 400 | "Only screening seats with AVAILABLE status can be deleted" | Catalog | Catalog |
| **Booking Service** (monolith: 2011–2012, 2060–2071; microservice target: 2500–2999) |
| `2011` | `COMBO_EXISTED` | 400 | "Combo existed" | Booking | Booking |
| `2012` | `COMBO_NOT_EXISTED` | 400 | "Combo not existed" | Booking | Booking |
| `2060` | `BOOKING_NOT_EXISTED` | 404 | "Booking not existed" | Booking | Booking |
| `2061` | `INSUFFICIENT_LOYALTY_POINTS` | 400 | "Insufficient loyalty points" | Booking | Booking |
| `2062` | `SCREENING_SEATS_NOT_AVAILABLE` | 400 | "One or more selected seats are not available" | Booking | Booking |
| `2063` | `TICKET_NOT_EXISTED` | 404 | "Ticket not existed" | Booking | Booking |
| `2064` | `BOOKING_EXCEED_SEAT_LIMIT` | 400 | "Booking exceeds the maximum seat limit per customer" | Booking | Booking |
| `2065` | `MOVIE_ALREADY_ENDED` | 400 | "Cannot book tickets for a movie that has already ended" | Booking | Booking |
| `2066` | `SCREENING_SEAT_NOT_BELONG_TO_SCREENING` | 400 | "One or more selected seats do not belong to the specified screening" | Booking | Booking |
| `2067` | `ORPHAN_SEAT_VIOLATION` | 400 | "Selecting this seat would create orphan seats. Please choose different seats." | Booking | Booking |
| `2068` | `TICKET_NOT_ACTIVE` | 400 | "Ticket not active" | Booking | Booking |
| `2069` | `TICKET_EXPIRED` | 400 | "Ticket has expired" | Booking | Booking |
| `2070` | `BOOKING_COMBO_NOT_EXISTED` | 404 | "Booking combo not existed" | Booking | Booking |
| `2071` | `INSUFFICIENT_COMBO_QUANTITY` | 400 | "Insufficient combo quantity available" | Booking | Booking |
| **Payment Service** (monolith: 2055–2057; microservice target: 3000–3499) |
| `2055` | `INVOICE_NOT_EXISTED` | 404 | "Invoice not existed" | Payment | Payment |
| `2056` | `INVOICE_ALREADY_PAID` | 400 | "Invoice already paid" | Payment | Payment |
| `2057` | `PAYMENT_METHOD_NOT_EXISTED` | 404 | "Payment method not existed" | Payment | Payment |
| **Notification Service** (monolith: 3001, 6001, 7001–7006; microservice target: 3500–3999) |
| `3001` | `CANNOT_SEND_EMAIL` | 400 | "Cannot send email" | Notification | Notification |
| `6001` | `PRIORITY_INVALID` | 400 | "Priority must have greater than 0" | Notification | Notification |
| `7001` | `TEMPLATE_NOT_FOUND` | 404 | "Notification template not found" | Notification | Notification |
| `7002` | `TEMPLATE_ALREADY_EXISTS` | 400 | "Notification template already exists" | Notification | Notification |
| `7003` | `CHANNEL_NOT_FOUND` | 404 | "Notification channel not found" | Notification | Notification |
| `7004` | `PREFERENCE_NOT_FOUND` | 404 | "Notification preference not found" | Notification | Notification |
| `7005` | `PREFERENCE_ALREADY_EXISTS` | 400 | "Notification preference already exists" | Notification | Notification |
| `7006` | `NOTIFICATION_NOT_FOUND` | 404 | "Notification not found" | Notification | Notification |
| **[EXCLUDED] — ShiftType / WorkSchedule / Schedule** (monolith: 2040–2051) |
| `2040` | `WORK_SCHEDULE_NOT_FOUND` | 400 | "Work schedule not found" | ~~Schedule~~ | **[EXCLUDED]** |
| `2041` | `SHIFT_NOT_FOUND` | 400 | "Shift not found" | ~~Schedule~~ | **[EXCLUDED]** |
| `2042` | `WORK_SCHEDULE_EXISTS` | 400 | "Work schedule already exists" | ~~Schedule~~ | **[EXCLUDED]** |
| `2045` | `SHIFT_TYPE_EXISTS` | 400 | "Shift type existed" | ~~Schedule~~ | **[EXCLUDED]** |
| `2046` | `SHIFT_TYPE_NOT_FOUND` | 400 | "Shift type not found" | ~~Schedule~~ | **[EXCLUDED]** |
| `2047` | `INVALID_SHIFT_TIME_RANGE` | 400 | "Invalid shift time range" | ~~Schedule~~ | **[EXCLUDED]** |
| `2048` | `SHIFT_OVERLAP` | 400 | "Shift time overlap with existing shift" | ~~Schedule~~ | **[EXCLUDED]** |
| `2049` | `INVALID_WORK_DATE` | 400 | "Work date cannot be in the past" | ~~Schedule~~ | **[EXCLUDED]** |
| `2051` | `INVALID_WORK_SCHEDULE_REQUEST` | 400 | "Invalid work schedule request" | ~~Schedule~~ | **[EXCLUDED]** |
| **[EXCLUDED] — Review / ReviewVote / File / Chatbot** (monolith: 5001–5011) |
| `5001` | `INVALID_DATE_RANGE` / `REVIEW_NOT_EXISTED` / `FILE_NOT_FOUND` | 400 / 404 / 404 | Various | ~~Review/File/Chatbot~~ | **[EXCLUDED]** |
| `5002` | `REVIEW_ALREADY_EXISTS` / `FILE_DOWNLOAD_FAILED` | 400 / 404 | Various | ~~Review/File~~ | **[EXCLUDED]** |
| `5003` | `REVIEW_UNAUTHORIZED` / `DOCUMENT_PARSING_FAILED` | 403 / 400 | Various | ~~Review/Chatbot~~ | **[EXCLUDED]** |
| `5004` | `CUSTOMER_ID_REQUIRED` / `FILE_SYNC_TO_VECTOR_STORE_FAILED` | 400 / 500 | Various | ~~Review/File~~ | **[EXCLUDED]** |
| `5005` | `MOVIE_ID_REQUIRED` / `FILE_DELETE_FROM_VECTOR_STORE_FAILED` | 400 / 500 | Various | ~~Review/File~~ | **[EXCLUDED]** |
| `5006` | `RATING_REQUIRED` / `INVALID_FILE_TYPE` | 400 / 400 | Various | ~~Review/File~~ | **[EXCLUDED]** |
| `5007` | `RATING_MIN_0_5` / `DOCUMENT_ALREADY_EXISTS` | 400 / 400 | Various | ~~Review/Chatbot~~ | **[EXCLUDED]** |
| `5008` | `RATING_MAX_10` / `DOCUMENT_NOT_FOUND` | 400 / 404 | Various | ~~Review/Chatbot~~ | **[EXCLUDED]** |
| `5009` | `COMMENT_TOO_LONG` / `DOCUMENT_ALREADY_PROCESSING` | 400 / 400 | Various | ~~Review/Chatbot~~ | **[EXCLUDED]** |
| `5010` | `CANNOT_VOTE_OWN_REVIEW` | 400 | "You cannot vote on your own review" | ~~Review~~ | **[EXCLUDED]** |
| `5011` | `MOVIE_NOT_SHOWING` | 400 | "Reviews are only available for movies currently showing" | ~~Review~~ | **[EXCLUDED]** |

> Codes for excluded modules (2040–2051, 5001–5011) are **reserved** but not implemented in the microservice architecture. They will not appear in any microservice `ErrorCode` enum.

> ⚠️ **Known issues in monolith ErrorCode — resolved in spec:**
> 1. **2036 duplicate** (was): `AGERATING_CODE_EXISTED` and `MOVIE_HAS_SCHEDULED_SCREENINGS` both had code `2036`. **Fixed**: `MOVIE_HAS_SCHEDULED_SCREENINGS` is now `2038`.
> 2. **2052 renumbered**: `CINEMA_HAS_ROOMS` was `2052` in the monolith (between excluded WorkSchedule codes). Moved to `2039` to keep the Catalog range contiguous.
> 3. **1011 duplicate**: `UNAUTHORIZE` (1011) and `UNAUTHORIZED` (1002) both mean 403. In the microservice, consolidate to `1002 UNAUTHORIZED` only.
> 4. **Codes 5001–5009** are internally duplicated 3-way across Review, File, and Chatbot in the monolith. All are excluded from the microservice.


---

## 4. Validation Error Format

### How it works

Bean Validation (`@Valid` + Jakarta Validation annotations) uses the annotation's `message` attribute as an `ErrorCode` enum **key name** (not a plain message string). The `GlobalExceptionHandler.handlingValidation()` method:

1. Takes the first binding error's `defaultMessage` as the `ErrorCode` key (e.g., `"INVALID_EMAIL"`)
2. Looks up `ErrorCode.valueOf(key)` to find the matching error code
3. Fetches constraint attributes (e.g., `{min}`, `{max}`) and interpolates them into the message template
4. Returns `400 Bad Request` with the resolved code and message

### Annotation → ErrorCode convention

```java
@Size(max = 255, message = "INVALID_MOVIE_TITLE")
String title;

@Min(value = 1, message = "INVALID_MOVIE_DURATION")
@Max(value = 500, message = "INVALID_MOVIE_DURATION")
Integer durationMinutes;

@NotBlank(message = "EMAIL_IS_REQUIRED")
@Email(message = "INVALID_EMAIL")
String email;
```

### Resulting error response (400 Bad Request)

Only the **first** validation error is surfaced (uses `.getAllErrors().getFirst()`). Multiple field errors are **not** returned simultaneously.

```json
{
  "code": 2028,
  "message": "Movie title must not exceed 255 characters"
}
```

Another example with `{min}` and `{max}` substitution:

```json
{
  "code": 2030,
  "message": "Movie duration must be between 1 and 500 minutes"
}
```

If the `message` key does not match any `ErrorCode` enum value (fallback):

```json
{
  "code": 1001,
  "message": "Invalid message key"
}
```

> **Design implication for microservices**: Each service must have access to the same `ErrorCode` enum (or a shared library equivalent) for the validation message key resolution to work. The annotation's `message` attribute must match an `ErrorCode` enum name exactly.

---

## 5. HTTP Status Usage Convention

| Status | When Used | Example |
|--------|-----------|---------|
| **200 OK** | All successful `GET`, `POST`, `PUT`, `PATCH`, `DELETE` that return `ApiResponse<T>` (the default — Spring returns 200 when a method returns `ApiResponse<T>` directly without `ResponseEntity`) | `GET /movies`, `POST /bookings`, `DELETE /movies/{id}` (returns `ApiResponse<String>`) |
| **201 Created** | Only the equipment module: `POST /equipments`, `POST /equipment-categories` (the only controllers using `ResponseEntity.status(HttpStatus.CREATED)`) | `POST /equipments` → `ResponseEntity.status(CREATED).body(...)` |
| **204 No Content** | Only the equipment module: `DELETE /equipments/{id}`, `DELETE /equipment-categories/{id}` | Returns `ResponseEntity.noContent().build()` — empty body, no `ApiResponse` wrapper |
| **400 Bad Request** | `AppException` whose `ErrorCode.statusCode == BAD_REQUEST`; all `MethodArgumentNotValidException` (bean validation); all uncaught exceptions (catch-all handler) | `BOOKING_EXCEED_SEAT_LIMIT`, `INVALID_MOVIE_TITLE` |
| **401 Unauthorized** | `AppException` with `UNAUTHENTICATED` or `WRONG_ACCOUNT_TYPE` codes | Token missing / invalid / expired |
| **403 Forbidden** | `AccessDeniedException` (Spring Security) → mapped to `ErrorCode.UNAUTHORIZED` (code `1002`); `AppException` with `UNAUTHORIZE` (code `1011`) or `REVIEW_UNAUTHORIZED` | Insufficient role/permission |
| **404 Not Found** | `AppException` with codes like `USER_NOT_EXISTED`, `BOOKING_NOT_EXISTED`, `TICKET_NOT_EXISTED`, `INVOICE_NOT_EXISTED`, etc. | Resource does not exist |
| **409 Conflict** | **Not used** — the codebase uses `400 Bad Request` for all conflict-type errors (e.g., `USER_EXISTED`, `EMAIL_EXISTED`, `SCREENING_EXISTED`). There are no `409` responses. | — |
| **500 Internal Server Error** | `ErrorCode.UNCATEGORIZED_EXCEPTION` has `statusCode = HttpStatus.INTERNAL_SERVER_ERROR`, but the handler uses `ResponseEntity.badRequest()`, so it actually returns **400** in practice | Bug: never truly returns 500 |

### Key observation: No `201` or `204` on core domain endpoints

The majority of the codebase — movie, booking, screening, payment, notification controllers — returns **HTTP 200** for all operations including `POST` (create) and `DELETE`, because they return `ApiResponse<T>` directly (not `ResponseEntity`). Only the `equipment` module breaks from this convention.

---

## 6. Authentication Header

All protected endpoints require a JWT `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

JWTs are issued by `POST /auth/admin/login` or `POST /auth/customer/login`. The token carries the user's roles and `accountType` claim, which Spring Security uses for RBAC.

---

## 7. Base URL

All endpoints share the base path:

```
/api/theater-mgnt
```

Example full path: `POST /api/theater-mgnt/bookings`

> The base path is configured in the API Gateway / reverse proxy, not in the Spring Boot application itself (`server.servlet.context-path` is not set).

---

## Appendix: Class Reference

| Class | Path | Role |
|-------|------|------|
| `ApiResponse<T>` | `common/dto/response/ApiResponse.java` | Universal response wrapper |
| `BaseUserResponse` | `common/dto/response/BaseUserResponse.java` | Shared base for `CustomerResponse` and `StaffResponse` |
| `BookingListResponse` | `booking/dto/response/BookingListResponse.java` | Custom pagination DTO for bookings |
| `GlobalExceptionHandler` | `common/exception/GlobalExceptionHandler.java` | `@ControllerAdvice` — single global handler |
| `AppException` | `common/exception/AppException.java` | Only custom exception — wraps `ErrorCode` |
| `ErrorCode` | `common/exception/ErrorCode.java` | Enum of all error codes, messages, and HTTP statuses |

---

*Updated: 2026-06-20 | Source: direct code read of `GlobalExceptionHandler`, `ApiResponse`, `ErrorCode`, all controllers*
