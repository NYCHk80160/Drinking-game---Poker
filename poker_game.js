// ==========================
// 1. 基本資料與常數定義
// ==========================

// 定義花色和點數
const suits = ['黑桃', '紅心', '鑽石', '梅花']; // 撲克牌四種花色
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']; // 撲克牌點數
const jokers = [
    { suit: 'Joker', rank: 'Joker1', img: 'Joker 1.jpeg' }, // 第一張鬼牌
    { suit: 'Joker', rank: 'Joker2', img: 'Joker 2.jpeg' }  // 第二張鬼牌
];

// ==========================
// 2. 快取物件與圖片快取
// ==========================

// 建立快取物件以提升 DOM 查找效能
const domCache = {};

// 建立圖片快取物件以減少重複載入
const imageCache = {};

// ==========================
// 3. 預載圖片
// ==========================

// 預載撲克牌圖片，讓遊戲過程中更順暢
function preloadCardImages() {
    // suitMap 用來對應中文花色與英文檔名
    const suitMap = {
        '黑桃': 'Spades',
        '紅心': 'Heart',
        '鑽石': 'Diamond',
        '梅花': 'Clubs'
    };
    
    // 建立預載圖片的佇列
    const imagesToPreload = [];
    
    // 儲存鬼牌圖片
    jokers.forEach(joker => {
        imagesToPreload.push(`pokers image/${joker.img}`);
    });
    
    // 儲存部分普通牌（最多10張）進行初步載入
    let count = 0;
    for (const suit of suits) {
        for (const rank of ranks) {
            if (count < 10) { // 只先載入10張
                imagesToPreload.push(`pokers image/${suitMap[suit]} ${rank}.jpeg`);
                count++;
            }
        }
    }
    
    // 利用 requestIdleCallback 在空閒時間載入圖片
    requestIdleCallback(() => {
        imagesToPreload.forEach(src => {
            if (!imageCache[src]) {
                const img = new Image();
                img.src = src;
                imageCache[src] = img;
            }
        });
    }, { timeout: 1000 });
    
    // 延遲3秒後載入其餘牌面圖片
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

// ==========================
// 4. 音效播放
// ==========================

// 根據 HTML 中的音效 ID 播放對應聲音
function playSound(id) {
    const audio = document.getElementById(id);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('播放失敗:', e));
    }
}

// ==========================
// 5. 遊戲規則定義
// ==========================

// 定義遊戲規則（以點數為 key）
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

// ==========================
// 6. 牌堆建立與洗牌
// ==========================

// 根據設定是否包含 Joker 建立完整牌堆
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

// 洗牌函數 - 使用 Fisher-Yates 演算法重新排列牌堆
function shuffleDeck(deck) {
    const newDeck = [...deck]; // 複製一份避免改動原本的 deck
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

// ==========================
// 7. 遊戲狀態變數
// ==========================

let includeJoker = false; // 是否包含鬼牌
let allowRepeat = false;  // 是否允許重複抽牌
let gameDeck = [];        // 遊戲中的牌堆
let MAX_CARDS = 0;        // 牌堆總數
let drawnCount = 0;       // 已抽牌數

// ==========================
// 8. 牌堆初始化與剩餘顯示
// ==========================

// 將牌洗好並重設抽牌計數
function initializeDeck() {
    gameDeck = shuffleDeck(createDeck(includeJoker));
    MAX_CARDS = gameDeck.length;
    drawnCount = 0;
    updateRemainingDisplay();
}

// 顯示剩下多少牌或已抽幾張
function updateRemainingDisplay() {
    if (!domCache.remaining) {
        domCache.remaining = document.getElementById('remaining');
    }
    domCache.remaining.textContent = allowRepeat
        ? `已抽：${drawnCount}`
        : `剩餘牌數：${gameDeck.length} (已抽：${drawnCount}/${MAX_CARDS})`;
}

// ==========================
// 9. 抽牌流程與動畫
// ==========================

// 抽牌函數 - 防止連續快速點擊抽牌並觸發動畫與抽牌流程
let isDrawing = false;
let isFirstDraw = true;
function drawCard() {
    // 第一次抽牌時播放開始音效
    if (isFirstDraw) {
        playSound('start-audio');
        isFirstDraw = false;
    }

    if (isDrawing) return;
    isDrawing = true;
    
    // 初始化必要 DOM 元件
    if (!domCache.drawBtn) {
        domCache.drawBtn = document.getElementById('draw-button');
        domCache.deck = document.getElementById('deck');
        domCache.cardElement = document.getElementById('card');
    }
    
    // 禁用抽牌按鈕並開始動畫
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

// ==========================
// 10. 抽牌動畫
// ==========================

// 當玩家點擊抽牌時，執行視覺效果
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

// ==========================
// 11. 顯示卡片與規則
// ==========================

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
        playSound('draw-audio'); // ✅ 抽牌時播放音效
        
    }, 200);

    domCache.ruleDisplay.textContent = `規則：${rule}`;

    if (rank === 'Joker1' || rank === 'Joker2') rule = '免飲一杯 🍀';
    if (rank === 'K') rule += '（飲啦飲啦！）';

    // 隨機顯示一句香港口語和 emoji
    const hkSlang = [
      "飲啦飲啦！", 
      "唔好縮！", 
      "快啲啦！", 
      "你都幾伏喎！", 
      "今晚唔醉唔歸！", 
      "大佬，頂住先！", 
      "飲多啲，身體好！", 
      "唔好扮嘢！", 
      "有冇搞錯呀？", 
      "咁都得？"
    ];
    const hkEmojis = ["🍻", "🥢", "🍲", "🧋", "🀄️", "🥤"];

    let randomSlang = hkSlang[Math.floor(Math.random() * hkSlang.length)];
    let randomEmoji = hkEmojis[Math.floor(Math.random() * hkEmojis.length)];
    domCache.ruleDisplay.textContent = `規則：${rule}　${randomSlang}`;
}

// ==========================
// 12. 洗牌動畫
// ==========================

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

// ==========================
// 13. 建立視覺牌堆
// ==========================

// 創建牌堆卡片
function createDeckCards() {
    if (!domCache.deck) {
        domCache.deck = document.getElementById('deck');
        playSound('start-audio'); // ✅ 加入開始音效
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

// ==========================
// 14. 音效預載
// ==========================

// Audio effects setup
const audioFiles = {
    shuffle: 'sounds/shuffle.mp3',
    draw:    'sounds/draw.mp3',
    flip:    'sounds/flip.mp3',
    end:     'sounds/end.mp3'
};
const sounds = {};
let soundEnabled = true;

// 播放抽牌、翻牌、洗牌與結束音效
function preloadSounds() {
    for (const key in audioFiles) {
        const a = new Audio(audioFiles[key]);
        a.load();
        sounds[key] = a;
    }
}

// ==========================
// 15. DOM 快取初始化
// ==========================

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
    domCache.bgmToggle = document.getElementById('bgm-toggle');
    domCache.bgMusic = document.getElementById('bg-music');
}

// ==========================
// 16. 頁面載入初始化
// ==========================

window.addEventListener('DOMContentLoaded', () => {
    // 初始化DOM緩存
    initializeDomCache();
    // 預設關閉背景音樂
    if (domCache.bgMusic) {
        try { domCache.bgMusic.pause(); } catch(_){}
        domCache.bgMusic.currentTime = 0;
        domCache.bgMusic.muted = true;
    }
    
    // 初始化牌組
    initializeDeck();
    createDeckCards();
    
    // 預加載常用卡片圖片
    preloadCardImages();
    preloadSounds();
    domCache.soundToggle.addEventListener('change', e => {
        soundEnabled = e.target.checked;
    });
    // 背景音樂開關
    if (domCache.bgmToggle) {
        // 確保 loop 屬性存在（某些瀏覽器移除/複製節點後可能失去）
        if (domCache.bgMusic) domCache.bgMusic.loop = true;
        domCache.bgmToggle.addEventListener('change', e => {
            const enabled = e.target.checked;
            const bgm = domCache.bgMusic;
            if (!bgm) return;
            if (enabled) {
                // 從頭開始播放
                try { bgm.pause(); } catch(_){}
                bgm.currentTime = 0;
                bgm.muted = false;
                // 若使用者之前未與頁面互動，play 可能被瀏覽器阻擋
                bgm.play().catch(()=>{});
            } else {
                // 停止並重置，確保下次開啟也從頭
                try { bgm.pause(); } catch(_){}
                bgm.currentTime = 0;
                bgm.muted = true;
            }
        });
        // 兼容：如果 loop 被忽略，手動在 ended 事件重播
        if (domCache.bgMusic) {
            domCache.bgMusic.addEventListener('ended', function(){
                if (!domCache.bgmToggle.checked) return; // 已關閉則不重播
                this.currentTime = 0;
                this.play().catch(()=>{});
            });
        }
    }
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

// ==========================
// 17. 其他輔助函數
// ==========================

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

// 設定標籤閃爍效果
function flashSettingLabel(label) {
  label.classList.add('flash');
  setTimeout(() => label.classList.remove('flash'), 500);
}

// Joker 設定變更時閃爍提示
domCache.jokerSetting.addEventListener('change', function(e) {
  includeJoker = e.target.checked;
  initializeDeck();
  createDeckCards();
  flashSettingLabel(this.parentElement);
});

// 圖片載入失敗時顯示背面
imgEl.onerror = function() {
  imgEl.src = 'pokers image/Poker Back.jpeg';
  imgEl.alt = '圖片載入失敗';
};