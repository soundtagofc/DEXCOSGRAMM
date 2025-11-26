// === Инициализация данных ===
const ADMIN_PASSWORD = "secret123"; // можно изменить

let userData = JSON.parse(localStorage.getItem("userData")) || {
  balance: { stars: 1000, fiton: 500 },
  gifts: [],
};

let giftsDB = JSON.parse(localStorage.getItem("giftsDB")) || [
  { id: 1, name: "Золотой кот", image: "https://via.placeholder.com/100/FFD700", stars: 200, fiton: 0, quantity: 5 },
  { id: 2, name: "Робот-помощник", image: "https://via.placeholder.com/100/8A2BE2", stars: 0, fiton: 100, quantity: 3 }
];

// === DOM элементы ===
const balanceStarsEl = document.getElementById("balance-stars");
const balanceFitonEl = document.getElementById("balance-fiton");
const mainContent = document.getElementById("main-content");
const adminPanel = document.getElementById("admin-panel");
const adminPassInput = document.getElementById("admin-pass");
const adminActions = document.getElementById("admin-actions");

// === Обновление интерфейса ===
function updateUI() {
  balanceStarsEl.textContent = userData.balance.stars;
  balanceFitonEl.textContent = userData.balance.fiton;
  localStorage.setItem("userData", JSON.stringify(userData));
  localStorage.setItem("giftsDB", JSON.stringify(giftsDB));
}

// === Главная страница чатов ===
function showChats() {
  mainContent.innerHTML = `<p>Чаты скоро будут... А пока — подарки! 🎁</p>`;
}

// === Страница подарков ===
function showGifts() {
  let html = `<h2>🎁 Подарки (NFT)</h2><div id="gifts-list">`;
  giftsDB.forEach(gift => {
    if (gift.quantity > 0) {
      html += `
        <div class="gift">
          <img src="${gift.image}" alt="${gift.name}">
          <h4>${gift.name}</h4>
          ${gift.stars > 0 ? `<p>💰 ${gift.stars} Stars</p>` : ''}
          ${gift.fiton > 0 ? `<p>💎 ${gift.fiton} FITON</p>` : ''}
          <button onclick="buyGift(${gift.id})">Купить</button>
        </div>
      `;
    }
  });
  html += `</div>`;
  mainContent.innerHTML = html;
}

// === Покупка подарка ===
function buyGift(giftId) {
  const gift = giftsDB.find(g => g.id === giftId);
  if (!gift || gift.quantity <= 0) {
    alert("Подарок недоступен");
    return;
  }

  if (gift.stars > 0 && userData.balance.stars < gift.stars) {
    alert("Недостаточно Stars!");
    return;
  }
  if (gift.fiton > 0 && userData.balance.fiton < gift.fiton) {
    alert("Недостаточно FITON!");
    return;
  }

  // Списание
  if (gift.stars > 0) userData.balance.stars -= gift.stars;
  if (gift.fiton > 0) userData.balance.fiton -= gift.fiton;

  // Уменьшение количества
  gift.quantity--;

  // Добавление в коллекцию
  userData.gifts.push({ ...gift, purchaseDate: new Date().toISOString() });

  alert(`Вы получили: ${gift.name}!`);
  updateUI();
  showGifts();
}

// === Админка ===
document.getElementById("btn-admin").addEventListener("click", () => {
  adminPanel.classList.remove("hidden");
});

document.getElementById("btn-login-admin").addEventListener("click", () => {
  if (adminPassInput.value === ADMIN_PASSWORD) {
    adminActions.classList.remove("hidden");
    adminPassInput.value = "";
  } else {
    alert("Неверный пароль!");
  }
});

document.getElementById("btn-add-gift").addEventListener("click", () => {
  const name = document.getElementById("gift-name").value;
  const image = document.getElementById("gift-image").value || "https://via.placeholder.com/100";
  const stars = parseInt(document.getElementById("gift-stars").value) || 0;
  const fiton = parseInt(document.getElementById("gift-fiton").value) || 0;
  const qty = parseInt(document.getElementById("gift-quantity").value) || 1;

  if (!name || (stars === 0 && fiton === 0)) {
    alert("Заполните данные и укажите цену!");
    return;
  }

  const newGift = {
    id: Date.now(),
    name,
    image,
    stars,
    fiton,
    quantity: qty
  };

  giftsDB.push(newGift);
  updateUI();
  alert("Подарок добавлен!");
});

document.getElementById("btn-add-balance").addEventListener("click", () => {
  const addStars = parseInt(document.getElementById("add-stars").value) || 0;
  const addFiton = parseInt(document.getElementById("add-fiton").value) || 0;

  userData.balance.stars += addStars;
  userData.balance.fiton += addFiton;
  updateUI();
  alert("Баланс пополнен!");
});

// === Кнопки навигации ===
document.getElementById("btn-gifts").addEventListener("click", showGifts);
document.getElementById("btn-admin").addEventListener("click", () => {});

// === Запуск ===
updateUI();
showChats();