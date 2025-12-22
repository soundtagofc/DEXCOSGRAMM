// === Firebase Config (оставь свой) ===
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
const BOT_USERNAME = "your_bot"; // ← ЗАМЕНИ!

let publicProfile, userId, giftsDB = [], userDataLoaded = false;
let currentBalance = { stars: 1000, fiton: 500 };
let currentGifts = [];
let miningData = { active: false, startTime: null, lastClaim: null };

// === Вся логика без изменений (оставь как есть) ===
// ... (все функции: initUser, loadUserDataFromFirebase, enhanceGift и т.д.)

// === 🔥 ОБНОВЛЁННАЯ СТРАНИЦА КЕЙСОВ ===
function showCasesPage() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="chat-header"><div class="chat-avatar">🎄</div><div class="chat-title">Новогодние кейсы</div></div>
    <div class="gifts-list">
      <div class="gift-card" style="text-align:center; background: radial-gradient(circle, #d62828, #003049); border-color: gold;">
        <div style="font-size:48px;">🎁</div>
        <div class="gift-info">
          <h4>Новогодний кейс</h4>
          <div class="price">500⭐</div>
          <button class="buy-btn christmas" onclick="openCase(500)">Открыть</button>
        </div>
      </div>
      <div class="gift-card" style="text-align:center; background: radial-gradient(circle, #f77f00, #003049); border: 2px solid gold;">
        <div style="font-size:48px;">🎅</div>
        <div class="gift-info">
          <h4>Премиум кейс</h4>
          <div class="price">1000⭐</div>
          <button class="buy-btn christmas" style="background: linear-gradient(90deg, #f77f00, #d62828);" onclick="openCase(1000)">Открыть</button>
        </div>
      </div>
    </div>
  `;
}

// === 🔥 ОБНОВЛЁННЫЕ ГРАДИЕНТЫ В enhanceGift ===
// В функции enhanceGift замени массив gradients на:
/*
const gradients = [
  "radial-gradient(circle, #d62828, #003049)",
  "radial-gradient(circle, #f77f00, #003049)",
  "radial-gradient(circle, #2a9d8f, #003049)",
  "radial-gradient(circle, #e9c46a, #003049)",
  "radial-gradient(circle, #e76f51, #003049)",
  "radial-gradient(circle, #264653, #003049)",
  "linear-gradient(135deg, #d62828 0%, #f77f00 50%, #2a9d8f 100%)",
  "radial-gradient(circle, #e9c46a, #d62828)"
];
*/

// === Остальной код — как в предыдущей версии (передача, майнинг, профиль и т.д.) ===
// ... (все остальные функции без изменений)

window.addEventListener("load", initApp);
