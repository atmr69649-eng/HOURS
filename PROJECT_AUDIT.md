# HORUS — Shopify Theme Project Audit

**Audit date:** 2026-11-20
**Scope:** Read-only inspection of `c:\Users\Lenovo\OneDrive\Desktop\webb\Horus`
**Code modified during audit:** None (only this report was created)

**Status legend:** `COMPLETED` · `PARTIALLY COMPLETED` · `NOT STARTED` · `NEEDS TESTING`

---

## 1. Overall Project Status

| Area | Assessment |
|---|---|
| Overall completion | **About 30–35% of a launch-ready store theme** |
| Design system (colors, typography, brand) | Mostly complete |
| Homepage | Hero only (by owner's choice) |
| Header / Footer / Cart drawer | Built; several functional bugs |
| Collection page | Partial — grid only, no pagination, broken tab filtering |
| Product page (PDP) | **Missing** |
| Cart page, Search, 404, Pages, Customer accounts | **Missing** |
| Locales (translations) | **Missing**, so Shopify CLI `theme check` aborts |
| Git | Initialized, 1 commit, clean tree, remote configured |
| Ready to publish? | **No** — a customer cannot view a product page, so they cannot complete a normal purchase |

The project is a **custom Online Store 2.0 theme written from scratch** (not based on Dawn). Its visual identity is strong and consistent. The commerce flow (Product → Cart → Checkout) is incomplete.

---

## 2. Existing Website Structure

```
Horus/
├── .gitignore / .shopifyignore / README.md
├── assets/
│   ├── horus-logo.jpg        (172 KB — brand logo, also used as favicon)
│   ├── theme.css             (1,774 lines — design tokens + all component styles)
│   └── theme.js              (619 lines — vanilla JS, no dependencies)
├── config/
│   ├── settings_schema.json  (Logo, Colors, Typography, Navigation, Social, Cart, Search, Product Cards, Checkout)
│   └── settings_data.json
├── layout/
│   └── theme.liquid          (renders header, mobile nav, cart drawer, main, footer)
├── sections/
│   ├── header.liquid         ✅ used (static, in layout)
│   ├── footer.liquid         ✅ used (static, in layout)
│   ├── hero-banner.liquid    ✅ used (index.json)
│   ├── collection-tabs.liquid✅ used (collection.json)
│   ├── collection-banner.liquid ⚠️ not referenced anywhere
│   ├── announcement-bar.liquid  ⚠️ not referenced (removed at owner's request)
│   └── trust-bar.liquid         ⚠️ not referenced (removed at owner's request)
├── snippets/
│   ├── product-card.liquid, cart-drawer.liquid
│   └── icon-account / icon-cart / icon-search / icon-unisex
└── templates/
    ├── index.json            (hero-banner only)
    ├── collection.json       (collection-tabs only)
    └── .gitkeep              ⚠️ contains a Liquid comment, not a valid template
```

**JS modules (theme.js):** `ToastManager`, `CartAPI`, `CartDrawer`, `MobileNav`, `HeaderScroll`, `CollectionTabs`, `ProductCards`, `TabsScroll`, `AnnouncementBar`, `LazyImages`, `NewsletterForm`.

**External dependencies:** Google Fonts only (Barlow Condensed, Bebas Neue, Cinzel, Inter). No npm packages, no apps, no build step.

---

## 3. Completed Features

| Feature | Status | Notes |
|---|---|---|
| Design tokens (gold triad `#C89D54` / `#E6C387` / `#7E5B2B`, dark palette) | COMPLETED | Defined in `theme.css :root` |
| Typography system (Poster/Bebas, Cinzel, Barlow, Inter) | COMPLETED | |
| Brand logo (circular) + "HORUS" wordmark in header and footer | COMPLETED | |
| Sticky glass header with scroll state | COMPLETED | `HeaderScroll` adds `.scrolled` |
| Desktop "Shop Collection" dropdown (hover, click, keyboard, Escape) | COMPLETED | Links depend on store collections existing (see §8) |
| Mobile hamburger menu + Shop Collection accordion | NEEDS TESTING | Depends on a `main-menu` existing in the store |
| Hero banner (title, subtitle, CTAs, image/video, gradient fallback) | COMPLETED | Overlay opacity setting does nothing (see §6) |
| Footer layout (brand, Shop/Info menus with fallbacks, socials, legal links) | COMPLETED | |
| Product card visual design (badges by tag, hover image, price, sale %) | COMPLETED | Interaction bugs listed in §6 |
| AJAX cart API (`/cart.js`, `/cart/add.js`, `/cart/change.js`) | NEEDS TESTING | Code is correct in structure; needs a live store |
| Cart drawer (open/close, overlay, Escape, qty +/-, remove, subtotal) | NEEDS TESTING | |
| Free shipping progress bar | PARTIALLY COMPLETED | Threshold hardcoded to $100 in JS |
| Toast notifications | COMPLETED | |
| SEO basics (title, description, canonical, OG, Twitter) | COMPLETED | |
| Reduced-motion support, skip link, ARIA labels | COMPLETED | Skip link may never become visible (see §7) |
| Git repository + remote | COMPLETED | See §9 |

---

## 4. Incomplete Features (Partially Completed)

| Feature | Status | What's missing |
|---|---|---|
| Collection page | PARTIALLY COMPLETED | No collection title/description shown (`collection-banner` is unused). No `{% paginate %}`, so only the first 12 products ever show. No sorting or storefront filters. Tab filtering is broken (§6). |
| Theme Settings (Customizer) | PARTIALLY COMPLETED | Color, font, logo width, cart type, free-shipping threshold, image ratio, quick-add, vendor, rating, and order-note settings exist in the schema but **are not wired to any CSS or Liquid**. Changing them in the Shopify editor has no effect. |
| Newsletter signup | PARTIALLY COMPLETED | Posts via `fetch` but always shows success (doesn't check the response). Doesn't add `contact[tags]=newsletter`. Doesn't use `{% form 'customer' %}`. May hit Shopify's spam/captcha challenge. |
| Predictive search | PARTIALLY COMPLETED | A config object is output in `theme.liquid`, but **no JS implementation exists**. |
| Social links | PARTIALLY COMPLETED | Facebook and YouTube settings exist but aren't rendered in the footer. |
| Header logo settings | PARTIALLY COMPLETED | `logo_width` / `logo_height` are assigned but never used (confirmed by theme check). |
| Wishlist button on cards | PARTIALLY COMPLETED | Button is rendered; no JS behaviour at all. |
| Currency formatting | PARTIALLY COMPLETED | JS `formatMoney` hardcodes `$`, which is wrong if the store uses EGP or another currency. |

---

## 5. Missing Features (Not Started)

| Feature | Status | Impact |
|---|---|---|
| `templates/product.json` + `sections/main-product.liquid` (gallery, variant picker, add to cart, description) | NOT STARTED | **Critical** — product pages won't render; every card links to one |
| `templates/cart.json` (full cart page) | NOT STARTED | High — "View Cart" in the drawer links to `/cart` |
| `templates/search.json` (search results) | NOT STARTED | High — the header search icon links to `/search` |
| `locales/en.default.json` (+ `en.default.schema.json`) | NOT STARTED | High — `shopify theme check` crashes without it |
| `templates/page.json` (About, FAQ, Contact, Size Guide) | NOT STARTED | High — hero "Our Story" button and footer Info links point to `/pages/*` |
| `templates/page.contact.json` (contact form) | NOT STARTED | Medium |
| `templates/404.json` | NOT STARTED | Medium |
| `templates/list-collections.json` | NOT STARTED | Low/Medium |
| `templates/customers/*` (login, register, account, order, addresses, reset/activate password) | NOT STARTED | Medium — the account icon links to `/account` |
| `templates/password.json` (pre-launch page) | NOT STARTED | Medium (useful before launch) |
| `templates/blog.json`, `article.json` | NOT STARTED | Low (only if a blog is planned) |
| `templates/gift_card.liquid` | NOT STARTED | Low |
| Section groups (`header-group.json` / `footer-group.json`) | NOT STARTED | Low — static sections still work |
| Additional homepage sections (featured products, brand story, etc.) | NOT STARTED | Optional — the owner chose a hero-only homepage |

---

## 6. Bugs and Technical Issues

| # | Severity | File | Issue |
|---|---|---|---|
| B1 | 🔴 Critical | `templates/` | No product, cart, search, page, 404, or customer templates (see §5). |
| B2 | 🔴 High | `snippets/product-card.liquid` | The Quick-Add panel, **Add to Cart button, size pills, and wishlist button are nested inside the product `<a>` link**. This is invalid HTML. `ProductCards` JS never calls `preventDefault()`, so clicking "Add to Cart" also navigates to the product page, which has no template. |
| B3 | 🔴 High | `sections/collection-tabs.liquid` + `theme.js` | Tab filtering can't work. Tabs use `data-tab = collection handle`, but items use `data-category = product.type \| handle`. Also, `collections[block.settings.collection]` passes an object as a key, and the blocks in `collection.json` have no collection assigned, so `data-tab=""`. Clicking any tab except "All" hides everything. |
| B4 | 🟠 Medium | `collection-tabs.liquid` | No pagination: collections with more than 12 products are cut off. |
| B5 | 🟠 Medium | `product-card.liquid` L54 | `data-src: featured_img \| image_url: width: 600` is a filter inside a filter argument. This isn't valid Liquid and may render incorrectly or error under strict parsing. It's also redundant (`src` is already set). |
| B6 | 🟠 Medium | `hero-banner.liquid` | The `overlay_opacity` setting is never applied in markup or CSS. |
| B7 | 🟠 Medium | `theme.js` / `cart-drawer.liquid` | Free-shipping threshold (`10000`) and "$100" text are hardcoded and ignore the `free_shipping_threshold` setting. Currency is hardcoded to `$`. |
| B8 | 🟠 Medium | `config/settings_schema.json` | Many settings are unused (see §4), which misleads anyone editing the theme. |
| B9 | 🟠 Medium | `footer.liquid` + `theme.js` | Newsletter always reports success, even on failure. |
| B10 | 🟡 Low | `templates/.gitkeep` | A non-template file in `templates/`. Shopify's GitHub sync may report it as an invalid file. |
| B11 | 🟡 Low | `sections/header.liquid` | Unused `logo_width` / `logo_height` assigns (theme check warning). |
| B12 | 🟡 Low | `footer.liquid` | Hardcoded `/collections/...` and `/pages/...` routes (theme check `HardcodedRoutes`). Should use `routes.*` objects. |
| B13 | 🟡 Low | `layout/theme.liquid` | Google Fonts are remote assets (theme check `RemoteAsset`/`AssetPreload` warnings). This works, but costs some performance. |
| B14 | 🟡 Low | `config/settings_schema.json` | `theme_documentation_url` / `support_url` are placeholders (`github.com/your-org/...`). |
| B15 | 🟡 Low | `sections/announcement-bar.liquid` | Uses `role="banner"`, which duplicates the header landmark (only matters if re-enabled). Note: `{% stylesheet %}` **is a valid Shopify section tag**, so it isn't a bug. |
| B16 | ℹ️ Info | `announcement-bar`, `trust-bar`, `cart-drawer` | Contain placeholder business claims ("Free shipping over $100", "30-Day Returns", "HORUS10", "256-bit SSL", "Ethically sourced"). These must be confirmed or replaced with real store policies. |

**Liquid syntax:** `shopify theme check` (CLI is installed locally) reported **no errors** in the files it scanned, only warnings. However, the run **aborted early because `locales/` is missing**, so the lint is incomplete. Its "OrphanedSnippet" warnings are false positives caused by the abort.

---

## 7. Design and Responsive Issues

| Item | Status | Notes |
|---|---|---|
| Mobile-first CSS with breakpoints at 640 / 768 / 1024px | COMPLETED (code review) | Not visually verified on real devices |
| Product grid 2 → 3 → 4 columns | COMPLETED (code review) | |
| Touch devices: quick-add always visible (`@media (hover: none)`) | NEEDS TESTING | Combined with B2, a tap may navigate instead of adding to cart |
| Hero title size reduced (poster font) | COMPLETED | |
| Collection page has no heading/title | PARTIALLY COMPLETED | Section title is fixed to "The Drop" on every collection |
| Skip-to-content link | NEEDS TESTING | Uses `.sr-only` plus inline transform; it likely never becomes visible on focus |
| Hero eyebrow text "New Collection — SS 2025" | Content | Outdated; needs real campaign text |
| Footer brand description | Content | Placeholder copy; confirm with owner |
| Header with a long menu at 768–1024px | NEEDS TESTING | Logo + wordmark + nav + icons may crowd the header |

---

## 8. Shopify Integration Requirements (needs your store)

These **cannot be verified or completed without access to your Shopify store**:

1. **Products** with images, variants (Size, optionally Color), prices, and compare-at prices.
2. **Product tags** used by the theme: `new` / `new-arrival`, `unisex`, `limited` / `limited-edition`.
3. **Product types** (Hoodies, T-Shirts, Sweatpants) — needed for tab filtering once fixed.
4. **Collections** with these handles (used by the dropdown): `all` (automatic), `hoodies`, `t-shirts`, `sweatpants`.
5. **Navigation menus:** `main-menu` (header + mobile) and `footer` (mobile secondary menu); optionally menus for the footer "Shop" and "Info" columns.
6. **Pages:** `about`, `faq`, `contact`, `size-guide` (linked from the hero and footer).
7. **Policies:** Privacy, Terms, Refund (Settings → Policies).
8. **Store currency and markets** — needed to fix the `$` formatting.
9. **Real business info:** free-shipping threshold, return policy, discount codes, social media URLs, brand description, campaign text.
10. **Customer accounts setting** (classic vs. new customer accounts) — decides whether `templates/customers/*` is needed.
11. **Hero image or video** upload (currently a gradient fallback).
12. **Theme editor testing** of all sections and settings.

---

## 9. GitHub Integration Status

| Item | Finding |
|---|---|
| Repository | ✅ Initialized |
| Current branch | `main` (only branch) |
| Remote | `origin` → `https://github.com/atmr69649-eng/HOURS.git` (no credentials embedded in the URL) |
| Commits | 1 — `5b1382c feat: initial commit for Horus theme` (2026-09-17, author "Omar Academy") |
| Working tree | Clean, no uncommitted changes. Local is "up to date with origin/main" as of the last fetch |
| Theme folder structure | ✅ Correct (theme files at the repo root, as Shopify GitHub integration requires) |
| Missing for Shopify sync | `locales/` folder; required templates (§5) |
| `.gitignore` / `.shopifyignore` | Present and reasonable |

> ⚠️ **Points for you to decide:**
> - The remote repo is named **"HOURS"** (not "HORUS") and belongs to the account `atmr69649-eng`. Confirm whether this is **your** GitHub account or the previous developer's. To connect it to your own store, you need a repo you control.
> - Nothing has been pushed, and no remote or branch was changed during this audit.

---

## 10. Prioritized Roadmap

### Phase A — Make the theme valid and syncable (no design changes)
1. Add `locales/en.default.json` and `locales/en.default.schema.json`.
2. Remove or relocate `templates/.gitkeep` (needs your approval, because the rules say don't delete files).
3. Re-run `shopify theme check` to get a complete lint.

### Phase B — Complete the purchase flow (critical)
4. **Product page:** `sections/main-product.liquid` + `templates/product.json` (gallery, variant/size picker, quantity, AJAX add-to-cart, description, size-guide link), matching the existing design.
5. **Fix product card interactions (B2):** restructure so the buttons aren't inside the link, or add `preventDefault`. Keep the same visual design.
6. **Cart page:** `templates/cart.json` + `sections/main-cart.liquid`.
7. Wire the free-shipping threshold and currency to settings and Shopify money format (B7).

### Phase C — Collection and discovery
8. Fix tab filtering (B3), add pagination (B4), and show the collection title (use the existing `collection-banner`).
9. Optionally add sorting and Shopify storefront filters.
10. Add a search results template (+ optional predictive search JS).

### Phase D — Content pages and accounts
11. `page.json`, `page.contact.json`, `404.json`, `list-collections.json`.
12. Customer account templates (if classic accounts are used), and `password.json` for pre-launch.

### Phase E — Polish and settings
13. Wire Customizer settings (colors, hero overlay, logo size, socials) or remove the unused ones.
14. Fix the newsletter response handling and tagging.
15. Accessibility (skip link) and minor theme check warnings.

### Phase F — Store connection and launch
16. Create or confirm **your** GitHub repo → commit → (with your approval) push.
17. Shopify Admin → Online Store → Themes → **Add theme → Connect from GitHub** → select repo/branch.
18. Add products, collections, menus, pages, and policies (§8). Test the full flow on desktop and mobile in preview.
19. Publish.

---

### Verification Summary

| Verified locally (code review + CLI lint) | Requires a live Shopify store |
|---|---|
| File structure, Liquid logic, schema validity, JS logic, CSS breakpoints, Git state, theme-check warnings | Actual rendering, AJAX cart, checkout, menus, collections/products data, newsletter submission, theme editor, real-device responsiveness |
