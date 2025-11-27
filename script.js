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

// Генерация ID пользователя
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  localStorage.setItem("userId", userId);
}

let currentUser = null;
let giftsDB = [];

// DOM
const balanceStarsEl = document.getElementById("balance-stars");
const mainContent = document.getElementById("main-content");

// === ИНИЦИАЛИЗАЦИЯ ===
async function initApp() {
  // Создаём профиль, если нет
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

  // Загружаем подарки
  const giftsSnapshot = await database.ref("gifts").once("value");
  giftsDB = giftsSnapshot.val() ? Object.keys(giftsSnapshot.val()).map(key => ({
    ...giftsSnapshot.val()[key],
    key
  })) : [];

  // Обновляем UI
  updateUserUI();

  // Настраиваем навигацию
  setupNavigation();

  // Показываем профиль
  showMyProfile();
}

// === ОБНОВЛЕНИЕ UI ===
function updateUserUI() {
  if (currentUser) {
    balanceStarsEl.textContent = currentUser.balance.stars;
  }
}

// === НАВИГАЦИЯ ===
function setupNavigation() {
  document.querySelectorAll(".chat").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".chat").forEach(c => c.classList.remove("active"));
      el.classList.add("active");
      
      const view = el.dataset.view;
      if (view === "profile") showMyProfile();
      else if (view === "gifts") showGiftsPage();
    });
  });
}

// === СТРАНИЦЫ ===
function showMyProfile() {
  let html = `
    <div class="chat-header">
      <img src="${currentUser.avatar}" style="width:40px;height:40px;border-radius:50%;">
      <div class="chat-title">${currentUser.nickname}</div>
    </div>
    <div style="padding:20px;">
      <p>⭐ Баланс: ${currentUser.balance.stars}</p>
      <p>Подарков: ${currentUser.gifts.length}</p>
      ${currentUser.gifts.map(g => `<div>🎁 ${g.name} #${g.serial}</div>`).join("")}
    </div>
  `;
  mainContent.innerHTML = html;
}

function showGiftsPage() {
  let html = `<div class="chat-header"><div class="chat-title">🎁 Подарки</div></div><div class="gifts-grid">`;
  giftsDB.forEach(gift => {
    html += `
      <div class="gift-card">
        <img src="${gift.models?.[0] || 'https://placehold.co/80x80/555/white?text=?'}" style="width:80px;height:80px;object-fit:contain;">
        <h4>${gift.name}</h4>
        <div class="price">⭐ ${gift.stars || 0}</div>
        <button class="buy-btn" onclick="giveGiftToSelf('${gift.key}')">Выдать себе</button>
      </div>
    `;
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

// === ВЫДАЧА ПОДАРКА ===
async function giveGiftToSelf(giftKey) {
  const gift = giftsDB.find(g => g.key === giftKey);
  if (!gift) return alert("Подарок не найден");

  const serial = (gift.currentMinted || 0) + 1;
  await database.ref(`gifts/${giftKey}/currentMinted`).set(serial);

  currentUser.gifts.push({
    giftKey,
    name: gift.name,
    models: gift.models,
    serial: serial,
    selectedModel: gift.models[0]
  });

  await database.ref(`users/${userId}`).update({
    gifts: currentUser.gifts
  });

  alert(`✅ Получено: ${gift.name} #${serial}`);
  showMyProfile();
}

// === АДМИНКА ===
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
</script>
