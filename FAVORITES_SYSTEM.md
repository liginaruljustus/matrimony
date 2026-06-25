# Favorites with Free Trial + Payment System

## Overview

Users can add profiles to their favorites for free during a configurable trial period (default: 7 days). After the trial expires, users must pay to keep their favorites, or they are automatically removed.

---

## System Architecture

### Database Schema

**FavoriteModel fields:**
```typescript
{
  userId: ObjectId              // User adding the favorite
  favoriteUserId: ObjectId      // Profile being favorited
  addedAt: Date                 // When favorite was added (indexed)
  expiresAt: Date               // When trial expires (indexed)
  isPaid: Boolean               // true if user paid to extend
  status: String                // ACTIVE | PAYMENT_LOCKED | PAID
  // ... existing payment fields
}
```

**SettingsModel fields:**
```typescript
{
  favoriteTrialDays: Number     // Days of free trial (default: 7)
  // ... other settings
}
```

---

## User Flow

### Trial Active (Days 1-7)
```
User adds favorite
  ↓
API sets: addedAt = now, expiresAt = now + 7 days, isPaid = false
  ↓
UI shows: "❤️ 6 days left" badge on profile
  ↓
User sees countdown badge on all favorited profiles
```

### Expiring Soon (Days 6-7)
```
2 days left or less
  ↓
UI shows: "⚠️ 1 day left - Pay to keep" button (orange)
  ↓
User clicks button to initiate payment
  ↓
Payment created with type: "FAVORITE_EXTENSION"
```

### Expired (Day 8+, not paid)
```
expiresAt < now AND isPaid = false
  ↓
Cleanup job removes favorite
  ↓
UI shows: "Add favorite again" button (gray)
  ↓
User can re-add if desired
```

### Paid (User pays during trial)
```
User clicks "Pay to keep"
  ↓
Payment created for ₹99-499 (based on family class)
  ↓
Payment approved
  ↓
API: POST /api/favorites/[id]/extend
  ↓
Favorite updated: isPaid = true, expiresAt = null
  ↓
UI shows: "❤️ Unlimited ♾️" (purple badge)
  ↓
Favorite never expires
```

---

## API Endpoints

### 1. Add Favorite
```
POST /api/favorites
Body: { favoriteUserId: string }

Response:
{
  ok: boolean
  message: string
}

Behavior:
- Sets addedAt = now
- Calculates expiresAt from settings.favoriteTrialDays
- Sets isPaid = false
- Upserts (re-adding refreshes expiry)
```

### 2. Get Favorites
```
GET /api/favorites

Response:
{
  favorites: [
    {
      id: string
      favoriteUserId: string
      addedAt: string
      expiresAt: string | null
      isPaid: boolean
      daysLeft: number | null
      isTrialExpired: boolean
      status: string
      mdCard: { ... }  // Profile card data
    }
  ]
}

Behavior:
- Returns all user's favorites with expiry info
- Calculates daysLeft dynamically
- Sets isTrialExpired if past expiresAt
```

### 3. Pay for Favorite
```
POST /api/favorites/pay
Body: { favoriteUserId: string }

Response:
{
  ok: boolean
  paymentId: string
  amount: number          // ₹99-499 based on family class
  message: string
}

Behavior:
- Creates Payment record with type: "FAVORITE_EXTENSION"
- Returns paymentId for payment gateway
```

### 4. Extend Favorite (After Payment Approved)
```
POST /api/favorites/[favoriteId]/extend
Body: { paymentId: string }

Response:
{
  ok: boolean
  message: string
  favorite: {
    id: string
    isPaid: true
    expiresAt: null
  }
}

Behavior:
- Verifies payment is APPROVED
- Sets isPaid = true
- Sets expiresAt = null (never expires)
```

### 5. Cleanup (Admin/Cron)
```
POST /api/favorites/cleanup
Headers: x-cron-secret: [secret]

Response:
{
  ok: boolean
  message: string
  deletedCount: number
}

Behavior:
- Deletes all favorites where expiresAt < now AND isPaid = false
- Runs daily via cron job
```

---

## Admin Configuration

**Admin Settings Page** → "Favorites Trial Settings"

- Input field: "Free Trial Period (Days)"
- Range: 1-365 days
- Default: 7 days
- Changes apply to NEW favorites only (existing ones keep original expiry)

---

## Frontend Components

### FavoriteButton Component

**Props:**
```typescript
{
  targetUserId: string           // Profile to favorite
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "button"
  label?: string
  initialIsFavorited?: boolean
  favoriteData?: {               // NEW: Expiry info
    id: string
    expiresAt: string | null
    isPaid: boolean
    daysLeft: number | null
    isTrialExpired: boolean
  }
  onToggle?: (v: boolean) => void
  onPayNeeded?: () => void
}
```

**States:**

| State | Icon | Text | Color |
|-------|------|------|-------|
| Not favorited | ❤️ | Add Favourite | Maroon |
| Trial active | ❤️ | "6 days left" | Blue badge |
| Expiring soon | ⚠️ | "Pay to keep (1d)" | Orange |
| Expired | ✕ | "Pay to restore" | Gray |
| Paid | ❤️ | "Unlimited ♾️" | Purple |

### Browse Profiles Page

Updates:
- Fetches full favorite data (not just IDs)
- Stores favoriteData map by userId
- Passes favoriteData to each FavoriteButton
- Shows expiry countdown badges on cards

---

## Payment Integration

**Payment Creation:**
- Type: `FAVORITE_EXTENSION`
- Amount: Based on groom's family class
  - MC: ₹99
  - UC: ₹199
  - EC: ₹499
- Status: `PENDING` until approved

**Payment Approval Flow:**
1. User completes payment
2. Payment record marked `approvalStatus: APPROVED`
3. Frontend calls `POST /api/favorites/[id]/extend` with paymentId
4. Favorite updated to `isPaid: true`

---

## Automatic Cleanup

**Cron Job:**
- Runs daily at 2 AM (configurable)
- Triggered via `POST /api/favorites/cleanup`
- Requires `x-cron-secret` header
- Deletes expired, unpaid favorites

**Setup:**
See `CRON_SETUP.md` for configuration options:
- EasyCron (simple)
- Node-cron (local)
- Railway/Vercel cron

---

## Data Flow Diagram

```
Add Favorite
├─ Fetch favoriteTrialDays from settings
├─ Calculate expiresAt = now + (days * 24h)
├─ Create/update favorite with addedAt, expiresAt, isPaid=false
└─ Return success

Get Favorites
├─ Fetch all user favorites
├─ For each:
│  ├─ Calculate daysLeft = (expiresAt - now) / 24h
│  ├─ Set isTrialExpired = (expiresAt < now) AND !isPaid
│  └─ Include badge info
└─ Return enriched list

Daily Cleanup (Cron)
├─ Find: expiresAt < now AND isPaid != true
├─ Delete all matching
└─ Log count

User Pays
├─ Click "Pay to keep"
├─ Create payment record
├─ Show payment gateway
├─ After approval: POST /extend
├─ Set isPaid=true, expiresAt=null
└─ Show "Unlimited ♾️" badge
```

---

## Configuration Checklist

- [ ] Admin can set `favoriteTrialDays` in settings (1-365)
- [ ] New favorites auto-expire after configured days
- [ ] Expiry countdown shows on profile cards
- [ ] "Pay to keep" button appears when expiring soon
- [ ] Payment creates FAVORITE_EXTENSION record
- [ ] Payment approval sets favorite as paid
- [ ] Cleanup cron job configured and running
- [ ] Expired favorites removed daily
- [ ] Users can re-add expired favorites

---

## Testing Checklist

```
[ ] Add favorite → Shows "7 days left" badge
[ ] Wait/modify expiresAt to 2 days from now → Shows "Pay to keep (2d)"
[ ] Click "Pay to keep" → Payment created
[ ] Approve payment → favorite shows "Unlimited ♾️"
[ ] Manually run cleanup with expiresAt in past → Favorite deleted
[ ] Re-add deleted favorite → Works, new trial starts
[ ] Admin changes favoriteTrialDays to 14 → New favorites get 14 days
[ ] Old favorites keep original 7-day expiry
```

---

## Monitoring & Alerts

**Key Metrics:**
- Total active favorites (paid + trial)
- Favorites expiring in next 7 days
- Daily cleanup count
- Payment success rate for favorite extensions

**Alerts:**
- Cleanup job failed
- High count of expired unpaid favorites (cleanup not running?)
- Payment approval delay (>1 hour)
