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

const escapeHTML = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatWithDelimiters = (number, precision = 2, thousands = ',', decimal = '.') => {
  if (isNaN(number) || number == null) return '0';
  const fixed = (number / 100.0).toFixed(precision);
  const parts = fixed.split('.');
  const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`);
  const cents = parts[1] ? `${decimal}${parts[1]}` : '';
  return `${dollars}${cents}`;
};

const formatMoney = (cents, format) => {
  const numericCents = typeof cents === 'string' ? parseInt(cents.replace('.', ''), 10) : Number(cents);
  const moneyFormat = format || window.HorusTheme?.moneyFormat || '${{amount}}';
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;

  if (!placeholderRegex.test(moneyFormat)) {
    return `$${formatWithDelimiters(numericCents, 2)}`;
  }

  let value = '';
  const match = moneyFormat.match(placeholderRegex)[1];
  switch (match) {
    case 'amount':
      value = formatWithDelimiters(numericCents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(numericCents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(numericCents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(numericCents, 0, '.', ',');
      break;
    case 'amount_with_apostrophe_separator':
      value = formatWithDelimiters(numericCents, 2, "'", '.');
      break;
    default:
      value = formatWithDelimiters(numericCents, 2);
  }
  return moneyFormat.replace(placeholderRegex, value);
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
  static _route(key, fallback) {
    const base = window.HorusTheme?.routes?.[key];
    return base ? `${base}.js` : fallback;
  }

  static async _parseError(res, fallback) {
    try {
      const err = await res.json();
      return err.description || err.message || fallback;
    } catch {
      return fallback;
    }
  }

  static async getCart() {
    const res = await fetch(CartAPI._route('cartUrl', '/cart.js'), {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  }

  static async addItem(variantId, quantity = 1, properties = {}) {
    const res = await fetch(CartAPI._route('cartAddUrl', '/cart/add.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: Number(variantId) || variantId, quantity: Number(quantity) || 1, properties }),
    });
    if (!res.ok) {
      throw new Error(await CartAPI._parseError(res, 'Could not add item'));
    }
    return res.json();
  }

  static async updateQuantity(key, quantity) {
    const res = await fetch(CartAPI._route('cartChangeUrl', '/cart/change.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: key, quantity: Math.max(0, Number(quantity) || 0) }),
    });
    if (!res.ok) {
      throw new Error(await CartAPI._parseError(res, 'Failed to update cart'));
    }
    return res.json();
  }

  static async updateNote(note) {
    const res = await fetch(CartAPI._route('cartUpdateUrl', '/cart/update.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ note }),
    });
    if (!res.ok) {
      throw new Error(await CartAPI._parseError(res, 'Failed to update order note'));
    }
    return res.json();
  }

  static async removeItem(key) {
    return CartAPI.updateQuantity(key, 0);
  }
}

/* ============================================================
   CART DRAWER (Synchronized with CartPage via horus:cart:updated)
   ============================================================ */
class CartDrawer {
  constructor() {
    this.drawer = $('#cart-drawer');
    this.overlay = $('#cart-overlay');
    this.body = $('#cart-drawer-body');
    this.FREE_SHIPPING_THRESHOLD = Number(window.HorusTheme?.freeShippingThreshold ?? 0);

    if (!this.drawer) return;

    this._bindEvents();
    this._loadCart();
  }

  _bindEvents() {
    // Open triggers
    $$('[data-open-cart]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    // Close triggers
    this.overlay?.addEventListener('click', () => this.close());
    $('#cart-close')?.addEventListener('click', () => this.close());
    this.drawer.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-cart]')) this.close();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Global add-to-cart event (from ProductCards or ProductPage)
    document.addEventListener('horus:cart:add', async (e) => {
      const detail = e.detail || {};
      detail.handled = true;
      const { variantId, quantity = 1, properties = {}, onError, onSuccess, onFinally } = detail;
      await this._addToCart(variantId, quantity, properties, { onError, onSuccess, onFinally });
    });

    // Synchronize when CartPage or another component updates the cart
    document.addEventListener('horus:cart:updated', (e) => {
      const { cart, source } = e.detail || {};
      if (!cart || source === 'drawer') return;
      this.applyCartState(cart);
    });

    // Refresh cart state on browser back/forward navigation (bfcache)
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) this._loadCart();
    });
  }

  _broadcastUpdate(cart, source = 'drawer') {
    document.dispatchEvent(new CustomEvent('horus:cart:updated', {
      detail: { cart, source },
    }));
  }

  applyCartState(cart) {
    this._renderCart(cart);
    this._updateCount(cart.item_count);
    this._updateSubtotal(cart.total_price);
    this._updateShippingBar(cart.total_price);
    const shippingWrap = this.drawer?.querySelector('[data-cart-drawer-shipping]');
    if (shippingWrap) {
      shippingWrap.hidden = cart.item_count === 0;
    }
    const checkoutBtn = this.drawer?.querySelector('[data-cart-checkout-btn]');
    if (checkoutBtn) {
      checkoutBtn.disabled = cart.item_count === 0;
      checkoutBtn.setAttribute('aria-disabled', String(cart.item_count === 0));
    }
  }

  async _addToCart(variantId, quantity = 1, properties = {}, callbacks = {}) {
    try {
      document.dispatchEvent(new CustomEvent('horus:cart:adding'));
      await CartAPI.addItem(variantId, quantity, properties);
      const cart = await CartAPI.getCart();
      this.applyCartState(cart);
      this._broadcastUpdate(cart, 'drawer');

      if (typeof callbacks.onSuccess === 'function') callbacks.onSuccess(cart);

      if (window.HorusTheme?.cartType === 'page' && !$('[data-cart-page]')) {
        window.location.href = window.HorusTheme?.routes?.cartUrl || '/cart';
        return;
      }

      if (!$('[data-cart-page]')) {
        this.open();
      }
      toast.show('Added to cart!', 'success');
    } catch (err) {
      const msg = err.message || 'Could not add item.';
      toast.show(msg, 'error');
      if (typeof callbacks.onError === 'function') callbacks.onError(msg);
    } finally {
      if (typeof callbacks.onFinally === 'function') callbacks.onFinally();
      document.dispatchEvent(new CustomEvent('horus:cart:added'));
    }
  }

  async _loadCart() {
    try {
      const cart = await CartAPI.getCart();
      this.applyCartState(cart);
      this._broadcastUpdate(cart, 'drawer');
    } catch (err) {
      console.error('Cart load failed:', err);
    }
  }

  _renderCart(cart) {
    if (!this.body) return;
    const strings = window.HorusTheme?.strings || {};

    if (cart.item_count === 0) {
      this.body.innerHTML = `
        <div class="cart-empty animate-fade-in">
          <div class="cart-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm5.625 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
            </svg>
          </div>
          <h3>${escapeHTML(strings.cartEmpty || 'Your bag is empty')}</h3>
          <p>${escapeHTML(strings.cartEmptySubtitle || "Looks like you haven't added anything yet.")}</p>
          <button type="button" class="btn btn-gold" data-close-cart>${escapeHTML(strings.continueShopping || 'Continue Shopping')}</button>
        </div>`;
      return;
    }

    const itemsHTML = cart.items.map(item => {
      const imgUrl = item.featured_image?.url
        ? item.featured_image.url.replace(/^http:/, 'https:').split('?')[0] + '?width=144'
        : '';
      const variantLabel = item.variant_title && item.variant_title !== 'Default Title'
        ? `<p class="cart-item-variant">${escapeHTML(item.variant_title)}</p>`
        : '';
      return `
      <div class="cart-item" data-key="${escapeHTML(item.key)}">
        <div class="cart-item-img">
          <a href="${escapeHTML(item.url)}">
            ${imgUrl ? `<img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(item.title)}" width="72" height="96" loading="lazy">` : ''}
          </a>
        </div>
        <div class="cart-item-info">
          <div>
            <a href="${escapeHTML(item.url)}" class="cart-item-title">${escapeHTML(item.product_title)}</a>
            ${variantLabel}
          </div>
          <div class="cart-item-meta">
            <span class="cart-item-price">${formatMoney(item.final_line_price)}</span>
            <div class="qty-control" role="group" aria-label="Quantity for ${escapeHTML(item.product_title)}">
              <button type="button" class="qty-btn" data-action="decrease" data-key="${escapeHTML(item.key)}" data-qty="${item.quantity}" aria-label="${escapeHTML(strings.decreaseQuantity || 'Decrease quantity')}">−</button>
              <span class="qty-value" aria-label="Quantity: ${item.quantity}">${item.quantity}</span>
              <button type="button" class="qty-btn" data-action="increase" data-key="${escapeHTML(item.key)}" data-qty="${item.quantity}" aria-label="${escapeHTML(strings.increaseQuantity || 'Increase quantity')}">+</button>
            </div>
          </div>
          <button type="button" class="cart-item-remove" data-key="${escapeHTML(item.key)}">${escapeHTML(strings.remove || 'Remove')}</button>
        </div>
      </div>`;
    }).join('');

    this.body.innerHTML = `<div class="cart-items animate-fade-in">${itemsHTML}</div>`;

    // Bind qty / remove buttons
    this.body.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const item = btn.closest('.cart-item');
        if (item?.dataset.pending === 'true' || btn.disabled) return;
        const key = btn.dataset.key;
        const current = parseInt(btn.dataset.qty, 10);
        const newQty = btn.dataset.action === 'increase' ? current + 1 : current - 1;
        if (newQty < 0) return;

        const controls = item ? $$('button', item) : [btn];
        if (item) item.dataset.pending = 'true';
        controls.forEach(c => { c.disabled = true; });
        try {
          const cart = await CartAPI.updateQuantity(key, newQty);
          this.applyCartState(cart);
          this._broadcastUpdate(cart, 'drawer');
        } catch (err) {
          toast.show(err.message || 'Could not update quantity', 'error');
          if (item) delete item.dataset.pending;
          controls.forEach(c => { c.disabled = false; });
        }
      });
    });

    this.body.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const item = btn.closest('.cart-item');
        if (item?.dataset.pending === 'true' || btn.disabled) return;
        const key = btn.dataset.key;
        const controls = item ? $$('button', item) : [btn];
        if (item) {
          item.dataset.pending = 'true';
          item.style.opacity = '0.4';
          item.style.pointerEvents = 'none';
        }
        controls.forEach(c => { c.disabled = true; });
        try {
          const cart = await CartAPI.removeItem(key);
          this.applyCartState(cart);
          this._broadcastUpdate(cart, 'drawer');
        } catch (err) {
          toast.show(err.message || 'Could not remove item', 'error');
          if (item) {
            delete item.dataset.pending;
            item.style.opacity = '';
            item.style.pointerEvents = '';
          }
          controls.forEach(c => { c.disabled = false; });
        }
      });
    });
  }

  _updateCount(count) {
    $$('[data-cart-count]').forEach(el => {
      if (el.hasAttribute('data-cart-count-parens') || el.classList.contains('cart-header-count')) {
        el.textContent = count > 0 ? `(${count})` : '';
      } else {
        el.textContent = count;
        el.style.display = count > 0 ? '' : 'none';
      }
    });

    $$('[data-open-cart]').forEach(btn => {
      const label = count === 1 ? 'item' : 'items';
      btn.setAttribute('aria-label', `Open cart (${count} ${label})`);
    });
  }

  _updateSubtotal(totalPrice) {
    $$('[data-cart-subtotal]').forEach(el => {
      el.textContent = formatMoney(totalPrice);
    });
  }

  _updateShippingBar(totalPrice) {
    const threshold = this.FREE_SHIPPING_THRESHOLD;
    if (!threshold || threshold <= 0) return;

    const percent = Math.min((totalPrice / threshold) * 100, 100);
    const unlockedText = window.HorusTheme?.strings?.freeShippingUnlocked || "You've unlocked free shipping";

    $$('[data-shipping-fill]').forEach(fill => {
      fill.style.width = `${percent}%`;
    });

    $$('[data-shipping-label]').forEach(label => {
      if (totalPrice >= threshold) {
        label.innerHTML = `<span style="color:var(--color-gold)">${escapeHTML(unlockedText)}</span>`;
      } else {
        const remaining = formatMoney(threshold - totalPrice);
        label.innerHTML = `Add <strong style="color:var(--color-text)">${escapeHTML(remaining)}</strong> more for free shipping`;
      }
    });
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
   CART PAGE (Synchronized with CartDrawer)
   ============================================================ */
class CartPage {
  constructor() {
    this.root = $('[data-cart-page]');
    if (!this.root) return;

    this.form = $('[data-cart-page-form]', this.root);
    this.itemsContainer = $('[data-cart-page-items]', this.root);
    this.emptyEl = $('[data-cart-page-empty]', this.root);
    this.shippingEl = $('[data-cart-page-shipping]', this.root);
    this.countEl = $('[data-cart-page-count]', this.root);
    this.discountsEl = $('[data-cart-page-discounts]', this.root);
    this.noteInput = $('[data-cart-note]', this.root);

    this._bindEvents();
  }

  _bindEvents() {
    // Sync when CartDrawer or another component mutates the cart
    document.addEventListener('horus:cart:updated', (e) => {
      const { cart, source } = e.detail || {};
      if (!cart || source === 'page') return;
      this.render(cart);
    });

    // Delegate quantity buttons and remove links
    this.root.addEventListener('click', async (e) => {
      const qtyBtn = e.target.closest('[data-cart-page-qty-btn]');
      if (qtyBtn) {
        e.preventDefault();
        if (qtyBtn.disabled) return;
        const rowEl = qtyBtn.closest('[data-cart-page-item]');
        if (rowEl?.dataset.pending === 'true') return;
        const key = qtyBtn.dataset.key;
        const current = parseInt(qtyBtn.dataset.qty, 10) || 0;
        const newQty = qtyBtn.dataset.action === 'increase' ? current + 1 : current - 1;
        if (newQty < 0) return;
        await this._updateLine(key, newQty, rowEl);
        return;
      }

      const removeLink = e.target.closest('[data-cart-page-remove]');
      if (removeLink) {
        e.preventDefault();
        const rowEl = removeLink.closest('[data-cart-page-item]');
        if (rowEl?.dataset.pending === 'true') return;
        const key = removeLink.dataset.key;
        await this._updateLine(key, 0, rowEl);
      }
    });

    // Direct quantity input edits
    this.root.addEventListener('change', async (e) => {
      const input = e.target.closest('[data-cart-page-qty-input]');
      if (!input || input.disabled) return;
      const rowEl = input.closest('[data-cart-page-item]');
      if (rowEl?.dataset.pending === 'true') return;
      const key = input.dataset.key;
      const fallbackQty = parseInt(input.dataset.lastQty, 10) || 1;
      const parsed = parseInt(input.value, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        input.value = String(fallbackQty);
        return;
      }
      input.value = String(parsed);
      await this._updateLine(key, parsed, rowEl, input);
    });

    // Debounced order note persistence via Shopify /cart/update.js
    if (this.noteInput) {
      const saveNote = debounce(async () => {
        try {
          const cart = await CartAPI.updateNote(this.noteInput.value);
          document.dispatchEvent(new CustomEvent('horus:cart:updated', {
            detail: { cart, source: 'page' },
          }));
        } catch (err) {
          toast.show(err.message || 'Could not save order note', 'error');
        }
      }, 500);
      this.noteInput.addEventListener('input', saveNote);
    }
  }

  async _updateLine(key, quantity, rowEl, sourceInput = null) {
    if (rowEl?.dataset.pending === 'true') return;
    const controls = rowEl ? $$('button, input', rowEl) : [];
    const removeEl = rowEl?.querySelector('[data-cart-page-remove]');
    if (rowEl) {
      rowEl.dataset.pending = 'true';
      rowEl.style.opacity = '0.45';
      rowEl.style.pointerEvents = 'none';
    }
    controls.forEach(c => { c.disabled = true; });
    removeEl?.setAttribute('aria-disabled', 'true');

    try {
      const cart = await CartAPI.updateQuantity(key, quantity);
      this.render(cart);
      document.dispatchEvent(new CustomEvent('horus:cart:updated', {
        detail: { cart, source: 'page' },
      }));
    } catch (err) {
      toast.show(err.message || 'Could not update cart', 'error');
      const qtyInput = sourceInput || rowEl?.querySelector('[data-cart-page-qty-input]');
      if (qtyInput && qtyInput.dataset.lastQty !== undefined) {
        qtyInput.value = qtyInput.dataset.lastQty;
      }
      if (rowEl) {
        delete rowEl.dataset.pending;
        rowEl.style.opacity = '';
        rowEl.style.pointerEvents = '';
      }
      controls.forEach(c => { c.disabled = false; });
      removeEl?.removeAttribute('aria-disabled');
    }
  }

  render(cart) {
    const isEmpty = cart.item_count === 0;
    const strings = window.HorusTheme?.strings || {};

    if (this.emptyEl) this.emptyEl.hidden = !isEmpty;
    if (this.form) this.form.hidden = isEmpty;
    if (this.shippingEl) this.shippingEl.hidden = isEmpty;

    if (this.countEl) {
      const unit = cart.item_count === 1 ? 'item' : 'items';
      this.countEl.textContent = cart.item_count > 0 ? `(${cart.item_count} ${unit})` : '';
    }

    if (this.noteInput && typeof cart.note === 'string' && document.activeElement !== this.noteInput) {
      this.noteInput.value = cart.note;
    }

    if (this.discountsEl) {
      const discounts = cart.cart_level_discount_applications || [];
      if (discounts.length > 0) {
        this.discountsEl.hidden = false;
        this.discountsEl.innerHTML = discounts.map(d => `
          <div class="cart-summary-discount-row">
            <span>${escapeHTML(d.title)}</span>
            <span>-${formatMoney(d.total_allocated_amount)}</span>
          </div>`).join('');
      } else {
        this.discountsEl.hidden = true;
        this.discountsEl.innerHTML = '';
      }
    }

    if (!this.itemsContainer || isEmpty) {
      if (this.itemsContainer) this.itemsContainer.innerHTML = '';
      return;
    }

    this.itemsContainer.innerHTML = cart.items.map(item => {
      const imgUrl = item.featured_image?.url
        ? item.featured_image.url.replace(/^http:/, 'https:').split('?')[0] + '?width=240'
        : '';
      const variantHTML = item.variant_title && item.variant_title !== 'Default Title'
        ? `<p class="cart-item-variant">${escapeHTML(item.variant_title)}</p>`
        : '';
      const sellingPlanHTML = item.selling_plan_allocation?.selling_plan?.name
        ? `<p class="cart-item-variant">${escapeHTML(item.selling_plan_allocation.selling_plan.name)}</p>`
        : '';

      const propsEntries = Object.entries(item.properties || {}).filter(([k, v]) => v && !k.startsWith('_'));
      const propsHTML = propsEntries.length
        ? `<dl class="cart-page-item-props">${propsEntries.map(([k, v]) =>
            `<div><dt>${escapeHTML(k)}:</dt><dd>${escapeHTML(v)}</dd></div>`).join('')}</dl>`
        : '';

      const unitCompare = item.original_price !== item.final_price
        ? `<span class="card-price-compare">${formatMoney(item.original_price)}</span>`
        : '';
      const lineCompare = item.original_line_price !== item.final_line_price
        ? `<span class="card-price-compare">${formatMoney(item.original_line_price)}</span>`
        : '';

      const discountsHTML = (item.line_level_discount_allocations || []).length
        ? `<ul class="cart-page-discounts">${item.line_level_discount_allocations.map(d =>
            `<li class="cart-page-discount-tag">${escapeHTML(d.discount_application.title)} (-${formatMoney(d.amount)})</li>`).join('')}</ul>`
        : '';

      const removeUrl = `${window.HorusTheme?.routes?.cartChangeUrl || '/cart/change'}?id=${encodeURIComponent(item.key)}&quantity=0`;

      return `
        <div class="cart-page-item" data-cart-page-item data-key="${escapeHTML(item.key)}">
          <div class="cart-page-item-product">
            <a href="${escapeHTML(item.url)}" class="cart-page-item-img">
              ${imgUrl
                ? `<img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(item.product_title)}" width="120" height="160" loading="lazy">`
                : '<span class="cart-page-no-img">No Image</span>'}
            </a>
            <div class="cart-page-item-details">
              <a href="${escapeHTML(item.url)}" class="cart-page-item-title">${escapeHTML(item.product_title)}</a>
              ${variantHTML}
              ${sellingPlanHTML}
              ${propsHTML}
              <div class="cart-page-item-unit-price">
                ${unitCompare}
                <span>${formatMoney(item.final_price)}</span>
              </div>
              ${discountsHTML}
            </div>
          </div>

          <div class="cart-page-item-qty">
            <div class="qty-control cart-page-qty-control" role="group" aria-label="Quantity">
              <button type="button" class="qty-btn" data-cart-page-qty-btn data-action="decrease" data-key="${escapeHTML(item.key)}" data-qty="${item.quantity}" aria-label="${escapeHTML(strings.decreaseQuantity || 'Decrease quantity')}">−</button>
              <label for="updates_${escapeHTML(item.key)}" class="sr-only">Quantity</label>
              <input type="number" name="updates[]" id="updates_${escapeHTML(item.key)}" class="cart-page-qty-input" value="${item.quantity}" min="0" inputmode="numeric" data-cart-page-qty-input data-key="${escapeHTML(item.key)}" data-last-qty="${item.quantity}">
              <button type="button" class="qty-btn" data-cart-page-qty-btn data-action="increase" data-key="${escapeHTML(item.key)}" data-qty="${item.quantity}" aria-label="${escapeHTML(strings.increaseQuantity || 'Increase quantity')}">+</button>
            </div>
            <a href="${escapeHTML(removeUrl)}" class="cart-item-remove" data-cart-page-remove data-key="${escapeHTML(item.key)}">${escapeHTML(strings.remove || 'Remove')}</a>
          </div>

          <div class="cart-page-item-total">
            ${lineCompare}
            <span class="cart-page-line-price">${formatMoney(item.final_line_price)}</span>
          </div>
        </div>`;
    }).join('');
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
    this.tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    activeTab.classList.add('active');
    activeTab.setAttribute('aria-selected', 'true');
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
   PRODUCT CARD — Quick Add, Size Pills & Color Swatches
   ============================================================ */
class ProductCards {
  constructor() {
    this._bindAddToCart();
    this._bindSizePills();
    this._bindColorSwatches();
    this._bindWishlistGuard();
    this._bindImageSwap();
  }

  _updateCardPrice(card, price, comparePrice) {
    if (!card || price === undefined || price === '') return;
    const priceNum = Number(price);
    if (Number.isNaN(priceNum)) return;

    const priceEl = card.querySelector('.card-price');
    if (priceEl) priceEl.textContent = formatMoney(priceNum);

    const compareEl = card.querySelector('.card-price-compare');
    if (compareEl) {
      const compareNum = comparePrice ? Number(comparePrice) : 0;
      if (compareNum > priceNum) {
        const formatted = formatMoney(compareNum);
        compareEl.textContent = formatted;
        compareEl.hidden = false;
        compareEl.style.display = '';
        compareEl.setAttribute('aria-label', `Was ${formatted}`);
      } else {
        compareEl.textContent = '';
        compareEl.hidden = true;
        compareEl.removeAttribute('aria-label');
      }
    }
  }

  _bindAddToCart() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-to-cart]');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      if (btn.disabled || btn.classList.contains('loading')) return;

      const card = btn.closest('.product-card');
      const selectedPill = card?.querySelector('.size-pill.selected:not([hidden])');
      const variantId = selectedPill?.dataset.variantId || btn.dataset.variantId;

      if (!variantId) {
        toast.show('Please select an available option', 'error');
        return;
      }

      btn.classList.add('loading');
      btn.setAttribute('aria-busy', 'true');
      const detail = {
        variantId,
        quantity: 1,
        onFinally: () => {
          btn.classList.remove('loading');
          btn.removeAttribute('aria-busy');
        },
      };
      document.dispatchEvent(new CustomEvent('horus:cart:add', { detail }));
      if (!detail.handled) {
        detail.onFinally();
      }
    });
  }

  _bindSizePills() {
    document.addEventListener('click', (e) => {
      const pill = e.target.closest('.size-pill');
      if (!pill) return;

      e.preventDefault();
      e.stopPropagation();

      if (pill.classList.contains('unavailable') || pill.disabled) return;

      const group = pill.closest('.quick-add-sizes');
      if (!group) return;
      $$('.size-pill', group).forEach(p => {
        p.classList.remove('selected');
        p.setAttribute('aria-pressed', 'false');
      });
      pill.classList.add('selected');
      pill.setAttribute('aria-pressed', 'true');

      const card = pill.closest('.product-card');
      const btn = card?.querySelector('[data-add-to-cart]');
      if (btn && pill.dataset.variantId) {
        btn.dataset.variantId = pill.dataset.variantId;
        btn.disabled = false;
        btn.removeAttribute('aria-disabled');
        const textEl = btn.querySelector('.btn-text');
        if (textEl) textEl.textContent = window.HorusTheme?.strings?.addToCart || 'Add to Cart';
      }

      this._updateCardPrice(card, pill.dataset.variantPrice, pill.dataset.variantCompare);
    });
  }

  _bindColorSwatches() {
    document.addEventListener('click', (e) => {
      const swatch = e.target.closest('.card-swatches .swatch');
      if (!swatch) return;

      e.preventDefault();
      e.stopPropagation();

      const card = swatch.closest('.product-card');
      if (!card) return;

      const color = swatch.dataset.color;
      $$('.card-swatches .swatch', card).forEach(s => {
        s.classList.remove('active');
        s.setAttribute('aria-pressed', 'false');
      });
      swatch.classList.add('active');
      swatch.setAttribute('aria-pressed', 'true');

      // Swap primary card image if variant has a featured image (or restore default)
      const img = card.querySelector('.card-img');
      if (img) {
        if (!img.dataset.defaultSrc && img.src) {
          img.dataset.defaultSrc = img.src;
        }
        if (swatch.dataset.variantImg) {
          img.src = swatch.dataset.variantImg;
          img.removeAttribute('srcset');
        } else if (img.dataset.defaultSrc) {
          img.src = img.dataset.defaultSrc;
        }
      }

      // Filter size pills to the selected color if multi-option
      const pills = $$('.size-pill[data-option-color]', card);
      const addBtn = card.querySelector('[data-add-to-cart]');
      const strings = window.HorusTheme?.strings || {};

      if (pills.length && color) {
        let firstAvailable = null;
        let firstMatching = null;
        pills.forEach(p => {
          const match = p.dataset.optionColor === color;
          p.hidden = !match;
          p.classList.remove('selected');
          p.setAttribute('aria-pressed', 'false');
          if (match) {
            if (!firstMatching) firstMatching = p;
            if (!p.disabled && !p.classList.contains('unavailable') && !firstAvailable) {
              firstAvailable = p;
            }
          }
        });

        const priceSource = firstAvailable || firstMatching;
        if (priceSource) {
          this._updateCardPrice(card, priceSource.dataset.variantPrice, priceSource.dataset.variantCompare);
        }

        if (firstAvailable && addBtn) {
          firstAvailable.classList.add('selected');
          firstAvailable.setAttribute('aria-pressed', 'true');
          addBtn.dataset.variantId = firstAvailable.dataset.variantId;
          addBtn.disabled = false;
          addBtn.removeAttribute('aria-disabled');
          const textEl = addBtn.querySelector('.btn-text');
          if (textEl) textEl.textContent = strings.addToCart || 'Add to Cart';
        } else if (addBtn) {
          addBtn.dataset.variantId = '';
          addBtn.disabled = true;
          addBtn.setAttribute('aria-disabled', 'true');
          const textEl = addBtn.querySelector('.btn-text');
          if (textEl) textEl.textContent = strings.soldOut || 'Sold Out';
        }
      } else {
        // Color-only product: use swatch variant availability and price directly
        const isAvailable = swatch.dataset.variantAvailable !== 'false';
        this._updateCardPrice(card, swatch.dataset.variantPrice, swatch.dataset.variantCompare);

        if (addBtn) {
          addBtn.dataset.variantId = isAvailable ? (swatch.dataset.variantId || '') : '';
          addBtn.disabled = !isAvailable;
          addBtn.setAttribute('aria-disabled', String(!isAvailable));
          const textEl = addBtn.querySelector('.btn-text');
          if (textEl) {
            textEl.textContent = isAvailable
              ? (strings.addToCart || 'Add to Cart')
              : (strings.soldOut || 'Sold Out');
          }
        }
      }
    });
  }

  _bindWishlistGuard() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.card-wishlist');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
    });
  }

  _bindImageSwap() {
    // Touch-based image swap for mobile (only when touching the image link)
    document.addEventListener('touchstart', (e) => {
      const link = e.target.closest('.card-image-link');
      if (!link) return;
      const hoverImg = link.querySelector('.card-img-hover');
      if (hoverImg) hoverImg.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const link = e.target.closest('.card-image-link');
      if (!link) return;
      const hoverImg = link.querySelector('.card-img-hover');
      if (hoverImg) setTimeout(() => { hoverImg.style.opacity = ''; }, 300);
    }, { passive: true });
  }
}

/* ============================================================
   PRODUCT DETAIL PAGE (PDP) — Gallery, Variants, Quantity, ATC
   ============================================================ */
class ProductPage {
  constructor() {
    this.section = $('[data-product-section]');
    if (!this.section) return;

    this.form = $('[data-product-form]', this.section);
    this.variantInput = $('[data-variant-id-input]', this.section);
    this.submitBtn = $('[data-pdp-submit]', this.section);
    this.submitText = $('[data-pdp-submit-text]', this.section);
    this.errorEl = $('[data-pdp-error]', this.section);
    this.priceEl = $('[data-pdp-price]', this.section);
    this.compareEl = $('[data-pdp-compare-price]', this.section);
    this.saleBadgeEl = $('[data-pdp-sale-badge]', this.section);
    this.availabilityEl = $('[data-pdp-availability]', this.section);
    this.skuWrapEl = $('[data-pdp-sku]', this.section);
    this.skuValEl = $('[data-pdp-sku-value]', this.section);
    this.dynamicCheckoutEl = $('[data-pdp-dynamic-checkout]', this.section);
    this.qtyInput = $('[data-pdp-qty-input]', this.section);

    this.slides = $$('.pdp-media-slide', this.section);
    this.thumbs = $$('[data-gallery-thumb]', this.section);
    this.currentSlideIndex = Math.max(0, this.slides.findIndex(s => s.classList.contains('is-active')));

    this.variants = this._parseVariants();

    this._bindGallery();
    this._bindVariants();
    this._bindQuantity();
    this._bindFormSubmit();
    this._bindShare();

    if (this.variants.length) {
      this._updateOptionAvailability();
    }
  }

  _parseVariants() {
    const jsonEl = $('[data-product-variants]', this.section);
    if (!jsonEl) return [];
    try {
      return JSON.parse(jsonEl.textContent);
    } catch {
      return [];
    }
  }

  _bindGallery() {
    if (!this.slides.length) return;

    this.thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.dataset.mediaIndex, 10);
        if (!Number.isNaN(idx)) this.showSlide(idx);
      });
    });

    const prevBtn = $('[data-gallery-prev]', this.section);
    const nextBtn = $('[data-gallery-next]', this.section);
    prevBtn?.addEventListener('click', () => {
      const nextIdx = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
      this.showSlide(nextIdx);
    });
    nextBtn?.addEventListener('click', () => {
      const nextIdx = (this.currentSlideIndex + 1) % this.slides.length;
      this.showSlide(nextIdx);
    });
  }

  showSlide(index) {
    if (!this.slides.length || index < 0 || index >= this.slides.length) return;
    this.currentSlideIndex = index;

    this.slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.hidden = !active;
    });

    this.thumbs.forEach((thumb, i) => {
      const active = i === index;
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  showMediaById(mediaId) {
    if (!mediaId || !this.slides.length) return;
    const idx = this.slides.findIndex(s => String(s.dataset.mediaId) === String(mediaId));
    if (idx !== -1) this.showSlide(idx);
  }

  _getSelectedOptions() {
    const groups = $$('[data-option-index]', this.section);
    return groups.map(group => {
      const checked = group.querySelector('[data-option-input]:checked');
      return checked ? checked.value : null;
    });
  }

  _findVariant(selectedOptions) {
    return this.variants.find(v =>
      selectedOptions.every((opt, idx) => v.options[idx] === opt)
    ) || null;
  }

  _bindVariants() {
    const inputs = $$('[data-option-input]', this.section);
    if (!inputs.length) return;

    inputs.forEach(input => {
      input.addEventListener('change', () => {
        const pos = input.dataset.optionPosition;
        const selectedLabel = $(`[data-option-selected-value="${pos}"]`, this.section);
        if (selectedLabel) selectedLabel.textContent = input.value;

        const selectedOptions = this._getSelectedOptions();
        const variant = this._findVariant(selectedOptions);
        this._applyVariant(variant);
        this._updateOptionAvailability();
      });
    });
  }

  _updateOptionAvailability() {
    const selectedOptions = this._getSelectedOptions();
    const groups = $$('[data-option-index]', this.section);

    groups.forEach((group, groupIdx) => {
      $$('[data-option-input]', group).forEach(input => {
        let isAvailable = false;
        if (groupIdx === 0) {
          // Primary option (e.g., Color): available if any variant with this value is in stock
          isAvailable = this.variants.some(v => v.options[0] === input.value && v.available);
        } else if (groupIdx === groups.length - 1) {
          // Leaf option (e.g., Size): check exact combination with currently selected options
          const testOptions = [...selectedOptions];
          testOptions[groupIdx] = input.value;
          const match = this._findVariant(testOptions);
          isAvailable = Boolean(match && match.available);
        } else {
          // Intermediate option (3-option products): available if any variant matches upstream + this value
          isAvailable = this.variants.some(v =>
            v.available &&
            v.options[groupIdx] === input.value &&
            selectedOptions.slice(0, groupIdx).every((opt, idx) => v.options[idx] === opt)
          );
        }

        const label = group.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        if (label) {
          label.classList.toggle('is-soldout', !isAvailable);
        }
      });
    });
  }

  _applyVariant(variant) {
    const strings = window.HorusTheme?.strings || {};
    this._clearError();

    if (!variant) {
      if (this.variantInput) this.variantInput.value = '';
      if (this.submitBtn) {
        this.submitBtn.disabled = true;
        this.submitBtn.setAttribute('aria-disabled', 'true');
      }
      if (this.submitText) this.submitText.textContent = strings.unavailable || 'Unavailable';
      if (this.availabilityEl) {
        this.availabilityEl.textContent = strings.unavailable || 'Unavailable';
        this.availabilityEl.classList.remove('is-available');
        this.availabilityEl.classList.add('is-soldout');
      }
      if (this.dynamicCheckoutEl) this.dynamicCheckoutEl.hidden = true;
      return;
    }

    if (this.variantInput) this.variantInput.value = variant.id;

    // Update URL ?variant=<id> without reloading
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    } catch { /* ignore history errors in sandboxed frames */ }

    // Price & Sale badge
    if (this.priceEl) this.priceEl.textContent = formatMoney(variant.price);
    const onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
    if (this.compareEl) {
      this.compareEl.hidden = !onSale;
      this.compareEl.textContent = onSale ? formatMoney(variant.compare_at_price) : '';
    }
    if (this.saleBadgeEl) {
      this.saleBadgeEl.hidden = !onSale;
      if (onSale) {
        const pct = Math.round(((variant.compare_at_price - variant.price) * 100) / variant.compare_at_price);
        this.saleBadgeEl.textContent = `-${pct}%`;
      }
    }

    // SKU
    if (this.skuWrapEl && this.skuValEl) {
      this.skuWrapEl.hidden = !variant.sku;
      this.skuValEl.textContent = variant.sku || '';
    }

    // Availability & Button state
    if (this.availabilityEl) {
      this.availabilityEl.textContent = variant.available
        ? (strings.inStock || 'In Stock')
        : (strings.outOfStock || 'Out of Stock');
      this.availabilityEl.classList.toggle('is-available', variant.available);
      this.availabilityEl.classList.toggle('is-soldout', !variant.available);
    }

    if (this.submitBtn) {
      this.submitBtn.disabled = !variant.available;
      this.submitBtn.setAttribute('aria-disabled', String(!variant.available));
    }
    if (this.submitText) {
      this.submitText.textContent = variant.available
        ? (strings.addToCart || 'Add to Cart')
        : (strings.soldOut || 'Sold Out');
    }
    if (this.dynamicCheckoutEl) {
      this.dynamicCheckoutEl.hidden = !variant.available;
    }

    // Quantity max constraint from Shopify inventory if strictly tracked
    if (this.qtyInput) {
      if (variant.inventory_management === 'shopify' && variant.inventory_policy === 'deny' && variant.inventory_quantity > 0) {
        this.qtyInput.max = String(variant.inventory_quantity);
        if (parseInt(this.qtyInput.value, 10) > variant.inventory_quantity) {
          this.qtyInput.value = String(variant.inventory_quantity);
        }
      } else {
        this.qtyInput.removeAttribute('max');
      }
    }

    // Switch gallery to variant's featured media
    if (variant.featured_media_id) {
      this.showMediaById(variant.featured_media_id);
    }
  }

  _bindQuantity() {
    if (!this.qtyInput) return;
    const decBtn = $('[data-qty-decrease]', this.section);
    const incBtn = $('[data-qty-increase]', this.section);

    const clamp = (val) => {
      const min = parseInt(this.qtyInput.min, 10) || 1;
      const max = this.qtyInput.max ? parseInt(this.qtyInput.max, 10) : Infinity;
      return Math.min(max, Math.max(min, val));
    };

    decBtn?.addEventListener('click', () => {
      const current = parseInt(this.qtyInput.value, 10) || 1;
      this.qtyInput.value = clamp(current - 1);
    });

    incBtn?.addEventListener('click', () => {
      const current = parseInt(this.qtyInput.value, 10) || 1;
      this.qtyInput.value = clamp(current + 1);
    });

    this.qtyInput.addEventListener('change', () => {
      const parsed = parseInt(this.qtyInput.value, 10);
      this.qtyInput.value = clamp(Number.isNaN(parsed) ? 1 : parsed);
    });
  }

  _showError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  _clearError() {
    if (!this.errorEl) return;
    this.errorEl.textContent = '';
    this.errorEl.hidden = true;
  }

  _bindFormSubmit() {
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.submitBtn || this.submitBtn.disabled || this.submitBtn.classList.contains('loading')) return;

      const variantId = this.variantInput?.value;
      const quantity = Math.max(1, parseInt(this.qtyInput?.value, 10) || 1);

      if (!variantId) {
        this._showError('Please select an available variant.');
        return;
      }

      this._clearError();
      this.submitBtn.classList.add('loading');
      this.submitBtn.setAttribute('aria-busy', 'true');

      const detail = {
        variantId,
        quantity,
        onError: (msg) => this._showError(msg),
        onFinally: () => {
          this.submitBtn?.classList.remove('loading');
          this.submitBtn?.removeAttribute('aria-busy');
        },
      };
      document.dispatchEvent(new CustomEvent('horus:cart:add', { detail }));
      if (!detail.handled) {
        detail.onFinally();
      }
    });
  }

  _bindShare() {
    const shareBtn = $('[data-pdp-share]', this.section);
    if (!shareBtn) return;

    shareBtn.addEventListener('click', async () => {
      const url = shareBtn.dataset.shareUrl || window.location.href;
      const title = shareBtn.dataset.shareTitle || document.title;

      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch { /* user cancelled share */ }
        return;
      }

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          toast.show(window.HorusTheme?.strings?.linkCopied || 'Link copied to clipboard', 'success');
        } catch {
          toast.show(url, 'success');
        }
      }
    });
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
    let isDown = false, startX = 0, scrollLeft = 0, hasDragged = false;

    el.addEventListener('mousedown', (e) => {
      isDown = true;
      hasDragged = false;
      el.style.cursor = 'grabbing';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });
    el.addEventListener('mouseleave', () => { isDown = false; el.style.cursor = ''; });
    el.addEventListener('mouseup',    () => { isDown = false; el.style.cursor = ''; });
    el.addEventListener('mousemove',  (e) => {
      if (!isDown) return;
      const dx = e.pageX - el.offsetLeft - startX;
      if (Math.abs(dx) > 6) hasDragged = true;
      if (!hasDragged) return;
      e.preventDefault();
      el.scrollLeft = scrollLeft - dx * 1.2;
    });
    el.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        hasDragged = false;
      }
    }, true);
  }
}

/* ============================================================
   COLLECTION & SEARCH FACETS (Native Shopify Filters & Sort)
   ============================================================ */
class CollectionFacets {
  constructor() {
    this.wrappers = $$('[data-facets-wrapper]');
    if (!this.wrappers.length) return;
    this.wrappers.forEach(wrapper => this._init(wrapper));
  }

  _init(wrapper) {
    const desktopForm = $('[data-facets-form]', wrapper);
    const mobileForm = $('[data-facets-mobile-form]', wrapper);
    const dropdowns = $$('[data-facet-dropdown]', wrapper);
    const openBtn = $('[data-facets-open]', wrapper);
    const closeBtn = $('[data-facets-close]', wrapper);
    const drawer = $('[data-facets-drawer]', wrapper);
    const overlay = $('[data-facets-overlay]', wrapper);

    // Desktop dropdown toggle coordination
    dropdowns.forEach(dd => {
      dd.addEventListener('toggle', () => {
        if (!dd.open) return;
        dropdowns.forEach(other => {
          if (other !== dd && other.open) other.open = false;
        });
      });
    });

    document.addEventListener('click', (e) => {
      dropdowns.forEach(dd => {
        if (dd.open && !dd.contains(e.target)) dd.open = false;
      });
    });

    // Desktop filter checkbox & sort auto-submit with clean query parameters
    if (desktopForm) {
      desktopForm.addEventListener('change', (e) => {
        if (e.target.matches('[data-facet-input], [data-facets-sort]')) {
          this._submitClean(desktopForm);
        }
      });

      desktopForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this._submitClean(desktopForm);
      });
    }

    if (mobileForm) {
      mobileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this._submitClean(mobileForm);
      });
    }

    // Mobile Filter Drawer open/close + focus management
    const openDrawer = () => {
      if (!drawer) return;
      drawer.classList.add('active');
      overlay?.classList.add('active');
      document.body.classList.add('drawer-open');
      drawer.setAttribute('aria-hidden', 'false');
      openBtn?.setAttribute('aria-expanded', 'true');
      closeBtn?.focus();
    };

    const closeDrawer = () => {
      if (!drawer || !drawer.classList.contains('active')) return;
      drawer.classList.remove('active');
      overlay?.classList.remove('active');
      document.body.classList.remove('drawer-open');
      drawer.setAttribute('aria-hidden', 'true');
      openBtn?.setAttribute('aria-expanded', 'false');
      openBtn?.focus();
    };

    openBtn?.addEventListener('click', openDrawer);
    closeBtn?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      dropdowns.forEach(dd => { if (dd.open) dd.open = false; });
      if (drawer?.classList.contains('active')) closeDrawer();
    });
  }

  _buildCleanUrl(form) {
    const action = form.getAttribute('action') || window.location.pathname;
    const params = new URLSearchParams();
    const formData = new FormData(form);

    for (const [key, rawVal] of formData.entries()) {
      const value = String(rawVal).trim();
      if (!value) continue;
      params.append(key, value);
    }

    const qs = params.toString();
    return qs ? `${action}?${qs}` : action;
  }

  _submitClean(form) {
    window.location.assign(this._buildCleanUrl(form));
  }
}

/* ============================================================
   PREDICTIVE SEARCH OVERLAY (Shopify Native Suggest API)
   ============================================================ */
class PredictiveSearch {
  constructor() {
    this.drawer = $('[data-search-drawer]');
    if (!this.drawer || window.HorusTheme?.enablePredictiveSearch === false) return;

    this.overlay = $('[data-search-overlay]');
    this.input = $('[data-predictive-search-input]', this.drawer);
    this.clearBtn = $('[data-search-clear]', this.drawer);
    this.closeBtn = $('[data-search-close]', this.drawer);
    this.resultsEl = $('[data-predictive-search-results]', this.drawer);
    this.form = $('[data-predictive-search-form]', this.drawer);
    this.lastTrigger = null;
    this.abortController = null;
    this.focusedIndex = -1;

    this._bindEvents();
  }

  _bindEvents() {
    const searchUrl = window.HorusTheme?.routes?.searchUrl || '/search';

    // Intercept header search icon click while keeping native <a> fallback
    document.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const trigger = e.target.closest(`[data-open-search], header a[href="${searchUrl}"]`);
      if (!trigger) return;
      e.preventDefault();
      this.open(trigger);
    });

    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());

    this.clearBtn?.addEventListener('click', () => {
      if (!this.input) return;
      this.input.value = '';
      this.clearBtn.hidden = true;
      this._resetResults();
      this.input.focus();
    });

    const debouncedSearch = debounce((query) => this._fetchResults(query), 250);

    this.input?.addEventListener('input', () => {
      const query = this.input.value.trim();
      if (this.clearBtn) this.clearBtn.hidden = !query;
      if (query.length < 2) {
        this._abortPending();
        this._resetResults();
        return;
      }
      this._renderLoading();
      debouncedSearch(query);
    });

    // Keyboard navigation (Escape, ArrowDown, ArrowUp)
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = $$('[data-predictive-item]', this.resultsEl);
        if (!items.length) return;
        e.preventDefault();

        if (e.key === 'ArrowDown') {
          this.focusedIndex = (this.focusedIndex + 1) % items.length;
        } else {
          this.focusedIndex = this.focusedIndex <= 0 ? items.length - 1 : this.focusedIndex - 1;
        }

        items.forEach((item, idx) => item.classList.toggle('is-focused', idx === this.focusedIndex));
        items[this.focusedIndex]?.focus();
      }
    });
  }

  get isOpen() {
    return this.drawer?.classList.contains('active');
  }

  open(trigger = null) {
    this.lastTrigger = trigger || document.activeElement;
    this.drawer.classList.add('active');
    this.overlay?.classList.add('active');
    document.body.classList.add('drawer-open');
    this.drawer.setAttribute('aria-hidden', 'false');
    setTimeout(() => this.input?.focus(), 50);
  }

  close() {
    if (!this.isOpen) return;
    this._abortPending();
    this.drawer.classList.remove('active');
    this.overlay?.classList.remove('active');
    document.body.classList.remove('drawer-open');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.input?.setAttribute('aria-expanded', 'false');
    if (this.lastTrigger && typeof this.lastTrigger.focus === 'function') {
      this.lastTrigger.focus();
    }
  }

  _abortPending() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  _resetResults() {
    this.focusedIndex = -1;
    if (this.resultsEl) {
      this.resultsEl.innerHTML = '';
      this.resultsEl.hidden = true;
    }
    this.input?.setAttribute('aria-expanded', 'false');
  }

  _renderLoading() {
    if (!this.resultsEl) return;
    const loadingText = window.HorusTheme?.strings?.searchLoading || 'Searching...';
    this.resultsEl.hidden = false;
    this.resultsEl.innerHTML = `
      <div class="predictive-search-status">
        <span class="spinner" aria-hidden="true"></span>
        <span>${escapeHTML(loadingText)}</span>
      </div>`;
    this.input?.setAttribute('aria-expanded', 'true');
  }

  _priceToCents(raw) {
    if (raw === null || raw === undefined || raw === '') return 0;
    const str = String(raw).trim();
    if (str.includes('.')) {
      return Math.round(parseFloat(str) * 100);
    }
    const num = Number(str);
    return Number.isNaN(num) ? 0 : Math.round(num * 100);
  }

  _buildSuggestUrl(query) {
    const base = window.HorusTheme?.routes?.predictiveSearchUrl || '/search/suggest';
    const cfg = window.HorusPredictiveSearch?.resources || {};
    const types = Array.isArray(cfg.type) ? cfg.type.join(',') : 'product,collection';
    const limit = cfg.limit || 4;
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('resources[type]', types);
    params.set('resources[limit]', String(limit));
    params.set('resources[options][unavailable_products]', cfg.options?.unavailable_products || 'last');
    if (Array.isArray(cfg.options?.fields) && cfg.options.fields.length) {
      params.set('resources[options][fields]', cfg.options.fields.join(','));
    }
    return `${base}.json?${params.toString()}`;
  }

  async _fetchResults(query) {
    this._abortPending();
    if (typeof AbortController !== 'undefined') {
      this.abortController = new AbortController();
    }

    try {
      const res = await fetch(this._buildSuggestUrl(query), {
        headers: { 'Accept': 'application/json' },
        signal: this.abortController?.signal,
      });
      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();
      this._renderResults(query, data?.resources?.results || {});
    } catch (err) {
      if (err?.name === 'AbortError') return;
      this._renderError(query);
    }
  }

  _renderResults(query, results) {
    if (!this.resultsEl) return;
    const strings = window.HorusTheme?.strings || {};
    const searchUrl = window.HorusTheme?.routes?.searchUrl || '/search';
    const fullSearchUrl = `${searchUrl}?q=${encodeURIComponent(query)}&options%5Bprefix%5D=last`;
    const products = Array.isArray(results.products) ? results.products : [];
    const collections = Array.isArray(results.collections) ? results.collections : [];

    this.focusedIndex = -1;
    this.resultsEl.hidden = false;
    this.input?.setAttribute('aria-expanded', 'true');

    if (!products.length && !collections.length) {
      this.resultsEl.innerHTML = `
        <div class="predictive-search-status">
          <span>No results found for &ldquo;${escapeHTML(query)}&rdquo;</span>
        </div>
        <div class="predictive-search-footer">
          <a href="${escapeHTML(fullSearchUrl)}" class="btn btn-outline predictive-search-view-all" data-predictive-item role="option">
            View all results for &ldquo;${escapeHTML(query)}&rdquo;
          </a>
        </div>`;
      return;
    }

    let html = '';

    if (collections.length) {
      html += `
        <div class="predictive-search-group">
          <h3 class="predictive-search-heading">${escapeHTML(strings.searchCollections || 'Collections')}</h3>
          <div class="predictive-search-collections">
            ${collections.map(col => `
              <a href="${escapeHTML(col.url)}" class="predictive-search-pill" data-predictive-item role="option">
                ${escapeHTML(col.title)}
              </a>`).join('')}
          </div>
        </div>`;
    }

    if (products.length) {
      html += `
        <div class="predictive-search-group">
          <h3 class="predictive-search-heading">${escapeHTML(strings.searchProducts || 'Products')}</h3>
          <div class="predictive-search-products">
            ${products.map(prod => {
              const rawImg = prod.featured_image?.url || prod.image || '';
              const imgUrl = rawImg ? rawImg.replace(/^http:/, 'https:').split('?')[0] + '?width=140' : '';
              const priceCents = this._priceToCents(prod.price);
              const compareCents = this._priceToCents(prod.compare_at_price_max);
              const compareHtml = compareCents > priceCents
                ? `<span class="card-price-compare">${formatMoney(compareCents)}</span>`
                : '';
              return `
                <a href="${escapeHTML(prod.url)}" class="predictive-search-item" data-predictive-item role="option">
                  <span class="predictive-search-thumb">
                    ${imgUrl
                      ? `<img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(prod.title)}" width="56" height="75" loading="lazy">`
                      : escapeHTML(strings.searchNoImage || 'No Image')}
                  </span>
                  <span class="predictive-search-meta">
                    <span class="predictive-search-title">${escapeHTML(prod.title)}</span>
                    <span class="predictive-search-price-row">
                      <span class="predictive-search-price">${formatMoney(priceCents)}</span>
                      ${compareHtml}
                    </span>
                  </span>
                </a>`;
            }).join('')}
          </div>
        </div>`;
    }

    html += `
      <div class="predictive-search-footer">
        <a href="${escapeHTML(fullSearchUrl)}" class="btn btn-gold predictive-search-view-all" data-predictive-item role="option">
          View all results for &ldquo;${escapeHTML(query)}&rdquo; →
        </a>
      </div>`;

    this.resultsEl.innerHTML = html;
  }

  _renderError(query) {
    if (!this.resultsEl) return;
    const strings = window.HorusTheme?.strings || {};
    const searchUrl = window.HorusTheme?.routes?.searchUrl || '/search';
    const fullSearchUrl = `${searchUrl}?q=${encodeURIComponent(query)}&options%5Bprefix%5D=last`;
    this.resultsEl.hidden = false;
    this.input?.setAttribute('aria-expanded', 'true');
    this.resultsEl.innerHTML = `
      <div class="predictive-search-status">
        <span>${escapeHTML(strings.searchError || 'Search is temporarily unavailable. Press Enter to view search results.')}</span>
      </div>
      <div class="predictive-search-footer">
        <a href="${escapeHTML(fullSearchUrl)}" class="btn btn-outline predictive-search-view-all" data-predictive-item role="option">
          Search &ldquo;${escapeHTML(query)}&rdquo; →
        </a>
      </div>`;
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
   NEWSLETTER FORM (Native Shopify {% form 'customer' %} validation)
   Never fakes success — validates email client-side and submits
   natively so Shopify handles tagging, validation, and captcha.
   ============================================================ */
class NewsletterForm {
  constructor() {
    $$('[data-newsletter-form]').forEach(form => this._init(form));
  }

  _init(form) {
    const input = form.querySelector('input[type="email"]');
    const errorEl = form.querySelector('[data-newsletter-client-error]');
    if (!input) return;

    const clearError = () => {
      input.removeAttribute('aria-invalid');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.hidden = true;
      }
    };

    input.addEventListener('input', clearError);

    form.addEventListener('submit', (e) => {
      const val = input.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = val.length > 0 && emailPattern.test(val) && (typeof input.checkValidity !== 'function' || input.checkValidity());

      if (!isValid) {
        e.preventDefault();
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) {
          errorEl.textContent = window.HorusTheme?.strings?.newsletterInvalidEmail || 'Please enter a valid email address.';
          errorEl.hidden = false;
        }
        input.focus();
      } else {
        clearError();
      }
    });
  }
}

/* ============================================================
   RESPONSIVE RTE TABLES (Size Guide & Policy tables on mobile)
   ============================================================ */
class ResponsiveTables {
  constructor() {
    $$('[data-rte-tables] table, .shopify-policy__body table').forEach(table => {
      if (table.parentElement?.classList.contains('rte-table-scroll')) return;
      const wrap = document.createElement('div');
      wrap.className = 'rte-table-scroll';
      table.parentNode?.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }
}

/* ============================================================
   LEGACY CUSTOMER ACCOUNTS — Recover toggle & Addresses helper
   ============================================================ */
class CustomerAccounts {
  constructor() {
    this._initLoginToggle();
    this._initAddresses();
  }

  _initLoginToggle() {
    const section = $('[data-customer-login]');
    if (!section) return;

    const setRecovering = (showRecover) => {
      section.classList.toggle('is-recovering', showRecover);
      if (showRecover) {
        $('#RecoverEmail', section)?.focus();
      } else {
        $('#CustomerEmail', section)?.focus();
      }
    };

    if (window.location.hash === '#recover') {
      section.classList.add('is-recovering');
    }

    $('[data-recover-toggle]', section)?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history?.replaceState) window.history.replaceState({}, '', '#recover');
      setRecovering(true);
    });

    $('[data-login-toggle]', section)?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history?.replaceState) window.history.replaceState({}, '', '#login');
      setRecovering(false);
    });
  }

  _initAddresses() {
    const section = $('[data-customer-addresses]');
    if (!section) return;

    // Delete address confirmation
    $$('[data-address-delete-form]', section).forEach(form => {
      form.addEventListener('submit', (e) => {
        const msg = form.dataset.confirmMessage || 'Are you sure you wish to delete this address?';
        if (typeof window.confirm === 'function' && !window.confirm(msg)) {
          e.preventDefault();
        }
      });
    });

    // Bind Shopify CountryProvinceSelector when shopify_common.js is available
    const initCountrySelectors = () => {
      if (!window.Shopify?.CountryProvinceSelector) return;
      $$('[data-address-country-select]', section).forEach(select => {
        const suffix = select.dataset.formId || '';
        const countryId = `AddressCountry${suffix}`;
        const provinceId = `AddressProvince${suffix}`;
        const containerId = `AddressProvinceContainer${suffix}`;
        if ($(`#${countryId}`) && $(`#${provinceId}`)) {
          new window.Shopify.CountryProvinceSelector(countryId, provinceId, {
            hideElement: containerId,
          });
        }
      });
    };

    if (window.Shopify?.CountryProvinceSelector) {
      initCountrySelectors();
    } else {
      window.addEventListener('load', initCountrySelectors, { once: true });
    }
  }
}

/* ============================================================
   INIT — DOMContentLoaded
   ============================================================ */
let HorusCart;

document.addEventListener('DOMContentLoaded', () => {
  HorusCart = new CartDrawer();
  window.HorusCart = HorusCart; // expose for inline / external callers

  new CartPage();
  new ProductPage();
  new CollectionFacets();
  new PredictiveSearch();
  new ResponsiveTables();
  new CustomerAccounts();
  new MobileNav();
  new HeaderScroll();
  new CollectionTabs();
  new ProductCards();
  new TabsScroll();
  new AnnouncementBar();
  new LazyImages();
  new NewsletterForm();
});
