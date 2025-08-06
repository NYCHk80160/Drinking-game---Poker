/**
 * Image Preload Manager
 * 
 * A utility for efficiently preloading and caching images for the poker game
 */

class PreloadManager {
    constructor() {
        this.imageCache = {};
        this.isPreloading = false;
        this.queue = [];
        this.processed = 0;
        this.total = 0;
    }

    /**
     * Preload a single image and store in cache
     * @param {string} src - Image source URL
     * @returns {Promise} - Promise that resolves when image is loaded
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
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    /**
     * Add images to the preload queue
     * @param {Array<string>} images - Array of image URLs to preload
     */
    addToQueue(images) {
        this.queue = [...this.queue, ...images];
        this.total = this.queue.length;
    }

    /**
     * Process the preload queue during browser idle time
     * @param {number} chunkSize - Number of images to load per idle callback
     */
    processQueue(chunkSize = 3) {
        if (this.isPreloading || this.queue.length === 0) {
            return;
        }

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
                console.log(`Preloading complete: ${this.processed}/${this.total} images loaded`);
            }
        };

        requestIdleCallback(processChunk, { timeout: 1000 });
    }

    /**
     * Get an image from the cache if available
     * @param {string} src - Image source URL
     * @returns {HTMLImageElement|null} - Cached image or null
     */
    getFromCache(src) {
        return this.imageCache[src] || null;
    }

    /**
     * Check if an image is in the cache
     * @param {string} src - Image source URL
     * @returns {boolean} - True if image is cached
     */
    isInCache(src) {
        return !!this.imageCache[src];
    }
}

// Create singleton instance
const preloadManager = new PreloadManager();

// Export for use in main script
export default preloadManager;
