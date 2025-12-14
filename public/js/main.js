/*
 * main.js
 * Handles fetching products, rendering hero and gallery, order form interactions,
 * and posting orders to the server. Also opens a WhatsApp message to confirm
 * the order with the customer. Designed specifically for Bangladeshi shoppers.
 */

let products = [];
let selectedProduct = null;

let heroIndex = 0;
let heroTimer = null;

// Helper: fetch product data from API
async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    if (products.length > 0) {
      // Use the first product as default hero product
      selectedProduct = products[0];
      heroIndex = 0;
    }

    // After fetching, render everything
    renderHero();               // price block (left)
    renderHeroCarousel();       // carousel (right)
    renderGallery();
    renderProductGrid();
    populateProductDropdown();
    updateSummary();
    validateForm();
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

// Render the hero price block based on selected product
function renderHero() {
  if (!selectedProduct) return;

  const priceBlock = document.getElementById('priceBlock');
  priceBlock.innerHTML = `<del>৳${selectedProduct.regularPrice}</del><ins>৳${selectedProduct.offerPrice}</ins>`;
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

    // Clicking slide selects product and scrolls to order form
    slide.addEventListener("click", () => {
      setHeroIndex(idx, true);
    });

    track.appendChild(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-dot" + (idx === heroIndex ? " active" : "");
    dot.addEventListener("click", () => setHeroIndex(idx, false));
    dots.appendChild(dot);
  });

  prev.onclick = () => setHeroIndex((heroIndex - 1 + products.length) % products.length, false);
  next.onclick = () => setHeroIndex((heroIndex + 1) % products.length, false);

  // Set initial position
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
}

function setHeroIndex(idx, scrollToForm) {
  heroIndex = idx;
  applyHeroPosition();

  const p = products[heroIndex];
  if (p) {
    selectProduct(p, scrollToForm, true); // third param: fromCarousel
  }

  restartHeroAuto();
}

function startHeroAuto() {
  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    if (!products || products.length === 0) return;
    heroIndex = (heroIndex + 1) % products.length;
    applyHeroPosition();

    const p = products[heroIndex];
    if (p) {
      // Auto slide should NOT scroll to form
      selectProduct(p, false, true);
    }
  }, 4500);
}

function restartHeroAuto() {
  startHeroAuto();
}

// Render a gallery of close-up images; use first few products or duplicate if needed
function renderGallery() {
  const gallery = document.getElementById('gallery');
  if (!gallery || products.length === 0) return;

  // Choose the first 4 products for gallery display (or duplicate if less)
  const images = [];
  for (let i = 0; i < 4; i++) {
    const product = products[i % products.length];
    images.push(product.image);
  }


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
      <img src="${product.image}" alt="${product.name}">
      <h4>${product.name}</h4>
      <div class="price"><del>৳${product.regularPrice}</del> <ins>৳${product.offerPrice}</ins></div>
    `;

    card.addEventListener('click', () => {
      // Select product + scroll
      selectProduct(product, true, false);

      // Also move carousel to this product
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

  // Add a disabled default option
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

  // If we already have selectedProduct, set it
  if (selectedProduct) {
    select.value = selectedProduct.id;
  }
}

// Select a product and update UI
function selectProduct(product, scrollToForm = false, fromCarousel = false) {
  selectedProduct = product;

  // Update hero price
  renderHero();

  // Re-render grid to highlight selected card
  renderProductGrid();

  // Set dropdown value
  const select = document.getElementById('productSelect');
  if (select) {
    select.value = product.id;
  }

  updateSummary();
  validateForm();

  // If selection is NOT coming from carousel auto-slide,
  // keep carousel synced (for dropdown/grid changes)
  if (!fromCarousel) {
    const idx = products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      heroIndex = idx;
      applyHeroPosition();
      restartHeroAuto();
    }
  }

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

  // Determine delivery charge: 70 for inside Dhaka, 130 for outside, 0 if not selected
  let deliveryCharge = 0;
  if (area === 'inside') deliveryCharge = 70;
  else if (area === 'outside') deliveryCharge = 130;

  const total = productPrice + deliveryCharge;

  // Update DOM
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

  // Basic phone validation: must start with 01 and be 11 digits long
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

  // Extract form data
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const area = document.getElementById('deliveryArea').value;
  const address = document.getElementById('customerAddress').value.trim();
  const size = document.getElementById('productSize').value;
  const qty = parseInt(document.getElementById('productQuantity').value) || 1;

  // Calculate charges
  let deliveryCharge = 0;
  if (area === 'inside') deliveryCharge = 70;
  else if (area === 'outside') deliveryCharge = 130;

  const productPrice = selectedProduct.offerPrice * qty;
  const total = productPrice + deliveryCharge;

  // Prepare order object
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

  // Save order to server
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(order)
    });
  } catch (err) {
    console.error('Failed to save order:', err);
  }

  // Build WhatsApp message
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

  // Format WhatsApp URL: convert phone to international (Bangladesh 880)
  const waNumber = '01711992409';
  const waInternational = waNumber.startsWith('01') ? '880' + waNumber.slice(1) : waNumber;
  const waURL = `https://wa.me/${waInternational}?text=${encodeURIComponent(message)}`;

  // Open WhatsApp in new tab
  window.open(waURL, '_blank');

  // Notify user on page
  alert('আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে! আমাদের প্রতিনিধি কল করবে।');

  // Reset form
  event.target.reset();

  // Reset dropdown default
  const productSelect = document.getElementById('productSelect');
  if (productSelect) {
    productSelect.selectedIndex = 0;
  }

  // Reset selected product to first
  if (products.length > 0) {
    selectedProduct = products[0];
    heroIndex = 0;
    renderHero();
    applyHeroPosition();
  }

  // Reset summary
  updateSummary();
  validateForm();
}

// Initialisation on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  fetchProducts();

  // Update summary and validation when user interacts with form fields
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

  // When product selection changes, update selected product
  const productSelectEl = document.getElementById('productSelect');
  if (productSelectEl) {
    productSelectEl.addEventListener('change', (e) => {
      const val = parseInt(e.target.value);
      const prod = products.find(p => p.id === val);
      if (prod) {
        selectProduct(prod, false, false);
      }
    });
  }

  // Order form submission
  document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
});
// Enhance WhatsApp button with selected product info
const waBtn = document.getElementById("whatsappFloat");

function updateWhatsAppLink(){
  if (!waBtn || !selectedProduct) return;

  const msg = [
    "আসসালামু আলাইকুম 👋",
    "আমি একটি জার্সি অর্ডার করতে চাই",
    "",
    `🏷 Product: ${selectedProduct.name}`,
    `💰 Price: ৳${selectedProduct.offerPrice}`,
    "",
    "দয়া করে বিস্তারিত জানান"
  ].join("\n");

  const number = "8801711992409";
  waBtn.href = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

// Update whenever product changes
const originalSelectProduct = selectProduct;
selectProduct = function(...args){
  originalSelectProduct.apply(this, args);
  updateWhatsAppLink();
};

// Initial call
document.addEventListener("DOMContentLoaded", updateWhatsAppLink);
