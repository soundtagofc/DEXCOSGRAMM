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

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Админ-пароль (для пополнения баланса)
const ADMIN_PASSWORD = "Dexcos123";

// Локальные данные пользователя
let userData = JSON.parse(localStorage.getItem("userData")) || {
  balance: { stars: 1000, fiton: 500 },
  gifts: []
};

// Глобальные подарки (из Firebase)
let giftsDB = [];

// DOM
const balanceStarsEl = document.getElementById("balance-stars");
const balanceFitonEl = document.getElementById("balance-fiton");
const mainContent = document.getElementById("main-content");

// Обновление баланса (локально)
function updateUserUI() {
  balanceStarsEl.textContent = userData.balance.stars;
  balanceFitonEl.textContent = userData.balance.fiton;
  localStorage.setItem("userData", JSON.stringify(userData));
}

// Загрузка подарков из Firebase
function loadGiftsFromFirebase() {
  const giftsRef = database.ref("gifts");
  giftsRef.on("value", (snapshot) => {
    const data = snapshot.val();
    giftsDB = data ? Object.values(data) : [];
    if (mainContent.innerHTML.includes("NFT Подарки") || mainContent.innerHTML === "") {
      showGiftsPage();
    }
  });
}

// Покупка
function buyGift(giftId) {
  const gift = giftsDB.find(g => g.id == giftId);
  if (!gift) return alert("Подарок не найден");
  if (userData.balance.stars < (gift.stars || 0)) return alert("Не хватает Stars!");
  if (userData.balance.fiton < (gift.fiton || 0)) return alert("Не хватает FITON!");

  userData.balance.stars -= gift.stars || 0;
  userData.balance.fiton -= gift.fiton || 0;
  userData.gifts.push({
    ...gift,
    boughtAt: new Date().toISOString(),
    tier: 1,
    background: "radial-gradient(circle, #333, #111)"
  });

  updateUserUI();
  showGiftsPage();
  alert(`✅ Получено: ${gift.name}!`);
}

// Улучшение
function enhanceGift(index) {
  const gift = userData.gifts[index];
  if (!gift) return;
  gift.tier = (gift.tier || 1) + 1;
  const backgrounds = [
    "radial-gradient(circle, #ff9a9e, #fad0c4)",
    "radial-gradient(circle, #a1c4fd, #c2e9fb)",
    "radial-gradient(circle, #ffecd2, #fcb69f)",
    "radial-gradient(circle, #8fd3f4, #43e97b)",
    "radial-gradient(circle, #d299c2, #fef9d7)"
  ];
  gift.background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  gift.enhancedEmoji = ["✨", "🌟", "💫", "☄️", "🌠", "🎀", "🏆"][Math.floor(Math.random() * 7)];
  updateUserUI();
  showProfilePage();
  alert(`🚀 Улучшено до Tier ${gift.tier}!`);
}

// Страницы
function showGiftsPage() {
  let html = `<div class="chat-header">
    <div class="chat-avatar">🎁</div>
    <div class="chat-title">NFT Подарки</div>
  </div><div class="gifts-grid">`;

  giftsDB.forEach(gift => {
    html += `
      <div class="gift-card">
        <div style="font-size: 48px;">${gift.baseEmoji || "🎁"}</div>
        <h4>${gift.name}</h4>
        ${gift.stars ? `<div class="price">⭐ ${gift.stars}</div>` : ''}
        ${gift.fiton ? `<div class="price">💎 ${gift.fiton}</div>` : ''}
        <button class="buy-btn" onclick="buyGift(${gift.id})">Купить</button>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showProfilePage() {
  let html = `<div class="chat-header">
    <div class="chat-avatar">👤</div>
    <div class="chat-title">Ваш профиль</div>
  </div><div class="profile-section">
    <div class="balance-info">⭐ Stars: ${userData.balance.stars} | 💎 FITON: ${userData.balance.fiton}</div>
    <h3>Ваши NFT (${userData.gifts.length})</h3>`;

  if (userData.gifts.length === 0) {
    html += `<p style="padding: 20px; color: #aaa;">Нет подарков</p>`;
  } else {
    html += `<div class="gifts-grid">`;
    userData.gifts.forEach((gift, index) => {
      html += `
        <div class="gift-card" style="background: ${gift.background || 'var(--bg-secondary)'};">
          <div style="font-size: 48px;">${gift.enhancedEmoji || gift.baseEmoji || "🎁"}</div>
          <h4>${gift.name}</h4>
          <div class="price">Tier: ${gift.tier || 1}</div>
          <button class="buy-btn" onclick="enhanceGift(${index})">Улучшить</button>
        </div>
      `;
    });
    html += `</div>`;
  }
  html += `</div>`;
  mainContent.innerHTML = html;
}

// Навигация
document.querySelectorAll(".chat").forEach(chat => {
  chat.addEventListener("click", () => {
    document.querySelectorAll(".chat").forEach(c => c.classList.remove("active"));
    chat.classList.add("active");
    chat.dataset.view === "profile" ? showProfilePage() : showGiftsPage();
  });
});

// Админка
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

// Запуск
updateUserUI();
loadGiftsFromFirebase();
showGiftsPage();
