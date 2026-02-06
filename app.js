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
  const pass = document.getElementById("suPassword").value;
  const confirm = document.getElementById("suConfirm").value;
  const errEl = document.getElementById("signupError");

  if (!name || !email || !pass || !confirm) {
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

  users.push({ name, email, password: pass });
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
const products = [
  { id: 1, name: "iPhone 13 Pro", price: 35000, img: "https://picsum.photos/300/200?1", category: 'Electronics', seller: 'Juan Dela Cruz', desc: 'Gently used, excellent condition' },
  { id: 2, name: "Data Structures Book", price: 500, img: "https://picsum.photos/300/200?2", category: 'Books', seller: 'Maria Santos', desc: 'CS textbook, like new' },
  { id: 3, name: "Study Desk", price: 2500, img: "https://picsum.photos/300/200?3", category: 'Furniture', seller: 'Pedro Garcia', desc: 'Wooden desk, perfect for dorm' },
  { id: 4, name: "ESSU Hoodie", price: 450, img: "https://picsum.photos/300/200?4", category: 'Clothing', seller: 'Ana Reyes', desc: 'Official ESSU merch, size L' }
];

let cart = loadCart();

const grid = document.getElementById("itemsGrid");
function renderProducts(filterCategory){
  if(!grid) return;
  grid.innerHTML = '';
  const list = filterCategory && filterCategory !== 'All' ? products.filter(p=>p.category === filterCategory) : products;
  list.forEach(p=>{
    grid.innerHTML += `
      <div class="card">
        <span class="tag">${p.category}</span>
        <span class="heart">♡</span>
        <img src="${p.img}" alt="">
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
  // Open combined checkout (payment + address) after adding an item for quick purchase
  openCheckoutModal(true);
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
  const addr = document.getElementById('addressInput').value.trim();
  if(!addr){ alert('Enter delivery address'); return; }
  populateCheckoutSummary();
  document.getElementById('step-address').classList.add('hidden');
  document.getElementById('step-review').classList.remove('hidden');
}

function confirmOrderFromModal(){
  const buyer = currentBuyer();
  if(!buyer){ alert('Please log in to place orders'); return; }
  const sel = document.querySelector('input[name="pmethod"]:checked');
  const addr = document.getElementById('addressInput').value.trim();
  if(!sel || !addr){ alert('Missing payment or address'); return; }

  const order = {
    id: 'ORD-' + Date.now(),
    buyer: buyer,
    items: cart.slice(),
    total: cart.reduce((s,i)=>s + i.price * i.qty,0),
    payment: sel.value,
    address: addr,
    createdAt: new Date().toISOString()
  };
  const raw = localStorage.getItem('orders');
  const orders = raw ? JSON.parse(raw) : [];
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));

  cart = [];
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
    wrap.innerHTML = '<div class="muted">Your cart is empty</div>';
    totalEl.innerText = '₱0';
    return;
  }
  cart.forEach((it, i)=>{
    total += it.price * it.qty;
    const row = document.createElement('div');
    row.className = 'mini-item';
    row.innerHTML = `<div style="display:flex;flex-direction:column"><div>${it.name}</div><div class="muted" style="font-size:13px">₱${it.price} each</div></div><div style="display:flex;align-items:center;gap:8px"><button onclick="changeQty(${i},-1)" class="qty-control">−</button><div>${it.qty}</div><button onclick="changeQty(${i},1)" class="qty-control">+</button><div style="min-width:8px"></div><div>₱${it.price * it.qty}</div></div>`;
    wrap.appendChild(row);
  });
  totalEl.innerText = '₱' + total;
}

/* UI helpers: favorites & category filter */
function attachUIHandlers(){
  // hearts
  document.querySelectorAll('.heart').forEach(heart => {
    heart.onclick = () => {
      heart.textContent = heart.textContent === '♡' ? '♥' : '♡';
      heart.style.color = heart.textContent === '♥' ? 'red' : '#333';
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

/* Place order from mini-cart: open modal stepper */
function placeOrderFromMini(){
  // Open combined checkout (payment + address) for faster flow
  openCheckoutModal(true);
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
