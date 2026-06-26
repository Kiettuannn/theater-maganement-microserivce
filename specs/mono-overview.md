# Theater Management System — Comprehensive Project Report

---

## 1. Project Overview

| Property | Value |
|---|---|
| **Project Name** | Theater Management (`theatermgnt`) |
| **Purpose** | Full-featured cinema/theater management backend — handles movies, screenings, bookings, payments, staff, revenue analytics, AI chatbot, and real-time notifications |
| **Spring Boot Version** | **3.5.6** |
| **Java Version** | **Java 21** (with `--enable-preview`) |
| **Build Tool** | **Maven** |
| **Database** | **PostgreSQL** + **pgvector** (for AI embeddings) |
| **Architecture** | Monolith with domain-driven package structure |
| **Base URL** | `/api/theater-mgnt` (implied by context) |

---

## 2. Package Structure

The root package is `com.theatermgnt.theatermgnt`. All 32 sub-packages follow a **domain-per-package** layout, each containing `controller/`, `dto/`, `entity/`, `service/`, `repository/`, `mapper/` sub-layers.

| Package | Responsibility |
|---|---|
| `account` | Account CRUD, password management, user registration |
| `authentication` | JWT login, refresh tokens, logout, OTP, OAuth (Google), password reset |
| `authorization` | RBAC — Roles and Permissions |
| `booking` | Seat booking lifecycle (create, cancel, redeem points) |
| `bookingCombo` | Attaching food/drink combos to a booking |
| `chatbotInternal` | Internal AI chatbot backed by Spring AI + OpenAI + pgvector |
| `cinema` | Cinema branch CRUD |
| `combo` | Food/drink combo management |
| `common` | Shared base entity, DTOs, enums, exception handling |
| `config` | External service configs (VNPay) |
| `configuration` | Security, CORS, Cloudinary, JWT decoder, app init |
| `constant` | Global constants |
| `customer` | Customer profile, loyalty points |
| `equipment` | Equipment & equipment categories for cinema rooms |
| `file` | File/image upload via Cloudinary |
| `movie` | Movie CRUD, genres, age ratings, status management |
| `notification` | Notification system (log, channel, template, preferences) |
| `payment` | VNPay integration, cash payments, invoices |
| `priceConfig` | Ticket pricing rules by day type & time slot |
| `revenue` | Revenue reporting (daily, movie-level, period reports) |
| `review` | Movie reviews with voting (helpful/unhelpful) |
| `room` | Cinema room CRUD |
| `schedule` | Staff work schedule management |
| `screening` | Screening session CRUD |
| `screeningSeat` | Per-screening seat allocation and locking |
| `seat` | Physical seat definitions per room |
| `seatType` | Seat type classifications |
| `ShiftType` | Staff shift type definitions |
| `staff` | Staff CRUD with role assignments |
| `ticket` | Ticket generation, QR codes, check-in, transfer |
| `validator` | Custom validation annotations (DOB, password match) |
| `websocket` | Real-time WebSocket session management (Netty Socket.IO) |

---

## 3. Domain Entities

### Base Entity (`BaseEntity`)
All entities that extend `BaseEntity` inherit:

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Auto-generated |
| `createdAt` | `LocalDateTime` | Auto-set |
| `updatedAt` | `LocalDateTime` | Auto-updated |
| `deleted` | `Boolean` | Soft-delete flag (default `false`) |

> Soft-delete is enforced via `@SQLDelete` + `@Where(clause = "deleted = false")` on most entities.

---

### `Account` → table: `accounts`
| Field | Type | Constraints |
|---|---|---|
| `email` | `String` | unique |
| `username` | `String` | unique |
| `password` | `String` | BCrypt hashed |
| `accountType` | `AccountType` enum | INTERNAL / CUSTOMER |
| `isActive` | `Boolean` | — |

---

### `Customer` → table: `customers`
| Field | Type | Notes |
|---|---|---|
| `account` | `Account` | `@OneToOne` |
| `firstName`, `lastName` | `String` | — |
| `address`, `avatarUrl`, `phoneNumber` | `String` | — |
| `loyaltyPoints` | `Integer` | default 0 |
| `gender` | `Gender` enum | — |
| `dob` | `LocalDate` | — |

---

### `Staff` → table: `staffs`
| Field | Type | Notes |
|---|---|---|
| `account` | `Account` | `@OneToOne` |
| `cinemaId` | `String` | FK to cinema |
| `firstName`, `lastName` | `String` | — |
| `phoneNumber`, `jobTitle`, `address`, `avatarUrl` | `String` | — |
| `dob` | `LocalDate` | — |
| `gender` | `Gender` enum | — |
| `roles` | `Set<Role>` | `@ManyToMany` |

---

### `Role` → table: `roles`
| Field | Type | Notes |
|---|---|---|
| `name` | `String` | PK (e.g., `ADMIN`, `CASHIER`) |
| `description` | `String` | — |
| `permissions` | `Set<Permission>` | `@ManyToMany` |

### `Permission` → table: `permissions`
| Field | Type |
|---|---|
| `name` | `String` (PK) |
| `description` | `String` |

---

### `Cinema` → table: `cinemas`
| Field | Type | Notes |
|---|---|---|
| `name`, `address`, `city`, `phoneNumber` | `String` | — |
| `buffer` | `Integer` | Scheduling buffer in minutes |
| `manager` | `Staff` | `@OneToOne` |

---

### `Room` → table: `rooms`
| Field | Type | Notes |
|---|---|---|
| `cinema` | `Cinema` | `@ManyToOne` |
| `name` | `String` | — |
| `seats` | `List<Seat>` | `@OneToMany` |
| `roomType` | `RoomType` enum | — |
| `status` | `RoomStatus` enum | — |
| `totalSeats` | `Integer` | — |

---

### `SeatType` → table: `seatTypes`
| Field | Type |
|---|---|
| `name` | `String` |
| `description` | `String` |
| `priceMultiplier` | `BigDecimal` |

### `Seat` → table: `seats`
| Field | Type | Notes |
|---|---|---|
| `rowChair` | `String` | Row label (e.g., "A") |
| `seatNumber` | `Integer` | — |
| `room` | `Room` | `@ManyToOne` |
| `seatType` | `SeatType` | `@ManyToOne` |

---

### `Movie` → table: `movies`
| Field | Type | Notes |
|---|---|---|
| `title` | `String` | — |
| `slug` | `String` | unique, SEO URL |
| `description` | `String` | — |
| `durationMinutes` | `Integer` | — |
| `director`, `castMembers` | `String` | — |
| `posterUrl`, `trailerUrl` | `String` | Cloudinary URLs |
| `releaseDate`, `endDate` | `LocalDate` | — |
| `ageRating` | `AgeRating` | `@ManyToOne` |
| `status` | `MovieStatus` enum | NOW_SHOWING / COMING_SOON / ARCHIVED |
| `genres` | `Set<Genre>` | `@ManyToMany` (join table: `movie_genres`) |

### `Genre` → table: `genres`
| Field | Type |
|---|---|
| `name` | `String` |
| `description` | `String` |

### `AgeRating` → table: `ageRatings`
| Field | Type |
|---|---|
| `code` | `String` |
| `description` | `String` |

---

### `Screening` → table: `screenings`
| Field | Type | Notes |
|---|---|---|
| `room` | `Room` | `@ManyToOne` |
| `movie` | `Movie` | `@ManyToOne` |
| `startTime`, `endTime` | `LocalDateTime` | — |
| `status` | `ScreeningStatus` enum | — |

---

### `ScreeningSeat` → table: `screeningSeats`
| Field | Type | Notes |
|---|---|---|
| `screening` | `Screening` | `@ManyToOne` |
| `seat` | `Seat` | `@ManyToOne` |
| `booking` | `String` | Booking reference |
| `status` | `ScreeningSeatStatus` enum | AVAILABLE / LOCKED / BOOKED |
| `lockUntil` | `Instant` | Temporary lock expiry |

---

### `Booking` → table: `bookings`
| Field | Type | Notes |
|---|---|---|
| `customer` | `Customer` | `@ManyToOne` |
| `screening` | `Screening` | `@ManyToOne` |
| `status` | `BookingStatus` enum | PENDING / CONFIRMED / CANCELLED |
| `subtotal`, `discount`, `totalAmount` | `BigDecimal` | — |
| `createdAt`, `expiredAt` | `Instant` | Auto-expire unpaid bookings |

### `BookingCombo` → table: `booking_combos`
| Field | Type | Notes |
|---|---|---|
| `bookingId` | FK | — |
| `comboId` | FK | — |
| `quantity` | `Integer` | — |

---

### `Ticket` → table: `tickets`
| Field | Type | Notes |
|---|---|---|
| `booking` | `Booking` | `@ManyToOne` |
| `screeningSeat` | `ScreeningSeat` | `@ManyToOne`, unique |
| `seatName` | `String` | Denormalized label |
| `price` | `BigDecimal` | — |
| `ticketCode` | `String` | unique, 50 chars |
| `qrContent` | `TEXT` | QR code payload |
| `status` | `TicketStatus` enum | ACTIVE / USED / EXPIRED / TRANSFER_PENDING |
| `usedAt`, `expiresAt`, `createdAt` | `Instant` | — |

---

### `Invoice` → table: `invoices`
| Field | Type | Notes |
|---|---|---|
| `bookingId` | `String` | FK, unique |
| `totalAmount` | `BigDecimal` | VND amount |
| `status` | `InvoiceStatus` enum | PENDING / PAID / FAILED / REFUNDED |
| `createdAt`, `paidAt` | `LocalDateTime` | — |

### `Payment` → table: `payments`
| Field | Type | Notes |
|---|---|---|
| `invoiceId` | `String` | FK |
| `paymentMethodId` | `String` | FK |
| `amount` | `BigDecimal` | VND |
| `paymentType` | `PaymentType` enum | BOOKING / REFUND |
| `transactionCode` | `String` | VNPay txnRef, unique |
| `status` | `PaymentStatus` enum | — |
| `description` | `String` | — |
| `paymentDate`, `createdAt` | `LocalDateTime` | — |

### `PaymentMethod` → table: `payment_methods`
| Field | Type |
|---|---|
| `name` | `String` |
| `code` | `String` |

---

### `PriceConfig` → table: `priceConfigs`
| Field | Type | Notes |
|---|---|---|
| `dayType` | `DayType` enum | WEEKDAY / WEEKEND / HOLIDAY |
| `timeSlot` | `TimeSlot` enum | MORNING / AFTERNOON / EVENING / NIGHT |
| `price` | `BigDecimal` | Base price |
| `seatType` | `SeatType` | `@ManyToOne` |

---

### `Combo` → table: `combos`
| Field | Type |
|---|---|
| `name` | `String` |
| `description` | `String` |
| `price` | `BigDecimal` |
| `imageUrl` | `String` |

### `ComboItem` → table: `combo_items`
| Field | Type |
|---|---|
| `combo` | `Combo` FK |
| `name` | `String` |
| `quantity` | `Integer` |

---

### `MovieReview` → table: `movie_reviews`
| Field | Type | Notes |
|---|---|---|
| `movie` | `Movie` | `@ManyToOne` |
| `customer` | `Customer` | `@ManyToOne` |
| `rating` | `Integer` | 1–10 |
| `content` | `TEXT` | — |
| `helpfulCount`, `unhelpfulCount` | `Integer` | — |

### `ReviewVote` → table: `review_votes`
| Field | Type |
|---|---|
| `review` | `MovieReview` FK |
| `customerId` | `String` |
| `voteType` | `VoteType` enum (HELPFUL/UNHELPFUL) |

---

### Revenue Entities

| Entity | Table | Key Fields |
|---|---|---|
| `RevenueReport` | `revenue_reports` | `cinemaId`, `reportType`, `fromDate`, `toDate`, `totalRevenue` |
| `DailyRevenueSummary` | `daily_revenue_summaries` | `cinemaId`, `date`, `totalRevenue`, `ticketCount` |
| `MovieRevenue` | `movie_revenues` | `movieId`, `cinemaId`, `revenue`, `ticketsSold`, `date` |
| `RevenueProcessingLog` | `revenue_processing_logs` | `status`, `message`, `processedAt` |

---

### Notification Entities

| Entity | Table | Key Fields |
|---|---|---|
| `Notification` | `notifications` | `userId`, `title`, `body`, `type`, `isRead`, `createdAt` |
| `NotificationLog` | `notification_logs` | `notificationId`, `channel`, `status`, `sentAt` |
| `NotificationChannel` | `notification_channels` | `name`, `code` |
| `NotificationTemplate` | `notification_templates` | `name`, `subject`, `bodyTemplate`, `channelId` |
| `NotificationPreference` | `notification_preferences` | `userId`, `channelId`, `enabled` |

---

### Other Entities

| Entity | Table | Key Fields |
|---|---|---|
| `Equipment` | `equipments` | `name`, `serial`, `categoryId`, `roomId`, `status` |
| `EquipmentCategory` | `equipment_categories` | `name`, `description` |
| `WorkSchedule` | `work_schedules` | `staffId`, `date`, `shiftTypeId`, `cinemaId` |
| `ShiftType` | `shift_types` | `name`, `startTime`, `endTime` |
| `FileMgnt` | `file_mgnt` | `url`, `publicId`, `uploadedBy` |
| `InvalidatedToken` | `invalidated_tokens` | `id` (JWT JTI), `expiryTime` |
| `OtpToken` | `otp_tokens` | `email`, `otp`, `expiresAt`, `used` |
| `WebSocketSession` | `websocket_sessions` | `userId`, `sessionId`, `connectedAt` |
| `ChatbotDocument` | `chatbot_documents` | `filename`, `content`, `uploadedAt` |
| `VectorDocument` | `vector_documents` | pgvector embedding table |

---

## 4. REST API Endpoints

> All endpoints are prefixed with the API base path (typically `/api/theater-mgnt`).

### 🔐 Authentication — `/auth`

| Method | Path | Description | Auth Required |
|---|---|---|---|
| POST | `/auth/admin/login` | Admin/staff login (INTERNAL account type) | No |
| POST | `/auth/customer/login` | Customer login | No |
| POST | `/auth/introspect` | Validate JWT token | No |
| POST | `/auth/logout` | Invalidate token | No |
| POST | `/auth/refresh` | Refresh JWT | No |
| POST | `/auth/outbound/authenticate` | Google OAuth login (exchange code) | No |
| POST | `/auth/forgot-password` | Send OTP reset code via email | No |
| POST | `/auth/reset-password` | Reset password with OTP | No |
| POST | `/auth/accounts/create-password` | Create password (for OAuth users) | Yes |

---

### 👤 Customers — `/customers`

| Method | Path | Description |
|---|---|---|
| POST | `/customers` | Staff creates customer account |
| GET | `/customers` | Get all customers |
| GET | `/customers/myInfo` | Get authenticated customer's profile |
| GET | `/customers/{customerId}` | Get customer by ID |
| GET | `/customers/{customerId}/loyalty-points` | Get loyalty points balance |
| PUT | `/customers/{customerId}` | Update customer profile |
| DELETE | `/customers/{customerId}` | Soft-delete customer |

---

### 👥 Staff — `/staffs`

| Method | Path | Description |
|---|---|---|
| POST | `/staffs` | Create staff account |
| GET | `/staffs` | List all staff (with search filters) |
| GET | `/staffs/{staffId}` | Get staff details |
| PUT | `/staffs/{staffId}` | Update staff profile |
| DELETE | `/staffs/{staffId}` | Delete staff |

---

### 🎭 Authorization — Roles & Permissions

| Method | Path | Description |
|---|---|---|
| POST | `/roles` | Create role |
| GET | `/roles` | List all roles |
| GET | `/roles/{roleName}` | Get role detail |
| PUT | `/roles/{roleName}` | Update role |
| DELETE | `/roles/{roleName}` | Delete role |
| POST | `/permissions` | Create permission |
| GET | `/permissions` | List all permissions |
| DELETE | `/permissions/{permissionName}` | Delete permission |

---

### 🎬 Movies — `/movies`

| Method | Path | Description |
|---|---|---|
| POST | `/movies` | Create movie |
| GET | `/movies` | List all movies |
| GET | `/movies/{id}` | Get movie by ID |
| GET | `/movies/slug/{slug}` | Get movie by SEO slug |
| GET | `/movies/status/{status}` | Filter by status |
| GET | `/movies/now-showing` | Now-showing movies |
| GET | `/movies/coming-soon` | Coming-soon movies |
| GET | `/movies/search?title=...` | Search by title |
| GET | `/movies/genre/{genreId}` | Movies by genre |
| PUT | `/movies/{id}` | Update movie |
| PATCH | `/movies/{id}/archive` | Archive movie |
| DELETE | `/movies/{id}` | Delete movie |

### Genres — `/genres`

| Method | Path | Description |
|---|---|---|
| POST | `/genres` | Create genre |
| GET | `/genres` | List all genres |
| GET | `/genres/{id}` | Get genre |
| PUT | `/genres/{id}` | Update genre |
| DELETE | `/genres/{id}` | Delete genre |

### Age Ratings — `/age-ratings`

| Method | Path | Description |
|---|---|---|
| POST | `/age-ratings` | Create age rating |
| GET | `/age-ratings` | List all |
| GET | `/age-ratings/{id}` | Get by ID |
| PUT | `/age-ratings/{id}` | Update |
| DELETE | `/age-ratings/{id}` | Delete |

---

### 🏟️ Cinemas — `/cinemas`

| Method | Path | Description |
|---|---|---|
| POST | `/cinemas` | Create cinema |
| GET | `/cinemas` | List all cinemas |
| GET | `/cinemas/{cinemaId}` | Get cinema |
| PUT | `/cinemas/{cinemaId}` | Update cinema |
| DELETE | `/cinemas/{cinemaId}` | Delete cinema |

### Rooms — `/rooms`

| Method | Path | Description |
|---|---|---|
| POST | `/rooms` | Create room |
| GET | `/rooms` | List all rooms |
| GET | `/rooms/{roomId}` | Get room |
| PUT | `/rooms/{roomId}` | Update room |
| DELETE | `/rooms/{roomId}` | Delete room |

---

### 💺 Seats & Seat Types

| Method | Path | Description |
|---|---|---|
| POST | `/seat-types` | Create seat type |
| GET | `/seat-types` | List all seat types |
| PUT | `/seat-types/{id}` | Update seat type |
| DELETE | `/seat-types/{id}` | Delete seat type |

---

### 🎞️ Screenings — `/screenings`

| Method | Path | Description |
|---|---|---|
| POST | `/screenings` | Create screening |
| GET | `/screenings` | List all screenings |
| GET | `/screenings/{screeningId}` | Get screening |
| GET | `/screenings/{screeningId}/detail` | Get screening with seat map |
| GET | `/screenings/movie/{movieId}` | Screenings for a movie |
| GET | `/screenings/room/{roomId}` | Screenings for a room |
| PUT | `/screenings/{screeningId}` | Update screening |
| DELETE | `/screenings/{screeningId}` | Delete screening |

### Screening Seats — `/screening-seats`

| Method | Path | Description |
|---|---|---|
| GET | `/screening-seats/{screeningId}` | Get all seats for a screening |
| PUT | `/screening-seats/{seatId}/lock` | Temporarily lock a seat |
| PUT | `/screening-seats/{seatId}/unlock` | Unlock a seat |

---

### 📅 Bookings — `/bookings`

| Method | Path | Description |
|---|---|---|
| POST | `/bookings` | Create booking (select seats) |
| GET | `/bookings` | List all bookings (admin, with filters: status, customer, movie, cinema) |
| GET | `/bookings/{bookingId}/summary` | Get booking summary with pricing |
| POST | `/bookings/{bookingId}/redeem-points` | Apply loyalty point discount |
| POST | `/bookings/{bookingId}/cancel` | Cancel booking |
| POST | `/bookings/{bookingId}/create-invoice` | Generate invoice before payment |

---

### 💳 Payments — `/payment`

| Method | Path | Description |
|---|---|---|
| POST | `/payment/vnpay/{invoiceId}` | Create VNPay payment URL |
| GET | `/payment/vnpay-return` | VNPay redirect callback (after payment) |
| GET | `/payment/vnpay-ipn` | VNPay IPN (instant payment notification) |
| POST | `/payment/cash/{invoiceId}` | Process cash payment |

### Invoices — `/invoices`

| Method | Path | Description |
|---|---|---|
| GET | `/invoices/{invoiceId}` | Get invoice details |
| GET | `/invoices/booking/{bookingId}` | Get invoice by booking |

---

### 🎫 Tickets — `/tickets`

| Method | Path | Description |
|---|---|---|
| GET | `/tickets/by-booking/{bookingId}` | Get all tickets for a booking |
| GET | `/tickets/{ticketCode}` | Get ticket by code |
| GET | `/tickets/check-in/{ticketCode}` | Get check-in view for a ticket |
| GET | `/tickets/my-tickets/{customerId}` | Customer's ticket history |
| POST | `/tickets/check-in/{ticketCode}` | Staff check-in a ticket |
| POST | `/tickets/{ticketCode}/mark-for-transfer` | Mark ticket for transfer |
| POST | `/tickets/{ticketCode}/cancel-transfer` | Cancel ticket transfer |

---

### 🍿 Combos — `/combos`, `/combo-items`

| Method | Path | Description |
|---|---|---|
| POST | `/combos` | Create combo |
| GET | `/combos` | List all combos |
| GET | `/combos/{id}` | Get combo |
| PUT | `/combos/{id}` | Update combo |
| DELETE | `/combos/{id}` | Delete combo |
| POST | `/combo-items` | Create combo item |
| GET | `/combo-items/{comboId}` | List items in a combo |
| DELETE | `/combo-items/{id}` | Delete combo item |

### Booking Combos — `/booking-combos`

| Method | Path | Description |
|---|---|---|
| POST | `/booking-combos` | Add combo to booking |
| GET | `/booking-combos/{bookingId}` | Get combos for booking |
| DELETE | `/booking-combos/{id}` | Remove combo from booking |

---

### 💰 Price Configuration — `/price-configs`

| Method | Path | Description |
|---|---|---|
| POST | `/price-configs` | Create price config |
| GET | `/price-configs` | List all price configs |
| PUT | `/price-configs/{id}` | Update price config |
| DELETE | `/price-configs/{id}` | Delete price config |

---

### 📊 Revenue — `/revenue`

| Method | Path | Description |
|---|---|---|
| POST | `/revenue/reports` | Create revenue report (manual) |
| GET | `/revenue/reports?cinemaId=&reportType=&from=&to=` | Query revenue reports |
| POST | `/revenue/reports/generate` | Auto-generate report for a period |
| POST | `/revenue/daily` | Create daily revenue summary |
| GET | `/revenue/daily?cinemaId=&from=&to=` | Query daily summaries |
| POST | `/revenue/movie` | Create movie revenue entry |
| GET | `/revenue/movie?cinemaId=&movieId=&from=&to=` | Query movie revenues |
| POST | `/revenue/reprocess` | Reprocess failed revenue calculations |

---

### ⭐ Reviews — `/reviews`

| Method | Path | Description |
|---|---|---|
| POST | `/reviews` | Create movie review |
| GET | `/reviews/{reviewId}` | Get review by ID |
| GET | `/reviews/movie/{movieId}` | All reviews for a movie |
| GET | `/reviews/movie/{movieId}/paginated` | Paginated reviews |
| GET | `/reviews/movie/{movieId}/most-helpful` | Most helpful reviews |
| GET | `/reviews/movie/{movieId}/recent` | Most recent reviews |
| GET | `/reviews/movie/{movieId}/stats` | Rating statistics (avg, distribution) |
| GET | `/reviews/customer/{customerId}` | Reviews by customer |
| GET | `/reviews/votes?customerId=&reviewIds=` | Get user's votes on reviews |
| PUT | `/reviews/{reviewId}` | Update review |
| PATCH | `/reviews/{reviewId}/helpful?customerId=` | Vote helpful |
| PATCH | `/reviews/{reviewId}/unhelpful?customerId=` | Vote unhelpful |
| DELETE | `/reviews/{reviewId}` | Delete review |

---

### 🔔 Notifications — `/notifications`

| Method | Path | Description |
|---|---|---|
| GET | `/notifications` | Get current user's notifications (paginated) |
| GET | `/notifications/unread-count` | Count of unread notifications |
| GET | `/notifications/{id}` | Get notification detail |
| PUT | `/notifications/{id}/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/{id}` | Delete notification |
| POST | `/notifications/email/send` | Send email notification (public) |
| POST | `/notifications/admin/send` | Admin broadcast notification |
| GET | `/notification-templates` | List templates |
| POST | `/notification-templates` | Create template |
| GET | `/notification-preferences` | Get user preferences |
| PUT | `/notification-preferences` | Update preferences |

---

### 🤖 Chatbot — `/chatbot`

| Method | Path | Description |
|---|---|---|
| POST | `/chatbot/chat` | Send message to AI chatbot |
| GET | `/chatbot/history` | Get conversation history |
| DELETE | `/chatbot/history` | Clear current user's conversation |
| POST | `/chatbot/config/upload` | Upload document for RAG knowledge base |
| GET | `/chatbot/config/documents` | List uploaded documents |
| DELETE | `/chatbot/config/documents/{id}` | Delete a document |

---

### 🗂️ File Management — `/files`

| Method | Path | Description |
|---|---|---|
| POST | `/files/upload` | Upload image to Cloudinary |
| DELETE | `/files/{publicId}` | Delete file from Cloudinary |

---

### 🛠️ Equipment — `/equipments`, `/equipment-categories`

| Method | Path | Description |
|---|---|---|
| POST | `/equipments` | Add equipment |
| GET | `/equipments` | List equipment |
| PUT | `/equipments/{id}` | Update equipment |
| DELETE | `/equipments/{id}` | Delete equipment |
| POST | `/equipment-categories` | Create category |
| GET | `/equipment-categories` | List categories |

---

### 📆 Work Schedules — `/work-schedules`

| Method | Path | Description |
|---|---|---|
| POST | `/work-schedules` | Create schedule |
| GET | `/work-schedules` | List schedules |
| PUT | `/work-schedules/{id}` | Update schedule |
| DELETE | `/work-schedules/{id}` | Delete schedule |

---

## 5. Business Logic & Workflows

### Booking Flow
```
1. Customer selects screening → seats are LOCKED temporarily (via ScreeningSeat.lockUntil)
2. POST /bookings → Booking created (status: PENDING), tickets reserved
3. Optional: POST /bookings/{id}/redeem-points → Loyalty discount applied
4. Optional: POST /booking-combos → Add food/drink combos
5. POST /bookings/{id}/create-invoice → Invoice generated
6. POST /payment/vnpay/{invoiceId} → VNPay payment URL returned
7. Customer pays → VNPay IPN callback received
8. Invoice marked PAID, Booking → CONFIRMED, Tickets → ACTIVE
9. Email with QR codes sent via Brevo (SendInBlue)
10. Ticket expires based on expiresAt; scheduler auto-marks expired tickets
```

### Payment Modes
- **VNPay Online**: Creates payment URL, handles IPN + return callbacks
- **Cash**: Direct mark-paid by cashier staff via `POST /payment/cash/{invoiceId}`

### Ticket Check-in
```
Staff scans QR → GET /tickets/check-in/{ticketCode} → verify status
→ POST /tickets/check-in/{ticketCode} → Ticket.status = USED, Ticket.usedAt = now
```

### Ticket Transfer
```
Customer → POST /tickets/{code}/mark-for-transfer → status = TRANSFER_PENDING
Recipient accepts → status changes to ACTIVE for new owner
Cancel → POST /tickets/{code}/cancel-transfer → reverts to ACTIVE
```

### Loyalty Points
- Customers earn points on confirmed bookings
- Points can be redeemed for discounts via `POST /bookings/{id}/redeem-points`

### Pricing Rules
- Price = `base price (PriceConfig)` × `SeatType.priceMultiplier`
- PriceConfig varies by: `DayType` (WEEKDAY/WEEKEND/HOLIDAY) + `TimeSlot` (MORNING/AFTERNOON/EVENING/NIGHT)

### Revenue Processing
- Auto-aggregated into `DailyRevenueSummary` and `MovieRevenue` records
- Manual `POST /revenue/reports/generate` for custom period reports
- `RevenueProcessingLog` tracks reprocessing history

### AI Chatbot (RAG)
- Documents uploaded via `/chatbot/config/upload` (Apache Tika parsing)
- Stored as vector embeddings in pgvector
- On chat: user query → semantic search → context injected into OpenAI GPT prompt
- Per-user conversation memory stored via Spring AI JDBC chat memory

---

## 6. Database Schema Summary

```
accounts (id, email, username, password, accountType, isActive, created_at, updated_at, deleted)
customers (id, account_id FK→accounts, firstName, lastName, address, avatarUrl, phoneNumber, loyaltyPoints, gender, dob, ...)
staffs (id, account_id FK→accounts, cinemaId, firstName, lastName, phoneNumber, jobTitle, address, gender, dob, ...)
roles (name PK, description)
permissions (name PK, description)
roles_permissions (role_name FK, permission_name FK)  -- join table
staff_roles (staff_id FK, role_name FK)               -- join table

cinemas (id, name, address, city, phoneNumber, buffer, managerId FK→staffs, ...)
rooms (id, cinema_id FK→cinemas, name, roomType, status, totalSeats, ...)
seat_types (id, name, description, priceMultiplier, ...)
seats (id, rowChair, seatNumber, room_id FK→rooms, seat_type_id FK→seat_types, ...)

movies (id, title, slug UNIQUE, description, durationMinutes, director, castMembers, posterUrl, trailerUrl, releaseDate, endDate, age_rating_id FK, status, ...)
genres (id, name, description, ...)
movie_genres (movie_id FK, genre_id FK)               -- join table
age_ratings (id, code, description, ...)

screenings (id, roomId FK→rooms, movieId FK→movies, startTime, endTime, status, ...)
screening_seats (id, screeningId FK, seatId FK, booking, status, lockUntil, ...)

bookings (id UUID, customer_id FK→customers, screening_id FK, status, subtotal, discount, totalAmount, createdAt, expiredAt)
booking_combos (id, bookingId FK, comboId FK, quantity)
invoices (id UUID, bookingId UNIQUE, totalAmount, status, createdAt, paidAt)
payments (id UUID, invoiceId FK, paymentMethodId FK, amount, paymentType, transactionCode UNIQUE, status, description, paymentDate, createdAt)
payment_methods (id, name, code)

tickets (id UUID, booking_id FK→bookings, screening_seat_id FK UNIQUE, seatName, price, ticket_code UNIQUE, qrContent TEXT, status, usedAt, expiresAt, createdAt)

combos (id, name, description, price, imageUrl, ...)
combo_items (id, combo_id FK, name, quantity, ...)

price_configs (id, dayType, timeSlot, price, seatTypeId FK, ...)

movie_reviews (id, movie_id FK, customer_id FK, rating, content, helpfulCount, unhelpfulCount, ...)
review_votes (id, review_id FK, customerId, voteType)

notifications (id, userId, title, body, type, isRead, createdAt, ...)
notification_logs (id, notification_id FK, channel, status, sentAt)
notification_channels (id, name, code)
notification_templates (id, name, subject, bodyTemplate, channel_id FK)
notification_preferences (id, userId, channel_id FK, enabled)

revenue_reports (id, cinemaId, reportType, fromDate, toDate, totalRevenue, ...)
daily_revenue_summaries (id, cinemaId, date, totalRevenue, ticketCount, ...)
movie_revenues (id, movieId, cinemaId, revenue, ticketsSold, date, ...)
revenue_processing_logs (id, status, message, processedAt, ...)

equipments (id, name, serial, category_id FK, room_id FK, status, ...)
equipment_categories (id, name, description, ...)
work_schedules (id, staffId, date, shiftTypeId FK, cinemaId, ...)
shift_types (id, name, startTime, endTime, ...)

file_mgnt (id, url, publicId, uploadedBy, ...)
invalidated_tokens (id, expiryTime)
otp_tokens (id, email, otp, expiresAt, used)
websocket_sessions (id, userId, sessionId, connectedAt)
chatbot_documents (id, filename, content, uploadedAt)
vector_store / VectorDocument (pgvector table)
```

---

## 7. External Integrations

| Integration | Library / SDK | Purpose |
|---|---|---|
| **VNPay** | Custom (`VNPayConfig`) | Vietnamese online payment gateway — generates signed payment URLs, handles IPN/return callbacks |
| **Cloudinary** | `cloudinary-http45` v1.38.0 | Image/video asset storage for movie posters, avatars, combo images |
| **Brevo (SendInBlue)** | `sib-api-v3-sdk` v7.0.0 | Transactional email — booking confirmations, OTP emails, ticket delivery |
| **Google OAuth** | Custom Feign client | Google login via authorization code exchange |
| **OpenAI GPT** | `spring-ai-starter-model-openai` v1.0.1 | AI chatbot (chat completions) |
| **pgvector** | `spring-ai-starter-vector-store-pgvector` | Vector similarity search for RAG (chatbot context retrieval) |
| **Apache Tika** | `spring-ai-tika-document-reader` | Parse PDF/Office documents for chatbot knowledge base |
| **Spring AI JDBC Memory** | `spring-ai-starter-model-chat-memory-repository-jdbc` | Persistent per-user chat history |
| **ZXing** | `core` + `javase` v3.5.3 | QR code generation for tickets |
| **Netty Socket.IO** | `netty-socketio` v2.0.3 | Real-time WebSocket notifications (seat locking, booking updates) |
| **Spring Cloud OpenFeign** | `spring-cloud-starter-openfeign` | Declarative HTTP clients (Google OAuth, etc.) |
| **Jsoup** | v1.17.2 | HTML sanitization |
| **Slugify** | v3.0.7 | SEO-friendly URL slugs for movies |

---

## 8. Authentication & Authorization

### Mechanism
- **JWT (JSON Web Tokens)** issued by the application itself (not delegated to an external IdP)
- Implemented via **Spring Security OAuth2 Resource Server** (`spring-boot-starter-oauth2-resource-server`)
- Custom `CustomJwtDecoder` validates tokens locally

### Flow
```
Login → POST /auth/{admin|customer}/login
     → BCrypt password verification
     → JWT issued with claims: sub (accountId), roles/permissions as scopes
     → Returns: { token, authenticated }

Subsequent requests:
  Authorization: Bearer <JWT>
  → CustomJwtDecoder validates signature + expiry
  → JwtAuthenticationConverter extracts authorities (no ROLE_ prefix)
  → Method-level security via @EnableMethodSecurity (@PreAuthorize)
```

### Token Lifecycle
- **Refresh**: `POST /auth/refresh` — issues new token
- **Logout**: `POST /auth/logout` — JTI added to `invalidated_tokens` table (blocklist)
- **Introspect**: `POST /auth/introspect` — validates if token is still active

### OAuth (Google)
- `POST /auth/outbound/authenticate?code=...`
- Exchanges Google auth code for user info via Feign client
- Auto-creates Customer account if first login
- Issues internal JWT

### Password Reset
- `POST /auth/forgot-password` → generates OTP stored in `otp_tokens` table, sent via Brevo email
- `POST /auth/reset-password` → validates OTP, updates password

### Public Endpoints (no auth required)
```
POST: /register, /auth/**, /notifications/email/send
GET:  /movies/**, /genres/**, /screenings/**, /payment/**, /reviews/**, /cinemas
```

### Authorization Model
- **RBAC**: `Staff` → `Set<Role>` → `Set<Permission>`
- Roles are string-named (e.g., `ADMIN`, `CASHIER`, `MANAGER`)
- Permissions are fine-grained string codes
- Authorities embedded in JWT scope claim, enforced via `@PreAuthorize("hasAuthority('...')")`
- Password encoder: **BCrypt with strength 10**

---

*Report generated: 2026-06-19 | Source: `e:\nam3\CNWebUD\theater-mgnt\backend\theatermgnt`*
