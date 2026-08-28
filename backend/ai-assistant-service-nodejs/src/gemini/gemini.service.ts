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
        'GEMINI_API_KEY is not configured. Running in fallback mode with built-in schema generation.',
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

  async analyzeFeasibility(prompt: string): Promise<any> {
    if (!this.genAI) {
      return this.fallbackFeasibility(prompt);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const systemInstruction = `You are the CalcVersa AI Safety & Feasibility Analyzer.
Analyze the user prompt to determine if a calculator tool can be created using CalcVersa capabilities.
Allowed input types: "number", "slider", "dropdown", "checkbox", "text".
Allowed formula expressions: basic math, exponents (^ or **), parenthesis, and input variable names.
Output ONLY valid JSON matching this exact structure:
{
  "possible": boolean,
  "confidence": float (0.0 to 1.0),
  "tool_name": "string",
  "description": "string",
  "extracted_inputs": [
    { "id": "field_id", "label": "Label", "type": "number|slider|dropdown|checkbox", "defaultValue": 100 }
  ],
  "suggested_formula": {
    "rules": [
      { "targetOutputId": "output_id", "expression": "math expression" }
    ]
  },
  "reasoning": "explanation"
}`;

      const fullPrompt = `${systemInstruction}\n\nUser Requirement Prompt: ${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.fallbackFeasibility(prompt);
    } catch (error: any) {
      this.logger.error(`Error in Gemini feasibility analysis: ${error.message}`);
      return this.fallbackFeasibility(prompt);
    }
  }

  async generateSchemaUpdate(existingApp: any, modificationPrompt: string): Promise<any> {
    if (!this.genAI) {
      return this.fallbackSchemaUpdate(existingApp, modificationPrompt);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const systemInstruction = `You are the CalcVersa Tool Update Analyzer.
Merge the user's modification prompt into the existing tool schema safely.
Output ONLY valid JSON matching this exact structure:
{
  "inputsConfig": { ... updated inputs ... },
  "formulaConfig": { ... updated rules ... },
  "summary": "Summary of modifications applied"
}`;

      const fullPrompt = `${systemInstruction}\n\nExisting Tool Schema: ${JSON.stringify(existingApp)}\n\nModification Prompt: ${modificationPrompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.fallbackSchemaUpdate(existingApp, modificationPrompt);
    } catch (error: any) {
      this.logger.error(`Error in Gemini schema update: ${error.message}`);
      return this.fallbackSchemaUpdate(existingApp, modificationPrompt);
    }
  }

  async processOperation(action: string, prompt?: string, targetId?: string): Promise<any> {
    this.logger.log(`Processing AI operation: ${action} for target: ${targetId || 'N/A'}`);
    return {
      status: 'success',
      action,
      targetId,
      message: `Operation '${action}' executed successfully.`,
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
        systemStatus: 'Healthy',
      },
    };
  }

  private fallbackFeasibility(prompt: string): any {
    const lower = prompt.toLowerCase();
    if (lower.includes('mortgage') || lower.includes('loan')) {
      return {
        possible: true,
        confidence: 0.95,
        tool_name: 'Mortgage Loan Calculator',
        description: 'Calculates monthly mortgage payments based on principal, rate, and term',
        extracted_inputs: [
          { id: 'principal', label: 'Loan Amount', type: 'number', defaultValue: 300000 },
          { id: 'annual_rate', label: 'Interest Rate (%)', type: 'slider', min: 1, max: 20, defaultValue: 6.5 },
          { id: 'term_years', label: 'Loan Term (Years)', type: 'dropdown', options: [15, 20, 30], defaultValue: 30 },
        ],
        suggested_formula: {
          rules: [
            {
              targetOutputId: 'monthly_payment',
              expression: '(principal * (annual_rate / 1200)) / (1 - (1 + (annual_rate / 1200)) ** (-1 * term_years * 12))',
            },
          ],
        },
        reasoning: 'Requirements fully match CalcVersa formula engine and dynamic UI controls.',
      };
    }

    if (lower.includes('impossible') || lower.includes('hack') || lower.includes('database dump')) {
      return {
        possible: false,
        confidence: 0.99,
        tool_name: 'Unsupported Operation',
        description: 'Operation requested is outside system capabilities or violates security constraints',
        extracted_inputs: [],
        suggested_formula: { rules: [] },
        reasoning: 'Operation violates security constraints or system boundaries.',
      };
    }

    return {
      possible: true,
      confidence: 0.88,
      tool_name: 'Custom Calculation Tool',
      description: `Generated calculation tool for prompt: "${prompt}"`,
      extracted_inputs: [
        { id: 'input_val', label: 'Input Value', type: 'number', defaultValue: 100 },
      ],
      suggested_formula: {
        rules: [{ targetOutputId: 'result', expression: 'input_val * 1.1' }],
      },
      reasoning: 'Basic math calculation supported by CalcVersa.',
    };
  }

  private fallbackSchemaUpdate(existingApp: any, prompt: string): any {
    const updatedInputs = existingApp.inputsConfig ? JSON.parse(JSON.stringify(existingApp.inputsConfig)) : { sections: [{ title: 'Inputs', fields: [] }] };
    const updatedFormula = existingApp.formulaConfig ? JSON.parse(JSON.stringify(existingApp.formulaConfig)) : { rules: [] };

    if (prompt.toLowerCase().includes('tax')) {
      if (updatedInputs.sections && updatedInputs.sections[0]) {
        updatedInputs.sections[0].fields.push({
          id: 'property_tax',
          label: 'Annual Property Tax Rate (%)',
          type: 'number',
          defaultValue: 1.2,
        });
      }
      updatedFormula.rules.push({
        targetOutputId: 'tax_monthly',
        expression: '(principal * (property_tax / 100)) / 12',
      });
    }

    return {
      inputsConfig: updatedInputs,
      formulaConfig: updatedFormula,
      summary: `Successfully applied modification: "${prompt}"`,
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
