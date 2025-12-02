// 🔑 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBiDLi2kyKzL1BsuF8o-qcFHGg7H9eBY1g",
  authDomain: "deedededxx.firebaseapp.com",
  databaseURL: "https://deedededxx-default-rtdb.firebaseio.com",
  projectId: "deedededxx",
  storageBucket: "deedededxx.firebasestorage.app",
  messagingSenderId: "1076226377016",
  appId: "1:1076226377016:web:2125d9c6b4fc3b7d5f2dcd"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// === Telegram User Init ===
let publicProfile, userId;
if (typeof window.Telegram?.WebApp !== "undefined") {
  const tg = window.Telegram.WebApp;
  tg.expand();
  tg.ready();
  const user = tg.initDataUnsafe?.user;
  if (user) {
    userId = "tg_" + user.id;
    publicProfile = {
      id: userId,
      username: user.username || ("Игрок_" + user.id.toString().slice(-4)),
      avatar: user.photo_url || "https://placehold.co/100x100/5D3FD3/FFFFFF?text=👤"
    };
  } else {
    userId = "guest_" + Date.now();
    publicProfile = { id: userId, username: "Гость", avatar: "https://placehold.co/100x100/555555/FFFFFF?text=❓" };
  }
} else {
  userId = localStorage.getItem("userId") || ("dev_" + Date.now());
  publicProfile = {
    id: userId,
    username: "Разработчик",
    avatar: "https://placehold.co/100x100/333333/FFFFFF?text=🛠️"
  };
}
localStorage.setItem("userId", userId);

// === User Data ===
let userData = JSON.parse(localStorage.getItem("userData")) || {
  balance: { stars: 1000, fiton: 500 },
  gifts: []
};

let giftsDB = [];
let isInitialized = false;

const balanceStarsEl = document.getElementById("balance-stars");
const balanceFitonEl = document.getElementById("balance-fiton");
const mainContent = document.getElementById("main-content");
const chatsList = document.getElementById("chats-list");

// === Init App ===
async function initApp() {
  await loadUserProfile();
  loadGiftsFromFirebase();
  updateUserUI();

  // Показать админку только для ID 6951407766
  const btnAdmin = document.getElementById("btn-admin");
  if (btnAdmin) {
    btnAdmin.style.display = (publicProfile.id === "tg_6951407766") ? "block" : "none";
  }

  // Запустить симуляцию цен
  startPriceSimulation();

  // Показать начальную страницу
  showGiftsPage();
  isInitialized = true;
}

// === Load Profile ===
async function loadUserProfile() {
  const profileRef = database.ref(`users/${userId}`);
  const snapshot = await profileRef.once("value");
  if (snapshot.exists()) {
    publicProfile = snapshot.val();
  } else {
    await profileRef.set(publicProfile);
  }
  localStorage.setItem("publicProfile", JSON.stringify(publicProfile));
}

// === Save Profile ===
async function saveProfile() {
  await database.ref(`users/${userId}`).set(publicProfile);
  localStorage.setItem("publicProfile", JSON.stringify(publicProfile));
  alert("✅ Профиль обновлён!");
}

// === Update UI ===
function updateUserUI() {
  if (balanceStarsEl) balanceStarsEl.textContent = userData.balance.stars;
  if (balanceFitonEl) balanceFitonEl.textContent = userData.balance.fiton;
  localStorage.setItem("userData", JSON.stringify(userData));
}

// === Load Gifts ===
function loadGiftsFromFirebase() {
  database.ref("gifts").on("value", (snapshot) => {
    const data = snapshot.val();
    giftsDB = data ? Object.entries(data).map(([key, val]) => ({ ...val, firebaseKey: key })) : [];
    if (isInitialized && window.location.hash === "#gifts") {
      showGiftsPage();
    }
  });
}

// === Price Simulation (for enhanced NFTs) ===
function startPriceSimulation() {
  setInterval(() => {
    let updated = false;
    userData.gifts.forEach(gift => {
      if (gift.enhanced) {
        const volatility = 0.03;
        const change = (Math.random() - 0.5) * volatility * 2;
        gift.multiplier = Math.max(0.01, gift.multiplier + change);
        gift.multiplier = parseFloat(gift.multiplier.toFixed(4));
        updated = true;
      }
    });
    if (updated && window.location.hash === "#profile") {
      showMyProfilePage();
    }
  }, 10000);
}

// === Buy Gift ===
async function buyGift(firebaseKey) {
  const gift = giftsDB.find(g => g.firebaseKey === firebaseKey);
  if (!gift || gift.currentMinted >= gift.totalSupply) return alert("Недоступно");
  if (userData.balance.stars < (gift.stars || 0)) return alert("Не хватает Stars!");

  userData.balance.stars -= gift.stars || 0;
  const newMinted = gift.currentMinted + 1;
  await database.ref(`gifts/${firebaseKey}/currentMinted`).set(newMinted);
  gift.currentMinted = newMinted;

  const baseValue = gift.stars || gift.fiton || 100;
  const multiplier = parseFloat((0.8 + Math.random() * 0.5).toFixed(4));

  userData.gifts.push({
    ...gift,
    serial: newMinted,
    source: "shop",
    enhanced: false,
    selectedModel: gift.models?.[0] || "https://placehold.co/80x80/444444/FFFFFF?text=?",
    multiplier,
    baseValue
  });
  updateUserUI();
  alert(`✅ Куплено: ${gift.name} #${newMinted}`);
  showGiftsPage();
}

// === Open Case ===
async function openCase(price) {
  if (userData.balance.stars < price) return alert("Не хватает Stars!");
  if (![500, 1000].includes(price)) return;

  userData.balance.stars -= price;
  const available = giftsDB.filter(g => g.currentMinted < g.totalSupply);
  if (!available.length) return alert("Нет подарков!");

  const gift = available[Math.floor(Math.random() * available.length)];
  const newMinted = gift.currentMinted + 1;
  await database.ref(`gifts/${gift.firebaseKey}/currentMinted`).set(newMinted);
  gift.currentMinted = newMinted;

  const baseValue = gift.stars || gift.fiton || 100;
  let multiplier;
  const roll = Math.random();

  if (price === 1000) {
    if (roll < 0.02) multiplier = 2.5 + Math.random() * 0.5;
    else if (roll < 0.1) multiplier = 1.5 + Math.random() * 1.0;
    else if (roll < 0.4) multiplier = 1.0 + Math.random() * 0.5;
    else multiplier = 0.3 + Math.random() * 0.7;
  } else {
    if (roll < 0.01) multiplier = 2.5 + Math.random() * 0.5;
    else if (roll < 0.05) multiplier = 1.5 + Math.random() * 1.0;
    else if (roll < 0.2) multiplier = 1.0 + Math.random() * 0.5;
    else multiplier = 0.3 + Math.random() * 0.7;
  }

  userData.gifts.push({
    ...gift,
    serial: newMinted,
    source: "case",
    enhanced: false,
    selectedModel: gift.models?.[0] || "https://placehold.co/80x80/444444/FFFFFF?text=?",
    multiplier: parseFloat(multiplier.toFixed(4)),
    baseValue
  });
  updateUserUI();
  showCasesPage();
}

// === Enhance Gift ===
function enhanceGift(index) {
  const gift = userData.gifts[index];
  if (!gift || gift.enhanced) return alert("Уже улучшено!");
  if (userData.balance.stars < 50) return alert("Нужно 50⭐");
  const altModels = gift.models?.slice(1) || [];
  if (altModels.length === 0) return alert("Нет моделей для улучшения!");

  userData.balance.stars -= 50;
  gift.enhanced = true;
  gift.selectedModel = altModels[Math.floor(Math.random() * altModels.length)];
  gift.background = [
    "radial-gradient(circle, #ff9a9e, #fad0c4)",
    "radial-gradient(circle, #a1c4fd, #c2e9fb)",
    "radial-gradient(circle, #ffecd2, #fcb69f)",
    "radial-gradient(circle, #8fd3f4, #43e97b)",
    "radial-gradient(circle, #d299c2, #fef9d7)"
  ][Math.floor(Math.random() * 5)];

  updateUserUI();
  showMyProfilePage();
  alert("🚀 NFT улучшен! Теперь его цена колеблется как криптовалюта!");
}

// === Sell Gift ===
function sellGift(index) {
  const gift = userData.gifts[index];
  if (!gift) return;
  const value = Math.floor(gift.baseValue * gift.multiplier);
  userData.balance.stars += value;
  userData.gifts.splice(index, 1);
  updateUserUI();
  showMyProfilePage();
  alert(`💰 Продано за ${value} Stars!`);
}

// === Update Profile ===
function updateMyProfile() {
  const usernameInput = document.getElementById("edit-username");
  const avatarInput = document.getElementById("edit-avatar");
  if (!usernameInput || !avatarInput) return;

  const newUsername = usernameInput.value.trim();
  const newAvatar = avatarInput.value.trim();
  if (!newUsername) return alert("Введите ник!");
  if (!newAvatar) return alert("Введите URL аватарки!");

  publicProfile.username = newUsername;
  publicProfile.avatar = newAvatar;
  saveProfile();
}

// === Page Renderers ===
function showGiftsPage() {
  window.location.hash = "#gifts";
  let html = `<div class="chat-header"><div class="chat-avatar">🎁</div><div class="chat-title">Магазин</div></div><div class="gifts-grid">`;
  giftsDB.forEach(gift => {
    const rem = gift.totalSupply - gift.currentMinted;
    const img = gift.models?.[0] || "https://placehold.co/80x80/444444/FFFFFF?text=?";
    html += `
      <div class="gift-card">
        <img src="${img}" style="width:80px;height:80px;object-fit:contain;">
        <h4>${gift.name}</h4>
        <div class="price">${gift.stars ? `⭐ ${gift.stars}` : `💎 ${gift.fiton}`}</div>
        <div style="font-size:12px;color:#aaa;">${rem}/${gift.totalSupply}</div>
        ${rem > 0 ? `<button class="buy-btn" onclick="buyGift('${gift.firebaseKey}')">Купить</button>` : `<button disabled>Исчерпано</button>`}
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showCasesPage() {
  window.location.hash = "#cases";
  mainContent.innerHTML = `
    <div class="chat-header"><div class="chat-avatar">📦</div><div class="chat-title">Кейсы</div></div>
    <div class="gifts-grid">
      <div class="gift-card">
        <div style="font-size:48px;">📦</div>
        <h4>Кейс «Стандарт»</h4>
        <div class="price">500⭐</div>
        <button class="buy-btn" onclick="openCase(500)">Открыть</button>
      </div>
      <div class="gift-card" style="border: 2px solid gold; background: rgba(255,215,0,0.1);">
        <div style="font-size:48px;">💎</div>
        <h4>Кейс «Премиум»</h4>
        <div class="price">1000⭐</div>
        <button class="buy-btn" style="background: gold; color: #000;" onclick="openCase(1000)">Открыть</button>
      </div>
    </div>
  `;
}

function showMyProfilePage() {
  window.location.hash = "#profile";
  let html = `
    <div class="chat-header">
      <img src="${publicProfile.avatar}" style="width:40px;height:40px;border-radius:50%;">
      <div class="chat-title">Мой профиль</div>
    </div>
    <div class="profile-section">
      <div class="balance-info">⭐ Stars: ${userData.balance.stars} | 💎 FITON: ${userData.balance.fiton}</div>
      
      <h3>Редактировать профиль</h3>
      <input type="text" id="edit-username" value="${publicProfile.username}" placeholder="Никнейм">
      <input type="url" id="edit-avatar" value="${publicProfile.avatar}" placeholder="URL аватарки">
      <button class="buy-btn" onclick="updateMyProfile()">Сохранить</button>

      <h3 style="margin-top:20px;">Мои NFT (${userData.gifts.length})</h3>
  `;

  if (userData.gifts.length === 0) {
    html += `<p style="padding:20px;text-align:center;color:#aaa;">Нет подарков</p>`;
  } else {
    html += `<div class="gifts-grid">`;
    userData.gifts.forEach((gift, i) => {
      const currentPrice = Math.floor(gift.baseValue * gift.multiplier);
      const priceDiff = currentPrice - (gift._prevPrice || currentPrice);
      const priceClass = priceDiff > 0 ? "up" : priceDiff < 0 ? "down" : "";
      gift._prevPrice = currentPrice;

      const bg = gift.background || "var(--bg-tertiary)";
      const model = gift.selectedModel || (gift.models?.[0] || "https://placehold.co/80x80/444444/FFFFFF?text=?");

      html += `
        <div class="gift-card" style="background:${bg};">
          <img src="${model}" style="width:80px;height:80px;object-fit:contain;">
          <h4>${gift.name}</h4>
          <div class="price ${priceClass}">${currentPrice}⭐</div>
          <div style="font-size:11px;color:#aaa;">${gift.multiplier.toFixed(2)}x</div>
          ${!gift.enhanced ? `<button class="buy-btn" onclick="enhanceGift(${i})">Улучшить (50⭐)</button>` : `<div class="price">✅ Активен</div>`}
          <button class="buy-btn" style="background:#ff5555;" onclick="sellGift(${i})">Продать</button>
        </div>
      `;
    });
    html += `</div>`;
  }
  html += `</div>`;
  mainContent.innerHTML = html;
}

// === Navigation ===
if (chatsList) {
  chatsList.addEventListener("click", (e) => {
    const chat = e.target.closest(".chat");
    if (!chat) return;

    document.querySelectorAll(".chat").forEach(c => c.classList.remove("active"));
    chat.classList.add("active");

    const view = chat.dataset.view;
    if (view === "profile") showMyProfilePage();
    else if (view === "cases") showCasesPage();
    else showGiftsPage();
  });
}

// === Hash Handling (optional, but safe) ===
window.addEventListener("hashchange", () => {
  if (!isInitialized) return;
  if (window.location.hash === "#cases") showCasesPage();
  else if (window.location.hash === "#profile") showMyProfilePage();
  else showGiftsPage();
});

// === Start App ===
initApp();
