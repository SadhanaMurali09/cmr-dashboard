# Nexus CRM

A production-ready **Customer Relationship Management** dashboard built with Next.js 16, React 19, and TypeScript. Manage customer records with full CRUD operations, advanced filtering, real-time search, drag-and-drop reordering, and a polished dark-mode UI.

---

## ✨ Features

### 1. Customer Directory
- Full data table with **sortable columns** (name, email, phone, company, status, last contact)
- **Search** with 300 ms debounce — no unnecessary re-renders while typing
- **Pagination** with configurable page sizes (10 / 25 / 50 rows)
- Customer detail side-sheet with one-click copy of contact info

### 2. CRUD Operations
- **Add** new customers via a validated modal form
- **Edit** existing records with pre-populated fields
- **Delete** with a confirmation dialog to prevent accidents
- Instant optimistic UI via React Query cache updates — no full refetch needed
- Toast notifications for every operation (success & error)

### 3. Advanced Filters Panel
- Filter by **status**, **company**, **date range**, **phone**, and **email** — all combinable
- Active filter count badge on the Filters button
- **Save filters** by name and reload them in one click
- Saved filters persist to `localStorage` across sessions

### 4. Drag & Drop Reordering
- **Customer rows** — drag table rows (desktop) or cards (mobile) to reorder
- **Saved filter pills** — drag to rearrange your saved filter list
- Powered by **dnd-kit** (pointer, touch & keyboard sensors — fully accessible)
- Smooth ghost overlay with drop animations; grab cursor on hover

### 5. Responsive Design
- **Desktop (≥ 1024 px)** — fixed sidebar + full data table
- **Tablet (768 px)** — responsive layout, collapsible sidebar
- **Mobile (375 px)** — card-based customer list, hamburger navigation drawer, touch-friendly 44 px+ tap targets
- All modals/sheets are full-screen on mobile, centered panels on desktop

### 6. Accessibility & Polish
- WCAG-compliant status badges — colored dot **and** label (not color alone)
- Full keyboard navigation with visible focus rings
- ARIA labels on interactive controls, `role="alert"` on field errors
- Dark-mode-first design with OKLCH color tokens

---

## 🛠 Tech Stack

| Layer | Library |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI Components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| State / Data | [TanStack React Query v5](https://tanstack.com/query) |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Drag & Drop | [dnd-kit](https://dndkit.com) (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| Icons | [Lucide React](https://lucide.dev) |
| Toasts | [Sonner](https://sonner.emilkowal.ski) |
| Fonts | [Geist](https://vercel.com/font) (via `next/font`) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.17
- **npm** ≥ 9 (or pnpm / yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/crm-dashboard.git
cd crm-dashboard

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Scripts

```bash
npm run build   # Production build (TypeScript type-check + Next.js compile)
npm run start   # Serve the production build
npm run lint    # ESLint
```

---

## 📁 Project Structure

```
crm-dashboard/
├── app/
│   ├── customers/          # /customers route (CustomerList page)
│   ├── globals.css         # Tailwind v4 config + OKLCH design tokens
│   ├── layout.tsx          # Root layout (fonts, QueryProvider, Toaster)
│   └── page.tsx            # Dashboard home (overview cards + recent customers)
│
├── components/
│   ├── customers/
│   │   ├── advanced-filter-panel.tsx      # Slide-out filter sheet (dnd-kit pills)
│   │   ├── customer-details-sheet.tsx     # Read-only detail side-panel
│   │   ├── customer-form-modal.tsx        # Add / Edit dialog (React Hook Form + Zod)
│   │   ├── customer-list.tsx              # Main table/card list with DnD & pagination
│   │   ├── customer-pagination.tsx        # Page size + prev/next controls
│   │   ├── customer-search.tsx            # Debounced search input (300 ms)
│   │   ├── customer-status-badge.tsx      # Dot + label status indicator
│   │   ├── delete-confirm-dialog.tsx      # AlertDialog with loading state
│   │   ├── draggable-customer-card.tsx    # Mobile sortable card (useSortable)
│   │   ├── draggable-customer-row.tsx     # Desktop sortable table row (useSortable)
│   │   └── sortable-column-header.tsx     # Click-to-sort column header button
│   ├── dashboard/
│   │   └── overview-cards.tsx             # KPI metric cards on the home page
│   ├── layout/
│   │   ├── dashboard-shell.tsx            # Sidebar + header page wrapper
│   │   ├── header.tsx                     # Top bar (mobile nav trigger + user avatar)
│   │   └── sidebar.tsx                    # Fixed desktop nav / mobile drawer
│   ├── providers/
│   │   └── query-provider.tsx             # TanStack React Query client provider
│   └── ui/                               # shadcn/ui generated primitives
│
├── data/
│   └── mock-customers.ts                 # In-memory mock data store (50 records)
│
├── hooks/
│   ├── use-customer-filters.ts           # Filter state + localStorage persistence
│   ├── use-customer-mutations.ts         # Add / Update / Delete mutations + toasts
│   ├── use-customers.ts                  # Customers query (staleTime: 30 s)
│   └── use-debounce.ts                   # Generic debounce hook
│
├── lib/
│   ├── customer-list.ts                  # processCustomerList (filter → sort → paginate)
│   ├── customer-utils.ts                 # Filter, sort, paginate pure functions
│   ├── customers-api.ts                  # Simulated async API (350 ms fetch delay)
│   ├── navigation.ts                     # Nav item definitions
│   └── utils.ts                          # cn() Tailwind merge helper
│
└── types/
    └── customer.ts                       # Customer, CustomerFilters, SavedFilter types
```

---

## 🏗 Architecture Notes

### Data Persistence — Shared Server-Side Database

Customer data is now stored in **`data/customers.json`** on the server and served through Next.js API Route Handlers. This enables full multi-device synchronisation:

- **`data/customers.json`** — The shared persistent database. Committed to the repo so deployments start with the 36 seed customers. Updated on every CRUD operation.
- **`lib/db.ts`** — Server-only helper that reads/writes `customers.json` atomically (write → temp file → rename to prevent corruption).
- **`app/api/customers/route.ts`** — `GET /api/customers` and `POST /api/customers`.
- **`app/api/customers/[id]/route.ts`** — `PUT /api/customers/:id` and `DELETE /api/customers/:id`.
- **`lib/customers-api.ts`** — Client-side `fetch()` wrappers that call the above routes. The `apiBase()` helper uses a relative path (`/api/customers`) on the client and `NEXT_PUBLIC_APP_URL` during SSR.

### Multi-Device Flow
1. All devices call `GET /api/customers` — they all read from the same `customers.json` file on the server.
2. When Device B calls `POST /api/customers`, the server appends the new customer to `customers.json` and returns the created record.
3. TanStack Query on Device A polls every **30 seconds** (`refetchInterval: 30_000`) and picks up the new customer automatically. Manual refresh also works.

### Environment Variables (Production)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | SSR only | Absolute URL of the deployed app (e.g. `https://crm.yoursite.com`). Only needed if you call API routes during server-side rendering. Client-side fetch uses relative paths and does not need this. |

### Deployment Notes

- **Railway / Render / Fly.io / VPS** — Works out of the box. The `data/` directory is part of the deployment and `customers.json` is writable.
- **Vercel** — Vercel's filesystem is read-only after deployment. To deploy to Vercel, replace `lib/db.ts` with Vercel KV (free tier). The API interface stays identical — only the read/write implementation changes.

### TanStack Query Strategy

- **`staleTime: 0`** — data is always considered stale so mutations immediately trigger a server refetch.
- **`refetchInterval: 30_000`** — automatic background polling every 30 seconds for cross-device sync.
- Mutations call `setQueryData` for instant UI feedback, then `invalidateQueries` to pull fresh server data.
- Dashboard statistics (`Total Customers`, `Active`, `Leads`, `Inactive/Churned`) are calculated dynamically from the live query cache — never hardcoded.

### Filter Persistence

Saved filters are stored in `localStorage` under `crm-saved-filters`. This is intentional — filter preferences are user-specific and do not need to be shared across devices.

---

## 📄 License

MIT
