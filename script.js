// --- Firebase初期設定 ---
const firebaseConfig = {
  apiKey: "AIzaSyDbzGn5MyHg9iwx6wDpWrOV7OWJp5AOjhk",
  authDomain: "cashier-8da8d.firebaseapp.com",
  databaseURL: "https://cashier-8da8d-default-rtdb.firebaseio.com",
  projectId: "cashier-8da8d",
  storageBucket: "cashier-8da8d.firebasestorage.app",
  messagingSenderId: "283561686418",
  appId: "1:283561686418:web:c09c160738bb5e40d47d4b",
  measurementId: "G-KW17V9VZ3X"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// script.js の冒頭をこれに書き換えてテスト
const pipSound = new Audio('https://otologic.jp/free/se/bin/button-pressed02.mp3');
const cashSound = new Audio('https://otologic.jp/free/se/bin/cash-register1.mp3');

function unlockAudio() {
    pipSound.play().then(() => {
        pipSound.pause();
        pipSound.currentTime = 0;
        console.log("Audio Unlocked!");
    }).catch(e => console.log("Unlock Failed:", e));
}

// --- メニューデータ ---
const menuData = {
    drink: [{ name: '生ビール', price: 500, icon: '🍺' }, { name: 'ハイボール', price: 480, icon: '🥃' }, { name: 'レモンサワー', price: 400, icon: '🍋' }],
    food: [{ name: '枝豆', price: 300, icon: '🌱' }, { name: '唐揚げ', price: 600, icon: '🍗' }, { name: '焼き鳥', price: 450, icon: '🍢' }],
    main: [{ name: 'おにぎり', price: 200, icon: '🍙' }, { name: '焼きそば', price: 700, icon: '🥢' }]
};

let currentOrder = [];
let discount = 0;

// カテゴリ切り替え
function switchCategory(cat) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + cat).classList.add('active');
    const container = document.getElementById('menu-container');
    container.innerHTML = '';
    menuData[cat].forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'menu-item-btn';
        btn.innerHTML = `${item.icon} ${item.name}<br>¥${item.price}`;
        btn.onclick = () => addItem(item.name, item.price);
        container.appendChild(btn);
    });
}

function addItem(name, price) {
    console.log("Adding item:", name); // PCのコンソールで確認用
    
    // ロック解除を兼ねて再生
    pipSound.currentTime = 0;
    pipSound.play().catch(e => {
        console.log("再生に失敗しました。画面を一度クリックしてください。", e);
    });

    currentOrder.push({ name, price });
    updateDisplay();
}

// ページが読み込まれたら、どこでもいいからクリックした時にロック解除するようにする
document.addEventListener('click', unlockAudio, { once: true });

function updateDisplay() {
    const list = document.getElementById('order-list');
    list.innerHTML = '';
    let subtotal = currentOrder.reduce((s, i) => s + i.price, 0);
    currentOrder.forEach(item => {
        list.innerHTML += `<div class="order-item"><span>${item.name}</span><span>¥${item.price}</span></div>`;
    });
    const total = Math.max(0, subtotal - discount);
    document.getElementById('total-amount').innerText = `¥${total.toLocaleString()}`;
}

// 会計開始（Firebaseへ書き込み）
function startCheckout() {
    const total = parseInt(document.getElementById('total-amount').innerText.replace(/[¥,]/g, ''));
    if (total <= 0) return;

    // Firebaseへ送信
    database.ref('current_pay').set({
        amount: total,
        status: 'waiting'
    });

    // QRコード生成 (このHTMLファイルのURLをQRにする。実際はデプロイ後のURLに変更が必要)
    const currentUrl = "https://1177231mm-dev.github.io/cashier/pay.html";
    document.getElementById('qr-area').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentUrl}">`;
    document.getElementById('modal-total').innerText = `¥${total.toLocaleString()}`;
    document.getElementById('checkout-modal').classList.remove('hidden');

    // 支払い監視
    database.ref('current_pay/status').on('value', (snap) => {
        if (snap.val() === 'paid') {
            cashSound.play();
            alert("お支払いありがとうございました！");
            database.ref('current_pay').set(null); // クリア
            location.reload(); // 画面リセット
        }
    });
}

function applyDiscount(amt) { discount += amt; updateDisplay(); }
function applyHalfPrice() { let s = currentOrder.reduce((s, i) => s + i.price, 0); discount = Math.floor(s / 2); updateDisplay(); }
function clearOrder() { currentOrder = []; discount = 0; updateDisplay(); }
function closeCheckout() { document.getElementById('checkout-modal').classList.add('hidden'); database.ref('current_pay').set(null); }


switchCategory('drink');




