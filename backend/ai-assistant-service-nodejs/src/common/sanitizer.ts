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
  // Whole-word matches only, so legitimate variable names such as
  // `important_rate` or `cost_constructor_fee` are not rejected.
  const forbiddenPatterns = [
    /\beval\s*\(/i,
    /\bfunction\b/i,
    /\bimport\b/i,
    /\brequire\s*\(/i,
    /\bprocess\./i,
    /\bglobal(This)?\./i,
    /\bwindow\./i,
    /\bdocument\./i,
    /<script/i,
    /\bexec\s*\(/i,
    /\bsystem\s*\(/i,
    /__proto__/i,
    /\bconstructor\b/i,
    /\bprototype\b/i,
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
