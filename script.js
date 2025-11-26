const ADMIN_PASSWORD = "Dexcos123";

let userData = JSON.parse(localStorage.getItem("userData")) || {
  balance: { stars: 1000, fiton: 500 },
  gifts: [],
};

let giftsDB = JSON.parse(localStorage.getItem("giftsDB")) || [
  { id: 1, name: "Золотой кот 🐱", image: "https://em-content.zobj.net/source/apple/391/cat-face_1f431.png", stars: 200, fiton: 0, quantity: 5 },
  { id: 2, name: "Робот-друг 🤖", image: "https://em-content.zobj.net/source/apple/391/robot_1f916.png", stars: 0, fiton: 100, quantity: 3 },
  { id: 3, name: "Крипто-звезда ⭐", image: "https://em-content.zobj.net/source/apple/391/glowing-star_1f31f.png", stars: 150, fiton: 80, quantity: 2 }
];

const balanceStarsEl = document.getElementById("balance-stars");
const balanceFitonEl = document.getElementById("balance-fiton");
const giftsGrid = document.getElementById("gifts-grid");
const adminModal = document.getElementById("admin-modal");
const adminPassInput = document.getElementById("admin-pass");
const adminActions = document.getElementById("admin-actions");

function updateUI() {
  balanceStarsEl.textContent = userData.balance.stars;
  balanceFitonEl.textContent = userData.balance.fiton;
  localStorage.setItem("userData", JSON.stringify(userData));
  localStorage.setItem("giftsDB", JSON.stringify(giftsDB));
  renderGifts();
}

function renderGifts() {
  giftsGrid.innerHTML = "";
  giftsDB.forEach(gift => {
    if (gift.quantity <= 0) return;
    const card = document.createElement("div");
    card.className = "gift-card";
    card.innerHTML = `
      <img src="${gift.image}" alt="${gift.name}">
      <h4>${gift.name}</h4>
      ${gift.stars > 0 ? `<div class="price">⭐ ${gift.stars} Stars</div>` : ''}
      ${gift.fiton > 0 ? `<div class="price">💎 ${gift.fiton} FITON</div>` : ''}
      <button class="buy-btn" onclick="buyGift(${gift.id})">Купить</button>
    `;
    giftsGrid.appendChild(card);
  });
}

function buyGift(giftId) {
  const gift = giftsDB.find(g => g.id === giftId);
  if (!gift || gift.quantity <= 0) return alert("Недоступно");
  if (gift.stars > 0 && userData.balance.stars < gift.stars) return alert("Не хватает Stars!");
  if (gift.fiton > 0 && userData.balance.fiton < gift.fiton) return alert("Не хватает FITON!");

  if (gift.stars > 0) userData.balance.stars -= gift.stars;
  if (gift.fiton > 0) userData.balance.fiton -= gift.fiton;
  gift.quantity--;
  userData.gifts.push({ ...gift, boughtAt: new Date().toISOString() });

  alert(`✅ Вы получили: ${gift.name}!`);
  updateUI();
}

// Админка
document.getElementById("btn-admin").addEventListener("click", () => {
  adminModal.classList.remove("hidden");
});

document.querySelector(".close").addEventListener("click", () => {
  adminModal.classList.add("hidden");
});

document.getElementById("btn-login-admin").addEventListener("click", () => {
  if (adminPassInput.value === ADMIN_PASSWORD) {
    adminActions.classList.remove("hidden");
    document.getElementById("admin-login").classList.add("hidden");
    adminPassInput.value = "";
  } else {
    alert("❌ Неверный пароль!");
  }
});

document.getElementById("btn-add-gift").addEventListener("click", () => {
  const name = document.getElementById("gift-name").value.trim();
  const image = document.getElementById("gift-image").value || "https://em-content.zobj.net/source/apple/391/gift_1f381.png";
  const stars = parseInt(document.getElementById("gift-stars").value) || 0;
  const fiton = parseInt(document.getElementById("gift-fiton").value) || 0;
  const qty = parseInt(document.getElementById("gift-quantity").value) || 1;

  if (!name || (stars === 0 && fiton === 0)) return alert("Укажите название и цену!");

  giftsDB.push({
    id: Date.now(),
    name,
    image,
    stars,
    fiton,
    quantity: qty
  });
  updateUI();
  alert("✅ Подарок добавлен!");
});

document.getElementById("btn-add-balance").addEventListener("click", () => {
  const addStars = parseInt(document.getElementById("add-stars").value) || 0;
  const addFiton = parseInt(document.getElementById("add-fiton").value) || 0;
  userData.balance.stars += addStars;
  userData.balance.fiton += addFiton;
  updateUI();
  alert("✅ Баланс пополнен!");
});

// Инициализация
updateUI();
