/*!
 * HORUS Theme — theme.js
 * Vanilla JS: AJAX Cart, Cart Drawer, Nav, Collection Tabs
 * No external dependencies required.
 */

'use strict';

/* ============================================================
   UTILS
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const formatMoney = (cents) => {
  const amount = (cents / 100).toFixed(2);
  return `$${amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const debounce = (fn, ms = 200) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
};

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
class ToastManager {
  constructor() {
    this.container = this._createContainer();
  }

  _createContainer() {
    let el = $('#horus-toasts');
    if (!el) {
      el = document.createElement('div');
      el.id = 'horus-toasts';
      el.className = 'toast-container';
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    return el;
  }

  show(message, type = 'success', duration = 3200) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">
        ${type === 'success'
          ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--color-gold)"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:#FF3B30"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>'
        }
      </span>
      <span class="toast-msg">${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }
}

const toast = new ToastManager();

/* ============================================================
   SHOPIFY AJAX CART API
   ============================================================ */
class CartAPI {
  static async getCart() {
    const res = await fetch('/cart.js');
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  }

  static async addItem(variantId, quantity = 1, properties = {}) {
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: variantId, quantity, properties }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.description || 'Could not add item');
    }
    return res.json();
  }

  static async updateQuantity(key, quantity) {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: key, quantity }),
    });
    if (!res.ok) throw new Error('Failed to update cart');
    return res.json();
  }

  static async removeItem(key) {
    return CartAPI.updateQuantity(key, 0);
  }
}

/* ============================================================
   CART DRAWER
   ============================================================ */
class CartDrawer {
  constructor() {
    this.drawer  = $('#cart-drawer');
    this.overlay = $('#cart-overlay');
    this.body    = $('#cart-drawer-body');
    this.countEls = $$('[data-cart-count]');
    this.subtotalEls = $$('[data-cart-subtotal]');
    this.shippingFill = $('#shipping-bar-fill');
    this.shippingLabel = $('#shipping-bar-label');
    this.FREE_SHIPPING_THRESHOLD = 10000; // $100 in cents

    if (!this.drawer) return;

    this._bindEvents();
    this._loadCart();
  }

  _bindEvents() {
    // Open triggers
    $$('[data-open-cart]').forEach(el => {
      el.addEventListener('click', () => this.open());
    });

    // Close via overlay
    this.overlay?.addEventListener('click', () => this.close());

    // Close button
    $('#cart-close')?.addEventListener('click', () => this.close());

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Listen for global add-to-cart events
    document.addEventListener('horus:cart:add', async (e) => {
      const { variantId, quantity = 1, properties = {} } = e.detail;
      await this._addToCart(variantId, quantity, properties);
    });
  }

  async _addToCart(variantId, quantity = 1, properties = {}) {
    try {
      document.dispatchEvent(new CustomEvent('horus:cart:adding'));
      await CartAPI.addItem(variantId, quantity, properties);
      await this._loadCart();
      this.open();
      toast.show('Added to cart!', 'success');
    } catch (err) {
      toast.show(err.message || 'Could not add item.', 'error');
    } finally {
      document.dispatchEvent(new CustomEvent('horus:cart:added'));
    }
  }

  async _loadCart() {
    try {
      const cart = await CartAPI.getCart();
      this._renderCart(cart);
      this._updateCount(cart.item_count);
      this._updateSubtotal(cart.total_price);
      this._updateShippingBar(cart.total_price);
    } catch (err) {
      console.error('Cart load failed:', err);
    }
  }

  _renderCart(cart) {
    if (!this.body) return;

    if (cart.item_count === 0) {
      this.body.innerHTML = `
        <div class="cart-empty animate-fade-in">
          <div class="cart-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm5.625 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
            </svg>
          </div>
          <h3>Your bag is empty</h3>
          <p>Add some heat to your cart.</p>
          <button class="btn btn-gold" onclick="HorusCart.close()">Continue Shopping</button>
        </div>`;
      return;
    }

    const itemsHTML = cart.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <div class="cart-item-img">
          <a href="${item.url}">
            <img src="${item.featured_image?.url ? item.featured_image.url.replace('http:', 'https:').split('?')[0] + '?width=144' : ''}"
                 alt="${item.title}"
                 width="72" height="96"
                 loading="lazy">
          </a>
        </div>
        <div class="cart-item-info">
          <div>
            <a href="${item.url}" class="cart-item-title">${item.product_title}</a>
            <p class="cart-item-variant">${item.variant_title || ''}</p>
          </div>
          <div class="cart-item-meta">
            <span class="cart-item-price">${formatMoney(item.final_line_price)}</span>
            <div class="qty-control" role="group" aria-label="Quantity for ${item.product_title}">
              <button class="qty-btn" data-action="decrease" data-key="${item.key}" data-qty="${item.quantity}" aria-label="Decrease quantity">−</button>
              <span class="qty-value" aria-label="Quantity: ${item.quantity}">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-key="${item.key}" data-qty="${item.quantity}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button class="cart-item-remove" data-key="${item.key}">Remove</button>
        </div>
      </div>`).join('');

    this.body.innerHTML = `<div class="cart-items animate-fade-in">${itemsHTML}</div>`;

    // Bind qty / remove buttons
    this.body.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const current = parseInt(btn.dataset.qty, 10);
        const newQty = btn.dataset.action === 'increase' ? current + 1 : current - 1;
        if (newQty < 0) return;
        btn.disabled = true;
        try {
          const cart = await CartAPI.updateQuantity(key, newQty);
          this._renderCart(cart);
          this._updateCount(cart.item_count);
          this._updateSubtotal(cart.total_price);
          this._updateShippingBar(cart.total_price);
        } catch (err) {
          toast.show('Could not update quantity', 'error');
        }
      });
    });

    this.body.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const item = btn.closest('.cart-item');
        item.style.opacity = '0.4';
        item.style.pointerEvents = 'none';
        try {
          const cart = await CartAPI.removeItem(key);
          this._renderCart(cart);
          this._updateCount(cart.item_count);
          this._updateSubtotal(cart.total_price);
          this._updateShippingBar(cart.total_price);
        } catch (err) {
          toast.show('Could not remove item', 'error');
          item.style.opacity = '';
          item.style.pointerEvents = '';
        }
      });
    });
  }

  _updateCount(count) {
    this.countEls.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  _updateSubtotal(totalPrice) {
    this.subtotalEls.forEach(el => {
      el.textContent = formatMoney(totalPrice);
    });
  }

  _updateShippingBar(totalPrice) {
    if (!this.shippingFill || !this.shippingLabel) return;
    const threshold = this.FREE_SHIPPING_THRESHOLD;
    const percent = Math.min((totalPrice / threshold) * 100, 100);
    this.shippingFill.style.width = `${percent}%`;
    if (totalPrice >= threshold) {
      this.shippingLabel.innerHTML = `<span style="color:var(--color-gold)">🎉 You've unlocked FREE shipping!</span>`;
    } else {
      const remaining = formatMoney(threshold - totalPrice);
      this.shippingLabel.innerHTML = `Add <strong style="color:var(--color-text)">${remaining}</strong> more for free shipping`;
    }
  }

  get isOpen() {
    return this.drawer?.classList.contains('active');
  }

  open() {
    if (!this.drawer) return;
    this.drawer.classList.add('active');
    this.overlay?.classList.add('active');
    document.body.classList.add('drawer-open');
    this.drawer.setAttribute('aria-hidden', 'false');
    $('#cart-close')?.focus();
  }

  close() {
    if (!this.drawer) return;
    this.drawer.classList.remove('active');
    this.overlay?.classList.remove('active');
    document.body.classList.remove('drawer-open');
    this.drawer.setAttribute('aria-hidden', 'true');
  }
}

/* ============================================================
   MOBILE NAVIGATION
   ============================================================ */
class MobileNav {
  constructor() {
    this.hamburger = $('#hamburger');
    this.nav       = $('#mobile-nav');
    this.isOpen    = false;

    if (!this.hamburger || !this.nav) return;
    this._bindEvents();
  }

  _bindEvents() {
    this.hamburger.addEventListener('click', () => this.toggle());

    // Close when a link is tapped
    $$('.mobile-nav-link', this.nav).forEach(link => {
      link.addEventListener('click', () => this.close());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    this.isOpen = true;
    this.hamburger.classList.add('is-open');
    this.nav.classList.add('is-open');
    this.hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen = false;
    this.hamburger.classList.remove('is-open');
    this.nav.classList.remove('is-open');
    this.hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

/* ============================================================
   HEADER SCROLL BEHAVIOUR
   ============================================================ */
class HeaderScroll {
  constructor() {
    this.header = $('.site-header');
    if (!this.header) return;
    this._init();
  }

  _init() {
    const update = () => {
      const scrolled = window.scrollY > 20;
      this.header.classList.toggle('scrolled', scrolled);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
}

/* ============================================================
   COLLECTION TAB FILTER
   ============================================================ */
class CollectionTabs {
  constructor() {
    this.tabs  = $$('[data-tab]');
    this.items = $$('[data-category]');
    if (!this.tabs.length) return;
    this._bindEvents();
    this._filter('all'); // default
  }

  _bindEvents() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.dataset.tab;
        this._setActive(tab);
        this._filter(cat);
      });
    });
  }

  _setActive(activeTab) {
    this.tabs.forEach(t => t.classList.remove('active'));
    activeTab.classList.add('active');
  }

  _filter(category) {
    const isAll = category === 'all';
    this.items.forEach(item => {
      const match = isAll || item.dataset.category === category;
      item.classList.toggle('hidden', !match);
    });

    // Animate visible items in
    $$('[data-category]:not(.hidden)').forEach((item, i) => {
      item.style.animationDelay = `${i * 40}ms`;
      item.classList.remove('animate-fade-in');
      void item.offsetWidth; // reflow
      item.classList.add('animate-fade-in');
    });
  }
}

/* ============================================================
   PRODUCT CARD — Add to Cart
   ============================================================ */
class ProductCards {
  constructor() {
    this._bindAddToCart();
    this._bindSizePills();
    this._bindImageSwap();
  }

  _bindAddToCart() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-to-cart]');
      if (!btn) return;

      const variantId = btn.dataset.variantId;
      if (!variantId) {
        toast.show('Please select a size', 'error');
        return;
      }

      const card = btn.closest('.product-card');
      const selectedSize = card?.querySelector('.size-pill.selected')?.dataset.variantId || variantId;

      btn.classList.add('loading');
      document.dispatchEvent(new CustomEvent('horus:cart:add', {
        detail: { variantId: selectedSize, quantity: 1 }
      }));

      document.addEventListener('horus:cart:added', () => {
        btn.classList.remove('loading');
      }, { once: true });
    });
  }

  _bindSizePills() {
    document.addEventListener('click', (e) => {
      const pill = e.target.closest('.size-pill:not(.unavailable)');
      if (!pill) return;
      const group = pill.closest('.quick-add-sizes');
      if (!group) return;
      $$('.size-pill', group).forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');

      // Update the add-to-cart button's variant ID
      const btn = pill.closest('.card-quick-add, .card-info')?.querySelector('[data-add-to-cart]');
      if (btn && pill.dataset.variantId) {
        btn.dataset.variantId = pill.dataset.variantId;
      }
    });
  }

  _bindImageSwap() {
    // Touch-based image swap for mobile
    document.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;
      const hoverImg = card.querySelector('.card-img-hover');
      if (hoverImg) hoverImg.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;
      const hoverImg = card.querySelector('.card-img-hover');
      if (hoverImg) setTimeout(() => { hoverImg.style.opacity = ''; }, 300);
    }, { passive: true });
  }
}

/* ============================================================
   HORIZONTAL TABS — Touch Scroll Momentum Helper
   ============================================================ */
class TabsScroll {
  constructor() {
    $$('.tabs-scroll').forEach(el => this._init(el));
  }

  _init(el) {
    let isDown = false, startX = 0, scrollLeft = 0;

    el.addEventListener('mousedown', (e) => {
      isDown = true;
      el.style.cursor = 'grabbing';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });
    el.addEventListener('mouseleave', () => { isDown = false; el.style.cursor = ''; });
    el.addEventListener('mouseup',    () => { isDown = false; el.style.cursor = ''; });
    el.addEventListener('mousemove',  (e) => {
      if (!isDown) return;
      e.preventDefault();
      el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX) * 1.2;
    });
  }
}

/* ============================================================
   ANNOUNCEMENT BAR — Auto-dismiss
   ============================================================ */
class AnnouncementBar {
  constructor() {
    const bar = $('.announcement-bar');
    if (!bar) return;
    const closeBtn = bar.querySelector('[data-close-announcement]');
    closeBtn?.addEventListener('click', () => {
      bar.style.maxHeight = bar.scrollHeight + 'px';
      bar.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
      requestAnimationFrame(() => {
        bar.style.maxHeight = '0';
        bar.style.overflow = 'hidden';
        bar.style.opacity = '0';
      });
      sessionStorage.setItem('horus-ann-dismissed', '1');
    });

    if (sessionStorage.getItem('horus-ann-dismissed')) {
      bar.style.display = 'none';
    }
  }
}

/* ============================================================
   LAZY IMAGES (Intersection Observer)
   ============================================================ */
class LazyImages {
  constructor() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        img.closest('.card-image-wrap')?.classList.remove('loading');
        observer.unobserve(img);
      }),
      { rootMargin: '200px 0px' }
    );
    $$('img[data-src]').forEach(img => {
      img.closest('.card-image-wrap')?.classList.add('loading');
      observer.observe(img);
    });
  }
}

/* ============================================================
   NEWSLETTER FORM
   ============================================================ */
class NewsletterForm {
  constructor() {
    $$('[data-newsletter-form]').forEach(form => this._init(form));
  }

  _init(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button[type="submit"]');
      if (!input?.value) return;

      btn.disabled = true;
      btn.textContent = '...';

      try {
        // Shopify handles newsletter signup via /contact form
        const formData = new FormData();
        formData.append('contact[email]', input.value);
        formData.append('form_type', 'customer');
        formData.append('utf8', '✓');

        await fetch('/contact', { method: 'POST', body: formData });
        toast.show('You\'re on the list! Welcome to HORUS.', 'success');
        input.value = '';
        btn.textContent = 'Done ✓';
      } catch {
        toast.show('Something went wrong. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });
  }
}

/* ============================================================
   INIT — DOMContentLoaded
   ============================================================ */
let HorusCart;

document.addEventListener('DOMContentLoaded', () => {
  HorusCart = new CartDrawer();
  window.HorusCart = HorusCart; // expose for inline onclick

  new MobileNav();
  new HeaderScroll();
  new CollectionTabs();
  new ProductCards();
  new TabsScroll();
  new AnnouncementBar();
  new LazyImages();
  new NewsletterForm();
});
