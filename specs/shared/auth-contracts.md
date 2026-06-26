# Auth Contracts

> **Source**: Extracted from direct code read on 2026-06-20.
> Classes read: `SecurityConfig`, `TokenService`, `AuthenticationService`, `CustomJwtDecoder`, `JwtAuthenticationEntryPoint`, `OAuthLoginService`, all authentication controllers, `Role`, `Permission`, `ApplicationInitConfig`, all `@PreAuthorize` annotations across the codebase.

---

## 1. JWT Token Structure

### Algorithm & Signing

| Property | Value |
|----------|-------|
| Algorithm | **HS512** (HMAC-SHA512) |
| Library | `com.nimbusds.jose` (Nimbus JOSE+JWT) |
| Signer key | Symmetric — shared secret from `jwt.signerKey` in `application.yml` |
| Verification | `CustomJwtDecoder` calls `authenticationService.introspect()` on **every request** before decoding |

---

### Access Token Claims

| Claim Key | JWT Standard Name | Type | Example | Description |
|-----------|-------------------|------|---------|-------------|
| `iss` | Issuer | `String` | `"theater-mgnt.com"` | Fixed issuer identifier |
| `sub` | Subject | `String` (UUID) | `"3fa85f64-5717-4562-b3fc-2c963f66afa6"` | `account.id` — the primary identity |
| `iat` | Issued At | `Date` | `1750000000` | Token generation timestamp (Unix epoch ms) |
| `exp` | Expiration | `Date` | `1750036000` | `iat + valid-duration` seconds |
| `jti` | JWT ID | `String` (UUID) | `"uuid-..."` | Unique token ID — stored in `invalidated_tokens` on logout |
| `scope` | *(custom)* | `String` | `"ROLE_ADMIN INVOICE_READ INVOICE_UPDATE"` | Space-separated roles + permissions (see format below) |
| `cinemaId` | *(custom)* | `String` (UUID) \| absent | `"cinema-uuid-..."` | Present **only for `INTERNAL` accounts**; the cinema branch the staff belongs to; omitted for customers and for admin accounts without a cinema assignment |

#### `scope` Claim Format

The `scope` claim is built differently based on `accountType`:

**For `INTERNAL` accounts (staff/admin):**
```
ROLE_{ROLE_NAME} {permission1} {permission2} ...
```
Example: `"ROLE_ADMIN INVOICE_READ INVOICE_UPDATE"`
Example: `"ROLE_MANAGER"` (no permissions assigned yet)

**For `CUSTOMER` accounts:**
```
ROLE_CUSTOMER
```
Always exactly `"ROLE_CUSTOMER"` — no permissions embedded.

> **Important**: `JwtGrantedAuthoritiesConverter` is configured with `authorityPrefix("")` (empty prefix). This means both `ROLE_ADMIN` and `INVOICE_READ` are extracted verbatim as granted authorities. Spring Security's `hasRole('ADMIN')` internally prepends `ROLE_`, so `hasRole('ADMIN')` matches `ROLE_ADMIN` in the token.

---

### Refresh Token

> **There is no separate refresh token in this system.**

The same JWT access token is reused for refresh. `POST /auth/refresh` accepts the current (potentially just-expired) token and verifies it against an **extended window**:

```
refreshable-duration = 36000 seconds (10 hours)
```

The `verifyToken(token, isRefreshToken=true)` method computes:
```
expiryTime = iat + refreshable-duration  (not exp)
```
This effectively gives a separate "refreshable until" deadline computed from `iat`. Since both `valid-duration` and `refreshable-duration` are both `36000` seconds in `application.yml`, the access and refresh windows are currently identical.

---

### Token Expiry Summary

| Token Type | TTL | Config Key | Storage Requirement |
|------------|-----|------------|---------------------|
| Access Token | 10 hours (36000 sec) | `jwt.valid-duration` | Client-side only — no server-side session |
| "Refresh Window" | 10 hours (36000 sec from `iat`) | `jwt.refreshable-duration` | Client sends the same JWT to `POST /auth/refresh` |
| OTP Code | 10 minutes | `otp.valid-duration` | `otp_tokens` DB table |
| Invalidated Token (logout) | Until original `exp` | — | `invalidated_tokens` DB table (auto-expired by `exp`) |

---

### Login Response Shape

Both `POST /auth/admin/login` and `POST /auth/customer/login` return:

```json
{
  "code": 1000,
  "result": {
    "token": "eyJ...",
    "authenticated": true
  }
}
```

### Introspect Response Shape

`POST /auth/introspect` returns:

```json
{
  "code": 1000,
  "result": {
    "valid": true
  }
}
```

---

## 2. Authentication Flows

### Flow A — Standard Login (Username/Password)

**Two separate endpoints enforce account type separation:**

#### Admin/Staff Login
```
POST /api/theater-mgnt/auth/admin/login
Content-Type: application/json

{
  "loginIdentifier": "admin",   // username OR email
  "password": "admin"
}
```

Step-by-step:
1. `AuthenticationController.adminLogin()` calls `authenticationService.authenticate(request, AccountType.INTERNAL)`
2. `accountRepository.findByUsernameOrEmail(loginIdentifier, loginIdentifier)` — searches both `username` and `email` columns
3. `BCryptPasswordEncoder(10).matches(password, account.password)` — password check
4. Validates `account.accountType == INTERNAL` — throws `WRONG_ACCOUNT_TYPE (1025, 401)` if customer tries to use this endpoint
5. `tokenService.generateToken(account)` — queries `staffRepository.findByAccountId()` to load roles + permissions + `cinemaId`
6. Returns `{ token, authenticated: true }`

#### Customer Login
```
POST /api/theater-mgnt/auth/customer/login
Content-Type: application/json

{
  "loginIdentifier": "user@email.com",
  "password": "password123"
}
```
Same flow but validates `account.accountType == CUSTOMER`. Token contains only `ROLE_CUSTOMER`.

---

### Flow B — Google OAuth (Customers only)

```
POST /api/theater-mgnt/auth/outbound/authenticate?code={google_auth_code}
```

Step-by-step:
1. Frontend redirects user to Google OAuth consent page (client handles this)
2. Google redirects back with `?code=...`
3. Frontend calls `POST /auth/outbound/authenticate?code={code}`
4. `OAuthLoginService.loginWithGoogleCode(code)`:
   - Calls `OutboundIdentityClient.exchangeToken()` → POSTs to Google token endpoint with `client_id`, `client_secret`, `redirect_uri`, `grant_type=authorization_code`
   - Calls `OutboundUserClient.getUserInfo()` → GETs Google user profile using the Google access token
   - Calls `registrationService.registerOAuthCustomer()` → finds or creates `Account` + `Customer` by email (idempotent — safe to call multiple times)
5. Issues system JWT via `tokenService.generateToken(account)` containing `ROLE_CUSTOMER`
6. Returns same `{ token, authenticated }` shape as standard login

> **Note**: No `StaffCreatedEvent` or `CustomerCreatedEvent` is fired for OAuth logins. Welcome email is **not sent** for OAuth-registered accounts.

---

### Flow C — OTP Password Reset

```
Step 1: POST /api/theater-mgnt/auth/forgot-password
{
  "loginIdentifier": "username or email"
}

Step 2: User receives 6-digit OTP by email (valid 10 min)

Step 3: POST /api/theater-mgnt/auth/reset-password
{
  "loginIdentifier": "username or email",
  "otpCode": "123456",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```

Step-by-step:
1. `forgotPassword()`: Finds account by username/email; **silently returns** if not found (prevents enumeration); generates 6-digit OTP via `SecureRandom` (range 100000–999999); saves to `otp_tokens` table; fires `PasswordResetEvent` → `NotificationEventListener` sends OTP email via Brevo
2. `resetPassword()`: Fetches `OtpToken` for account; checks `expiryTime > now` (throws `OTP_EXPIRED`); checks code match (throws `INVALID_OTP`); BCrypt-encodes and saves new password; deletes OTP record

Both endpoints return HTTP 200 with:
```json
{
  "code": 1000,
  "message": "If the account exists, a password reset code has been sent"
}
```

---

### Flow D — Token Refresh

```
POST /api/theater-mgnt/auth/refresh
{
  "token": "eyJ..."   // the current (or just-expired) JWT
}
```

Step-by-step:
1. `verifyToken(token, isRefreshToken=true)` — verifies signature + checks `iat + refreshable-duration > now` instead of `exp > now`
2. Saves old token's `jti` to `invalidated_tokens` (old token is now unusable)
3. Looks up account by `sub` (account ID from token's subject — **bug note**: code calls `findByUsername(sub)` but `sub` contains the UUID ID, not username — see note below)
4. Generates fresh JWT with updated `exp` and new `jti`
5. Returns `{ token: "eyJ...", authenticated: true }`

> **⚠️ Bug in refresh flow**: `AuthenticationService.refreshToken()` line 131 calls `accountRepository.findByUsername(username)` where `username` is actually `signedJWT.getJWTClaimsSet().getSubject()`, and `sub` contains the **account ID (UUID)**, not the username. This means refresh will fail for any account unless their username happens to equal their account UUID. This is a known issue to fix before microservice migration.

---

### Flow E — Logout

```
POST /api/theater-mgnt/auth/logout
{
  "token": "eyJ..."
}
```

Adds the token's `jti` to the `invalidated_tokens` table. The `CustomJwtDecoder` calls `introspect()` on every request, which checks `invalidatedTokenRepository.existsById(jti)` — invalidated tokens are immediately rejected even if not expired.

---

## 3. Authorization — RBAC

### Role Model

Roles and permissions are **stored in the database** (not an enum), in `roles` and `permissions` tables. The primary key for both is the `name` String column.

```
Account ──── (accountType: INTERNAL) ──── Staff ──── @ManyToMany ──── Role ──── @ManyToMany ──── Permission
Account ──── (accountType: CUSTOMER) ──── Customer    [no roles, always ROLE_CUSTOMER]
```

### Predefined Roles (seeded by code)

| Role Name | `PredefinedRole` Constant | Description | Seeding |
|-----------|--------------------------|-------------|---------|
| `ADMIN` | `PredefinedRole.ADMIN_ROLE` | System super-admin; full access | Auto-seeded on first startup via `ApplicationInitConfig` |
| `STAFF` | `PredefinedRole.STAFF_ROLE` | Default cinema staff | Assigned by default on staff creation if no roles specified |
| `MANAGER` | `PredefinedRole.MANAGER_ROLE` | Cinema branch manager | Must be assigned explicitly by admin |
| `CUSTOMER` | `PredefinedRole.CUSTOMER_ROLE` | All registered customers | Embedded directly in token — not in DB |

> **Permissions are dynamic** — defined and managed through `POST /permissions` and `POST /roles` API (admin-only). The only permissions currently enforced in code are `INVOICE_READ` and `INVOICE_UPDATE`, seen in `InvoiceController.java`.

### Permissions Found in `@PreAuthorize` Annotations

| Permission String | Controller | Endpoints |
|------------------|-----------|-----------|
| `INVOICE_READ` | `InvoiceController` | `GET /invoices` (all list, search, stats, detail endpoints) |
| `INVOICE_UPDATE` | `InvoiceController` | `PATCH /invoices/{id}/status` |

> **Note**: `SCOPE_REPORT_CREATE` appears as a commented-out `@PreAuthorize` in `RevenueReprocessController` — it is **not enforced** at present.

### Role-to-Authority Mapping in JWT

The `JwtGrantedAuthoritiesConverter` with `authorityPrefix("")` extracts all space-separated tokens from the `scope` claim as individual `GrantedAuthority` objects. The resulting authority set for an ADMIN with `INVOICE_READ` looks like:

```
["ROLE_ADMIN", "INVOICE_READ", "INVOICE_UPDATE"]
```

Spring Security method-level evaluation:
- `hasRole('ADMIN')` → checks for `ROLE_ADMIN` ✓
- `hasRole('MANAGER')` → checks for `ROLE_MANAGER` ✓
- `hasAuthority('INVOICE_READ')` → checks for `INVOICE_READ` directly ✓

---

## 4. Request Authentication Mechanism

### How Tokens Are Validated on Each Request

```
Incoming Request
    │
    ▼
Spring Security OAuth2 Resource Server Filter
    │ reads Authorization header
    ▼
CustomJwtDecoder.decode(token)
    │ calls authenticationService.introspect(token)
    │   ├─ Parses JWT
    │   ├─ Verifies HS512 signature with signerKey
    │   ├─ Checks exp > now
    │   └─ Checks invalidated_tokens table by jti
    │ if valid: decodes with NimbusJwtDecoder(HS512)
    ▼
JwtAuthenticationConverter
    │ setAuthorityPrefix("")
    │ extracts scope claim as space-separated authorities
    ▼
SecurityContext: JwtAuthenticationToken(accountId, authorities)
```

### Header Format

```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

- Header name: `Authorization`
- Scheme: `Bearer`
- No custom headers are added downstream — there is **no API Gateway** forwarding headers like `X-User-Id` (this is a monolith; the JWT is validated once at the filter chain entry)

### Authentication Failure Responses

All unauthenticated requests (missing/invalid/expired token, non-public endpoint):

**From `JwtAuthenticationEntryPoint`** (missing/malformed token):
```json
HTTP 401
{
  "code": 1006,
  "message": "Unauthenticated"
}
```

**From `GlobalExceptionHandler` → `AccessDeniedException`** (valid token but insufficient role):
```json
HTTP 403
{
  "code": 1002,
  "message": "You do not have permissions"
}
```

### Introspect Endpoint (Public)

```
POST /api/theater-mgnt/auth/introspect
{
  "token": "eyJ..."
}

→ { "code": 1000, "result": { "valid": true | false } }
```

This endpoint is public (in `PUBLIC_ENDPOINTS`) and is called internally by `CustomJwtDecoder` on every authenticated request. External API gateways may also call this to validate tokens before routing.

---

## 5. Endpoints by Access Level

### Public — No Authentication Required

> Configured via `PUBLIC_ENDPOINTS` array in `SecurityConfig` and explicit `permitAll()` in filter chain.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/admin/login` | Admin/staff login |
| `POST` | `/auth/customer/login` | Customer login |
| `POST` | `/auth/introspect` | Validate a token |
| `POST` | `/auth/logout` | Logout (invalidate token) |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/forgot-password` | Request OTP for password reset |
| `POST` | `/auth/reset-password` | Submit OTP + new password |
| `POST` | `/auth/outbound/authenticate` | Google OAuth callback |
| `POST` | `/register` | Customer self-registration |
| `POST` | `/notifications/email/send` | (internal — send email directly) |
| `GET` | `/movies/**` | Browse movies (public catalog) |
| `POST` | `/movies/**` | *(also public — a misconfiguration, create is unprotected at URL level)* |
| `GET` | `/genres/**` | Browse genres |
| `GET` | `/screenings/**` | Browse screenings |
| `GET` | `/payment/**` | VNPay return/IPN callbacks |
| `POST` | `/payment/**` | Create VNPay payment (public — auth happens at booking level) |
| `GET` | `/reviews/**` | Browse reviews |
| `GET` | `/cinemas` | List cinemas |
| `POST` | `/cinemas/**` | *(also public — misconfiguration)* |

> **⚠️ Security note**: The `PUBLIC_ENDPOINTS` array includes wildcard paths like `/movies/**`, `/screenings/**`, and `/cinemas/**` for **both GET and POST** via the `requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS)` call. This means `POST /movies`, `POST /screenings`, `POST /cinemas` (create operations) are accidentally public at the URL filter level. They rely on `@PreAuthorize` or role checks at the service layer for protection — but since most movie/screening controllers do **not** have `@PreAuthorize` annotations, these create endpoints are effectively unprotected.

---

### Authenticated — Any Valid Token

> Matches `anyRequest().authenticated()` in the filter chain. No specific role required.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/bookings` | List bookings |
| `POST` | `/bookings` | Create a booking |
| `POST` | `/bookings/{id}/cancel` | Cancel booking |
| `POST` | `/bookings/{id}/redeem-points` | Redeem loyalty points |
| `POST` | `/bookings/{id}/create-invoice` | Create invoice |
| `GET` | `/tickets/**` | View tickets |
| `GET` | `/customers/**` | Customer profile |
| `GET` | `/notifications/**` | User notifications |
| `PUT/PATCH` | `/movies/**` | Update/archive movies |
| `DELETE` | `/movies/**` | Delete movies |
| `*` | `/rooms/**`, `/seats/**`, `/screenings/**` | Catalog management |
| `*` | `/combos/**`, `/price-config/**` | Pricing management |
| `*` | `/staff/**`, `/schedule/**` | Staff management |

---

### Specific Role / Permission Required

> These are enforced via `@PreAuthorize` at the service or controller level.

| Role/Permission | Endpoint / Method | Source |
|----------------|-------------------|--------|
| `hasRole('ADMIN')` | All role CRUD — `RoleService.*` | `@PreAuthorize` on `RoleService` class |
| `hasRole('ADMIN')` | All permission CRUD — `PermissionService.*` | `@PreAuthorize` on `PermissionService` class |
| `hasRole('ADMIN')` | `POST /account/staff` — create staff account | `@PreAuthorize` on `RegistrationService.registerStaffAccount()` |
| `hasRole('ADMIN')` | All admin notification endpoints — `AdminNotificationController` | `@PreAuthorize` on controller class |
| `hasRole('ADMIN')` | All notification template CRUD — `NotificationTemplateController` | `@PreAuthorize` on controller class |
| `hasRole('MANAGER')` | Create/update/delete shift types — `ShiftTypeServiceImpl` | `@PreAuthorize` on service methods |
| `hasRole('MANAGER')` | Create/update/delete work schedules — `WorkScheduleServiceImpl` | `@PreAuthorize` on service methods |
| `hasRole('ADMIN') \|\| hasRole('STAFF')` | `TicketServiceImpl.checkInTicket()` | `@PreAuthorize` on service method |
| `hasAuthority('INVOICE_READ')` | All `GET /invoices/**` endpoints | `@PreAuthorize` on each method in `InvoiceController` |
| `hasAuthority('INVOICE_UPDATE')` | `PATCH /invoices/{id}/status` | `@PreAuthorize` on method in `InvoiceController` |
| `isAuthenticated()` | User notification preferences, mark-as-read — `AdminNotificationController` methods | `@PreAuthorize` on specific methods |

---

### `CUSTOMER` Role Endpoints

> No explicit `hasRole('CUSTOMER')` guards exist in the code. Customer-specific logic relies on the authenticated user's identity (e.g., `customerId` from token `sub`) rather than role checks. The booking and ticket endpoints are accessible by any authenticated user.

---

## 6. API Gateway Auth Filter (Future Microservices)

The current monolith has **no API gateway**. For the target microservice architecture:

### Recommended Gateway Behaviour (based on `service-boundaries.md` + current token structure)

1. **Token Validation**: Gateway calls `POST /auth/introspect` on the Identity Service, passing the raw `Authorization: Bearer` token from the request
2. **On `valid: false`**: Return `401` immediately; do not forward request
3. **Claims Extraction**: Gateway decodes the JWT locally (HS512 with shared key) and extracts:
   - `sub` → forward as `X-User-Id: {accountId}`
   - `scope` → forward as `X-User-Roles: ROLE_ADMIN INVOICE_READ` (space-separated)
   - `cinemaId` (if present) → forward as `X-Cinema-Id: {cinemaId}`
4. **Downstream Trust**: Downstream services trust the `X-User-*` headers from the gateway; they do **not** re-validate the JWT
5. **Public Routes**: Gateway bypasses auth check for all paths in the `PUBLIC_ENDPOINTS` list

> **Key decision**: Whether to use the **introspect-on-every-request** pattern (current monolith approach — DB roundtrip) or **local JWT decode** (stateless, no DB) for microservices should be resolved based on logout invalidation requirements. The current system requires DB lookup for logout support.

---

## Appendix: Key File Reference

| File | Path | Role |
|------|------|------|
| `SecurityConfig` | `configuration/SecurityConfig.java` | Filter chain, public endpoints, CORS, `JwtAuthenticationConverter` |
| `CustomJwtDecoder` | `configuration/CustomJwtDecoder.java` | Calls introspect on every request; delegates to `NimbusJwtDecoder` |
| `JwtAuthenticationEntryPoint` | `configuration/JwtAuthenticationEntryPoint.java` | Returns `ApiResponse` with `UNAUTHENTICATED` (1006, 401) |
| `TokenService` | `authentication/service/TokenService.java` | Generates JWTs with HS512; builds `scope` claim |
| `AuthenticationService` | `authentication/service/AuthenticationService.java` | Login, introspect, refresh, logout, OTP flows |
| `OAuthLoginService` | `authentication/service/OAuthLoginService.java` | Google OAuth code exchange + find-or-create account |
| `Role` | `authorization/entity/Role.java` | DB entity: `name (PK)`, `description`, `Set<Permission>` |
| `Permission` | `authorization/entity/Permission.java` | DB entity: `name (PK)`, `description` |
| `ApplicationInitConfig` | `configuration/ApplicationInitConfig.java` | Seeds default `admin` account on first startup |
| `PredefinedRole` | `constant/PredefinedRole.java` | String constants: `ADMIN`, `STAFF`, `MANAGER`, `CUSTOMER` |

---

*Updated: 2026-06-20 | Source: direct code read of all security, authentication, and authorization classes*
