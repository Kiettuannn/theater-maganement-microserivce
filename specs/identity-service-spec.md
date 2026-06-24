# Identity Service — Technical Specification

> **Source**: Direct code read of all account, authentication, authorization, customer, and staff packages.
> **Updated**: 2026-06-21

---

## 1. Service Overview

- **Purpose**: Manages all identities — account credentials, customer profiles, staff profiles, roles, permissions, JWT issuance/validation, and OAuth login.
- **What it does NOT do**: No booking, payment, or catalog operations; does NOT issue loyalty points directly (consumes `LoyaltyPointsEarned` event); does NOT send emails directly (fires Spring events to Notification Service via Kafka in the microservice).
- **Port**: 8081
- **Tech Stack**: Java 21, Spring Boot 3.5.6, Spring Security 6, MySQL 8, JWT (Nimbus JOSE+JWT, HS512)
- **Database**: MySQL (`identitydb`) — the only service using MySQL; all others use PostgreSQL

---

## 2. Domain Model

### Entity: `Account`

> Class: `com.theatermgnt.theatermgnt.account.entity.Account extends BaseEntity`
> Table: `accounts`
> Soft-delete: `@SQLDelete` sets `deleted = true`; `@Where(deleted = false)` filters queries

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` (UUID) | `id` | PK, `@GeneratedValue(UUID)` | From `BaseEntity` |
| `email` | `String` | `email` | UNIQUE, nullable | Login identifier; must be unique among non-deleted accounts |
| `username` | `String` | `username` | UNIQUE, nullable | Login identifier; must be unique among non-deleted accounts |
| `password` | `String` | `password` | nullable | BCrypt-encoded (strength 10); null for OAuth-only accounts |
| `accountType` | `AccountType` (enum) | `account_type` | `ENUM('INTERNAL','CUSTOMER')` | `INTERNAL` = staff/admin; `CUSTOMER` = customer |
| `isActive` | `Boolean` | `is_active` | nullable | Account active status; `false` = cannot login |
| `createdAt` | `LocalDateTime` | `created_at` | not updatable, nullable | From `BaseEntity`, `@CreationTimestamp` |
| `updatedAt` | `LocalDateTime` | `updated_at` | nullable | From `BaseEntity`, `@UpdateTimestamp` |
| `deleted` | `Boolean` | `deleted` | not null, DEFAULT false | Soft-delete flag; from `BaseEntity` |

**Relationships**:
- `Account 1 — 0..1 Customer` (FK: `customers.account_id`)
- `Account 1 — 0..1 Staff` (FK: `staffs.account_id`)
- `Account 1 — 0..1 OtpToken` (FK: `otp_tokens.account_id`)

> **Soft-delete behaviour on delete**: `deleteAccount()` appends `_deleted_{timestamp}` suffix to both `username` and `email` before setting `deleted = true` and `isActive = false`. This preserves uniqueness constraints for future reuse of the same email/username.

---

### Entity: `Customer`

> Class: `com.theatermgnt.theatermgnt.customer.entity.Customer extends BaseEntity`
> Table: `customers`
> Soft-delete: `@SQLDelete` sets `deleted = true`

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` (UUID) | `id` | PK, `@GeneratedValue(UUID)` | From `BaseEntity` |
| `account` | `Account` | `account_id` | FK → `accounts.id`, not null | `@OneToOne @JoinColumn` |
| `firstName` | `String` | `first_name` | nullable | |
| `lastName` | `String` | `last_name` | nullable | |
| `address` | `String` | `address` | nullable | max 200 chars (enforced at DTO level) |
| `avatarUrl` | `String` | `avatar_url` | nullable | |
| `phoneNumber` | `String` | `phone_number` | nullable | Must match `^0[0-9]{9}$` (10-digit VN number) |
| `loyaltyPoints` | `Integer` | `loyalty_points` | NOT NULL, DEFAULT 0 | `@Builder.Default = 0` |
| `gender` | `Gender` (enum) | `gender` | `ENUM('MALE','FEMALE','OTHER')`, nullable | |
| `dob` | `LocalDate` | `dob` | nullable | Customer must be ≥ 6 years old (enforced at DTO) |
| `createdAt` | `LocalDateTime` | `created_at` | not updatable, nullable | From `BaseEntity` |
| `updatedAt` | `LocalDateTime` | `updated_at` | nullable | From `BaseEntity` |
| `deleted` | `Boolean` | `deleted` | NOT NULL, DEFAULT false | From `BaseEntity` |

**Relationships**:
- `Customer N — 1 Account` (owns FK `account_id`)

---

### Entity: `Staff`

> Class: `com.theatermgnt.theatermgnt.staff.entity.Staff extends BaseEntity`
> Table: `staffs`
> Soft-delete: `@SQLDelete` sets `deleted = true`

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` (UUID) | `id` | PK, `@GeneratedValue(UUID)` | From `BaseEntity` |
| `account` | `Account` | `account_id` | FK → `accounts.id` | `@OneToOne @JoinColumn` |
| `cinemaId` | `String` | `cinema_id` | nullable | Cross-domain reference to Catalog Service; no FK constraint; included in JWT `cinemaId` claim |
| `firstName` | `String` | `first_name` | nullable | |
| `lastName` | `String` | `last_name` | nullable | |
| `phoneNumber` | `String` | `phone_number` | nullable | Must match `^0[0-9]{9}$` |
| `jobTitle` | `String` | `job_title` | nullable | max 100 chars |
| `address` | `String` | `address` | nullable | max 200 chars |
| `avatarUrl` | `String` | `avatar_url` | nullable | |
| `dob` | `LocalDate` | `dob` | nullable | Staff must be ≥ 6 years old (enforced at DTO) |
| `gender` | `Gender` (enum) | `gender` | `ENUM('MALE','FEMALE','OTHER')`, nullable | |
| `roles` | `Set<Role>` | join table `staffs_roles` | `@ManyToMany` | Set of `Role` entities |
| `createdAt` | `LocalDateTime` | `created_at` | not updatable, nullable | From `BaseEntity` |
| `updatedAt` | `LocalDateTime` | `updated_at` | nullable | From `BaseEntity` |
| `deleted` | `Boolean` | `deleted` | NOT NULL, DEFAULT false | From `BaseEntity` |

**Relationships**:
- `Staff N — 1 Account` (owns FK `account_id`)
- `Staff N — M Role` (join table `staffs_roles`)

---

### Entity: `Role`

> Class: `com.theatermgnt.theatermgnt.authorization.entity.Role`
> Table: `roles`
> **No `BaseEntity`** — minimal entity; PK is the role name string

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `name` | `String` | `name` | PK | Role identifier e.g. `ADMIN`, `STAFF`, `MANAGER` |
| `description` | `String` | `description` | nullable | Human-readable description |
| `permissions` | `Set<Permission>` | join table `roles_permissions` | `@ManyToMany` | Permissions assigned to this role |

**Relationships**:
- `Role N — M Permission` (join table `roles_permissions`)
- `Role N — M Staff` (join table `staffs_roles`)

**Predefined roles** (seeded by `ApplicationInitConfig` on first startup):

| Role Name | Constant | Description |
|-----------|---------|-------------|
| `ADMIN` | `PredefinedRole.ADMIN_ROLE` | Super-admin; full access |
| `STAFF` | `PredefinedRole.STAFF_ROLE` | Default cinema staff |
| `MANAGER` | `PredefinedRole.MANAGER_ROLE` | Cinema branch manager |
| `CUSTOMER` | `PredefinedRole.CUSTOMER_ROLE` | Embedded in token only — NOT stored in DB for customer accounts |

---

### Entity: `Permission`

> Class: `com.theatermgnt.theatermgnt.authorization.entity.Permission`
> Table: `permissions`
> **No `BaseEntity`** — minimal entity; PK is the permission name string

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `name` | `String` | `name` | PK | Permission identifier e.g. `INVOICE_READ`, `INVOICE_UPDATE` |
| `description` | `String` | `description` | nullable | Human-readable description |

**Relationships**:
- `Permission N — M Role` (join table `roles_permissions`)

---

### Entity: `OtpToken`

> Class: `com.theatermgnt.theatermgnt.authentication.entity.OtpToken`
> Table: `otp_tokens`
> **No soft-delete** — hard-deleted on use or when replaced

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` (UUID) | `id` | PK, `@GeneratedValue(UUID)` | |
| `code` | `String` | `code` | NOT NULL | 6-digit numeric OTP code (100000–999999) |
| `expiryTime` | `Instant` | `expiry_time` | NOT NULL | `now() + otp.valid-duration minutes` |
| `account` | `Account` | `account_id` | FK → `accounts.id`, NOT NULL | `@OneToOne @JoinColumn` — one OTP per account at a time |

**Relationships**: `OtpToken 1 — 1 Account`

> **One-per-account constraint**: Before saving a new OTP, `forgotPassword()` calls `otpTokenRepository.findByAccount()` and deletes any existing OTP (with flush) before inserting the new one. No DB UNIQUE constraint on `account_id` in entity — enforced at service layer.

---

### Entity: `InvalidatedToken`

> Class: `com.theatermgnt.theatermgnt.authentication.entity.InvalidatedToken`
> Table: `invalidated_tokens`
> **No soft-delete**, **No `BaseEntity`** — minimal entity

| Field | Java Type | Column | Constraints | Description |
|-------|-----------|--------|-------------|-------------|
| `id` | `String` | `id` | PK | JWT `jti` claim value (UUID) — NOT generated, set explicitly |
| `expiryTime` | `Date` | `expiry_time` | nullable | Token's original `exp` claim — used for cleanup |

**Purpose**: When a user logs out, the token's `jti` is saved here. `CustomJwtDecoder` calls `invalidatedTokenRepository.existsById(jti)` on every authenticated request to reject logged-out tokens even before expiry.

> **Cleanup**: `TokenCleanupService` (scheduled, not shown in main path) should periodically delete entries where `expiryTime < now()`. Without cleanup, this table grows indefinitely.

---

## 3. Database Schema

```sql
-- ==============================
-- MySQL DDL for Identity Service
-- Database: identitydb
-- ==============================

CREATE TABLE accounts (
    id          VARCHAR(36)  NOT NULL,
    email       VARCHAR(255) NULL,
    username    VARCHAR(255) NULL,
    password    VARCHAR(255) NULL,
    account_type ENUM('INTERNAL', 'CUSTOMER') NULL,
    is_active   TINYINT(1)   NULL,
    created_at  DATETIME(6)  NULL,
    updated_at  DATETIME(6)  NULL,
    deleted     TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE INDEX uk_accounts_email (email),
    UNIQUE INDEX uk_accounts_username (username),
    INDEX idx_accounts_account_type (account_type)
);

CREATE TABLE customers (
    id            VARCHAR(36)  NOT NULL,
    account_id    VARCHAR(36)  NULL,
    first_name    VARCHAR(50)  NULL,
    last_name     VARCHAR(50)  NULL,
    address       VARCHAR(200) NULL,
    avatar_url    VARCHAR(500) NULL,
    phone_number  VARCHAR(20)  NULL,
    loyalty_points INT         NOT NULL DEFAULT 0,
    gender        ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    dob           DATE         NULL,
    created_at    DATETIME(6)  NULL,
    updated_at    DATETIME(6)  NULL,
    deleted       TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE INDEX uk_customers_account_id (account_id),
    CONSTRAINT fk_customers_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE staffs (
    id           VARCHAR(36)  NOT NULL,
    account_id   VARCHAR(36)  NULL,
    cinema_id    VARCHAR(36)  NULL,
    first_name   VARCHAR(50)  NULL,
    last_name    VARCHAR(50)  NULL,
    phone_number VARCHAR(20)  NULL,
    job_title    VARCHAR(100) NULL,
    address      VARCHAR(200) NULL,
    avatar_url   VARCHAR(500) NULL,
    dob          DATE         NULL,
    gender       ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    created_at   DATETIME(6)  NULL,
    updated_at   DATETIME(6)  NULL,
    deleted      TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE INDEX uk_staffs_account_id (account_id),
    INDEX idx_staffs_cinema_id (cinema_id),
    CONSTRAINT fk_staffs_account FOREIGN KEY (account_id) REFERENCES accounts(id)
    -- No FK on cinema_id: cross-domain reference to Catalog Service
);

CREATE TABLE roles (
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(500) NULL,
    PRIMARY KEY (name)
);

CREATE TABLE permissions (
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(500) NULL,
    PRIMARY KEY (name)
);

-- @ManyToMany join: Role <-> Permission
CREATE TABLE roles_permissions (
    roles_name       VARCHAR(255) NOT NULL,
    permissions_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (roles_name, permissions_name),
    CONSTRAINT fk_rp_role FOREIGN KEY (roles_name) REFERENCES roles(name),
    CONSTRAINT fk_rp_permission FOREIGN KEY (permissions_name) REFERENCES permissions(name)
);

-- @ManyToMany join: Staff <-> Role
CREATE TABLE staffs_roles (
    staffs_id  VARCHAR(36)  NOT NULL,
    roles_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (staffs_id, roles_name),
    CONSTRAINT fk_sr_staff FOREIGN KEY (staffs_id) REFERENCES staffs(id),
    CONSTRAINT fk_sr_role FOREIGN KEY (roles_name) REFERENCES roles(name)
);

CREATE TABLE otp_tokens (
    id          VARCHAR(36)  NOT NULL,
    code        VARCHAR(6)   NOT NULL,
    expiry_time DATETIME(6)  NOT NULL,
    account_id  VARCHAR(36)  NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_otp_account_id (account_id),
    CONSTRAINT fk_otp_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE invalidated_tokens (
    id          VARCHAR(255) NOT NULL,   -- JWT jti claim (UUID string)
    expiry_time DATETIME(6)  NULL,
    PRIMARY KEY (id),
    INDEX idx_it_expiry_time (expiry_time)  -- for cleanup queries
);
```

---

## 4. API Specification

All endpoints return `ApiResponse<T>` with `code: 1000` on success.
Base path in monolith: `/api/theater-mgnt`. In microservice: `http://identity-service:8081`.

---

### `POST /auth/admin/login`

- **Description**: Authenticate a staff or admin account using username/email + password; returns JWT.
- **Auth**: Public
- **Request Body**:
```json
{
  "loginIdentifier": "admin",
  "password": "admin123"
}
```
- **Response 200**:
```json
{
  "code": 1000,
  "result": {
    "token": "eyJhbGci...",
    "authenticated": true
  }
}
```
- **Error Responses**:

| Code | Error | When |
|------|-------|------|
| `1004` | `USER_NOT_EXISTED` | No account found for `loginIdentifier` |
| `1006` | `UNAUTHENTICATED` | Password does not match |
| `1025` | `WRONG_ACCOUNT_TYPE` | Account exists but `accountType == CUSTOMER` |

- **Business Rules**: BR-ID-001, BR-ID-002, BR-ID-006

---

### `POST /auth/customer/login`

- **Description**: Authenticate a customer account using username/email + password; returns JWT.
- **Auth**: Public
- **Request Body**: Same shape as `/auth/admin/login`
- **Response 200**: Same shape — `{ token, authenticated: true }`
- **Error Responses**:

| Code | Error | When |
|------|-------|------|
| `1004` | `USER_NOT_EXISTED` | No account found |
| `1006` | `UNAUTHENTICATED` | Password does not match |
| `1025` | `WRONG_ACCOUNT_TYPE` | Account exists but `accountType == INTERNAL` |

- **Business Rules**: BR-ID-001, BR-ID-002, BR-ID-006

---

### `POST /auth/introspect`

- **Description**: Validate a JWT token; returns whether the token is currently valid (not expired, not invalidated, signature OK).
- **Auth**: Public
- **Request Body**:
```json
{ "token": "eyJhbGci..." }
```
- **Response 200**:
```json
{
  "code": 1000,
  "result": { "valid": true }
}
```
> `valid: false` is returned (not an error code) when the token is expired, revoked, or has an invalid signature.

- **Business Rules**: BR-ID-007

---

### `POST /auth/logout`

- **Description**: Invalidate the provided JWT by recording its `jti` in `invalidated_tokens`.
- **Auth**: Public (token not required to be currently valid — already-expired tokens are silently ignored)
- **Request Body**:
```json
{ "token": "eyJhbGci..." }
```
- **Response 200**:
```json
{ "code": 1000 }
```
> If the token is already expired, the method catches the `AppException` and returns success silently (no error).

- **Business Rules**: BR-ID-008

---

### `POST /auth/refresh`

- **Description**: Exchange a current (or just-expired) JWT for a new one with a fresh expiry. The old token is invalidated.
- **Auth**: Public
- **Request Body**:
```json
{ "token": "eyJhbGci..." }
```
- **Response 200**: Same as login — `{ token, authenticated: true }`
- **Error Responses**:

| Code | Error | When |
|------|-------|------|
| `1006` | `UNAUTHENTICATED` | Token signature invalid or outside refreshable window |
| `1004` | `USER_NOT_EXISTED` | Account from `sub` claim not found |

- **Business Rules**: BR-ID-009

> ⚠️ **Known bug**: `refreshToken()` calls `accountRepository.findByUsername(sub)` where `sub` is the account UUID, not the username. This will fail for all accounts. **Must fix in microservice**: use `accountRepository.findById(sub)`.

---

### `POST /auth/forgot-password`

- **Description**: Generate and email a 6-digit OTP for password reset.
- **Auth**: Public
- **Request Body**:
```json
{ "loginIdentifier": "username or email" }
```
- **Response 200** (always — even if account not found):
```json
{
  "code": 1000,
  "message": "If the account exists, a password reset code has been sent"
}
```
> Deliberately returns success even for unknown identifiers to prevent user enumeration.

- **Business Rules**: BR-ID-010, BR-ID-011

---

### `POST /auth/reset-password`

- **Description**: Verify OTP and set a new password.
- **Auth**: Public
- **Request Body**:
```json
{
  "loginIdentifier": "username or email",
  "otpCode": "123456",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```
- **Response 200**:
```json
{
  "code": 1000,
  "message": "Password has been reset successfully"
}
```
- **Error Responses**:

| Code | Error | When |
|------|-------|------|
| `1004` | `USER_NOT_EXISTED` | Account not found |
| `1006` | `UNAUTHENTICATED` | No OTP record found for this account |
| `1018` | `OTP_EXPIRED` | OTP exists but `expiryTime < now()` |
| `1019` | `INVALID_OTP` | OTP code does not match |

- **Business Rules**: BR-ID-011, BR-ID-012

---

### `POST /auth/outbound/authenticate?code={googleAuthCode}`

- **Description**: Google OAuth2 login — exchange Google auth code for a system JWT. Creates account + customer profile if first login.
- **Auth**: Public
- **Request Param**: `code` (query param) — the authorization code from Google's OAuth redirect
- **Response 200**: Same as login — `{ token, authenticated: true }`
- **Business Rules**: BR-ID-013

---

### `POST /auth/accounts/create-password`

- **Description**: Set a password for an OAuth-only account that has no password yet.
- **Auth**: Authenticated (any valid JWT)
- **Request Body**:
```json
{
  "password": "newpass123",
  "confirmPassword": "newpass123"
}
```
- **Response 200**:
```json
{
  "code": 1000,
  "message": "Password has been created, you could use it to login!"
}
```
- **Error Responses**:

| Code | Error | When |
|------|-------|------|
| `1023` | `PASSWORDS_DO_NOT_MATCH` | `password != confirmPassword` |
| `1021` | `PASSWORD_EXISTED` | Account already has a non-empty password |

- **Business Rules**: BR-ID-014

---

### `POST /register`

- **Description**: Customer self-registration (public). Creates Account + Customer profile atomically.
- **Auth**: Public
- **Request Body**:
```json
{
  "username": "johndoe",
  "password": "pass1234",
  "email": "john@example.com",
  "phoneNumber": "0901234567",
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "gender": "MALE",
  "dob": "1990-01-15"
}
```
- **Validation**:

| Field | Rule | Error Code |
|-------|------|-----------|
| `username` | min 3 chars | `INVALID_USERNAME` |
| `password` | min 8 chars | `INVALID_PASSWORD` |
| `email` | `@NotBlank` + valid email format | `EMAIL_REQUIRED` / `INVALID_EMAIL` |
| `phoneNumber` | matches `^0[0-9]{9}$` | `INVALID_PHONE_NUMBER_FORMAT` |
| `firstName` | `@NotBlank`, max 50 | `FIRST_NAME_REQUIRED` / `FIRST_NAME_TOO_LONG` |
| `lastName` | `@NotBlank`, max 50 | `LAST_NAME_REQUIRED` / `LAST_NAME_TOO_LONG` |
| `address` | max 200 | `ADDRESS_TOO_LONG` |
| `gender` | `@NotNull` | `GENDER_REQUIRED` |
| `dob` | `@NotNull`, must be ≥ 6 years old | `DOB_REQUIRED` / `INVALID_DOB` |

- **Response 200**: `ApiResponse<CustomerResponse>`
```json
{
  "code": 1000,
  "result": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "loyaltyPoints": 0,
    "...": "..."
  }
}
```
- **Error Responses**:

| Code | Error | When |
|------|-------|------|
| `1003` | `USER_EXISTED` | Username already taken |
| `1017` | `EMAIL_EXISTED` | Email already taken |

- **Business Rules**: BR-ID-003, BR-ID-004, BR-ID-005

---

### `POST /staffs`

- **Description**: Admin creates a staff account. Sends welcome email with generated credentials.
- **Auth**: **ADMIN only** (`@PreAuthorize("hasRole('ADMIN')")`)
- **Request Body** (extends `BaseAccountCreationRequest`):
```json
{
  "username": "staff01",
  "password": "pass1234",
  "email": "staff@cinema.com",
  "phoneNumber": "0901234567",
  "firstName": "Nguyen",
  "lastName": "Van A",
  "address": "...",
  "gender": "MALE",
  "dob": "1995-05-20",
  "jobTitle": "Cashier",
  "cinemaId": "cinema-uuid",
  "roles": ["STAFF"]
}
```
> `roles` is optional — defaults to `["STAFF"]` if not provided. Role names must exist in the `roles` table.

- **Response 200**: `ApiResponse<StaffResponse>`
- **Error Responses**: Same as `/register` (duplicate username/email)
- **Business Rules**: BR-ID-003, BR-ID-004, BR-ID-015, BR-ID-016

---

### `GET /staffs`

- **Description**: List all active staff accounts.
- **Auth**: Authenticated (any valid JWT)
- **Response 200**: `ApiResponse<List<StaffResponse>>`

---

### `GET /staffs/{staffId}`

- **Description**: Get a staff profile by ID.
- **Auth**: Authenticated
- **Response 200**: `ApiResponse<StaffResponse>`

---

### `GET /staffs/myInfo`

- **Description**: Get the current authenticated staff's own profile (resolved from JWT `sub`).
- **Auth**: Authenticated (INTERNAL accounts only in practice)
- **Response 200**: `ApiResponse<StaffResponse>`

---

### `GET /staffs/search`

- **Description**: Search staff by criteria (cinema, role, name, etc.).
- **Auth**: Authenticated
- **Query Params**: Fields from `SearchStaffRequest` (cinemaId, role, name)
- **Response 200**: `ApiResponse<List<StaffResponse>>`

---

### `GET /staffs/available-managers`

- **Description**: Get staff members with MANAGER role who are not yet assigned to any cinema.
- **Auth**: Authenticated
- **Response 200**: `ApiResponse<List<StaffResponse>>`

---

### `GET /staffs/cinema/{cinemaId}/staff-role`

- **Description**: Get all staff members at a specific cinema with the STAFF role.
- **Auth**: Authenticated
- **Response 200**: `ApiResponse<List<StaffResponse>>`

---

### `PUT /staffs/{staffId}`

- **Description**: Update a staff profile (including roles and cinema assignment).
- **Auth**: Authenticated (ADMIN in practice — [NOT IN MONO: no `@PreAuthorize` on this method])
- **Request Body**: `StaffProfileUpdateRequest` — all fields optional

```json
{
  "firstName": "Nguyen",
  "lastName": "Van B",
  "phoneNumber": "0912345678",
  "jobTitle": "Manager",
  "cinemaId": "cinema-uuid",
  "address": "456 Elm St",
  "avatarUrl": "https://...",
  "gender": "MALE",
  "dob": "1995-05-20",
  "roles": ["MANAGER"]
}
```
- **Response 200**: `ApiResponse<StaffResponse>`

---

### `DELETE /staffs/{staffId}`

- **Description**: Soft-delete a staff profile and its associated account.
- **Auth**: Authenticated (ADMIN in practice — [NOT IN MONO: no `@PreAuthorize`])
- **Response 200**: `ApiResponse<Void>`

---

### `POST /customers`

- **Description**: Staff creates a customer account on behalf of the customer. Generates a random 8-character password and sends welcome email.
- **Auth**: Authenticated (no explicit role guard — [NOT IN MONO: missing `@PreAuthorize`])
- **Request Body** (`StaffCreateCustomerAccountRequest`):
```json
{
  "firstName": "Tran",
  "lastName": "Thi B",
  "email": "customer@example.com",
  "address": "789 Oak Ave",
  "phoneNumber": "0934567890",
  "gender": "FEMALE",
  "dob": "2000-03-10"
}
```
> Username is automatically set to `email`. Password is `UUID.randomUUID().toString().substring(0, 8)`.

- **Response 200**: `ApiResponse<CustomerResponse>`
- **Business Rules**: BR-ID-003, BR-ID-004, BR-ID-017

---

### `GET /customers`

- **Description**: List all active customers.
- **Auth**: Authenticated
- **Response 200**: `ApiResponse<List<CustomerResponse>>`

---

### `GET /customers/{customerId}`

- **Description**: Get customer profile by ID.
- **Auth**: Authenticated
- **Response 200**: `ApiResponse<CustomerResponse>`

---

### `GET /customers/myInfo`

- **Description**: Get the current authenticated customer's own profile. Also sets `noPassword: true` if the account has no password (OAuth-only).
- **Auth**: Authenticated
- **Response 200**: `ApiResponse<CustomerResponse>` (includes `noPassword: boolean`)

---

### `GET /customers/{customerId}/loyalty-points`

- **Description**: Get a customer's current loyalty points balance.
- **Auth**: Authenticated
- **Response 200**:
```json
{
  "code": 1000,
  "result": { "loyaltyPoints": 150 }
}
```

---

### `PUT /customers/{customerId}`

- **Description**: Update a customer profile.
- **Auth**: Authenticated
- **Request Body**: `CustomerProfileUpdateRequest` — all fields optional
- **Response 200**: `ApiResponse<CustomerResponse>`

---

### `DELETE /customers/{customerId}`

- **Description**: Soft-delete customer profile and its associated account.
- **Auth**: Authenticated
- **Response 200**: `ApiResponse<Void>`

---

### `POST /roles`

- **Description**: Create a new role with optional permission assignments.
- **Auth**: **ADMIN only** (`@PreAuthorize("hasRole('ADMIN')")` on `RoleService`)
- **Request Body** (`RoleRequest`):
```json
{
  "name": "CASHIER",
  "description": "Can handle cash payments",
  "permissions": ["INVOICE_READ", "INVOICE_UPDATE"]
}
```
- **Response 200**: `ApiResponse<RoleResponse>`
- **Business Rules**: BR-ID-018

---

### `GET /roles`

- **Description**: List all roles.
- **Auth**: **ADMIN only**
- **Response 200**: `ApiResponse<List<RoleResponse>>`

---

### `PUT /roles/{roleId}`

- **Description**: Update role name, description, or permissions.
- **Auth**: **ADMIN only**
- **Response 200**: `ApiResponse<RoleResponse>`

---

### `DELETE /roles/{roleId}`

- **Description**: Delete a role by name.
- **Auth**: **ADMIN only**
- **Error Responses**:

| Code | Error | When |
|------|-------|------|
| `1026` | `ROLE_IN_USE` | Role is assigned to one or more staff members |

---

### `POST /permissions`

- **Description**: Create a new permission.
- **Auth**: **ADMIN only** (`@PreAuthorize("hasRole('ADMIN')")` on `PermissionService`)
- **Request Body** (`PermissionRequest`):
```json
{
  "name": "INVOICE_READ",
  "description": "Can read invoices"
}
```
- **Response 200**: `ApiResponse<PermissionResponse>`

---

### `GET /permissions`

- **Description**: List all permissions.
- **Auth**: **ADMIN only**
- **Response 200**: `ApiResponse<List<PermissionResponse>>`

---

### `DELETE /permissions/{permissionId}`

- **Description**: Delete a permission by name.
- **Auth**: **ADMIN only**
- **Response 200**: `ApiResponse<Void>`

---

## 5. Business Rules

- **BR-ID-001**: An account with `isActive = false` [NOT IN MONO: not explicitly checked during login — `isActive` field exists but `authenticate()` does not read it. **Must add check in microservice**: throw `UNAUTHENTICATED` if `account.isActive == false`.]

- **BR-ID-002**: Login dispatches to one of two separate endpoints based on `accountType`. A CUSTOMER account cannot use `/auth/admin/login` (throws `WRONG_ACCOUNT_TYPE`, code `1025`, HTTP 401). An INTERNAL account cannot use `/auth/customer/login`.

- **BR-ID-003**: Username must be unique across all non-deleted accounts. Checked via `accountRepository.existsByUsernameAndDeletedFalse()`. Throws `USER_EXISTED` (code `1003`, HTTP 400).

- **BR-ID-004**: Email must be unique across all non-deleted accounts. Checked via `accountRepository.existsByEmailAndDeletedFalse()`. Throws `EMAIL_EXISTED` (code `1017`, HTTP 400).

- **BR-ID-005**: Self-registering customer accounts require: `username` (min 3 chars), `password` (min 8 chars), `email` (valid format, `@NotBlank`), `firstName` + `lastName` (`@NotBlank`, max 50), `gender` (`@NotNull`), `dob` (`@NotNull`, min age 6 years).

- **BR-ID-006**: Password is BCrypt-encoded at strength 10. Plain-text passwords are never stored.

- **BR-ID-007**: Token validation (introspect) checks three conditions in order: (1) HS512 signature valid against `JWT_SECRET`, (2) token not expired (`exp > now`), (3) `jti` not present in `invalidated_tokens`. All three must pass for `valid: true`.

- **BR-ID-008**: On logout, the token's `jti` is persisted to `invalidated_tokens` with its original `expiryTime`. If the token is already expired, the exception is caught silently and the endpoint returns success.

- **BR-ID-009**: Token refresh uses the `iat + refreshable-duration` window (not `exp`). The current value is 36000 seconds (10 hours) from `iat`. The old token is invalidated before issuing the new one.

- **BR-ID-010**: `forgotPassword()` silently returns if no account matches `loginIdentifier` — no error is thrown to prevent user enumeration attacks.

- **BR-ID-011**: OTP is a 6-digit code generated via `SecureRandom` in range `[100000, 999999]`. It expires after `otp.valid-duration` minutes (default: 10). Only one OTP per account exists at a time — the old one is deleted before the new one is saved.

- **BR-ID-012**: `resetPassword()` checks OTP expiry first (deletes the OTP and throws `OTP_EXPIRED` if expired). Then checks code match (throws `INVALID_OTP` if mismatch). On success, BCrypt-encodes the new password and hard-deletes the OTP record.

- **BR-ID-013**: Google OAuth `registerOAuthCustomer()` is idempotent — safe to call on every login. If account + customer for the given email already exists, no new records are created. No welcome email is sent for OAuth registrations.

- **BR-ID-014**: `createPassword()` throws `PASSWORD_EXISTED` (code `1021`) if `account.password` already has a non-empty value. Intended only for OAuth-only accounts that wish to add password login.

- **BR-ID-015**: `registerStaffAccount()` requires `@PreAuthorize("hasRole('ADMIN')")`. If `roles` list is provided in the request, only roles that exist in the DB are assigned (silently ignores missing role names). If `roles` is empty or null, defaults to `STAFF` role.

- **BR-ID-016**: After staff account creation, a `StaffCreatedEvent` is published, which triggers a welcome email containing the plain-text initial password. The plain-text password is ONLY used here — never stored.

- **BR-ID-017**: `StaffCreateCustomerAccount()` generates an 8-character random password (`UUID.randomUUID().toString().substring(0, 8)`). A `CustomerCreatedEvent` is published with the plain-text password for the welcome email. The account username is set to the customer's email.

- **BR-ID-018**: Role names and permission names are the primary key — they must be globally unique strings (e.g., `ADMIN`, `INVOICE_READ`). Convention: UPPERCASE_SNAKE_CASE.

- **BR-ID-019**: Account soft-delete (`deleteAccount()`) appends `_deleted_{currentTimeMillis}` to both `username` and `email` before marking `deleted = true`. This allows the same email/username to be re-registered in the future without UNIQUE constraint violations.

- **BR-ID-020**: JWT `scope` claim for INTERNAL accounts is: `ROLE_{ROLE_NAME} {PERMISSION_1} {PERMISSION_2}`. Multiple roles are space-separated. All permissions from all roles are flattened into one space-separated string. Example: `"ROLE_ADMIN INVOICE_READ INVOICE_UPDATE"`.

- **BR-ID-021**: JWT `cinemaId` custom claim is only included for INTERNAL accounts. It is taken from `staff.cinemaId`. If `cinemaId` is null (admin without cinema assignment), the claim is omitted from the token.

---

## 6. Inter-Service Communication

### Consumed by other services

| Other Service | How | Purpose |
|---------------|-----|---------|
| All services | API Gateway filter → `POST /auth/introspect` | Validate JWT on every authenticated request |
| All services | (future) JWT local decode at Gateway | Extract `sub` (account ID), `scope` (roles/permissions), `cinemaId` |

### Events Consumed (Kafka — Microservice Target)

| Event | Topic | From | Action |
|-------|-------|------|--------|
| `LoyaltyPointsEarned` | `cinema.booking.loyalty-points-earned` | Booking Service | Call `customerService.addLoyaltyPoints(customerId, netPointChange)` to update `customer.loyaltyPoints` |

### Events Published (Kafka — Microservice Target)

> In the **monolith**, identity events are Spring Application Events handled by `NotificationEventListener`. In the microservice, these must become Kafka events published to an `identity.*` topic.

| Event | Topic | Trigger | Consumers |
|-------|-------|---------|-----------|
| `CustomerCreated` | `cinema.identity.customer-created` (to be defined) | `StaffCreateCustomerAccount()` | Notification Service (send welcome email with credentials) |
| `StaffCreated` | `cinema.identity.staff-created` (to be defined) | `registerStaffAccount()` | Notification Service (send welcome email with initial password) |
| `PasswordResetRequested` | `cinema.identity.password-reset-requested` (to be defined) | `forgotPassword()` | Notification Service (send OTP email) |

> OAuth-registered accounts (`registerOAuthCustomer()`) do **NOT** publish a `CustomerCreated` event — this is by design (no welcome email for OAuth logins).

---

## 7. Non-Functional Requirements

Extracted from `application.yml` and `@Value` annotations:

| Property | Config Key | Current Value | Notes |
|----------|-----------|---------------|-------|
| **JWT access token TTL** | `jwt.valid-duration` | `36000` seconds (10 hours) | `TokenService.VALID_DURATION` |
| **JWT refresh window** | `jwt.refreshable-duration` | `36000` seconds (10 hours) | `AuthenticationService.REFRESHABLE_DURATION`; computed from `iat`, not `exp` |
| **OTP TTL** | `otp.valid-duration` | `10` minutes | `AuthenticationService.OTP_VALID_DURATION` |
| **OTP code range** | — | 100000–999999 (6 digits) | `SecureRandom`, hardcoded range in `generateOtpCode()` |
| **OTP max attempts** | — | [NOT IN MONO — TO DESIGN] | No attempt counter; only expiry is enforced |
| **Password BCrypt strength** | — | `10` (hardcoded) | `BCryptPasswordEncoder(10)` in `AuthenticationService` and `AccountService` |
| **Password minimum length** | — | 8 characters | `@Size(min = 8)` on `BaseAccountCreationRequest.password` |
| **Username minimum length** | — | 3 characters | `@Size(min = 3)` on `BaseAccountCreationRequest.username` |
| **JWT algorithm** | — | HS512 (HMAC-SHA512) | Nimbus JOSE, symmetric key from `jwt.signerKey` |
| **JWT issuer** | — | `"theater-mgnt.com"` | Hardcoded in `TokenService.generateToken()` |
| **Rate limiting** | — | [NOT IN MONO — TO DESIGN] | No rate limiting on login or OTP endpoints |
| **Account lockout policy** | — | [NOT IN MONO — TO DESIGN] | No failed-attempt counter or lockout logic |
| **Token cleanup** | `TokenCleanupService` | Scheduled (details [NOT IN MONO — frequency unclear]) | Removes expired `InvalidatedToken` records |

---

## Appendix: Class Reference

| Class | Package | Role |
|-------|---------|------|
| `Account` | `account.entity` | Core identity entity; soft-delete |
| `Customer` | `customer.entity` | Customer profile; linked to Account |
| `Staff` | `staff.entity` | Staff/admin profile; linked to Account; holds cinemaId + roles |
| `Role` | `authorization.entity` | String-keyed role; `@ManyToMany` permissions |
| `Permission` | `authorization.entity` | String-keyed atomic permission |
| `OtpToken` | `authentication.entity` | 6-digit OTP; 1-per-account; hard-deleted on use |
| `InvalidatedToken` | `authentication.entity` | JWT `jti` blacklist for logout |
| `AccountService` | `account.service` | `createAccount()`, `updateAccount()`, `deleteAccount()`, `createPassword()` |
| `RegistrationService` | `account.service` | Orchestrates account + profile creation for customer/staff/OAuth |
| `AuthenticationService` | `authentication.service` | Login, introspect, logout, refresh, OTP flow |
| `TokenService` | `authentication.service` | JWT generation with HS512 and scope/cinemaId claims |
| `OAuthLoginService` | `authentication.service` | Google OAuth2 code-exchange + find-or-create account |
| `CustomerService` | `customer.service` | Profile CRUD + `addLoyaltyPoints()` |
| `StaffService` | `staff.service` | Staff profile CRUD |
| `AuthenticationController` | `authentication.controller` | `/auth/admin/login`, `/auth/customer/login`, `/auth/introspect`, `/auth/logout`, `/auth/refresh` |
| `PasswordResetController` | `authentication.controller` | `/auth/forgot-password`, `/auth/reset-password` |
| `OAuthController` | `authentication.controller` | `/auth/outbound/authenticate` |
| `AccountController` | `account.controller` | `/auth/accounts/create-password` |
| `RegistrationController` | `account.controller` | `POST /register` |
| `CustomerController` | `customer.controller` | `/customers/**` |
| `StaffController` | `staff.controller` | `/staffs/**` |
| `RoleController` | `authorization.controller` | `/roles/**` |
| `PermissionController` | `authorization.controller` | `/permissions/**` |

---

*Updated: 2026-06-21 | Source: direct code read of all account, authentication, authorization, customer, and staff packages.*
