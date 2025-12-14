/*
 * main.js
 * Handles fetching products, rendering hero and gallery, order form interactions,
 * and posting orders to the server. Also opens a WhatsApp message to confirm
 * the order with the customer. Designed specifically for Bangladeshi shoppers.
 */

let products = [];
let selectedProduct = null; // ✅ This will be the ORDER product (dropdown + summary)

let heroIndex = 0;          // ✅ This will be the HERO display index
let heroTimer = null;

// Helper: fetch product data from API
async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();

    if (products.length > 0) {
      // Default hero is first product
      heroIndex = 0;

      // ✅ Default order product is also first product (only initially)
      selectedProduct = products[0];
    }

    // After fetching, render everything
    renderHero();               // price block (based on HERO product)
    renderHeroCarousel();       // carousel (right)
    renderGallery();
    renderProductGrid();
    populateProductDropdown();  // dropdown uses ORDER product
    updateSummary();            // summary uses ORDER product
    validateForm();
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

// ✅ Render the hero price block based on HERO product (NOT dropdown/order)
function renderHero() {
  const heroProduct = products[heroIndex] || selectedProduct;
  if (!heroProduct) return;

  const priceBlock = document.getElementById('priceBlock');
  if (priceBlock) {
    priceBlock.innerHTML = `<del>৳${heroProduct.regularPrice}</del><ins>৳${heroProduct.offerPrice}</ins>`;
  }
}

// Render Hero Carousel (all products)
function renderHeroCarousel() {
  const track = document.getElementById("heroTrack");
  const dots = document.getElementById("heroDots");
  const prev = document.getElementById("heroPrev");
  const next = document.getElementById("heroNext");

  if (!track || !dots || !prev || !next) return;
  if (!products || products.length === 0) return;

  track.innerHTML = "";
  dots.innerHTML = "";

  products.forEach((p, idx) => {
    const slide = document.createElement("div");
    slide.className = "hero-slide";
    slide.innerHTML = `
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="hero-slide-overlay">
        <div class="hero-slide-title">${p.name}</div>
        <div class="hero-slide-price">
          <span class="hero-slide-old">৳${p.regularPrice}</span>
          <span class="hero-slide-new">৳${p.offerPrice}</span>
        </div>
      </div>
    `;

    // ✅ Clicking slide SHOULD set order product (user intent)
    slide.addEventListener("click", () => {
      setHeroIndex(idx, true);
      selectProduct(p, true, false); // user-driven change
    });

    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-dot" + (idx === heroIndex ? " active" : "");
    dot.addEventListener("click", () => {
      setHeroIndex(idx, false);
      // ✅ dot click only changes hero display, not order product
    });
    dots.appendChild(dot);
  });

  prev.onclick = () => {
    setHeroIndex((heroIndex - 1 + products.length) % products.length, false);
    // ✅ prev/next only changes hero display, not order product
  };

  next.onclick = () => {
    setHeroIndex((heroIndex + 1) % products.length, false);
  };

  applyHeroPosition();
  startHeroAuto();
}

function applyHeroPosition() {
  const track = document.getElementById("heroTrack");
  const dots = document.querySelectorAll(".hero-dot");

  if (track) {
    track.style.transform = `translateX(-${heroIndex * 100}%)`;
  }

  dots.forEach((d, i) => d.classList.toggle("active", i === heroIndex));

  // ✅ Update hero price when hero slide changes
  renderHero();
}

function setHeroIndex(idx, restartAuto) {
  heroIndex = idx;
  applyHeroPosition();
  if (restartAuto) restartHeroAuto();
}

function startHeroAuto() {
  if (heroTimer) clearInterval(heroTimer);

  heroTimer = setInterval(() => {
    if (!products || products.length === 0) return;

    heroIndex = (heroIndex + 1) % products.length;
    applyHeroPosition();

    // ✅ IMPORTANT: Auto slide should NOT call selectProduct()
    // So dropdown/order selection stays stable.
  }, 4500);
}

function restartHeroAuto() {
  startHeroAuto();
}

// Render a gallery of close-up images; use first few products or duplicate if needed
function renderGallery() {
  const gallery = document.getElementById('gallery');
  if (!gallery || products.length === 0) return;

  const images = [];
  for (let i = 0; i < 4; i++) {
    const product = products[i % products.length];
    images.push(product.image);
  }

  gallery.innerHTML = images
    .map(
      (src) =>
        `<figure>
          <img src="${src}" alt="Product close-up" loading="lazy">
          <figcaption>High-Quality Print | Long-Lasting Fabric</figcaption>
        </figure>`
    )
    .join('');
}

// Render product grid with cards for each jersey
function renderProductGrid() {
  const grid = document.getElementById('productGrid');
  if (!grid || products.length === 0) return;

  grid.innerHTML = '';
  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card' + (selectedProduct && product.id === selectedProduct.id ? ' active' : '');
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <h4>${product.name}</h4>
      <div class="price"><del>৳${product.regularPrice}</del> <ins>৳${product.offerPrice}</ins></div>
    `;

    card.addEventListener('click', () => {
      // ✅ user intent => change order product
      selectProduct(product, true, false);

      // sync hero to this product (nice UX)
      const idx = products.findIndex(p => p.id === product.id);
      if (idx >= 0) {
        heroIndex = idx;
        applyHeroPosition();
        restartHeroAuto();
      }
    });

    grid.appendChild(card);
  });
}

// Populate product dropdown options
function populateProductDropdown() {
  const select = document.getElementById('productSelect');
  if (!select) return;

  select.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'পণ্য নির্বাচন করুন';
  select.appendChild(defaultOption);

  products.forEach((product) => {
    const opt = document.createElement('option');
    opt.value = product.id;
    opt.textContent = `${product.name} — ৳${product.offerPrice} (৳${product.regularPrice})`;
    select.appendChild(opt);
  });

  // ✅ Set dropdown to selectedProduct ONLY on initial load / user selection
  if (selectedProduct) {
    select.value = selectedProduct.id;
  }
}

// Select a product and update UI (ORDER product)
function selectProduct(product, scrollToForm = false, fromAuto = false) {
  selectedProduct = product;

  // ✅ Update grid highlight
  renderProductGrid();

  // ✅ Update dropdown value ONLY on user-driven changes
  // (fromAuto is here for safety; we don't call selectProduct() from auto anymore)
  const select = document.getElementById('productSelect');
  if (select && !fromAuto) {
    select.value = product.id;
  }

  updateSummary();
  validateForm();

  if (scrollToForm) {
    document.getElementById('orderFormSection').scrollIntoView({ behavior: 'smooth' });
  }
}

// Update the order summary based on selected product, area, and quantity
function updateSummary() {
  if (!selectedProduct) return;

  const qty = parseInt(document.getElementById('productQuantity').value) || 1;
  const area = document.getElementById('deliveryArea').value;

  const productPrice = selectedProduct.offerPrice * qty;

  let deliveryCharge = 0;
  if (area === 'inside') deliveryCharge = 70;
  else if (area === 'outside') deliveryCharge = 130;

  const total = productPrice + deliveryCharge;

  document.getElementById('summaryProductPrice').textContent = `৳${productPrice}`;
  document.getElementById('summaryDeliveryCharge').textContent = `৳${deliveryCharge}`;
  document.getElementById('summaryTotal').textContent = `৳${total}`;
}

// Validate required fields and enable/disable submit button
function validateForm() {
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const area = document.getElementById('deliveryArea').value;
  const address = document.getElementById('customerAddress').value.trim();
  const size = document.getElementById('productSize').value;
  const product = document.getElementById('productSelect').value;

  const submitBtn = document.getElementById('submitOrder');

  const phoneValid = /^01\d{9}$/.test(phone);

  if (product && selectedProduct && name && phoneValid && area && address && size) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

// Handle order form submission
async function handleOrderSubmit(event) {
  event.preventDefault();
  if (!selectedProduct) return;

  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const area = document.getElementById('deliveryArea').value;
  const address = document.getElementById('customerAddress').value.trim();
  const size = document.getElementById('productSize').value;
  const qty = parseInt(document.getElementById('productQuantity').value) || 1;

  let deliveryCharge = 0;
  if (area === 'inside') deliveryCharge = 70;
  else if (area === 'outside') deliveryCharge = 130;

  const productPrice = selectedProduct.offerPrice * qty;
  const total = productPrice + deliveryCharge;

  const order = {
    productId: selectedProduct.id,
    productName: selectedProduct.name,
    regularPrice: selectedProduct.regularPrice,
    offerPrice: selectedProduct.offerPrice,
    quantity: qty,
    size: size,
    name: name,
    phone: phone,
    address: address,
    deliveryArea: area,
    deliveryCharge: deliveryCharge,
    total: total
  };

  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  } catch (err) {
    console.error('Failed to save order:', err);
  }

  const messageLines = [
    'আসসালামু আলাইকুম 👋',
    'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে ✅',
    '',
    `📦 Product: ${selectedProduct.name}`,
    `💰 Offer Price: ৳${selectedProduct.offerPrice} (Regular ৳${selectedProduct.regularPrice})`,
    `📏 Size: ${size}`,
    `🔢 Quantity: ${qty}`,
    `🚚 Delivery: ${area === 'inside' ? 'Dhaka' : 'Outside Dhaka'} (৳${deliveryCharge})`,
    '',
    `💵 Total: ৳${total} (Cash on Delivery)`,
    '',
    '📞 ২৪ ঘণ্টার মধ্যে কল করে অর্ডার কনফার্ম করা হবে।',
    '',
    'ধন্যবাদ',
    'GameOn Garb 🏆'
  ];

  const message = messageLines.join('\n');

  const waNumber = '01711992409';
  const waInternational = waNumber.startsWith('01') ? '880' + waNumber.slice(1) : waNumber;
  const waURL = `https://wa.me/${waInternational}?text=${encodeURIComponent(message)}`;

  window.open(waURL, '_blank');

  alert('আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে! আমাদের প্রতিনিধি কল করবে।');

  event.target.reset();

  const productSelect = document.getElementById('productSelect');
  if (productSelect) productSelect.selectedIndex = 0;

  // Optional: reset selected product back to first
  if (products.length > 0) {
    selectedProduct = products[0];
    updateSummary();
    validateForm();
    renderProductGrid();
    // hero can continue auto without affecting order
  }
}

// Initialisation on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  fetchProducts();

  document.getElementById('productQuantity').addEventListener('change', () => {
    updateSummary();
    validateForm();
  });

  document.getElementById('deliveryArea').addEventListener('change', () => {
    updateSummary();
    validateForm();
  });

  document.getElementById('productSize').addEventListener('change', validateForm);
  document.getElementById('customerName').addEventListener('input', validateForm);
  document.getElementById('customerPhone').addEventListener('input', validateForm);
  document.getElementById('customerAddress').addEventListener('input', validateForm);

  // ✅ Dropdown change = user intent (order product)
  const productSelectEl = document.getElementById('productSelect');
  if (productSelectEl) {
    productSelectEl.addEventListener('change', (e) => {
      const val = parseInt(e.target.value);
      const prod = products.find(p => p.id === val);
      if (prod) {
        selectProduct(prod, false, false);

        // Sync hero to dropdown (optional nice UX)
        const idx = products.findIndex(p => p.id === prod.id);
        if (idx >= 0) {
          heroIndex = idx;
          applyHeroPosition();
          restartHeroAuto();
        }
      }
    });
  }

  document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
});
