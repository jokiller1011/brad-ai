// ai-service.js

const BRAD_SYSTEM_PROMPT = `You are Brad AI, a helpful, private, and professional AI assistant. 
You answer questions clearly and concisely. You do not ramble or pretend to be human.`;

const modelIdMap = {
    swift: 'Xenova/Qwen2.5-0.5B-Instruct',   // ✅ Instruct version
    spark: 'Xenova/gpt2',                     // ⚠️ This is a base model – avoid
    fleet: 'Xenova/Qwen1.5-0.5B-Chat'         // ✅ Chat version
};

// In generateResponse function, format the prompt like this:
async generateResponse(prompt, customSystemPrompt = null, onToken) {
    const systemPrompt = customSystemPrompt || BRAD_SYSTEM_PROMPT;
    
    // ✅ Apply chat template (this is the key part!)
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
    ];
    
    // Use the tokenizer's built-in chat template
    const fullPrompt = this.activeModel.tokenizer.apply_chat_template(
        messages, 
        { add_generation_prompt: true, tokenize: false }
    );
    
    // ... rest of generation code
}
