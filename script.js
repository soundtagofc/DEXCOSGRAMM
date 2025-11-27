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

// Генерация уникального ID
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
  setupNavigation();
  showMyProfile();
}

// === АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ПРОФИЛЯ ===
async function ensureUserProfile() {
  const userRef = database.ref(`users/${userId}`);
  const snapshot = await userRef.once("value");
  if (snapshot.exists()) {
    currentUser = snapshot.val();
  } else {
    currentUser = {
      nickname: "User_" + userId.split('_')[1].toUpperCase(),
      avatar: "https://placehold.co/100x100/444/white?text=👤",
      balance: { stars: 1000 },
      gifts: []
    };
    await userRef.set(currentUser);
  }
  updateUserUI();
}

// === ЗАГРУЗКА ДАННЫХ ===
function loadAllUsers() {
  database.ref("users").on("value", (snapshot) => {
    allUsers = snapshot.val() || {};
  });
}

function loadGifts() {
  database.ref("gifts").on("value", (snapshot) => {
    const data = snapshot.val();
    giftsDB = data ? Object.keys(data).map(key => ({ ...data[key], key })) : [];
    
    // Обновляем админку
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

// === UI ===
function updateUserUI() {
  if (currentUser) {
    balanceStarsEl.textContent = currentUser.balance.stars;
  }
}

function setupNavigation() {
  document.querySelectorAll(".chat").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".chat").forEach(c => c.classList.remove("active"));
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
  let html = `
    <div class="chat-header">
      <img src="${currentUser.avatar}" onerror="this.src='https://placehold.co/100x100/444/white?text=👤'">
      <div>
        <div class="chat-title">${currentUser.nickname}</div>
        <div style="font-size:13px;color:#aaa;">ID: ${userId}</div>
      </div>
      <button onclick="editProfile()" style="margin-left:auto;background:#444;border:none;color:white;padding:6px 12px;border-radius:4px;">✏️</button>
    </div>
    <div style="padding:20px;">
      <h3>💰 Баланс</h3>
      <p>⭐ Stars: ${currentUser.balance.stars}</p>
      
      <h3 style="margin-top:20px;">🎁 Мои подарки (${currentUser.gifts.length})</h3>
      ${currentUser.gifts.length === 0 ? 
        "<p style='color:#aaa;'>Нет подарков</p>" : 
        currentUser.gifts.map(g => `<div style="margin:10px 0;padding:10px;background:#333;border-radius:8px;">🎁 ${g.name} #${g.serial}</div>`).join("")
      }
    </div>
  `;
  mainContent.innerHTML = html;
}

function showUserList() {
  let html = `<div class="chat-header"><div class="chat-title">👥 Пользователи</div></div><div style="padding:20px;">`;
  Object.entries(allUsers).forEach(([uid, user]) => {
    html += `
      <div class="chat" onclick="showUserProfile('${uid}')">
        <div class="chat-avatar">${user.nickname.charAt(0)}</div>
        <div class="chat-info">
          <div class="chat-name">${user.nickname}</div>
          <div style="font-size:12px;color:#aaa;">${uid}</div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showUserProfile(uid) {
  const user = allUsers[uid];
  if (!user) return alert("Пользователь не найден");
  
  let html = `
    <div class="chat-header">
      <div class="chat-avatar">${user.nickname.charAt(0)}</div>
      <div class="chat-title">${user.nickname}</div>
    </div>
    <div style="padding:20px;">
      <p><strong>ID:</strong> ${uid}</p>
      <p><strong>Баланс:</strong> ⭐ ${user.balance?.stars || 0}</p>
      <p><strong>Подарков:</strong> ${user.gifts?.length || 0}</p>
      <button onclick="adminAddBalance('${uid}')" style="background:#4CAF50;color:white;border:none;padding:10px;border-radius:6px;margin-top:15px;">+ Баланс</button>
    </div>
  `;
  mainContent.innerHTML = html;
}

function showGiftsPage() {
  let html = `<div class="chat-header"><div class="chat-title">🎁 Подарки</div></div><div class="gifts-grid">`;
  giftsDB.forEach(gift => {
    const remaining = gift.totalSupply - (gift.currentMinted || 0);
    html += `
      <div class="gift-card">
        <img src="${gift.models?.[0] || 'https://placehold.co/80x80/555/white?text=?'}">
        <h4>${gift.name}</h4>
        <div class="price">⭐ ${gift.stars || 0}</div>
        <div style="font-size:12px;color:#aaa;">${remaining}/${gift.totalSupply}</div>
        <button class="buy-btn" onclick="buyGift('${gift.key}')">Купить</button>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showCasesPage() {
  let html = `<div class="chat-header"><div class="chat-title">📦 Кейсы</div></div><div class="gifts-grid">`;
  [50, 100, 150].forEach(price => {
    html += `
      <div class="gift-card">
        <div style="font-size:48px;margin:10px 0;">📦</div>
        <h4>Кейс за ${price}⭐</h4>
        <button class="buy-btn" onclick="openCase(${price})">Открыть</button>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

// === ФУНКЦИИ ===
async function editProfile() {
  const nick = prompt("Ваш ник:", currentUser.nickname);
  const avatar = prompt("URL аватарки:", currentUser.avatar);
  if (nick !== null) currentUser.nickname = nick;
  if (avatar !== null) currentUser.avatar = avatar;

  await database.ref(`users/${userId}`).update({
    nickname: currentUser.nickname,
    avatar: currentUser.avatar
  });
  showMyProfile();
}

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
    enhanced: false,
    selectedModel: gift.models[0]
  });

  await database.ref(`users/${userId}`).update({
    balance: currentUser.balance,
    gifts: currentUser.gifts
  });
  updateUserUI();
  alert(`✅ Куплено: ${gift.name} #${serial}`);
  showGiftsPage();
}

async function openCase(price) {
  if (currentUser.balance.stars < price) return alert(`Нужно ${price} Stars!`);
  currentUser.balance.stars -= price;
  updateUserUI();

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
    enhanced: false,
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
  const stars = prompt("Сколько Stars добавить?", "100");
  if (stars === null) return;
  const amount = parseInt(stars);
  if (isNaN(amount)) return alert("Введите число");

  const userRef = database.ref(`users/${uid}/balance`);
  const balance = (await userRef.once("value")).val() || { stars: 0 };
  balance.stars += amount;
  await userRef.set(balance);
  alert(`✅ Баланс пополнен!`);
}

// === АДМИНКА ===
document.getElementById("btn-admin").addEventListener("click", () => {
  document.getElementById("admin-modal").classList.add("active");
});

document.querySelector(".close").addEventListener("click", () => {
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
    enhanced: false,
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
