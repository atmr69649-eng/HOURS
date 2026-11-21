# HORUS — Step 4 Implementation Report: Essential Store Pages, Policies, Customer Accounts & Footer Fixes

**Date:** 2026-11-21
**Scope:** Reusable Standard Page (About Us & Size Guide), Contact Us page, FAQ page, 404 Not Found page, Customer Accounts (both New and Legacy modes), Store Policy styling & Footer fixes, and OS 2.0 Linklist / route corrections.
**Git / Publishing:** No commits, pushes, deletions, or Shopify publishes were performed.

---

## 1. Files Created & Modified

### Created (22 theme files)

#### Standard, Contact, FAQ & 404 Pages (8 files)
| File | Purpose |
|---|---|
| `templates/page.json` | Reusable OS 2.0 page template (serves About Us, Size Guide, and all standard Shopify Admin pages). |
| `sections/main-page.liquid` | Editorial page header, optional breadcrumb, Admin `page.content` with responsive `.rte` tables, and optional Theme Editor blocks (`rich_text`, `image_with_text`) without inventing brand content. |
| `templates/page.contact.json` | Contact Us page template composing `main-page` + `contact-form`. |
| `sections/contact-form.liquid` | Native Shopify `{% form 'contact' %}` with Name, Email (required), Phone (optional), Message (required), native `form.posted_successfully?` confirmation, `form.errors` summary, and customer pre-fill. Zero hardcoded emails or contact details. |
| `templates/page.faq.json` | FAQ page template composing `main-page` + `collapsible-content`. |
| `sections/collapsible-content.liquid` | Reusable accessible `<details>`/`<summary>` accordion section with Theme Editor `collapsible_row` blocks (question, richtext answer, optional linked page, open-by-default toggle). Zero invented FAQs or policies. |
| `templates/404.json` | Branded 404 Not Found template referencing `main-404`. |
| `sections/main-404.liquid` | Branded HORUS 404 page with gold display `404` numeral, localized messaging, optional Theme Editor overrides, and native links to Home (`routes.root_url`), Collection (`routes.all_products_collection_url`), and Search (`routes.search_url`). |

#### Legacy Customer Account Templates & Sections (14 files)
*(Works natively when Legacy Customer Accounts are enabled; sits cleanly dormant when Shopify's hosted New Customer Accounts are active.)*

| Template | Section | Purpose |
|---|---|---|
| `templates/customers/login.json` | `sections/main-login.liquid` | Native `{% form 'customer_login' %}`, `{% form 'recover_customer_password' %}` (pure CSS `:target` + progressive JS toggle), and optional `{% form 'guest_login' %}`. |
| `templates/customers/register.json` | `sections/main-register.liquid` | Native `{% form 'create_customer' %}` (First Name, Last Name, Email, Password, validation errors). |
| `templates/customers/account.json` | `sections/main-account.liquid` | Customer dashboard with paginated `customer.orders` history table, Sign Out (`routes.account_logout_url`), default address card, and Manage Addresses link (`routes.account_addresses_url`). |
| `templates/customers/order.json` | `sections/main-order.liquid` | Order detail table (line items, SKU, fulfillment/tracking links, discounts, shipping, taxes, totals) plus Billing & Shipping address cards. |
| `templates/customers/addresses.json` | `sections/main-addresses.liquid` | Add new address, edit existing addresses, set default address, delete confirmation, and Shopify's native `shopify_common.js` `CountryProvinceSelector`. |
| `templates/customers/reset_password.json` | `sections/main-reset-password.liquid` | Native `{% form 'reset_customer_password' %}` with password + confirmation fields. |
| `templates/customers/activate_account.json` | `sections/main-activate-account.liquid` | Native `{% form 'activate_customer_password' %}` with Activate and Decline Invitation actions. |

### Modified (6 files)
| File | Changes Made |
|---|---|
| `sections/footer.liquid` | Fixed inverted `link_to` bug on legal links by iterating Shopify's native `shop.policies` (`policy.title \| link_to: policy.url`), automatically including Privacy, Refund, Terms, and Shipping when configured with zero dead links; fixed OS 2.0 `section.settings.shop_menu.links` and `section.settings.info_menu.links` lookups; replaced hardcoded `/collections/*` and `/pages/*` fallback URLs with native `routes.all_products_collection_url`, conditional existing collections/pages, and `routes.search_url` fallback — eliminating all 3 pre-existing Theme Check `HardcodedRoutes` warnings. |
| `sections/header.liquid` | Guarded desktop Account icon with `{% if shop.customer_accounts_enabled %}` so account links are never exposed when accounts are disabled; fixed OS 2.0 `settings.main_menu_handle.links` lookup with string-handle fallback. |
| `layout/theme.liquid` | Added Account / Log in link to `#mobile-nav` guarded by `{% if shop.customer_accounts_enabled %}` using `routes.account_url`; fixed OS 2.0 `link_list` lookups in `#mobile-nav`. |
| `locales/en.default.json` | Added English translation keys for 404, Contact form, and all Customer Account flows (Login, Register, Recover, Account, Orders, Addresses, Reset Password, Activate Account). |
| `assets/theme.css` | Added HORUS dark/gold responsive styles (`#0B0B0B`, `#141414`, `#C89D54`, `#E6C387`, `#7E5B2B`; `Barlow Condensed`, `Inter`, `Cinzel`) for standard pages, `.rte` headings & responsive Size Guide tables (`.rte-table-scroll`), contact/customer forms, FAQ accordions, 404 page, customer dashboard/tables/addresses, `#recover:target` CSS fallback, and Shopify native policy pages (`.shopify-policy__container`, `.shopify-policy__title`, `.shopify-policy__body`). |
| `assets/theme.js` | Added `ResponsiveTables` (auto-wraps Admin-entered HTML tables inside `[data-rte-tables]` and `.shopify-policy__body` for clean mobile horizontal scrolling) and `CustomerAccounts` (smooth `#recover` toggle with focus management, address delete confirmation, and `Shopify.CountryProvinceSelector` initialization). |

---

## 2. Verification Results

| Check | Result | Details |
|---|---|---|
| **Shopify Theme Check** | **PASS (0 errors, 0 warnings in all new files)** | **51 files inspected · 0 errors · 16 warnings total** (down from 19 after eliminating all 3 `HardcodedRoutes` warnings in `sections/footer.liquid`!). Remaining 16 warnings: 5 pre-existing Google Fonts warnings in `layout/theme.liquid`, 2 pre-existing `UnusedAssign` in `sections/header.liquid`, and 9 Windows `OrphanedSnippet` false positives across `snippets/*.liquid`. |
| **JS Syntax (`node --check assets/theme.js`)** | **PASS** | 0 syntax errors. |
| **JSON Validation (all 20 JSON files)** | **PASS** | All 20 config, locale, and template JSON files (including all 7 `templates/customers/*.json`) parsed cleanly with 0 failures. |
| **Step 4 Automated Test Suite (`test_step4.js`)** | **PASS** | Verified standard page (About Us / Size Guide), contact form validation & zero hardcoded emails, FAQ accordions, 404 routes, all 7 customer templates, `shop.customer_accounts_enabled` guards in header & mobile nav, footer `shop.policies` correct `link_to` order & OS 2.0 menu lookups, `.shopify-policy__*` CSS, `ResponsiveTables` auto-wrapping, `#recover` toggle & focus, and address delete confirmation. |
| **Previous Regression Suites (Steps 2 & 3)** | **PASS** | `test_step2.js`, `test_step2_regressions.js` (all 6 Step 2 fixes), and `test_step3.js` all passed with 0 regressions. |

---

## 3. Locally Verified vs. Live Shopify Store Testing Required

### Verified Locally
- All 22 new templates/sections and 6 modified files pass Shopify Theme Check (`0` errors, `0` new warnings) and JSON/JS syntax checks.
- Native Shopify Liquid tags (`{% form 'contact' %}`, `{% form 'customer_login' %}`, `{% form 'recover_customer_password' %}`, `{% form 'create_customer' %}`, `{% form 'customer_address' %}`, `{% form 'reset_customer_password' %}`, `{% form 'activate_customer_password' %}`, `shop.policies`, `shop.customer_accounts_enabled`, `routes.*`).
- Client-side `ResponsiveTables` wrapping, `#recover` panel switching, focus management, and address delete confirmation.
- Responsive CSS rules (`minmax(0, 1fr)`, `.rte-table-scroll`, `.customer-table-wrap`) across mobile, tablet, and desktop breakpoints.

### Requires a Live Shopify Store & Shopify Admin Setup
1. **Create Pages in Shopify Admin (*Online Store → Pages*):**
   - `About Us` (handle `about`, default `page` template) — add your real brand story.
   - `Contact` (handle `contact`, assign **`page.contact`** template) — add any optional intro/hours/address.
   - `FAQ` (handle `faq`, assign **`page.faq`** template) — add real Q&A rows in Theme Editor or Admin page body.
   - `Size Guide` (handle `size-guide`, default `page` template) — add your real garment measurement tables.
2. **Configure Store Policies (*Settings → Policies*):** Enter or generate your Privacy Policy, Refund Policy, Terms of Service, and Shipping Policy, then verify the footer links and `/policies/*` visual rendering live.
3. **Configure Navigation Menus (*Content → Menus*):** Assign your `Shop` and `Info` menus in the Footer section settings (and `Main menu` / `Footer` in Theme Settings → Navigation).
4. **Live Form & Account Testing:**
   - Submit a live test message through `/pages/contact` to confirm email delivery and Shopify spam/captcha handling.
   - Verify your chosen mode under **Settings → Customer accounts**:
     - **New Customer Accounts:** verify `routes.account_url` redirects cleanly on desktop and mobile to Shopify's hosted sign-in.
     - **Legacy Customer Accounts:** test live login, registration, password recovery email, order history, order detail, and address CRUD + `CountryProvinceSelector` dropdowns.
     - **Disabled Customer Accounts:** confirm both header and mobile-nav account links disappear.
5. **Real-Device Visual QA:** Test `320px`, `375px`, `768px`, and `1280px` rendering on real mobile devices (especially Size Guide tables, Contact form inputs, FAQ accordions, 404 card, and Policy pages).
