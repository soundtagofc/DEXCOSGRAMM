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

// Уникальный ID пользователя
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

// === Инициализация ===
async function initApp() {
  await ensureUserProfile();
  loadAllUsers();
  loadGifts();
  initSidebar();
  showMyProfile();
}

// === Создание профиля ===
async function ensureUserProfile() {
  const userRef = database.ref(`users/${userId}`);
  const snapshot = await userRef.once("value");
  if (snapshot.exists()) {
    currentUser = snapshot.val();
  } else {
    currentUser = {
      nickname: "User_" + userId.split('_')[1],
      avatar: "https://placehold.co/100x100/444/white?text=👤",
      balance: { stars: 1000 },
      gifts: []
    };
    await userRef.set(currentUser);
  }
  updateUserUI();
}

// === Загрузка данных ===
function loadAllUsers() {
  database.ref("users").on("value", (snapshot) => {
    allUsers = snapshot.val() || {};
  });
}

function loadGifts() {
  database.ref("gifts").on("value", (snapshot) => {
    const data = snapshot.val();
    giftsDB = data ? Object.keys(data).map(key => ({ ...data[key], key })) : [];
  });
}

// === UI ===
function updateUserUI() {
  if (!currentUser) return;
  balanceStarsEl.textContent = currentUser.balance.stars;
}

// === Страницы ===
function showMyProfile() {
  let html = `<div class="chat-header">
    <img src="${currentUser.avatar}" onerror="this.src='https://placehold.co/100x100/444/white?text=👤'">
    <div>
      <div class="chat-title">${currentUser.nickname}</div>
      <div class="chat-preview">ID: ${userId}</div>
    </div>
    <button onclick="editProfile()" style="margin-left:auto;background:#444;border:none;color:white;padding:4px 8px;border-radius:4px;">✏️</button>
  </div>
  <div class="gifts-grid">`;

  currentUser.gifts.forEach((gift, i) => {
    html += `
      <div class="gift-card">
        <img src="${gift.selectedModel}" onerror="this.src='https://placehold.co/80x80/555/white?text=?'">
        <div>${gift.name}</div>
        <div style="font-size:12px;">№${gift.serial}</div>
        <button class="buy-btn" onclick="selfGiveGift('${gift.giftKey}')">Выдать себе</button>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showUserList() {
  let html = `<div class="chat-header"><div class="chat-title">👥 Все пользователи</div></div><div style="padding:16px;">`;
  Object.entries(allUsers).forEach(([uid, user]) => {
    html += `
      <div class="chat" onclick="showUserProfile('${uid}')">
        <img class="chat-avatar" src="${user.avatar}" onerror="this.src='https://placehold.co/40x40/444/white?text=👤'">
        <div class="chat-info">
          <div class="chat-name">${user.nickname}</div>
          <div class="chat-preview">${uid}</div>
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
  let html = `<div class="chat-header">
    <img src="${user.avatar}" onerror="this.src='https://placehold.co/100x100/444/white?text=👤'">
    <div class="chat-title">${user.nickname}</div>
  </div>
  <div style="padding:16px;">
    <p><strong>ID:</strong> ${uid}</p>
    <p><strong>Баланс:</strong> ⭐ ${user.balance?.stars || 0}</p>
    <button onclick="adminAddBalance('${uid}')" style="background:#4CAF50;color:white;border:none;padding:8px;border-radius:4px;margin-top:10px;">+ Баланс</button>
  </div>`;
  mainContent.innerHTML = html;
}

function showGiftsPage() {
  let html = `<div class="chat-header"><div class="chat-title">🎁 Подарки</div></div><div class="gifts-grid">`;
  giftsDB.forEach(gift => {
    html += `
      <div class="gift-card">
        <img src="${gift.models?.[0] || 'https://placehold.co/80x80/555/white?text=?'}">
        <div>${gift.name}</div>
        <div class="price">⭐ ${gift.stars || 0}</div>
        <button class="buy-btn" onclick="selfGiveGift('${gift.key}')">Выдать себе</button>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

// === Функции ===
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

async function selfGiveGift(giftKey) {
  const gift = giftsDB.find(g => g.key === giftKey);
  if (!gift) return alert("Подарок не найден");

  const serial = (gift.currentMinted || 0) + 1;
  await database.ref(`gifts/${giftKey}/currentMinted`).set(serial);

  currentUser.gifts.push({
    giftKey,
    name: gift.name,
    models: gift.models,
    serial: serial,
    source: "self",
    selectedModel: gift.models[0]
  });

  await database.ref(`users/${userId}`).update({
    gifts: currentUser.gifts
  });
  alert(`✅ Выдано: ${gift.name} #${serial}`);
  showMyProfile();
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
  alert(`✅ Баланс пополнен на ${amount} Stars!`);
}

// === Сайдбар ===
function initSidebar() {
  const chats = document.getElementById("chats-list");
  chats.innerHTML = `
    <div class="chat active" onclick="showMyProfile()">👤 Мой профиль</div>
    <div class="chat" onclick="showUserList()">👥 Пользователи</div>
    <div class="chat" onclick="showGiftsPage()">🎁 Подарки</div>
  `;
}

// === Админка UI ===
document.getElementById("btn-admin").addEventListener("click", () => {
  document.getElementById("admin-modal").classList.remove("hidden");
});
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("admin-modal").classList.add("hidden");
});
document.getElementById("btn-login-admin").addEventListener("click", () => {
  if (document.getElementById("admin-pass").value === ADMIN_PASSWORD) {
    document.getElementById("admin-login").classList.add("hidden");
    document.getElementById("admin-actions").classList.remove("hidden");
  } else {
    alert("❌ Неверный пароль!");
  }
});

// === ЗАПУСК ===
initApp();
