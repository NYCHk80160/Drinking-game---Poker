// 定義花色和點數
const suits = ['黑桃', '紅心', '鑽石', '梅花'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];


// 定義遊戲規則
const rules = {
    'A': '指個一人飲',
    '2': '陪飲員 (無論邊個玩家要飲，陪飲員都要同佢一齊飲，直到下一個人抽到2為止)',
    '3': '大細波 (玩家用手做出大波嘅動作，要講「細波」，相反做出細波嘅動作，就要講「大波」，做錯嘅玩家飲一啖)',
    '4': '開規矩 (自定一個規則，遊戲期間犯規嘅玩家就要飲一啖。之後抽到4嘅玩家可以繼續開新嘅規矩/取消之前嘅規矩)',
    '5': '圍枚',
    '6': '開topic (自定一個Topic話題，玩家輪流回答，講唔出或者講重複就要飲一啖)',
    '7': '拍7 (玩家隨機講一個數字，其餘玩家順次序報數，當有7或者係7嘅倍數嘅數字出現就要用拍手代替，並且輪翻到上家繼續嗌。數字7或者7嘅倍數冇拍手嘅玩家，飲一啖)',
    '8': '廁所卡 (抽到牌嘅玩家可以keep住，等需要去廁所時候用)',
    '9': '撞機 (玩家任意由1開始報數，同時講出相同數字/重複講過嘅數字或者最後一個報數嘅玩家飲一啖)',
    '10': '癡線佬 (其他玩家如果應「癡線佬」就要飲一啖)',
    'J': '上家飲',
    'Q': '下家飲',
    'K': '自己飲'
};

// 生成一副牌
function createDeck() {
    let deck = [];
    suits.forEach(suit => {
        ranks.forEach(rank => {
            deck.push({ suit, rank });
        });
    });
    return deck;
}

// 洗牌函數
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 初始化牌組
let deck = shuffleDeck(createDeck());
const MAX_CARDS = 52; // 最大抽取張數
let drawnCount = 0;

// 抽牌函數
function drawCard() {
    const drawBtn = document.getElementById('draw-button');
    drawBtn.disabled = true;
    drawBtn.style.opacity = '0.6';

    if (drawnCount >= MAX_CARDS) {
        deck = shuffleDeck(createDeck());
        drawnCount = 0;
        alert('已抽完 52 張牌，重新洗牌，遊戲繼續！');
    }
    if (deck.length === 0) {
        deck = shuffleDeck(createDeck());
    }

    const card = deck.pop();
    drawnCount++;
    const rank = card.rank;
    const rule = rules[rank];

    const front = document.querySelector('.front');
    front.textContent = '';
    front.style.color = '#3b3b6d';

    // 抽牌閃爍動畫
    front.animate([
        { opacity: 0.2 },
        { opacity: 1 }
    ], {
        duration: 180,
        easing: 'ease-in'
    });

    setTimeout(() => {
        // 以相片取代 emoji
        const suitMap = {
            '黑桃': 'Spades',
            '紅心': 'Heart',
            '鑽石': 'Diamond',
            '梅花': 'Clubs'
        };
        let imgName = `${suitMap[card.suit]} ${rank}`;
        // J Q K A 處理
        if (rank === 'J') imgName += '.jpeg';
        else if (rank === 'Q') imgName += '.jpeg';
        else if (rank === 'K') imgName += '.jpeg';
        else if (rank === 'A') imgName += '.jpeg';
        else imgName += '.jpeg';
        front.textContent = '';
        front.style.background = 'none';
        front.innerHTML = `<img src="pokers image/${imgName}" alt="${imgName}" style="width:90px;height:130px;object-fit:contain;border-radius:10px;box-shadow:0 2px 8px rgba(60,60,120,0.12);">`;
    }, 180);

    document.getElementById('rule-display').textContent = `規則：${rule}`;
    document.getElementById('remaining').textContent = `剩餘牌數：${deck.length} (已抽：${drawnCount}/52)`;

    const cardElement = document.getElementById('card');
    forceRedraw(cardElement);
    cardElement.classList.add('flipped');

    // 抽牌音效（如有 audio 檔可啟用）
    // let audio = document.getElementById('draw-audio');
    // if (audio) audio.play();

    setTimeout(() => {
        cardElement.classList.remove('flipped');
        drawBtn.disabled = false;
        drawBtn.style.opacity = '1';
    }, 900); // 0.9秒後翻回牌背並解鎖按鈕
}

// 綁定按鈕事件
document.getElementById('draw-button').addEventListener('click', drawCard);

// 頁面載入時顯示牌背
window.addEventListener('DOMContentLoaded', () => {
    const cardElement = document.getElementById('card');
    cardElement.classList.add('flipped');
    // 立即清除動畫殘留，確保第一次抽牌速度正常
    setTimeout(() => {
        cardElement.style.transition = 'none';
        cardElement.offsetHeight; // 強制重繪
        cardElement.style.transition = '';
    }, 10);
});
    // 強制重繪，確保第一次動畫速度一致
    cardElement.style.transition = 'none';
    void cardElement.offsetHeight;
    cardElement.style.transition = '';
function forceRedraw(element) {
    element.style.transition = 'none';
    void element.offsetHeight;
    element.style.transition = '';
}
