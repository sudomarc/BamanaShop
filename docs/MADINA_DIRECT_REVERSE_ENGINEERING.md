# Madina Direct - Reverse Engineering Specification

## App Identity
- **Package**: `com.madinadirect.app`
- **Scheme**: `madinadirect`
- **App Name**: "Madina Direct"
- **Version**: 1.0.0 (versionCode: 1)
- **Platform**: Expo/React Native (SDK 58), Hermes bytecode

---

## Brand & Design System
- **Primary Color**: `#E94D1C` (orange/red)
- **Background**: `#FFFFFF`
- **Icon**: Custom adaptive icon with foreground/background/monochrome variants
- **Splash Screen**: White background with centered icon (160px)
- **Notification Color**: `#E94D1C`
- **Google Fonts**: Poppins (100-800 weights, normal + italic), Material Symbols

---

## Tech Stack
- **Framework**: Expo Router (file-based routing, typed routes enabled)
- **Runtime**: Hermes JavaScript engine
- **State Management**: React Native Reanimated 3, Zustand (inferred)
- **Navigation**: Expo Router v3.5+
- **UI**: NativeWind (Tailwind CSS for React Native)
- **Image Loading**: Glide + OkHttp integration
- **Fonts**: Expo Google Fonts (Poppins, Material Symbols)
- **Build**: EAS Build

---

## Firebase Configuration
- **Project ID**: From google-services.json (not in APK)
- **Google API Key**: `AIzaSyDhNVEtm_zgyJgTQVv9q0UkB19HCyhcCq0`
- **Services Used**:
  - Firebase Auth (phone OTP)
  - Firebase Realtime Database / Firestore
  - Firebase Cloud Messaging (push notifications)
  - Firebase Analytics
  - Firebase Crashlytics
  - Firebase Dynamic Links (app links)

---

## Permissions
| Permission | Purpose |
|------------|---------|
| `ACCESS_FINE_LOCATION` | Delivery tracking, driver location |
| `ACCESS_COARSE_LOCATION` | Approximate location for delivery |
| `CAMERA` | Send photos to shops in chat |
| `READ_EXTERNAL_STORAGE` | Image picker (API ≤ 32) |
| `WRITE_EXTERNAL_STORAGE` | Image picker (API ≤ 32) |
| `POST_NOTIFICATIONS` | Push notifications (Android 13+) |
| `USE_BIOMETRIC` / `USE_FINGERPRINT` | Biometric authentication |
| `RECEIVE_BOOT_COMPLETED` | Notification handling on boot |
| `VIBRATE` | Notification feedback |
| `SYSTEM_ALERT_WINDOW` | Chat heads / overlays |
| `INTERNET` | Network access |

---

## Key Features & User Flows

### 1. Authentication
- **Phone-based OTP** (Firebase Auth)
- **Biometric login** (fingerprint/face) after initial auth
- **Session persistence** with token refresh (`/api/v1/auth/token/refresh`)
- **Deep linking**: `madinadirect://` scheme

### 2. Home / Store Discovery
- Category grid/list navigation
- Store listings with search
- Featured products carousel
- Location-based store filtering

### 3. Product Browsing
- Product detail page with images (Glide + OkHttp)
- Product variations/options
- Add to cart with quantity selector
- Product reviews/ratings

### 4. Cart & Checkout
- Persistent cart (AsyncStorage)
- Address selection (saved addresses + new)
- Delivery fee calculation
- Payment methods: Cash on Delivery (COD), Orange Money
- Order summary with commission breakdown

### 5. Orders & Tracking
- Order history with status timeline
- Real-time delivery tracking (location permissions)
- Delivery proof: photo, signature, OTP
- Order cancellation with reason
- Reorder functionality

### 6. Chat / Messaging
- **WebView-based chat** with shops (`RNCWebView`)
- Image picker integration (camera + gallery)
- Expo Image Picker for media sharing
- Real-time messaging via WebView

### 7. User Profile
- Profile management (name, avatar, language)
- Saved addresses (commune, quartier, landmark, instructions)
- Language preference: French, English, Fula (fr, en, ff)
- Notification settings
- Biometric toggle

### 8. Seller Features (Multi-role)
- Store management (create/edit store)
- Product management (CRUD + images)
- Inventory tracking
- Payouts dashboard (`/api/v1/seller/payouts`)
- Dispute management (`/api/v1/disputes`)
- Delivery zones configuration

### 9. Push Notifications
- Expo Notifications + Firebase Messaging
- Default channel: "default"
- Notification icon: custom
- Background/foreground handling
- Token registration: `/api/v2/push/updateDeviceToken`

### 10. Delivery/Logistics
- Courier assignment
- Real-time location tracking
- Delivery events timeline
- Incident reporting (customer unavailable, address not found, etc.)

---

## API Endpoints (Inferred)

### Authentication
- `POST /api/v1/auth/token/refresh` - Refresh access token
- `POST /api/v1/auth/phone/send-otp` - Send OTP
- `POST /api/v1/auth/phone/verify-otp` - Verify OTP
- `GET /api/v1/auth/me` - Get current user profile
- `DELETE /api/v1/auth/me` - Delete account

### Products & Categories
- `GET /api/v1/categories` - List categories (tree)
- `GET /api/v1/categories/:id` - Category with products
- `GET /api/v1/products` - List products (filters: category, store, search)
- `GET /api/v1/products/:id` - Product detail
- `GET /api/v1/products/:id/images` - Product images
- `GET /api/v1/stores` - List stores
- `GET /api/v1/stores/:id` - Store detail with products

### Cart & Checkout
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart/items` - Add to cart
- `PATCH /api/v1/cart/items/:id` - Update quantity
- `DELETE /api/v1/cart/items/:id` - Remove from cart
- `POST /api/v1/checkout/quote` - Get delivery quote
- `POST /api/v1/orders` - Create order

### Orders
- `GET /api/v1/orders` - List user orders (paginated)
- `GET /api/v1/orders/:id` - Order detail
- `GET /api/v1/orders/:id/tracking` - Real-time tracking
- `POST /api/v1/orders/:id/cancel` - Cancel order
- `POST /api/v1/orders/:id/reorder` - Reorder items

### Addresses
- `GET /api/v1/addresses` - List saved addresses
- `POST /api/v1/addresses` - Create address
- `PATCH /api/v1/addresses/:id` - Update address
- `DELETE /api/v1/addresses/:id` - Delete address
- `GET /api/v1/health/addresses` - Validate/autocomplete addresses

### Payments
- `POST /api/v1/payments/initiate` - Initiate payment (Orange Money)
- `GET /api/v1/payments/:id/status` - Payment status
- `POST /api/v1/payments/webhook` - Provider webhook

### Notifications
- `POST /api/v2/push/updateDeviceToken` - Register push token
- `GET /api/v1/notifications` - List notifications
- `PATCH /api/v1/notifications/:id/read` - Mark as read

### Seller
- `GET /api/v1/seller/stores` - List own stores
- `POST /api/v1/seller/stores` - Create store
- `GET /api/v1/seller/products` - List own products
- `POST /api/v1/seller/products` - Create product
- `GET /api/v1/seller/payouts` - Payout history
- `GET /api/v1/seller/disputes` - Disputes
- `GET /api/v1/seller/inventory` - Inventory movements

### Delivery
- `GET /api/v1/delivery/jobs/:id` - Delivery job detail
- `POST /api/v1/delivery/jobs/:id/events` - Add delivery event
- `POST /api/v1/delivery/jobs/:id/proof` - Upload proof
- `GET /api/v1/delivery/partners` - List delivery partners

---

## Data Models (Key Entities)

### User / Profile
```typescript
{
  id: UUID,
  phone: string (E.164 format +224XXXXXXXXX),
  full_name: string,
  avatar_url: string | null,
  preferred_language: "fr" | "en" | "ff",
  roles: ["customer" | "seller" | "courier" | ...],
  created_at: ISODateTime,
}
```

### Store
```typescript
{
  id: UUID,
  seller_id: UUID,
  name: string,
  slug: string,
  description: string,
  logo_url: string,
  banner_url: string,
  address: { commune, quartier, landmark, phone },
  opening_hours: Record<string, string>,
  status: "draft" | "pending_review" | "active" | "suspended" | "closed",
  commission_rate_bps: number (default 1000 = 10%),
}
```

### Product
```typescript
{
  id: UUID,
  store_id: UUID,
  category_id: UUID,
  name: string,
  slug: string,
  description: string,
  price_gnf: number (minor units, integer),
  compare_at_price_gnf: number | null,
  status: "draft" | "active" | "out_of_stock" | "archived",
  is_featured: boolean,
}
```

### Order
```typescript
{
  id: UUID,
  customer_id: UUID,
  store_id: UUID,
  status: "pending" | "confirmed" | "preparing" | "ready_for_pickup" | "in_transit" | "delivered" | "cancelled",
  payment_method: "cod" | "orange_money",
  payment_status: "pending" | "paid" | "failed" | "cash_due" | "cash_collected",
  delivery_status: "unassigned" | "assigned" | "picked_up" | "in_transit" | "delivered" | "failed",
  subtotal_gnf: number,
  delivery_fee_gnf: number,
  payment_fee_gnf: number,
  total_gnf: number,
  delivery_address_snapshot: Address,
  assigned_courier_id: UUID | null,
  timeline: { prepared_at, ready_for_pickup_at, picked_up_at, delivered_at },
}
```

---

## BamanaShop Implementation Strategy

### Adaptations for BamanaShop
1. **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions) instead of custom Firebase + custom API
2. **Auth**: Supabase Auth (phone OTP) + custom JWT with role claims
3. **Database**: PostgreSQL with Row Level Security (RLS)
4. **Real-time**: Supabase Realtime for order tracking, chat
5. **Storage**: Supabase Storage for product images, chat media
6. **Push**: Supabase Edge Functions + Expo Push Service (or OneSignal)
7. **Payments**: Orange Money Guinea integration via Edge Function

### Shared Contracts
Use existing `@bamanashop/contracts` package for:
- Zod schemas (source of truth)
- TypeScript types
- API request/response validation
- Mock data fixtures for development

### Project Structure (Monorepo)
```
apps/
  customer/          # User app (Expo + Expo Router)
  pro/               # Seller app
  admin/             # Admin dashboard (Next.js)
packages/
  contracts/         # Shared Zod schemas & types
  domain/            # Shared business logic
```

---

## UI/UX Patterns to Replicate

### Navigation
- **Expo Router** with typed routes
- Tab bar: Home, Categories, Cart, Orders, Profile
- Stack navigation for product detail, checkout, order tracking
- Modal sheets for address picker, filters

### Key Screens
1. **Splash** → **Onboarding** (language, location permission) → **Auth** (phone OTP)
2. **Home**: Hero banner, category grid, featured stores/products
3. **Category**: Subcategories, filterable product list
4. **Store**: Store header, products by category, store info
5. **Product Detail**: Image gallery, description, price, variants, add to cart
6. **Cart**: Item list, quantity controls, delivery estimate, checkout CTA
7. **Checkout**: Address selection, payment method, order summary, place order
8. **Orders**: Tabbed (Active, Past), order cards with status badges
9. **Order Detail**: Timeline, items, delivery tracking map, chat with store
10. **Chat**: WebView embed or native chat with image picker
11. **Profile**: Personal info, addresses, language, notifications, biometric, logout

### Visual Design
- **Primary**: `#E94D1C` (from Madina Direct)
- **Background**: `#FFFFFF` / `#FAFAFA`
- **Text**: `#1A1A1A` (primary), `#6B6B6B` (secondary)
- **Border**: `#E5E5E5`
- **Success**: `#16A34A`, **Error**: `#DC2626`, **Warning**: `#D97706`
- **Radius**: 8px (cards), 12px (buttons), 24px (modals)
- **Shadow**: Subtle elevation (React Native Shadow / Elevation)

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Expo Router app with NativeWind
- [ ] Configure Supabase client
- [ ] Implement Auth flow (phone OTP + biometric)
- [ ] Create shared UI component library
- [ ] Setup navigation structure

### Phase 2: Core Shopping (Week 3-4)
- [ ] Categories & Store listing
- [ ] Product browsing & detail
- [ ] Cart persistence (AsyncStorage + Supabase sync)
- [ ] Checkout flow with address selection

### Phase 3: Orders & Tracking (Week 5)
- [ ] Order management
- [ ] Real-time delivery tracking
- [ ] Order history with timeline

### Phase 4: Communication (Week 6)
- [ ] Chat with stores (native or WebView)
- [ ] Image picker integration
- [ ] Push notifications

### Phase 5: Seller Features (Week 7-8)
- [ ] Store management
- [ ] Product CRUD
- [ ] Payouts & analytics

### Phase 6: Polish & Launch (Week 9-10)
- [ ] Offline support
- [ ] Performance optimization
- [ ] EAS Build configuration
- [ ] App Store / Play Store submission