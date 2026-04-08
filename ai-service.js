// ai-service.js
// Optimized with verified models, preloading, and proper identity system prompt

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Reduce console noise
env.backends.onnx.logLevel = 'error';

// Default system prompt that defines Brad AI's identity
const BRAD_SYSTEM_PROMPT = `You are Brad AI, a private, on-device artificial intelligence assistant created by Brad. 
You are helpful, professional, and concise. 
You do not pretend to be human or have a personal life. 
You are an AI running directly in the user's browser, ensuring complete privacy.
If asked about yourself, state that you are Brad AI, a local AI assistant.`;

class AIService {
    constructor() {
        this.activeModel = null;
        this.modelType = null;
        this.isLoading = false;
        this.trainingEnabled = false; // placeholder for future training toggle
    }

    setTrainingEnabled(enabled) {
        this.trainingEnabled = enabled;
        console.log('Training mode:', enabled ? 'ON' : 'OFF');
    }

    async loadModel(modelType, onProgress) {
        if (this.isLoading) return;
        if (this.modelType === modelType && this.activeModel) {
            if (onProgress) onProgress({ status: 'ready', progress: 100 });
            return this.activeModel;
        }

        this.isLoading = true;
        this.modelType = modelType;

        // Reliable, verified models from Xenova that are known to work well
        const modelIdMap = {
            swift: 'Xenova/gpt2',            // Fast and reliable
            spark: 'Xenova/distilgpt2',      // Lightweight and balanced
            fleet: 'Xenova/Qwen1.5-0.5B-Chat' // Modern and powerful
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
            console.log(`${modelType} model loaded successfully.`);
            if (onProgress) onProgress({ status: 'ready', progress: 100, message: `${modelType} model ready.` });
            return this.activeModel;

        } catch (error) {
            this.isLoading = false;
            console.error(`Failed to load ${modelType}:`, error);
            if (onProgress) onProgress({ status: 'error', progress: 0, message: error.message });
            throw error;
        }
    }

    async generateResponse(prompt, customSystemPrompt = null, onToken) {
        if (!this.activeModel) throw new Error('No model loaded.');

        const systemPrompt = customSystemPrompt || BRAD_SYSTEM_PROMPT;

        // Format prompt with proper instruction template for chat models
        let fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`;

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
        if (generated.startsWith(fullPrompt)) {
            generated = generated.slice(fullPrompt.length).trim();
        }
        
        // Placeholder: if training enabled, we could log the interaction for future fine-tuning
        if (this.trainingEnabled) {
            console.log('[Training] Interaction:', { prompt, response: generated });
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
