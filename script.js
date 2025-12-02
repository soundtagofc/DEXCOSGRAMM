// === Firebase === //
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

let publicProfile, userId, userData, giftsDB = [], isAppReady = false;

// === Инициализация пользователя ===
function initUser() {
  if (typeof window.Telegram?.WebApp !== "undefined") {
    const tg = window.Telegram.WebApp;
    tg.expand(); tg.ready();
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
    publicProfile = { id: userId, username: "Разработчик", avatar: "https://placehold.co/100x100/333333/FFFFFF?text=🛠️" };
  }
  localStorage.setItem("userId", userId);
}

// === Инициализация данных игрока ===
function initUserData() {
  userData = JSON.parse(localStorage.getItem("userData")) || {
    balance: { stars: 1000, fiton: 500 },
    gifts: []
  };
}

// === Обновление UI баланса ===
function updateUI() {
  const balanceStarsEl = document.getElementById("balance-stars");
  const balanceFitonEl = document.getElementById("balance-fiton");
  if (balanceStarsEl) balanceStarsEl.textContent = userData.balance.stars;
  if (balanceFitonEl) balanceFitonEl.textContent = userData.balance.fiton;
  localStorage.setItem("userData", JSON.stringify(userData));
}

// === Сохранение профиля ===
async function saveProfile() {
  await database.ref(`users/${userId}`).set(publicProfile);
  localStorage.setItem("publicProfile", JSON.stringify(publicProfile));
  alert("✅ Профиль сохранён!");
}

// === Ручное обновление профиля ===
function saveProfileManually() {
  const un = document.getElementById("edit-username")?.value.trim();
  const av = document.getElementById("edit-avatar")?.value.trim();
  if (!un) return alert("Введите ник!");
  if (!av) return alert("Введите URL аватарки!");
  publicProfile.username = un;
  publicProfile.avatar = av;
  saveProfile();
}

// === Страница: Магазин ===
function showGiftsPage() {
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
  const mainContent = document.getElementById("main-content");
  if (mainContent) mainContent.innerHTML = html;
}

// === Страница: Кейсы ===
function showCasesPage() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;
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

// === Страница: Мой профиль (исправленная!) ===
function showMyProfilePage() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

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
      <button class="buy-btn" onclick="saveProfileManually()">Сохранить</button>

      <h3 style="margin-top:20px;">Мои NFT (${userData.gifts.length})</h3>
  `;

  if (userData.gifts.length === 0) {
    html += `<p style="padding:20px;text-align:center;color:#aaa;">Нет подарков</p>`;
  } else {
    html += `<div class="gifts-scroll-container"><div class="gifts-scroll">`;
    userData.gifts.forEach((gift, i) => {
      const currentPrice = Math.floor(gift.baseValue * gift.multiplier);
      const priceClass = currentPrice > (gift._last || currentPrice) ? "up" : currentPrice < (gift._last || currentPrice) ? "down" : "";
      gift._last = currentPrice;
      const bg = gift.background || "var(--bg-tertiary)";
      const model = gift.selectedModel || (gift.models?.[0] || "https://placehold.co/80x80/444444/FFFFFF?text=?");
      html += `
        <div class="gift-card" style="background:${bg}; flex: 0 0 auto; margin-right: 16px; width: 150px;">
          <img src="${model}" style="width:80px;height:80px;object-fit:contain;">
          <h4>${gift.name}</h4>
          <div class="price ${priceClass}">${currentPrice}⭐</div>
          <div style="font-size:11px;color:#aaa;">${gift.multiplier.toFixed(2)}x</div>
          ${!gift.enhanced ? `<button class="buy-btn" onclick="enhanceGift(${i})">Улучшить (50⭐)</button>` : `<div class="price">✅ Активен</div>`}
          <button class="buy-btn" style="background:#ff5555;" onclick="sellGift(${i})">Продать</button>
        </div>
      `;
    });
    html += `</div></div>`;
  }
  html += `</div>`;
  mainContent.innerHTML = html;

  // Активируем прокрутку
  const scrollContainer = document.querySelector(".gifts-scroll");
  if (scrollContainer) {
    scrollContainer.addEventListener("wheel", (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollContainer.scrollBy({ left: e.deltaY, behavior: "auto" });
      }
    });

    let isDown = false, startX, scrollLeft;
    scrollContainer.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.pageX - scrollContainer.offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
      scrollContainer.style.cursor = "grabbing";
    });
    scrollContainer.addEventListener("mouseleave", () => isDown = false);
    scrollContainer.addEventListener("mouseup", () => isDown = false);
    scrollContainer.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainer.scrollLeft = scrollLeft - walk;
    });
    scrollContainer.style.cursor = "grab";
  }
}

// === Логика игры ===
async function buyGift(key) {
  const gift = giftsDB.find(g => g.firebaseKey === key);
  if (!gift || gift.currentMinted >= gift.totalSupply) return alert("Недоступно");
  if (userData.balance.stars < (gift.stars || 0)) return alert("Не хватает Stars!");
  userData.balance.stars -= gift.stars || 0;
  const newMinted = gift.currentMinted + 1;
  await database.ref(`gifts/${key}/currentMinted`).set(newMinted);
  gift.currentMinted = newMinted;
  userData.gifts.push({
    ...gift,
    serial: newMinted,
    source: "shop",
    enhanced: false,
    selectedModel: gift.models?.[0] || "https://placehold.co/80x80/444444/FFFFFF?text=?",
    multiplier: parseFloat((0.8 + Math.random() * 0.5).toFixed(4)),
    baseValue: gift.stars || gift.fiton || 100
  });
  updateUI();
  alert(`✅ Куплено: ${gift.name}`);
  showGiftsPage();
}

async function openCase(price) {
  if (![500,1000].includes(price) || userData.balance.stars < price) return alert("Неверная цена или недостаточно средств");
  userData.balance.stars -= price;
  const avail = giftsDB.filter(g => g.currentMinted < g.totalSupply);
  if (!avail.length) return alert("Нет подарков");
  const gift = avail[Math.floor(Math.random() * avail.length)];
  const newMinted = gift.currentMinted + 1;
  await database.ref(`gifts/${gift.firebaseKey}/currentMinted`).set(newMinted);
  gift.currentMinted = newMinted;
  const roll = Math.random();
  let mult;
  if (price === 1000) {
    if (roll < 0.02) mult = 2.5 + Math.random() * 0.5;
    else if (roll < 0.1) mult = 1.5 + Math.random() * 1.0;
    else if (roll < 0.4) mult = 1.0 + Math.random() * 0.5;
    else mult = 0.3 + Math.random() * 0.7;
  } else {
    if (roll < 0.01) mult = 2.5 + Math.random() * 0.5;
    else if (roll < 0.05) mult = 1.5 + Math.random() * 1.0;
    else if (roll < 0.2) mult = 1.0 + Math.random() * 0.5;
    else mult = 0.3 + Math.random() * 0.7;
  }
  userData.gifts.push({
    ...gift,
    serial: newMinted,
    source: "case",
    enhanced: false,
    selectedModel: gift.models?.[0] || "https://placehold.co/80x80/444444/FFFFFF?text=?",
    multiplier: parseFloat(mult.toFixed(4)),
    baseValue: gift.stars || gift.fiton || 100
  });
  updateUI();
  showCasesPage();
}

function enhanceGift(i) {
  const g = userData.gifts[i];
  if (!g || g.enhanced) return alert("Уже улучшено!");
  if (userData.balance.stars < 50) return alert("Нужно 50⭐");
  const alt = g.models?.slice(1) || [];
  if (alt.length === 0) return alert("Нет моделей для улучшения");
  userData.balance.stars -= 50;
  g.enhanced = true;
  g.selectedModel = alt[Math.floor(Math.random() * alt.length)];
  g.background = [
    "radial-gradient(circle, #ff9a9e, #fad0c4)",
    "radial-gradient(circle, #a1c4fd, #c2e9fb)",
    "radial-gradient(circle, #ffecd2, #fcb69f)",
    "radial-gradient(circle, #8fd3f4, #43e97b)",
    "radial-gradient(circle, #d299c2, #fef9d7)"
  ][Math.floor(Math.random() * 5)];
  updateUI();
  showMyProfilePage();
  alert("🚀 Улучшено! Цена теперь колеблется.");
}

function sellGift(i) {
  const g = userData.gifts[i];
  if (!g) return;
  const val = Math.floor(g.baseValue * g.multiplier);
  userData.balance.stars += val;
  userData.gifts.splice(i, 1);
  updateUI();
  showMyProfilePage();
  alert(`💰 Продано за ${val} Stars!`);
}

// === Запуск приложения ===
async function initApp() {
  initUser();
  initUserData();
  updateUI();

  const adminBtn = document.getElementById("btn-admin");
  if (adminBtn) {
    adminBtn.style.display = publicProfile.id === "tg_6951407766" ? "block" : "none";
  }

  database.ref("gifts").on("value", (snapshot) => {
    giftsDB = snapshot.val() ? Object.entries(snapshot.val()).map(([k, v]) => ({ ...v, firebaseKey: k })) : [];
    if (!isAppReady) {
      showGiftsPage();
      isAppReady = true;
    }
  });

  document.querySelectorAll(".chat").forEach(chat => {
    chat.addEventListener("click", () => {
      document.querySelectorAll(".chat").forEach(c => c.classList.remove("active"));
      chat.classList.add("active");
      if (chat.dataset.view === "profile") showMyProfilePage();
      else if (chat.dataset.view === "cases") showCasesPage();
      else showGiftsPage();
    });
  });
}

initApp();
