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
  userId = "user_" + Date.now() + Math.floor(Math.random() * 1000);
  localStorage.setItem("userId", userId);
}

let publicProfile = {
  id: userId,
  username: "Игрок_" + userId.slice(-4),
  avatar: "https://placehold.co/100x100/5D3FD3/FFFFFF?text=👤"
};

let userData = JSON.parse(localStorage.getItem("userData")) || {
  balance: { stars: 1000, fiton: 500 },
  gifts: []
};

let giftsDB = [];
let allPublicProfiles = {};

const balanceStarsEl = document.getElementById("balance-stars");
const balanceFitonEl = document.getElementById("balance-fiton");
const mainContent = document.getElementById("main-content");

async function initApp() {
  await loadUserProfile();
  loadGiftsFromFirebase();
  loadAllProfiles();
  updateUserUI();
  showGiftsPage();
}

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

async function saveProfile() {
  await database.ref(`users/${userId}`).set(publicProfile);
  localStorage.setItem("publicProfile", JSON.stringify(publicProfile));
  alert("✅ Профиль обновлён!");
}

function loadAllProfiles() {
  database.ref("users").on("value", (snapshot) => {
    allPublicProfiles = snapshot.val() || {};
  });
}

function updateUserUI() {
  balanceStarsEl.textContent = userData.balance.stars;
  balanceFitonEl.textContent = userData.balance.fiton;
  localStorage.setItem("userData", JSON.stringify(userData));
}

function loadGiftsFromFirebase() {
  const giftsRef = database.ref("gifts");
  giftsRef.on("value", (snapshot) => {
    const data = snapshot.val();
    giftsDB = [];
    if (data) {
      Object.keys(data).forEach(key => {
        const gift = data[key];
        gift.firebaseKey = key;
        giftsDB.push(gift);
      });
    }
    if (!mainContent.innerHTML.includes("Профиль пользователя")) {
      renderCurrentPage();
    }
  });
}

function renderCurrentPage() {
  if (mainContent.innerHTML.includes("Кейсы")) showCasesPage();
  else if (mainContent.innerHTML.includes("Мой профиль")) showMyProfilePage();
  else showGiftsPage();
}

async function buyGift(firebaseKey) {
  const gift = giftsDB.find(g => g.firebaseKey === firebaseKey);
  if (!gift || gift.currentMinted >= gift.totalSupply) return alert("Недоступно");
  if (userData.balance.stars < (gift.stars || 0)) return alert("Не хватает Stars!");
  userData.balance.stars -= gift.stars || 0;
  const newMinted = gift.currentMinted + 1;
  await database.ref(`gifts/${firebaseKey}/currentMinted`).set(newMinted);
  gift.currentMinted = newMinted;
  userData.gifts.push({ ...gift, serial: newMinted, source: "shop", enhanced: false, selectedModel: gift.models[0] });
  updateUserUI();
  alert(`✅ Куплено: ${gift.name} #${newMinted}`);
  renderCurrentPage();
}

async function openCase(price) {
  if (userData.balance.stars < price) return alert("Не хватает Stars!");
  userData.balance.stars -= price;
  const available = giftsDB.filter(g => g.currentMinted < g.totalSupply);
  if (available.length === 0) return alert("Нет подарков!");
  const gift = available[Math.floor(Math.random() * available.length)];
  const newMinted = gift.currentMinted + 1;
  await database.ref(`gifts/${gift.firebaseKey}/currentMinted`).set(newMinted);
  gift.currentMinted = newMinted;
  userData.gifts.push({ ...gift, serial: newMinted, source: "case", enhanced: false, selectedModel: gift.models[0] });
  updateUserUI();
  alert(`🎉 Получено: ${gift.name} #${newMinted}`);
  showCasesPage();
}

function enhanceGift(index) {
  const gift = userData.gifts[index];
  if (!gift || gift.enhanced || userData.balance.stars < 50) return;
  userData.balance.stars -= 50;
  const randomModel = gift.models[Math.floor(Math.random() * gift.models.length)];
  const backgrounds = ["radial-gradient(circle, #ff9a9e, #fad0c4)", "radial-gradient(circle, #a1c4fd, #c2e9fb)", "radial-gradient(circle, #ffecd2, #fcb69f)", "radial-gradient(circle, #8fd3f4, #43e97b)", "radial-gradient(circle, #d299c2, #fef9d7)"];
  gift.enhanced = true;
  gift.selectedModel = randomModel;
  gift.background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  updateUserUI();
  showMyProfilePage();
  alert("🚀 Улучшено!");
}

function sellGift(index) {
  const gift = userData.gifts[index];
  if (!gift) return;
  const returnAmount = gift.source === "case" ? Math.floor((gift.stars || 0) * (1 + Math.random() * 0.5)) : Math.floor((gift.stars || 0) * 0.5);
  userData.balance.stars += returnAmount;
  userData.gifts.splice(index, 1);
  updateUserUI();
  showMyProfilePage();
  alert(`💰 Продано за ${returnAmount} Stars!`);
}

function showGiftsPage() {
  let html = `<div class="chat-header"><div class="chat-avatar">🎁</div><div class="chat-title">Магазин</div></div><div class="gifts-grid">`;
  giftsDB.forEach(gift => {
    const remaining = gift.totalSupply - gift.currentMinted;
    html += `
      <div class="gift-card">
        <img src="${gift.models[0]}" style="width:80px;height:80px;object-fit:contain;">
        <h4>${gift.name}</h4>
        <div class="price">${gift.stars ? `⭐ ${gift.stars}` : `💎 ${gift.fiton}`}</div>
        <div style="font-size:12px;color:#aaa;">${remaining}/${gift.totalSupply}</div>
        ${remaining > 0 ? `<button class="buy-btn" onclick="buyGift('${gift.firebaseKey}')">Купить</button>` : `<button disabled>Исчерпано</button>`}
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showCasesPage() {
  let html = `<div class="chat-header"><div class="chat-avatar">📦</div><div class="chat-title">Кейсы</div></div><div class="gifts-grid">`;
  [50,100,150,200,300].forEach(p => {
    html += `<div class="gift-card"><div style="font-size:48px;">📦</div><h4>Кейс за ${p}⭐</h4><button class="buy-btn" onclick="openCase(${p})">Открыть</button></div>`;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showMyProfilePage() {
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
    html += `<p style="padding:20px;color:#aaa;">Нет подарков</p>`;
  } else {
    html += `<div class="gifts-grid">`;
    userData.gifts.forEach((gift, i) => {
      const bg = gift.background || "var(--bg-secondary)";
      html += `
        <div class="gift-card" style="background:${bg};">
          <img src="${gift.selectedModel}" style="width:80px;height:80px;object-fit:contain;">
          <h4>${gift.name}</h4>
          <div class="price">№${gift.serial}/${gift.totalSupply}</div>
          ${!gift.enhanced ? `<button class="buy-btn" onclick="enhanceGift(${i})">Улучшить (50⭐)</button>` : `<div class="price">✅ Улучшен</div>`}
          <button class="buy-btn" style="background:#ff5555;" onclick="sellGift(${i})">Продать</button>
        </div>
      `;
    });
    html += `</div>`;
  }
  html += `</div>`;
  mainContent.innerHTML = html;
}

function updateMyProfile() {
  const newUsername = document.getElementById("edit-username").value.trim();
  const newAvatar = document.getElementById("edit-avatar").value.trim();
  if (!newUsername) return alert("Введите ник!");
  if (!newAvatar) return alert("Введите URL аватарки!");
  publicProfile.username = newUsername;
  publicProfile.avatar = newAvatar;
  saveProfile();
}

// Админка
document.getElementById("btn-add-gift").addEventListener("click", async () => {
  const name = document.getElementById("gift-name").value.trim();
  const url1 = document.getElementById("url1").value.trim();
  const url2 = document.getElementById("url2").value.trim();
  const url3 = document.getElementById("url3").value.trim();
  const stars = parseInt(document.getElementById("gift-stars").value) || 0;
  const fiton = parseInt(document.getElementById("gift-fiton").value) || 0;
  const total = parseInt(document.getElementById("gift-total").value) || 100;

  if (!name || (stars === 0 && fiton === 0)) return alert("Заполните данные!");
  if (!url1) return alert("Нужен хотя бы 1 URL!");

  const models = [url1, url2, url3].filter(x => x);
  await database.ref("gifts").push({
    id: Date.now(),
    models,
    stars,
    fiton,
    totalSupply: total,
    currentMinted: 0
  });
  alert("✅ Подарок добавлен!");
});

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
document.getElementById("btn-add-balance").addEventListener("click", () => {
  const addStars = parseInt(document.getElementById("add-stars").value) || 0;
  const addFiton = parseInt(document.getElementById("add-fiton").value) || 0;
  userData.balance.stars += addStars;
  userData.balance.fiton += addFiton;
  updateUserUI();
  alert("✅ Баланс пополнен!");
});

document.querySelectorAll(".chat").forEach(chat => {
  chat.addEventListener("click", () => {
    document.querySelectorAll(".chat").forEach(c => c.classList.remove("active"));
    chat.classList.add("active");
    const view = chat.dataset.view;
    if (view === "profile") showMyProfilePage();
    else if (view === "cases") showCasesPage();
    else showGiftsPage();
  });
});

initApp();
