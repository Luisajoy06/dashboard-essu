// AUTH helpers
function getUsers() {
  const raw = localStorage.getItem("users");
  return raw ? JSON.parse(raw) : [];
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

// Ensure a test user exists for quick login during development
function ensureTestUser() {
  const users = getUsers();
  const testEmail = "test@demo.com";
  if (!users.find(u => u.email && u.email.toLowerCase() === testEmail)) {
    users.push({ name: "Test User", email: testEmail, password: "demo123" });
    saveUsers(users);
  }
}

// Autofill login form with test credentials
function useTestCreds() {
  ensureTestUser();
  const e = document.getElementById("email");
  const p = document.getElementById("password");
  if (e) e.value = "test@demo.com";
  if (p) p.value = "demo123";
}

// SIGNUP
function signup() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("suEmail").value.trim();
  const studentNo = document.getElementById("suStudentNo").value.trim();
  const department = document.getElementById("suDepartment").value.trim();
  const pass = document.getElementById("suPassword").value;
  const confirm = document.getElementById("suConfirm").value;
  const errEl = document.getElementById("signupError");

  if (!name || !email || !studentNo || !department || !pass || !confirm) {
    errEl.innerText = "Please fill all fields";
    return;
  }
  if (pass !== confirm) {
    errEl.innerText = "Passwords do not match";
    return;
  }

  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    errEl.innerText = "Email already registered";
    return;
  }

  users.push({ name, email, password: pass, idNumber: studentNo, department: department });
  saveUsers(users);
  localStorage.setItem("buyer", email);
  window.location.href = "dashboard.html";
}

// LOGIN
function login() {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;
  const errEl = document.getElementById("loginError");

  if (!email || !pass) {
    errEl.innerText = "Enter email and password";
    return;
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== pass) {
    errEl.innerText = "Invalid credentials";
    return;
  }

  localStorage.setItem("buyer", email);
  window.location.href = "dashboard.html";
}

function logout() {
  localStorage.removeItem("buyer");
  window.location.href = "login.html";
}

// DASHBOARD
if (document.getElementById("buyerEmail")) {
  document.getElementById("buyerEmail").innerText =
    localStorage.getItem("buyer");
}

// SAMPLE SELLER ITEMS (with category and seller)
let products = JSON.parse(localStorage.getItem('products')) || [
  { id: 1, name: "iPhone 13 Pro", price: 35000, img: "https://picsum.photos/300/200?1", category: 'Electronics', seller: 'Juan Dela Cruz', desc: 'Gently used, excellent condition', condition: 'Used', views: 45, rating: 4.5 },
  { id: 2, name: "Data Structures Book", price: 500, img: "https://picsum.photos/300/200?2", category: 'Books', seller: 'Maria Santos', desc: 'CS textbook, like new', condition: 'New', views: 32, rating: 4.8 },
  { id: 3, name: "Study Desk", price: 2500, img: "https://picsum.photos/300/200?3", category: 'Furniture', seller: 'Pedro Garcia', desc: 'Wooden desk, perfect for dorm', condition: 'Used', views: 28, rating: 4.2 },
  { id: 4, name: "ESSU Hoodie", price: 450, img: "https://picsum.photos/300/200?4", category: 'Clothing', seller: 'Ana Reyes', desc: 'Official ESSU merch, size L', condition: 'New', views: 67, rating: 4.9 },
  { id: 5, name: "MacBook Pro 14\"", price: 85000, img: "https://picsum.photos/300/200?5", category: 'Electronics', seller: 'Carlos Mendoza', desc: 'Latest model, barely used', condition: 'Used', views: 89, rating: 4.7 },
  { id: 6, name: "Calculus Textbook", price: 800, img: "https://picsum.photos/300/200?6", category: 'Books', seller: 'Elena Cruz', desc: 'Complete with solutions manual', condition: 'New', views: 23, rating: 4.6 },
  { id: 7, name: "Gaming Chair", price: 4200, img: "https://picsum.photos/300/200?7", category: 'Furniture', seller: 'Miguel Santos', desc: 'Ergonomic design, excellent condition', condition: 'Used', views: 41, rating: 4.4 },
  { id: 8, name: "ESSU Tumbler", price: 250, img: "https://picsum.photos/300/200?8", category: 'Other', seller: 'Sofia Reyes', desc: 'Keep drinks hot/cold', condition: 'New', views: 19, rating: 4.3 }
];

let cart = loadCart();
let wishlist = loadWishlist();

const grid = document.getElementById("itemsGrid");
function renderProducts(filterCategory){
  if(!grid) return;
  grid.innerHTML = '';
  const list = filterCategory && filterCategory !== 'All' ? products.filter(p=>p.category === filterCategory) : products;
  list.forEach(p=>{
    const conditionClass = p.condition === 'New' ? 'condition-new' : 'condition-used';
    grid.innerHTML += `
      <div class="card">
        <span class="tag">${p.category}</span>
        <span class="condition-badge ${conditionClass}">${p.condition}</span>
        <span class="heart">♡</span>
        <img src="${p.img||'https://via.placeholder.com/300x220?text=No+Image'}" alt="" onerror="this.src='https://via.placeholder.com/300x220?text=No+Image'">
        <h3>${p.name}</h3>
        <p>${p.desc || ''}</p>
        <h4>₱${p.price}</h4>
        <span class="seller">📍 ${p.seller}</span>
        <div style="margin-top:10px"><button onclick="addToCart(${p.id})">Add to Cart</button></div>
      </div>`;
  });
  attachUIHandlers();
}

// initial render
renderProducts();

// Normalize cart items to include qty
function normalizeCart(c){
  return (c || []).map(i => ({
    id: i.id,
    name: i.name,
    price: i.price,
    img: i.img,
    qty: i.qty && i.qty > 0 ? i.qty : 1
  }));
}

function addToCart(id) {
  const item = products.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, img: item.img, qty: 1 });
  }
  saveCart();
  renderCart();
  showToast(`${item.name} added to cart`);
  updateCartBadge();
  // Open mini-cart so user sees the item was added
  openMiniCart();
}

function renderCart() {
  // update any cart UI if present (backward compatible)
  const cartDiv = document.getElementById("cartItems");
  if (cartDiv) {
    cartDiv.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      total += item.price * (item.qty || 1);
      cartDiv.innerHTML += `
        <div class="cart-item">
          <span>${item.name} x ${item.qty}</span>
          <span>₱${item.price * item.qty} <button onclick="removeFromCart(${i})" style="margin-left:8px;background:transparent;border:none;color:#c23;cursor:pointer">Remove</button></span>
        </div>`;
    });
    const totalEl = document.getElementById("cartTotal");
    if (totalEl) totalEl.innerText = total;
  }
  // also update mini cart if open
  if (document.getElementById('miniCart')) renderMiniCart();
}

function removeFromCart(index){
  cart.splice(index,1);
  saveCart();
  renderCart();
  updateCartBadge();
}

function changeQty(index, delta){
  if(!cart[index]) return;
  cart[index].qty = (cart[index].qty || 1) + delta;
  if(cart[index].qty <= 0) cart.splice(index,1);
  saveCart();
  renderCart();
  updateCartBadge();
}

/* Cart persistence */
function saveCart(){
  localStorage.setItem('cart', JSON.stringify(cart));
}
function loadCart(){
  const raw = localStorage.getItem('cart');
  return raw ? normalizeCart(JSON.parse(raw)) : [];
}

/* Wishlist persistence */
function saveWishlist(){
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}
function loadWishlist(){
  const raw = localStorage.getItem('wishlist');
  return raw ? JSON.parse(raw) : [];
}

function toggleWishlist(id) {
  const item = products.find(p => p.id === id);
  const existingIndex = wishlist.findIndex(w => w.id === id);
  if (existingIndex > -1) {
    wishlist.splice(existingIndex, 1);
    showToast(`${item.name} removed from wishlist`);
  } else {
    wishlist.push({ id: item.id, name: item.name, price: item.price, img: item.img });
    showToast(`${item.name} added to wishlist`);
  }
  saveWishlist();
  updateWishlistUI();
}

function updateWishlistUI() {
  document.querySelectorAll('.heart').forEach((heart, index) => {
    const card = heart.closest('.card');
    const img = card.querySelector('img');
    const productId = parseInt(img.src.split('/').pop().split('?')[1] || '1'); // Extract ID from image URL
    const isInWishlist = wishlist.some(w => w.id === productId);
    heart.textContent = isInWishlist ? '♥' : '♡';
    heart.style.color = isInWishlist ? 'red' : '#333';
  });
}

/* Checkout modal flow (modal-based stepper) */
function openCheckoutModal(showAddressToo){
  const buyer = currentBuyer();
  // if not logged in, show login step first
  if(!buyer){
    document.getElementById('checkoutModal').classList.add('open');
    document.getElementById('step-login').classList.remove('hidden');
    document.getElementById('step-payment').classList.add('hidden');
    document.getElementById('step-address').classList.add('hidden');
    document.getElementById('step-review').classList.add('hidden');
    return;
  }
  if(!cart.length){ showToast('Your cart is empty'); return; }
  // populate summary
  populateCheckoutSummary();
  document.getElementById('checkoutModal').classList.add('open');
  document.getElementById('step-login').classList.add('hidden');
  document.getElementById('step-payment').classList.remove('hidden');
  // optionally show address input at the same time (combined flow)
  if(showAddressToo){
    document.getElementById('step-address').classList.remove('hidden');
  } else {
    document.getElementById('step-address').classList.add('hidden');
  }
  document.getElementById('step-review').classList.add('hidden');
}

function closeCheckoutModal(){
  document.getElementById('checkoutModal').classList.remove('open');
}

function populateCheckoutSummary(){
  const summary = document.getElementById('checkoutItems');
  const totalEl = document.getElementById('checkoutTotal');
  summary.innerHTML = '';
  let total = 0;
  cart.forEach((it,i)=>{
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.padding = '8px 0';
    row.innerHTML = `<div>${it.name} <span class="muted">x ${it.qty}</span></div><div>₱${it.price * it.qty}</div>`;
    summary.appendChild(row);
    total += it.price * it.qty;
  });
  totalEl.innerText = '₱' + total;
}

function toAddressStep(){
  const sel = document.querySelector('input[name="pmethod"]:checked');
  if(!sel){ alert('Please select a payment method'); return; }
  document.getElementById('step-payment').classList.add('hidden');
  document.getElementById('step-address').classList.remove('hidden');
}

function toReviewStep(){
  const name = document.getElementById('addressName').value.trim();
  const phone = document.getElementById('addressPhone').value.trim();
  const addr = document.getElementById('addressInput').value.trim();
  if(!name){ alert('Please enter your full name'); return; }
  if(!phone){ alert('Please enter your phone number'); return; }
  if(!addr){ alert('Please enter your delivery address'); return; }
  populateCheckoutSummary();
  document.getElementById('step-address').classList.add('hidden');
  document.getElementById('step-review').classList.remove('hidden');
}

function confirmOrderFromModal(){
  const buyer = currentBuyer();
  if(!buyer){ alert('Please log in to place orders'); return; }
  const sel = document.querySelector('input[name="pmethod"]:checked');
  const name = document.getElementById('addressName').value.trim();
  const phone = document.getElementById('addressPhone').value.trim();
  const addr = document.getElementById('addressInput').value.trim();
  if(!sel || !name || !phone || !addr){ alert('Missing payment or address information'); return; }

  const order = {
    id: 'ORD-' + Date.now(),
    buyer: buyer,
    items: cart.slice(),
    total: cart.reduce((s,i)=>s + i.price * i.qty,0),
    payment: sel.value,
    recipientName: name,
    recipientPhone: phone,
    address: addr,
    status: 'Processing',
    trackingNumber: 'TRK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 3*24*60*60*1000).toISOString() // 3 days from now
  };
  const raw = localStorage.getItem('orders');
  const orders = raw ? JSON.parse(raw) : [];
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));

  // Restore original cart and only remove checked-out items
  if(window.restoreCart){ window.restoreCart(); }
  else { cart = []; }
  saveCart();
  renderCart();
  updateCartBadge();
  closeCheckoutModal();
  closeMiniCart();
  showToast('Order placed — check Profile for details');
}

// Ensure cart renders on page load
renderCart();

/* --- Mini-cart, Orders and UI helpers --- */
// Return logged in buyer email (null if not)
function currentBuyer(){
  return localStorage.getItem('buyer');
}

function updateCartBadge(){
  const badge = document.getElementById('cartBadge');
  if(!badge) return;
  const count = cart.reduce((s,i)=>s + (i.qty || 1),0);
  badge.innerText = count || '';
}

function openMiniCart(){
  renderMiniCart();
  document.getElementById('miniCart').classList.add('open');
  updateCartBadge();
}
function closeMiniCart(){
  document.getElementById('miniCart').classList.remove('open');
}

function renderMiniCart(){
  const wrap = document.getElementById('miniCartList');
  const totalEl = document.getElementById('miniCartTotal');
  wrap.innerHTML = '';
  let total = 0;
  if(!cart.length) {
    wrap.innerHTML = '<div class="muted" style="padding:16px 0;text-align:center">Your cart is empty</div>';
    totalEl.innerText = '₱0';
    return;
  }
  cart.forEach((it, i)=>{
    total += it.price * it.qty;
    const row = document.createElement('div');
    row.className = 'mini-item';
    row.innerHTML = `
      <div style="display:flex;align-items:center;flex:1;gap:12px">
        <input type="checkbox" class="cart-item-select" data-index="${i}" checked style="width:18px;height:18px;cursor:pointer">
        <img src="${it.img||'https://via.placeholder.com/64'}" onerror="this.src='https://via.placeholder.com/64'">
        <div style="display:flex;flex-direction:column;flex:1">
          <div style="font-weight:700;color:#111">${it.name}</div>
          <div style="color:#6b7280;font-size:13px">₱${it.price.toLocaleString()} each</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <button onclick="changeQty(${i},-1)" class="qty-control">−</button>
        <div style="min-width:24px;text-align:center;font-weight:600">${it.qty}</div>
        <button onclick="changeQty(${i},1)" class="qty-control">+</button>
        <div style="min-width:16px"></div>
        <div style="font-weight:700;color:#111;min-width:80px;text-align:right">₱${(it.price * it.qty).toLocaleString()}</div>
      </div>`;
    wrap.appendChild(row);
  });
  totalEl.innerText = '₱' + total.toLocaleString();
}

/* UI helpers: favorites & category filter */
function attachUIHandlers(){
  // hearts
  document.querySelectorAll('.heart').forEach(heart => {
    heart.onclick = () => {
      const card = heart.closest('.card');
      const img = card.querySelector('img');
      const productId = parseInt(img.src.split('/').pop().split('?')[1] || '1'); // Extract ID from image URL
      toggleWishlist(productId);
    };
  });

  // categories
  document.querySelectorAll('.cat').forEach(cat => {
    cat.onclick = () => {
      document.querySelector('.cat.active')?.classList.remove('active');
      cat.classList.add('active');
      // filter products
      const name = cat.innerText.trim();
      renderProducts(name);
    };
  });
}

// ensure category buttons work on load
attachUIHandlers();

/* Get selected cart items for checkout */
function getSelectedCartItems(){
  const checkboxes = document.querySelectorAll('.cart-item-select:checked');
  const selected = [];
  checkboxes.forEach(cb => {
    const idx = parseInt(cb.dataset.index);
    if(cart[idx]) selected.push(cart[idx]);
  });
  return selected;
}

/* Place order from mini-cart: open modal stepper */
function placeOrderFromMini(){
  const selected = getSelectedCartItems();
  if(!selected.length){ showToast('Please select items to checkout'); return; }
  // Temporarily use selected items for checkout
  const originalCart = cart.slice();
  cart = selected;
  openCheckoutModal(true);
  // Note: cart will be restored after order confirmation or modal close
  window.restoreCart = ()=>{ cart = originalCart; };
}

/* Small toast */
function showToast(msg){
  let t = document.getElementById('toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}

// update cart badge on load
updateCartBadge();

// FILTER MODAL FUNCTIONS
function openFilterModal(){
  document.getElementById('filterModal').classList.add('open');
  // Populate current filters if any
  const currentFilters = getCurrentFilters();
  document.getElementById('filterSearch').value = currentFilters.search || '';
  document.getElementById('filterCategory').value = currentFilters.category || '';
  document.getElementById('filterCondition').value = currentFilters.condition || '';
  document.getElementById('minPrice').value = currentFilters.minPrice || '';
  document.getElementById('maxPrice').value = currentFilters.maxPrice || '';
}

function closeFilterModal(){
  document.getElementById('filterModal').classList.remove('open');
}

function applyFilters(){
  const search = document.getElementById('filterSearch').value.trim().toLowerCase();
  const category = document.getElementById('filterCategory').value;
  const condition = document.getElementById('filterCondition').value;
  const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
  const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;

  // Store filters
  const filters = { search, category, condition, minPrice, maxPrice };
  localStorage.setItem('productFilters', JSON.stringify(filters));

  // Apply filters and render
  renderProductsWithFilters(filters);
  closeFilterModal();
  showToast('Filters applied!');
}

function clearFilters(){
  document.getElementById('filterSearch').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterCondition').value = '';
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';

  localStorage.removeItem('productFilters');
  renderProducts();
  closeFilterModal();
  showToast('Filters cleared!');
}

function getCurrentFilters(){
  const stored = localStorage.getItem('productFilters');
  return stored ? JSON.parse(stored) : {};
}

function renderProductsWithFilters(filters){
  if(!grid) return;
  grid.innerHTML = '';

  let filteredProducts = products;

  // Apply search filter
  if(filters.search){
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(filters.search) ||
      (p.desc && p.desc.toLowerCase().includes(filters.search))
    );
  }

  // Apply category filter
  if(filters.category){
    filteredProducts = filteredProducts.filter(p => p.category === filters.category);
  }

  // Apply price range filter
  filteredProducts = filteredProducts.filter(p =>
    p.price >= filters.minPrice && p.price <= filters.maxPrice
  );

  // Apply condition filter
  if(filters.condition){
    filteredProducts = filteredProducts.filter(p => p.condition === filters.condition);
  }

  // Render filtered products
  if(filteredProducts.length === 0){
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#6b7280;font-size:16px">No products match your filters.</div>';
  } else {
    filteredProducts.forEach(p=>{
      const conditionClass = p.condition === 'New' ? 'condition-new' : 'condition-used';
      grid.innerHTML += `
        <div class="card">
          <span class="tag">${p.category}</span>
          <span class="condition-badge ${conditionClass}">${p.condition}</span>
          <span class="heart">♡</span>
          <img src="${p.img||'https://via.placeholder.com/300x220?text=No+Image'}" alt="" onerror="this.src='https://via.placeholder.com/300x220?text=No+Image'">
          <h3>${p.name}</h3>
          <p>${p.desc || ''}</p>
          <h4>₱${p.price}</h4>
          <span class="seller">📍 ${p.seller}</span>
          <div style="margin-top:10px"><button onclick="addToCart(${p.id})">Add to Cart</button></div>
        </div>`;
    });
  }

  attachUIHandlers();
  updateWishlistUI();
}

// On page load, apply any stored filters
const initialFilters = getCurrentFilters();
if(Object.keys(initialFilters).length > 0){
  renderProductsWithFilters(initialFilters);
}
