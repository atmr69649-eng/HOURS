# HORUS — Luxury Streetwear Shopify Theme

> Premium Unisex Apparel · Vintage Editorial × Modern Streetwear · Mobile-First OS 2.0

---

## 🔗 Connect to Shopify via GitHub

1. Push this repository to GitHub.
2. In Shopify Admin → **Online Store → Themes → Add Theme → Connect from GitHub**.
3. Select your repo + branch (`main`).
4. Click **Connect** — Shopify syncs instantly.

---

## 🎨 Brand Palette

| Token          | Hex       | Role                            |
|----------------|-----------|---------------------------------|
| `--color-bg`   | `#0B0B0B` | Page background                 |
| `--color-surface` | `#141414` | Cards, drawers, surfaces      |
| `--color-gold` | `#D4AF37` | CTA buttons, badges, prices     |
| `--color-azure`| `#007FFF` | Interactive states, hover tags  |
| `--color-text` | `#F5F5F7` | Primary text                    |
| `--color-text-muted` | `#8E8E93` | Secondary / captions       |

---

## 📁 Directory Structure

```
Horus/
├── assets/
│   ├── theme.css          # Full design system + component styles
│   └── theme.js           # AJAX cart, drawer, tabs, nav, toasts
├── config/
│   ├── settings_schema.json  # Theme Editor controls
│   └── settings_data.json    # Default values
├── layout/
│   └── theme.liquid       # Main HTML shell (head, body, fonts)
├── sections/
│   ├── announcement-bar.liquid
│   ├── header.liquid      # Sticky glass header + mobile hamburger
│   ├── hero-banner.liquid # Full-viewport editorial hero
│   ├── collection-tabs.liquid  # Swipeable category pills + grid
│   ├── trust-bar.liquid   # UVP / social proof strip
│   └── footer.liquid      # Newsletter + links + legal
├── snippets/
│   ├── product-card.liquid   # Full product card component
│   ├── cart-drawer.liquid    # AJAX slide-out cart
│   ├── icon-cart.liquid
│   ├── icon-search.liquid
│   ├── icon-account.liquid
│   └── icon-unisex.liquid
└── templates/
    └── index.json         # Homepage section order
```

---

## ✨ Feature Highlights

- **Mobile-First**: Designed from 375 px up; all tap targets ≥ 48 px.
- **AJAX Cart Drawer**: Zero-reload add-to-cart with animated slide-out, qty controls, free-shipping progress bar.
- **Swipeable Category Tabs**: Smooth horizontal scroll, gold glow on active pill, instant JS filter.
- **Dual-Image Hover**: Cards swap to a second product shot on hover/touch.
- **Glass Header**: `backdrop-filter: blur()` sticky header with gold underline on scroll.
- **Grain Overlay**: Subtle noise texture for editorial depth.
- **Toast Notifications**: Non-blocking feedback for cart actions.
- **Accessibility**: ARIA roles, `aria-live` regions, `focus-visible` outlines, skip-to-content link.
- **No External Dependencies**: Pure vanilla JS + CSS custom properties.

---

## 🚀 Development Workflow

### Using Shopify CLI (recommended)
```bash
npm install -g @shopify/cli @shopify/theme
shopify theme dev --store YOUR_STORE.myshopify.com
```

### Theme Check (linting)
```bash
shopify theme check
```

### Push to live
```bash
shopify theme push
```

---

## ⚙️ Customization via Theme Editor

All key settings are exposed in **Online Store → Themes → Customize**:

- Logo, Favicon
- Color overrides for all brand tokens
- Font pickers (Display + Body)
- Main & secondary nav menus
- Social media links (Instagram, TikTok, X, Facebook, YouTube)
- Cart type (Drawer vs. Page)
- Free shipping threshold
- Product card behaviour (quick add, image ratio, vendor display)

---

## 📐 Typography

| Font               | Usage                         |
|--------------------|-------------------------------|
| **Barlow Condensed** | Hero headings, section titles, mobile nav |
| **Inter**            | Body copy, prices, UI labels |

Both loaded via Google Fonts with `display=swap` and `<link rel="preload">`.

---

## 📦 Sections & Blocks

### `collection-tabs`
Add category tabs via **Theme Editor → Collection Tabs → Add Block → Category Tab**.
Each block links to a Shopify Collection and auto-pulls product count.

### `hero-banner`
Supports: static image, hosted `.mp4` video, or gradient fallback.
All copy (eyebrow, heading, subtitle, CTAs) editable without touching code.

---

## 🛡️ Browser Support

Chrome 90+, Safari 14+, Firefox 90+, Edge 90+, iOS Safari 14+, Chrome Android 90+.

---

*Built for HORUS — where heritage meets the street.*
