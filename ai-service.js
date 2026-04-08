// ai-service.js
// Uses models confirmed to work with Transformers.js

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.localModelPath = '/models/';
env.allowLocalModels = false;

class AIService {
    constructor() {
        this.activeModel = null;
        this.modelType = null;
        this.isLoading = false;
    }

    async loadModel(modelType, onProgress) {
        if (this.isLoading) return;
        if (this.modelType === modelType && this.activeModel) {
            if (onProgress) onProgress({ status: 'ready', progress: 100 });
            return this.activeModel;
        }

        this.isLoading = true;
        this.modelType = modelType;

        // Use models that are verified to work with Transformers.js
        const modelIdMap = {
            swift: 'Xenova/LaMini-Flan-T5-77M',        // Fast, small, reliable
            spark: 'Xenova/gpt2',                       // Balanced, 124M
            fleet: 'Xenova/t5-small'                    // More capable, 60M
        };
        const modelId = modelIdMap[modelType];

        try {
            if (onProgress) onProgress({ status: 'loading', progress: 0, message: `Loading ${modelType} model...` });

            this.activeModel = await pipeline('text-generation', modelId, {
                device: 'webgpu',
                progress_callback: (progress) => {
                    if (onProgress && progress.total) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        onProgress({
                            status: 'loading',
                            progress: percent,
                            message: `Downloading ${modelType}: ${percent}%`
                        });
                    }
                }
            });
            
            this.isLoading = false;
            if (onProgress) onProgress({ status: 'ready', progress: 100, message: `${modelType} model ready.` });
            return this.activeModel;

        } catch (error) {
            this.isLoading = false;
            if (onProgress) onProgress({ status: 'error', progress: 0, message: error.message });
            throw error;
        }
    }

    async generateResponse(prompt, systemPrompt = null, onToken) {
        if (!this.activeModel) throw new Error('No model loaded.');

        let fullPrompt = prompt;
        if (systemPrompt) {
            fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`;
        } else {
            fullPrompt = `User: ${prompt}\nAssistant:`;
        }

        const result = await this.activeModel(fullPrompt, {
            max_new_tokens: 256,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.1,
            do_sample: true,
            callback_function: (beams) => {
                if (onToken && beams[0].output_token_ids) {
                    const token = this.activeModel.tokenizer.decode([beams[0].output_token_ids.at(-1)]);
                    onToken(token);
                }
            }
        });
        
        let generated = result[0].generated_text;
        // Remove the prompt from the output if present
        if (generated.startsWith(fullPrompt)) {
            generated = generated.slice(fullPrompt.length).trim();
        }
        return generated;
    }

    getCurrentModelType() { return this.modelType; }
    isModelReady() { return this.activeModel !== null; }
    async unloadModel() {
        if (this.activeModel) {
            await this.activeModel.dispose();
            this.activeModel = null;
            this.modelType = null;
        }
    }
}

export const aiService = new AIService();
