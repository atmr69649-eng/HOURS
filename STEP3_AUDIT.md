# HORUS — Step 3 Read-Only Audit: Collection Pages, Filtering, Pagination & Search

**Audit date:** 2026-11-20
**Scope:** Read-only inspection of collection templates/sections, category tabs, filtering, pagination, product listing integration, search, predictive search, and responsive layouts.
**Workspace files modified during audit:** None (only this report was created).

**Status legend:** `IMPLEMENTED` · `PARTIALLY IMPLEMENTED` · `MISSING` · `BROKEN`

---

## 1. Executive Summary

| Area | Status | Key Finding |
|---|---|---|
| Collection page template (`templates/collection.json`) | `PARTIALLY IMPLEMENTED` | Renders only `collection-tabs`; no collection heading (`<h1>`) or description shown (`collection-banner.liquid` is orphaned). |
| Category tabs & filtering (`collection-tabs.liquid` + `theme.js`) | `BROKEN` | Duplicate "All" tabs; empty `data-tab=""` on all blocks; collection-vs-`product.type` mismatch hides all products on click; client-side DOM filter cannot see products beyond item #12. |
| Shopify native faceted filtering & sorting | `MISSING` | No `collection.filters` (Availability, Price, Size, Color, Metafields), no `collection.sort_by` / `collection.sort_options`, no active filter chips. |
| Pagination & product limits | `MISSING` | No `{% paginate %}` tag; hard capped at 12 products (`limit: tab_items_limit`). All products beyond #12 are unreachable. |
| Product card integration | `IMPLEMENTED` | Uses `product-card.liquid` (Step 2 Add to Cart, variant pills, color swatches, and mobile button fixes already in place). Minor: links omit `| within: collection`, so PDP breadcrumbs lose collection context. |
| Search results page (`templates/search.json`) | `MISSING` | Header search icon links to `/search`, which has no template or section. |
| Instant / Predictive Search | `MISSING` | Setting (`enable_predictive_search`) and config stub (`window.HorusPredictiveSearch`) exist, but zero UI, CSS, or JS implementation exists. |
| Mobile & desktop collection grid layout | `PARTIALLY IMPLEMENTED` | Existing 2/3/4-column `.products-grid` and swipeable `.tabs-scroll` work well; filter drawer, sort bar, pagination controls, and search UI layouts do not exist yet. |

---

## 2. Detailed Inspection by Area

### 2.1 Collection Page & `collection-tabs` Section

**Inspected files:**
- `templates/collection.json` (47 lines)
- `sections/collection-tabs.liquid` (193 lines)
- `sections/collection-banner.liquid` (105 lines — **unused/orphaned**)

**What is implemented:**
- `templates/collection.json` renders `sections/collection-tabs.liquid` with `items_per_page: 12`, `show_view_all: false`, and `section_title: "The Drop"`.
- `collection-tabs.liquid` detects the current `collection` context (falling back to `collections.all`).
- `sections/collection-banner.liquid` already exists with valid schema (`show_description`) and renders `<h1>{{ collection.title }}</h1>` + `collection.description`, matching the dark/gold aesthetic.

**What is missing / broken:**
1. **No collection heading or description displayed:** `collection-banner.liquid` is not referenced in `templates/collection.json`. Every collection (`/collections/all`, `/collections/hoodies`, `/collections/t-shirts`, `/collections/sweatpants`) renders only `<h2>The Drop</h2>` with no `<h1>` landmark and no collection description.
2. **Broken empty-collection UX (`collection-tabs.liquid` L102–115):** When a collection has `0` products, the template renders **8 infinite shimmer skeleton placeholders** instead of an empty-state message with a link to all products — making an empty collection look stuck loading.
3. **No `templates/list-collections.json`:** Visiting `/collections` has no template (optional for Step 3 or Step 4, worth noting).

---

### 2.2 Collection Category Tabs & Filtering Logic

**Inspected files:**
- `templates/collection.json` L5–36
- `sections/collection-tabs.liquid` L44–101
- `assets/theme.js` L762–801 (`CollectionTabs`), L1383–1405 (`TabsScroll`)
- `sections/header.liquid` L92–117, L159–166 (Shop Collection dropdown & mobile submenu links)

**Existing bugs confirmed in code:**

| # | Severity | Location | Issue |
|---|---|---|---|
| **C1** | 🔴 High | `collection-tabs.liquid` L46–56 + `collection.json` L6–11 | **Duplicate "All" tab:** `collection-tabs.liquid` hardcodes an `"All"` button (`data-tab="all"`), AND `collection.json` also adds a `tab-all` block (`"All Products"`). Customers see two "All" tabs side by side, and clicking `"All Products"` hides all products because its `data-tab` is `""`. |
| **C2** | 🔴 High | `collection-tabs.liquid` L61 & L64 | **Invalid collection drop lookup:** In OS 2.0, `block.settings.collection` is already a `Collection` object (not a handle string). `collections[block.settings.collection]` fails to look up the collection, and `block.settings.collection \| handle` renders `""` when unassigned (as in `collection.json`) or fails on an object instead of `block.settings.collection.handle`. |
| **C3** | 🔴 High | `collection-tabs.liquid` L64 & L97 + `theme.js` L786–791 | **Mismatched filter keys:** Tabs output `data-tab` from a collection setting (`""` in `collection.json`), while grid items output `data-category="{{ product.type \| handle }}"`. Clicking any configured block tab (`All Products`, `Hoodies`, `T-Shirts`, `Sweatpants`) hides **every product** with no empty-filter message. |
| **C4** | 🔴 High | `collection-tabs.liquid` L94 + `theme.js` L786–791 | **Client-side filtering breaks with pagination and dedicated collections:** Filtering only hides/shows DOM nodes already on page 1 (max 12 items). Products past item #12 are invisible to tabs. Worse, on `/collections/hoodies`, clicking a client-side `"T-Shirts"` tab will always yield 0 items because the page only loaded Hoodies. Category tabs on collection pages should act as **real collection links** (highlighting the active collection) rather than hiding DOM nodes, while **filtering inside a collection** should use Shopify's native `collection.filters`. |
| **C5** | 🟠 Medium | `collection-tabs.liquid` L46–80 + `theme.js` L781–784 | **Accessibility gaps:** Tab buttons omit `type="button"`, and `CollectionTabs._setActive()` never updates `aria-selected="true"/"false"`. |
| **C6** | 🟡 Low | `theme.js` L1388–1404 | `TabsScroll` mouse drag handler does not suppress accidental `click` events after dragging on desktop. |

**What is missing:**
- **Shopify native storefront filtering (`collection.filters`):** Availability (`In stock` / `Out of stock`), Price range (`min` / `max`), Variant options (`Size`, `Color`), Product Type, Vendor, and custom Metafields.
- **Native collection sorting (`collection.sort_options` / `collection.sort_by`):** Featured, Best selling, Alphabetically A–Z / Z–A, Price low–high / high–low, Date old–new / new–old.
- **Active filter pills & "Clear all" button** + live filtered product count.

---

### 2.3 Product Listing & Product Card Integration

**Inspected files:**
- `sections/collection-tabs.liquid` L85–116
- `snippets/product-card.liquid` (Step 2 updated)
- `assets/theme.js` L806–998 (`ProductCards`), L1435–1458 (`LazyImages`)
- `config/settings_schema.json` L188–219

**What is implemented:**
- Grid renders `{% render 'product-card', product: product %}` inside `.products-grid`.
- All Step 2 product card improvements (non-redirecting Quick Add, multi-option & Color-only swatches, live price/compare-at updates, Sold Out states, compact mobile button sizing) work automatically in the collection grid.

**Gaps / observations:**
- **Breadcrumb collection context:** `product-card.liquid` links to `{{ product.url }}` (canonical URL). When navigating from `/collections/hoodies` to a product, `collection` is `nil` on the PDP unless collection context (`product.url | within: collection`) is optionally passed — note that canonical `product.url` is actually preferred by Shopify SEO guidelines (and `main-product.liquid` already handles `{% if collection %}` gracefully either way).
- **Dead `LazyImages` class (`theme.js` L1435–1458):** Watches `img[data-src]`, which was removed in Step 2 in favor of native browser `loading="lazy"` + Shopify responsive `widths`/`sizes`. Harmless no-op.
- **Unused Product Card theme settings (`settings_schema.json` L188–219):** `settings.show_vendor`, `settings.image_ratio`, and `settings.show_quick_add` are defined in `settings_schema.json` but not yet wired in `product-card.liquid`.

---

### 2.4 Product Pagination & Product Limits

**Inspected files:**
- `sections/collection-tabs.liquid` L8, L91–125
- `templates/collection.json` L39–40

**What is missing / broken:**
- **No `{% paginate %}` tag anywhere in the theme:** `collection-tabs.liquid` loops `{% for product in all_products limit: tab_items_limit %}` (`items_per_page: 12`, schema range `4–24`). Any collection with more than 12 products silently drops all remaining products.
- **Non-functional "Load More" button (`collection-tabs.liquid` L119–125):** Currently disabled (`show_view_all: false` in `collection.json`), and even if enabled, it is just a static `<a href="/collections/all">Load More</a>` link (with a hardcoded `/collections/all` route instead of `routes.all_products_collection_url`) that reloads page 1 rather than paginating.
- **No page indicator or next/previous navigation** (`paginate.previous`, `paginate.parts`, `paginate.next`).

---

### 2.5 Search Templates & Search-Related JavaScript

**Inspected files:**
- `sections/header.liquid` L124–127
- `snippets/icon-search.liquid`
- `layout/theme.liquid` L108–153
- `config/settings_schema.json` L177–186
- `config/settings_data.json` L14
- `templates/` directory (only `index.json`, `collection.json`, `product.json`, `cart.json`, `.gitkeep`)

**What is implemented:**
- Header renders `<a href="{{ routes.search_url }}" class="icon-btn" aria-label="Search">{% render 'icon-search' %}</a>`.
- Theme Settings includes `enable_predictive_search` (boolean, default `true`).
- `layout/theme.liquid` outputs a `window.HorusPredictiveSearch` config object when `settings.enable_predictive_search` is enabled.

**What is completely missing:**
1. **`templates/search.json`** — missing. Clicking the search icon in the header hits `/search` with no template.
2. **`sections/main-search.liquid`** — missing. Needed for:
   - Native Shopify `<form action="{{ routes.search_url }}" method="get" role="search">` with `<input type="search" name="q" value="{{ search.terms | escape }}">` and `<input type="hidden" name="options[prefix]" value="last">`.
   - Result count header (`search.results_count` for `search.terms`).
   - Rendering `product` results using `{% render 'product-card', product: item %}` (plus graceful handling of `page` and `article` results if enabled).
   - Native `search.filters` & `search.sort_options` (when `search.performed` and results exist).
   - Native `{% paginate search.results by ... %}` pagination.
   - Clean empty/zero-results state and initial (no query yet) state.
3. **Search routes in `window.HorusTheme.routes`:** `layout/theme.liquid` does not yet expose `routes.search_url` or `routes.predictive_search_url` for JS.
4. **Search JS & CSS:** Zero JavaScript reads `window.HorusPredictiveSearch`, and zero search styles exist in `assets/theme.css`.

---

### 2.6 Instant / Predictive Search Functionality

**Status:** `MISSING` (config stub only).

- **Current state:** No search modal/drawer/bar in the header, no input handler, no API call to Shopify's Predictive Search endpoint, no suggestion dropdown.
- **Native Shopify capability:** Shopify natively provides Predictive Search at `{{ routes.predictive_search_url }}.json` (`/search/suggest.json`) — or via Section Rendering — returning live `products`, `collections`, `queries`, and `pages` with zero third-party apps.
- **Progressive enhancement:** Keeping the header icon as `<a href="{{ routes.search_url }}">` (and intercepting click in JS when `settings.enable_predictive_search` is true to open a luxury dark/gold search overlay with debounced live suggestions + "View all results for '...'" link) guarantees full functionality even without JavaScript.

---

### 2.7 Mobile & Desktop Collection Layouts

**Inspected files:**
- `assets/theme.css` L739–888 (`.collection-tabs-section`, `.section-header`, `.tabs-scroll`, `.tab-pill`, `.products-grid`, `.load-more-wrap`)
- `sections/collection-banner.liquid` L22–85

**What works well:**
- `.products-grid` cleanly scales `2` columns (`< 640px`, `gap: 12px`) → `3` columns (`640px–1023px`, `gap: 16px`) → `4` columns (`>= 1024px`, `gap: 20px`).
- `.tabs-scroll` supports horizontal touch scrolling with `scroll-snap-type: x mandatory`, `44px` minimum tap height on `.tab-pill`, and gold active state.
- `collection-banner.liquid` scales cleanly (`clamp(2.25rem, 6vw, 4.25rem)`) with centered editorial typography. *(Minor: uses hardcoded `#0A0A0A` / `#C89D54` / `#8E8E93` instead of CSS variables `--color-bg`, `--color-gold`, `--color-text-muted`.)*

**What needs responsive design in Step 3:**
- **Collection toolbar (Filters + Sort + Product count):** Must stack/adapt cleanly — compact "Filter & Sort" trigger opening a slide-out filter drawer on mobile (`< 1024px`, matching the Cart Drawer's `#141414` surface and gold accents), and inline/collapsible filter controls + sort select on desktop (`>= 1024px`).
- **Active filter chips:** Wrapping flex row with clear tap targets (`min-height: 36px`) and "Clear all" link.
- **Pagination bar:** Centered responsive strip with `44px × 44px` touch targets, gold active page indicator, and disabled prev/next states.
- **Search page & Predictive Search overlay:** Full-width search bar on mobile/desktop (`min-height: 48px`), responsive 2/3/4-column results grid reusing `.products-grid`, and clean suggestion dropdown with product thumbnails, titles, and formatted prices.

---

## 3. Native Shopify Capabilities & Store Dependencies

### 3.1 Can Shopify Native Filtering, Sorting, Pagination & Predictive Search Be Used?

**Yes — 100% natively with zero paid apps and full non-JS fallbacks:**

| Capability | Native Shopify Mechanism | Non-JS Fallback |
|---|---|---|
| **Pagination** | `{% paginate collection.products by ... %}` & `{% paginate search.results by ... %}` | Native `<a href="{{ part.url }}">` links (automatically preserve `?filter.*` and `?sort_by=`) |
| **Sorting** | `collection.sort_options`, `collection.sort_by`, `search.sort_options` | Native `<form method="get"><select name="sort_by">` + `<noscript>` Apply button |
| **Storefront Filtering** | `collection.filters` & `search.filters` (`list`, `boolean`, `price_range`) | Native `<form method="get">` checkboxes & price inputs + `<noscript>` Apply button |
| **Category Navigation Tabs** | Real `<a href="{{ col.url }}">` collection links (highlighting current `collection.handle`) | Native links — works across all pages and all collection sizes |
| **Search Results** | `templates/search.json` + `sections/main-search.liquid` using `search.results` | Native `<form action="{{ routes.search_url }}" method="get">` |
| **Predictive Search** | `{{ routes.predictive_search_url }}.json?q=...` (Shopify native Predictive Search API) | Clicking search icon navigates directly to `{{ routes.search_url }}` |

### 3.2 Dependencies on Your Real Shopify Store

These items **cannot be verified locally** and depend on real data in your Shopify Admin:

1. **Collections:** Real collections with handles matching your catalog (e.g., `hoodies`, `t-shirts`, `sweatpants`, plus Shopify's built-in `all` collection), assigned to category tab blocks in the Theme Editor if desired.
2. **Shopify Search & Discovery (Filters):** In Shopify Admin (*Apps → Search & Discovery → Filters*), configuring which storefront filters are active (`Availability`, `Price`, `Size`, `Color`, `Product type`, `Brand/Vendor`, or custom **Metafields** such as Fabric/Fit). *If not yet configured, our theme code will hide empty filter groups gracefully and still render Sorting and Pagination.*
3. **Product Attributes:**
   - **Variant options** (`Size`, `Color`) for option filters.
   - **Product types** (`Hoodies`, `T-Shirts`, `Sweatpants`) if filtering by product type.
   - **Product tags** (`new` / `new-arrival`, `unisex`, `limited` / `limited-edition`) for product card badges.
   - **Metafields** (optional, only if you add metafield filters in Search & Discovery).
4. **Catalog size (> `items_per_page`):** At least 13+ products in a collection (or lowering `items_per_page` in Theme Editor) to verify multi-page pagination live.
5. **Live API testing:** Real responses from `collection.filters`, `?sort_by=`, `?page=2`, `/search?q=...`, and `/search/suggest.json` (predictive search).

---

## 4. Recommended Step 3 Implementation Plan (For Your Approval)

1. **Collection Page (`templates/collection.json` + `sections/collection-banner.liquid` + `sections/collection-tabs.liquid` or `sections/main-collection.liquid`):**
   - Re-enable `collection-banner` in `templates/collection.json` (using HORUS CSS variables) so every collection displays its real `<h1>{{ collection.title }}</h1>` and optional description.
   - Upgrade collection listing with:
     - **Working Category Navigation Tabs** (fixing bugs C1–C5: remove duplicate "All" tab, use proper OS 2.0 `block.settings.collection` object, link directly to collection URLs with active state so tabs work across all collection pages and sizes).
     - **Shopify Native Storefront Filters (`collection.filters`) & Sort (`collection.sort_options`)** with mobile slide-out Filter Drawer, desktop filter bar/panel, price range inputs, active filter chips, "Clear all" reset, and `<noscript>` submit fallback.
     - **Native Shopify Pagination (`{% paginate %}`)** via a reusable `snippets/pagination.liquid` snippet (shared by both Collection and Search pages), replacing the 12-item hard cap and broken "Load More" link.
     - **Clean Empty-Collection State** (replacing the 8 endless skeleton cards when a collection or filter yields 0 products).
2. **Search Page (`templates/search.json` + `sections/main-search.liquid`):**
   - Full HORUS-styled search page with native search bar, result count, product grid (`product-card.liquid`), page/article fallback cards, native `search.filters` & `search.sort_options`, shared `snippets/pagination.liquid`, and clean empty/zero-results states.
3. **Instant / Predictive Search (`snippets/search-drawer.liquid` + `layout/theme.liquid` + `assets/theme.js` + `assets/theme.css`):**
   - Respects `settings.enable_predictive_search` and `window.HorusPredictiveSearch`.
   - Clicking the header search icon opens a dark/gold predictive search overlay (while preserving `<a href="{{ routes.search_url }}">` as a native fallback), querying Shopify's native `routes.predictive_search_url` with debounce, keyboard Escape/focus handling, live product & collection suggestions using `formatMoney`, and a direct "View all results" submit button.
4. **Translations & Testing:**
   - Add Step 3 translation keys to `locales/en.default.json`.
   - Run `node --check assets/theme.js`, JSON validation, automated unit/regression tests, and `shopify theme check` with 0 errors and 0 new warnings.
