# Seapedia E-Commerce

Multi-role e-commerce platform built with React + Supabase. Supports four user roles — **Buyer, Seller, Driver, Admin** — each with a dedicated dashboard and workflow.

---

## Features

### Buyer
- Product catalog with search
- Shopping cart (localStorage-persisted)
- Checkout with wallet payment
- Voucher & promo code redemption
- Order tracking (running / completed / returned)
- Wallet top-up & transaction history
- Return request submission
- App reviews & ratings

### Seller
- Store profile management
- Product CRUD with image upload
- Order management (pack, ship, process returns)
- Discount & voucher management
- Dashboard with sales statistics

### Driver
- Normal delivery workflow (pick up → deliver → complete)
- Return pickup workflow (pick up from buyer → deliver to store)
- Monthly revenue tracking

### Admin
- User, store, product, and order monitoring
- Voucher & promo CRUD
- Return & refund processing
- Overdue order detection
- Dashboard statistics

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 (with Hooks), Vite |
| **Styling** | Tailwind CSS (via PostCSS) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **State** | React Context (RoleContext, CartContext) |
| **Notifications** | react-hot-toast |
| **Linting** | ESLint with React plugin |
| **Package Manager** | npm |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase project (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/seapedia-ecommerce.git
cd seapedia-ecommerce

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
```

Edit `.env` with your Supabase project credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

```bash
# 4. Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (hot reload) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (from Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (Settings → API) |

> ⚠️ **Security:** Never commit `.env` to version control. See [SECURITY.md](./SECURITY.md#-c1-exposed-supabase-credentials) for details.

---

## Architecture

### Project Structure

```
src/
├── components/         # Shared components (ErrorBoundary.jsx)
├── context/            # React Context providers
│   ├── CartContext.jsx     # Shopping cart state + localStorage
│   └── RoleContext.jsx     # Auth session + role management
├── hooks/              # Custom React hooks
│   └── useRole.js          # Consume RoleContext
├── lib/                # Third-party clients
│   └── supabaseClient.js   # Supabase client singleton
├── pages/              # Route pages (organized by role)
│   ├── AdminPage/          # AdminMonitoring, AdminReturns, AdminVoucherDashboard
│   ├── BuyerPage/          # CartPage, BuyerOrdersPage, WalletPage, etc.
│   ├── DriverPage/         # DriverDashboard, DriverRevenuePage
│   └── SellerPage/         # SellerDashboard, ProductCatalog, StoreDiscounts, etc.
├── styles/             # Design tokens
│   ├── tokens.css
│   └── tokens.js
├── App.jsx             # Route definitions
└── main.jsx            # Entry point (providers + Toaster)
```

### Context Flow

```
main.jsx
  └── RoleProvider (auth session + role management)
       └── CartProvider (shopping cart + localStorage)
            └── App (routes)
                 └── Toaster (react-hot-toast)
```

---

## Role System

### Roles

| Role | Description | Routes |
|------|-------------|--------|
| `Buyer` | Browse products, cart, checkout, wallet | `/cart`, `/orders`, `/wallet`, `/reviews` |
| `Seller` | Manage store, products, orders, discounts | `/seller/*` |
| `Driver` | Manage deliveries, returns, revenue | `/driver/*` |
| `Admin` | Monitor system, manage vouchers, process returns | `/admin/*` |

### Role Exclusivity Logic

1. **Default:** Every user gets `Buyer` on registration.
2. **Specialization:** When a user acquires `Seller`, `Driver`, or `Admin`, the `Buyer` role is automatically removed.
3. **Single specialized role:** A user can hold at most one specialized role at a time (due to `onConflict: "user_id"` upsert).
4. **Role switching:** Users with multiple roles can switch via `/role-selection` or the role switcher in User Settings.

### Registration Flows

| Flow | Page | Key DB Actions |
|------|------|----------------|
| Register | `/register` | `auth.signUp()`, auto-assign Buyer role |
| Become Seller | `/register-seller` | `user_roles.upsert(Seller)`, `stores.insert()` |
| Become Driver | `/register-driver` | `user_roles.upsert(Driver)`, `profiles.update()` |

---

## Order Status Flow

### Normal Delivery

```
[Buyer Checkout]
    │
    ▼
"Sedang Dikemas"         ← Initial, set by system
    │
    ▼  (Seller: "Siap Kirim")
"Menunggu Pengirim"      ← Awaiting driver assignment
    │
    ▼  (Driver: "Ambil Pesanan")
"Sedang Dikirim"         ← In transit to buyer (driver assigned)
    │
    ▼  (Driver: "Selesaikan Pengantaran")
"Pesanan Selesai"        ← Delivered successfully
```

### Return Flow

```
"Pesanan Selesai"
    │
    ▼  (Buyer: submit return request → ReturnRequestPage)
"Dikembalikan" / "Menunggu Persetujuan Retur"
    │
    ├── (Seller rejects) → "Retur Ditolak"
    │
    ▼  (Seller approves → set refund)
"Retur Disetujui" / order_returns.status = "Disetujui"
    │
    ▼  (Driver: "Ambil Barang Retur")
"Retur Sedang Dikirim"   ← In transit back to store
    │
    ▼  (Driver: "Selesaikan Retur ke Toko")
"Retur Selesai"          ← Delivered to store
    │
    ▼  (Admin: process refund → AdminReturns)
"Dikembalikan"           ← Final state, refund issued
```

---

## Demo Accounts

Use these pre-seeded accounts to test each role:

| Role | Email | Password |
|------|-------|----------|
| Buyer | buyer@gmail.com | Buyer123! |
| Seller | seller@gmail.com | Seller123! |
| Driver | driver@gmail.com | Driver123! |
| Admin | admin@seapedia.com | Seapedia123! |

> ℹ️ These accounts require corresponding rows in Supabase Auth + `user_roles` + `profiles` tables.

### What to Test Per Role

**Buyer:**
- Browse products on landing page
- Search products
- Add to cart, checkout with wallet
- View orders, submit return
- Top-up wallet, view transactions
- Submit app review

**Seller:**
- Edit store profile
- Add/edit/delete products
- View orders, update status to "Menunggu Pengirim"
- Approve/reject return requests
- Create discounts

**Driver:**
- View available orders ("Menunggu Pengirim")
- Pick up order → deliver → complete
- View return pickup tab
- Pick up return → deliver to store
- View monthly revenue

**Admin:**
- View monitoring dashboard (users, stores, products, orders)
- Manage vouchers & promos
- Process return refunds
- View overdue orders

---

## Database Schema

The project uses 11 Supabase tables:

| Table | Purpose |
|-------|---------|
| `profiles` | Extended user profile (wallet, address, vehicle info) |
| `user_roles` | Role assignments (Buyer / Seller / Driver / Admin) |
| `stores` | Seller store information |
| `products` | Product catalog (per store) |
| `orders` | Order master (status, payment, delivery) |
| `order_items` | Order line items |
| `order_status_histories` | Audit trail of status changes |
| `order_returns` | Return request management |
| `discounts` | Vouchers & promo codes |
| `wallet_transactions` | Wallet financial ledger |
| `app_reviews` | Application feedback & ratings |

For the complete schema with column types and constraints, see [docs/api.yaml](./docs/api.yaml).

---

## API Reference

This project uses **Supabase client SDK** directly from the frontend (no backend API server). The complete query reference is documented in:

- [OpenAPI 3.0 Spec](./docs/api.yaml) — Import into Swagger Editor/UI
- [Postman Collection](./docs/seapedia-postman.json) — Import into Postman

### Query Patterns by Feature

| Feature | Operations |
|---------|-----------|
| Auth | `signInWithPassword`, `signInWithOAuth`, `signUp`, `signOut`, `getSession` |
| Products | `products.select`, `products.insert`, `products.update`, `products.delete` |
| Cart | localStorage-based (no Supabase queries) |
| Orders | `orders.select`, `orders.insert`, `orders.update`, `order_items.insert` |
| Returns | `order_returns.select`, `order_returns.insert`, `order_returns.update` |
| Wallet | `profiles.select/update(wallet_balance)`, `wallet_transactions.insert` |
| Discounts | `discounts.select`, `discounts.insert`, `discounts.update`, `discounts.delete` |
| Reviews | `app_reviews.select`, `app_reviews.insert` |

---

## Security

See [SECURITY.md](./SECURITY.md) for a full list of known security issues, including:

- 🔴 Exposed Supabase credentials in `.env`
- 🔴 Non-atomic checkout (potential data loss)
- 🔴 Missing Row Level Security (RLS) policies
- 🟡 Unhandled promise rejections
- 🟡 Silent database error fallback
- ⚪ setState after unmount anti-pattern

---

## Linting

```bash
npm run lint
```

The project uses ESLint with React hooks rules. All warnings are documented in the project issue tracker.

---

## Build for Production

```bash
npm run build
npm run preview
```

Output is in `dist/`. Deploy to any static hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).

---

## License

Private project — all rights reserved.
