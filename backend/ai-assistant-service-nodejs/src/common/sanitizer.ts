import { BadRequestException } from '@nestjs/common';

/**
 * Formula Expression Sanitizer & Security Guardrail
 * Validates mathematical expressions to block code injection, eval attempts, or unsafe syntax.
 */
export function sanitizeFormulaExpression(expr: string): string {
  if (!expr || typeof expr !== 'string') {
    throw new BadRequestException('Formula expression must be a non-empty string');
  }

  const trimmed = expr.trim();

  // Dangerous code injection patterns
  const forbiddenPatterns = [
    /eval\s*\(/i,
    /function\s*\(/i,
    /import\s*/i,
    /require\s*\(/i,
    /process\./i,
    /global\./i,
    /window\./i,
    /document\./i,
    /<script/i,
    /exec\s*\(/i,
    /system\s*\(/i,
    /__proto__/i,
    /constructor/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(trimmed)) {
      throw new BadRequestException(`Malicious expression pattern detected: "${expr}"`);
    }
  }

  // Whitelist check: Only allow alphanumeric characters, underscores, spaces, math operators, parentheses, and dots
  const validMathRegex = /^[a-zA-Z0-9_\s\+\-\*\/\^\.\(\)\,\%]+$/;
  if (!validMathRegex.test(trimmed)) {
    throw new BadRequestException(`Invalid mathematical characters in expression: "${expr}"`);
  }

  return trimmed;
}
