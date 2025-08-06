// 定義花色和點數
const suits = ['黑桃', '紅心', '鑽石', '梅花'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const jokers = [
    { suit: 'Joker', rank: 'Joker1', img: 'Joker 1.jpeg' },
    { suit: 'Joker', rank: 'Joker2', img: 'Joker 2.jpeg' }
];

// Cache DOM elements for better performance
const domCache = {};

// Image preloading system
const imageCache = {};

// Preload card images to improve performance
function preloadCardImages() {
    const suitMap = {
        '黑桃': 'Spades',
        '紅心': 'Heart',
        '鑽石': 'Diamond',
        '梅花': 'Clubs'
    };
    
    // Create a queue of images to preload
    const imagesToPreload = [];
    
    // Add jokers
    jokers.forEach(joker => {
        imagesToPreload.push(`pokers image/${joker.img}`);
    });
    
    // Add regular cards (first 10 only for initial loading)
    let count = 0;
    for (const suit of suits) {
        for (const rank of ranks) {
            if (count < 10) { // Limit initial preloading
                imagesToPreload.push(`pokers image/${suitMap[suit]} ${rank}.jpeg`);
                count++;
            }
        }
    }
    
    // Preload the images in the background
    requestIdleCallback(() => {
        imagesToPreload.forEach(src => {
            if (!imageCache[src]) {
                const img = new Image();
                img.src = src;
                imageCache[src] = img;
            }
        });
    }, { timeout: 1000 });
    
    // Preload remaining images after a delay
    setTimeout(() => {
        requestIdleCallback(() => {
            for (const suit of suits) {
                for (const rank of ranks) {
                    const src = `pokers image/${suitMap[suit]} ${rank}.jpeg`;
                    if (!imageCache[src]) {
                        const img = new Image();
                        img.src = src;
                        imageCache[src] = img;
                    }
                }
            }
        }, { timeout: 2000 });
    }, 3000);
}

// 定義遊戲規則
const rules = {
    'A': '指個一人飲',
    '2': '陪飲員 (無論邊個玩家要飲，陪飲員都要同佢一齊飲，直到下一個人抽到2為止)',
    '3': '大細波 (玩家用手做出大波嘅動作，要講「細波」，相反做出細波嘅動作，就要講「大波」，做錯嘅玩家飲一啖)',
    '4': '開規矩 (自定一個規則，遊戲期間犯規嘅玩家就要飲一啖。之後抽到4嘅玩家可以繼續開新嘅規則/取消之前嘅規則)',
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

// 洗牌函數 - Fisher-Yates shuffle algorithm (optimized)
function shuffleDeck(deck) {
    const newDeck = [...deck]; // Create a copy to avoid modifying the original
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

// 初始化牌組
let includeJoker = false;
let allowRepeat = false;
let gameDeck = [];
let MAX_CARDS = 0;
let drawnCount = 0;

// Initialize deck - moved to a function for better organization
function initializeDeck() {
    gameDeck = shuffleDeck(createDeck(includeJoker));
    MAX_CARDS = gameDeck.length;
    drawnCount = 0;
    updateRemainingDisplay();
}

// Update remaining display - extracted to a function to avoid code duplication
function updateRemainingDisplay() {
    if (!domCache.remaining) {
        domCache.remaining = document.getElementById('remaining');
    }
    
    domCache.remaining.textContent = allowRepeat
        ? `已抽：${drawnCount}`
        : `剩餘牌數：${gameDeck.length} (已抽：${drawnCount}/${MAX_CARDS})`;
}

// 抽牌函數 - debounced to prevent rapid clicks
let isDrawing = false;
function drawCard() {
    if (isDrawing) return;
    
    isDrawing = true;
    
    if (!domCache.drawBtn) {
        domCache.drawBtn = document.getElementById('draw-button');
        domCache.deck = document.getElementById('deck');
        domCache.cardElement = document.getElementById('card');
    }
    
    domCache.drawBtn.disabled = true;
    domCache.drawBtn.style.opacity = '0.6';
    
    // 隱藏抽出的卡片
    domCache.cardElement.classList.remove('visible');
    
    // 開始抽牌動畫
    startDrawAnimation();
    
    // 抽牌邏輯
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
        if (soundEnabled) sounds.draw.play();
        
        // 觸發洗牌動畫
        setTimeout(() => {
            shuffleAnimation();
            
            // 恢復按鈕狀態 - 調整至與動畫完成時間一致 (800ms 後)
            setTimeout(() => {
                domCache.drawBtn.disabled = false;
                domCache.drawBtn.style.opacity = '1';
                isDrawing = false;
            }, 850); // 使用 850ms 確保動畫完全結束後才啟用按鈕
            
        }, 200);
        
        // 更新剩餘牌數顯示
        updateRemainingDisplay();
            
    }, 600);
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
        }, 80);
        
        // 動畫完成後移除該牌並補充新牌
        setTimeout(() => {
            topCard.remove();
            
            // 重新排列剩餘牌的z-index並添加新牌保持連續性
            const remainingCards = document.querySelectorAll('.deck-card');
            const deck = domCache.deck || document.getElementById('deck');
            
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
            
        }, 800);
    }
}

// 使用圖片緩存系統顯示卡片
function displayCard(card) {
    if (!domCache.cardElement) {
        domCache.cardElement = document.getElementById('card');
        domCache.front = document.querySelector('.front');
        domCache.ruleDisplay = document.getElementById('rule-display');
    }
    
    const rank = card.rank;
    let rule = rules[rank];
    if (rank === 'Joker1' || rank === 'Joker2') rule = '免飲一杯';

    domCache.front.textContent = '';
    domCache.front.style.color = '#3b3b6d';

    // 顯示卡片並翻轉
    domCache.cardElement.classList.add('visible');
    
    setTimeout(() => {
        // 以相片取代 emoji
        let imgSrc;
        if (card.suit === 'Joker') {
            imgSrc = `pokers image/${card.img}`;
        } else {
            const suitMap = {
                '黑桃': 'Spades',
                '紅心': 'Heart',
                '鑽石': 'Diamond',
                '梅花': 'Clubs'
            };
            imgSrc = `pokers image/${suitMap[card.suit]} ${rank}.jpeg`;
        }
        
        // 使用已緩存的圖片或創建新的圖片元素
        const imgEl = document.createElement('img');
        imgEl.alt = card.suit + ' ' + rank;
        imgEl.style = "width:90px;height:130px;object-fit:contain;border-radius:10px;box-shadow:0 2px 8px rgba(60,60,120,0.12);";
        imgEl.src = imgSrc;
        
        // 如果已經預加載過這張圖片，使用緩存版本
        if (imageCache[imgSrc]) {
            imgEl.src = imageCache[imgSrc].src;
        } else {
            // 否則將這張圖片加入緩存
            imageCache[imgSrc] = imgEl;
        }
        
        domCache.front.innerHTML = '';
        domCache.front.appendChild(imgEl);
        
        // 翻牌動畫
        domCache.cardElement.classList.remove('flipped');
        if (soundEnabled) sounds.flip.play();
        
    }, 200);

    domCache.ruleDisplay.textContent = `規則：${rule}`;
}

// 洗牌動畫
function shuffleAnimation() {
    if (!domCache.deck) {
        domCache.deck = document.getElementById('deck');
    }
    if (soundEnabled) sounds.shuffle.play();
    domCache.deck.classList.add('shuffling');
    
    setTimeout(() => {
        domCache.deck.classList.remove('shuffling');
    }, 850);
}

// 創建牌堆卡片
function createDeckCards() {
    if (!domCache.deck) {
        domCache.deck = document.getElementById('deck');
    }
    
    domCache.deck.innerHTML = '';
    
    // 使用DocumentFragment提高性能
    const fragment = document.createDocumentFragment();
    
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
        fragment.appendChild(deckCard);
    }
    
    // 一次性將所有卡片添加到DOM
    domCache.deck.appendChild(fragment);
    
    // 錯開入場時間
    for (let i = 1; i <= 5; i++) {
        const deckCard = domCache.deck.querySelector(`.deck-card-${i}`);
        setTimeout(() => {
            deckCard.style.transition = 'all 0.3s ease';
            deckCard.style.opacity = '1';
            deckCard.style.transform = 'scale(1)';
        }, i * 50);
    }
}

// Audio effects setup
const audioFiles = {
    shuffle: 'sounds/shuffle.mp3',
    draw:    'sounds/draw.mp3',
    flip:    'sounds/flip.mp3',
    end:     'sounds/end.mp3'
};
const sounds = {};
let soundEnabled = true;

function preloadSounds() {
    for (const key in audioFiles) {
        const a = new Audio(audioFiles[key]);
        a.load();
        sounds[key] = a;
    }
}

// 初始化DOM元素緩存
function initializeDomCache() {
    domCache.drawBtn = document.getElementById('draw-button');
    domCache.endBtn = document.getElementById('end-button');
    domCache.jokerSetting = document.getElementById('joker-setting');
    domCache.repeatSetting = document.getElementById('repeat-setting');
    domCache.cardElement = document.getElementById('card');
    domCache.deck = document.getElementById('deck');
    domCache.front = document.querySelector('.front');
    domCache.remaining = document.getElementById('remaining');
    domCache.ruleDisplay = document.getElementById('rule-display');
    domCache.soundToggle = document.getElementById('sound-toggle');
}

// 頁面載入時執行
window.addEventListener('DOMContentLoaded', () => {
    // 初始化DOM緩存
    initializeDomCache();
    
    // 初始化牌組
    initializeDeck();
    createDeckCards();
    
    // 預加載常用卡片圖片
    preloadCardImages();
    preloadSounds();
    domCache.soundToggle.addEventListener('change', e => {
        soundEnabled = e.target.checked;
    });
    // end-button click (add end sound)
    domCache.endBtn.addEventListener('click', function() {
        if (soundEnabled) sounds.end.play();
        if (confirm('確定要結束遊戲嗎？')) {
            location.reload();
        }
    });
    
    // 設定區事件
    domCache.jokerSetting.addEventListener('change', function(e) {
        includeJoker = e.target.checked;
        initializeDeck();
        createDeckCards();
    });
    
    domCache.repeatSetting.addEventListener('change', function(e) {
        allowRepeat = e.target.checked;
        initializeDeck();
        createDeckCards();
    });
    
    // 綁定按鈕事件 - 使用事件委託
    domCache.drawBtn.addEventListener('click', drawCard);
});

// 強制重繪函數
function forceRedraw(element) {
    element.style.transition = 'none';
    void element.offsetHeight;
    element.style.transition = '';
}

// Polyfill for requestIdleCallback
if (!window.requestIdleCallback) {
    window.requestIdleCallback = function(callback, options) {
        const start = Date.now();
        return setTimeout(function() {
            callback({
                didTimeout: false,
                timeRemaining: function() {
                    return Math.max(0, 50 - (Date.now() - start));
                }
            });
        }, options?.timeout || 1);
    };
}