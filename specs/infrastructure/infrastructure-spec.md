# Infrastructure Specification

> **Source**: `application.yml`, `docker-compose.yml` (mono), all service specs, `service-boundaries.md`.
> **Updated**: 2026-06-21

---

## 1. Port Allocation

| Component | Host Port | Container Port | Notes |
|-----------|-----------|----------------|-------|
| **API Gateway** | 8080 | 8080 | Spring Cloud Gateway; context `/api` |
| **Identity Service** | 8081 | 8081 | MySQL-backed; JWT issuer |
| **Catalog Service** | 8082 | 8082 | PostgreSQL + Redis |
| **Booking Service** | 8083 | 8083 | PostgreSQL + Redis |
| **Payment Service** | 8084 | 8084 | PostgreSQL; VNPay integration |
| **Notification Service** | 8085 | 8085 | PostgreSQL; Brevo + Socket.IO |
| **Analytics Service** | 8086 | 8086 | PostgreSQL |
| **Eureka Server** | 8761 | 8761 | Spring Cloud Netflix Eureka |
| **MySQL (Identity)** | 3306 | 3306 | `identitydb` |
| **PostgreSQL (Catalog)** | 5432 | 5432 | `catalog_db` |
| **PostgreSQL (Booking)** | 5433 | 5432 | `booking_db` |
| **PostgreSQL (Payment)** | 5434 | 5432 | `payment_db` |
| **PostgreSQL (Notification)** | 5435 | 5432 | `notification_db` |
| **PostgreSQL (Analytics)** | 5436 | 5432 | `analytics_db` |
| **Redis** | 6379 | 6379 | Shared: seat locks + catalog cache |
| **Kafka** | 9092 | 9092 | 1 broker (dev); 3 in staging |
| **Zookeeper** | 2181 | 2181 | Kafka dependency |
| **Socket.IO (Notification)** | 9100 | 9100 | Real-time IN_APP push (separate from HTTP) |

> **Note**: Socket.IO in the monolith runs on port `9092` (conflicts with Kafka in microservice). Reassign to `9100` in the microservice.

---

## 2. `application.yml` Template (per microservice)

Every service should follow this skeleton. Replace `[SERVICE]` placeholders:

```yaml
server:
  port: ${PORT:808X}

spring:
  application:
    name: [service-name]-service   # e.g. catalog-service

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:[service]_db}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      idle-timeout: 30000
      connection-timeout: 20000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate        # use 'update' in dev, 'validate' in prod
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc.batch_size: 50
        order_inserts: true

  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    consumer:
      group-id: [service-name]-group
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.theatermgnt.*"
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_URI:http://localhost:8761/eureka}
    fetch-registry: true
    register-with-eureka: true
  instance:
    prefer-ip-address: true
    instance-id: ${spring.application.name}:${spring.application.instance_id:${random.value}}

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always

logging:
  level:
    com.theatermgnt: INFO
```

### Catalog Service additions

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      timeout: 2000ms

  cache:
    type: redis
    redis:
      time-to-live: 300000     # 5 min default; override per cache name

catalog:
  cache:
    movie-ttl: 300        # seconds
    screening-ttl: 300
    cinema-ttl: 600
```

### Booking Service additions

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}

booking:
  seat-lock-ttl-minutes: 10
  booking-session-ttl-minutes: 15
```

### Identity Service additions (MySQL)

```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:identitydb}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect

jwt:
  signer-key: ${JWT_SECRET}
  valid-duration: ${JWT_VALID_DURATION:3600}       # seconds
  refreshable-duration: ${JWT_REFRESHABLE_DURATION:36000}

outbound:
  identity:
    client-id: ${GOOGLE_CLIENT_ID}
    client-secret: ${GOOGLE_CLIENT_SECRET}
    redirect-uri: ${OAUTH_REDIRECT_URI}

otp:
  valid-duration: ${OTP_VALID_DURATION:10}         # minutes
```

### Payment Service additions

```yaml
vnpay:
  tmn-code: ${VNPAY_TMN_CODE}
  hash-secret: ${VNPAY_HASH_SECRET}
  url: ${VNPAY_URL:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}
  return-url: ${VNPAY_RETURN_URL}
  ipn-url: ${VNPAY_IPN_URL}
  version: "2.1.0"
  command: pay
  order-type: other
```

### Notification Service additions

```yaml
brevo:
  api-key: ${BREVO_API_KEY}
  sender:
    name: ${BREVO_SENDER_NAME:Cifastar}
    email: ${BREVO_SENDER_EMAIL}

socketio:
  host: ${SOCKETIO_HOST:0.0.0.0}
  port: ${SOCKETIO_PORT:9100}
```

### API Gateway additions

```yaml
server:
  port: 8080

spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
      routes:
        # See §3 for full route definitions

app:
  cors:
    allowed-origins:
      - ${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}
```

---

## 3. API Gateway Routes

All routes strip the service prefix and forward to the downstream service via Eureka service ID. JWT validation filter runs on all routes except public endpoints.

| Route ID | Path Pattern | Upstream Service ID | Strip Prefix | Auth Required | Notes |
|----------|-------------|---------------------|-------------|--------------|-------|
| `identity-auth` | `/auth/**` | `identity-service` | no | mixed | `/auth/login`, `/auth/refresh` public; others need JWT |
| `identity-customers` | `/customers/**` | `identity-service` | no | YES | Customer profile management |
| `identity-staffs` | `/staffs/**` | `identity-service` | no | YES (ADMIN) | Staff management |
| `identity-roles` | `/roles/**` | `identity-service` | no | YES (ADMIN) | RBAC roles |
| `identity-permissions` | `/permissions/**` | `identity-service` | no | YES (ADMIN) | RBAC permissions |
| `catalog-movies` | `/movies/**` | `catalog-service` | no | mixed | GET public; POST/PUT/DELETE ADMIN |
| `catalog-genres` | `/genres/**` | `catalog-service` | no | mixed | |
| `catalog-age-ratings` | `/age-ratings/**` | `catalog-service` | no | mixed | |
| `catalog-cinemas` | `/cinemas/**` | `catalog-service` | no | mixed | |
| `catalog-rooms` | `/rooms/**` | `catalog-service` | no | YES | |
| `catalog-seats` | `/seats/**` | `catalog-service` | no | mixed | GET public |
| `catalog-seat-types` | `/seat-types/**` | `catalog-service` | no | mixed | |
| `catalog-price-configs` | `/price-configs/**` | `catalog-service` | no | YES (ADMIN) | |
| `catalog-screenings` | `/screenings/**` | `catalog-service` | no | mixed | GET public |
| `booking-reservations` | `/seat-reservations/**` | `booking-service` | no | YES | |
| `booking-bookings` | `/bookings/**` | `booking-service` | no | YES | |
| `booking-combos` | `/combos/**` | `booking-service` | no | mixed | |
| `booking-combo-items` | `/combo-items/**` | `booking-service` | no | mixed | |
| `booking-tickets` | `/tickets/**` | `booking-service` | no | YES | |
| `payment-invoices` | `/invoices/**` | `payment-service` | no | YES | |
| `payment-vnpay` | `/payment/vnpay/**` | `payment-service` | no | mixed | IPN/return: public |
| `payment-cash` | `/payment/cash/**` | `payment-service` | no | YES (STAFF) | |
| `notification-user` | `/notifications/**` | `notification-service` | no | YES | |
| `notification-admin` | `/admin/notifications/**` | `notification-service` | no | YES (ADMIN) | |
| `notification-templates` | `/notification-templates/**` | `notification-service` | no | YES (ADMIN) | |
| `notification-preferences` | `/notification-preferences/**` | `notification-service` | no | YES | |
| `analytics-revenue` | `/revenue/**` | `analytics-service` | no | YES (ADMIN) | |

### Public endpoints (no JWT check)

```yaml
# These paths bypass the JWT filter
public-paths:
  - /auth/login
  - /auth/refresh
  - /auth/outbound/authenticate
  - /auth/forgot-password
  - /auth/introspect
  - /payment/vnpay-return       # user browser redirect — no JWT
  - /payment/vnpay-ipn          # VNPay server call — no JWT
  - /movies                     # GET only
  - /movies/now-showing
  - /movies/coming-soon
  - /movies/slug/**
  - /genres
  - /age-ratings
  - /cinemas
  - /screenings/**              # GET only — seat map is public
  - /actuator/health
```

---

## 4. Environment Variables

> ## ⚠️ Security Requirements — Hardcoded Secrets in Monolith
>
> The following values are **hardcoded in the monolith's `application.yml`** and **MUST be moved to environment variables** before any microservice deployment. Committing secrets to source control is a critical security vulnerability.
>
> | Variable | Was Hardcoded As (in mono `application.yml`) | Correct Approach |
> |----------|----------------------------------------------|-----------------|
> | `JWT_SECRET` | Long Base64 string starting with `+PAV/uNVIsN2N1pe...` | `${JWT_SECRET}` from `.env` — min 256-bit HMAC-SHA512 key |
> | `DB_PASSWORD` | `postgres` (plain text) | `${DB_PASSWORD}` from `.env` — never use default credentials |
> | `VNPAY_HASH_SECRET` | Plain string in `vnpay.hash-secret` | `${VNPAY_HASH_SECRET}` from `.env` |
> | `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` value directly in config | `${GOOGLE_CLIENT_SECRET}` from `.env` |
> | `BREVO_API_KEY` | `xkeysib-...` value directly in config | `${BREVO_API_KEY}` from `.env` |
>
> **Action required before any deployment**:
> 1. The `.env.example` file in `specs/infrastructure/` lists all required env vars — copy to `.env` and fill in real values.
> 2. Add `.env` to `.gitignore` **immediately** if not already present.
> 3. Verify no secret values appear anywhere in any `application.yml` committed to the repo.
> 4. Rotate any secrets that were previously committed to version control.

All secrets must be provided via environment variables. The values below match `${...}` placeholders found in `application.yml`.

| Variable | Used By | Example Value | Secret? | Description |
|----------|---------|---------------|---------|-------------|
| `JWT_SECRET` | Identity, API Gateway | `+PAV/uNVIsN2N1pe...` (min 256-bit) | **YES** | HMAC-SHA512 JWT signing key |
| `JWT_VALID_DURATION` | Identity | `3600` | no | Access token TTL in seconds |
| `JWT_REFRESHABLE_DURATION` | Identity | `36000` | no | Refresh token TTL in seconds |
| `GOOGLE_CLIENT_ID` | Identity | `xxx.apps.googleusercontent.com` | **YES** | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Identity | `GOCSPX-...` | **YES** | Google OAuth2 client secret |
| `OAUTH_REDIRECT_URI` | Identity | `http://localhost:3000/oauth2/callback` | no | OAuth redirect after Google login |
| `OTP_VALID_DURATION` | Identity | `10` | no | OTP TTL in minutes |
| `VNPAY_TMN_CODE` | Payment | `ABCD1234` | **YES** | VNPay terminal merchant code |
| `VNPAY_HASH_SECRET` | Payment | `secret123...` | **YES** | HMAC-SHA512 key for VNPay signature |
| `VNPAY_URL` | Payment | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` | no | VNPay gateway URL (sandbox vs prod) |
| `VNPAY_RETURN_URL` | Payment | `https://yoursite.com/payment/vnpay-return` | no | Frontend redirect after VNPay |
| `VNPAY_IPN_URL` | Payment | `https://yoursite.com/payment/vnpay-ipn` | no | Server-to-server IPN URL |
| `BREVO_API_KEY` | Notification | `xkeysib-...` | **YES** | Brevo transactional email API key |
| `BREVO_SENDER_EMAIL` | Notification | `noreply@cifastar.com` | no | From email address (must be verified in Brevo) |
| `GEMINI_KEY` | *(monolith only — drop in microservice)* | `AIza...` | **YES** | Google Gemini API key for chatbot |
| `CLOUDINARY_CLOUD_NAME` | *(monolith only — drop in microservice)* | `mycloudname` | no | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | *(monolith only — drop in microservice)* | `123456789` | **YES** | Cloudinary upload API key |
| `CLOUDINARY_API_SECRET` | *(monolith only — drop in microservice)* | `secret...` | **YES** | Cloudinary API secret |
| `DB_HOST` | All services | `localhost` | no | PostgreSQL/MySQL host |
| `DB_PORT` | All services | `5432` | no | Database port (per-service) |
| `DB_NAME` | All services | `catalog_db` | no | Database name (per-service) |
| `DB_USERNAME` | All services | `postgres` | no | Database username |
| `DB_PASSWORD` | All services | `postgres` | **YES** | Database password |
| `REDIS_HOST` | Catalog, Booking | `localhost` | no | Redis host |
| `REDIS_PORT` | Catalog, Booking | `6379` | no | Redis port |
| `REDIS_PASSWORD` | Catalog, Booking | `` | **YES** | Redis password (empty if no auth) |
| `KAFKA_BOOTSTRAP_SERVERS` | All services | `localhost:9092` | no | Kafka broker list |
| `EUREKA_URI` | All services | `http://localhost:8761/eureka` | no | Eureka service registry URL |
| `CORS_ALLOWED_ORIGINS` | API Gateway | `http://localhost:3000` | no | Comma-separated CORS origins |
| `SOCKETIO_PORT` | Notification | `9100` | no | Socket.IO server port |

### Removed from microservice (monolith-only)
- `GEMINI_KEY` — Chatbot module removed from scope
- `CLOUDINARY_*` — Each service stores its own image URLs; no central file service

---

## 5. Kafka Topics

| Topic Name | Partitions | Retention | Publisher | Consumers |
|------------|-----------|-----------|-----------|-----------|
| `cinema.catalog.screening-created` | 3 | 7 days | Catalog Service | Booking Service |
| `cinema.catalog.screening-cancelled` | 3 | 7 days | Catalog Service | Booking Service |
| `cinema.booking.booking-created` | 3 | 7 days | Booking Service | Payment Service, Notification Service |
| `cinema.booking.booking-cancelled` | 3 | 7 days | Booking Service | Payment Service, Notification Service |
| `cinema.booking.ticket-issued` | 3 | 7 days | Booking Service | Notification Service |
| `cinema.booking.loyalty-points-earned` | 3 | 7 days | Booking Service | Identity Service |
| `cinema.payment.payment-confirmed` | 3 | 7 days | Payment Service | Booking Service, Analytics Service, Notification Service |
| `cinema.payment.payment-failed` | 3 | 7 days | Payment Service | Booking Service, Notification Service |
| `cinema.payment.invoice-refunded` | 3 | 7 days | Payment Service | Analytics Service, Notification Service |

### Topic naming convention
```
cinema.{service-domain}.{event-name-kebab}
```
- Service domain: `catalog`, `booking`, `payment`
- Event name: past tense, kebab-case, e.g. `screening-created`, `payment-confirmed`

### Consumer group IDs

| Service | Consumer Group ID |
|---------|------------------|
| Booking Service | `booking-service-group` |
| Payment Service | `payment-service-group` |
| Notification Service | `notification-service-group` |
| Analytics Service | `analytics-service-group` |
| Identity Service | `identity-service-group` |

---

## 6. Redis Key Patterns

| Key Pattern | TTL | Owner | Purpose |
|-------------|-----|-------|---------|
| `seat:lock:{screeningId}:{seatId}` | 10 min | Booking Service | Temporary seat hold during checkout |
| `booking:session:{bookingId}` | 15 min | Booking Service | Pending payment session guard |
| `catalog:movie:{movieId}` | 5 min | Catalog Service | Movie entity cache |
| `catalog:screening:{screeningId}` | 5 min | Catalog Service | Screening entity cache |
| `catalog:cinema:{cinemaId}` | 10 min | Catalog Service | Cinema entity cache |

All Redis keys use **string** type. Seat locks use `SET NX PX` for atomic acquire; catalog cache stores serialized JSON.

### Redis Docker Healthcheck

Use the following in `docker-compose.yml` for the Redis service:

```yaml
redis:
  image: redis:7-alpine
  container_name: redis
  ports:
    - "6379:6379"
  healthcheck:
    # Default: no auth (use when REDIS_PASSWORD is empty)
    test: ["CMD", "redis-cli", "ping"]
    # If REDIS_PASSWORD is set in .env, switch to the auth form:
    # test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s
  command: >
    sh -c "
      if [ -n \"$${REDIS_PASSWORD}\" ]; then
        redis-server --requirepass $${REDIS_PASSWORD}
      else
        redis-server
      fi
    "
```

> **Note**: If `REDIS_PASSWORD` is set in `.env`, uncomment the auth form of the `healthcheck.test` command. If `REDIS_PASSWORD` is empty (local dev), use plain `redis-cli ping`. Do not pass `-a ""` (empty string) to `redis-cli` — it will fail on Redis 7+.



---

## 7. Database Summary

| Service | DB Type | DB Name | Port (host) | User | Notes |
|---------|---------|---------|------------|------|-------|
| Identity | MySQL 8 | `identitydb` | 3306 | `root` | Account, Customer, Staff, Role, Permission |
| Catalog | PostgreSQL 17 | `catalog_db` | 5432 | `postgres` | Movie, Cinema, Room, Seat, Screening, PriceConfig |
| Booking | PostgreSQL 17 | `booking_db` | 5433 | `postgres` | Booking, SeatReservation, Ticket, Combo |
| Payment | PostgreSQL 17 | `payment_db` | 5434 | `postgres` | Invoice, Payment, PaymentMethod |
| Notification | PostgreSQL 17 | `notification_db` | 5435 | `postgres` | Notification, NotificationLog, Template |
| Analytics | PostgreSQL 17 | `analytics_db` | 5436 | `postgres` | DailyRevenueSummary, MovieRevenue, RevenueReport |

**Monolith baseline**: The existing `docker-compose.yml` runs a single PostgreSQL 17.5 instance on host port 5433 with `POSTGRES_DB=theaterdb`. In the microservice migration, this is split into 5 separate PostgreSQL instances (or 5 schemas in one instance for dev).

---

## 8. Health Check Endpoints

Each Spring Boot service exposes:
- `GET /actuator/health` → `{ "status": "UP" }`
- `GET /actuator/info`
- `GET /actuator/metrics`

The API Gateway should use the `/actuator/health` endpoint to validate downstream service health before routing.

---

## 9. Service Startup Order

```
1. Zookeeper
2. Kafka           (depends: Zookeeper)
3. MySQL           (depends: nothing)
4. PostgreSQL ×5   (depends: nothing)
5. Redis           (depends: nothing)
6. Eureka Server   (depends: nothing)
7. Identity Service      (depends: MySQL, Eureka)
8. Catalog Service       (depends: PostgreSQL/catalog, Redis, Kafka, Eureka)
9. Booking Service       (depends: PostgreSQL/booking, Redis, Kafka, Eureka)
10. Payment Service      (depends: PostgreSQL/payment, Kafka, Eureka)
11. Notification Service (depends: PostgreSQL/notification, Kafka, Eureka)
12. Analytics Service    (depends: PostgreSQL/analytics, Kafka, Eureka)
13. API Gateway          (depends: Eureka, all services)
```

---

## 10. Network Architecture

All containers share a single Docker bridge network: `cinema-network`.

Inter-service communication uses Docker service names as hostnames:
- `postgres-catalog:5432`, `postgres-booking:5432`, etc.
- `redis:6379`
- `kafka:9092`
- `eureka:8761`

Services communicate with each other via Eureka-resolved hostnames in production, but can use direct container names in dev Docker Compose.
