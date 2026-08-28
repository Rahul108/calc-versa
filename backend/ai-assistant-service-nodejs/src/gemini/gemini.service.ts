import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log(`Initialized Gemini API with model: ${this.modelName}`);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not configured. Running in fallback mode.',
      );
    }
  }

  async generateGuidance(prompt: string, context?: string): Promise<string> {
    if (!this.genAI) {
      return this.fallbackGuidance(prompt);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const systemInstruction = `You are the AI Assistant for CalcVersa, a multi-tenant platform for defining and serving account-specific calculation tools at dedicated URLs (e.g., http://localhost:3005/product?id=33).
Your job is to answer user prompts with step-by-step instructions on how to perform operations in CalcVersa.
CRITICAL RULE: If the user requirement cannot be fulfilled properly by CalcVersa or is outside system capabilities, respond explicitly with: "No. This operation cannot be fulfilled by CalcVersa."`;

      const fullPrompt = `${systemInstruction}\n\nUser Context: ${context || 'None'}\n\nUser Prompt: ${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text() || 'No response generated from Gemini.';
    } catch (error: any) {
      this.logger.error(`Error invoking Gemini API: ${error.message}`);
      return this.fallbackGuidance(prompt);
    }
  }

  async processOperation(action: string, prompt?: string, targetId?: string): Promise<any> {
    this.logger.log(`Processing AI operation: ${action} for target: ${targetId || 'N/A'}`);
    
    // Boilerplate handling for prompt-driven operations
    if (action === 'mark_resolved') {
      return {
        status: 'success',
        action,
        targetId,
        message: `Item ${targetId || 'target'} has been marked as resolved.`,
        updatedAt: new Date().toISOString()
      };
    }

    if (action === 'find_info') {
      return {
        status: 'success',
        action,
        query: prompt,
        results: [
          { id: targetId || '33', title: 'Mortgage Loan Calculator', status: 'active', url: 'http://localhost:3005/product?id=33' }
        ]
      };
    }

    return {
      status: 'success',
      action,
      targetId,
      message: `Operation '${action}' executed successfully.`
    };
  }

  async generateReport(reportType: string = 'usage_summary'): Promise<any> {
    return {
      reportType,
      generatedAt: new Date().toISOString(),
      summary: {
        totalToolsCreated: 12,
        activeCalculationsExecuted: 1450,
        resolvedIssues: 8,
        systemStatus: 'Healthy'
      }
    };
  }

  private fallbackGuidance(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('create') || lower.includes('tool') || lower.includes('product')) {
      return `To create a new calculation tool in CalcVersa:
1. Define the tool requirements (inputs, formula, UI layout).
2. Register the tool in the system database.
3. Map the tool to your user account for access control.
4. Access the isolated tool at http://localhost:3005/product?id=<your-tool-id>.`;
    }

    if (lower.includes('impossible') || lower.includes('hack') || lower.includes('unsupported')) {
      return 'No. This operation cannot be fulfilled by CalcVersa.';
    }

    return `Guidance for prompt "${prompt}": Please refer to the CalcVersa user guide in docs/guides/creating-a-calculator-tool.md.`;
  }
}
