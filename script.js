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
const ADMIN_PASSWORD = "secret123";

// Локальные данные пользователя
let userData = JSON.parse(localStorage.getItem("userData")) || {
  balance: { stars: 1000, fiton: 500 },
  gifts: [] // каждый подарок: { ..., serial, source, enhanced, selectedModel, background }
};

let giftsDB = []; // подарки из Firebase

// DOM
const balanceStarsEl = document.getElementById("balance-stars");
const balanceFitonEl = document.getElementById("balance-fiton");
const mainContent = document.getElementById("main-content");

// === Обновление UI пользователя ===
function updateUserUI() {
  balanceStarsEl.textContent = userData.balance.stars;
  balanceFitonEl.textContent = userData.balance.fiton;
  localStorage.setItem("userData", JSON.stringify(userData));
}

// === Загрузка подарков из Firebase ===
function loadGiftsFromFirebase() {
  const giftsRef = database.ref("gifts");
  giftsRef.on("value", (snapshot) => {
    const data = snapshot.val();
    giftsDB = data ? Object.values(data) : [];
    renderCurrentPage();
  });
}

// === Определение текущей страницы ===
function renderCurrentPage() {
  if (mainContent.innerHTML.includes("Профиль")) {
    showProfilePage();
  } else if (mainContent.innerHTML.includes("Кейсы")) {
    showCasesPage();
  } else {
    showGiftsPage();
  }
}

// === ПОКУПКА В МАГАЗИНЕ ===
async function buyGift(giftId) {
  const gift = giftsDB.find(g => g.id == giftId);
  if (!gift) return alert("Подарок не найден");
  if (gift.currentMinted >= gift.totalSupply) return alert("Тираж исчерпан!");

  if (userData.balance.stars < (gift.stars || 0)) return alert("Не хватает Stars!");
  if (userData.balance.fiton < (gift.fiton || 0)) return alert("Не хватает FITON!");

  userData.balance.stars -= gift.stars || 0;
  userData.balance.fiton -= gift.fiton || 0;

  const serial = gift.currentMinted + 1;
  const giftRef = database.ref("gifts").child(gift.id.toString());
  await giftRef.update({ currentMinted: serial });

  userData.gifts.push({
    ...gift,
    serial: serial,
    source: "shop",
    enhanced: false,
    selectedModel: gift.models[0]
  });

  updateUserUI();
  alert(`✅ Получено: ${gift.name} #${serial}/${gift.totalSupply}!`);
  renderCurrentPage();
}

// === ОТКРЫТИЕ КЕЙСА ===
async function openCase(casePrice) {
  if (userData.balance.stars < casePrice) return alert(`Нужно ${casePrice} Stars!`);

  userData.balance.stars -= casePrice;
  updateUserUI();

  const availableGifts = giftsDB.filter(g => g.currentMinted < g.totalSupply);
  if (availableGifts.length === 0) return alert("Нет доступных подарков!");

  const randomGift = availableGifts[Math.floor(Math.random() * availableGifts.length)];
  const serial = randomGift.currentMinted + 1;
  const giftRef = database.ref("gifts").child(randomGift.id.toString());
  await giftRef.update({ currentMinted: serial });

  userData.gifts.push({
    ...randomGift,
    serial: serial,
    source: "case",
    enhanced: false,
    selectedModel: randomGift.models[0]
  });

  updateUserUI();
  alert(`🎉 Открыт кейс за ${casePrice}⭐!\nПолучено: ${randomGift.name} #${serial}/${randomGift.totalSupply}!`);
  showCasesPage();
}

// === УЛУЧШЕНИЕ ===
function enhanceGift(index) {
  const gift = userData.gifts[index];
  if (!gift) return;
  if (gift.enhanced) return alert("Уже улучшен!");
  if (userData.balance.stars < 50) return alert("Нужно 50 Stars!");

  userData.balance.stars -= 50;

  const randomModel = gift.models[Math.floor(Math.random() * gift.models.length)];
  const backgrounds = [
    "radial-gradient(circle, #ff9a9e, #fad0c4)",
    "radial-gradient(circle, #a1c4fd, #c2e9fb)",
    "radial-gradient(circle, #ffecd2, #fcb69f)",
    "radial-gradient(circle, #8fd3f4, #43e97b)",
    "radial-gradient(circle, #d299c2, #fef9d7)"
  ];
  const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  gift.enhanced = true;
  gift.selectedModel = randomModel;
  gift.background = randomBg;

  updateUserUI();
  showProfilePage();
  alert(`🚀 Улучшено!`);
}

// === "ПРОДАЖА" ===
function sellGift(index) {
  const gift = userData.gifts[index];
  if (!gift) return;

  let returnAmount = 0;
  if (gift.source === "shop") {
    returnAmount = Math.floor((gift.stars || 0) * 0.5);
  } else if (gift.source === "case") {
    returnAmount = Math.floor((gift.stars || 0) * (1.0 + Math.random() * 0.5));
  }

  userData.balance.stars += returnAmount;
  userData.gifts.splice(index, 1);
  updateUserUI();
  alert(`💰 Продано за ${returnAmount} Stars!`);
  showProfilePage();
}

// === СТРАНИЦЫ ===
function showGiftsPage() {
  let html = `<div class="chat-header">
    <div class="chat-avatar">🎁</div>
    <div class="chat-title">Магазин подарков</div>
  </div><div class="gifts-grid">`;

  giftsDB.forEach(gift => {
    const remaining = gift.totalSupply - gift.currentMinted;
    const img = gift.models[0] || "https://via.placeholder.com/100";
    html += `
      <div class="gift-card">
        <img src="${img}" style="width:80px;height:80px;object-fit:contain;margin-bottom:10px;">
        <h4>${gift.name}</h4>
        <div class="price">${gift.stars ? `⭐ ${gift.stars}` : `💎 ${gift.fiton}`}</div>
        <div style="font-size:12px;color:#aaa;">${remaining}/${gift.totalSupply}</div>
        ${remaining > 0 ? 
          `<button class="buy-btn" onclick="buyGift(${gift.id})">Купить</button>` : 
          `<button disabled>Тираж исчерпан</button>`}
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showCasesPage() {
  let html = `<div class="chat-header">
    <div class="chat-avatar">📦</div>
    <div class="chat-title">Кейсы</div>
  </div><div class="gifts-grid">`;

  [50, 100, 150, 200, 300].forEach(price => {
    html += `
      <div class="gift-card">
        <div style="font-size:48px;margin:10px 0;">📦</div>
        <h4>Кейс за ${price}⭐</h4>
        <div class="price">Любой NFT из коллекции!</div>
        <button class="buy-btn" onclick="openCase(${price})">Открыть</button>
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
    html += `<p style="padding:20px;color:#aaa;">Нет подарков</p>`;
  } else {
    html += `<div class="gifts-grid">`;
    userData.gifts.forEach((gift, index) => {
      const bg = gift.background || "var(--bg-secondary)";
      const sourceLabel = gift.source === "case" ? "📦 Из кейса" : "🛒 Из магазина";
      html += `
        <div class="gift-card" style="background:${bg};">
          <img src="${gift.selectedModel}" style="width:80px;height:80px;object-fit:contain;margin-bottom:8px;">
          <h4>${gift.name}</h4>
          <div class="price">№${gift.serial}/${gift.totalSupply}</div>
          <div style="font-size:12px;color:#aaa;">${sourceLabel}</div>
          ${!gift.enhanced ? 
            `<button class="buy-btn" onclick="enhanceGift(${index})">Улучшить (50⭐)</button>` : 
            `<div class="price">✅ Улучшен</div>`}
          <button class="buy-btn" style="background:#ff5555;" onclick="sellGift(${index})">Продать</button>
        </div>
      `;
    });
    html += `</div>`;
  }
  html += `</div>`;
  mainContent.innerHTML = html;
}

// === АДМИНКА ===
document.getElementById("btn-add-gift").addEventListener("click", async () => {
  const name = document.getElementById("gift-name").value.trim();
  const url1 = document.getElementById("url1").value.trim();
  const url2 = document.getElementById("url2").value.trim();
  const url3 = document.getElementById("url3").value.trim();
  const stars = parseInt(document.getElementById("gift-stars").value) || 0;
  const fiton = parseInt(document.getElementById("gift-fiton").value) || 0;
  const total = parseInt(document.getElementById("gift-total").value) || 100;

  if (!name || (stars === 0 && fiton === 0)) return alert("Заполните название и цену!");
  if (!url1) return alert("Нужен хотя бы 1 URL!");

  const models = [url1];
  if (url2) models.push(url2);
  if (url3) models.push(url3);

  const newGift = {
    id: Date.now(),
    name,
    models,
    stars,
    fiton,
    totalSupply: total,
    currentMinted: 0
  };

  await database.ref("gifts").push().set(newGift);
  alert("✅ Подарок добавлен для всех пользователей!");
});

// === ОСТАЛЬНЫЕ СОБЫТИЯ ===
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

// === НАВИГАЦИЯ ===
document.querySelectorAll(".chat").forEach(chat => {
  chat.addEventListener("click", () => {
    document.querySelectorAll(".chat").forEach(c => c.classList.remove("active"));
    chat.classList.add("active");
    const view = chat.dataset.view;
    if (view === "profile") showProfilePage();
    else if (view === "cases") showCasesPage();
    else showGiftsPage();
  });
});

// === ЗАПУСК ===
updateUserUI();
loadGiftsFromFirebase();
