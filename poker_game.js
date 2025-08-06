// 定義花色和點數
const suits = ['黑桃', '紅心', '鑽石', '梅花'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const jokers = [
    { suit: 'Joker', rank: 'Joker1', img: 'Joker 1.jpeg' },
    { suit: 'Joker', rank: 'Joker2', img: 'Joker 2.jpeg' }
];


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
function createDeck(includeJoker = false) {
    let deck = [];
    suits.forEach(suit => {
        ranks.forEach(rank => {
            deck.push({ suit, rank });
        });
    });
    if (includeJoker) {
        deck = deck.concat(jokers);
    }
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
let includeJoker = false;
let allowRepeat = false;
let gameDeck = shuffleDeck(createDeck(includeJoker));
let MAX_CARDS = gameDeck.length;
let drawnCount = 0;

// 抽牌函數
function drawCard() {
    const drawBtn = document.getElementById('draw-button');
    const deck = document.getElementById('deck');
    const cardElement = document.getElementById('card');
    
    drawBtn.disabled = true;
    drawBtn.style.opacity = '0.6';
    
    // 隱藏抽出的卡片
    cardElement.classList.remove('visible');
    
    // 開始抽牌動畫
    startDrawAnimation();
    
    // 允許重複出現時，直接隨機抽取
    let card;
    if (allowRepeat) {
        const allDeck = createDeck(includeJoker);
        card = allDeck[Math.floor(Math.random() * allDeck.length)];
        drawnCount++;
    } else {
        if (drawnCount >= MAX_CARDS) {
            gameDeck = shuffleDeck(createDeck(includeJoker));
            drawnCount = 0;
            alert(`已抽完 ${MAX_CARDS} 張牌，重新洗牌，遊戲繼續！`);
        }
        if (gameDeck.length === 0) {
            gameDeck = shuffleDeck(createDeck(includeJoker));
        }
        card = gameDeck.pop();
        drawnCount++;
    }
    
    // 延遲顯示卡片內容，等待抽牌動畫完成
    setTimeout(() => {
        displayCard(card);
        
        // 觸發洗牌動畫
        setTimeout(() => {
            shuffleAnimation();
        }, 200);
        
        // 更新剩餘牌數顯示
        document.getElementById('remaining').textContent = allowRepeat
            ? `已抽：${drawnCount}`
            : `剩餘牌數：${gameDeck.length} (已抽：${drawnCount}/${MAX_CARDS})`;
            
        // 恢復按鈕狀態
        setTimeout(() => {
            drawBtn.disabled = false;
            drawBtn.style.opacity = '1';
        }, 300);
        
    }, 600); // 減少等待時間，配合更快的動畫
}

// 開始抽牌動畫
function startDrawAnimation() {
    const deckCards = document.querySelectorAll('.deck-card');
    const topCard = deckCards[0]; // 最上層的牌
    
    if (topCard) {
        // 添加輕微的卡頓效果
        topCard.style.transform = 'translateY(-2px)';
        
        setTimeout(() => {
            topCard.classList.add('drawing');
            
            // 這裡可以添加摩擦音效
            // playSound('cardDraw');
            
        }, 80); // 加快卡頓恢復速度
        
        // 動畫完成後移除該牌並補充新牌
        setTimeout(() => {
            topCard.remove();
            
            // 重新排列剩餘牌的z-index並添加新牌保持連續性
            const remainingCards = document.querySelectorAll('.deck-card');
            const deck = document.getElementById('deck');
            
            // 重新排列現有牌
            remainingCards.forEach((card, index) => {
                card.style.zIndex = remainingCards.length - index;
                card.className = `deck-card deck-card-${index + 1}`;
                // 更新位置
                card.style.top = `${-2 * index}px`;
                card.style.left = `${index}px`;
            });
            
            // 如果牌數少於3張，添加新牌保持視覺連續性
            if (remainingCards.length < 3) {
                const newCard = document.createElement('div');
                newCard.className = `deck-card deck-card-${remainingCards.length + 1}`;
                newCard.style.top = `${-2 * remainingCards.length}px`;
                newCard.style.left = `${remainingCards.length}px`;
                newCard.style.zIndex = 1;
                
                // 添加入場動畫
                newCard.style.opacity = '0';
                newCard.style.transform = 'scale(0.9)';
                deck.appendChild(newCard);
                
                setTimeout(() => {
                    newCard.style.transition = 'all 0.3s ease';
                    newCard.style.opacity = '1';
                    newCard.style.transform = 'scale(1)';
                }, 50);
            }
            
        }, 800); // 配合更快的動畫時間
    }
}


// 顯示抽出的卡片
function displayCard(card) {
    const cardElement = document.getElementById('card');
    const front = document.querySelector('.front');
    const rank = card.rank;
    let rule = rules[rank];
    if (rank === 'Joker1' || rank === 'Joker2') rule = '免飲一杯';

    front.textContent = '';
    front.style.color = '#3b3b6d';

    // 顯示卡片並翻轉
    cardElement.classList.add('visible');
    
    setTimeout(() => {
        // 以相片取代 emoji
        if (card.suit === 'Joker') {
            front.innerHTML = `<img src="pokers image/${card.img}" alt="Joker" style="width:90px;height:130px;object-fit:contain;border-radius:10px;box-shadow:0 2px 8px rgba(60,60,120,0.12);">`;
        } else {
            const suitMap = {
                '黑桃': 'Spades',
                '紅心': 'Heart',
                '鑽石': 'Diamond',
                '梅花': 'Clubs'
            };
            let imgName = `${suitMap[card.suit]} ${rank}.jpeg`;
            front.innerHTML = `<img src="pokers image/${imgName}" alt="${imgName}" style="width:90px;height:130px;object-fit:contain;border-radius:10px;box-shadow:0 2px 8px rgba(60,60,120,0.12);">`;
        }
        
        // 翻牌動畫
        cardElement.classList.remove('flipped');
        
    }, 200);

    document.getElementById('rule-display').textContent = `規則：${rule}`;
}

// 洗牌動畫
function shuffleAnimation() {
    const deck = document.getElementById('deck');
    deck.classList.add('shuffling');
    
    // 這裡可以添加洗牌音效
    // playSound('cardShuffle');
    
    setTimeout(() => {
        deck.classList.remove('shuffling');
    }, 850); // 增加洗牌動畫時間，讓效果更明顯
}

// 音效播放函數（預留接口）
function playSound(soundType) {
    // 可以在這裡添加音效播放邏輯
    // 例如：
    // const audio = new Audio(`sounds/${soundType}.mp3`);
    // audio.play().catch(e => console.log('Audio play failed:', e));
}

// 創建牌堆卡片
function createDeckCards() {
    const deck = document.getElementById('deck');
    deck.innerHTML = '';
    
    // 確保總是創建5張牌的視覺效果
    for (let i = 1; i <= 5; i++) {
        const deckCard = document.createElement('div');
        deckCard.className = `deck-card deck-card-${i}`;
        deckCard.style.top = `${-2 * (i - 1)}px`;
        deckCard.style.left = `${i - 1}px`;
        deckCard.style.zIndex = 6 - i;
        
        // 添加入場動畫
        deckCard.style.opacity = '0';
        deckCard.style.transform = 'scale(0.95)';
        deck.appendChild(deckCard);
        
        // 錯開入場時間
        setTimeout(() => {
            deckCard.style.transition = 'all 0.3s ease';
            deckCard.style.opacity = '1';
            deckCard.style.transform = 'scale(1)';
        }, i * 50);
    }
}

// 綁定按鈕事件
document.getElementById('draw-button').addEventListener('click', drawCard);
document.getElementById('end-button').addEventListener('click', function() {
    if (confirm('確定要結束遊戲嗎？')) {
        location.reload();
    }
});

// 頁面載入時顯示牌背
window.addEventListener('DOMContentLoaded', () => {
    const cardElement = document.getElementById('card');
    
    // 初始化牌堆
    createDeckCards();
    
    // 初始卡片狀態
    cardElement.classList.add('flipped');
    setTimeout(() => {
        cardElement.style.transition = 'none';
        cardElement.offsetHeight;
        cardElement.style.transition = '';
    }, 10);
    
    // 設定區事件
    document.getElementById('joker-setting').addEventListener('change', function(e) {
        includeJoker = e.target.checked;
        gameDeck = shuffleDeck(createDeck(includeJoker));
        MAX_CARDS = gameDeck.length;
        drawnCount = 0;
        
        // 重新創建牌堆
        createDeckCards();
        
        document.getElementById('remaining').textContent = `剩餘牌數：${gameDeck.length} (已抽：${drawnCount}/${MAX_CARDS})`;
    });
    
    document.getElementById('repeat-setting').addEventListener('change', function(e) {
        allowRepeat = e.target.checked;
        gameDeck = shuffleDeck(createDeck(includeJoker));
        MAX_CARDS = gameDeck.length;
        drawnCount = 0;
        
        // 重新創建牌堆
        createDeckCards();
        
        document.getElementById('remaining').textContent = allowRepeat
            ? `已抽：${drawnCount}`
            : `剩餘牌數：${gameDeck.length} (已抽：${drawnCount}/${MAX_CARDS})`;
    });
});

// 強制重繪函數
function forceRedraw(element) {
    element.style.transition = 'none';
    void element.offsetHeight;
    element.style.transition = '';
}