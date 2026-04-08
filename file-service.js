// file-service.js
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

class FileService {
    constructor() {
        this.imageToTextPipeline = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        this.imageToTextPipeline = await pipeline('image-to-text', 'Xenova/trocr-small-printed');
        this.isInitialized = true;
    }

    async extractTextFromFile(file) {
        await this.initialize();
        if (file.type.startsWith('image/')) {
            return await this.extractTextFromImage(file);
        } else if (file.type === 'text/plain') {
            return await this.readTextFile(file);
        } else {
            throw new Error('Unsupported file type. Upload an image or text file.');
        }
    }

    async extractTextFromImage(imageFile) {
        const result = await this.imageToTextPipeline(await this.fileToImageData(imageFile));
        return result[0].generated_text;
    }

    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsText(file);
        });
    }

    fileToImageData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

export const fileService = new FileService();
