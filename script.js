// === Firebase Config ===
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
const BOT_USERNAME = "your_bot"; // ← ЗАМЕНИ НА ИМЯ ТВОЕГО БОТА!

let publicProfile, userId, giftsDB = [], userDataLoaded = false;
let currentBalance = { stars: 1000, fiton: 500 };
let currentGifts = [];
let miningData = { active: false, startTime: null, lastClaim: null };

// === Инициализация пользователя ===
function initUser() {
  if (typeof window.Telegram?.WebApp !== "undefined") {
    const tg = window.Telegram.WebApp;
    tg.expand(); tg.ready();
    const user = tg.initDataUnsafe?.user;
    const startParam = tg.initDataUnsafe?.start_param;

    if (user) {
      userId = "tg_" + user.id;
      publicProfile = {
        id: userId,
        username: user.username || ("Игрок_" + user.id.toString().slice(-4)),
        avatar: user.photo_url || "https://placehold.co/100x100/5D3FD3/FFFFFF?text=👤"
      };

      if (startParam && startParam.startsWith("ref_")) {
        const referrerId = "tg_" + startParam.substring(4);
        if (referrerId !== userId) {
          database.ref(`users/${userId}/referredBy`).once("value", (snapshot) => {
            if (!snapshot.exists()) {
              database.ref(`users/${userId}`).update({ referredBy: referrerId });
              rewardReferrer(referrerId);
            }
          });
        }
      }
      return true;
    } else {
      alert("⚠️ Откройте через Telegram бота.");
      return false;
    }
  } else {
    userId = "dev_" + Date.now();
    publicProfile = { id: userId, username: "Разработчик", avatar: "https://placehold.co/100x100/333333/FFFFFF?text=🛠️" };
    return true;
  }
}

// === Награда рефереру ===
async function rewardReferrer(referrerId) {
  try {
    const refUserRef = database.ref(`users/${referrerId}`);
    const snapshot = await refUserRef.once("value");
    if (snapshot.exists()) {
      const refData = snapshot.val();
      const newBalance = (refData.balance?.stars || 0) + 350;
      await refUserRef.update({ "balance.stars": newBalance });
    }
  } catch (e) { console.error(e); }
}

// === Загрузка данных ===
async function loadUserDataFromFirebase() {
  if (!userId) return;
  const userRef = database.ref(`users/${userId}`);
  const snapshot = await userRef.once("value");
  if (snapshot.exists()) {
    const data = snapshot.val();
    publicProfile.username = data.username || publicProfile.username;
    publicProfile.avatar = data.avatar || publicProfile.avatar;
    currentBalance = data.balance || { stars: 1000, fiton: 500 };
    currentGifts = data.gifts || [];
    miningData = data.mining || { active: false, startTime: null, lastClaim: null };
  } else {
    const newUserData = {
      ...publicProfile,
      balance: { stars: 1000, fiton: 500 },
      gifts: [],
      mining: { active: false, startTime: null, lastClaim: null }
    };
    await userRef.set(newUserData);
  }
}

// === Сохранение данных ===
async function saveUserDataToFirebase() {
  if (!userId) return;
  await database.ref(`users/${userId}`).update({
    username: publicProfile.username,
    avatar: publicProfile.avatar,
    balance: currentBalance,
    gifts: currentGifts,
    mining: miningData
  });
}

// === Обновление UI ===
function updateUI() {
  const balanceStarsEl = document.getElementById("balance-stars");
  const balanceFitonEl = document.getElementById("balance-fiton");
  if (balanceStarsEl) balanceStarsEl.textContent = currentBalance.stars;
  if (balanceFitonEl) balanceFitonEl.textContent = currentBalance.fiton;
}

// === Профиль ===
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
  if (!un || !av) return alert("Заполните все поля!");
  publicProfile.username = un;
  publicProfile.avatar = av;
  saveProfile();
}

// === Майнинг ===
async function claimMiningReward() {
  if (!miningData.active || !miningData.startTime) return;
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const lastClaim = miningData.lastClaim || miningData.startTime;
  const hoursPassed = Math.floor((now - lastClaim) / oneHour);
  if (hoursPassed >= 1) {
    const reward = hoursPassed * 150;
    currentBalance.stars += reward;
    miningData.lastClaim = lastClaim + hoursPassed * oneHour;
    await saveUserDataToFirebase();
    updateUI();
    alert(`⛏️ Вы получили ${reward} Stars от майнинга!`);
  }
}
async function toggleMining() {
  if (miningData.active) {
    await claimMiningReward();
    miningData.active = false;
    miningData.startTime = null;
    miningData.lastClaim = null;
    alert("⏹️ Майнинг остановлен.");
  } else {
    miningData.active = true;
    miningData.startTime = Date.now();
    miningData.lastClaim = Date.now();
    alert("▶️ Майнинг запущен! За каждый час вы получите 150 Stars.");
  }
  await saveUserDataToFirebase();
  showMiningPage();
}

// === Страницы ===
function showMiningPage() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;
  let pendingReward = 0;
  if (miningData.active && miningData.startTime) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const lastClaim = miningData.lastClaim || miningData.startTime;
    const hoursPassed = Math.floor((now - lastClaim) / oneHour);
    pendingReward = hoursPassed * 150;
  }
  const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${userId.replace("tg_", "")}`;
  mainContent.innerHTML = `
    <div class="chat-header"><div class="chat-avatar">⛏️</div><div class="chat-title">Майнинг</div></div>
    <div class="profile-section">
      <div class="balance-info">Ваш баланс: ⭐ ${currentBalance.stars}</div>
      <h3>⛏️ Майнинг звёзд</h3>
      <p>Каждый час вы получаете <b>150 ⭐</b>, даже когда не в игре.</p>
      <div style="margin: 20px 0; padding: 12px; background: var(--bg-tertiary); border-radius: 12px;">
        <div>Статус: <b>${miningData.active ? "✅ Активен" : "🛑 Остановлен"}</b></div>
        ${pendingReward > 0 ? `<div>Накоплено: <b>+${pendingReward} ⭐</b></div>` : ""}
      </div>
      <button class="buy-btn" onclick="toggleMining()">
        ${miningData.active ? "⏹️ Остановить майнинг" : "▶️ Запустить майнинг"}
      </button>
      <h3 style="margin-top:30px;">👥 Реферальная программа</h3>
      <p>Пригласите друзей и получите <b>350 ⭐</b> за каждого!</p>
      <div style="margin: 10px 0; padding: 10px; background: var(--bg-tertiary); border-radius: 8px; word-break: break-all;">
        ${refLink}
      </div>
      <button class="buy-btn" style="background:#4ecdc4;" onclick="copyRefLink('${refLink}')">Копировать ссылку</button>
    </div>
  `;
}
function copyRefLink(link) {
  navigator.clipboard.writeText(link).then(() => alert("✅ Ссылка скопирована!")).catch(() => alert("Скопируйте вручную"));
}

function showGiftsPage() { /* без изменений */ }
function showCasesPage() { /* без изменений */ }
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
      const bg = gift.background || "var(--bg-tertiary)";
      const textColor = (bg === "#ffffff") ? "#000000" : "#ffffff";
      html += `
        <div class="gift-card" style="background:${bg}; color: ${textColor};">
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

// === Улучшение подарка с редкими фонами ===
async function enhanceGift(i) {
  const g = currentGifts[i];
  if (!g || g.enhanced) return alert("Уже улучшено!");
  if (currentBalance.stars < 50) return alert("Нужно 50⭐");
  const alt = g.models?.slice(1) || [];
  if (alt.length === 0) return alert("Нет моделей для улучшения");

  currentBalance.stars -= 50;
  g.enhanced = true;
  g.selectedModel = alt[Math.floor(Math.random() * alt.length)];

  const roll = Math.random();
  let background;
  if (roll < 0.85) {
    const gradients = [
      "radial-gradient(circle, #ff9a9e, #fad0c4)",
      "radial-gradient(circle, #a1c4fd, #c2e9fb)",
      "radial-gradient(circle, #ffecd2, #fcb69f)",
      "radial-gradient(circle, #8fd3f4, #43e97b)",
      "radial-gradient(circle, #d299c2, #fef9d7)",
      "radial-gradient(circle, #a6c0fe, #f68084)",
      "radial-gradient(circle, #ff758c, #ff7eb3)",
      "radial-gradient(circle, #6a11cb, #2575fc)"
    ];
    background = gradients[Math.floor(Math.random() * gradients.length)];
  } else if (roll < 0.925) {
    background = "#000000";
  } else {
    background = "#ffffff";
  }
  g.background = background;

  if (typeof g.multiplier !== 'number') g.multiplier = 1.0;
  g.multiplier = parseFloat((g.multiplier + (Math.random() - 0.5) * 0.5).toFixed(4));

  await saveUserDataToFirebase();
  updateUI();
  showMyProfilePage();
  
  if (background === "#000000" || background === "#ffffff") {
    const colorName = background === "#000000" ? "чёрный" : "белый";
    alert(`🎉 УЛУЧШЕНИЕ УСПЕШНО!\nВыпал РЕДКИЙ ${colorName} фон!`);
  } else {
    alert("🚀 Подарок улучшен! Новый фон применён.");
  }
}

// === Продажа ===
async function sellGift(i) { /* без изменений */ }

// === Анимация открытия кейса ===
function showCaseAnimation(gift, price) {
  const modal = document.getElementById("case-modal");
  const resultDiv = document.getElementById("case-result");
  modal.classList.remove("hidden");
  
  // Анимация длится ~2 секунды
  setTimeout(() => {
    const img = gift.models?.[0] || "https://placehold.co/80x80/444444/FFFFFF?text=?";
    const value = Math.floor(gift.baseValue * gift.multiplier);
    resultDiv.innerHTML = `
      <img src="${img}" alt="${gift.name}">
      <h3>${gift.name}</h3>
      <div>Стоимость: ${value}⭐</div>
    `;
    document.getElementById("close-case-modal").onclick = () => {
      modal.classList.add("hidden");
      showCasesPage();
    };
  }, 2000);
}

// === Открытие кейса ===
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
  showCaseAnimation(gift, price);
}

// === Покупка ===
async function buyGift(key) { /* без изменений, но без анимации */ }

// === Инициализация ===
async function initApp() {
  const success = initUser();
  if (!success) return;
  await loadUserDataFromFirebase();
  updateUI();
  const btnAdmin = document.getElementById("btn-admin");
  if (btnAdmin) btnAdmin.style.display = publicProfile.id === "tg_6951407766" ? "block" : "none";
  database.ref("gifts").on("value", (snapshot) => {
    giftsDB = snapshot.val() ? Object.entries(snapshot.val()).map(([k, v]) => ({ ...v, firebaseKey: k })) : [];
    if (!userDataLoaded) {
      showGiftsPage();
      userDataLoaded = true;
    }
  });
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const view = tab.dataset.view;
      if (view === "profile") showMyProfilePage();
      else if (view === "cases") showCasesPage();
      else if (view === "mining") showMiningPage();
      else showGiftsPage();
    });
  });
}
initApp();

