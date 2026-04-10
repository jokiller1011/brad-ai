// ai-service.js
// Local models with correct chat formatting for Transformers.js

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

env.backends.onnx.logLevel = 'error';

const BRAD_SYSTEM_PROMPT = `You are Brad AI, a private, on-device artificial intelligence assistant.
You are helpful, professional, and concise.
You do not pretend to be human or have a personal life.
If asked about yourself, state that you are Brad AI, a local AI assistant running in the browser.`;

class AIService {
    constructor() {
        this.activeModel = null;
        this.modelType = null;
        this.isLoading = false;
        this.trainingEnabled = false;
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

        // Use instruction-tuned models only
        const modelIdMap = {
            swift: 'Xenova/Qwen2.5-0.5B-Instruct',    // Fast instruct model
            spark: 'Xenova/Qwen2.5-1.5B-Instruct',    // Balanced instruct model
            fleet: 'Xenova/Qwen1.5-0.5B-Chat'         // Chat-optimized
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
            console.error(`Failed to load ${modelType}:`, error);
            if (onProgress) onProgress({ status: 'error', progress: 0, message: error.message });
            throw error;
        }
    }

    async generateResponse(prompt, customSystemPrompt = null, onToken) {
        if (!this.activeModel) throw new Error('No model loaded.');

        const systemPrompt = customSystemPrompt || BRAD_SYSTEM_PROMPT;

        // ✅ Apply proper chat template
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];

        let fullPrompt;
        try {
            // Use tokenizer's built-in chat template if available
            fullPrompt = this.activeModel.tokenizer.apply_chat_template(
                messages,
                { add_generation_prompt: true, tokenize: false }
            );
        } catch (e) {
            // Fallback for models without chat template
            fullPrompt = `<|system|>\n${systemPrompt}\n<|user|>\n${prompt}\n<|assistant|>\n`;
        }

        const result = await this.activeModel(fullPrompt, {
            max_new_tokens: 512,
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
        // Strip the prompt from the output
        if (generated.startsWith(fullPrompt)) {
            generated = generated.slice(fullPrompt.length).trim();
        }
        
        // Remove any trailing end-of-text tokens
        generated = generated.replace(/<\|endoftext\|>/g, '').trim();
        
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
