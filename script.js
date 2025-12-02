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

let publicProfile, userId, giftsDB = [], userDataLoaded = false;
let currentBalance = { stars: 1000, fiton: 500 };
let currentGifts = [];

// === Инициализация пользователя из Telegram ===
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
      return true;
    } else {
      alert("⚠️ Не удалось получить данные Telegram. Откройте через бота.");
      return false;
    }
  } else {
    // Режим разработки (локально)
    userId = "dev_" + Date.now();
    publicProfile = {
      id: userId,
      username: "Разработчик",
      avatar: "https://placehold.co/100x100/333333/FFFFFF?text=🛠️"
    };
    return true;
  }
}

// === Загрузка данных игрока из Firebase ===
async function loadUserDataFromFirebase() {
  if (!userId) return;

  const userRef = database.ref(`users/${userId}`);
  const snapshot = await userRef.once("value");

  if (snapshot.exists()) {
    const data = snapshot.val();
    // Обновляем профиль
    publicProfile.username = data.username || publicProfile.username;
    publicProfile.avatar = data.avatar || publicProfile.avatar;
    // Загружаем баланс и подарки
    currentBalance = data.balance || { stars: 1000, fiton: 500 };
    currentGifts = data.gifts || [];
  } else {
    // Создаём нового пользователя
    const newUserData = {
      ...publicProfile,
      balance: { stars: 1000, fiton: 500 },
      gifts: []
    };
    await userRef.set(newUserData);
  }
}

// === Сохранение данных в Firebase ===
async function saveUserDataToFirebase() {
  if (!userId) return;
  await database.ref(`users/${userId}`).update({
    username: publicProfile.username,
    avatar: publicProfile.avatar,
    balance: currentBalance,
    gifts: currentGifts
  });
}

// === Обновление UI баланса ===
function updateUI() {
  const balanceStarsEl = document.getElementById("balance-stars");
  const balanceFitonEl = document.getElementById("balance-fiton");
  if (balanceStarsEl) balanceStarsEl.textContent = currentBalance.stars;
  if (balanceFitonEl) balanceFitonEl.textContent = currentBalance.fiton;
}

// === Сохранение профиля ===
async function saveProfile() {
  await database.ref(`users/${userId}`).update({
    username: publicProfile.username,
    avatar: publicProfile.avatar
  });
  alert("✅ Профиль сохранён!");
}

function saveProfileManually() {
  const un = document.getElementById("edit-username")?.value.trim();
  const av = document.getElementById("edit-avatar")?.value.trim();
  if (!un) return alert("Введите ник!");
  if (!av) return alert("Введите URL аватарки!");
  publicProfile.username = un;
  publicProfile.avatar = av;
  saveProfile();
}

// === Рендеринг страниц ===
function showGiftsPage() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  let html = `<div class="chat-header"><div class="chat-avatar">🎁</div><div class="chat-title">Магазин</div></div><div class="gifts-list">`;
  giftsDB.forEach(gift => {
    const rem = gift.totalSupply - gift.currentMinted;
    const img = gift.models?.[0] || "https://placehold.co/70x70/444444/FFFFFF?text=?";
    html += `
      <div class="gift-card">
        <img src="${img}" alt="${gift.name}">
        <div class="gift-info">
          <h4>${gift.name}</h4>
          <div class="price">${gift.stars ? `⭐ ${gift.stars}` : `💎 ${gift.fiton}`}</div>
          <div style="font-size:12px;color:#aaa;">${rem}/${gift.totalSupply}</div>
          ${rem > 0 ? `<button class="buy-btn small" onclick="buyGift('${gift.firebaseKey}')">Купить</button>` : `<button disabled>Исчерпано</button>`}
        </div>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

function showCasesPage() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="chat-header"><div class="chat-avatar">📦</div><div class="chat-title">Кейсы</div></div>
    <div class="gifts-list">
      <div class="gift-card" style="text-align:center;">
        <div style="font-size:48px;">📦</div>
        <div class="gift-info">
          <h4>Кейс «Стандарт»</h4>
          <div class="price">500⭐</div>
          <button class="buy-btn small" onclick="openCase(500)">Открыть</button>
        </div>
      </div>
      <div class="gift-card" style="text-align:center; border: 2px solid gold; background: rgba(255,215,0,0.1);">
        <div style="font-size:48px;">💎</div>
        <div class="gift-info">
          <h4>Кейс «Премиум»</h4>
          <div class="price">1000⭐</div>
          <button class="buy-btn small" style="background: gold; color: #000;" onclick="openCase(1000)">Открыть</button>
        </div>
      </div>
    </div>
  `;
}

function showMyProfilePage() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  let html = `
    <div class="chat-header">
      <img src="${publicProfile.avatar}" alt="Аватар">
      <div class="chat-title">Мой профиль</div>
    </div>
    <div class="profile-section">
      <div class="balance-info">⭐ Stars: ${currentBalance.stars} | 💎 FITON: ${currentBalance.fiton}</div>
      
      <h3>Редактировать профиль</h3>
      <input type="text" id="edit-username" value="${publicProfile.username}" placeholder="Никнейм">
      <input type="url" id="edit-avatar" value="${publicProfile.avatar}" placeholder="URL аватарки">
      <button class="buy-btn" onclick="saveProfileManually()">Сохранить</button>

      <h3 style="margin-top:20px;">Мои NFT (${currentGifts.length})</h3>
  `;

  if (currentGifts.length === 0) {
    html += `<p style="padding:20px;text-align:center;color:#aaa;">Нет подарков</p>`;
  } else {
    html += `<div class="gifts-list">`;
    currentGifts.forEach((gift, i) => {
      const baseValue = gift.baseValue || 100;
      const multiplier = typeof gift.multiplier === 'number' ? gift.multiplier : 1.0;
      const currentPrice = Math.floor(baseValue * multiplier);
      const lastPrice = gift._last || currentPrice;
      const priceClass = currentPrice > lastPrice ? "up" : currentPrice < lastPrice ? "down" : "";
      gift._last = currentPrice;
      const model = gift.selectedModel || (gift.models?.[0] || "https://placehold.co/70x70/444444/FFFFFF?text=?");

      html += `
        <div class="gift-card">
          <img src="${model}" alt="${gift.name}">
          <div class="gift-info">
            <h4>${gift.name}</h4>
            <div class="price ${priceClass}">${currentPrice}⭐</div>
            <div style="font-size:12px;color:#aaa;">${multiplier.toFixed(2)}x</div>
            <div style="margin-top:10px;">
              ${!gift.enhanced ? 
                `<button class="buy-btn small" onclick="enhanceGift(${i})">Улучшить</button>` : 
                `<span class="price">✅ Улучшен</span>`}
              <button class="buy-btn small" style="background:#ff5555;" onclick="sellGift(${i})">Продать</button>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }
  html += `</div>`;
  mainContent.innerHTML = html;
}

// === Действия (сохраняют в Firebase) ===
async function buyGift(key) {
  const gift = giftsDB.find(g => g.firebaseKey === key);
  if (!gift || gift.currentMinted >= gift.totalSupply) return alert("Недоступно");
  if (currentBalance.stars < (gift.stars || 0)) return alert("Не хватает Stars!");

  currentBalance.stars -= gift.stars || 0;
  const newMinted = gift.currentMinted + 1;
  await database.ref(`gifts/${key}/currentMinted`).set(newMinted);
  gift.currentMinted = newMinted;

  const baseValue = gift.stars || gift.fiton || 100;
  const multiplier = parseFloat((0.8 + Math.random() * 0.5).toFixed(4));

  currentGifts.push({
    ...gift,
    serial: newMinted,
    source: "shop",
    enhanced: false,
    selectedModel: gift.models?.[0] || "https://placehold.co/70x70/444444/FFFFFF?text=?",
    multiplier,
    baseValue
  });

  await saveUserDataToFirebase();
  updateUI();
  alert(`✅ Куплено: ${gift.name}`);
  showGiftsPage();
}

async function openCase(price) {
  if (![500,1000].includes(price) || currentBalance.stars < price) return alert("Неверная цена или недостаточно средств");
  currentBalance.stars -= price;
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

  currentGifts.push({
    ...gift,
    serial: newMinted,
    source: "case",
    enhanced: false,
    selectedModel: gift.models?.[0] || "https://placehold.co/70x70/444444/FFFFFF?text=?",
    multiplier: parseFloat(mult.toFixed(4)),
    baseValue: gift.stars || gift.fiton || 100
  });

  await saveUserDataToFirebase();
  updateUI();
  showCasesPage();
}

async function enhanceGift(i) {
  const g = currentGifts[i];
  if (!g || g.enhanced) return alert("Уже улучшено!");
  if (currentBalance.stars < 50) return alert("Нужно 50⭐");
  const alt = g.models?.slice(1) || [];
  if (alt.length === 0) return alert("Нет моделей для улучшения");

  currentBalance.stars -= 50;
  g.enhanced = true;
  g.selectedModel = alt[Math.floor(Math.random() * alt.length)];
  g.background = [
    "radial-gradient(circle, #ff9a9e, #fad0c4)",
    "radial-gradient(circle, #a1c4fd, #c2e9fb)",
    "radial-gradient(circle, #ffecd2, #fcb69f)",
    "radial-gradient(circle, #8fd3f4, #43e97b)",
    "radial-gradient(circle, #d299c2, #fef9d7)"
  ][Math.floor(Math.random() * 5)];

  if (typeof g.multiplier !== 'number') g.multiplier = 1.0;
  g.multiplier = parseFloat((g.multiplier + (Math.random() - 0.5) * 0.5).toFixed(4));

  await saveUserDataToFirebase();
  updateUI();
  showMyProfilePage();
  alert("🚀 Улучшено! Цена теперь колеблется.");
}

async function sellGift(i) {
  const g = currentGifts[i];
  if (!g) return;
  const baseValue = g.baseValue || 100;
  const multiplier = typeof g.multiplier === 'number' ? g.multiplier : 1.0;
  const val = Math.floor(baseValue * multiplier);
  currentBalance.stars += val;
  currentGifts.splice(i, 1);

  await saveUserDataToFirebase();
  updateUI();
  showMyProfilePage();
  alert(`💰 Продано за ${val} Stars!`);
}

// === Запуск приложения ===
async function initApp() {
  const success = initUser();
  if (!success) return;

  await loadUserDataFromFirebase();
  updateUI();

  // Скрыть админку
  const btnAdmin = document.getElementById("btn-admin");
  if (btnAdmin) {
    btnAdmin.style.display = publicProfile.id === "tg_6951407766" ? "block" : "none";
  }

  // Загрузка подарков
  database.ref("gifts").on("value", (snapshot) => {
    giftsDB = snapshot.val() ? Object.entries(snapshot.val()).map(([k, v]) => ({ ...v, firebaseKey: k })) : [];
    if (!userDataLoaded) {
      showGiftsPage();
      userDataLoaded = true;
    }
  });

  // Навигация
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const view = tab.dataset.view;
      if (view === "profile") showMyProfilePage();
      else if (view === "cases") showCasesPage();
      else showGiftsPage();
    });
  });
}

initApp();
