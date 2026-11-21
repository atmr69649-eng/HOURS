# HORUS — Step 4 Read-Only Audit: Essential Store Pages, Policies, Customer Accounts & Footer Links

**Audit date:** 2026-11-21
**Scope:** Read-only inspection of About Us, Contact Us, FAQ, Size Guide, 404, Customer Accounts, Store Policies, and Footer navigation/links.
**Workspace files modified during audit:** None (only this report was created).

**Status legend:** `EXISTS & FUNCTIONAL` · `PARTIAL / PLACEHOLDER` · `MISSING` · `BROKEN`

---

## 1. Executive Summary Matrix

| # | Page / Feature | Template Exists? | Section Exists? | Current Status | Needs New Template or Reusable Section? | Content Required from Shopify Admin |
|---|---|---|---|---|---|---|
| 1 | **About Us** (`/pages/about`) | No | No | `MISSING` *(linked from Hero & Footer)* | Reusable `templates/page.json` + `sections/main-page.liquid` | Create Page (`about` handle) + real brand story copy |
| 2 | **Contact Us** (`/pages/contact`) | No | No | `MISSING` *(linked from Footer)* | `templates/page.contact.json` + `sections/contact-form.liquid` + reusable `main-page` | Create Page (`contact` handle, assign `page.contact` template) + optional contact intro; recipient email in Store Settings |
| 3 | **FAQ** (`/pages/faq`) | No | No | `MISSING` *(linked from Footer)* | `templates/page.faq.json` + reusable `sections/collapsible-content.liquid` + `main-page` | Create Page (`faq` handle, assign `page.faq` template) + real Q&A entries in Theme Editor or Page body |
| 4 | **Size Guide** (`/pages/size-guide`) | No | No | `MISSING` *(linked from Footer)* | Uses reusable `templates/page.json` + `sections/main-page.liquid` (with responsive `.rte` table styling) | Create Page (`size-guide` handle) + real garment measurement tables |
| 5 | **404 Not Found** | No | No | `MISSING` | `templates/404.json` + `sections/main-404.liquid` | None required (text comes from `locales/en.default.json`; customizable in Theme Editor) |
| 6 | **Customer Accounts** (`/account`) | No (`templates/customers/` missing) | No | `PARTIAL / PLACEHOLDER` *(desktop icon only; hidden on mobile)* | Depends on Shopify account mode (see §2.6): New Accounts = hosted by Shopify; Classic Accounts = needs `templates/customers/*` | Configure **Settings → Customer accounts** (New vs. Legacy accounts) |
| 7 | **Store Policies** (Privacy, Refund, Terms, Shipping) | N/A *(native Shopify `/policies/*`)* | N/A *(native layout injection)* | `BROKEN` *(footer links inverted; 0 CSS rules for `.shopify-policy__*`; Shipping missing from footer)* | No Liquid template needed; fix `footer.liquid` to use `shop.policies` + add `.shopify-policy__*` CSS in `theme.css` | Write/generate policies in **Settings → Policies** |
| 8 | **Footer Navigation & Links** (`sections/footer.liquid`) | N/A | Yes | `BROKEN` *(inverted `link_to`, OS 2.0 `linklists[object]` menu bug, hardcoded routes)* | Fix in existing `sections/footer.liquid` | Configure Navigation menus (`Shop` & `Info`) in **Content → Menus** & assign in Theme Editor |

---

## 2. Detailed Inspection by Area

### 2.1 About Us Page (`/pages/about`)
- **Current state:** `MISSING`. Neither `templates/page.json` nor `sections/main-page.liquid` exists.
- **Where it is currently linked:**
  - Homepage Hero secondary CTA: `templates/index.json` L13 (`"cta_secondary_label": "Our Story"`, `"cta_secondary_url": "/pages/about"`).
  - Footer Info fallback: `sections/footer.liquid` L85 (`About Us` → `/pages/about`).
- **Architecture recommendation:**
  - Create a single reusable **`templates/page.json`** + **`sections/main-page.liquid`** (centered editorial header matching `collection-banner.liquid`, `<h1>{{ page.title }}</h1>`, and styled `.rte` body for `{{ page.content }}`).
  - No separate hardcoded About template is needed unless custom editorial sections are later requested — keeping it reusable lets any Admin page work automatically.
- **Shopify Admin dependency:** Create page `About Us` (handle `about`) under **Online Store → Pages** with your real brand story.

### 2.2 Contact Us Page (`/pages/contact`)
- **Current state:** `MISSING`. No `templates/page.contact.json` and no `sections/contact-form.liquid`.
- **Where it is currently linked:** Footer Info fallback (`sections/footer.liquid` L87: `Contact` → `/pages/contact`).
- **Architecture recommendation:**
  - Create **`templates/page.contact.json`** composing reusable `main-page` (optional page title & Admin intro text) + dedicated **`sections/contact-form.liquid`**.
  - `sections/contact-form.liquid` must use Shopify's native `{% form 'contact' %}` (Name, Email, optional Phone, Message, native `form.posted_successfully?` confirmation banner, native `form.errors` validation list, and pre-fill from `customer` if logged in).
  - Do **not** hardcode email addresses, phone numbers, street addresses, or support hours — merchant can enter those in the Admin page body or optional blank Theme Editor blocks.
- **Shopify Admin dependency:** Create page `Contact` (handle `contact`), assign template `page.contact`, and confirm your store contact email under **Settings → Store details**.

### 2.3 FAQ Page (`/pages/faq`)
- **Current state:** `MISSING`. No `templates/page.faq.json` and no FAQ/accordion section.
- **Where it is currently linked:** Footer Info fallback (`sections/footer.liquid` L86: `FAQ` → `/pages/faq`).
- **Reusable components already in theme:** `.pdp-accordion`, `.pdp-accordion-trigger`, `.pdp-accordion-icon`, `.pdp-accordion-body`, and `.rte` already exist in `assets/theme.css` (built in Step 2 using semantic HTML `<details>`/`<summary>`, zero JS required).
- **Architecture recommendation:**
  - Create a reusable **`sections/collapsible-content.liquid`** section (heading + merchant-configurable `question` / `answer` + optional `page` blocks using `<details>`/`<summary>` matching HORUS gold/dark styling, with **no invented default Q&A claims**).
  - Create **`templates/page.faq.json`** combining `main-page` + `collapsible-content`. That way the merchant can either write FAQs in the Shopify Admin Page editor OR manage interactive accordion rows in the Theme Editor — and `collapsible-content` can also be reused on any other page!
- **Shopify Admin dependency:** Create page `FAQ` (handle `faq`), assign template `page.faq`, and populate real Q&As.

### 2.4 Size Guide Page (`/pages/size-guide`)
- **Current state:** `MISSING`. No `templates/page.json` / `sections/main-page.liquid`, and no `.rte table` styles in `assets/theme.css`.
- **Where it is currently linked:** Footer Info fallback (`sections/footer.liquid` L88: `Size Guide` → `/pages/size-guide`).
- **Architecture recommendation:**
  - Does **not** need a dedicated template — uses the reusable **`templates/page.json`** + **`sections/main-page.liquid`**.
  - Add responsive HORUS dark/gold `.rte table` styling (with horizontal overflow scroll wrapper on mobile `320px`–`375px` so multi-column garment measurement charts never break mobile layouts).
  - Bonus: Once created in Shopify Admin, this page can also be attached directly to any Product Page via the `Collapsible Row` (`page` picker) block already built in Step 2 (`sections/main-product.liquid`)!
- **Shopify Admin dependency:** Create page `Size Guide` (handle `size-guide`) with real garment measurements (never invented size charts).

### 2.5 404 Not Found Page
- **Current state:** `MISSING`. No `templates/404.json` and no `sections/main-404.liquid`.
- **Architecture recommendation:**
  - Create **`templates/404.json`** + **`sections/main-404.liquid`** matching HORUS editorial styling: gold gradient `404` display numeral, clear localized message (`locales/en.default.json`), and native action buttons pointing to `routes.all_products_collection_url`, `routes.root_url`, and `routes.search_url`.
- **Shopify Admin dependency:** None required (optional heading/subtext overrides available in Theme Editor).

### 2.6 Customer Account Pages & Shopify Integration
- **Current state:** `PARTIAL / PLACEHOLDER`.
  - `sections/header.liquid` L130–137 renders `<a href="{{ routes.account_url }}" class="icon-btn" style="display:none" data-desktop-only>` with `aria-label="{% if customer %}{{ customer.first_name }}'s account{% else %}Log in{% endif %}"`.
  - **Gap 1 — Hidden on mobile:** Because of `data-desktop-only` (`display: none` below `768px`) and no account link inside `#mobile-nav` (`layout/theme.liquid` L79–89), **mobile visitors cannot access Customer Accounts at all**.
  - **Gap 2 — Ignores `shop.customer_accounts_enabled`:** The header icon still renders even if customer accounts are turned off in Shopify Admin.
  - **Gap 3 — No `templates/customers/` directory:** Missing `login.json`, `register.json`, `account.json`, `order.json`, `addresses.json`, `reset_password.json`, `activate_account.json`.
- **Important Shopify Platform Note (New vs. Legacy Customer Accounts):**
  - **New Customer Accounts (Shopify's default on modern stores):** Hosted directly by Shopify (passwordless one-time code sign-in, order history, returns, profile). Clicking `{{ routes.account_url }}` routes automatically to Shopify's hosted account portal — `templates/customers/*` are **not used** in this mode.
  - **Legacy / Classic Customer Accounts (optional Admin setting):** Renders theme templates inside `templates/customers/`. Without them, `/account/login` and `/account` cannot render properly in Legacy mode.
- **Architecture recommendation:**
  - Guard account links with `{% if shop.customer_accounts_enabled %}` and add an Account / Log in link to `#mobile-nav` in `layout/theme.liquid` so mobile users can sign in under **both** account modes.
  - Provide complete, HORUS-styled Classic Customer Account templates (`templates/customers/*.json` + clean sections using native Shopify Liquid customer forms) **so the theme works seamlessly whether your store uses New Customer Accounts OR Legacy Customer Accounts**.
- **Shopify Admin dependency:** Choose account mode (New vs. Legacy) in **Settings → Customer accounts**.

### 2.7 Privacy Policy, Refund Policy, Terms of Service & Shipping Policy
- **Current state:** `BROKEN` (in Footer) & `UNSTYLED` (on Policy pages).
- **How Shopify renders policies:** Shopify serves `/policies/privacy-policy`, `/policies/refund-policy`, `/policies/terms-of-service`, and `/policies/shipping-policy` natively through `{{ content_for_layout }}` inside `layout/theme.liquid`, wrapped in `.shopify-policy__container`, `.shopify-policy__title`, and `.shopify-policy__body`. Custom `templates/policy.json` files are **not** used by Shopify.
- **Confirmed bugs & gaps found:**
  1. **Critical Liquid Bug (`sections/footer.liquid` L128–130):**
     ```liquid
     {{ shop.privacy_policy.url | default: '/policies/privacy-policy' | link_to: 'Privacy' }}
     {{ shop.terms_of_service.url | default: '/policies/terms-of-service' | link_to: 'Terms' }}
     {{ shop.refund_policy.url | default: '/policies/refund-policy' | link_to: 'Refunds' }}
     ```
     In Shopify Liquid, `link_to` takes the **label first** and **URL second** (`{{ 'Privacy' | link_to: url }}`). Reversing them outputs broken links like `<a href="Privacy">/policies/privacy-policy</a>`!
  2. **Shipping Policy missing from Footer:** `main-product.liquid`, `main-cart.liquid`, and `cart-drawer.liquid` already link `shop.shipping_policy.url` natively (Step 2), but `sections/footer.liquid` omits Shipping Policy completely.
  3. **Hardcoded fallback policy URLs:** Linking `/policies/privacy-policy` etc. when unconfigured produces 404s. Using Shopify's native `{% for policy in shop.policies %}` automatically outputs valid links ONLY for policies configured in Admin (Privacy, Refund, Terms, Shipping, Contact Info, Subscription).
  4. **Zero policy page CSS:** `assets/theme.css` has **0 rules** for `.shopify-policy__container`, `.shopify-policy__title`, or `.shopify-policy__body`, leaving legal pages unstyled on the dark `#0B0B0B` background.
- **Shopify Admin dependency:** Enter or generate your real Privacy Policy, Refund Policy, Terms of Service, and Shipping Policy in **Shopify Admin → Settings → Policies**.

### 2.8 Footer Navigation & Links (`sections/footer.liquid`)
- **Confirmed bugs & technical issues in `sections/footer.liquid`:**
  1. **Broken legal links (L128–130):** Inverted `link_to` filter (detailed in §2.7).
  2. **OS 2.0 `link_list` lookup bug (L68 & L82):**
     - Uses `linklists[section.settings.shop_menu].links` and `linklists[section.settings.info_menu].links`.
     - In Shopify OS 2.0, a `link_list` section setting (`section.settings.shop_menu`) returns a `Linklist` drop object (not a string handle). Passing a `Linklist` object into `linklists[...]` fails to resolve the menu configured in the Theme Editor! It should iterate `section.settings.shop_menu.links` and `section.settings.info_menu.links` directly.
     - *(Note: The same `linklists[settings.main_menu_handle]` pattern exists in `layout/theme.liquid` L80/L85 and `sections/header.liquid` L68 — worth fixing cleanly in `layout/theme.liquid` too if approved.)*
  3. **Hardcoded Shop fallback routes (L71–73):** Uses hardcoded `/collections/all`, `/collections/new-arrivals`, `/collections/sale` (causing the 3 pre-existing Theme Check `HardcodedRoutes` warnings and linking collections that may not exist). Using `routes.all_products_collection_url` and `routes.collections_url` (or configured `shop_menu`) resolves all 3 Theme Check warnings cleanly.
  4. **Hardcoded Info fallback links (L85–88):** Links `/pages/about`, `/pages/faq`, `/pages/contact`, `/pages/size-guide`. Once `page.json`, `page.contact.json`, and `page.faq.json` exist — and the merchant creates those pages in Admin (or configures an `info_menu` in **Content → Menus**) — these links will work cleanly; checking `pages['about']` etc. or letting configured `info_menu` take priority avoids broken links.
  5. **Social media links gap (L39–61):** `config/settings_schema.json` provides `social_facebook_link` and `social_youtube_link`, but `footer.liquid` only renders Instagram, TikTok, and X/Twitter.
- **Shopify Admin dependency:** Create `Shop` and `Info` menus in **Online Store / Content → Menus** and assign them in the Footer section settings.

---

## 3. Proposed Step 4 Implementation Plan (For Your Approval)

If you approve this audit, Step 4 will implement:

1. **Reusable Standard Page (`templates/page.json` + `sections/main-page.liquid`):**
   - Serves **About Us**, **Size Guide**, and any other Shopify Admin page with HORUS editorial typography, breadcrumb option, and responsive `.rte` + `.rte table` styling.
2. **Contact Page (`templates/page.contact.json` + `sections/contact-form.liquid`):**
   - Native Shopify `{% form 'contact' %}` (Name, Email, optional Phone, Message, success/error alerts) paired with `main-page` — zero invented contact details.
3. **FAQ Page (`templates/page.faq.json` + reusable `sections/collapsible-content.liquid`):**
   - Reuses HORUS `<details>`/`<summary>` accordion styling with merchant-configurable Q&A blocks (no invented policies/claims), paired with `main-page`.
4. **404 Page (`templates/404.json` + `sections/main-404.liquid`):**
   - HORUS-styled 404 page with native links to Home, All Products, and Search.
5. **Customer Accounts Support:**
   - Guard Account links with `{% if shop.customer_accounts_enabled %}` and add Account / Log in access inside `#mobile-nav` (works for **New Customer Accounts** immediately).
   - Add HORUS-styled Classic Customer Account templates (`templates/customers/*.json` + sections: `login`, `register`, `account`, `order`, `addresses`, `reset_password`, `activate_account`) so **Legacy Customer Accounts** are also 100% supported if enabled.
6. **Store Policies Styling & Footer Fixes (`sections/footer.liquid` + `assets/theme.css`):**
   - Fix the inverted `link_to` bug on lines 128–130 by rendering Shopify's native `{% for policy in shop.policies %}` (automatically covering Privacy, Refund, Terms, and Shipping policies without dead links).
   - Fix `section.settings.shop_menu.links` / `section.settings.info_menu.links` OS 2.0 menu resolution and replace the 3 hardcoded `/collections/*` fallback routes (eliminating the 3 pre-existing Theme Check warnings in `footer.liquid`).
   - Add HORUS dark/gold editorial CSS for `.shopify-policy__container`, `.shopify-policy__title`, and `.shopify-policy__body`.
7. **Translations & Full Verification:**
   - Add Step 4 translation keys to `locales/en.default.json`.
   - Run `shopify theme check`, `node --check assets/theme.js`, JSON validation across all files, Step 4 verification tests, and all existing Step 2 & Step 3 test suites.
