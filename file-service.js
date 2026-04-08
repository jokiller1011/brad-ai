// file-service.js
// Fixed image processing for Transformers.js

import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

class FileService {
    constructor() {
        this.imageToTextPipeline = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        // Use a tiny OCR model
        this.imageToTextPipeline = await pipeline('image-to-text', 'Xenova/trocr-small-handwritten');
        this.isInitialized = true;
    }

    async extractTextFromFile(file) {
        await this.initialize();

        if (file.type.startsWith('image/')) {
            return await this.extractTextFromImage(file);
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            return await this.readTextFile(file);
        } else {
            throw new Error('Unsupported file type. Please upload an image or text file.');
        }
    }

    async extractTextFromImage(imageFile) {
        try {
            // Convert File to data URL which Transformers.js can handle
            const dataUrl = await this.fileToDataURL(imageFile);
            const result = await this.imageToTextPipeline(dataUrl);
            return result[0].generated_text;
        } catch (error) {
            console.error('OCR error:', error);
            throw new Error('Could not read text from image. Try a clearer picture.');
        }
    }

    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsText(file);
        });
    }

    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

export const fileService = new FileService();
