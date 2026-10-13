# StreamSphere — REST API Specification

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method & Route**: `POST /auth/register`
- **Rate Limit**: 50 req / 15 min
- **Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah@streamsphere.com",
  "password": "User123!"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Sarah Connor",
      "email": "sarah@streamsphere.com",
      "role": "USER",
      "entitlement": { "tierName": "FREE", "tierLevel": 0 }
    },
    "tokens": {
      "accessToken": "jwt_token...",
      "refreshToken": "random_hex_token..."
    }
  }
}
```

### 1.2 Login User
- **Method & Route**: `POST /auth/login`
- **Request Body**:
```json
{
  "email": "sarah@streamsphere.com",
  "password": "User123!"
}
```
- **Response (200 OK)**: Sets `refreshToken` HTTP-only cookie and returns `accessToken`.

### 1.3 Refresh Access Token
- **Method & Route**: `POST /auth/refresh`
- **Request Body**: `{ "refreshToken": "..." }` or sent via cookie.
- **Response (200 OK)**: Rotated access token and new refresh token.

### 1.4 Get Profile & Active Entitlement
- **Method & Route**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Current user details, active subscription, max resolution, screen quota, and watchlist counts.

---

## 2. Video Catalogue Endpoints

### 2.1 List Videos (Browse & Filter)
- **Method & Route**: `GET /videos`
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `search` (string, optional)
  - `genre` (string slug, optional, e.g. `sci-fi`)
  - `tier` (`FREE` | `BASIC` | `STANDARD` | `PREMIUM`, optional)
  - `sortBy` (`trending` | `rating` | `year` | `views` | `newest`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "uuid",
        "title": "Tears of Steel",
        "slug": "tears-of-steel",
        "minimumPlanTier": "FREE",
        "durationSeconds": 734,
        "rating": 8.9,
        "releaseYear": 2024,
        "genres": [{ "id": "uuid", "name": "Sci-Fi", "slug": "sci-fi" }]
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 24, "totalPages": 2 }
  }
}
```

### 2.2 Get Video Details
- **Method & Route**: `GET /videos/:idOrSlug`
- **Response (200 OK)**: Complete movie metadata, cast, director, trailer URL, inWatchlist status, and playbackProgress.

### 2.3 List Genres
- **Method & Route**: `GET /genres`
- **Response (200 OK)**: List of all 10 movie genres with video counts.

---

## 3. Subscription & Payment Endpoints

### 3.1 List Subscription Plans
- **Method & Route**: `GET /subscriptions/plans`
- **Response (200 OK)**: Returns Free, Basic ($7.99), Standard ($12.99), and Premium ($17.99) plans.

### 3.2 Sandbox Subscription Checkout
- **Method & Route**: `POST /subscriptions/checkout`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
```json
{
  "planId": "uuid-of-plan",
  "paymentMethod": "card_mock_visa",
  "idempotencyKey": "unique-idempotency-key",
  "simulateFailure": false
}
```
- **Response (200 OK)**: Active subscription and succeeded payment record.

### 3.3 Cancel Subscription
- **Method & Route**: `POST /subscriptions/:id/cancel`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: Marks `cancelAtPeriodEnd = true`, preserving access until end of billing cycle.

### 3.4 Payment Provider Webhook
- **Method & Route**: `POST /payments/webhook`
- **Headers**: `x-webhook-signature: <hmac-sha256-signature>`
- **Request Body**: `{ "event": "payment.succeeded", "data": { "subscriptionId": "..." } }`
- **Response (200 OK)**: `{ "success": true, "data": { "received": true } }`

---

## 4. Playback & Streaming Endpoints

### 4.1 Authorize Playback Session
- **Method & Route**: `POST /playback/sessions`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**: `{ "videoId": "uuid-of-video" }`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "sessionToken": "token-hex",
    "expiresAt": "2026-10-13T19:00:00.000Z",
    "media": {
      "streamUrl": "/api/media/stream/uuid?token=signed-token...",
      "hlsManifestUrl": "/api/media/stream/uuid?token=signed-token...&format=hls",
      "directFallbackUrl": "https://commondatastorage.googleapis.com/.../TearsOfSteel.mp4",
      "signedToken": "base64url-hmac-token",
      "maxResolution": "1080p"
    },
    "resumePositionSeconds": 310
  }
}
```
- **Error Response (403 Forbidden - UPGRADE_REQUIRED)**:
```json
{
  "success": false,
  "error": "Playback denied: \"For Bigger Escape\" requires a PREMIUM plan.",
  "code": "UPGRADE_REQUIRED",
  "details": {
    "currentTier": "BASIC",
    "requiredTier": "PREMIUM",
    "requiredPlanName": "StreamSphere Premium"
  }
}
```

### 4.2 Save Playback Heartbeat Progress
- **Method & Route**: `PUT /playback/sessions/:id/progress`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
```json
{
  "positionSeconds": 245.5,
  "durationSeconds": 734.0,
  "completed": false
}
```

### 4.3 Get Continue Watching
- **Method & Route**: `GET /playback/continue-watching`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response (200 OK)**: List of in-progress videos with percentWatched calculation.

### 4.4 Stream Authorized Media
- **Method & Route**: `GET /media/stream/:videoId?token=:signedToken`
- **Headers**: Enforces `Cache-Control: private, no-store`. Validates token HMAC signature and 302 redirects to secure media chunk/manifest.

---

## 5. Administrator Endpoints

Requires `role: ADMIN` and valid JWT token.

- `GET /admin/analytics`: Aggregated user count, active subscriptions by plan, catalogue volume, total revenue, and recent payments log.
- `POST /admin/videos`: Create new catalogue title (invalidates catalogue cache).
- `PUT /admin/videos/:id`: Update video metadata and genre associations.
- `DELETE /admin/videos/:id`: Delete video from database.
- `PUT /admin/plans/:id`: Update subscription plan pricing, resolution, or active status.
