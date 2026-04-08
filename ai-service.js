// ai-service.js
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

        const modelIdMap = {
            swift: 'HuggingFaceTB/SmolLM2-135M-Instruct',
            spark: 'google/gemma-2-2b-it',
            fleet: 'Qwen/Qwen2.5-7B-Instruct'
        };
        const modelId = modelIdMap[modelType];

        try {
            if (onProgress) onProgress({ status: 'loading', progress: 0, message: `Starting download for ${modelType}...` });

            this.activeModel = await pipeline('text-generation', modelId, {
                device: 'webgpu',
                progress_callback: (progress) => {
                    if (onProgress) {
                        const totalProgress = progress.loaded / progress.total * 100;
                        onProgress({
                            status: 'loading',
                            progress: Math.round(totalProgress),
                            message: `Downloading ${modelType}: ${Math.round(totalProgress)}%`
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

        let fullPrompt = '';
        if (systemPrompt) fullPrompt += `<|system|>\n${systemPrompt}\n<|end|>\n`;
        fullPrompt += `<|user|>\n${prompt}\n<|end|>\n<|assistant|>\n`;

        const result = await this.activeModel(fullPrompt, {
            max_new_tokens: 512,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.15,
            do_sample: true,
            callback_function: (beams) => {
                if (onToken) {
                    const token = this.activeModel.tokenizer.decode(beams[0].output_token_ids);
                    onToken(token);
                }
            }
        });
        
        return result[0].generated_text;
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
