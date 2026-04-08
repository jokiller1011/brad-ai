// agent-service.js
import { aiService } from './ai-service.js';

class AgentService {
    constructor() {
        this.agents = new Map();
        this.workflows = new Map();
    }

    registerAgent(name, role, modelType, systemPrompt) {
        this.agents.set(name, { name, role, modelType, systemPrompt });
    }

    defineWorkflow(name, steps) {
        this.workflows.set(name, steps);
    }

    async executeWorkflow(workflowName, userQuery, onProgress) {
        const workflow = this.workflows.get(workflowName);
        if (!workflow) throw new Error(`Workflow '${workflowName}' not found.`);

        let currentInput = userQuery;
        const results = [];

        for (const step of workflow) {
            const agent = this.agents.get(step.agent);
            if (!agent) throw new Error(`Agent '${step.agent}' not found.`);

            if (onProgress) onProgress({ step: step.name, agent: agent.name, status: 'running' });

            if (aiService.getCurrentModelType() !== agent.modelType) {
                await aiService.loadModel(agent.modelType);
            }

            const prompt = step.preparePrompt ? step.preparePrompt(currentInput, results) : currentInput;
            const response = await aiService.generateResponse(prompt, agent.systemPrompt);

            const stepResult = { agent: agent.name, role: agent.role, input: prompt, output: response };
            results.push(stepResult);

            currentInput = step.processOutput ? step.processOutput(response, results) : response;

            if (onProgress) onProgress({ step: step.name, agent: agent.name, status: 'completed' });
        }

        return { workflow: workflowName, results, finalOutput: currentInput };
    }
}

export const agentService = new AgentService();
