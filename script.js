// 🔑 ЗАМЕНИ ЭТОТ БЛОК НА СВОЙ ИЗ FIREBASE CONSOLE
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
const ADMIN_PASSWORD = "secret123";

let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  localStorage.setItem("userId", userId);
}

let currentUser = null;
let allUsers = {};
let giftsDB = [];

const balanceStarsEl = document.getElementById("balance-stars");
const mainContent = document.getElementById("main-content");

// === ИНИЦИАЛИЗАЦИЯ ===
async function initApp() {
  await ensureUserProfile();
  loadAllUsers();
  loadGifts();
  renderSidebar();
  showMyProfile();
}

// === АВТОПРОФИЛЬ ===
async function ensureUserProfile() {
  const userRef = database.ref(`users/${userId}`);
  const snapshot = await userRef.once("value");
  if (snapshot.exists()) {
    currentUser = snapshot.val();
  } else {
    currentUser = {
      nickname: "User_" + userId.split('_')[1].toUpperCase(),
      avatar: "👤",
      balance: { stars: 1000 },
      gifts: []
    };
    await userRef.set(currentUser);
  }
  balanceStarsEl.textContent = currentUser.balance.stars;
}

// === ЗАГРУЗКА ===
function loadAllUsers() {
  database.ref("users").on("value", (snapshot) => {
    allUsers = snapshot.val() || {};
  });
}

function loadGifts() {
  database.ref("gifts").on("value", (snapshot) => {
    const data = snapshot.val();
    giftsDB = data ? Object.keys(data).map(key => ({ ...data[key], key })) : [];
    
    const select = document.getElementById("admin-gift-select");
    if (select) {
      select.innerHTML = "";
      giftsDB.forEach(gift => {
        const option = document.createElement("option");
        option.value = gift.key;
        option.textContent = gift.name;
        select.appendChild(option);
      });
    }
  });
}

// === САЙДБАР ===
function renderSidebar() {
  const chatsList = document.getElementById("chats-list");
  chatsList.innerHTML = `
    <div class="chat-item active" data-view="profile">
      <div class="chat-avatar">👤</div>
      <div class="chat-info">
        <div class="chat-name">Мой профиль</div>
        <div class="chat-desc">Ваши NFT-подарки</div>
      </div>
    </div>
    <div class="chat-item" data-view="users">
      <div class="chat-avatar">👥</div>
      <div class="chat-info">
        <div class="chat-name">Пользователи</div>
        <div class="chat-desc">Список всех участников</div>
      </div>
    </div>
    <div class="chat-item" data-view="gifts">
      <div class="chat-avatar">🎁</div>
      <div class="chat-info">
        <div class="chat-name">Подарки</div>
        <div class="chat-desc">Купить или улучшить</div>
      </div>
    </div>
    <div class="chat-item" data-view="cases">
      <div class="chat-avatar">📦</div>
      <div class="chat-info">
        <div class="chat-name">Кейсы</div>
        <div class="chat-desc">Откройте редкий NFT</div>
      </div>
    </div>
  `;
  
  document.querySelectorAll(".chat-item").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".chat-item").forEach(c => c.classList.remove("active"));
      el.classList.add("active");
      const view = el.dataset.view;
      if (view === "profile") showMyProfile();
      else if (view === "users") showUserList();
      else if (view === "gifts") showGiftsPage();
      else if (view === "cases") showCasesPage();
    });
  });
}

// === СТРАНИЦЫ ===
function showMyProfile() {
  mainContent.innerHTML = `
    <div class="chat-header">
      <h2>👤 Мой профиль</h2>
    </div>
    <div style="margin-top:20px;">
      <p><strong>Ник:</strong> ${currentUser.nickname}</p>
      <p><strong>ID:</strong> ${userId}</p>
      <p><strong>Баланс:</strong> ⭐ ${currentUser.balance.stars}</p>
      <h3 style="margin-top:20px;">🎁 Мои подарки (${currentUser.gifts.length})</h3>
      ${currentUser.gifts.length === 0 ? 
        "<p style='color:#aaaaaa;'>Нет подарков</p>" : 
        currentUser.gifts.map(g => `<div style="margin:10px 0;padding:12px;background:#2f2f2f;border-radius:8px;">${g.name} #${g.serial}</div>`).join("")
      }
    </div>
  `;
}

function showUserList() {
  let html = "<h2>👥 Пользователи</h2>";
  Object.entries(allUsers).forEach(([uid, user]) => {
    html += `
      <div class="chat-item" onclick="showUserProfile('${uid}')">
        <div class="chat-avatar">${user.nickname.charAt(0)}</div>
        <div class="chat-info">
          <div class="chat-name">${user.nickname}</div>
          <div class="chat-desc">${uid}</div>
        </div>
      </div>
    `;
  });
  mainContent.innerHTML = html;
  document.querySelectorAll(".chat-item").forEach(el => {
    if (!el.dataset.view) {
      el.addEventListener("click", function() {
        const uid = this.getAttribute("onclick").match(/'([^']+)'/)[1];
        showUserProfile(uid);
      });
    }
  });
}

function showUserProfile(uid) {
  const user = allUsers[uid];
  if (!user) return;
  mainContent.innerHTML = `
    <h2>👤 ${user.nickname}</h2>
    <p><strong>ID:</strong> ${uid}</p>
    <p><strong>Баланс:</strong> ⭐ ${user.balance?.stars || 0}</p>
    <p><strong>Подарков:</strong> ${user.gifts?.length || 0}</p>
    <button class="btn" onclick="adminAddBalance('${uid}')">+ Баланс</button>
  `;
}

function showGiftsPage() {
  let html = `<h2>🎁 Подарки</h2><div class="gifts-grid">`;
  giftsDB.forEach(gift => {
    const remaining = gift.totalSupply - (gift.currentMinted || 0);
    html += `
      <div class="gift-card">
        <img src="${gift.models?.[0] || 'https://placehold.co/100x100/555/white?text=?'}">
        <h3>${gift.name}</h3>
        <div class="gift-price">⭐ ${gift.stars || 0}</div>
        <div style="font-size:13px;color:#aaaaaa;">${remaining}/${gift.totalSupply}</div>
        <button class="btn" onclick="buyGift('${gift.key}')">Купить</button>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showCasesPage() {
  let html = `<h2>📦 Кейсы</h2><div class="gifts-grid">`;
  [50, 100, 150].forEach(price => {
    html += `
      <div class="gift-card">
        <div style="font-size:48px;margin:10px 0;">📦</div>
        <h3>Кейс за ${price}⭐</h3>
        <button class="btn" onclick="openCase(${price})">Открыть</button>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

// === ФУНКЦИИ ===
async function buyGift(giftKey) {
  const gift = giftsDB.find(g => g.key === giftKey);
  if (!gift || (gift.currentMinted || 0) >= gift.totalSupply) return alert("Нет в наличии");
  if (currentUser.balance.stars < gift.stars) return alert("Не хватает Stars");

  currentUser.balance.stars -= gift.stars;
  const serial = (gift.currentMinted || 0) + 1;
  await database.ref(`gifts/${giftKey}/currentMinted`).set(serial);

  currentUser.gifts.push({
    giftKey,
    name: gift.name,
    models: gift.models,
    serial: serial,
    source: "shop",
    selectedModel: gift.models[0]
  });

  await database.ref(`users/${userId}`).update({
    balance: currentUser.balance,
    gifts: currentUser.gifts
  });
  balanceStarsEl.textContent = currentUser.balance.stars;
  alert(`✅ Куплено: ${gift.name} #${serial}`);
  showGiftsPage();
}

async function openCase(price) {
  if (currentUser.balance.stars < price) return alert(`Нужно ${price} Stars!`);
  currentUser.balance.stars -= price;
  balanceStarsEl.textContent = currentUser.balance.stars;

  const available = giftsDB.filter(g => (g.currentMinted || 0) < g.totalSupply);
  if (available.length === 0) return alert("Нет подарков");

  const gift = available[Math.floor(Math.random() * available.length)];
  const serial = (gift.currentMinted || 0) + 1;
  await database.ref(`gifts/${gift.key}/currentMinted`).set(serial);

  currentUser.gifts.push({
    giftKey: gift.key,
    name: gift.name,
    models: gift.models,
    serial: serial,
    source: "case",
    selectedModel: gift.models[0]
  });

  await database.ref(`users/${userId}`).update({
    balance: currentUser.balance,
    gifts: currentUser.gifts
  });
  alert(`🎉 Выпало: ${gift.name} #${serial}`);
  showCasesPage();
}

async function adminAddBalance(uid) {
  const stars = prompt("Сколько Stars?", "100");
  if (stars === null) return;
  const amount = parseInt(stars);
  if (isNaN(amount)) return;

  const userRef = database.ref(`users/${uid}/balance`);
  const balance = (await userRef.once("value")).val() || { stars: 0 };
  balance.stars += amount;
  await userRef.set(balance);
  alert("✅ Баланс пополнен!");
}

// === АДМИНКА ===
document.getElementById("btn-admin").addEventListener("click", () => {
  document.getElementById("admin-modal").classList.add("active");
});

document.querySelector(".modal-close").addEventListener("click", () => {
  document.getElementById("admin-modal").classList.remove("active");
});

document.getElementById("btn-login-admin").addEventListener("click", () => {
  if (document.getElementById("admin-pass").value === ADMIN_PASSWORD) {
    document.getElementById("admin-login").classList.add("hidden");
    document.getElementById("admin-actions").classList.remove("hidden");
  } else {
    alert("❌ Неверный пароль!");
  }
});

document.getElementById("btn-give-gift").addEventListener("click", async () => {
  const uid = document.getElementById("admin-target-id").value.trim();
  const giftKey = document.getElementById("admin-gift-select").value;
  if (!allUsers[uid]) return alert("Пользователь не найден");
  const gift = giftsDB.find(g => g.key === giftKey);
  if (!gift) return alert("Подарок не найден");

  const serial = (gift.currentMinted || 0) + 1;
  await database.ref(`gifts/${giftKey}/currentMinted`).set(serial);

  const userRef = database.ref(`users/${uid}`);
  const userData = (await userRef.once("value")).val();
  userData.gifts = userData.gifts || [];
  userData.gifts.push({
    giftKey,
    name: gift.name,
    models: gift.models,
    serial: serial,
    source: "admin",
    selectedModel: gift.models[0]
  });
  await userRef.update({ gifts: userData.gifts });
  alert("✅ Подарок выдан!");
});

document.getElementById("btn-add-balance").addEventListener("click", async () => {
  const uid = document.getElementById("admin-target-id2").value.trim();
  const stars = parseInt(document.getElementById("admin-add-stars").value) || 0;
  if (!allUsers[uid]) return alert("Пользователь не найден");

  const userRef = database.ref(`users/${uid}/balance`);
  const balance = (await userRef.once("value")).val() || { stars: 0 };
  balance.stars += stars;
  await userRef.set(balance);
  alert("✅ Баланс пополнен!");
});

// === ЗАПУСК ===
initApp();

// Глобальные функции для inline onclick
window.showUserProfile = showUserProfile;
window.adminAddBalance = adminAddBalance;
window.buyGift = buyGift;
window.openCase = openCase;
