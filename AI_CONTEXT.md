# Traveler Hub (JastipFlow) - AI Master Developer Context

This document is the master context for AI assistants and developers working on this codebase. It provides a detailed overview of the product, architecture, tech stack, database schema, state management, and coding rules.

---

## 1. System Overview
**Traveler Hub** is a dashboard and storefront application designed for traveler-sourcing business logistics. It manages:
- **Traveler Dashboard**: Ledger tracking (sales vs. expenses), active trip configuration (route, currency rate), wishlist task status, catalog listing, and checklist audits.
- **Customer Storefront**: Publicly shareable catalogs where customers can view sourcing listings, check genuine guarantees, and submit custom requests directly to the traveler's active wishlist docket.

---

## 2. Technology Stack
- **Frontend Core**: React 18, Vite, TypeScript.
- **Styling**: Tailwind CSS, Shadcn UI (`@/components/ui/`), Lucide React (icons).
- **Animations**: Framer Motion (`motion/react`).
- **State Management**: React Context (`src/context/MasterContext.tsx`).
- **Database Backend**: Supabase accessed via custom, zero-dependency REST wrapper (`src/lib/supabase.ts`).
- **Deployment**: Vercel SPA setup with routing fallback to `index.html` configured via `vercel.json`.

---

## 3. Database Schema & Supabase Tables
The system utilizes five tables under the Supabase public schema, queried directly via PostgREST over HTTPS (`postgrestRequest` fetch wrapper in `src/lib/supabase.ts`). If Supabase credentials are not supplied, the API automatically falls back to `LocalStorage` persistence.

### A. `jstip_settings`
Manages trip configuration, active rates, and notification toggles.
- **Key Profile**: Row with `id: 1`
- **Payload Schema (`settings_data` Column)**:
  ```typescript
  {
    trip: {
      origin: string;       // e.g. "Seoul"
      destination: string;  // e.g. "Jakarta"
      weightLimit: number;  // e.g. 15 (KG)
      date: string;         // e.g. "22 May 2026"
    },
    currency: {
      code: string;         // e.g. "SGD"
      symbol: string;       // e.g. "S$"
      manualRate: number;   // e.g. 13500 (IDR to 1 Unit)
      realtimeRate: number; // e.g. 13050
      payout?: string;      // e.g. "IDR"
      updatedAt?: string;
    },
    notifs?: {
      push: boolean;
      email: boolean;
      orders: boolean;
      chat: boolean;
    }
  }
  ```

### B. `jstip_items`
Sourcing catalog items listed by the traveler for storefront browsing.
- **Columns**:
  - `id`: `text` (primary key, e.g., `item_1700000000000`)
  - `name`: `text` (product description name)
  - `price`: `numeric` (publish price in IDR)
  - `cost`: `numeric` (purchasing cost in foreign currency)
  - `currency`: `text` (currency code corresponding to cost, e.g. "SGD")
  - `image`: `text` (base64 image reference or URL link)
  - `status`: `text` (defaults to "active")

### C. `jstip_wishlist`
Customer requests or custom sourcing tasks logged under the traveler docket.
- **Columns**:
  - `id`: `text` (primary key, e.g., `wish_1700000000000`)
  - `name`: `text` (item description)
  - `requester`: `text` (name of the client/requester)
  - `price`: `numeric` (target budget price in IDR)
  - `location`: `text` (intended country/city of sourcing)
  - `image`: `text` (reference photo)
  - `status`: `text` (can be: `'find'`, `'found'`, `'out of stock'`, `'cancel'`, `'hold'`)
  - `note`: `text` (custom requests / notes, optional)

### D. `jstip_sales`
Sales invoices logged by the traveler for settled/issued invoices.
- **Columns**:
  - `id`: `text` (primary key, e.g., `sale_1700000000000`)
  - `customerName`: `text` (client billing identifier)
  - `total`: `numeric` (aggregate IDR billing amount)
  - `date`: `text` (clock display log time, e.g., "10:45 AM")
  - `items`: `jsonb` (invoice item lines array)
    - Schema: `Array<{ productId: string, name: string, price: number, qty: number }>`

### E. `jstip_expenses`
Operational spend logs (commutes, stays, taxes, duty costs) of the traveler.
- **Columns**:
  - `id`: `text` (primary key, e.g., `exp_1700000000000`)
  - `description`: `text` (commute path or duty name)
  - `amount`: `numeric` (total expense converted to IDR)
  - `category`: `text` (e.g. "Transport", "Food", "Accommodation", "Tax/Duty", "Others")
  - `date`: `text` (log timestamp)
  - `notes`: `text` (optional)
  - `originalAmount`: `numeric` (optional, foreign spent)
  - `originalSymbol`: `text` (optional, foreign currency sign)

---

## 4. State Management (`MasterContext`)
The state is managed globally using **React Context** under `src/context/MasterContext.tsx`.
- **Location**: [MasterContext.tsx](file:///c:/Users/admin/Downloads/jstip%20v2/src/context/MasterContext.tsx)
- **Exports**: `MasterProvider` (wrapper) and `useMaster` (consumer hook).
- **Exposed States**: `loading`, `expenses`, `sales`, `catalogItems`, `wishlistItems`, `tripSettings`.
- **Exposed Mutators**:
  - `refreshData()`: pull all items concurrently.
  - `saveSettings(data)`: upsert active currency and routing limits.
  - `saveItem(item)`: create/update catalog product.
  - `removeItem(id)`: delete catalog product.
  - `saveWishlist(wish)`: create/update sourcing request.
  - `saveSale(sale)`: record customer purchase.
  - `saveExpense(exp)`: log transport/hotel/tax spend.

> **CRITICAL RULE**: Do not import `db` from `src/lib/supabase` directly in screens for general read/write. Always consume states and triggers from `useMaster()` to maintain session reactivity and avoid duplicated network requests.

---

## 5. Development Guidelines
1. **Style Consistency**:
   - Keep design aesthetics consistent with shadcn/ui.
   - Use dynamic visual cues (e.g. pulses on active items, badges with HSL curated colors, soft borders).
   - Utilize Framer Motion (`motion.div` from `motion/react`) to animate transitions.
2. **SPA Router**:
   - Router configuration is stored in [App.tsx](file:///c:/Users/admin/Downloads/jstip%20v2/src/App.tsx).
   - If adding deep nested routes, ensure they are registered inside the SPA layouts and matched with SPA redirects in [vercel.json](file:///c:/Users/admin/Downloads/jstip%20v2/vercel.json).
3. **No External Supabase Libraries**:
   - Do not add `@supabase/supabase-js`. The zero-dependency wrapper `db` inside `src/lib/supabase.ts` is fully sufficient and uses direct HTTP PostgREST API requests.
