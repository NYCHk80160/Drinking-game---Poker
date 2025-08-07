/**
 * 🎴 Image Preload Manager
 * 
 * Efficiently preloads and caches images for smoother gameplay.
 */

class PreloadManager {
    constructor() {
        this.imageCache = {};     // 快取已載入的圖片
        this.isPreloading = false;
        this.queue = [];          // 等待載入的圖片清單
        this.processed = 0;       // 已處理的圖片數
        this.total = 0;           // 總共要處理的圖片數
    }

    /**
     * 📦 預載單張圖片並存入快取
     * @param {string} src - 圖片 URL
     * @returns {Promise<HTMLImageElement>}
     */
    preloadImage(src) {
        if (this.imageCache[src]) {
            return Promise.resolve(this.imageCache[src]);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache[src] = img;
                this.processed++;
                resolve(img);
            };
            img.onerror = () => {
                this.processed++;
                reject(new Error(`❌ Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    /**
     * 📋 加入圖片至預載佇列
     * @param {Array<string>} images - 圖片 URL 陣列
     */
    addToQueue(images) {
        this.queue = [...this.queue, ...images];
        this.total = this.queue.length;
    }

    /**
     * 🕒 使用 requestIdleCallback 分批處理預載佇列
     * @param {number} chunkSize - 每次 idle callback 處理的圖片數
     */
    processQueue(chunkSize = 3) {
        if (this.isPreloading || this.queue.length === 0) return;

        this.isPreloading = true;

        const processChunk = (deadline) => {
            while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && this.queue.length > 0) {
                const nextImage = this.queue.shift();
                this.preloadImage(nextImage).catch(err => console.warn(err));
            }

            if (this.queue.length > 0) {
                requestIdleCallback(processChunk, { timeout: 1000 });
            } else {
                this.isPreloading = false;
                console.log(`✅ Preloading complete: ${this.processed}/${this.total} images loaded`);
            }
        };

        requestIdleCallback(processChunk, { timeout: 1000 });
    }

    /**
     * 🔍 從快取中取得圖片
     * @param {string} src
     * @returns {HTMLImageElement|null}
     */
    getFromCache(src) {
        return this.imageCache[src] || null;
    }

    /**
     * ✅ 檢查圖片是否已快取
     * @param {string} src
     * @returns {boolean}
     */
    isInCache(src) {
        return !!this.imageCache[src];
    }
}

// 🧩 建立單例並導出
const preloadManager = new PreloadManager();
export default preloadManager;